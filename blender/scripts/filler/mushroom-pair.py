# blender/scripts/filler/mushroom-pair.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()

parts = []

# Mushroom 1 (taller, reaching 0.15m)
parts.append(part("cyl", "stalk_0", loc=(-0.02, 0.0, 0.055), token="pal_cream",
                  radius=0.012, depth=0.10, vertices=5))
parts.append(part("sphere", "cap_0", loc=(-0.02, 0.0, 0.12), scale=(0.042, 0.042, 0.030),
                  token="pal_terracotta", segments=6, ring_count=3))

# Mushroom 2 (smaller, slightly tilted)
parts.append(part("cyl", "stalk_1", loc=(0.03, -0.01, 0.038), rot=(4, 8, 25), token="pal_cream",
                  radius=0.009, depth=0.07, vertices=5))
parts.append(part("sphere", "cap_1", loc=(0.038, -0.008, 0.082), rot=(4, 8, 25), scale=(0.030, 0.030, 0.022),
                  token="pal_terracotta", segments=6, ring_count=3))

mesh = join_into_one(parts, "mushroom-pair")
ground_mesh(mesh)
apply_all()

export("public/models/filler/mushroom-pair.glb", "blender/previews/mushroom-pair.png", dist=0.6)
