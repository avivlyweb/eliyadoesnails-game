# blender/scripts/filler/reed-clump.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

parts = []

# Cattail 1 (tallest, reaching 0.80m)
parts.append(part("cyl", "cattail_stem_0", loc=(0.01, 0.01, 0.38), rot=(1, 2, 0),
                  token="pal_leaf", radius=0.007, depth=0.76, vertices=5))
parts.append(part("cyl", "cattail_head_0", loc=(0.015, 0.015, 0.71), rot=(1, 2, 0),
                  token="pal_wood", radius=0.018, depth=0.14, vertices=6))
parts.append(part("cone", "cattail_tip_0", loc=(0.016, 0.016, 0.79), rot=(1, 2, 0),
                  token="pal_leaf", radius1=0.003, radius2=0.001, depth=0.02, vertices=4))

# Cattail 2 (shorter, reaching ~0.70m)
parts.append(part("cyl", "cattail_stem_1", loc=(-0.04, -0.02, 0.33), rot=(-3, -4, 30),
                  token="pal_leaf", radius=0.007, depth=0.66, vertices=5))
parts.append(part("cyl", "cattail_head_1", loc=(-0.055, -0.035, 0.62), rot=(-3, -4, 30),
                  token="pal_wood", radius=0.018, depth=0.13, vertices=6))
parts.append(part("cone", "cattail_tip_1", loc=(-0.06, -0.04, 0.695), rot=(-3, -4, 30),
                  token="pal_leaf", radius1=0.003, radius2=0.001, depth=0.02, vertices=4))

# Surrounding reed blades
reed_blades = [
    (( 0.04, -0.03, 0.32), ( 6, -8,  40), 0.64),
    ((-0.03,  0.04, 0.30), (-8,  7, -50), 0.60),
    (( 0.02,  0.05, 0.33), (-5, 10, 110), 0.66),
    ((-0.05, -0.04, 0.28), (-10,-6,-130), 0.55),
    (( 0.06,  0.02, 0.29), (10,  4,  80), 0.58),
]

for idx, (loc, rot, h) in enumerate(reed_blades):
    parts.append(part("cone", f"reed_{idx}", loc=loc, rot=rot, token="pal_leaf",
                      radius1=0.015, radius2=0.001, depth=h, vertices=4))

mesh = join_into_one(parts, "reed-clump")
ground_mesh(mesh)
apply_all()

export("public/models/filler/reed-clump.glb", "blender/previews/reed-clump.png", dist=1.6)
