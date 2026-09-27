import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("nell-potter", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_taupe",
    "bottom": "pal_terracotta",
    "shoes": "pal_wood",
    "hair_color": "pal_ink",
    "hair_style": "short",
    "apron": "pal_terracotta",
})
