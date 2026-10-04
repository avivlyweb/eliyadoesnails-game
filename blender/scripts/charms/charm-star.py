# blender/scripts/charms/charm-star.py
# 3D Nail Charm: charm-star for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_a import build_star

if __name__ == "__main__":
    out_dir = "public/models/charms"
    build_star(out_dir)
