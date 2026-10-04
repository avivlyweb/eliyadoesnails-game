# blender/scripts/charms/charm-mochi-bunny.py
# 3D Nail Charm: charm-mochi-bunny for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_batch_b import build_mochi_bunny

if __name__ == "__main__":
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_dir = os.path.join(repo_root, "public", "models", "charms")
    build_mochi_bunny(out_dir)
