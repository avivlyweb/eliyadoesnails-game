# blender/scripts/pickups/daisy-sprig.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("daisy_Root")

parts = []

# Main stem reaching up to 0.40m
stem = part("cyl", "daisy_MainStem", loc=(0.0, 0.0, 0.18), rot=(2, 4, 15),
            token="pal_leaf", radius=0.008, depth=0.36, vertices=6)
parts.append(stem)

# Side branch 1
branch1 = part("cyl", "daisy_Branch1", loc=(-0.04, 0.02, 0.23), rot=(15, 25, 45),
               token="pal_leaf", radius=0.006, depth=0.14, vertices=5)
parts.append(branch1)

# Side branch 2
branch2 = part("cyl", "daisy_Branch2", loc=(0.04, -0.01, 0.28), rot=(-12, -22, -45),
               token="pal_leaf", radius=0.006, depth=0.12, vertices=5)
parts.append(branch2)

# 3 Daisy Flower Heads (center disk + petals ring)
flower_data = [
    # Center flower (top)
    ((-0.01, 0.01, 0.38), (10, 0, 0), "daisy_FlowerTop"),
    # Left flower
    ((-0.09, 0.05, 0.29), (25, 30, 45), "daisy_FlowerLeft"),
    # Right flower
    (( 0.08, -0.03, 0.33), (-20, -25, -45), "daisy_FlowerRight"),
]

for idx, (floc, frot, fname) in enumerate(flower_data):
    # Center golden disc
    center = part("cyl", f"{fname}_Center", loc=floc, rot=frot,
                  scale=(0.022, 0.022, 0.01), token="pal_butter",
                  radius=1.0, depth=1.0, vertices=10)
    parts.append(center)
    # Petals disc/ring
    petals = part("cyl", f"{fname}_Petals", loc=(floc[0], floc[1], floc[2] - 0.004), rot=frot,
                  scale=(0.065, 0.065, 0.006), token="pal_cream",
                  radius=1.0, depth=1.0, vertices=12)
    parts.append(petals)

# Highlight glow disc
glow = part("cyl", "daisy_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=20)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/daisy-sprig.glb", "blender/previews/daisy-sprig.png", dist=1.1)
