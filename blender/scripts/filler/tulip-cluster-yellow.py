# blender/scripts/filler/tulip-cluster-yellow.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
flower_token = "pal_butter"
stem_token = "pal_leaf"

parts = []

parts.append(part("cyl", "stem_0", loc=(0.0, 0.0, 0.19), scale=(1, 1, 1), token=stem_token,
                  radius=0.008, depth=0.38, vertices=6))
parts.append(part("sphere", "bloom_0", loc=(0.0, 0.0, 0.405), scale=(0.038, 0.038, 0.045), token=flower_token,
                  segments=8, ring_count=6))

parts.append(part("cyl", "stem_1", loc=(-0.05, 0.02, 0.16), rot=(3, 7, 15), scale=(1, 1, 1), token=stem_token,
                  radius=0.007, depth=0.32, vertices=6))
parts.append(part("sphere", "bloom_1", loc=(-0.07, 0.03, 0.345), rot=(3, 7, 15), scale=(0.035, 0.035, 0.042), token=flower_token,
                  segments=8, ring_count=6))

parts.append(part("cyl", "stem_2", loc=(0.05, -0.01, 0.17), rot=(-4, -6, -20), scale=(1, 1, 1), token=stem_token,
                  radius=0.007, depth=0.34, vertices=6))
parts.append(part("sphere", "bloom_2", loc=(0.07, -0.02, 0.365), rot=(-4, -6, -20), scale=(0.036, 0.036, 0.043), token=flower_token,
                  segments=8, ring_count=6))

parts.append(part("cone", "leaf_0", loc=(-0.04, -0.03, 0.12), rot=(-12, 18, -45), scale=(0.7, 0.3, 1.0), token=stem_token,
                  radius1=0.035, radius2=0.002, depth=0.24, vertices=4))
parts.append(part("cone", "leaf_1", loc=(0.04, 0.03, 0.13), rot=(10, -16, 135), scale=(0.7, 0.3, 1.0), token=stem_token,
                  radius1=0.035, radius2=0.002, depth=0.25, vertices=4))

mesh = join_into_one(parts, "tulip-cluster-yellow")
ground_mesh(mesh)
apply_all()

export("public/models/filler/tulip-cluster-yellow.glb", "blender/previews/tulip-cluster-yellow.png", dist=1.0)
