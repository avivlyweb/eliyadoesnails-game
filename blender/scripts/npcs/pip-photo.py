import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("pip-photo", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_butter",
    "bottom": "pal_rose",
    "shoes": "pal_ink",
    "hair_color": "pal_wood",
    "hair_style": "short",
    "prop": "camera",
})
