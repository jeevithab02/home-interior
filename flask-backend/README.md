# Flask backend — AI Interior Designer

A complete Python Flask + PyTorch + Hugging Face Transformers backend that
mirrors the JSON contract of the Lovable-hosted server function used by the
frontend. Run this locally to serve `/predict` yourself.

## Requirements

- Python 3.10+
- pip 23+
- ~2 GB free disk for pretrained ResNet-50 weights (first run only)

## Install & run

```bash
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The server binds to `http://localhost:5000` by default. First launch
downloads model weights into `models/` and caches them.

## Configuration (env vars)

| Variable        | Default          | Purpose                        |
|-----------------|------------------|--------------------------------|
| `HOST`          | `0.0.0.0`        | Bind host                      |
| `PORT`          | `5000`           | Bind port                      |
| `UPLOAD_DIR`    | `uploads`        | Uploaded image storage         |
| `OUTPUT_DIR`    | `outputs`        | Reserved for Day 2 SD outputs  |
| `MODEL_DIR`     | `models`         | Torch / HF weight cache        |
| `MAX_UPLOAD_MB` | `10`             | Max upload size                |
| `DEVICE`        | `auto`           | `cuda`, `cpu`, or `auto`       |

## API

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /predict` — `multipart/form-data`

| Field   | Type   | Description                                              |
|---------|--------|----------------------------------------------------------|
| `image` | file   | Room photo (jpg/jpeg/png, ≤ 10 MB)                       |
| `style` | string | One of the 8 supported design styles                     |

Response (200):

```json
{
  "room_type": "Bedroom",
  "confidence": 0.94,
  "style": "Minimalist",
  "recommendations": ["...", "...", "...", "...", "..."],
  "color_palette": ["#F5F5F5", "#D6CFC7", "#A89F91"],
  "lighting": "Warm LED ambient lighting",
  "furniture": ["Wooden nightstand", "Floating shelves", "Area rug"]
}
```

Error responses:

- `400` — `{ "error": "..." }` on validation failure (unsupported format,
  missing image, invalid style, too large)
- `500` — `{ "error": "Internal server error", "detail": "..." }`

## Architecture

- `app.py` — Flask routes and error handling
- `classifier.py` — modular PyTorch room classifier (ResNet-50 → 7 rooms)
- `designer.py` — style-aware design brief generation
- `utils.py` — image + upload validation
- `config.py` — env-driven configuration

The classifier is intentionally decoupled: replace `RoomClassifier` with a
fine-tuned CNN and no other module has to change.

## Day 2 hook (Stable Diffusion)

`outputs/` is reserved for generated renders. Add a `generator.py` module
implementing `Generator.generate(image, prompt) -> Path`, wire it into a
new `/generate` route in `app.py`, and the frontend can consume it the same
way it consumes `/predict` today.

## Connecting the frontend

Set the frontend's design endpoint to `http://localhost:5000/predict` and
send `image` + `style` as `multipart/form-data`. The JSON response matches
the frontend's `DesignResult` type exactly.
