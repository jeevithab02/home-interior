"""Stable Diffusion XL redesign generator (GPU-optimized).

Loaded lazily so `python app.py` remains fast for /predict-only workflows.
Requires: diffusers, accelerate, safetensors, and a CUDA-capable GPU for
usable performance (falls back to CPU with a warning — will be very slow).
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image

from config import DEVICE, MODEL_DIR, OUTPUT_DIR

log = logging.getLogger("generator")

# Default SDXL img2img model. Swap freely if you have a fine-tuned checkpoint.
DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-refiner-1.0"
BASE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"

STYLE_PROMPTS: dict[str, str] = {
    "Modern": "modern interior design, clean lines, neutral base with bold accents",
    "Minimalist": "minimalist interior, uncluttered, soft neutrals, functional",
    "Scandinavian": "scandinavian interior, light woods, warm neutrals, cozy",
    "Luxury": "luxury interior, rich materials, marble, velvet, gold accents, elegant",
    "Industrial": "industrial interior, exposed brick, metal, concrete, raw textures",
    "Bohemian": "bohemian interior, layered textiles, plants, eclectic, warm tones",
    "Japandi": "japandi interior, Japanese minimalism meets Nordic warmth, wabi-sabi",
    "Contemporary": "contemporary interior, current trends, balanced, fresh",
}

NEGATIVE_PROMPT = (
    "low quality, blurry, distorted, deformed, cartoon, drawing, illustration, "
    "text, watermark, low resolution, jpeg artifacts, unrealistic proportions"
)


@dataclass
class RedesignResult:
    output_path: Path
    prompt: str
    style: str
    seed: int


class SDXLGenerator:
    """Lazy-loaded SDXL img2img pipeline."""

    def __init__(self) -> None:
        self._pipe = None
        self._device: Optional[str] = None

    def _resolve_device(self) -> str:
        import torch

        if DEVICE == "cuda":
            return "cuda"
        if DEVICE == "cpu":
            return "cpu"
        return "cuda" if torch.cuda.is_available() else "cpu"

    def _load(self):
        if self._pipe is not None:
            return self._pipe

        import torch
        from diffusers import StableDiffusionXLImg2ImgPipeline

        device = self._resolve_device()
        if device == "cpu":
            log.warning(
                "SDXL will run on CPU — expect several minutes per image. "
                "Set DEVICE=cuda with a compatible GPU for real-time generation."
            )
        dtype = torch.float16 if device == "cuda" else torch.float32

        log.info("Loading SDXL img2img pipeline (%s, %s)…", BASE_MODEL, dtype)
        pipe = StableDiffusionXLImg2ImgPipeline.from_pretrained(
            BASE_MODEL,
            torch_dtype=dtype,
            variant="fp16" if device == "cuda" else None,
            use_safetensors=True,
            cache_dir=str(MODEL_DIR),
        )
        pipe = pipe.to(device)

        # GPU optimizations
        if device == "cuda":
            try:
                pipe.enable_xformers_memory_efficient_attention()
            except Exception:  # noqa: BLE001
                pipe.enable_attention_slicing()
            pipe.enable_vae_slicing()
            pipe.enable_model_cpu_offload()

        self._pipe = pipe
        self._device = device
        return pipe

    def generate(
        self,
        image: Image.Image,
        style: str,
        extra_prompt: str = "",
        strength: float = 0.55,
        guidance_scale: float = 7.5,
        steps: int = 30,
        seed: Optional[int] = None,
    ) -> RedesignResult:
        import torch

        pipe = self._load()
        style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["Contemporary"])
        prompt = (
            f"professional interior photograph, {style_prompt}, "
            f"photorealistic, detailed, magazine quality, natural lighting, 8k. {extra_prompt}"
        ).strip()

        if seed is None:
            seed = int.from_bytes(uuid.uuid4().bytes[:4], "big")
        generator = torch.Generator(device=self._device).manual_seed(seed)

        # Resize to a 1024-friendly size while preserving aspect ratio
        init = image.convert("RGB")
        init.thumbnail((1024, 1024))

        result = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            image=init,
            strength=strength,
            guidance_scale=guidance_scale,
            num_inference_steps=steps,
            generator=generator,
        )
        out_img: Image.Image = result.images[0]

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUTPUT_DIR / f"redesign-{uuid.uuid4().hex[:12]}.png"
        out_img.save(out_path)
        return RedesignResult(
            output_path=out_path, prompt=prompt, style=style, seed=seed
        )


_generator: Optional[SDXLGenerator] = None


def get_generator() -> SDXLGenerator:
    global _generator
    if _generator is None:
        _generator = SDXLGenerator()
    return _generator
