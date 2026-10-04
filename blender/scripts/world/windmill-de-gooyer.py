"""
blender/scripts/world/windmill-de-gooyer.py
===========================================
Rebuild of De Gooyer Windmill (Amsterdam Landmark)
- Total height: ~14.0 m
- Structure:
  1. Octagonal brick base (Z: 0 to 4.8 m, width 5.2 m tapering to 4.2 m)
  2. Wooden gallery/stage balcony at Z=4.8m with floor planks, railing, and diagonal struts
  3. Octagonal thatched body (Z: 5.0 to 11.2 m, tapering to 3.2 m)
  4. Cap roof (Z: 11.2 to 13.8 m) with dormer and sail shaft
  5. 4 lattice sails parented to 'windmill_Sails' node for spinning animation (span ~10.5 m)
  6. Arched doors and paned windows
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
    col = bpy.data.collections.new("WindmillDeGooyer")
    bpy.context.scene.collection.children.link(col)

    # Materials
    mat_brick = create_pbr_mat("M_BrickBase", "#8E4438", roughness=0.85)      # Warm red Dutch brick
    mat_thatch = create_pbr_mat("M_ThatchBody", "#423B36", roughness=0.90)    # Weathered dark thatch/wood
    mat_wood_dark = create_pbr_mat("M_DarkWood", "#2B221B", roughness=0.75)   # Gallery struts and beams
    mat_wood_light = create_pbr_mat("M_StagePlanks", "#7C634F", roughness=0.70) # Balcony deck
    mat_sails_wood = create_pbr_mat("M_SailWood", "#F5EFE6", roughness=0.60)  # White/cream painted lattice sails
    mat_canvas = create_pbr_mat("M_SailCloth", "#D68C45", roughness=0.80)     # Traditional ochre/tan sailcloth strips
    mat_window = create_pbr_mat("M_WindowGlass", "#6CA0B2", roughness=0.20, metallic=0.1)
    mat_trim = create_pbr_mat("M_WhiteTrim", "#E8E6DF", roughness=0.50)

    # 1. Octagonal Brick Base (Z: 0 to 4.8m)
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=8,
        radius1=2.7,
        radius2=2.2,
        depth=4.8
    )
    for v in bm.verts:
        v.co.z += 2.4
    mesh_base = bpy.data.meshes.new("BrickBase_Mesh")
    bm.to_mesh(mesh_base)
    bm.free()
    obj_base = bpy.data.objects.new("BrickBase", mesh_base)
    col.objects.link(obj_base)
    obj_base.data.materials.append(mat_brick)

    # 2. Wooden Gallery / Stage Balcony (Z: 4.8m)
    # Balcony floor (octagon, outer radius 3.5m, inner 2.1m)
    bm_gal = bmesh.new()
    bmesh.ops.create_cone(bm_gal, cap_ends=True, segments=8, radius1=3.5, radius2=3.5, depth=0.18)
    for v in bm_gal.verts:
        v.co.z += 4.85
    mesh_gal = bpy.data.meshes.new("GalleryFloor_Mesh")
    bm_gal.to_mesh(mesh_gal)
    bm_gal.free()
    obj_gal = bpy.data.objects.new("GalleryFloor", mesh_gal)
    col.objects.link(obj_gal)
    obj_gal.data.materials.append(mat_wood_light)

    # Balcony Railing (ring around 3.4m radius)
    bm_rail = bmesh.new()
    for i in range(8):
        ang1 = (i / 8.0) * math.pi * 2 + (math.pi / 8.0)
        ang2 = ((i + 1) / 8.0) * math.pi * 2 + (math.pi / 8.0)
        p1 = Vector((math.cos(ang1) * 3.4, math.sin(ang1) * 3.4, 4.9))
        p2 = Vector((math.cos(ang2) * 3.4, math.sin(ang2) * 3.4, 4.9))
        
        # Post at corner
        bmesh.ops.create_cube(bm_rail, size=0.12)
        for v in bm_rail.verts[-8:]:
            v.co.z *= 8.0
            v.co.x += p1.x
            v.co.y += p1.y
            v.co.z += 5.4

        # Top handrail
        mid = (p1 + p2) * 0.5
        seg_len = (p2 - p1).length
        bmesh.ops.create_cube(bm_rail, size=0.1)
        for v in bm_rail.verts[-8:]:
            v.co.y *= seg_len * 9.5
            v.co.x += mid.x
            v.co.y += mid.y
            v.co.z += 5.8
    mesh_rail = bpy.data.meshes.new("GalleryRail_Mesh")
    bm_rail.to_mesh(mesh_rail)
    bm_rail.free()
    obj_rail = bpy.data.objects.new("GalleryRail", mesh_rail)
    col.objects.link(obj_rail)
    obj_rail.data.materials.append(mat_wood_dark)

    # Diagonal support struts under balcony
    bm_strut = bmesh.new()
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2 + (math.pi / 8.0)
        c_x = math.cos(ang)
        c_y = math.sin(ang)
        # Strut from wall at Z=3.0 to outer rim at Z=4.8
        bmesh.ops.create_cube(bm_strut, size=0.14)
        for v in bm_strut.verts[-8:]:
            v.co.x *= 1.2
            v.co.z *= 9.0
            v.co.x += c_x * 2.6
            v.co.y += c_y * 2.6
            v.co.z += 3.9
    mesh_strut = bpy.data.meshes.new("GalleryStruts_Mesh")
    bm_strut.to_mesh(mesh_strut)
    bm_strut.free()
    obj_strut = bpy.data.objects.new("GalleryStruts", mesh_strut)
    col.objects.link(obj_strut)
    obj_strut.data.materials.append(mat_wood_dark)

    # 3. Octagonal Thatched Upper Tower (Z: 4.9 to 11.4 m)
    bm_thatch = bmesh.new()
    bmesh.ops.create_cone(
        bm_thatch,
        cap_ends=True,
        segments=8,
        radius1=2.1,
        radius2=1.5,
        depth=6.5
    )
    for v in bm_thatch.verts:
        v.co.z += 8.15
    mesh_thatch = bpy.data.meshes.new("ThatchBody_Mesh")
    bm_thatch.to_mesh(mesh_thatch)
    bm_thatch.free()
    obj_thatch = bpy.data.objects.new("ThatchBody", mesh_thatch)
    col.objects.link(obj_thatch)
    obj_thatch.data.materials.append(mat_thatch)

    # 4. Cap Roof (Z: 11.4 to 13.8 m)
    bm_cap = bmesh.new()
    bmesh.ops.create_cone(
        bm_cap,
        cap_ends=True,
        segments=12,
        radius1=1.65,
        radius2=0.3,
        depth=2.4
    )
    for v in bm_cap.verts:
        v.co.z += 12.6
        # Slight dome / curb roof curve
        if v.co.z > 12.8:
            v.co.x *= 1.15
            v.co.y *= 1.15
    mesh_cap = bpy.data.meshes.new("CapRoof_Mesh")
    bm_cap.to_mesh(mesh_cap)
    bm_cap.free()
    obj_cap = bpy.data.objects.new("CapRoof", mesh_cap)
    col.objects.link(obj_cap)
    obj_cap.data.materials.append(mat_thatch)

    # Cap dormer & wind shaft housing facing front (-Y)
    bm_shaft = bmesh.new()
    bmesh.ops.create_cube(bm_shaft, size=0.6)
    for v in bm_shaft.verts:
        v.co.y *= 1.6
        v.co.z *= 0.8
        v.co.y -= 1.6
        v.co.z += 12.4
    mesh_shaft = bpy.data.meshes.new("ShaftHousing_Mesh")
    bm_shaft.to_mesh(mesh_shaft)
    bm_shaft.free()
    obj_shaft = bpy.data.objects.new("ShaftHousing", mesh_shaft)
    col.objects.link(obj_shaft)
    obj_shaft.data.materials.append(mat_wood_dark)

    # 5. Doors & Windows
    # Main arched entrance door at base (front -Y)
    bm_door = bmesh.new()
    bmesh.ops.create_cube(bm_door, size=1.0)
    for v in bm_door.verts:
        v.co.x *= 0.55
        v.co.y *= 0.1
        v.co.z *= 1.05
        v.co.y -= 2.65
        v.co.z += 1.1
    mesh_door = bpy.data.meshes.new("MainDoor_Mesh")
    bm_door.to_mesh(mesh_door)
    bm_door.free()
    obj_door = bpy.data.objects.new("MainDoor", mesh_door)
    col.objects.link(obj_door)
    obj_door.data.materials.append(mat_wood_dark)

    # Windows on upper tower (Z=7.5m and Z=9.5m)
    bm_win = bmesh.new()
    for z_pos in [7.2, 9.4]:
        for y_sign in [-1, 1]:
            bmesh.ops.create_cube(bm_win, size=0.45)
            for v in bm_win.verts[-8:]:
                v.co.x *= 0.7
                v.co.y *= 0.1
                v.co.z *= 1.1
                v.co.y += y_sign * (1.95 - (z_pos - 7.0) * 0.08)
                v.co.z += z_pos
    mesh_win = bpy.data.meshes.new("Windows_Mesh")
    bm_win.to_mesh(mesh_win)
    bm_win.free()
    obj_win = bpy.data.objects.new("Windows", mesh_win)
    col.objects.link(obj_win)
    obj_win.data.materials.append(mat_window)

    # -------------------------------------------------------------------------
    # 6. ROTATING NODE: windmill_Sails (Pivot at Z=12.4m, Y=-1.75m)
    # -------------------------------------------------------------------------
    # Node name windmill_Sails is spun in game update loop
    sails_pivot = bpy.data.objects.new("windmill_Sails", None)
    sails_pivot.empty_display_type = 'PLAIN_AXES'
    sails_pivot.empty_display_size = 0.5
    sails_pivot.location = (0, -1.85, 12.4)
    # Slight upward tilt of windmill axle (~10 degrees)
    sails_pivot.rotation_euler = Euler((math.radians(-10), 0, 0), 'XYZ')
    col.objects.link(sails_pivot)

    # Center Hub / Axle
    bm_hub = bmesh.new()
    bmesh.ops.create_cone(bm_hub, cap_ends=True, segments=16, radius1=0.45, radius2=0.35, depth=0.6)
    for v in bm_hub.verts:
        # Orient along Y
        y = v.co.z
        z = v.co.y
        v.co.y = y - 0.25
        v.co.z = z
    mesh_hub = bpy.data.meshes.new("Hub_Mesh")
    bm_hub.to_mesh(mesh_hub)
    bm_hub.free()
    obj_hub = bpy.data.objects.new("SailHub", mesh_hub)
    obj_hub.parent = sails_pivot
    col.objects.link(obj_hub)
    obj_hub.data.materials.append(mat_wood_dark)

    # 4 Lattice Sails (Stocks + Hemellatten lattice bars + Cloth)
    bm_sails = bmesh.new()
    sail_radius = 5.2  # Total span 10.4 m

    for i in range(4):
        ang = i * (math.pi / 2.0)
        c_a = math.cos(ang)
        s_a = math.sin(ang)

        # Main Stock beam
        bmesh.ops.create_cube(bm_sails, size=0.16)
        for v in bm_sails.verts[-8:]:
            # Along radial direction
            v.co.z *= (sail_radius * 0.5)
            # Offset along stock
            v.co.z += (sail_radius * 0.5) + 0.3
            # Rotate by sail angle
            curr_x = v.co.x
            curr_z = v.co.z
            v.co.x = curr_x * c_a - curr_z * s_a
            v.co.z = curr_x * s_a + curr_z * c_a
            v.co.y -= 0.15

        # Lattice crossbars and sailcloth
        for r_bar in range(6, 24, 2):
            dist = r_bar * 0.22
            # Crossbar perpendicular to stock
            bmesh.ops.create_cube(bm_sails, size=0.04)
            for v in bm_sails.verts[-8:]:
                v.co.x *= 18.0  # bar length ~0.72m
                v.co.y *= 1.2
                v.co.x += 0.36
                v.co.z += dist
                # Rotate
                cx = v.co.x
                cz = v.co.z
                v.co.x = cx * c_a - cz * s_a
                v.co.z = cx * s_a + cz * c_a
                v.co.y -= 0.18

        # Sailcloth strip on one half of lattice
        bmesh.ops.create_cube(bm_sails, size=0.02)
        for v in bm_sails.verts[-8:]:
            v.co.x *= 26.0  # 0.52m wide cloth
            v.co.z *= 85.0  # 1.7m length
            v.co.x += 0.32
            v.co.z += 2.8
            cx = v.co.x
            cz = v.co.z
            v.co.x = cx * c_a - cz * s_a
            v.co.z = cx * s_a + cz * c_a
            v.co.y -= 0.20

    mesh_sails = bpy.data.meshes.new("Sails_Mesh")
    bm_sails.to_mesh(mesh_sails)
    bm_sails.free()
    obj_sails = bpy.data.objects.new("SailsLattice", mesh_sails)
    obj_sails.parent = sails_pivot
    col.objects.link(obj_sails)
    obj_sails.data.materials.append(mat_sails_wood)

    # -------------------------------------------------------------------------
    # EXPORT GLB
    # -------------------------------------------------------------------------
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)

    dest = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/world/windmill-de-gooyer.glb"
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=False, # preserve hierarchy and parent-child transforms for animation
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_materials='EXPORT'
    )
    print(f"Exported clean Windmill to: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    build()
