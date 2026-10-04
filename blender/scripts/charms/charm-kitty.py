# blender/scripts/charms/charm-kitty.py
# 3D Nail Charm: charm-kitty for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_a import build_kitty

if __name__ == "__main__":
    out_dir = "public/models/charms"
    build_kitty(out_dir)
