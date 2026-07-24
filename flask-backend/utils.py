"""Utility helpers for file I/O and image validation."""
from __future__ import annotations

import io
import uuid
from pathlib import Path
from typing import Tuple

import numpy as np
from PIL import Image, UnidentifiedImageError

from config import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIMETYPES,
    MAX_UPLOAD_BYTES,
    UPLOAD_DIR,
)


class ValidationError(ValueError):
    """Raised when an uploaded file fails validation."""


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def validate_upload(file_storage) -> None:
    if file_storage is None or file_storage.filename == "":
        raise ValidationError("No image uploaded.")

    ext = _extension(file_storage.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported format '.{ext}'. Use JPG, JPEG or PNG."
        )

    if file_storage.mimetype and file_storage.mimetype not in ALLOWED_MIMETYPES:
        raise ValidationError(
            f"Unsupported mime type '{file_storage.mimetype}'."
        )


def save_upload(file_storage) -> Path:
    """Persist the upload to disk after validating its size and decodability."""
    data = file_storage.read()
    if len(data) == 0:
        raise ValidationError("Uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValidationError(
            f"Image too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
        )

    try:
        img = Image.open(io.BytesIO(data))
        img.verify()  # cheap header check
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("Could not decode the image.") from exc

    ext = _extension(file_storage.filename) or "jpg"
    path = UPLOAD_DIR / f"{uuid.uuid4().hex}.{ext}"
    path.write_bytes(data)
    return path


def load_image(path: Path) -> Tuple[Image.Image, np.ndarray]:
    """Load an image both as PIL and as an RGB ndarray."""
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    return img, arr
