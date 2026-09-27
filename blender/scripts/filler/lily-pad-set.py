# blender/scripts/filler/lily-pad-set.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

parts = []

# 3 round lily pads
pad_data = [
    ((-0.14, -0.06, 0.008), (0.16, 0.15, 0.012), 20),
    (( 0.15, -0.03, 0.008), (0.14, 0.13, 0.012), -40),
    ((-0.01,  0.14, 0.008), (0.13, 0.12, 0.012), 110),
]

for idx, (loc, scale, rot_z) in enumerate(pad_data):
    parts.append(part("cyl", f"pad_{idx}", loc=loc, rot=(0, 0, rot_z), scale=scale,
                      token="pal_leaf", radius=1.0, depth=1.0, vertices=8))

# Pink bloom on pad 0
flower_center = (-0.14, -0.06, 0.025)
parts.append(part("sphere", "bloom_center", loc=flower_center, scale=(0.02, 0.02, 0.015),
                  token="pal_petal", segments=6, ring_count=4))

for i in range(5):
    angle = math.radians(i * 72)
    px = flower_center[0] + 0.025 * math.cos(angle)
    py = flower_center[1] + 0.025 * math.sin(angle)
    parts.append(part("cone", f"petal_{i}", loc=(px, py, flower_center[2] + 0.015),
                      rot=(18 * math.cos(angle), 18 * math.sin(angle), i * 72),
                      scale=(0.025, 0.015, 0.03), token="pal_petal",
                      radius1=1.0, radius2=0.1, depth=1.0, vertices=3))

mesh = join_into_one(parts, "lily-pad-set")
ground_mesh(mesh)
apply_all()

export("public/models/filler/lily-pad-set.glb", "blender/previews/lily-pad-set.png", dist=1.2)
