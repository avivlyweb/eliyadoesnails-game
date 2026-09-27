# blender/scripts/filler/grass-tuft-c.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

blade_params = [
    (( 0.00,  0.00, 0.155), ( 3, -2,   0), (1.0, 0.6, 1.02), "pal_grass"),
    (( 0.02,  0.03, 0.14),  (-6,  9,  45), (0.9, 0.5, 0.94), "pal_leaf"),
    ((-0.03,  0.02, 0.13),  ( 9,  7, -40), (0.85, 0.5, 0.88), "pal_grass"),
    (( 0.03, -0.02, 0.14),  ( 7, -8,  90), (0.9, 0.55, 0.91), "pal_leaf"),
    ((-0.03, -0.02, 0.13),  (-8, -8,-100), (0.85, 0.5, 0.85), "pal_grass"),
    (( 0.00,  0.04, 0.12),  (-11, 2,  30), (0.75, 0.45, 0.80), "pal_leaf"),
    ((-0.04,  0.00, 0.12),  ( 2,-12, -75), (0.8, 0.5, 0.78), "pal_grass"),
    (( 0.02, -0.04, 0.11),  (10, -5, 130), (0.7, 0.45, 0.74), "pal_leaf"),
]

blades = []
for i, (loc, rot, scale, token) in enumerate(blade_params):
    b = part("cone", f"blade_{i}", loc=loc, rot=rot, scale=scale, token=token,
             radius1=0.017, radius2=0.001, depth=0.30, vertices=4)
    blades.append(b)

mesh = join_into_one(blades, "grass-tuft-c")
ground_mesh(mesh)
apply_all()

export("public/models/filler/grass-tuft-c.glb", "blender/previews/grass-tuft-c.png", dist=0.8)
