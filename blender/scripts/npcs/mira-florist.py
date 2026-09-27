import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("mira-florist", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_cream",
    "bottom": "pal_sage",
    "shoes": "pal_wood",
    "hair_color": "pal_ink",
    "hair_style": "bun",
    "apron": "pal_leaf",
    "prop": "flower",
})
