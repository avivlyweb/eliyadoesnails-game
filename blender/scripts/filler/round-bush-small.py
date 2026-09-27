# blender/scripts/filler/round-bush-small.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

spheres = [
    part("ico", "bush_center", loc=(0.0, 0.0, 0.30), scale=(0.28, 0.28, 0.29),
         token="pal_leaf", subdivisions=1),
    part("ico", "bush_side_1", loc=(0.11, 0.07, 0.24), scale=(0.22, 0.22, 0.22),
         token="pal_sage", subdivisions=1),
    part("ico", "bush_side_2", loc=(-0.10, 0.06, 0.22), scale=(0.21, 0.21, 0.21),
         token="pal_leaf", subdivisions=1),
    part("ico", "bush_side_3", loc=(0.02, -0.11, 0.23), scale=(0.22, 0.22, 0.22),
         token="pal_leaf", subdivisions=1),
]

mesh = join_into_one(spheres, "round-bush-small")
ground_mesh(mesh)
apply_all()

export("public/models/filler/round-bush-small.glb", "blender/previews/round-bush-small.png", dist=1.4)
