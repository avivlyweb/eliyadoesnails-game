import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from _npc_base import build_npc

build_npc("joon-barista", {
    "scale": 1.0,
    "skin": "pal_sand",
    "top": "pal_cream",
    "bottom": "pal_taupe",
    "shoes": "pal_ink",
    "hair_color": "pal_ink",
    "hair_style": "glasses",
    "apron": "pal_ink",
})
