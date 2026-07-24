"""PyTorch room classifier.

Uses a pretrained ImageNet ResNet-50 as a feature extractor, then maps its
top ImageNet predictions to our seven room classes with a lightweight
keyword mapping. This gives sensible predictions out of the box and keeps
the module modular so a fine-tuned interior CNN can replace it later by
simply implementing the same ``RoomClassifier.classify`` signature.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.request import urlopen

import torch
from PIL import Image
from torchvision import models, transforms

from config import DEVICE, MODEL_DIR, SUPPORTED_ROOMS


# Keyword mapping from ImageNet class name substrings -> our room labels.
# Anything not matched falls back to a whole-image top-1 confidence blend.
ROOM_KEYWORDS: Dict[str, List[str]] = {
    "Bedroom": ["bed", "quilt", "pillow", "cradle", "four-poster", "duvet"],
    "Living Room": ["sofa", "couch", "studio couch", "living", "television", "home theater"],
    "Kitchen": [
        "stove",
        "oven",
        "refrigerator",
        "microwave",
        "dishwasher",
        "toaster",
        "kitchen",
        "espresso",
        "frying pan",
        "wok",
    ],
    "Bathroom": ["toilet", "bathtub", "shower", "washbasin", "tub", "sink"],
    "Office": ["desk", "computer", "monitor", "screen", "office", "notebook", "laptop"],
    "Dining Room": ["dining", "dinner", "table", "chair", "restaurant"],
    "Study Room": ["library", "bookshop", "book", "bookcase", "bookshelf"],
}

IMAGENET_LABELS_URL = (
    "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"
)


def _resolve_device(pref: str) -> torch.device:
    if pref == "cuda" or (pref == "auto" and torch.cuda.is_available()):
        return torch.device("cuda")
    return torch.device("cpu")


def _load_imagenet_labels() -> List[str]:
    cache = MODEL_DIR / "imagenet_classes.txt"
    if not cache.exists():
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        with urlopen(IMAGENET_LABELS_URL, timeout=30) as resp:
            cache.write_bytes(resp.read())
    return cache.read_text().splitlines()


@dataclass
class Prediction:
    room_type: str
    confidence: float


class RoomClassifier:
    """Modular room classifier. Swap the model by subclassing this."""

    def __init__(self) -> None:
        self.device = _resolve_device(DEVICE)
        torch.hub.set_dir(str(MODEL_DIR))
        weights = models.ResNet50_Weights.IMAGENET1K_V2
        self.model = models.resnet50(weights=weights).to(self.device).eval()
        self.labels = _load_imagenet_labels()
        self.transform = transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )

    @torch.inference_mode()
    def _forward(self, image: Image.Image) -> torch.Tensor:
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        logits = self.model(tensor)
        return torch.softmax(logits, dim=1).squeeze(0).cpu()

    def classify(self, image: Image.Image) -> Prediction:
        probs = self._forward(image)
        # Aggregate probability mass into each of our room buckets by
        # summing the probabilities of ImageNet classes whose label
        # contains one of the keywords for that room.
        totals = {room: 0.0 for room in SUPPORTED_ROOMS}
        for idx, p in enumerate(probs.tolist()):
            label = self.labels[idx].lower()
            for room, kws in ROOM_KEYWORDS.items():
                if any(kw in label for kw in kws):
                    totals[room] += p

        best_room = max(totals, key=totals.get)
        best_score = totals[best_room]

        if best_score < 1e-3:
            # No strong ImageNet cue — fall back to the closest room by
            # blended similarity with the top-1 label.
            top_prob, top_idx = torch.topk(probs, 1)
            top_label = self.labels[int(top_idx[0])].lower()
            best_room = _fallback_room(top_label)
            confidence = float(top_prob[0]) * 0.6
        else:
            # Normalize into a pseudo-probability across our 7 rooms.
            total_sum = sum(totals.values()) or 1.0
            confidence = float(best_score / total_sum)
            # Guard rails
            confidence = max(0.35, min(0.99, confidence))

        return Prediction(room_type=best_room, confidence=round(confidence, 4))


def _fallback_room(label: str) -> str:
    for room, kws in ROOM_KEYWORDS.items():
        if any(kw in label for kw in kws):
            return room
    return "Living Room"


# Module-level singleton so the model loads once per process.
_classifier: RoomClassifier | None = None


def get_classifier() -> RoomClassifier:
    global _classifier
    if _classifier is None:
        _classifier = RoomClassifier()
    return _classifier


def dump_debug(prediction: Prediction) -> str:
    return json.dumps({"room_type": prediction.room_type, "confidence": prediction.confidence})
