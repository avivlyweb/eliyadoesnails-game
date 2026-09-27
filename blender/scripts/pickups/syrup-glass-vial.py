# blender/scripts/pickups/syrup-glass-vial.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *

reset()
r = root("vial_Root")

parts = []

# Outer Glass Body (cylinder with rounded bevel)
glass_body = part("cyl", "vial_GlassBody", loc=(0, 0, 0.17),
                  scale=(0.10, 0.10, 0.12), token="pal_cream",
                  radius=1.0, depth=2.0, vertices=12)
mod = glass_body.modifiers.new("Bevel", "BEVEL")
mod.width = 0.015
mod.segments = 1
parts.append(glass_body)

# Glass Neck
glass_neck = part("cyl", "vial_GlassNeck", loc=(0, 0, 0.32),
                  scale=(0.05, 0.05, 0.04), token="pal_cream",
                  radius=1.0, depth=2.0, vertices=10)
parts.append(glass_neck)

# Glass Lip / Rim
glass_rim = part("torus", "vial_GlassRim", loc=(0, 0, 0.36),
                 scale=(0.058, 0.058, 0.015), token="pal_cream",
                 major_radius=1.0, minor_radius=0.25, major_segments=12, minor_segments=6)
parts.append(glass_rim)

# Inner Liquid (separate node vial_Liquid for dynamic recoloring in game code)
liquid = part("cyl", "vial_Liquid", loc=(0, 0, 0.15),
              scale=(0.088, 0.088, 0.095), token="pal_rose",
              radius=1.0, depth=2.0, vertices=10)
parts.append(liquid)

# Cork Stopper
cork = part("cone", "vial_Cork", loc=(0, 0, 0.39),
            scale=(0.045, 0.045, 0.035), token="pal_wood",
            radius1=0.85, radius2=1.05, depth=2.0, vertices=10)
parts.append(cork)

# Highlight glow disc
glow = part("cyl", "vial_Glow", loc=(0, 0, 0.005), scale=(0.28, 0.28, 0.005),
            token="pal_butter", vertices=16)
parts.append(glow)

parent_all(r, parts)
apply_all()
ground_all()

export("public/models/pickups/syrup-glass-vial.glb", "blender/previews/syrup-glass-vial.png", dist=1.1)
