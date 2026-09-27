# blender/scripts/pickups/aurora-crystal-shard.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("crystal_Root")

parts = []

# Helper to create a pointed hexagonal crystal shard
def create_shard(name, loc, rot, body_h, tip_h, rad, token):
    # Main column
    body = part("cyl", f"{name}_Body", loc=(loc[0], loc[1], loc[2] + body_h * 0.5), rot=rot,
                token=token, radius=rad, depth=body_h, vertices=6)
    # Pointed cap
    tip = part("cone", f"{name}_Tip", loc=(loc[0], loc[1], loc[2] + body_h + tip_h * 0.5), rot=rot,
               token=token, radius1=rad, radius2=0.002, depth=tip_h, vertices=6)
    return [body, tip]

# Shard 1 (tallest, center-right)
parts += create_shard("crystal_Shard1", (0.01, 0.01, 0.02), (2, 3, 10), 0.32, 0.10, 0.042, "pal_lilac")

# Shard 2 (medium, left tilted)
parts += create_shard("crystal_Shard2", (-0.07, 0.03, 0.02), (6, 14, 45), 0.24, 0.08, 0.036, "pal_mint")

# Shard 3 (small, front tilted)
parts += create_shard("crystal_Shard3", (0.05, -0.05, 0.02), (-12, -8, -35), 0.18, 0.07, 0.032, "pal_lilac")

# Small rock base cluster
base_cluster = part("ico", "crystal_BaseCluster", loc=(0, 0, 0.03), scale=(0.11, 0.10, 0.03),
                    token="pal_mint", subdivisions=1)
parts.append(base_cluster)

# Highlight glow disc
glow = part("cyl", "crystal_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=20)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/aurora-crystal-shard.glb", "blender/previews/aurora-crystal-shard.png", dist=1.1)
