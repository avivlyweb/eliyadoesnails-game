# blender/scripts/charms/charm-sakura.py
# 3D Nail Charm: charm-sakura for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_a import build_sakura

if __name__ == "__main__":
    out_dir = "public/models/charms"
    build_sakura(out_dir)
