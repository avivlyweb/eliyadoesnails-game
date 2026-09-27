import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from _lib import reset, part, root, parent_all, ground_all, export

reset()

r = root("parcel_Root")

# Couture box: 0.28m x 0.20m x 0.12m
box = part("cube", "parcel_Box", loc=(0, 0, 0.06), scale=(0.14, 0.10, 0.06), token="pal_cream", bevel=0.008)

# Cross ribbon bands
ribbon_x = part("cube", "parcel_RibbonX", loc=(0, 0, 0.061), scale=(0.02, 0.101, 0.061), token="pal_petal")
ribbon_y = part("cube", "parcel_RibbonY", loc=(0, 0, 0.061), scale=(0.141, 0.02, 0.061), token="pal_petal")

# Bow knot and low-poly loops on top
knot = part("ico", "parcel_Knot", loc=(0, 0, 0.13), scale=(0.016, 0.016, 0.016), token="pal_rose", subdivisions=1)
loop_l = part("torus", "parcel_LoopL", loc=(-0.03, 0, 0.14), rot=(45, 0, -30), token="pal_petal", major_radius=0.025, minor_radius=0.006, major_segments=10, minor_segments=6)
loop_r = part("torus", "parcel_LoopR", loc=(0.03, 0, 0.14), rot=(45, 0, 30), token="pal_petal", major_radius=0.025, minor_radius=0.006, major_segments=10, minor_segments=6)

parent_all(r, [box, ribbon_x, ribbon_y, knot, loop_l, loop_r])

ground_all()

OUT_GLB = os.path.abspath("public/models/ui/delivery-parcel.glb")
PREV_PNG = os.path.abspath("blender/previews/delivery-parcel.png")
export(OUT_GLB, PREV_PNG, dist=0.8)
print("Exported", OUT_GLB)
