"""
blender/scripts/props/greenhouse-wind-chime.py
==============================================
Rebuild of Artisanal Greenhouse Wind Chime
- Height: ~1.6 m
- Features:
  1. Wooden garden support post and curved hanging hook arm
  2. Circular top wooden suspension disk
  3. 5 tuned brass tubes of stepped lengths arranged in a circle
  4. Central iridescent glass bead clapper & wooden wind sail fin at bottom
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
    col = bpy.data.collections.new("GreenhouseWindChime")
    bpy.context.scene.collection.children.link(col)

    # Materials
    mat_wood = create_pbr_mat("M_CedarPost", "#4D3626", roughness=0.75)
    mat_brass = create_pbr_mat("M_TunedBrass", "#E0BE53", roughness=0.22, metallic=0.88)
    mat_iron = create_pbr_mat("M_HookIron", "#2B2D2E", roughness=0.40, metallic=0.75)
    mat_bead = create_pbr_mat("M_GlassBead", "#78C4D4", roughness=0.15, metallic=0.10)
    mat_cord = create_pbr_mat("M_HempCord", "#8C7A68", roughness=0.90)

    root = bpy.data.objects.new("greenhouse_wind_chime", None)
    col.objects.link(root)

    # 1. Wooden Garden Post & Arm (Z: 0 to 1.62m)
    bm_post = bmesh.new()
    
    # Vertical post (Z: 0 to 1.60m, offset at X = -0.28m)
    bmesh.ops.create_cone(bm_post, cap_ends=True, segments=8, radius1=0.045, radius2=0.04, depth=1.60)
    for v in bm_post.verts:
        v.co.x -= 0.28
        v.co.z += 0.80

    # Angled top arm reaching out to X = 0.0, Z = 1.62m
    bmesh.ops.create_cone(bm_post, cap_ends=True, segments=8, radius1=0.035, radius2=0.03, depth=0.38)
    for v in bm_post.verts[-16:]:
        # Rotate 60 deg
        curr_x = v.co.x
        curr_z = v.co.z
        v.co.x = curr_x * 0.5 + curr_z * 0.866 + 0.12 - 0.28
        v.co.z = -curr_x * 0.866 + curr_z * 0.5 + 1.52

    # Metal eyelet / hanging hook at end of arm
    bmesh.ops.create_cone(bm_post, cap_ends=True, segments=8, radius1=0.008, radius2=0.008, depth=0.08)
    for v in bm_post.verts[-16:]:
        v.co.z += 1.48

    mesh_post = bpy.data.meshes.new("ChimePost_Mesh")
    bm_post.to_mesh(mesh_post)
    bm_post.free()
    obj_post = bpy.data.objects.new("SupportPost", mesh_post)
    obj_post.parent = root
    col.objects.link(obj_post)
    obj_post.data.materials.append(mat_wood)

    # 2. Hanging Suspension Platform (Top circular wooden disc at Z = 1.42m)
    bm_disc = bmesh.new()
    bmesh.ops.create_cone(bm_disc, cap_ends=True, segments=16, radius1=0.10, radius2=0.10, depth=0.02)
    for v in bm_disc.verts:
        v.co.z += 1.42
    mesh_disc = bpy.data.meshes.new("SuspensionDisc_Mesh")
    bm_disc.to_mesh(mesh_disc)
    bm_disc.free()
    obj_disc = bpy.data.objects.new("SuspensionDisc", mesh_disc)
    obj_disc.parent = root
    col.objects.link(obj_disc)
    obj_disc.data.materials.append(mat_wood)

    # Suspension Cords
    bm_cord = bmesh.new()
    for ang in [0, 2.09, 4.18]:
        cx = math.cos(ang) * 0.08
        cy = math.sin(ang) * 0.08
        bmesh.ops.create_cone(bm_cord, cap_ends=True, segments=6, radius1=0.003, radius2=0.003, depth=0.08)
        for v in bm_cord.verts[-12:]:
            v.co.x += cx * 0.5
            v.co.y += cy * 0.5
            v.co.z += 1.45
    mesh_cord = bpy.data.meshes.new("Cords_Mesh")
    bm_cord.to_mesh(mesh_cord)
    bm_cord.free()
    obj_cord = bpy.data.objects.new("Cords", mesh_cord)
    obj_cord.parent = root
    col.objects.link(obj_cord)
    obj_cord.data.materials.append(mat_cord)

    # 3. 5 Tuned Brass Tubes (Pentatonic scale lengths: 0.48m, 0.44m, 0.40m, 0.36m, 0.32m)
    tube_lengths = [0.48, 0.44, 0.40, 0.36, 0.32]
    tube_radius = 0.016
    circle_radius = 0.075

    for idx, length in enumerate(tube_lengths):
        ang = (idx / 5.0) * math.pi * 2
        tx = math.cos(ang) * circle_radius
        ty = math.sin(ang) * circle_radius

        bm_tube = bmesh.new()
        # Hollow tube (cylinder)
        bmesh.ops.create_cone(
            bm_tube,
            cap_ends=True,
            segments=14,
            radius1=tube_radius,
            radius2=tube_radius,
            depth=length
        )
        for v in bm_tube.verts:
            # Hang from Z = 1.40 down
            v.co.z -= (length * 0.5)

        mesh_tube = bpy.data.meshes.new(f"Tube_{idx+1}_Mesh")
        bm_tube.to_mesh(mesh_tube)
        bm_tube.free()

        obj_tube = bpy.data.objects.new(f"chime_Tube_{idx+1}", mesh_tube)
        obj_tube.parent = root
        obj_tube.location = (tx, ty, 1.40)
        col.objects.link(obj_tube)
        obj_tube.data.materials.append(mat_brass)
        for poly in mesh_tube.polygons: poly.use_smooth = True

    # 4. Central Clapper Bead & Wind Sail (Z: 1.18m down to 0.75m)
    bm_clapper = bmesh.new()
    # Central turquoise glass bead
    bmesh.ops.create_uvsphere(bm_clapper, u_segments=14, v_segments=10, radius=0.035)
    for v in bm_clapper.verts:
        v.co.z += 1.18

    # Wooden wind sail paddle at bottom
    bmesh.ops.create_cone(bm_clapper, cap_ends=True, segments=12, radius1=0.045, radius2=0.01, depth=0.14)
    for v in bm_clapper.verts[-24:]:
        v.co.y *= 0.25 # flatten into paddle
        v.co.z += 0.85

    # Center string
    bmesh.ops.create_cone(bm_clapper, cap_ends=True, segments=6, radius1=0.003, radius2=0.003, depth=0.60)
    for v in bm_clapper.verts[-12:]:
        v.co.z += 1.12

    mesh_clapper = bpy.data.meshes.new("Clapper_Mesh")
    bm_clapper.to_mesh(mesh_clapper)
    bm_clapper.free()
    obj_clapper = bpy.data.objects.new("Clapper", mesh_clapper)
    obj_clapper.parent = root
    col.objects.link(obj_clapper)
    obj_clapper.data.materials.append(mat_bead)
    for poly in mesh_clapper.polygons: poly.use_smooth = True

    # Export
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects: o.select_set(True)

    dest = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/discoveries/greenhouse-wind-chime.glb"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=False, # preserve tube hierarchy for wind sway
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"Exported clean Wind Chime to: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    build()
