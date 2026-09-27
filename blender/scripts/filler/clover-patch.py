# blender/scripts/filler/clover-patch.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

parts = []

clover_centers = [
    ((-0.12, -0.06, 0.04),  15, "pal_leaf"),
    (( 0.12, -0.03, 0.045), 65, "pal_sage"),
    ((-0.02,  0.11, 0.04), -30, "pal_leaf"),
    (( 0.00, -0.02, 0.05),   0, "pal_sage"),
]

for idx, ((cx, cy, cz), base_rot, token) in enumerate(clover_centers):
    # Short central stem
    parts.append(part("cyl", f"stem_{idx}", loc=(cx, cy, cz - 0.015),
                      scale=(1, 1, 1), token=token, radius=0.004, depth=0.03, vertices=4))
    # 3 leaflets in a circle
    for leaf_i in range(3):
        angle = math.radians(base_rot + leaf_i * 120)
        lx = cx + 0.035 * math.cos(angle)
        ly = cy + 0.035 * math.sin(angle)
        parts.append(part("cone", f"leaf_{idx}_{leaf_i}", loc=(lx, ly, cz),
                          rot=(5 * math.cos(angle), 5 * math.sin(angle), base_rot + leaf_i * 120),
                          scale=(0.035, 0.025, 0.005), token=token,
                          radius1=1.0, radius2=0.1, depth=1.0, vertices=3))

mesh = join_into_one(parts, "clover-patch")
ground_mesh(mesh)
apply_all()

export("public/models/filler/clover-patch.glb", "blender/previews/clover-patch.png", dist=0.9)
