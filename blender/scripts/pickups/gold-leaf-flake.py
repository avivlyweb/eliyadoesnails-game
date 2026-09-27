# blender/scripts/pickups/gold-leaf-flake.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("gold_Root")

parts = []

# 3 crinkled gold leaf sheets angled and floating slightly above base
# Flake 1 (center large crinkled sheet)
flake1_a = part("cube", "gold_Flake1_a", loc=(0.0, 0.0, 0.18), rot=(12, -8, 20),
                scale=(0.08, 0.06, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake1_a)
flake1_b = part("cube", "gold_Flake1_b", loc=(0.06, 0.04, 0.22), rot=(25, -4, 45),
                scale=(0.06, 0.05, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake1_b)

# Flake 2 (left tilted sheet)
flake2_a = part("cube", "gold_Flake2_a", loc=(-0.06, -0.04, 0.14), rot=(-18, 16, -35),
                scale=(0.07, 0.06, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake2_a)
flake2_b = part("cube", "gold_Flake2_b", loc=(-0.08, 0.01, 0.19), rot=(-30, 22, -10),
                scale=(0.05, 0.05, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake2_b)

# Flake 3 (top ascending curled sheet, reaching ~0.38m)
flake3_a = part("cube", "gold_Flake3_a", loc=(0.02, -0.03, 0.29), rot=(18, 24, 75),
                scale=(0.07, 0.06, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake3_a)
flake3_b = part("cube", "gold_Flake3_b", loc=(-0.01, -0.05, 0.35), rot=(8, 30, 105),
                scale=(0.05, 0.04, 0.004), token="pal_gold", bevel=0.002)
parts.append(flake3_b)

# Highlight glow disc
glow = part("cyl", "gold_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=20)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/gold-leaf-flake.glb", "blender/previews/gold-leaf-flake.png", dist=1.1)
