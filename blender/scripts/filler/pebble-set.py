# blender/scripts/filler/pebble-set.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

stones = [
    part("ico", "stone_0", loc=(-0.07, -0.03, 0.04), rot=(5, -8, 25),
         scale=(0.085, 0.065, 0.04), token="pal_taupe", subdivisions=1),
    part("ico", "stone_1", loc=(0.07, -0.01, 0.035), rot=(-4, 6, -15),
         scale=(0.08, 0.06, 0.035), token="pal_sand", subdivisions=1),
    part("ico", "stone_2", loc=(0.01, 0.06, 0.03), rot=(8, 12, 45),
         scale=(0.065, 0.055, 0.03), token="pal_taupe", subdivisions=1),
]

mesh = join_into_one(stones, "pebble-set")
ground_mesh(mesh)
apply_all()

export("public/models/filler/pebble-set.glb", "blender/previews/pebble-set.png", dist=0.8)
