# blender/scripts/filler/fallen-petals.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

petal_scatter = [
    ((-0.22,  0.08, 0.004), ( 3, -4,  25), "pal_petal"),
    ((-0.12, -0.18, 0.004), (-2,  3,  70), "pal_rose"),
    (( 0.05,  0.21, 0.004), ( 4,  2, -45), "pal_petal"),
    (( 0.20,  0.10, 0.004), (-3, -3, 110), "pal_rose"),
    (( 0.18, -0.15, 0.004), ( 2,  4, -80), "pal_petal"),
    ((-0.03, -0.06, 0.004), (-4,  2,  15), "pal_petal"),
    (( 0.08, -0.02, 0.004), ( 3, -2, 140), "pal_rose"),
    ((-0.09,  0.14, 0.004), (-2, -4, -10), "pal_petal"),
]

parts = []
for idx, (loc, rot, token) in enumerate(petal_scatter):
    parts.append(part("cone", f"petal_{idx}", loc=loc, rot=rot,
                      scale=(0.045, 0.028, 0.006), token=token,
                      radius1=1.0, radius2=0.2, depth=1.0, vertices=4))

mesh = join_into_one(parts, "fallen-petals")
ground_mesh(mesh)
apply_all()

export("public/models/filler/fallen-petals.glb", "blender/previews/fallen-petals.png", dist=1.1)
