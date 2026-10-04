"""
blender/scripts/characters/peach-mochi-bunny.py — Master Rebuild of Peach Mochi Bunny
======================================================================================
Reference: avivly_a_cute_3d_blender_korean_nail_studio_art_creature_--ch_09943f4d-7c39-4e23-bd12-924f62a3ea28_2.png
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

def create_pbr_mat(name, hex_color, roughness=0.6, metallic=0.0, emissive_hex=None, emissive_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    out_node.location = (400, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value = hex_to_linear(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic

    if emissive_hex and emissive_strength > 0:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = hex_to_linear(emissive_hex)
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = hex_to_linear(emissive_hex)

    mat.diffuse_color = hex_to_linear(hex_color)
    return mat

def build():
    # 1. Reset scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    col = bpy.data.collections.new("PeachMochiBunny")
    bpy.context.scene.collection.children.link(col)

    # 2. Materials (glTF-Safe standard PBR)
    # Body: Soft Warm Pastel Candy Peach Pink (#FFAEB9), velvety roughness 0.75
    mat_body = create_pbr_mat("M_PeachBody", "#FFAEB9", roughness=0.75)
    # Ears & Limbs: Smooth Candy Satin Pink (#FF9EAE), roughness 0.32
    mat_candy = create_pbr_mat("M_CandyPink", "#FF9EAE", roughness=0.32)
    # Blush: Soft warm petal pink (#FF889B)
    mat_blush = create_pbr_mat("M_Blush", "#FF889B", roughness=0.65)
    # Eyes & Mouth: Glossy dark espresso chocolate (#24140E)
    mat_dark = create_pbr_mat("M_DarkEspresso", "#24140E", roughness=0.10)
    # Eye Sparkle Highlight (#FFFFFF)
    mat_sparkle = create_pbr_mat("M_Sparkle", "#FFFFFF", roughness=0.05, emissive_hex="#FFFFFF", emissive_strength=0.8)

    # -------------------------------------------------------------------------
    # 3. ROOT & SKELETON EMPTIES (Game Contract)
    # -------------------------------------------------------------------------
    def empty(name, loc, parent=None):
        emp = bpy.data.objects.new(name, None)
        emp.empty_display_type = 'PLAIN_AXES'
        emp.empty_display_size = 0.10
        emp.location = loc
        if parent:
            emp.parent = parent
        col.objects.link(emp)
        return emp

    root_empty = empty("eliya_Root", (0, 0, 0))
    # Head empty pivot at Z = 0.56 (where face and ears attach)
    head_empty = empty("eliya_Head", (0, 0, 0.56), parent=root_empty)

    arm_l_empty = empty("eliya_LeftArm", (-0.31, -0.01, 0.44), parent=root_empty)
    arm_r_empty = empty("eliya_RightArm", (0.31, -0.01, 0.44), parent=root_empty)

    leg_l_empty = empty("eliya_LeftLeg", (-0.075, 0.0, 0.16), parent=root_empty)
    leg_r_empty = empty("eliya_RightLeg", (0.075, 0.0, 0.16), parent=root_empty)

    # Ears attach at top of head (world Z ~ 0.80 -> relative to head_empty at 0.56 is Z = 0.24)
    ear_l_empty = empty("eliya_EarL", (-0.075, 0.01, 0.24), parent=head_empty)
    ear_r_empty = empty("eliya_EarR", (0.075, 0.01, 0.24), parent=head_empty)

    tray_socket = empty("eliya_TraySocket", (0, -0.34, 0.44), parent=root_empty)

    # -------------------------------------------------------------------------
    # 4. BODY MESH (Broad, plump marshmallow dome matching reference)
    # -------------------------------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=28, radius=0.35)

    # Height: Z=0.15 to Z=0.85 (height 0.70m)
    # Width X: 0.62m (radius 0.31m)
    # Depth Y: 0.54m (radius 0.27m)
    for v in bm.verts:
        norm_z = (v.co.z + 0.35) / 0.70  # 0.0 to 1.0

        if norm_z < 0.18:
            world_z = 0.15 + (norm_z / 0.18) * 0.08  # soft bottom curve
        elif norm_z < 0.78:
            world_z = 0.23 + ((norm_z - 0.18) / 0.60) * 0.47  # plump upright marshmallow body
        else:
            world_z = 0.70 + ((norm_z - 0.78) / 0.22) * 0.15  # broad dome top

        v.co.x = (v.co.x / 0.35) * 0.315
        v.co.y = (v.co.y / 0.35) * 0.275
        v.co.z = world_z

        # Plump squircle curvature
        sx = 1.0 if v.co.x >= 0 else -1.0
        sy = 1.0 if v.co.y >= 0 else -1.0
        v.co.x = sx * (abs(v.co.x) ** 0.88) * (0.315 ** 0.12)
        v.co.y = sy * (abs(v.co.y) ** 0.88) * (0.275 ** 0.12)

        # Gentle dome taper only at the very top (above 0.70)
        if world_z > 0.70:
            t = (world_z - 0.70) / 0.15
            taper = 1.0 - 0.18 * (t ** 1.3)
            v.co.x *= taper
            v.co.y *= taper

        # Gentle curve at bottom (below 0.24)
        if world_z < 0.24:
            t = (0.24 - world_z) / 0.09
            taper = 1.0 - 0.15 * (t ** 1.2)
            v.co.x *= taper
            v.co.y *= taper

    mesh_body = bpy.data.meshes.new("Body_Mesh")
    bm.to_mesh(mesh_body)
    bm.free()

    obj_body = bpy.data.objects.new("Body", mesh_body)
    obj_body.parent = root_empty
    col.objects.link(obj_body)
    obj_body.data.materials.append(mat_body)

    subsurf = obj_body.modifiers.new("Subsurf", type="SUBSURF")
    subsurf.levels = 1
    subsurf.render_levels = 1

    for poly in mesh_body.polygons:
        poly.use_smooth = True

    bpy.context.view_layer.objects.active = obj_body
    obj_body.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Subsurf")

    print(f"Body Mesh Vertex Count: {len(obj_body.data.vertices)} (Requirement >= 1500)")

    # -------------------------------------------------------------------------
    # 5. EARS (Tall, thick, plump sausage capsules touching top of head)
    # -------------------------------------------------------------------------
    def create_ear(name, parent_empty, rot_euler):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=20, radius=0.082)
        # Stretch into tall plump sausage with base embedded into head
        for v in bm.verts:
            if v.co.z >= 0:
                v.co.z = 0.08 + v.co.z * 2.35  # top dome reaches +0.27
            else:
                v.co.z = 0.08 + v.co.z * 1.10  # bottom dome penetrates head
            v.co.y *= 0.88

        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        bm.to_mesh(mesh)
        bm.free()

        ear = bpy.data.objects.new(name, mesh)
        ear.parent = parent_empty
        ear.location = (0, 0, 0)
        ear.rotation_euler = rot_euler
        col.objects.link(ear)
        ear.data.materials.append(mat_candy)

        for poly in ear.data.polygons:
            poly.use_smooth = True
        return ear

    # Plump upright ears with slight backward tilt matching reference
    ear_l = create_ear("Ear_L", ear_l_empty, Euler((math.radians(5), math.radians(-2), math.radians(1)), 'XYZ'))
    ear_r = create_ear("Ear_R", ear_r_empty, Euler((math.radians(5), math.radians(2), math.radians(-1)), 'XYZ'))

    # -------------------------------------------------------------------------
    # 6. LIMBS (Snug rounded nub arms, smooth teardrop feet)
    # -------------------------------------------------------------------------
    def create_arm(name, parent_empty, rot_euler):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=0.062)
        for v in bm.verts:
            v.co.x *= 1.15
            v.co.y *= 0.95
            v.co.z *= 0.90
        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        bm.to_mesh(mesh)
        bm.free()
        arm = bpy.data.objects.new(name, mesh)
        arm.parent = parent_empty
        arm.location = (0, 0, 0)
        arm.rotation_euler = rot_euler
        col.objects.link(arm)
        arm.data.materials.append(mat_candy)
        for poly in mesh.polygons: poly.use_smooth = True
        return arm

    arm_l = create_arm("Arm_L", arm_l_empty, Euler((math.radians(12), math.radians(-10), math.radians(5)), 'XYZ'))
    arm_r = create_arm("Arm_R", arm_r_empty, Euler((math.radians(12), math.radians(10), math.radians(-5)), 'XYZ'))

    def create_foot(name, parent_empty, rot_euler):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=22, v_segments=16, radius=0.065)
        for v in bm.verts:
            if v.co.z < 0:
                v.co.z *= 1.40
                v.co.x *= 0.85
                v.co.y *= 0.90
            else:
                v.co.z *= 0.65
            v.co.y *= 1.10
        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        bm.to_mesh(mesh)
        bm.free()
        foot = bpy.data.objects.new(name, mesh)
        foot.parent = parent_empty
        foot.location = (0, 0, 0)
        foot.rotation_euler = rot_euler
        col.objects.link(foot)
        foot.data.materials.append(mat_candy)
        for poly in mesh.polygons: poly.use_smooth = True
        return foot

    foot_l = create_foot("Foot_L", leg_l_empty, Euler((math.radians(-5), math.radians(5), 0), 'XYZ'))
    foot_r = create_foot("Foot_R", leg_r_empty, Euler((math.radians(-5), math.radians(-5), 0), 'XYZ'))

    # -------------------------------------------------------------------------
    # 7. FACE (Upper half of marshmallow body, matching reference)
    # -------------------------------------------------------------------------
    # Body surface at world Z=0.58 is at Y ~ -0.278
    def create_eye(name, rel_loc, is_left=True):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=0.034)
        for f in bm.faces:
            f.material_index = 0

        off_x = -0.012 if is_left else 0.012
        ret_sp = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.010)
        for v in ret_sp["verts"]:
            v.co.x += off_x
            v.co.y += -0.028
            v.co.z += 0.014

        sp_faces = set()
        for v in ret_sp["verts"]:
            for f in v.link_faces:
                sp_faces.add(f)
        for f in sp_faces:
            f.material_index = 1

        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        bm.to_mesh(mesh)
        bm.free()

        eye = bpy.data.objects.new(name, mesh)
        eye.parent = head_empty
        eye.location = rel_loc
        col.objects.link(eye)
        eye.data.materials.append(mat_dark)     # slot 0
        eye.data.materials.append(mat_sparkle)  # slot 1
        for poly in mesh.polygons:
            poly.use_smooth = True

        # Wink Morph Target
        eye.shape_key_add(name="Basis")
        sk_wink = eye.shape_key_add(name="wink")
        sk_wink.value = 0.0
        for pt in sk_wink.data:
            pt.co.z *= 0.08
            pt.co.y *= 0.35

        return eye

    # Head empty is at Z=0.56.
    # Eyes at relative Z = +0.02 -> world Z = 0.58.
    eye_l = create_eye("Eye_L", (-0.115, -0.265, 0.02), is_left=True)
    eye_r = create_eye("Eye_R", (0.115, -0.265, 0.02), is_left=False)

    # Inverted '人' / cleft bunny mouth right between eyes at Z = -0.01 (world Z = 0.55)
    bm_mouth = bmesh.new()
    bmesh.ops.create_uvsphere(bm_mouth, u_segments=16, v_segments=10, radius=0.018)
    for v in bm_mouth.verts:
        v.co.x *= 1.60
        v.co.z *= 0.85
        v.co.y *= 0.35
    mesh_mouth = bpy.data.meshes.new("Mouth_Mesh")
    bm_mouth.to_mesh(mesh_mouth)
    bm_mouth.free()
    mouth = bpy.data.objects.new("Mouth", mesh_mouth)
    mouth.parent = head_empty
    mouth.location = (0.0, -0.272, -0.01)
    col.objects.link(mouth)
    mouth.data.materials.append(mat_dark)
    for poly in mesh_mouth.polygons: poly.use_smooth = True

    mouth.shape_key_add(name="Basis")
    sk_smile = mouth.shape_key_add(name="smile")
    sk_smile.value = 0.0
    for pt in sk_smile.data:
        dx = pt.co.x
        pt.co.x *= 1.40
        pt.co.z += (abs(dx) * 0.32)

    # Subtle blush cheeks
    def create_blush(name, rel_loc):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.038)
        for v in bm.verts:
            v.co.y *= 0.15
            v.co.x *= 1.20
            v.co.z *= 0.85
        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        bm.to_mesh(mesh)
        bm.free()
        blush = bpy.data.objects.new(name, mesh)
        blush.parent = head_empty
        blush.location = rel_loc
        col.objects.link(blush)
        blush.data.materials.append(mat_blush)
        for poly in mesh.polygons: poly.use_smooth = True

        blush.shape_key_add(name="Basis")
        sk_b = blush.shape_key_add(name="smile")
        sk_b.value = 0.0
        for pt in sk_b.data:
            pt.co.x *= 1.20
            pt.co.z *= 1.20
        return blush

    blush_l = create_blush("Blush_L", (-0.175, -0.256, -0.02))
    blush_r = create_blush("Blush_R", (0.175, -0.256, -0.02))

    # -------------------------------------------------------------------------
    # 8. RENDER VALIDATION PREVIEWS
    # -------------------------------------------------------------------------
    preview_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/blender/previews/peach-mochi-bunny"
    os.makedirs(preview_dir, exist_ok=True)

    light_data = bpy.data.lights.new(name="PreviewSun", type='SUN')
    light_data.energy = 4.0
    light_obj = bpy.data.objects.new("PreviewSun", light_data)
    light_obj.rotation_euler = Euler((math.radians(45), math.radians(15), math.radians(-35)), 'XYZ')
    bpy.context.scene.collection.objects.link(light_obj)

    fill_data = bpy.data.lights.new(name="PreviewFill", type='SUN')
    fill_data.energy = 2.0
    fill_obj = bpy.data.objects.new("PreviewFill", fill_data)
    fill_obj.rotation_euler = Euler((math.radians(-30), math.radians(-30), math.radians(140)), 'XYZ')
    bpy.context.scene.collection.objects.link(fill_obj)

    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = 55
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.film_transparent = True

    # Front Preview (centered on bunny height ~0.60, framing full ears up to 1.15)
    cam.location = (0, -2.6, 0.62)
    cam.rotation_euler = Euler((math.radians(90), 0, 0), 'XYZ')
    bpy.context.scene.render.filepath = os.path.join(preview_dir, "front.png")
    bpy.ops.render.render(write_still=True)

    # 3/4 Preview
    cam.location = (1.4, -2.1, 0.72)
    cam.rotation_euler = Euler((math.radians(82), 0, math.radians(34)), 'XYZ')
    bpy.context.scene.render.filepath = os.path.join(preview_dir, "three-quarter.png")
    bpy.ops.render.render(write_still=True)

    # Back Preview
    cam.location = (0, 2.4, 0.62)
    cam.rotation_euler = Euler((math.radians(90), 0, math.radians(180)), 'XYZ')
    bpy.context.scene.render.filepath = os.path.join(preview_dir, "back.png")
    bpy.ops.render.render(write_still=True)

    # Wink & Smile Preview
    eye_r.data.shape_keys.key_blocks["wink"].value = 1.0
    mouth.data.shape_keys.key_blocks["smile"].value = 1.0
    blush_l.data.shape_keys.key_blocks["smile"].value = 1.0
    blush_r.data.shape_keys.key_blocks["smile"].value = 1.0
    cam.location = (0, -2.6, 0.62)
    cam.rotation_euler = Euler((math.radians(90), 0, 0), 'XYZ')
    bpy.context.scene.render.filepath = os.path.join(preview_dir, "wink.png")
    bpy.ops.render.render(write_still=True)

    # Reset morph values to 0.0 before GLB export
    eye_r.data.shape_keys.key_blocks["wink"].value = 0.0
    mouth.data.shape_keys.key_blocks["smile"].value = 0.0
    blush_l.data.shape_keys.key_blocks["smile"].value = 0.0
    blush_r.data.shape_keys.key_blocks["smile"].value = 0.0

    # -------------------------------------------------------------------------
    # 9. EXPORT GLB
    # -------------------------------------------------------------------------
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)

    export_destinations = [
        "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/characters/peach-mochi-bunny.glb",
        "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/blender/models/peach-mochi-bunny/peach-mochi-bunny.glb"
    ]

    for dest in export_destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=dest,
            export_format='GLB',
            use_selection=True,
            export_apply=True,
            export_yup=True,
            export_cameras=False,
            export_lights=False,
            export_animations=False,
            export_materials='EXPORT',
            export_morph=True
        )
        print(f"Exported clean GLB to: {dest} ({os.path.getsize(dest)} bytes)")

    blend_path = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/blender/models/peach-mochi-bunny/peach-mochi-bunny.blend"
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved blend file: {blend_path}")

if __name__ == "__main__":
    build()
