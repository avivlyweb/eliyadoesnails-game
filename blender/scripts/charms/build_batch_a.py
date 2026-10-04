# blender/scripts/charms/build_batch_a.py
# Builds all 9 Batch A 3D nail charms for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md
#
# Contract:
# - Flat back on XY plane at Z = 0 (origin at center of flat back)
# - Front facing +Z (exports to glTF +Y)
# - Real-world proportions (width ~0.008m / 8mm)
# - Soft, puffy, glossy aesthetic with beveled edges (no sharp corners)
# - PBR standard glTF-safe materials
# - Triangle count <= 3,000, file size <= 150 KB

import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def create_mat(name, hex_color, roughness=0.25, metallic=0.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    lr, lg, lb = srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (lr, lg, lb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = (lr, lg, lb, 1.0)
    return mat

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def flatten_back_and_ground(obj):
    """Ensure back at Z <= 0 is completely flat at Z = 0 and front faces +Z."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    min_z = min(v.co.z for v in bm.verts) if bm.verts else 0.0
    for v in bm.verts:
        v.co.z -= min_z
        if v.co.z < 0.0001:
            v.co.z = 0.0
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

def export_glb(col, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = col.objects[0]
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False
    )
    print(f"Exported: {filepath} ({os.path.getsize(filepath)} bytes)")

# ---------------------------------------------------------------------------
# 1. charm-tulip: Dutch tulip (3 cupped glossy petals, tiny leaf)
# ---------------------------------------------------------------------------
def build_tulip(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_tulip")
    bpy.context.scene.collection.children.link(col)
    
    mat_petal_main = create_mat("pal_tulip_pink", "#E8486A", roughness=0.22)
    mat_petal_side = create_mat("pal_tulip_blush", "#F5829B", roughness=0.24)
    mat_leaf = create_mat("pal_tulip_leaf", "#659A5A", roughness=0.35)
    
    # Center petal
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.0035, location=(0, 0, 0.0028))
    p_center = bpy.context.active_object
    p_center.scale = (0.75, 0.55, 1.1)
    p_center.data.materials.append(mat_petal_main)
    col.objects.link(p_center)
    bpy.context.scene.collection.objects.unlink(p_center)
    
    # Left petal
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.0030, location=(-0.0016, 0, 0.0026))
    p_left = bpy.context.active_object
    p_left.rotation_euler = (0, math.radians(-16), 0)
    p_left.scale = (0.70, 0.50, 1.05)
    p_left.data.materials.append(mat_petal_side)
    col.objects.link(p_left)
    bpy.context.scene.collection.objects.unlink(p_left)
    
    # Right petal
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.0030, location=(0.0016, 0, 0.0026))
    p_right = bpy.context.active_object
    p_right.rotation_euler = (0, math.radians(16), 0)
    p_right.scale = (0.70, 0.50, 1.05)
    p_right.data.materials.append(mat_petal_side)
    col.objects.link(p_right)
    bpy.context.scene.collection.objects.unlink(p_right)
    
    # Tiny leaf
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0018, location=(0.0018, 0, 0.0008))
    leaf = bpy.context.active_object
    leaf.rotation_euler = (0, math.radians(45), math.radians(15))
    leaf.scale = (0.45, 0.35, 1.3)
    leaf.data.materials.append(mat_leaf)
    col.objects.link(leaf)
    bpy.context.scene.collection.objects.unlink(leaf)
    
    # Stem base
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.0008, depth=0.0022, location=(0, 0, 0.0006))
    stem = bpy.context.active_object
    stem.rotation_euler = (math.radians(90), 0, 0)
    stem.data.materials.append(mat_leaf)
    col.objects.link(stem)
    bpy.context.scene.collection.objects.unlink(stem)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-tulip.glb"))

# ---------------------------------------------------------------------------
# 2. charm-daisy: Daisy (11 white rounded petals, domed yellow stamen center)
# ---------------------------------------------------------------------------
def build_daisy(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_daisy")
    bpy.context.scene.collection.children.link(col)
    
    mat_white = create_mat("pal_daisy_white", "#FFFFFF", roughness=0.25)
    mat_yellow = create_mat("pal_daisy_center", "#F9C73D", roughness=0.32, metallic=0.05)
    
    num_petals = 11
    radius = 0.0028
    for i in range(num_petals):
        angle = (2 * math.pi / num_petals) * i
        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0017, location=(x, y, 0.0012))
        p = bpy.context.active_object
        p.rotation_euler = (0, 0, angle)
        p.scale = (1.45, 0.65, 0.55)
        p.data.materials.append(mat_white)
        col.objects.link(p)
        bpy.context.scene.collection.objects.unlink(p)
    
    # Domed center button
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.0020, location=(0, 0, 0.0018))
    center = bpy.context.active_object
    center.scale = (1.0, 1.0, 0.75)
    center.data.materials.append(mat_yellow)
    col.objects.link(center)
    bpy.context.scene.collection.objects.unlink(center)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-daisy.glb"))

# ---------------------------------------------------------------------------
# 3. charm-sakura: Cherry blossom (5 notched petals, blush center, gold beads)
# ---------------------------------------------------------------------------
def build_sakura(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_sakura")
    bpy.context.scene.collection.children.link(col)
    
    mat_sakura = create_mat("pal_sakura_blush", "#FAD0DC", roughness=0.20)
    mat_core = create_mat("pal_sakura_core", "#E45E86", roughness=0.25)
    mat_gold = create_mat("pal_sakura_gold", "#E4C07A", roughness=0.18, metallic=0.9)
    
    num_petals = 5
    petal_dist = 0.0026
    for i in range(num_petals):
        angle = (2 * math.pi / num_petals) * i
        x = math.cos(angle) * petal_dist
        y = math.sin(angle) * petal_dist
        
        # Left half of notched petal
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0016, location=(x, y, 0.0014))
        p1 = bpy.context.active_object
        p1.rotation_euler = (0, 0, angle + 0.16)
        p1.scale = (1.3, 0.75, 0.55)
        p1.data.materials.append(mat_sakura)
        col.objects.link(p1)
        bpy.context.scene.collection.objects.unlink(p1)
        
        # Right half of notched petal (creates characteristic notch)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0016, location=(x, y, 0.0014))
        p2 = bpy.context.active_object
        p2.rotation_euler = (0, 0, angle - 0.16)
        p2.scale = (1.3, 0.75, 0.55)
        p2.data.materials.append(mat_sakura)
        col.objects.link(p2)
        bpy.context.scene.collection.objects.unlink(p2)

    # Core center
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.0014, location=(0, 0, 0.0016))
    core = bpy.context.active_object
    core.scale = (1.0, 1.0, 0.6)
    core.data.materials.append(mat_core)
    col.objects.link(core)
    bpy.context.scene.collection.objects.unlink(core)
    
    # 5 tiny gold stamen beads
    for i in range(5):
        st_angle = (2 * math.pi / 5) * i + 0.3
        sx = math.cos(st_angle) * 0.0009
        sy = math.sin(st_angle) * 0.0009
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.00045, location=(sx, sy, 0.0022))
        st = bpy.context.active_object
        st.data.materials.append(mat_gold)
        col.objects.link(st)
        bpy.context.scene.collection.objects.unlink(st)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-sakura.glb"))

# ---------------------------------------------------------------------------
# 4. charm-puffy-heart: Inflated glossy jelly heart with highlight ridge
# ---------------------------------------------------------------------------
def build_puffy_heart(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_puffy_heart")
    bpy.context.scene.collection.children.link(col)
    
    mat_heart = create_mat("pal_jelly_heart", "#F86B91", roughness=0.15)
    mat_glint = create_mat("pal_heart_glint", "#FFFFFF", roughness=0.20)
    
    # Left lobe
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.0028, location=(-0.0018, 0.0010, 0.0022))
    lobe_l = bpy.context.active_object
    lobe_l.rotation_euler = (0, 0, math.radians(-32))
    lobe_l.scale = (0.9, 1.1, 0.85)
    lobe_l.data.materials.append(mat_heart)
    col.objects.link(lobe_l)
    bpy.context.scene.collection.objects.unlink(lobe_l)
    
    # Right lobe
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.0028, location=(0.0018, 0.0010, 0.0022))
    lobe_r = bpy.context.active_object
    lobe_r.rotation_euler = (0, 0, math.radians(32))
    lobe_r.scale = (0.9, 1.1, 0.85)
    lobe_r.data.materials.append(mat_heart)
    col.objects.link(lobe_r)
    bpy.context.scene.collection.objects.unlink(lobe_r)
    
    # Bottom cone/tip
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.0032, depth=0.0045, location=(0, -0.0016, 0.0019))
    tip = bpy.context.active_object
    tip.rotation_euler = (0, math.radians(180), 0)
    tip.scale = (1.0, 0.75, 1.0)
    tip.data.materials.append(mat_heart)
    col.objects.link(tip)
    bpy.context.scene.collection.objects.unlink(tip)
    
    # Curved resin highlight dot
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0006, location=(-0.0022, 0.0018, 0.0036))
    glint = bpy.context.active_object
    glint.scale = (1.4, 0.6, 0.4)
    glint.rotation_euler = (0, 0, math.radians(-25))
    glint.data.materials.append(mat_glint)
    col.objects.link(glint)
    bpy.context.scene.collection.objects.unlink(glint)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-puffy-heart.glb"))

# ---------------------------------------------------------------------------
# 5. charm-kitty: Ginger tabby kitty ("Stroopje") face charm
# ---------------------------------------------------------------------------
def build_kitty(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_kitty")
    bpy.context.scene.collection.children.link(col)
    
    mat_fur = create_mat("pal_kitty_orange", "#E77D34", roughness=0.28)
    mat_cream = create_mat("pal_kitty_cream", "#FDF1DF", roughness=0.30)
    mat_stripes = create_mat("pal_kitty_stripe", "#853D15", roughness=0.32)
    mat_nose = create_mat("pal_kitty_pink", "#E87171", roughness=0.25)
    mat_eye = create_mat("pal_kitty_eye", "#1C110A", roughness=0.12)
    mat_shine = create_mat("pal_kitty_shine", "#FFFFFF", roughness=0.10)
    
    # Head sphere
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.0036, location=(0, 0, 0.0022))
    head = bpy.context.active_object
    head.scale = (1.15, 0.95, 0.70)
    head.data.materials.append(mat_fur)
    col.objects.link(head)
    bpy.context.scene.collection.objects.unlink(head)
    
    # Left Ear
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.0016, depth=0.0028, location=(-0.0024, 0.0028, 0.0018))
    ear_l = bpy.context.active_object
    ear_l.rotation_euler = (0, 0, math.radians(22))
    ear_l.scale = (1.0, 0.5, 1.0)
    ear_l.data.materials.append(mat_fur)
    col.objects.link(ear_l)
    bpy.context.scene.collection.objects.unlink(ear_l)
    
    # Right Ear
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.0016, depth=0.0028, location=(0.0024, 0.0028, 0.0018))
    ear_r = bpy.context.active_object
    ear_r.rotation_euler = (0, 0, math.radians(-22))
    ear_r.scale = (1.0, 0.5, 1.0)
    ear_r.data.materials.append(mat_fur)
    col.objects.link(ear_r)
    bpy.context.scene.collection.objects.unlink(ear_r)
    
    # Cream Muzzle
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.0016, location=(0, -0.0012, 0.0032))
    muzzle = bpy.context.active_object
    muzzle.scale = (1.25, 0.80, 0.55)
    muzzle.data.materials.append(mat_cream)
    col.objects.link(muzzle)
    bpy.context.scene.collection.objects.unlink(muzzle)
    
    # Tiny pink nose
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.00045, location=(0, -0.0008, 0.0041))
    nose = bpy.context.active_object
    nose.scale = (1.1, 0.7, 0.6)
    nose.data.materials.append(mat_nose)
    col.objects.link(nose)
    bpy.context.scene.collection.objects.unlink(nose)
    
    # Eyes & shine
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.00065, location=(side * 0.0018, 0.0005, 0.0036))
        eye = bpy.context.active_object
        eye.scale = (0.85, 1.1, 0.5)
        eye.data.materials.append(mat_eye)
        col.objects.link(eye)
        bpy.context.scene.collection.objects.unlink(eye)
        
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.00022, location=(side * 0.0018 + 0.0002, 0.0008, 0.0041))
        shine = bpy.context.active_object
        shine.data.materials.append(mat_shine)
        col.objects.link(shine)
        bpy.context.scene.collection.objects.unlink(shine)

    # 3 Tabby Forehead Stripes
    for i, angle in enumerate([-18, 0, 18]):
        bpy.ops.mesh.primitive_cube_add(size=0.0006, location=(i * 0.0008 - 0.0008, 0.0022, 0.0038))
        stripe = bpy.context.active_object
        stripe.scale = (0.45, 1.2, 0.4)
        stripe.rotation_euler = (0, 0, math.radians(angle))
        stripe.data.materials.append(mat_stripes)
        col.objects.link(stripe)
        bpy.context.scene.collection.objects.unlink(stripe)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-kitty.glb"))

# ---------------------------------------------------------------------------
# 6. charm-star: 5-point puffy resin star in gleaming gold
# ---------------------------------------------------------------------------
def build_star(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_star")
    bpy.context.scene.collection.children.link(col)
    
    mat_gold_glitter = create_mat("pal_star_gold", "#FFDD66", roughness=0.18, metallic=0.88)
    
    # 5 rounded star points built from radiating elongated spheres + central dome
    num_points = 5
    point_dist = 0.0024
    for i in range(num_points):
        angle = (2 * math.pi / num_points) * i + math.pi / 2
        x = math.cos(angle) * point_dist
        y = math.sin(angle) * point_dist
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0016, location=(x, y, 0.0016))
        pt = bpy.context.active_object
        pt.rotation_euler = (0, 0, angle)
        pt.scale = (1.5, 0.75, 0.6)
        pt.data.materials.append(mat_gold_glitter)
        col.objects.link(pt)
        bpy.context.scene.collection.objects.unlink(pt)
        
    # Central star dome
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.0022, location=(0, 0, 0.0019))
    center = bpy.context.active_object
    center.scale = (1.0, 1.0, 0.75)
    center.data.materials.append(mat_gold_glitter)
    col.objects.link(center)
    bpy.context.scene.collection.objects.unlink(center)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-star.glb"))

# ---------------------------------------------------------------------------
# 7. charm-pearl: Freshwater baroque pearl with soft nacre luster
# ---------------------------------------------------------------------------
def build_pearl(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_pearl")
    bpy.context.scene.collection.children.link(col)
    
    mat_nacre = create_mat("pal_nacre_pearl", "#FAF6F2", roughness=0.16, metallic=0.22)
    
    # Slightly irregular organic teardrop baroque pearl
    bpy.ops.mesh.primitive_uv_sphere_add(segments=22, ring_count=16, radius=0.0035, location=(0, 0, 0.0026))
    pearl = bpy.context.active_object
    pearl.scale = (0.95, 1.12, 0.82)
    pearl.data.materials.append(mat_nacre)
    col.objects.link(pearl)
    bpy.context.scene.collection.objects.unlink(pearl)
    
    # Second subtle organic mound for baroque character
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.0020, location=(0.0010, 0.0012, 0.0028))
    mound = bpy.context.active_object
    mound.scale = (1.0, 0.9, 0.8)
    mound.data.materials.append(mat_nacre)
    col.objects.link(mound)
    bpy.context.scene.collection.objects.unlink(mound)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-pearl.glb"))

# ---------------------------------------------------------------------------
# 8. charm-satin-bow: Satin ribbon bow with puffy loops, knot & swallowtails
# ---------------------------------------------------------------------------
def build_satin_bow(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_satin_bow")
    bpy.context.scene.collection.children.link(col)
    
    mat_satin = create_mat("pal_satin_pink", "#F4A4BE", roughness=0.26, metallic=0.05)
    
    # Left Loop
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, radius=0.0025, location=(-0.0024, 0.0006, 0.0020))
    loop_l = bpy.context.active_object
    loop_l.rotation_euler = (0, 0, math.radians(-18))
    loop_l.scale = (1.2, 0.8, 0.55)
    loop_l.data.materials.append(mat_satin)
    col.objects.link(loop_l)
    bpy.context.scene.collection.objects.unlink(loop_l)
    
    # Right Loop
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=14, radius=0.0025, location=(0.0024, 0.0006, 0.0020))
    loop_r = bpy.context.active_object
    loop_r.rotation_euler = (0, 0, math.radians(18))
    loop_r.scale = (1.2, 0.8, 0.55)
    loop_r.data.materials.append(mat_satin)
    col.objects.link(loop_r)
    bpy.context.scene.collection.objects.unlink(loop_r)
    
    # Center Knot
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.0014, location=(0, 0.0005, 0.0026))
    knot = bpy.context.active_object
    knot.scale = (0.85, 1.1, 0.8)
    knot.data.materials.append(mat_satin)
    col.objects.link(knot)
    bpy.context.scene.collection.objects.unlink(knot)
    
    # Left Ribbon Tail
    bpy.ops.mesh.primitive_cube_add(size=0.0016, location=(-0.0014, -0.0022, 0.0015))
    tail_l = bpy.context.active_object
    tail_l.rotation_euler = (0, 0, math.radians(35))
    tail_l.scale = (0.7, 1.8, 0.35)
    tail_l.data.materials.append(mat_satin)
    col.objects.link(tail_l)
    bpy.context.scene.collection.objects.unlink(tail_l)
    
    # Right Ribbon Tail
    bpy.ops.mesh.primitive_cube_add(size=0.0016, location=(0.0014, -0.0022, 0.0015))
    tail_r = bpy.context.active_object
    tail_r.rotation_euler = (0, 0, math.radians(-35))
    tail_r.scale = (0.7, 1.8, 0.35)
    tail_r.data.materials.append(mat_satin)
    col.objects.link(tail_r)
    bpy.context.scene.collection.objects.unlink(tail_r)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-satin-bow.glb"))

# ---------------------------------------------------------------------------
# 9. charm-matcha-whisk: Bamboo chasen tea whisk & frothy matcha foam
# ---------------------------------------------------------------------------
def build_matcha_whisk(out_dir):
    reset_scene()
    col = bpy.data.collections.new("charm_matcha_whisk")
    bpy.context.scene.collection.children.link(col)
    
    mat_bamboo = create_mat("pal_bamboo", "#DFBF88", roughness=0.45)
    mat_foam = create_mat("pal_matcha_froth", "#8DB56E", roughness=0.35)
    
    # Bamboo Handle
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.0011, depth=0.0042, location=(0, 0.0022, 0.0016))
    handle = bpy.context.active_object
    handle.data.materials.append(mat_bamboo)
    col.objects.link(handle)
    bpy.context.scene.collection.objects.unlink(handle)
    
    # Whisk Tines (flared conical basket)
    bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=0.0024, radius2=0.0012, depth=0.0036, location=(0, -0.0014, 0.0016))
    tines = bpy.context.active_object
    tines.data.materials.append(mat_bamboo)
    col.objects.link(tines)
    bpy.context.scene.collection.objects.unlink(tines)
    
    # Frothy green matcha foam dollop at the bottom
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.0022, location=(0, -0.0028, 0.0018))
    foam = bpy.context.active_object
    foam.scale = (1.1, 0.75, 0.65)
    foam.data.materials.append(mat_foam)
    col.objects.link(foam)
    bpy.context.scene.collection.objects.unlink(foam)

    for obj in col.objects:
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        flatten_back_and_ground(obj)
        
    export_glb(col, os.path.join(out_dir, "charm-matcha-whisk.glb"))

def main():
    out_dir = "public/models/charms"
    os.makedirs(out_dir, exist_ok=True)
    print("🎨 Building Batch A 3D Nail Charms in Blender...")
    
    build_tulip(out_dir)
    build_daisy(out_dir)
    build_sakura(out_dir)
    build_puffy_heart(out_dir)
    build_kitty(out_dir)
    build_star(out_dir)
    build_pearl(out_dir)
    build_satin_bow(out_dir)
    build_matcha_whisk(out_dir)
    
    print("✨ Batch A charms successfully generated!")

if __name__ == "__main__":
    main()
