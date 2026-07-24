"""AI recommendation module.

Generates a structured design brief (recommendations, palette, lighting,
furniture) based on the classified room type and the selected style.

The recommendations are produced by a curated per-style template so the
module works offline without any external LLM key. Swap
``Designer.generate`` for a Hugging Face Transformers pipeline call to add
LLM-authored copy — the return signature stays the same.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class DesignBrief:
    recommendations: List[str]
    color_palette: List[str]
    lighting: str
    furniture: List[str]


# ---------------------------------------------------------------------------
# Curated per-style palettes and cues
# ---------------------------------------------------------------------------

STYLE_PALETTES: Dict[str, List[str]] = {
    "Modern":       ["#F5F5F5", "#E5E5E5", "#2E2E2E", "#B08D57"],
    "Minimalist":   ["#FFFFFF", "#F5F5F5", "#D6CFC7", "#A89F91"],
    "Scandinavian": ["#F7F5F0", "#E4DFD5", "#C9BFA9", "#4A4A48"],
    "Luxury":       ["#1B1B1B", "#5C4A2E", "#C9A96E", "#F1E9D2"],
    "Industrial":   ["#2B2B2B", "#5A5A5A", "#A69B87", "#D9CBB4"],
    "Bohemian":     ["#EED9B6", "#C97B63", "#7A6A5A", "#3E5641"],
    "Japandi":      ["#EFE9DE", "#C7B79A", "#6B5E4C", "#2F2A26"],
    "Contemporary": ["#F2F2F2", "#DCDCDC", "#4B4B4B", "#4E7A6A"],
}

STYLE_LIGHTING: Dict[str, str] = {
    "Modern": "Layered ambient LED downlights with sculptural pendant lighting.",
    "Minimalist": "Diffused warm LED strips with a single statement pendant.",
    "Scandinavian": "Warm 2700K bulbs, paper lanterns, and generous daylight.",
    "Luxury": "Dimmable chandelier with brass wall sconces and hidden cove lighting.",
    "Industrial": "Exposed Edison bulbs, black metal track lights, matte pendants.",
    "Bohemian": "Rattan pendants, string lights, and clustered floor lamps.",
    "Japandi": "Rice paper shoji-inspired lamps and low, warm ambient light.",
    "Contemporary": "Recessed lighting with adjustable accent spots and a modern pendant.",
}

STYLE_TEXTURES: Dict[str, List[str]] = {
    "Modern": ["polished concrete", "matte lacquer", "leather"],
    "Minimalist": ["light oak", "linen", "cotton"],
    "Scandinavian": ["natural wood", "wool", "sheepskin"],
    "Luxury": ["velvet", "marble", "brass"],
    "Industrial": ["exposed brick", "raw steel", "reclaimed wood"],
    "Bohemian": ["macramé", "rattan", "kilim"],
    "Japandi": ["light oak", "washi paper", "raw linen"],
    "Contemporary": ["brushed metal", "boucle", "smoked glass"],
}


# Room-specific furniture suggestions per style.
ROOM_FURNITURE: Dict[str, Dict[str, List[str]]] = {
    "Bedroom": {
        "Modern": ["Platform bed", "Floating nightstand", "Slim dresser", "Area rug"],
        "Minimalist": ["Low platform bed", "Wooden nightstand", "Floating shelves", "Area rug"],
        "Scandinavian": ["Oak bed frame", "Woven basket", "Sheepskin throw", "Reading chair"],
        "Luxury": ["Velvet headboard", "Mirrored dresser", "Chaise lounge", "Silk rug"],
        "Industrial": ["Steel bed frame", "Reclaimed wood nightstand", "Metal locker", "Leather bench"],
        "Bohemian": ["Rattan headboard", "Vintage kilim rug", "Macramé wall hanging", "Floor cushions"],
        "Japandi": ["Low oak bed", "Tatami mat", "Paper lantern", "Minimal bench"],
        "Contemporary": ["Upholstered bed", "Nightstand pair", "Accent chair", "Statement rug"],
    },
    "Living Room": {
        "Modern": ["Modular sofa", "Sculptural coffee table", "Media console", "Statement rug"],
        "Minimalist": ["Low-profile sofa", "Round coffee table", "Slim floor lamp", "Neutral rug"],
        "Scandinavian": ["Boucle sofa", "Oak coffee table", "Floor lamp", "Wool throw"],
        "Luxury": ["Velvet sofa", "Marble coffee table", "Gold accent chair", "Silk rug"],
        "Industrial": ["Leather sofa", "Iron-and-wood table", "Metal bookshelf", "Vintage rug"],
        "Bohemian": ["Slipcover sofa", "Rattan armchair", "Layered rugs", "Woven pouf"],
        "Japandi": ["Low sofa", "Wabi-sabi ceramic vase", "Oak side table", "Linen curtains"],
        "Contemporary": ["Sectional sofa", "Round ottoman", "Sideboard", "Layered rugs"],
    },
    "Kitchen": {
        "Modern": ["Handleless cabinetry", "Quartz island", "Bar stools", "Undercabinet lighting"],
        "Minimalist": ["Flat-front cabinets", "Butcher block island", "Open shelf", "Simple stools"],
        "Scandinavian": ["Light oak cabinets", "Marble backsplash", "Wooden stools", "Herb planter"],
        "Luxury": ["Marble island", "Brass hardware", "Wine fridge", "Statement pendant"],
        "Industrial": ["Steel shelving", "Reclaimed wood island", "Metal stools", "Concrete counters"],
        "Bohemian": ["Open shelving", "Terracotta tiles", "Woven rug", "Vintage runner"],
        "Japandi": ["Oak cabinetry", "Neutral tile", "Stoneware", "Simple bar stools"],
        "Contemporary": ["Two-tone cabinets", "Quartz counters", "Pendant lights", "Sleek stools"],
    },
    "Bathroom": {
        "Modern": ["Floating vanity", "Frameless mirror", "Rainfall shower", "Ceramic planter"],
        "Minimalist": ["Wall-hung sink", "Round mirror", "Concrete shelf", "Neutral bath mat"],
        "Scandinavian": ["Oak vanity", "Round mirror", "Woven basket", "Linen towels"],
        "Luxury": ["Marble vanity", "Brass fixtures", "Freestanding tub", "Crystal sconce"],
        "Industrial": ["Concrete sink", "Black fixtures", "Metal mirror frame", "Wood shelf"],
        "Bohemian": ["Vintage vanity", "Woven mirror", "Plant stand", "Patterned tile"],
        "Japandi": ["Wooden stool", "Stone basin", "Bamboo mat", "Minimal shelving"],
        "Contemporary": ["Double vanity", "LED mirror", "Glass shower", "Freestanding tub"],
    },
    "Office": {
        "Modern": ["Sit-stand desk", "Ergonomic chair", "Cable-managed monitor arm", "Task lamp"],
        "Minimalist": ["Slim desk", "Neutral chair", "Wall-mounted shelf", "Task lamp"],
        "Scandinavian": ["Oak desk", "Wool rug", "Pendant lamp", "Bookshelf"],
        "Luxury": ["Walnut desk", "Leather chair", "Brass lamp", "Bookcase"],
        "Industrial": ["Steel desk", "Vintage chair", "Iron bookshelf", "Edison lamp"],
        "Bohemian": ["Vintage desk", "Rattan chair", "Layered rug", "Plants gallery"],
        "Japandi": ["Low oak desk", "Simple chair", "Paper lamp", "Wall art"],
        "Contemporary": ["Executive desk", "Task chair", "Floating shelves", "Accent lamp"],
    },
    "Dining Room": {
        "Modern": ["Extendable table", "Molded chairs", "Sideboard", "Pendant light"],
        "Minimalist": ["Oval table", "Slim chairs", "Simple runner", "Ceramic vase"],
        "Scandinavian": ["Round oak table", "Wishbone chairs", "Pendant lamp", "Wool runner"],
        "Luxury": ["Marble table", "Velvet chairs", "Crystal chandelier", "Bar cart"],
        "Industrial": ["Reclaimed wood table", "Metal chairs", "Iron sideboard", "Cage lamp"],
        "Bohemian": ["Live-edge table", "Mixed chairs", "Woven runner", "Ceramic collection"],
        "Japandi": ["Low oak table", "Simple bench", "Paper lantern", "Stoneware set"],
        "Contemporary": ["Rectangular table", "Upholstered chairs", "Sideboard", "Pendant cluster"],
    },
    "Study Room": {
        "Modern": ["Floor-to-ceiling shelves", "Reading chair", "Task lamp", "Area rug"],
        "Minimalist": ["Wall shelves", "Ergonomic chair", "Slim desk", "Neutral rug"],
        "Scandinavian": ["Oak bookcase", "Wool armchair", "Floor lamp", "Wool rug"],
        "Luxury": ["Walnut bookcase", "Leather wingback", "Brass lamp", "Silk rug"],
        "Industrial": ["Metal bookshelf", "Leather chair", "Edison lamp", "Vintage rug"],
        "Bohemian": ["Ladder shelf", "Reading nook", "Layered rug", "Plants"],
        "Japandi": ["Low bookshelf", "Simple armchair", "Paper lamp", "Tatami rug"],
        "Contemporary": ["Modular bookcase", "Accent chair", "Floor lamp", "Statement rug"],
    },
}


class Designer:
    """Generates a design brief. Swap ``generate`` for an LLM-backed version."""

    def generate(self, room_type: str, style: str) -> DesignBrief:
        palette = STYLE_PALETTES.get(style, STYLE_PALETTES["Modern"])
        lighting = STYLE_LIGHTING.get(style, STYLE_LIGHTING["Modern"])
        textures = STYLE_TEXTURES.get(style, STYLE_TEXTURES["Modern"])
        furniture = ROOM_FURNITURE.get(room_type, {}).get(style)
        if not furniture:
            furniture = ["Sofa or seating", "Focal table", "Storage piece", "Area rug"]

        recommendations = _build_recommendations(room_type, style, textures)

        return DesignBrief(
            recommendations=recommendations,
            color_palette=palette,
            lighting=lighting,
            furniture=furniture,
        )


def _build_recommendations(room: str, style: str, textures: List[str]) -> List[str]:
    tex = ", ".join(textures)
    return [
        f"Arrange the {room.lower()} around a clear focal point that anchors the {style.lower()} aesthetic.",
        f"Paint walls in soft, layered neutrals that support the {style.lower()} palette.",
        f"Layer textures — {tex} — to add depth without visual noise.",
        f"Use a mix of ambient, task and accent lighting to shape mood at every hour.",
        f"Introduce two or three sculptural accessories rather than many small pieces.",
        f"Add greenery scaled to the room — a large statement plant or a trio of smaller ones.",
        f"Optimize space with concealed storage that keeps sight lines calm.",
        f"Finish with a rug that ties the palette together and defines the zone.",
    ]


_designer: Designer | None = None


def get_designer() -> Designer:
    global _designer
    if _designer is None:
        _designer = Designer()
    return _designer
