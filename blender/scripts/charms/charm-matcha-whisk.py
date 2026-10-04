# blender/scripts/charms/charm-matcha-whisk.py
# 3D Nail Charm: charm-matcha-whisk for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_a import build_matcha_whisk

if __name__ == "__main__":
    out_dir = "public/models/charms"
    build_matcha_whisk(out_dir)
