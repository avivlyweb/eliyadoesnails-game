# blender/scripts/_lib.py — shared helpers (tested with Blender 5.2 / bpy 5.2.2, headless)
#
# Findings from reference model inspection:
# 1. Scale: 1 Blender unit = 1 metre.
#    - eliya-artisan.glb: height = 1.515m (width 0.622m, depth 0.375m). Feet touch ground at Z = 0.01m, top at Z = 1.525m.
#    - canal-house-stepped-gable.glb: height = 5.135m (width 2.200m, depth 3.175m with stoep). Ground level is at Z = 0.000m.
# 2. Orientation & Pivot:
#    - In Blender, Front faces -Y (viewed looking from -Y towards +Y).
#    - Characters and models face -Y so that standard export_yup=True maps Blender -Y to glTF +Z (standard forward).
#    - Origin/pivot is at bottom center (Z = 0.0) where the model touches the ground.
# 3. Palette:
#    - Re-extracted baseColorFactor, roughness, and metallic from existing .glb models (stepped-gable, eliya-artisan,
#      vintage-bicycle, baroque-pearl, set-cherry-blossom). All match PALETTE tokens defined in 01 §C3.

import bpy, math, os

PALETTE = {
  "pal_cream": ("#F8F6F1", 0.8, 0.0), "pal_butter": ("#F6E09E", 0.7, 0.0),
  "pal_sand": ("#E0CDB3", 0.8, 0.0), "pal_taupe": ("#C2AC94", 0.85, 0.0),
  "pal_wood": ("#AC8061", 0.75, 0.0), "pal_terracotta": ("#C78A75", 0.8, 0.0),
  "pal_rose": ("#EDA4A4", 0.6, 0.0), "pal_blush": ("#F9E2E2", 0.6, 0.0),
  "pal_petal": ("#F9C2D2", 0.6, 0.0), "pal_lilac": ("#A894FF", 0.3, 0.0),
  "pal_mint": ("#B1CDBD", 0.7, 0.0), "pal_sage": ("#B3CABA", 0.85, 0.0),
  "pal_leaf": ("#5A806F", 0.85, 0.0), "pal_grass": ("#768F72", 0.9, 0.0),
  "pal_ink": ("#2A2A38", 0.6, 0.0), "pal_chrome": ("#E9EAED", 0.15, 1.0),
  "pal_gold": ("#E4C07A", 0.25, 1.0),
}

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def mat(token):
    if token in bpy.data.materials:
        return bpy.data.materials[token]
    hexv, rough, metal = PALETTE[token]
    r, g, b = (int(hexv[i:i+2], 16) / 255 for i in (1, 3, 5))
    m = bpy.data.materials.new(token)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    m.diffuse_color = (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1)  # so Workbench previews show the colour
    return m

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def part(kind, name, loc=(0,0,0), rot=(0,0,0), scale=(1,1,1), token="pal_cream", bevel=0.0, **kw):
    ops = {
      "cube": bpy.ops.mesh.primitive_cube_add,
      "cyl": bpy.ops.mesh.primitive_cylinder_add,
      "sphere": bpy.ops.mesh.primitive_uv_sphere_add,
      "ico": bpy.ops.mesh.primitive_ico_sphere_add,
      "cone": bpy.ops.mesh.primitive_cone_add,
      "torus": bpy.ops.mesh.primitive_torus_add,
    }
    ops[kind](location=loc, rotation=[math.radians(a) for a in rot], **kw)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(mat(token))
    if bevel > 0:
        mod = o.modifiers.new("Bevel", "BEVEL"); mod.width = bevel; mod.segments = 2
    bpy.ops.object.shade_smooth() if kind in ("sphere", "ico", "torus") else None
    return o

def root(name):
    bpy.ops.object.empty_add(location=(0, 0, 0))
    r = bpy.context.active_object; r.name = name
    return r

def parent_all(r, objs):
    for o in objs:
        o.parent = r

def apply_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def join_into_one(objs, name):
    """For filler: merge into a single mesh."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]

def export(out_glb, preview_png, dist=1.2):
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
        export_animations=False, export_materials='EXPORT')
    render_preview(preview_png, dist)

def render_preview(png, dist=1.2):
    """dist: ~1.2 for filler/pickups, ~5 for props, ~3.5 for NPCs.
    Called after export, so the camera is never part of the .glb."""
    os.makedirs(os.path.dirname(png), exist_ok=True)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.display.shading.color_type = 'MATERIAL'
    scn.render.resolution_x = scn.render.resolution_y = 512
    scn.render.film_transparent = True
    scn.view_settings.view_transform = 'Standard'   # true palette colours, not AgX-dimmed
    # look at the object's centre from the front-right, slightly above
    h = max((o.dimensions.z for o in scn.objects if o.type == 'MESH'), default=1.0)
    target = (0, 0, h * 0.5)
    loc = (dist * 0.7, -dist * 0.7, target[2] + dist * 0.45)
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object; scn.camera = cam
    bpy.ops.object.empty_add(location=target); tgt = bpy.context.active_object
    c = cam.constraints.new('TRACK_TO'); c.target = tgt
    c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    scn.render.filepath = png
    bpy.ops.render.render(write_still=True)

def ground_mesh(obj):
    """Adjust mesh vertices so bottom sits exactly at Z = 0.000"""
    min_z = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
    for v in obj.data.vertices:
        v.co.z -= min_z
    obj.data.update()

def ground_all():
    """Adjust all mesh vertices in scene so lowest point sits exactly at Z = 0.000"""
    min_z = float('inf')
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for v in o.data.vertices:
                wz = (o.matrix_world @ v.co).z
                if wz < min_z: min_z = wz
    if min_z != float('inf') and abs(min_z) > 1e-5:
        for o in bpy.context.scene.objects:
            if o.type == 'MESH':
                for v in o.data.vertices:
                    v.co.z -= min_z
                o.data.update()
