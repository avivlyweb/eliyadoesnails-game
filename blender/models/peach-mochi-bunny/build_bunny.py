"""
Blender 5.2 Python Script: Generate 3D Korean Nail Studio Velvet Peach Mochi Bunny
Model: Peach Mochi Bunny Creature - Master Pass V2
Matches reference image: Warm strawberry-peach velvet body, plump satin ears, glossy dark eyes & mouth, snug jellybean feet.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not bpy.data.collections:
        col = bpy.data.collections.new("Scene Collection")
        bpy.context.scene.collection.children.link(col)

def hex_to_linear(hex_str):
    hex_str = hex_str.lstrip('#')
    s_r = int(hex_str[0:2], 16) / 255.0
    s_g = int(hex_str[2:4], 16) / 255.0
    s_b = int(hex_str[4:6], 16) / 255.0
    def to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.2
    return (to_linear(s_r), to_linear(s_g), to_linear(s_b), 1.0)

def create_pbr_material(name, base_color_hex, roughness=0.5, metallic=0.0, sss_weight=0.0, sss_radius=(0.5, 0.25, 0.15), coat_weight=0.0, bump_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    tree = mat.node_tree
    tree.nodes.clear()
    
    output = tree.nodes.new(type="ShaderNodeOutputMaterial")
    output.location = (400, 0)
    
    bsdf = tree.nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    
    bsdf.inputs["Base Color"].default_value = hex_to_linear(base_color_hex)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = sss_weight
    if "Subsurface Radius" in bsdf.inputs:
        bsdf.inputs["Subsurface Radius"].default_value = sss_radius
        
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat_weight
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.04
        
    if bump_strength > 0:
        tex_noise = tree.nodes.new(type="ShaderNodeTexNoise")
        tex_noise.location = (-400, -150)
        tex_noise.inputs["Scale"].default_value = 350.0
        tex_noise.inputs["Detail"].default_value = 6.0
        tex_noise.inputs["Roughness"].default_value = 0.70
        
        bump = tree.nodes.new(type="ShaderNodeBump")
        bump.location = (-150, -150)
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.002
        
        tree.links.new(tex_noise.outputs["Fac"], bump.inputs["Height"])
        tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        
    return mat

def create_materials():
    mats = {}
    # 1. Fuzzy Velvet Peach Body (rich strawberry peach flocking with warm SSS)
    mats["body"] = create_pbr_material("M_Velvet_Peach", "#f89587", roughness=0.72, sss_weight=0.45, sss_radius=(0.95, 0.45, 0.35), bump_strength=0.15)
    # 2. Smooth Satin Ears & Paws (contrasting glossy peach gumdrop texture)
    mats["satin"] = create_pbr_material("M_Satin_Peach", "#f2796a", roughness=0.20, sss_weight=0.35, coat_weight=0.60)
    # 3. Dark Chocolate Bead Eyes & Mouth (deep glossy espresso)
    mats["eyes_mouth"] = create_pbr_material("M_Glossy_Espresso", "#22110a", roughness=0.02, coat_weight=1.0)
    # 4. Cheeks Blush (soft coral rose)
    mats["blush"] = create_pbr_material("M_Blush_Coral", "#e85f54", roughness=0.50, sss_weight=0.60)
    # 5. Studio Backdrop Floor
    mats["backdrop"] = create_pbr_material("M_Studio_Backdrop", "#79b4dc", roughness=0.55)
    return mats

def build_model(mats):
    # ----------------------------------------------------
    # 1. BODY (Tapered Dome-Loaf with squishy squircle profile)
    # ----------------------------------------------------
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    
    for v in bm.verts:
        v.co.x *= 0.52
        v.co.y *= 0.46
        v.co.z *= 0.58
        v.co.z += 0.48
        
        # Gentle dome taper to top (Z > 0.48)
        if v.co.z > 0.48:
            t = (v.co.z - 0.48) / 0.29
            factor = 1.0 - 0.18 * t
            v.co.x *= factor
            v.co.y *= factor
            
    mesh_body = bpy.data.meshes.new("Body_Mesh")
    bm.to_mesh(mesh_body)
    bm.free()
    
    body = bpy.data.objects.new("Body", mesh_body)
    bpy.context.scene.collection.objects.link(body)
    
    bev = body.modifiers.new("Bevel", type="BEVEL")
    bev.width = 0.17
    bev.segments = 8
    bev.profile = 0.74
    
    subsurf = body.modifiers.new("Subsurf", type="SUBSURF")
    subsurf.levels = 2
    
    body.data.materials.append(mats["body"])
    for p in body.data.polygons: p.use_smooth = True
    
    # ----------------------------------------------------
    # 2. EARS (Plump Elongated Rounded Cylinders atop the curved head dome)
    # ----------------------------------------------------
    def create_ear(name, pos, rot_y):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.070, depth=0.25, vertices=32, location=pos)
        ear = bpy.context.active_object
        ear.name = name
        ear.scale = (0.92, 0.86, 1.25)
        ear.rotation_euler = Euler((0, math.radians(rot_y), 0), 'XYZ')
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        
        bev_ear = ear.modifiers.new("Bevel", type="BEVEL")
        bev_ear.width = 0.058
        bev_ear.segments = 6
        
        sub_ear = ear.modifiers.new("Subsurf", type="SUBSURF")
        sub_ear.levels = 2
        
        ear.data.materials.append(mats["satin"])
        for p in ear.data.polygons: p.use_smooth = True
        return ear

    ear_l = create_ear("Ear_L", (-0.065, -0.015, 0.88), -2.2)
    ear_r = create_ear("Ear_R", (0.065, -0.015, 0.88), 2.2)
    
    # ----------------------------------------------------
    # 3. FACE (Eyes, Inverted-Y Mouth, Soft Blush)
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.022, location=(-0.088, -0.232, 0.54))
    eye_l = bpy.context.active_object
    eye_l.name = "Eye_L"
    eye_l.scale = (1.0, 0.65, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    eye_l.data.materials.append(mats["eyes_mouth"])
    for p in eye_l.data.polygons: p.use_smooth = True
    
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.022, location=(0.088, -0.232, 0.54))
    eye_r = bpy.context.active_object
    eye_r.name = "Eye_R"
    eye_r.scale = (1.0, 0.65, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    eye_r.data.materials.append(mats["eyes_mouth"])
    for p in eye_r.data.polygons: p.use_smooth = True

    # Mouth: Smooth organic inverted-Y (人 shape)
    # Central soft sphere
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.009, location=(0, -0.236, 0.536))
    mouth_top = bpy.context.active_object
    mouth_top.scale = (1.0, 0.7, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    mouth_top.data.materials.append(mats["eyes_mouth"])

    # Left wing
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0075, depth=0.028, vertices=16, location=(-0.012, -0.234, 0.522))
    wing_l = bpy.context.active_object
    wing_l.rotation_euler = Euler((0, math.radians(45), 0), 'XYZ')
    bpy.ops.object.transform_apply(rotation=True)
    bev_w1 = wing_l.modifiers.new("Bevel", type="BEVEL")
    bev_w1.width = 0.004
    bev_w1.segments = 3
    wing_l.data.materials.append(mats["eyes_mouth"])

    # Right wing
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0075, depth=0.028, vertices=16, location=(0.012, -0.234, 0.522))
    wing_r = bpy.context.active_object
    wing_r.rotation_euler = Euler((0, math.radians(-45), 0), 'XYZ')
    bpy.ops.object.transform_apply(rotation=True)
    bev_w2 = wing_r.modifiers.new("Bevel", type="BEVEL")
    bev_w2.width = 0.004
    bev_w2.segments = 3
    wing_r.data.materials.append(mats["eyes_mouth"])

    # Join mouth elements
    bpy.ops.object.select_all(action='DESELECT')
    mouth_top.select_set(True)
    wing_l.select_set(True)
    wing_r.select_set(True)
    bpy.context.view_layer.objects.active = mouth_top
    bpy.ops.object.join()
    mouth = bpy.context.active_object
    mouth.name = "Mouth"
    for p in mouth.data.polygons: p.use_smooth = True

    # Soft Cheek Blush Decals
    def create_blush(name, pos):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.004, vertices=24, location=pos)
        b = bpy.context.active_object
        b.name = name
        b.scale = (1.2, 0.8, 1.0)
        b.rotation_euler = Euler((math.radians(90), 0, 0), 'XYZ')
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        b.data.materials.append(mats["blush"])
        for p in b.data.polygons: p.use_smooth = True
        return b

    blush_l = create_blush("Blush_L", (-0.138, -0.225, 0.51))
    blush_r = create_blush("Blush_R", (0.138, -0.225, 0.51))

    # ----------------------------------------------------
    # 4. ARMS / PAWS (Smooth Peach Nubs on sides)
    # ----------------------------------------------------
    def create_arm(name, pos, rot_y):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.052, location=pos)
        arm = bpy.context.active_object
        arm.name = name
        arm.scale = (0.72, 1.25, 0.88)
        arm.rotation_euler = Euler((math.radians(10), math.radians(rot_y), 0), 'XYZ')
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        arm.data.materials.append(mats["satin"])
        for p in arm.data.polygons: p.use_smooth = True
        return arm

    arm_l = create_arm("Arm_L", (-0.258, -0.025, 0.42), 12.0)
    arm_r = create_arm("Arm_R", (0.258, -0.025, 0.42), -12.0)

    # ----------------------------------------------------
    # 5. LEGS / FEET (Snug jellybean paws under the body base)
    # ----------------------------------------------------
    def create_foot(name, pos):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.065, location=pos)
        foot = bpy.context.active_object
        foot.name = name
        foot.scale = (0.85, 1.20, 0.95)
        foot.rotation_euler = Euler((math.radians(5), 0, 0), 'XYZ')
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        foot.data.materials.append(mats["satin"])
        for p in foot.data.polygons: p.use_smooth = True
        return foot

    foot_l = create_foot("Foot_L", (-0.058, -0.015, 0.17))
    foot_r = create_foot("Foot_R", (0.058, -0.015, 0.17))

    # ----------------------------------------------------
    # 6. KINEMATIC SOCKET RIGGING HIERARCHY
    # ----------------------------------------------------
    def create_socket(name, location):
        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = 'PLAIN_AXES'
        empty.empty_display_size = 0.08
        empty.location = location
        bpy.context.scene.collection.objects.link(empty)
        return empty

    root = create_socket("eliya_Root", (0, 0, 0))
    socket_head = create_socket("eliya_Head", (0, 0, 0.55))
    socket_arm_l = create_socket("eliya_LeftArm", (-0.25, -0.02, 0.42))
    socket_arm_r = create_socket("eliya_RightArm", (0.25, -0.02, 0.42))
    socket_leg_l = create_socket("eliya_LeftLeg", (-0.058, -0.015, 0.18))
    socket_leg_r = create_socket("eliya_RightLeg", (0.058, -0.015, 0.18))
    socket_tray = create_socket("eliya_TraySocket", (0, -0.26, 0.42))

    def parent_keep_transform(child, parent):
        bpy.context.view_layer.update()
        child.parent = parent
        child.matrix_parent_inverse = parent.matrix_world.inverted()

    # Parent sockets to root
    for s in [socket_head, socket_arm_l, socket_arm_r, socket_leg_l, socket_leg_r, socket_tray]:
        parent_keep_transform(s, root)

    # Parent body to root
    parent_keep_transform(body, root)

    # Parent head elements to socket_head
    for obj in [ear_l, ear_r, eye_l, eye_r, mouth, blush_l, blush_r]:
        parent_keep_transform(obj, socket_head)

    # Parent limbs to respective sockets
    parent_keep_transform(arm_l, socket_arm_l)
    parent_keep_transform(arm_r, socket_arm_r)
    parent_keep_transform(foot_l, socket_leg_l)
    parent_keep_transform(foot_r, socket_leg_r)

    # ----------------------------------------------------
    # 7. STUDIO BACKDROP
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0, 0, 0))
    backdrop = bpy.context.active_object
    backdrop.name = "Studio_Backdrop"
    backdrop.data.materials.append(mats["backdrop"])

    return root

def main():
    clear_scene()
    
    # World Background Color: Korean pastel sky blue
    world = bpy.data.worlds.new("Studio_World")
    bpy.context.scene.world = world
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs["Color"].default_value = hex_to_linear("#79b4dc")
        bg_node.inputs["Strength"].default_value = 1.0

    mats = create_materials()
    root = build_model(mats)
    
    # Studio Lighting setup
    light_key = bpy.data.lights.new(name="Light_Key", type='AREA')
    light_key.energy = 420.0
    light_key.size = 1.4
    light_key.color = (1.0, 0.98, 0.96)
    light_obj = bpy.data.objects.new("Light_Key", light_key)
    light_obj.location = (-1.6, -2.4, 2.0)
    light_obj.rotation_euler = Euler((math.radians(52), 0, math.radians(-34)), 'XYZ')
    bpy.context.scene.collection.objects.link(light_obj)

    light_fill = bpy.data.lights.new(name="Light_Fill", type='AREA')
    light_fill.energy = 160.0
    light_fill.size = 1.8
    light_fill.color = (0.85, 0.93, 1.0)
    fill_obj = bpy.data.objects.new("Light_Fill", light_fill)
    fill_obj.location = (1.8, -1.8, 1.2)
    fill_obj.rotation_euler = Euler((math.radians(50), 0, math.radians(45)), 'XYZ')
    bpy.context.scene.collection.objects.link(fill_obj)

    light_rim = bpy.data.lights.new(name="Light_Rim", type='AREA')
    light_rim.energy = 280.0
    light_rim.size = 1.2
    light_rim.color = (1.0, 0.92, 0.95)
    rim_obj = bpy.data.objects.new("Light_Rim", light_rim)
    rim_obj.location = (0.0, 2.0, 1.6)
    rim_obj.rotation_euler = Euler((math.radians(-48), 0, 0), 'XYZ')
    bpy.context.scene.collection.objects.link(rim_obj)

    # Camera framing 1:1 square centered on character
    cam_data = bpy.data.cameras.new(name="Studio_Camera")
    cam_data.lens = 52
    cam_obj = bpy.data.objects.new("Studio_Camera", cam_data)
    cam_obj.location = (0, -2.35, 0.52)
    cam_obj.rotation_euler = Euler((math.radians(90), 0, 0), 'XYZ')
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Render settings: 1024x1024
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.resolution_percentage = 100

    out_dir = os.path.dirname(os.path.abspath(__file__))
    blend_path = os.path.join(out_dir, "peach-mochi-bunny.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved blend file to: {blend_path}")
    
    # Hide backdrop before GLB export
    backdrop = bpy.data.objects.get("Studio_Backdrop")
    if backdrop:
        backdrop.hide_render = True
        backdrop.hide_set(True)

    # Export standalone character GLB
    glb_path = os.path.join(out_dir, "peach-mochi-bunny.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=False,
        export_materials='EXPORT'
    )
    print(f"Exported GLB to: {glb_path}")

    # Unhide backdrop for Blender viewport session
    if backdrop:
        backdrop.hide_set(False)

if __name__ == "__main__":
    main()
