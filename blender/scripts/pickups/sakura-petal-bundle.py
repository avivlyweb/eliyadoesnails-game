# blender/scripts/pickups/sakura-petal-bundle.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("sakura_Root")

parts = []

# 5 curved petals arranged in an ascending spiral
petal_data = [
    # (loc, rot, scale, token)
    (( 0.00, -0.04, 0.18), ( 20,   0,   0), (0.07, 0.03, 0.16), "pal_petal"),
    (( 0.05, -0.02, 0.22), ( 15,  15,  72), (0.07, 0.03, 0.16), "pal_rose"),
    (( 0.03,  0.04, 0.26), (-10,  20, 144), (0.07, 0.03, 0.16), "pal_petal"),
    ((-0.04,  0.03, 0.30), (-20, -10, 216), (0.07, 0.03, 0.16), "pal_rose"),
    ((-0.03, -0.03, 0.34), ( 10, -20, 288), (0.07, 0.03, 0.16), "pal_petal"),
]

for idx, (loc, rot, scale, token) in enumerate(petal_data):
    p = part("cone", f"sakura_Petal_{idx}", loc=loc, rot=rot, scale=scale,
             token=token, radius1=1.0, radius2=0.15, depth=1.0, vertices=8)
    parts.append(p)

# Base ribbon tie
tie = part("torus", "sakura_Tie", loc=(0, 0, 0.08), rot=(0, 0, 0),
           scale=(0.045, 0.045, 0.03), token="pal_blush",
           major_radius=1.0, minor_radius=0.25)
parts.append(tie)

# Highlight glow disc
glow = part("cyl", "sakura_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=20)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/sakura-petal-bundle.glb", "blender/previews/sakura-petal-bundle.png", dist=1.1)
