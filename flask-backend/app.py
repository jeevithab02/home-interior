"""Flask entrypoint for the AI Interior Designer backend."""
from __future__ import annotations

import base64
import logging


from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from classifier import get_classifier
from config import (
    HOST,
    OUTPUT_DIR,
    PORT,
    SUPPORTED_ROOMS,
    SUPPORTED_STYLES,
    ensure_dirs,
)
from designer import get_designer
from utils import ValidationError, load_image, save_upload, validate_upload


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("ai-interior-designer")


def create_app() -> Flask:
    ensure_dirs()
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Warm up the classifier + designer. SDXL loads lazily on first /generate.
    get_classifier()
    get_designer()

    @app.get("/")
    def index():
        return jsonify(
            {
                "service": "AI Interior Designer",
                "version": "2.0.0",
                "endpoints": ["/health", "/predict", "/generate", "/outputs/<file>"],
                "supported_rooms": SUPPORTED_ROOMS,
                "supported_styles": SUPPORTED_STYLES,
            }
        )

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.post("/predict")
    def predict():
        try:
            file = request.files.get("image")
            style = (request.form.get("style") or "").strip()

            validate_upload(file)

            if style not in SUPPORTED_STYLES:
                raise ValidationError(
                    f"Unsupported style. Choose one of: {', '.join(SUPPORTED_STYLES)}."
                )

            path = save_upload(file)
            img, _ = load_image(path)

            prediction = get_classifier().classify(img)
            brief = get_designer().generate(prediction.room_type, style)

            log.info(
                "Predicted %s (%.2f) for style=%s file=%s",
                prediction.room_type,
                prediction.confidence,
                style,
                path.name,
            )

            return jsonify(
                {
                    "room_type": prediction.room_type,
                    "confidence": prediction.confidence,
                    "style": style,
                    "recommendations": brief.recommendations,
                    "color_palette": brief.color_palette,
                    "lighting": brief.lighting,
                    "furniture": brief.furniture,
                }
            )
        except ValidationError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:  # noqa: BLE001
            log.exception("Prediction failed")
            return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    @app.post("/generate")
    def generate():
        """Generate SDXL redesign variations. multipart/form-data:
        image (file), style (str), variations (int, 1-3, default 3),
        strength (float, 0.3-0.8, default 0.55), extra_prompt (str, optional).
        Returns JSON with base64 images and public output URLs.
        """
        try:
            from generator import get_generator  # Lazy import — heavy deps

            file = request.files.get("image")
            style = (request.form.get("style") or "").strip()
            variations = max(1, min(3, int(request.form.get("variations") or 3)))
            strength = float(request.form.get("strength") or 0.55)
            extra_prompt = request.form.get("extra_prompt") or ""

            validate_upload(file)
            if style not in SUPPORTED_STYLES:
                raise ValidationError(
                    f"Unsupported style. Choose one of: {', '.join(SUPPORTED_STYLES)}."
                )

            path = save_upload(file)
            img, _ = load_image(path)

            gen = get_generator()
            outputs = []
            variation_modifiers = [
                "warm golden-hour natural light, cozy",
                "cool overcast daylight, editorial wide-angle",
                "evening ambient lamps and accent lighting, cinematic",
            ]
            for i in range(variations):
                extra = f"{extra_prompt} {variation_modifiers[i]}".strip()
                result = gen.generate(
                    image=img,
                    style=style,
                    extra_prompt=extra,
                    strength=strength,
                )
                with open(result.output_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                outputs.append(
                    {
                        "url": f"/outputs/{result.output_path.name}",
                        "b64": f"data:image/png;base64,{b64}",
                        "seed": result.seed,
                        "prompt": result.prompt,
                    }
                )

            return jsonify({"style": style, "variations": outputs})
        except ValidationError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:  # noqa: BLE001
            log.exception("Generation failed")
            return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    @app.get("/outputs/<path:name>")
    def outputs(name: str):
        return send_from_directory(OUTPUT_DIR, name)

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Image too large."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=False)
