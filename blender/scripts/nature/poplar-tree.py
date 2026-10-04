"""
blender/scripts/nature/poplar-tree.py
=====================================
Rebuild of Tall Dutch Columnar Poplar (Italiaanse Populier)
- Height: ~8.0 m
- Features:
  1. Tall slender trunk with slight wind lean
  2. Column-shaped upright canopy with feathered fluttery foliage
  3. Muted silver-green / olive Dutch polder tones
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler

def hex_to_linear(hex_str):
    hex_str = hex_str.lstrip('#')
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    def to_lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (to_lin(r), to_lin(g), to_lin(b), 1.0)

def create_pbr_mat(name, hex_color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = hex_to_linear(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = hex_to_linear(hex_color)
    return mat

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("PoplarTree")
    bpy.context.scene.collection.children.link(col)

    # Materials
    mat_bark = create_pbr_mat("M_PoplarBark", "#6A645B", roughness=0.85)
    mat_leaf_main = create_pbr_mat("M_PoplarLeaf", "#6F8C4A", roughness=0.72)
    mat_leaf_silver = create_pbr_mat("M_PoplarSilver", "#86A364", roughness=0.68)
    mat_leaf_dark = create_pbr_mat("M_PoplarDark", "#566E3A", roughness=0.78)

    # Root group tilted slightly for Dutch wind lean (~2.5 deg)
    root = bpy.data.objects.new("poplar_tree", None)
    root.rotation_euler = Euler((math.radians(2.2), 0, math.radians(-1.5)), 'XYZ')
    col.objects.link(root)

    # 1. Slender Central Trunk (Z: 0 to 5.2m)
    bm_trunk = bmesh.new()
    bmesh.ops.create_cone(
        bm_trunk,
        cap_ends=True,
        segments=12,
        radius1=0.28,
        radius2=0.12,
        depth=5.2
    )
    for v in bm_trunk.verts:
        v.co.z += 2.6
    mesh_trunk = bpy.data.meshes.new("PoplarTrunk_Mesh")
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    obj_trunk = bpy.data.objects.new("Trunk", mesh_trunk)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)
    obj_trunk.data.materials.append(mat_bark)
    for poly in mesh_trunk.polygons: poly.use_smooth = True

    # 2. Tall Columnar Flame Canopy (Z: 2.0m to 8.0m, width ~1.9m)
    # Built as 4 overlapping vertically-stretched teardrop lobes
    lobes = [
        {"name": "Lobe_Bottom", "z": 3.4, "r": 0.88, "h_scale": 1.7, "mat": mat_leaf_dark},
        {"name": "Lobe_MidLower", "z": 4.6, "r": 0.95, "h_scale": 1.9, "mat": mat_leaf_main},
        {"name": "Lobe_MidUpper", "z": 5.8, "r": 0.85, "h_scale": 2.0, "mat": mat_leaf_silver},
        {"name": "Lobe_Tip",      "z": 7.0, "r": 0.60, "h_scale": 2.1, "mat": mat_leaf_silver},
    ]

    for idx, l in enumerate(lobes):
        bm_l = bmesh.new()
        bmesh.ops.create_uvsphere(bm_l, u_segments=18, v_segments=14, radius=l["r"])
        for v in bm_l.verts:
            # Stretch vertically into flame shape
            v.co.z *= l["h_scale"]
            # Taper toward top
            if v.co.z > 0:
                v.co.x *= (1.0 - 0.25 * (v.co.z / (l["r"] * l["h_scale"])))
                v.co.y *= (1.0 - 0.25 * (v.co.z / (l["r"] * l["h_scale"])))
            # Subtle angular silhouette
            w = 1.0 + 0.09 * math.sin(math.atan2(v.co.y, v.co.x) * 5)
            v.co.x *= w
            v.co.y *= w

        mesh_l = bpy.data.meshes.new(f"{l['name']}_Mesh")
        bm_l.to_mesh(mesh_l)
        bm_l.free()
        obj_l = bpy.data.objects.new(l["name"], mesh_l)
        obj_l.parent = root
        obj_l.location = (0, 0, l["z"])
        col.objects.link(obj_l)
        obj_l.data.materials.append(l["mat"])
        for poly in mesh_l.polygons: poly.use_smooth = True

    # Export
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects: o.select_set(True)

    dest = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/discoveries/poplar-tree.glb"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"Exported clean Poplar Tree to: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    build()
