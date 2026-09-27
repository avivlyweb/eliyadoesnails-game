# blender/scripts/pickups/freshwater-pearl-oyster.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("pearl_Root")

bottom = part("sphere", "pearl_ShellBottom", loc=(0, 0, 0.06), scale=(0.22, 0.18, 0.06),
              token="pal_blush", segments=20, ring_count=10)
top    = part("sphere", "pearl_ShellTop", loc=(0, 0.1, 0.21), rot=(-55, 0, 0),
              scale=(0.22, 0.18, 0.05), token="pal_blush", segments=20, ring_count=10)
pearl  = part("sphere", "pearl_Pearl", loc=(0, 0, 0.14), scale=(0.08, 0.08, 0.08),
              token="pal_cream", segments=16, ring_count=10)
glow   = part("cyl", "pearl_Glow", loc=(0, 0, 0.005), scale=(0.30, 0.30, 0.005),
              token="pal_butter", vertices=20)

parent_all(r, [bottom, top, pearl, glow])
apply_all()
ground_all()

export("public/models/pickups/freshwater-pearl-oyster.glb", "blender/previews/freshwater-pearl-oyster.png", dist=1.0)
