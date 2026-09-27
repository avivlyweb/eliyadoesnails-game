import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from _lib import reset, part, root, parent_all, ground_all, export

reset()

r = root("basket_Root")

# Tapered cylinder basket body (radius 0.14m -> width 0.28m)
body = part("cyl", "basket_Body", loc=(0, 0, 0.09), scale=(0.14, 0.14, 0.09), token="pal_sand", vertices=12)

# Rim
rim = part("torus", "basket_Rim", loc=(0, 0, 0.18), token="pal_taupe", major_radius=0.14, minor_radius=0.012, major_segments=12, minor_segments=6)

# Arch handle
handle = part("torus", "basket_Handle", loc=(0, 0, 0.19), rot=(90, 0, 0), scale=(1, 1, 1), token="pal_wood", major_radius=0.13, minor_radius=0.009, major_segments=12, minor_segments=6)

parent_all(r, [body, rim, handle])

ground_all()

OUT_GLB = os.path.abspath("public/models/ui/material-basket.glb")
PREV_PNG = os.path.abspath("blender/previews/material-basket.png")
export(OUT_GLB, PREV_PNG, dist=0.8)
print("Exported", OUT_GLB)
