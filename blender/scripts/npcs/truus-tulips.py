import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("truus-tulips", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_rose",
    "bottom": "pal_leaf",
    "shoes": "pal_taupe",
    "hair_color": "pal_taupe",
    "hair_style": "bun",
    "prop": "gloves",
})
