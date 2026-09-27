# blender/scripts/filler/grass-tuft-b.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

blade_params = [
    (( 0.00,  0.00, 0.15), (-5,  3,  20), (1.0, 0.6, 1.00), "pal_grass"),
    ((-0.03,  0.03, 0.13), (12, -8, -30), (0.85, 0.5, 0.90), "pal_leaf"),
    (( 0.04, -0.02, 0.14), (-8, 10,  60), (0.9, 0.55, 0.92), "pal_grass"),
    ((-0.02, -0.03, 0.12), (-10,-10,-120), (0.8, 0.5, 0.80), "pal_leaf"),
    (( 0.03,  0.03, 0.13), ( 7,  8, 140), (0.85, 0.5, 0.86), "pal_grass"),
    (( 0.00, -0.04, 0.11), (-14, 0, 180), (0.75, 0.45, 0.76), "pal_leaf"),
]

blades = []
for i, (loc, rot, scale, token) in enumerate(blade_params):
    b = part("cone", f"blade_{i}", loc=loc, rot=rot, scale=scale, token=token,
             radius1=0.02, radius2=0.001, depth=0.30, vertices=4)
    blades.append(b)

mesh = join_into_one(blades, "grass-tuft-b")
ground_mesh(mesh)
apply_all()

export("public/models/filler/grass-tuft-b.glb", "blender/previews/grass-tuft-b.png", dist=0.8)
