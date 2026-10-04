"""
blender/scripts/pets/build_pets.py
==================================
Builds all 7 Original Companion Pets for Eliya Canal World:
1. hoots: Tiny round tulip owl (~0.40m)
2. dewey: Amsterdam canal duckling holding a freshwater pearl (~0.38m)
3. rocky: Chrome-pebble hedgehog with mirror quills (~0.35m)
4. seedy: Daisy sprout creature with petal collar (~0.40m)
5. fireball: Little red bike-bell bird with brass bell crown (~0.38m)
6. matcha-moth: Soft green moth with tea-leaf wings (~0.38m)
7. pearl-crab: Cute pink crab holding a nail-polish bottle (~0.36m)

Contract for each pet:
- Origin at feet (Z=0), facing -Y
- Sub-node 'pet_Body' for idle bobbing animation
- Height ~0.35 - 0.42m
- Clean glTF-safe standard PBR materials
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

def create_pbr_mat(name, hex_color, roughness=0.6, metallic=0.0):
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

def export_pet(col, pet_name, out_dir):
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)
    dest = os.path.join(out_dir, f"{pet_name}.glb")
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=False, # preserve pet_Body hierarchy
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"Exported clean {pet_name} pet: {dest} ({os.path.getsize(dest)} bytes)")

# -----------------------------------------------------------------------------
# 1. HOOTS: Tiny Round Tulip Owl
# -----------------------------------------------------------------------------
def build_hoots(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("Hoots")
    bpy.context.scene.collection.children.link(col)

    mat_body = create_pbr_mat("M_OwlBody", "#FBF5EB", roughness=0.75)
    mat_wings = create_pbr_mat("M_TulipWing", "#E35A53", roughness=0.60)
    mat_beak = create_pbr_mat("M_Beak", "#F5A623", roughness=0.40)
    mat_eye = create_pbr_mat("M_EyeDark", "#1C1410", roughness=0.10)
    mat_ring = create_pbr_mat("M_EyeRing", "#FAD02C", roughness=0.50)

    root = bpy.data.objects.new("hoots_Root", None)
    col.objects.link(root)

    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    pet_body.location = (0, 0, 0.05)
    col.objects.link(pet_body)

    # Body (round plump egg)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=16, radius=0.17)
    for v in bm.verts:
        if v.co.z < 0: v.co.x *= 1.08; v.co.y *= 1.08
        v.co.z = 0.17 + v.co.z * 1.15
    mesh = bpy.data.meshes.new("Body_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_body = bpy.data.objects.new("Body", mesh)
    obj_body.parent = pet_body
    col.objects.link(obj_body)
    obj_body.data.materials.append(mat_body)
    for poly in mesh.polygons: poly.use_smooth = True

    # Ear tufts
    for sx in [-1, 1]:
        bm_tuft = bmesh.new()
        bmesh.ops.create_cone(bm_tuft, cap_ends=True, segments=8, radius1=0.04, radius2=0.005, depth=0.10)
        for v in bm_tuft.verts:
            v.co.x += sx * 0.09
            v.co.z += 0.38
        mesh_t = bpy.data.meshes.new("Tuft_Mesh")
        bm_tuft.to_mesh(mesh_t); bm_tuft.free()
        obj_t = bpy.data.objects.new("Tuft", mesh_t)
        obj_t.parent = pet_body
        col.objects.link(obj_t)
        obj_t.data.materials.append(mat_wings)

    # Eyes & Beak
    for sx in [-1, 1]:
        # Yellow ring
        bm_e = bmesh.new()
        bmesh.ops.create_uvsphere(bm_e, u_segments=16, v_segments=12, radius=0.048)
        for v in bm_e.verts:
            v.co.y *= 0.25; v.co.x += sx * 0.068; v.co.y -= 0.155; v.co.z += 0.23
        mesh_e = bpy.data.meshes.new("EyeRing_Mesh")
        bm_e.to_mesh(mesh_e); bm_e.free()
        obj_e = bpy.data.objects.new("EyeRing", mesh_e)
        obj_e.parent = pet_body
        col.objects.link(obj_e)
        obj_e.data.materials.append(mat_ring)

        # Dark pupil
        bm_p = bmesh.new()
        bmesh.ops.create_uvsphere(bm_p, u_segments=12, v_segments=10, radius=0.026)
        for v in bm_p.verts:
            v.co.y *= 0.3; v.co.x += sx * 0.068; v.co.y -= 0.170; v.co.z += 0.23
        mesh_p = bpy.data.meshes.new("Pupil_Mesh")
        bm_p.to_mesh(mesh_p); bm_p.free()
        obj_p = bpy.data.objects.new("Pupil", mesh_p)
        obj_p.parent = pet_body
        col.objects.link(obj_p)
        obj_p.data.materials.append(mat_eye)

    # Beak
    bm_b = bmesh.new()
    bmesh.ops.create_cone(bm_b, cap_ends=True, segments=6, radius1=0.025, radius2=0.005, depth=0.05)
    for v in bm_b.verts:
        curr_y = v.co.z
        curr_z = v.co.y
        v.co.y = -curr_y - 0.17
        v.co.z = curr_z + 0.19
    mesh_b = bpy.data.meshes.new("Beak_Mesh")
    bm_b.to_mesh(mesh_b); bm_b.free()
    obj_b = bpy.data.objects.new("Beak", mesh_b)
    obj_b.parent = pet_body
    col.objects.link(obj_b)
    obj_b.data.materials.append(mat_beak)

    # Tulip Petal Wings
    for sx in [-1, 1]:
        bm_w = bmesh.new()
        bmesh.ops.create_uvsphere(bm_w, u_segments=14, v_segments=10, radius=0.08)
        for v in bm_w.verts:
            v.co.x *= 0.40; v.co.y *= 1.30; v.co.z *= 1.60
            v.co.x += sx * 0.16; v.co.y += 0.02; v.co.z += 0.17
        mesh_w = bpy.data.meshes.new("Wing_Mesh")
        bm_w.to_mesh(mesh_w); bm_w.free()
        obj_w = bpy.data.objects.new("Wing", mesh_w)
        obj_w.parent = pet_body
        col.objects.link(obj_w)
        obj_w.data.materials.append(mat_wings)

    export_pet(col, "hoots", out_dir)

# -----------------------------------------------------------------------------
# 2. DEWEY: Canal Duckling with a Pearl
# -----------------------------------------------------------------------------
def build_dewey(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("Dewey")
    bpy.context.scene.collection.children.link(col)

    mat_duck = create_pbr_mat("M_DuckYellow", "#FFDF59", roughness=0.70)
    mat_beak = create_pbr_mat("M_DuckOrange", "#FF8C1A", roughness=0.55)
    mat_eye = create_pbr_mat("M_EyeDark", "#1C1410", roughness=0.10)
    mat_pearl = create_pbr_mat("M_Pearl", "#F5EEF8", roughness=0.18, metallic=0.75)

    root = bpy.data.objects.new("dewey_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Body
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=14, radius=0.14)
    for v in bm.verts:
        v.co.y *= 1.35; v.co.z += 0.14
        if v.co.y > 0.05: v.co.z += (v.co.y * 0.3) # tail flare
    mesh = bpy.data.meshes.new("DuckBody_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("DuckBody", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_duck)

    # Head
    bm_h = bmesh.new()
    bmesh.ops.create_uvsphere(bm_h, u_segments=18, v_segments=14, radius=0.11)
    for v in bm_h.verts:
        v.co.y -= 0.08; v.co.z += 0.28
    mesh_h = bpy.data.meshes.new("Head_Mesh")
    bm_h.to_mesh(mesh_h); bm_h.free()
    obj_h = bpy.data.objects.new("Head", mesh_h)
    obj_h.parent = pet_body; col.objects.link(obj_h); obj_h.data.materials.append(mat_duck)

    # Bill
    bm_bill = bmesh.new()
    bmesh.ops.create_uvsphere(bm_bill, u_segments=12, v_segments=8, radius=0.045)
    for v in bm_bill.verts:
        v.co.x *= 1.1; v.co.y *= 1.8; v.co.z *= 0.35
        v.co.y -= 0.18; v.co.z += 0.26
    mesh_bill = bpy.data.meshes.new("Bill_Mesh")
    bm_bill.to_mesh(mesh_bill); bm_bill.free()
    obj_bill = bpy.data.objects.new("Bill", mesh_bill)
    obj_bill.parent = pet_body; col.objects.link(obj_bill); obj_bill.data.materials.append(mat_beak)

    # Eyes
    for sx in [-1, 1]:
        bm_e = bmesh.new()
        bmesh.ops.create_uvsphere(bm_e, u_segments=10, v_segments=8, radius=0.018)
        for v in bm_e.verts:
            v.co.x += sx * 0.08; v.co.y -= 0.12; v.co.z += 0.30
        mesh_e = bpy.data.meshes.new("Eye_Mesh")
        bm_e.to_mesh(mesh_e); bm_e.free()
        obj_e = bpy.data.objects.new("Eye", mesh_e)
        obj_e.parent = pet_body; col.objects.link(obj_e); obj_e.data.materials.append(mat_eye)

    # Big Lustrous Freshwater Pearl tucked under wing
    bm_pearl = bmesh.new()
    bmesh.ops.create_uvsphere(bm_pearl, u_segments=18, v_segments=14, radius=0.065)
    for v in bm_pearl.verts:
        v.co.x += 0.12; v.co.y -= 0.02; v.co.z += 0.15
    mesh_pearl = bpy.data.meshes.new("Pearl_Mesh")
    bm_pearl.to_mesh(mesh_pearl); bm_pearl.free()
    obj_pearl = bpy.data.objects.new("FreshwaterPearl", mesh_pearl)
    obj_pearl.parent = pet_body; col.objects.link(obj_pearl); obj_pearl.data.materials.append(mat_pearl)

    export_pet(col, "dewey", out_dir)

# -----------------------------------------------------------------------------
# 3. ROCKY: Chrome-Pebble Hedgehog
# -----------------------------------------------------------------------------
def build_rocky(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("Rocky")
    bpy.context.scene.collection.children.link(col)

    mat_pebble = create_pbr_mat("M_PebbleBody", "#7D756C", roughness=0.82)
    mat_chrome = create_pbr_mat("M_ChromeQuills", "#E4E8EE", roughness=0.08, metallic=0.96)
    mat_snout = create_pbr_mat("M_Snout", "#C4B6A5", roughness=0.70)
    mat_dark = create_pbr_mat("M_NoseDark", "#1A1512", roughness=0.15)

    root = bpy.data.objects.new("rocky_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Pebble body
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=14, radius=0.15)
    for v in bm.verts:
        v.co.y *= 1.30; v.co.z = 0.13 + v.co.z * 0.90
    mesh = bpy.data.meshes.new("Pebble_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("PebbleBody", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_pebble)

    # Cute snout cone facing -Y
    bm_sn = bmesh.new()
    bmesh.ops.create_cone(bm_sn, cap_ends=True, segments=12, radius1=0.08, radius2=0.015, depth=0.12)
    for v in bm_sn.verts:
        y = v.co.z; z = v.co.y
        v.co.y = -y - 0.18; v.co.z = z + 0.10
    mesh_sn = bpy.data.meshes.new("Snout_Mesh")
    bm_sn.to_mesh(mesh_sn); bm_sn.free()
    obj_sn = bpy.data.objects.new("Snout", mesh_sn)
    obj_sn.parent = pet_body; col.objects.link(obj_sn); obj_sn.data.materials.append(mat_snout)

    # Chrome Quills / Spikes
    bm_quills = bmesh.new()
    for q_idx in range(24):
        ang = (q_idx / 24.0) * math.pi * 2
        r = 0.12 + (q_idx % 3) * 0.02
        qx = math.cos(ang) * r
        qy = math.sin(ang) * (r * 1.1) + 0.04
        qz = 0.18 + (math.sin(q_idx * 1.5) * 0.06)

        ret = bmesh.ops.create_cone(bm_quills, cap_ends=True, segments=6, radius1=0.022, radius2=0.003, depth=0.07)
        for v in ret["verts"]:
            # Point outward
            v.co.x += qx * 1.15
            v.co.y += qy * 1.15
            v.co.z += qz + 0.04

    mesh_q = bpy.data.meshes.new("Quills_Mesh")
    bm_quills.to_mesh(mesh_q); bm_quills.free()
    obj_q = bpy.data.objects.new("ChromeQuills", mesh_q)
    obj_q.parent = pet_body; col.objects.link(obj_q); obj_q.data.materials.append(mat_chrome)

    export_pet(col, "rocky", out_dir)

# -----------------------------------------------------------------------------
# 4. SEEDY: Daisy Sprout Creature
# -----------------------------------------------------------------------------
def build_seedy(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("Seedy")
    bpy.context.scene.collection.children.link(col)

    mat_seed = create_pbr_mat("M_SeedPod", "#C8B18C", roughness=0.78)
    mat_petal = create_pbr_mat("M_DaisyWhite", "#F8F7F2", roughness=0.60)
    mat_sprout = create_pbr_mat("M_GreenSprout", "#67A638", roughness=0.65)
    mat_eye = create_pbr_mat("M_EyeDark", "#1C1410", roughness=0.10)

    root = bpy.data.objects.new("seedy_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Seed pod body
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=14, radius=0.15)
    for v in bm.verts:
        if v.co.z > 0: v.co.x *= 0.85; v.co.y *= 0.85
        v.co.z = 0.16 + v.co.z * 1.1
    mesh = bpy.data.meshes.new("SeedPod_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("SeedPod", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_seed)

    # Daisy Petal Collar around base (8 petals radiating outward)
    bm_petals = bmesh.new()
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2
        px = math.cos(ang) * 0.14
        py = math.sin(ang) * 0.14
        ret = bmesh.ops.create_uvsphere(bm_petals, u_segments=10, v_segments=6, radius=0.045)
        for v in ret["verts"]:
            v.co.z *= 0.2
            v.co.x *= 1.4
            v.co.x += px
            v.co.y += py
            v.co.z += 0.08
    mesh_p = bpy.data.meshes.new("DaisyCollar_Mesh")
    bm_petals.to_mesh(mesh_p); bm_petals.free()
    obj_p = bpy.data.objects.new("DaisyCollar", mesh_p)
    obj_p.parent = pet_body; col.objects.link(obj_p); obj_p.data.materials.append(mat_petal)

    # Green sprout leaves on head
    bm_sprout = bmesh.new()
    for sx in [-1, 1]:
        ret = bmesh.ops.create_uvsphere(bm_sprout, u_segments=10, v_segments=6, radius=0.04)
        for v in ret["verts"]:
            v.co.x *= 1.6; v.co.z *= 0.3
            v.co.x += sx * 0.05
            v.co.z += 0.36
    mesh_sp = bpy.data.meshes.new("Sprout_Mesh")
    bm_sprout.to_mesh(mesh_sp); bm_sprout.free()
    obj_sp = bpy.data.objects.new("Sprout", mesh_sp)
    obj_sp.parent = pet_body; col.objects.link(obj_sp); obj_sp.data.materials.append(mat_sprout)

    # Eyes
    for sx in [-1, 1]:
        bm_e = bmesh.new()
        bmesh.ops.create_uvsphere(bm_e, u_segments=8, v_segments=6, radius=0.016)
        for v in bm_e.verts:
            v.co.x += sx * 0.055; v.co.y -= 0.14; v.co.z += 0.18
        mesh_e = bpy.data.meshes.new("Eye_Mesh")
        bm_e.to_mesh(mesh_e); bm_e.free()
        obj_e = bpy.data.objects.new("Eye", mesh_e)
        obj_e.parent = pet_body; col.objects.link(obj_e); obj_e.data.materials.append(mat_eye)

    export_pet(col, "seedy", out_dir)

# -----------------------------------------------------------------------------
# 5. FIREBALL: Red Bike-Bell Bird
# -----------------------------------------------------------------------------
def build_fireball(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("Fireball")
    bpy.context.scene.collection.children.link(col)

    mat_red = create_pbr_mat("M_FireRed", "#E53935", roughness=0.65)
    mat_belly = create_pbr_mat("M_CreamBelly", "#FFF3E0", roughness=0.75)
    mat_brass = create_pbr_mat("M_BrassBell", "#E5BE53", roughness=0.20, metallic=0.90)
    mat_beak = create_pbr_mat("M_Beak", "#FFB300", roughness=0.45)
    mat_eye = create_pbr_mat("M_EyeDark", "#1C1410", roughness=0.10)

    root = bpy.data.objects.new("fireball_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Chubby spherical bird body
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=14, radius=0.15)
    for v in bm.verts:
        v.co.z = 0.15 + v.co.z
    mesh = bpy.data.meshes.new("BirdBody_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("BirdBody", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_red)

    # Cream belly patch
    bm_bel = bmesh.new()
    bmesh.ops.create_uvsphere(bm_bel, u_segments=12, v_segments=8, radius=0.09)
    for v in bm_bel.verts:
        v.co.y *= 0.35; v.co.y -= 0.12; v.co.z += 0.13
    mesh_bel = bpy.data.meshes.new("Belly_Mesh")
    bm_bel.to_mesh(mesh_bel); bm_bel.free()
    obj_bel = bpy.data.objects.new("Belly", mesh_bel)
    obj_bel.parent = pet_body; col.objects.link(obj_bel); obj_bel.data.materials.append(mat_belly)

    # Brass bicycle bell dome on top of head
    bm_bell = bmesh.new()
    bmesh.ops.create_uvsphere(bm_bell, u_segments=16, v_segments=10, radius=0.06)
    for v in bm_bell.verts:
        if v.co.z < 0: v.co.z = 0
        v.co.z += 0.28
    mesh_bell = bpy.data.meshes.new("BellDome_Mesh")
    bm_bell.to_mesh(mesh_bell); bm_bell.free()
    obj_bell = bpy.data.objects.new("BellDome", mesh_bell)
    obj_bell.parent = pet_body; col.objects.link(obj_bell); obj_bell.data.materials.append(mat_brass)

    # Beak
    bm_bk = bmesh.new()
    bmesh.ops.create_cone(bm_bk, cap_ends=True, segments=6, radius1=0.025, radius2=0.005, depth=0.05)
    for v in bm_bk.verts:
        y = v.co.z; z = v.co.y
        v.co.y = -y - 0.16; v.co.z = z + 0.18
    mesh_bk = bpy.data.meshes.new("Beak_Mesh")
    bm_bk.to_mesh(mesh_bk); bm_bk.free()
    obj_bk = bpy.data.objects.new("Beak", mesh_bk)
    obj_bk.parent = pet_body; col.objects.link(obj_bk); obj_bk.data.materials.append(mat_beak)

    export_pet(col, "fireball", out_dir)

# -----------------------------------------------------------------------------
# 6. MATCHA-MOTH: Soft Green Moth with Tea-Leaf Wings (replaces codex)
# -----------------------------------------------------------------------------
def build_matcha_moth(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("MatchaMoth")
    bpy.context.scene.collection.children.link(col)

    mat_fuzzy = create_pbr_mat("M_MatchaFuzz", "#BFD8A0", roughness=0.88)
    mat_leaf = create_pbr_mat("M_TeaLeafWing", "#68964C", roughness=0.65)
    mat_vein = create_pbr_mat("M_LeafVein", "#4F7637", roughness=0.70)
    mat_dark = create_pbr_mat("M_MothEye", "#182012", roughness=0.15)

    root = bpy.data.objects.new("matcha_moth_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Plump fuzzy caterpillar/moth cocoon body
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=0.12)
    for v in bm.verts:
        v.co.y *= 1.45; v.co.z = 0.14 + v.co.z * 0.95
    mesh = bpy.data.meshes.new("MothBody_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("MothBody", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_fuzzy)

    # 2 Big tea-leaf shaped wings (spreading out at ~35 degrees)
    for sx in [-1, 1]:
        bm_w = bmesh.new()
        bmesh.ops.create_uvsphere(bm_w, u_segments=14, v_segments=10, radius=0.13)
        for v in bm_w.verts:
            v.co.z *= 0.15 # thin flat leaf
            v.co.x *= 1.5; v.co.y *= 1.1
            # Taper outer leaf tip
            if v.co.x * sx > 0: v.co.x *= 1.3
            v.co.x += sx * 0.16; v.co.y += 0.02; v.co.z += 0.20
        mesh_w = bpy.data.meshes.new("TeaLeafWing_Mesh")
        bm_w.to_mesh(mesh_w); bm_w.free()
        obj_w = bpy.data.objects.new("TeaLeafWing", mesh_w)
        obj_w.parent = pet_body; col.objects.link(obj_w); obj_w.data.materials.append(mat_leaf)

    # Big cute black eyes
    for sx in [-1, 1]:
        bm_e = bmesh.new()
        bmesh.ops.create_uvsphere(bm_e, u_segments=10, v_segments=8, radius=0.032)
        for v in bm_e.verts:
            v.co.x += sx * 0.08; v.co.y -= 0.14; v.co.z += 0.18
        mesh_e = bpy.data.meshes.new("Eye_Mesh")
        bm_e.to_mesh(mesh_e); bm_e.free()
        obj_e = bpy.data.objects.new("Eye", mesh_e)
        obj_e.parent = pet_body; col.objects.link(obj_e); obj_e.data.materials.append(mat_dark)

    export_pet(col, "matcha-moth", out_dir)

# -----------------------------------------------------------------------------
# 7. PEARL-CRAB: Pink Crab with Nail-Polish Bottle (replaces null-signal)
# -----------------------------------------------------------------------------
def build_pearl_crab(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.data.collections.new("PearlCrab")
    bpy.context.scene.collection.children.link(col)

    mat_pink = create_pbr_mat("M_CrabPink", "#FF94AB", roughness=0.55)
    mat_white = create_pbr_mat("M_EyeWhite", "#FFFFFF", roughness=0.30)
    mat_dark = create_pbr_mat("M_Pupil", "#1A1412", roughness=0.10)
    mat_bottle = create_pbr_mat("M_PolishGlass", "#E87D95", roughness=0.15, metallic=0.1)
    mat_gold = create_pbr_mat("M_GoldCap", "#E8C25A", roughness=0.25, metallic=0.90)

    root = bpy.data.objects.new("pearl_crab_Root", None)
    col.objects.link(root)
    pet_body = bpy.data.objects.new("pet_Body", None)
    pet_body.parent = root
    col.objects.link(pet_body)

    # Crab shell (squished rounded dome)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=12, radius=0.15)
    for v in bm.verts:
        v.co.x *= 1.45; v.co.y *= 1.15; v.co.z = 0.12 + v.co.z * 0.70
    mesh = bpy.data.meshes.new("CrabShell_Mesh")
    bm.to_mesh(mesh); bm.free()
    obj_b = bpy.data.objects.new("CrabShell", mesh)
    obj_b.parent = pet_body; col.objects.link(obj_b); obj_b.data.materials.append(mat_pink)

    # Eyestalks on top
    for sx in [-1, 1]:
        bm_e = bmesh.new()
        bmesh.ops.create_uvsphere(bm_e, u_segments=12, v_segments=8, radius=0.038)
        for v in bm_e.verts:
            v.co.x += sx * 0.08; v.co.y -= 0.10; v.co.z += 0.26
        mesh_e = bpy.data.meshes.new("EyeWhite_Mesh")
        bm_e.to_mesh(mesh_e); bm_e.free()
        obj_e = bpy.data.objects.new("EyeWhite", mesh_e)
        obj_e.parent = pet_body; col.objects.link(obj_e); obj_e.data.materials.append(mat_white)

        bm_p = bmesh.new()
        bmesh.ops.create_uvsphere(bm_p, u_segments=8, v_segments=6, radius=0.018)
        for v in bm_p.verts:
            v.co.x += sx * 0.08; v.co.y -= 0.135; v.co.z += 0.26
        mesh_p = bpy.data.meshes.new("Pupil_Mesh")
        bm_p.to_mesh(mesh_p); bm_p.free()
        obj_p = bpy.data.objects.new("Pupil", mesh_p)
        obj_p.parent = pet_body; col.objects.link(obj_p); obj_p.data.materials.append(mat_dark)

    # Pincer Claws in front
    for sx in [-1, 1]:
        bm_claw = bmesh.new()
        bmesh.ops.create_uvsphere(bm_claw, u_segments=10, v_segments=8, radius=0.05)
        for v in bm_claw.verts:
            v.co.x *= 1.3; v.co.y *= 0.6; v.co.z *= 0.8
            v.co.x += sx * 0.20; v.co.y -= 0.12; v.co.z += 0.12
        mesh_c = bpy.data.meshes.new("Claw_Mesh")
        bm_claw.to_mesh(mesh_c); bm_claw.free()
        obj_c = bpy.data.objects.new("Claw", mesh_c)
        obj_c.parent = pet_body; col.objects.link(obj_c); obj_c.data.materials.append(mat_pink)

    # Miniature Nail-Polish Bottle held in front
    bm_bot = bmesh.new()
    bmesh.ops.create_cube(bm_bot, size=0.055)
    for v in bm_bot.verts:
        v.co.y -= 0.16; v.co.z += 0.11
    # Gold cap
    bmesh.ops.create_cone(bm_bot, cap_ends=True, segments=8, radius1=0.015, radius2=0.015, depth=0.04)
    for v in bm_bot.verts[-16:]:
        v.co.y -= 0.16; v.co.z += 0.16
    mesh_bot = bpy.data.meshes.new("PolishBottle_Mesh")
    bm_bot.to_mesh(mesh_bot); bm_bot.free()
    obj_bot = bpy.data.objects.new("PolishBottle", mesh_bot)
    obj_bot.parent = pet_body; col.objects.link(obj_bot); obj_bot.data.materials.append(mat_bottle)

    export_pet(col, "pearl-crab", out_dir)

def main():
    out_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/pets"
    build_hoots(out_dir)
    build_dewey(out_dir)
    build_rocky(out_dir)
    build_seedy(out_dir)
    build_fireball(out_dir)
    build_matcha_moth(out_dir)
    build_pearl_crab(out_dir)
    print("🎉 All 7 Original Pets built successfully!")

if __name__ == "__main__":
    main()
