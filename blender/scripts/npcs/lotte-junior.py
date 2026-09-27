import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("lotte-junior", {
    "scale": 0.75,
    "skin": "pal_sand",
    "top": "pal_butter",
    "bottom": "pal_mint",
    "shoes": "pal_rose",
    "hair_color": "pal_wood",
    "hair_style": "pigtails",
    "prop": "backpack",
})
