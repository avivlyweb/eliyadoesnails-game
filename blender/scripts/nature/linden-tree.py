"""
blender/scripts/nature/linden-tree.py
=====================================
Rebuild of Classic Dutch Street Linden Tree (Leilinde / Grachtenboom)
- Height: ~6.0 m
- Features:
  1. Straight sturdy trunk with flared base
  2. Cast-iron tree guard ring (boomkorf) protecting trunk base
  3. Layered, rounded dome canopy in fresh leafy greens
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
    col = bpy.data.collections.new("LindenTree")
    bpy.context.scene.collection.children.link(col)

    # Materials
    mat_bark = create_pbr_mat("M_LindenBark", "#45362B", roughness=0.90)
    mat_guard = create_pbr_mat("M_TreeGuardIron", "#1E2221", roughness=0.45, metallic=0.7)
    mat_leaves_main = create_pbr_mat("M_LindenFoliage", "#669438", roughness=0.75)
    mat_leaves_top = create_pbr_mat("M_LindenTop", "#7EAD42", roughness=0.70)
    mat_leaves_shade = create_pbr_mat("M_LindenShade", "#50752C", roughness=0.80)

    root = bpy.data.objects.new("linden_tree", None)
    col.objects.link(root)

    # 1. Straight Trunk (Z: 0 to 3.8m)
    bm_trunk = bmesh.new()
    bmesh.ops.create_cone(
        bm_trunk,
        cap_ends=True,
        segments=14,
        radius1=0.35, # flared at ground
        radius2=0.22, # trunk top
        depth=3.8
    )
    for v in bm_trunk.verts:
        v.co.z += 1.9
        # Flaring at ground
        if v.co.z < 0.5:
            fl = (0.5 - v.co.z) / 0.5
            v.co.x *= (1.0 + 0.35 * fl)
            v.co.y *= (1.0 + 0.35 * fl)

    mesh_trunk = bpy.data.meshes.new("LindenTrunk_Mesh")
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    obj_trunk = bpy.data.objects.new("Trunk", mesh_trunk)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)
    obj_trunk.data.materials.append(mat_bark)
    for poly in mesh_trunk.polygons: poly.use_smooth = True

    # 2. Dutch Cast-Iron Tree Guard (Boomkorf, Z: 0 to 1.3m, diameter 0.85m)
    bm_guard = bmesh.new()
    guard_r = 0.42
    bars = 16
    for i in range(bars):
        ang = (i / bars) * math.pi * 2
        bx = math.cos(ang) * guard_r
        by = math.sin(ang) * guard_r
        # Vertical iron slat
        bmesh.ops.create_cube(bm_guard, size=0.03)
        for v in bm_guard.verts[-8:]:
            v.co.z *= 42.0  # height 1.26m
            v.co.x += bx
            v.co.y += by
            v.co.z += 0.65

    # Top & bottom iron support hoops
    for hoop_z in [0.25, 0.70, 1.25]:
        bmesh.ops.create_cone(bm_guard, cap_ends=False, segments=20, radius1=guard_r + 0.015, radius2=guard_r + 0.015, depth=0.04)
        for v in bm_guard.verts[-40:]:
            v.co.z += hoop_z

    mesh_guard = bpy.data.meshes.new("TreeGuard_Mesh")
    bm_guard.to_mesh(mesh_guard)
    bm_guard.free()
    obj_guard = bpy.data.objects.new("TreeGuard", mesh_guard)
    obj_guard.parent = root
    col.objects.link(obj_guard)
    obj_guard.data.materials.append(mat_guard)

    # 3. Layered Rounded Canopy (3 tiers: lower broad tier, mid tier, top dome crown)
    canopy_tiers = [
        {"name": "Canopy_Tier1_Base", "loc": (0, 0, 3.6), "rad": 1.75, "h_scale": 0.85, "mat": mat_leaves_shade},
        {"name": "Canopy_Tier2_Mid",  "loc": (0, 0, 4.5), "rad": 1.55, "h_scale": 0.90, "mat": mat_leaves_main},
        {"name": "Canopy_Tier3_Top",  "loc": (0, 0, 5.3), "rad": 1.20, "h_scale": 0.95, "mat": mat_leaves_top},
    ]

    for tier in canopy_tiers:
        bm_t = bmesh.new()
        bmesh.ops.create_uvsphere(bm_t, u_segments=22, v_segments=16, radius=tier["rad"])
        for v in bm_t.verts:
            # Flatten slightly for Dutch pruned street tree shape
            v.co.z *= tier["h_scale"]
            # Gentle lobed scalloping
            wave = 1.0 + 0.08 * math.sin(math.atan2(v.co.y, v.co.x) * 6)
            v.co.x *= wave
            v.co.y *= wave

        mesh_t = bpy.data.meshes.new(f"{tier['name']}_Mesh")
        bm_t.to_mesh(mesh_t)
        bm_t.free()
        obj_t = bpy.data.objects.new(tier["name"], mesh_t)
        obj_t.parent = root
        obj_t.location = tier["loc"]
        col.objects.link(obj_t)
        obj_t.data.materials.append(tier["mat"])
        for poly in mesh_t.polygons: poly.use_smooth = True

    # Export
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects: o.select_set(True)

    dest = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/discoveries/linden-tree.glb"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"Exported clean Linden Tree to: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    build()
