# blender/scripts/pickups/silk-ribbon-spool.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("spool_Root")

parts = []

# Wooden spool top and bottom flanges
bottom_flange = part("cyl", "spool_FlangeBottom", loc=(0, 0, 0.04),
                     scale=(0.12, 0.12, 0.025), token="pal_wood",
                     radius=1.0, depth=1.0, vertices=16, bevel=0.005)
parts.append(bottom_flange)

top_flange = part("cyl", "spool_FlangeTop", loc=(0, 0, 0.33),
                  scale=(0.12, 0.12, 0.025), token="pal_wood",
                  radius=1.0, depth=1.0, vertices=16, bevel=0.005)
parts.append(top_flange)

center_knob = part("sphere", "spool_Knob", loc=(0, 0, 0.365),
                   scale=(0.03, 0.03, 0.025), token="pal_wood",
                   segments=12, ring_count=8)
parts.append(center_knob)

# Wound silk ribbon around the spool
ribbon_wound = part("cyl", "spool_Ribbon", loc=(0, 0, 0.185),
                    scale=(0.095, 0.095, 0.24), token="pal_rose",
                    radius=1.0, depth=1.0, vertices=16)
parts.append(ribbon_wound)

# Unfurled ribbon tail curving onto the ground
tail_segments = [
    (( 0.09,  0.06, 0.16), ( 15, -10,  20), (0.04, 0.015, 0.08)),
    (( 0.13,  0.10, 0.10), ( 25, -20,  45), (0.04, 0.015, 0.08)),
    (( 0.17,  0.13, 0.04), ( 10, -10,  70), (0.045, 0.015, 0.07)),
    (( 0.21,  0.14, 0.015),(  0,   0,  85), (0.05, 0.015, 0.05)),
]
for idx, (loc, rot, scale) in enumerate(tail_segments):
    t = part("cube", f"spool_Tail_{idx}", loc=loc, rot=rot, scale=scale,
             token="pal_rose", bevel=0.003)
    parts.append(t)

# Highlight glow disc
glow = part("cyl", "spool_Glow", loc=(0, 0, 0.005), scale=(0.30, 0.30, 0.005),
            token="pal_butter", vertices=20)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/silk-ribbon-spool.glb", "blender/previews/silk-ribbon-spool.png", dist=1.1)
