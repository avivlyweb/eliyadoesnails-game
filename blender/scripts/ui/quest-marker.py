import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from _lib import reset, part, ground_all, export

reset()

# Double cone diamond gem: top apex (0,0,0.40), middle girdle (radius 0.16, Z=0.26), bottom culet (0,0,0.02)
# 8 facets
gem_top = part("cone", "marker_Gem", loc=(0, 0, 0.32), scale=(0.16, 0.16, 0.08), token="pal_rose", vertices=8)
gem_bot = part("cone", "gem_Lower", loc=(0, 0, 0.14), rot=(180, 0, 0), scale=(0.16, 0.16, 0.14), token="pal_blush", vertices=8)

# Join into single marker_Gem
import bpy
bpy.ops.object.select_all(action='DESELECT')
gem_top.select_set(True)
gem_bot.select_set(True)
bpy.context.view_layer.objects.active = gem_top
bpy.ops.object.join()
gem_top.name = "marker_Gem"

ground_all()

OUT_GLB = os.path.abspath("public/models/ui/quest-marker.glb")
PREV_PNG = os.path.abspath("blender/previews/quest-marker.png")
export(OUT_GLB, PREV_PNG, dist=0.8)
print("Exported", OUT_GLB)
