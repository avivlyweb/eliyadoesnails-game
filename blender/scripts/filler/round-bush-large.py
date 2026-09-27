# blender/scripts/filler/round-bush-large.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

spheres = [
    part("ico", "bush_center", loc=(0.0, 0.0, 0.55), scale=(0.52, 0.52, 0.54),
         token="pal_leaf", subdivisions=1),
    part("ico", "bush_side_1", loc=(0.20, 0.14, 0.44), scale=(0.42, 0.42, 0.42),
         token="pal_sage", subdivisions=1),
    part("ico", "bush_side_2", loc=(-0.19, 0.12, 0.41), scale=(0.40, 0.40, 0.40),
         token="pal_leaf", subdivisions=1),
    part("ico", "bush_side_3", loc=(0.04, -0.20, 0.43), scale=(0.42, 0.42, 0.42),
         token="pal_leaf", subdivisions=1),
]

mesh = join_into_one(spheres, "round-bush-large")
ground_mesh(mesh)
apply_all()

export("public/models/filler/round-bush-large.glb", "blender/previews/round-bush-large.png", dist=2.2)
