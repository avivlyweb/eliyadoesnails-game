"""
Blender 5.2 Python Script: Generate High-Fidelity 3D Stylized Game Mascot
Character: Eliya Cloud Afro Mascot (Nail Studio Artisan) - V2 Precision Pass
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
    
    linear_color = hex_to_linear(base_color_hex)
    bsdf.inputs["Base Color"].default_value = linear_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = sss_weight
    if "Subsurface Radius" in bsdf.inputs:
        bsdf.inputs["Subsurface Radius"].default_value = sss_radius
        
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat_weight
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.03
        
    if bump_strength > 0:
        tex_noise = tree.nodes.new(type="ShaderNodeTexNoise")
        tex_noise.location = (-400, -150)
        tex_noise.inputs["Scale"].default_value = 280.0
        tex_noise.inputs["Detail"].default_value = 4.0
        tex_noise.inputs["Roughness"].default_value = 0.6
        
        bump = tree.nodes.new(type="ShaderNodeBump")
        bump.location = (-150, -150)
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.002
        
        tree.links.new(tex_noise.outputs["Fac"], bump.inputs["Height"])
        tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        
    return mat

def create_materials():
    materials = {}
    # Hair: Rich matte charcoal black with micro-leatherette texture
    materials["hair"] = create_pbr_material("M_Afro_Hair", "#1e1e20", roughness=0.72, bump_strength=0.15)
    # Headband: Soft cream linen
    materials["headband"] = create_pbr_material("M_Headband", "#f0e6da", roughness=0.52)
    # Skin: Warm caramel peach with SSS
    materials["skin"] = create_pbr_material("M_Peach_Skin", "#d89c7d", roughness=0.45, sss_weight=0.36, sss_radius=(0.85, 0.45, 0.3))
    # Nose blush: Soft coral rose
    materials["nose"] = create_pbr_material("M_Nose_Blush", "#d66955", roughness=0.40, sss_weight=0.45)
    # Eyes: Glossy piano black
    materials["eyes"] = create_pbr_material("M_Glossy_Eyes", "#08080a", roughness=0.02, coat_weight=1.0)
    # Dress: Dark slate charcoal coat
    materials["dress"] = create_pbr_material("M_Slate_Coat", "#404248", roughness=0.65, bump_strength=0.05)
    # Dress trim: Lighter warm grey hem band
    materials["dress_trim"] = create_pbr_material("M_Dress_Trim", "#7d7e85", roughness=0.60)
    # Boots: Bright tangerine orange
    materials["boots"] = create_pbr_material("M_Orange_Boots", "#ff5900", roughness=0.25, coat_weight=0.35)
    return materials

def build_character(mats):
    # Proportions:
    # Total Height ~ 1.15m
    # Ground at Z = 0
    # Boots: Z 0.0 to 0.10
    # Legs: Z 0.10 to 0.23
    # Dress: Z 0.22 to 0.54
    # Collar: Z 0.52 to 0.58
    # Head center: (0, 0, 0.68)
    
    # ----------------------------------------------------
    # 1. HEAD & FACE
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.175, location=(0, -0.015, 0.68))
    head = bpy.context.active_object
    head.name = "Head"
    head.scale = (1.26, 1.02, 0.88)
    bpy.ops.object.transform_apply(scale=True)
    head.data.materials.append(mats["skin"])
    for p in head.data.polygons: p.use_smooth = True
    sub_head = head.modifiers.new("Subsurf", type="SUBSURF")
    sub_head.levels = 2

    # ----------------------------------------------------
    # 2. NOSE
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.011, location=(0, -0.192, 0.668))
    nose = bpy.context.active_object
    nose.name = "Nose"
    nose.scale = (1.1, 0.8, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    nose.data.materials.append(mats["nose"])
    for p in nose.data.polygons: p.use_smooth = True
    sub_nose = nose.modifiers.new("Subsurf", type="SUBSURF")
    sub_nose.levels = 1

    # ----------------------------------------------------
    # 3. EYES & EYELASHES (Bilateral)
    # ----------------------------------------------------
    eye_x = 0.122
    eye_y = -0.180
    eye_z = 0.690
    
    for side in [1, -1]:
        # Eye button
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, radius=0.031, location=(side * eye_x, eye_y, eye_z))
        eye = bpy.context.active_object
        eye.name = f"Eye_{'R' if side > 0 else 'L'}"
        eye.scale = (0.95, 0.55, 1.05)
        eye.rotation_euler = (math.radians(-6), math.radians(side * 6), math.radians(side * -8))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        eye.data.materials.append(mats["eyes"])
        for p in eye.data.polygons: p.use_smooth = True
        sub_eye = eye.modifiers.new("Subsurf", type="SUBSURF")
        sub_eye.levels = 1
        
        # Upper outer eyelash flick
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.0030, depth=0.020, location=(side * (eye_x + 0.030), eye_y - 0.003, eye_z + 0.022))
        lash1 = bpy.context.active_object
        lash1.name = f"Lash1_{'R' if side > 0 else 'L'}"
        lash1.rotation_euler = (math.radians(22), math.radians(side * -50), math.radians(side * 38))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        lash1.data.materials.append(mats["eyes"])
        for p in lash1.data.polygons: p.use_smooth = True

        # Lower outer eyelash flick
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.0026, depth=0.015, location=(side * (eye_x + 0.033), eye_y - 0.002, eye_z + 0.010))
        lash2 = bpy.context.active_object
        lash2.name = f"Lash2_{'R' if side > 0 else 'L'}"
        lash2.rotation_euler = (math.radians(12), math.radians(side * -80), math.radians(side * 18))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        lash2.data.materials.append(mats["eyes"])
        for p in lash2.data.polygons: p.use_smooth = True

    # ----------------------------------------------------
    # 4. AFRO BUBBLE CLOUD HAIR (Volumetric Spherical Cloud)
    # ----------------------------------------------------
    # In the reference image, the hair is a glorious, rounded cloud afro
    # (wide, puffy, spherical) framing the face with dozens of bubbly curl nodules.
    
    hair_objs = []
    
    # 1. Core volume blocking the interior
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, radius=0.28, location=(0, 0.06, 0.78))
    core1 = bpy.context.active_object
    core1.scale = (1.30, 0.90, 0.95)
    bpy.ops.object.transform_apply(scale=True)
    hair_objs.append(core1)
    
    # 2. Surface curl bubbles distributed organically over the cloud shell
    surface_curls = []
    
    # Mathematical distribution over spherical shell
    import random
    random.seed(42) # Deterministic high quality distribution
    
    num_lat = 7
    for lat_i in range(num_lat):
        v = (lat_i + 0.5) / num_lat # 0 to 1
        theta = (v - 0.5) * math.pi * 0.85 # -75 deg to +75 deg
        num_lon = int(14 * math.cos(theta)) + 4
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        
        for lon_i in range(num_lon):
            phi = (lon_i / num_lon) * 2.0 * math.pi
            # Local coordinates on afro cloud ellipsoid
            # Dimensions: Width Rx=0.38, Depth Ry=0.25, Height Rz=0.28
            rx = 0.38
            ry = 0.25
            rz = 0.27
            
            px = rx * cos_t * math.sin(phi)
            py = 0.06 - ry * cos_t * math.cos(phi)
            pz = 0.78 + rz * sin_t
            
            # Check if this point is in the front face cutout window
            # Face & chin are at x: [-0.22, 0.22], y < -0.02, z: [0.55, 0.84]
            dist_to_face_center = math.sqrt((px / 0.22)**2 + ((pz - 0.70) / 0.16)**2)
            if py < -0.01 and (dist_to_face_center < 1.08 or (abs(px) < 0.18 and pz < 0.72)):
                continue # Keep face, chin, and neck completely open!
                
            cr = 0.062 + random.uniform(-0.008, 0.010)
            surface_curls.append((px, py, pz, cr))
            
    # Add face-framing curl ring (surrounding the face contour neatly)
    for i in range(12):
        angle = (i / 11.0) * math.pi # 0 to pi
        fx = 0.25 * math.cos(angle)
        fz = 0.74 + 0.16 * math.sin(angle)
        fy = -0.06 + 0.02 * math.sin(angle)
        surface_curls.append((fx, fy, fz, 0.055))

    for idx, (bx, by, bz, br) in enumerate(surface_curls):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=br, location=(bx, by, bz))
        b = bpy.context.active_object
        b.name = f"Curl_{idx}"
        hair_objs.append(b)

    bpy.ops.object.select_all(action='DESELECT')
    for o in hair_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = hair_objs[0]
    bpy.ops.object.join()
    hair = bpy.context.active_object
    hair.name = "Hair_Afro_Cloud"

    # Remesh to fuse into a single organic bubbly cloud mesh
    bpy.ops.object.modifier_add(type='REMESH')
    remesh = hair.modifiers["Remesh"]
    remesh.mode = 'VOXEL'
    remesh.voxel_size = 0.012
    remesh.adaptivity = 0.0001
    bpy.ops.object.modifier_apply(modifier="Remesh")

    smooth = hair.modifiers.new("Smooth", type="SMOOTH")
    smooth.factor = 0.40
    smooth.iterations = 2

    sub_hair = hair.modifiers.new("Subsurf", type="SUBSURF")
    sub_hair.levels = 1

    hair.data.materials.append(mats["hair"])
    for p in hair.data.polygons: p.use_smooth = True

    # ----------------------------------------------------
    # 5. HEADBAND (Continuous Cream Arch Cushion)
    # ----------------------------------------------------
    mesh_hb = bpy.data.meshes.new("Headband_Mesh")
    bm_hb = bmesh.new()
    num_seg = 32
    num_cr = 16
    arch_rx = 0.23
    arch_rz = 0.15
    arch_cy = -0.075
    arch_cz = 0.90
    arch_r = 0.048

    rings = []
    for i in range(num_seg + 1):
        ang = math.radians(16 + (148.0 * i / num_seg))
        cx = -arch_rx * math.cos(ang)
        cz = arch_cz + arch_rz * math.sin(ang)
        cy = arch_cy + math.sin(ang) * -0.05
        
        tangent = Vector((arch_rx * math.sin(ang), math.cos(ang) * -0.05, arch_rz * math.cos(ang))).normalized()
        norm = Vector((-math.cos(ang) * 0.6, -0.75, math.sin(ang) * 0.6)).normalized()
        binorm = tangent.cross(norm).normalized()
        
        r_verts = []
        for j in range(num_cr):
            theta = 2.0 * math.pi * j / num_cr
            # Smooth rounded pillow: wider across hair, puffy outward
            offset = (norm * math.cos(theta) * 0.90 + binorm * math.sin(theta) * 1.25) * arch_r
            v = bm_hb.verts.new(Vector((cx, cy, cz)) + offset)
            r_verts.append(v)
        rings.append(r_verts)

    for i in range(num_seg):
        for j in range(num_cr):
            j_next = (j + 1) % num_cr
            bm_hb.faces.new([rings[i][j], rings[i+1][j], rings[i+1][j_next], rings[i][j_next]])

    bm_hb.faces.new(rings[0])
    bm_hb.faces.new(list(reversed(rings[-1])))
    bm_hb.to_mesh(mesh_hb)
    bm_hb.free()

    headband = bpy.data.objects.new("Headband", mesh_hb)
    bpy.context.scene.collection.objects.link(headband)
    headband.data.materials.append(mats["headband"])
    for p in headband.data.polygons: p.use_smooth = True
    sub_hb = headband.modifiers.new("Subsurf", type="SUBSURF")
    sub_hb.levels = 1

    # ----------------------------------------------------
    # 6. NECK & TURTLENECK COLLAR
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.026, depth=0.10, location=(0, -0.02, 0.58))
    neck = bpy.context.active_object
    neck.name = "Neck"
    neck.data.materials.append(mats["skin"])
    for p in neck.data.polygons: p.use_smooth = True

    # High turtleneck collar
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.060, radius2=0.036, depth=0.065, location=(0, -0.02, 0.550))
    collar = bpy.context.active_object
    collar.name = "Collar"
    collar.data.materials.append(mats["dress"])
    for p in collar.data.polygons: p.use_smooth = True
    sol_col = collar.modifiers.new("Solidify", type="SOLIDIFY")
    sol_col.thickness = 0.008
    sub_col = collar.modifiers.new("Subsurf", type="SUBSURF")
    sub_col.levels = 1

    # ----------------------------------------------------
    # 7. A-LINE SMOCK DRESS (Clean conical silhouette)
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_cone_add(
        vertices=36,
        radius1=0.155,
        radius2=0.055,
        depth=0.30,
        location=(0, -0.015, 0.37)
    )
    dress = bpy.context.active_object
    dress.name = "Dress_Smock"
    dress.scale = (0.94, 0.78, 1.0)
    bpy.ops.object.transform_apply(scale=True)

    bpy.ops.object.mode_set(mode='EDIT')
    bm_dr = bmesh.from_edit_mesh(dress.data)
    faces_to_remove = [f for f in bm_dr.faces if abs(f.normal.z) > 0.8]
    bmesh.ops.delete(bm_dr, geom=faces_to_remove, context='FACES')
    bmesh.update_edit_mesh(dress.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    dress.data.materials.append(mats["dress"])
    for p in dress.data.polygons: p.use_smooth = True
    sol_dr = dress.modifiers.new("Solidify", type="SOLIDIFY")
    sol_dr.thickness = 0.010
    sub_dr = dress.modifiers.new("Subsurf", type="SUBSURF")
    sub_dr.levels = 2

    # Bottom hem trim band
    bpy.ops.mesh.primitive_cone_add(
        vertices=36,
        radius1=0.156,
        radius2=0.146,
        depth=0.024,
        location=(0, -0.015, 0.232)
    )
    hem_trim = bpy.context.active_object
    hem_trim.name = "Dress_Hem_Trim"
    hem_trim.scale = (0.94, 0.78, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    
    bpy.ops.object.mode_set(mode='EDIT')
    bm_trim = bmesh.from_edit_mesh(hem_trim.data)
    cap_faces = [f for f in bm_trim.faces if abs(f.normal.z) > 0.8]
    bmesh.ops.delete(bm_trim, geom=cap_faces, context='FACES')
    bmesh.update_edit_mesh(hem_trim.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    hem_trim.data.materials.append(mats["dress_trim"])
    for p in hem_trim.data.polygons: p.use_smooth = True
    sol_trim = hem_trim.modifiers.new("Solidify", type="SOLIDIFY")
    sol_trim.thickness = 0.011
    sub_trim = hem_trim.modifiers.new("Subsurf", type="SUBSURF")
    sub_trim.levels = 1

    # ----------------------------------------------------
    # 8. SLEEVES & HANDS (Bilateral)
    # ----------------------------------------------------
    for side in [1, -1]:
        sleeve_center = Vector((side * 0.115, -0.012, 0.39))
        bpy.ops.mesh.primitive_cone_add(
            vertices=24,
            radius1=0.052,
            radius2=0.038,
            depth=0.21,
            location=sleeve_center,
            rotation=(0, math.radians(side * -18), 0)
        )
        sleeve = bpy.context.active_object
        sleeve.name = f"Sleeve_{'R' if side > 0 else 'L'}"
        
        bpy.ops.object.mode_set(mode='EDIT')
        bm_slv = bmesh.from_edit_mesh(sleeve.data)
        slv_caps = [f for f in bm_slv.faces if abs(f.normal.z) > 0.8]
        bmesh.ops.delete(bm_slv, geom=slv_caps, context='FACES')
        bmesh.update_edit_mesh(sleeve.data)
        bpy.ops.object.mode_set(mode='OBJECT')

        sleeve.data.materials.append(mats["dress"])
        for p in sleeve.data.polygons: p.use_smooth = True
        sol_slv = sleeve.modifiers.new("Solidify", type="SOLIDIFY")
        sol_slv.thickness = 0.008
        sub_slv = sleeve.modifiers.new("Subsurf", type="SUBSURF")
        sub_slv.levels = 1

        # Sleeve cuff trim
        bpy.ops.mesh.primitive_cone_add(
            vertices=24,
            radius1=0.053,
            radius2=0.050,
            depth=0.016,
            location=(side * 0.148, -0.012, 0.292),
            rotation=(0, math.radians(side * -18), 0)
        )
        cuff = bpy.context.active_object
        cuff.name = f"SleeveCuff_{'R' if side > 0 else 'L'}"
        
        bpy.ops.object.mode_set(mode='EDIT')
        bm_cf = bmesh.from_edit_mesh(cuff.data)
        cf_caps = [f for f in bm_cf.faces if abs(f.normal.z) > 0.8]
        bmesh.ops.delete(bm_cf, geom=cf_caps, context='FACES')
        bmesh.update_edit_mesh(cuff.data)
        bpy.ops.object.mode_set(mode='OBJECT')

        cuff.data.materials.append(mats["dress_trim"])
        for p in cuff.data.polygons: p.use_smooth = True
        sol_cf = cuff.modifiers.new("Solidify", type="SOLIDIFY")
        sol_cf.thickness = 0.009

        # Petite peach hand
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=14,
            radius=0.018,
            location=(side * 0.156, -0.012, 0.270)
        )
        hand = bpy.context.active_object
        hand.name = f"Hand_{'R' if side > 0 else 'L'}"
        hand.scale = (0.75, 0.65, 1.25)
        hand.rotation_euler = (0, math.radians(side * -16), 0)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        hand.data.materials.append(mats["skin"])
        for p in hand.data.polygons: p.use_smooth = True

        # Tiny thumb
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16,
            ring_count=12,
            radius=0.007,
            location=(side * 0.146, -0.021, 0.274)
        )
        thumb = bpy.context.active_object
        thumb.name = f"Thumb_{'R' if side > 0 else 'L'}"
        thumb.data.materials.append(mats["skin"])
        for p in thumb.data.polygons: p.use_smooth = True

    # ----------------------------------------------------
    # 9. LEGS & TANGERINE ANKLE BOOTS
    # ----------------------------------------------------
    leg_x = 0.048
    for side in [1, -1]:
        # Slender leg
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=24,
            radius=0.016,
            depth=0.14,
            location=(side * leg_x, -0.012, 0.16)
        )
        leg = bpy.context.active_object
        leg.name = f"Leg_{'R' if side > 0 else 'L'}"
        leg.data.materials.append(mats["skin"])
        for p in leg.data.polygons: p.use_smooth = True

        # Chunky Tangerine Rain Boot (Single seamless molded geometry)
        # 1. Shaft cylinder
        bpy.ops.mesh.primitive_cone_add(
            vertices=24,
            radius1=0.034, # flared top collar
            radius2=0.026, # ankle
            depth=0.055,
            location=(side * leg_x, -0.012, 0.075)
        )
        b_shaft = bpy.context.active_object
        
        # 2. Bulbous rounded foot box
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=24,
            ring_count=16,
            radius=0.036,
            location=(side * leg_x, -0.034, 0.028)
        )
        b_foot = bpy.context.active_object
        b_foot.scale = (0.90, 1.45, 0.70)
        bpy.ops.object.transform_apply(scale=True)
        
        # Join into unified boot mesh
        bpy.ops.object.select_all(action='DESELECT')
        b_shaft.select_set(True)
        b_foot.select_set(True)
        bpy.context.view_layer.objects.active = b_shaft
        bpy.ops.object.join()
        boot = bpy.context.active_object
        boot.name = f"Boot_{'R' if side > 0 else 'L'}"
        boot.data.materials.append(mats["boots"])
        for p in boot.data.polygons: p.use_smooth = True
        sub_boot = boot.modifiers.new("Subsurf", type="SUBSURF")
        sub_boot.levels = 1

    # ----------------------------------------------------
    # 10. ARTICULATED LIMB HIERARCHY (For Game Engine)
    # ----------------------------------------------------
    # Setup standard socket empties matching game engine animation rig
    scene = bpy.context.scene

    def create_empty(name, loc):
        emp = bpy.data.objects.new(name, None)
        emp.empty_display_type = 'PLAIN_AXES'
        emp.empty_display_size = 0.08
        emp.location = loc
        scene.collection.objects.link(emp)
        return emp

    def parent_to(child_names, parent_obj):
        for name in child_names:
            obj = bpy.data.objects.get(name)
            if obj:
                obj.parent = parent_obj
                obj.matrix_parent_inverse = parent_obj.matrix_world.inverted()

    # 1. Left Arm (Shoulder pivot)
    arm_l = create_empty("eliya_LeftArm", (-0.115, -0.012, 0.46))
    parent_to(["Sleeve_L", "SleeveCuff_L", "Hand_L", "Thumb_L"], arm_l)

    # 2. Right Arm (Shoulder pivot)
    arm_r = create_empty("eliya_RightArm", (0.115, -0.012, 0.46))
    parent_to(["Sleeve_R", "SleeveCuff_R", "Hand_R", "Thumb_R"], arm_r)

    # 3. Left Leg (Hip pivot)
    leg_l = create_empty("eliya_LeftLeg", (-0.048, -0.012, 0.22))
    parent_to(["Leg_L", "Boot_L"], leg_l)

    # 4. Right Leg (Hip pivot)
    leg_r = create_empty("eliya_RightLeg", (0.048, -0.012, 0.22))
    parent_to(["Leg_R", "Boot_R"], leg_r)

    # 5. Head & Hair (Neck pivot)
    head_emp = create_empty("eliya_Head", (0, -0.02, 0.60))
    parent_to([
        "Head", "Nose", "Eye_L", "Eye_R", 
        "Lash1_L", "Lash2_L", "Lash1_R", "Lash2_R", 
        "Hair_Afro_Cloud", "Headband"
    ], head_emp)

    # 6. Tray Socket (For courier couture box stack)
    create_empty("eliya_TraySocket", (0, -0.22, 0.48))

    # ----------------------------------------------------
    # 11. STUDIO BACKDROP & GROUND
    # ----------------------------------------------------
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Studio_Ground"
    ground_mat = bpy.data.materials.new("M_Ground_Catcher")
    g_bsdf = next(n for n in ground_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    g_bsdf.inputs["Base Color"].default_value = hex_to_linear("#f3ece4")
    g_bsdf.inputs["Roughness"].default_value = 0.90
    ground.data.materials.append(ground_mat)

def setup_studio_lighting():
    scene = bpy.context.scene
    
    key_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_data.energy = 55.0
    key_data.size = 1.4
    key_data.color = (1.0, 0.97, 0.93)
    key_obj = bpy.data.objects.new(name="Key_Light", object_data=key_data)
    scene.collection.objects.link(key_obj)
    key_obj.location = (0.75, -2.1, 1.4)
    key_obj.rotation_euler = (math.radians(52), math.radians(10), math.radians(18))
    
    fill_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_data.energy = 28.0
    fill_data.size = 1.8
    fill_data.color = (0.94, 0.96, 1.0)
    fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (-0.95, -1.8, 1.1)
    fill_obj.rotation_euler = (math.radians(48), math.radians(-12), math.radians(-26))
    
    rim_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_data.energy = 65.0
    rim_data.size = 1.4
    rim_data.color = (1.0, 0.98, 0.96)
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_data)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (0.0, 1.4, 1.4)
    rim_obj.rotation_euler = (math.radians(138), 0, math.radians(180))

    world = scene.world
    if not world:
        world = bpy.data.worlds.new("StudioWorld")
        scene.world = world
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = hex_to_linear("#f3ede5")
    bg.inputs["Strength"].default_value = 0.65

def setup_cameras():
    scene = bpy.context.scene
    
    # Target Empty at character center
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.58))
    target = bpy.context.active_object
    target.name = "Cam_Target"
    
    # Front Portrait Camera
    cam_front_data = bpy.data.cameras.new("Cam_Front")
    cam_front_data.lens = 85.0
    cam_front = bpy.data.objects.new("Cam_Front", cam_front_data)
    scene.collection.objects.link(cam_front)
    cam_front.location = (0, -2.85, 0.58)
    
    track_front = cam_front.constraints.new(type='TRACK_TO')
    track_front.target = target
    track_front.track_axis = 'TRACK_NEGATIVE_Z'
    track_front.up_axis = 'UP_Y'
    
    # 3/4 Beauty Angle Camera
    cam_34_data = bpy.data.cameras.new("Cam_34")
    cam_34_data.lens = 85.0
    cam_34 = bpy.data.objects.new("Cam_34", cam_34_data)
    scene.collection.objects.link(cam_34)
    cam_34.location = (1.75, -2.25, 0.75)
    
    track_34 = cam_34.constraints.new(type='TRACK_TO')
    track_34.target = target
    track_34.track_axis = 'TRACK_NEGATIVE_Z'
    track_34.up_axis = 'UP_Y'
    
    scene.camera = cam_front
    return cam_front, cam_34

def render_and_export(output_dir):
    scene = bpy.context.scene
    
    try:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 48
        scene.cycles.use_denoising = True
    except Exception as e:
        print(f"Cycles fallback notice: {e}")
        
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.film_transparent = False
    
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    
    cam_front = bpy.data.objects["Cam_Front"]
    cam_34 = bpy.data.objects["Cam_34"]
    
    # 1. Render Front View
    scene.camera = cam_front
    front_path = os.path.join(output_dir, "preview-front.png")
    scene.render.filepath = front_path
    print(f"Rendering Front View to {front_path}...")
    bpy.ops.render.render(write_still=True)
    
    # 2. Render 3/4 Beauty View
    scene.camera = cam_34
    beauty_path = os.path.join(output_dir, "preview-34-beauty.png")
    scene.render.filepath = beauty_path
    print(f"Rendering 3/4 Beauty View to {beauty_path}...")
    bpy.ops.render.render(write_still=True)
    
    # 3. Save Blender 5 Project File (.blend)
    blend_path = os.path.join(output_dir, "eliya-cloud-mascot.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved Blender 5 project to {blend_path}")
    
    # 4. Export GLB (for three.js / game engine integration)
    ground = bpy.data.objects.get("Studio_Ground")
    if ground:
        ground.hide_render = True
        ground.hide_set(True)
        
    bpy.ops.object.select_all(action='DESELECT')
    char_objects = [
        o for o in scene.objects 
        if o.type in ('MESH', 'EMPTY') and o.name not in ("Studio_Ground", "Cam_Target")
    ]
    for o in char_objects:
        o.select_set(True)
        
    glb_path = os.path.join(output_dir, "eliya-cloud-mascot.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT'
    )
    print(f"Exported game-ready GLB to {glb_path}")

def main():
    output_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/blender/models/eliya-cloud-mascot"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Clearing scene...")
    clear_scene()
    
    print("Creating PBR materials...")
    mats = create_materials()
    
    print("Building character geometry...")
    build_character(mats)
    
    print("Setting up studio lighting...")
    setup_studio_lighting()
    
    print("Setting up cameras...")
    setup_cameras()
    
    print("Rendering previews and exporting assets...")
    render_and_export(output_dir)
    print("Generation complete!")

if __name__ == "__main__":
    main()
