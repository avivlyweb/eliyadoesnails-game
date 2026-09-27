# blender/scripts/filler/cobble-edge-stone.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

# Single rounded kerb stone: length 0.25m, width 0.14m, height 0.12m
stone = part("cube", "cobble-edge-stone", loc=(0, 0, 0.06), scale=(0.125, 0.07, 0.06),
             token="pal_taupe", bevel=0.018)

# Use 1 segment bevel to stay under 60 triangles
mod = stone.modifiers.get("Bevel")
if mod:
    mod.segments = 1

mesh = join_into_one([stone], "cobble-edge-stone")
ground_mesh(mesh)
apply_all()

export("public/models/filler/cobble-edge-stone.glb", "blender/previews/cobble-edge-stone.png", dist=0.7)
