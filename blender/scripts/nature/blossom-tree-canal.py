"""
blender/scripts/nature/blossom-tree-canal.py
============================================
Rebuild of Cherry/Apple Blossom Tree along Amsterdam Canals
- Height: ~4.5 m
- Features:
  1. Gnarled, curved trunk with spreading boughs (bark brown)
  2. 5 clustered blossom clouds (soft petal pinks)
  3. Scatter ring of fallen flower petals at the base
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
    col = bpy.data.collections.new("BlossomTreeCanal")
    bpy.context.scene.collection.children.link(col)

    mat_bark = create_pbr_mat("M_CherryBark", "#543D2B", roughness=0.88)
    mat_blossom_main = create_pbr_mat("M_BlossomPink", "#FFAEC0", roughness=0.68)
    mat_blossom_light = create_pbr_mat("M_BlossomLight", "#FFC6D3", roughness=0.65)
    mat_blossom_deep = create_pbr_mat("M_BlossomDeep", "#F391A7", roughness=0.70)
    mat_fallen = create_pbr_mat("M_FallenPetals", "#FF99B0", roughness=0.75)

    root = bpy.data.objects.new("blossom_tree_canal", None)
    col.objects.link(root)

    # 1. Gnarled curved trunk with primary boughs
    bm_trunk = bmesh.new()
    steps = 14
    prev_verts = []
    for s in range(steps + 1):
        t = s / steps
        z = t * 2.2
        curve_x = math.sin(t * 1.8) * 0.45
        curve_y = -math.sin(t * 1.5) * 0.35
        radius = 0.38 * (1.0 - t * 0.35)
        
        ring_verts = []
        seg = 12
        for i in range(seg):
            ang = (i / seg) * math.pi * 2
            vx = curve_x + math.cos(ang) * radius
            vy = curve_y + math.sin(ang) * radius
            ring_verts.append(bm_trunk.verts.new((vx, vy, z)))
            
        if prev_verts:
            for i in range(seg):
                i_next = (i + 1) % seg
                bm_trunk.faces.new([
                    prev_verts[i], prev_verts[i_next],
                    ring_verts[i_next], ring_verts[i]
                ])
        prev_verts = ring_verts

    # Bough 1: Left spreading branch
    b1_start = Vector((curve_x, curve_y, 2.2))
    b1_steps = 8
    prev_b1 = prev_verts[:8]
    for s in range(1, b1_steps + 1):
        t = s / b1_steps
        pos = b1_start + Vector((-t * 1.3, -t * 0.5, t * 1.1))
        r = 0.22 * (1.0 - t * 0.4)
        ring = []
        for i in range(8):
            ang = (i / 8) * math.pi * 2
            ring.append(bm_trunk.verts.new((pos.x + math.cos(ang) * r, pos.y + math.sin(ang) * r, pos.z)))
        if s > 1:
            for i in range(8):
                inxt = (i + 1) % 8
                bm_trunk.faces.new([prev_b1[i], prev_b1[inxt], ring[inxt], ring[i]])
        prev_b1 = ring

    # Bough 2: Right upright branch
    b2_steps = 8
    prev_b2 = []
    for s in range(1, b2_steps + 1):
        t = s / b2_steps
        pos = b1_start + Vector((t * 0.9, t * 0.8, t * 1.4))
        r = 0.20 * (1.0 - t * 0.4)
        ring = []
        for i in range(8):
            ang = (i / 8) * math.pi * 2
            ring.append(bm_trunk.verts.new((pos.x + math.cos(ang) * r, pos.y + math.sin(ang) * r, pos.z)))
        if prev_b2:
            for i in range(8):
                inxt = (i + 1) % 8
                bm_trunk.faces.new([prev_b2[i], prev_b2[inxt], ring[inxt], ring[i]])
        prev_b2 = ring

    mesh_trunk = bpy.data.meshes.new("CherryTrunk_Mesh")
    bm_trunk.to_mesh(mesh_trunk)
    bm_trunk.free()
    obj_trunk = bpy.data.objects.new("Trunk", mesh_trunk)
    obj_trunk.parent = root
    col.objects.link(obj_trunk)
    obj_trunk.data.materials.append(mat_bark)
    for poly in mesh_trunk.polygons: poly.use_smooth = True

    # 2. Blossom Clouds (5 clusters)
    blossom_specs = [
        {"name": "Blossom_Center", "loc": (0.1, 0.0, 3.8), "scale": (1.4, 1.3, 1.1), "mat": mat_blossom_main},
        {"name": "Blossom_Left",   "loc": (-1.3, -0.6, 3.4), "scale": (1.2, 1.1, 0.95), "mat": mat_blossom_light},
        {"name": "Blossom_Right",  "loc": (1.1, 0.7, 3.7), "scale": (1.15, 1.2, 0.90), "mat": mat_blossom_deep},
        {"name": "Blossom_Front",  "loc": (-0.4, -1.0, 3.1), "scale": (0.95, 0.95, 0.80), "mat": mat_blossom_light},
        {"name": "Blossom_Top",    "loc": (0.3, 0.3, 4.3), "scale": (0.85, 0.85, 0.75), "mat": mat_blossom_main},
    ]

    for b in blossom_specs:
        bm_b = bmesh.new()
        bmesh.ops.create_icosphere(bm_b, subdivisions=2, radius=1.0)
        for v in bm_b.verts:
            noise = 1.0 + 0.12 * math.sin(v.co.x * 5) * math.cos(v.co.z * 5)
            v.co.x *= b["scale"][0] * noise
            v.co.y *= b["scale"][1] * noise
            v.co.z *= b["scale"][2] * noise

        mesh_b = bpy.data.meshes.new(f"{b['name']}_Mesh")
        bm_b.to_mesh(mesh_b)
        bm_b.free()
        obj_b = bpy.data.objects.new(b["name"], mesh_b)
        obj_b.parent = root
        obj_b.location = b["loc"]
        col.objects.link(obj_b)
        obj_b.data.materials.append(b["mat"])
        for poly in mesh_b.polygons: poly.use_smooth = True

    # 3. Fallen Petals scatter disc at base (clean little oval flakes)
    bm_petals = bmesh.new()
    for p_idx in range(24):
        ang = (p_idx / 24.0) * math.pi * 2 + (p_idx * 0.37)
        dist = 0.45 + (p_idx % 5) * 0.15
        px = math.cos(ang) * dist
        py = math.sin(ang) * dist
        ret = bmesh.ops.create_uvsphere(bm_petals, u_segments=8, v_segments=6, radius=0.045)
        for v in ret["verts"]:
            v.co.z *= 0.10
            v.co.x += px
            v.co.y += py
            v.co.z += 0.015

    mesh_petals = bpy.data.meshes.new("FallenPetals_Mesh")
    bm_petals.to_mesh(mesh_petals)
    bm_petals.free()
    obj_petals = bpy.data.objects.new("FallenPetals", mesh_petals)
    obj_petals.parent = root
    col.objects.link(obj_petals)
    obj_petals.data.materials.append(mat_fallen)
    for poly in mesh_petals.polygons: poly.use_smooth = True

    # Export
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects: o.select_set(True)

    dest = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/discoveries/blossom-tree-canal.glb"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"Exported clean Blossom Tree to: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    build()
