"""Application configuration loaded from environment variables."""
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5000"))

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", BASE_DIR / "outputs"))
MODEL_DIR = Path(os.environ.get("MODEL_DIR", BASE_DIR / "models"))

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
ALLOWED_MIMETYPES = {"image/jpeg", "image/jpg", "image/png"}

SUPPORTED_STYLES = [
    "Modern",
    "Minimalist",
    "Scandinavian",
    "Luxury",
    "Industrial",
    "Bohemian",
    "Japandi",
    "Contemporary",
]

SUPPORTED_ROOMS = [
    "Bedroom",
    "Living Room",
    "Kitchen",
    "Bathroom",
    "Office",
    "Dining Room",
    "Study Room",
]

DEVICE = os.environ.get("DEVICE", "auto")


def ensure_dirs() -> None:
    for d in (UPLOAD_DIR, OUTPUT_DIR, MODEL_DIR):
        d.mkdir(parents=True, exist_ok=True)
