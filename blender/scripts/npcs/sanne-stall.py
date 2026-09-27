import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("sanne-stall", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_mint",
    "bottom": "pal_cream",
    "shoes": "pal_terracotta",
    "hair_color": "pal_wood",
    "hair_style": "headscarf",
    "apron": "pal_sand",
})
