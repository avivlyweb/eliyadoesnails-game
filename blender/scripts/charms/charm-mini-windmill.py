# blender/scripts/charms/charm-mini-windmill.py
# 3D Nail Charm: charm-mini-windmill for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_b import build_mini_windmill

if __name__ == "__main__":
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_dir = os.path.join(repo_root, "public", "models", "charms")
    build_mini_windmill(out_dir)
