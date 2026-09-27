# blender/scripts/pickups/chrome-droplet.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("chrome_Root")

parts = []

# Teardrop body (sphere bottom + tapering cone top)
drop_base = part("sphere", "chrome_DropBase", loc=(0, 0, 0.15), scale=(0.12, 0.12, 0.14),
                 token="pal_chrome", segments=14, ring_count=8)
parts.append(drop_base)

drop_tip = part("cone", "chrome_DropTip", loc=(0, 0, 0.27), scale=(1, 1, 1),
                token="pal_chrome", radius1=0.115, radius2=0.005, depth=0.24, vertices=14)
parts.append(drop_tip)

# Molten puddle / ripple ring at base
splash = part("torus", "chrome_SplashRing", loc=(0, 0, 0.02),
              scale=(0.18, 0.18, 0.025), token="pal_chrome",
              major_radius=1.0, minor_radius=0.25, major_segments=16, minor_segments=8)
parts.append(splash)

# Highlight glow disc
glow = part("cyl", "chrome_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=16)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/chrome-droplet.glb", "blender/previews/chrome-droplet.png", dist=1.1)
