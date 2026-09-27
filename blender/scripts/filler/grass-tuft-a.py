# blender/scripts/filler/grass-tuft-a.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

# 7 tapered grass blades with varying heights and tilts, alternating 2 greens
blade_params = [
    # (loc, rot, scale, token)
    ((0.00,  0.00, 0.15), ( 4,  2,   0), (1.0, 0.6, 1.00), "pal_grass"),
    ((0.03,  0.02, 0.14), ( 8,  6,  40), (0.9, 0.5, 0.93), "pal_leaf"),
    ((-0.03, 0.01, 0.13), (-7,  4, -50), (0.8, 0.5, 0.88), "pal_grass"),
    ((0.01, -0.03, 0.14), ( 5, -8, 110), (0.9, 0.5, 0.92), "pal_leaf"),
    ((-0.02,-0.02, 0.12), (-9, -6,-130), (0.8, 0.5, 0.82), "pal_grass"),
    ((0.04, -0.01, 0.11), (12, -3,  80), (0.7, 0.5, 0.75), "pal_leaf"),
    ((-0.04, 0.02, 0.12), (-11, 7, -80), (0.7, 0.5, 0.80), "pal_grass"),
]

blades = []
for i, (loc, rot, scale, token) in enumerate(blade_params):
    b = part("cone", f"blade_{i}", loc=loc, rot=rot, scale=scale, token=token,
             radius1=0.018, radius2=0.001, depth=0.30, vertices=4)
    blades.append(b)

mesh = join_into_one(blades, "grass-tuft-a")
ground_mesh(mesh)
apply_all()

export("public/models/filler/grass-tuft-a.glb", "blender/previews/grass-tuft-a.png", dist=0.8)
