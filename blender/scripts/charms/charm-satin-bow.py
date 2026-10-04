# blender/scripts/charms/charm-satin-bow.py
# 3D Nail Charm: charm-satin-bow for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_a import build_satin_bow

if __name__ == "__main__":
    out_dir = "public/models/charms"
    build_satin_bow(out_dir)
