# blender/scripts/charms/build_batch_b.py
# Builds all 12 Batch B original 3D nail charms for Eliya Does Nails
# Follows docs/game-plan/07-CHARMS-BLENDER.md & blender/MODELING-RULES.md
#
# Contract:
# - Flat back on XY plane at Z = 0 (origin at center of flat back)
# - Front facing +Z (exports to glTF +Y)
# - Real-world proportions (width ~0.006m - 0.009m / 6-9mm)
# - Puffy, glossy, rounded, jelly gel aesthetic (no sharp corners)
# - glTF-safe standard PBR materials
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

def join_and_finalize(root_name):
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    if not objs:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = root_name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    flatten_back_and_ground(obj)
    return obj

def export_glb(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
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
# 1. charm-mini-windmill: Tiny Dutch windmill (Amsterdam icon, De Gooyer homage)
# ---------------------------------------------------------------------------
def build_mini_windmill(out_dir):
    reset_scene()
    
    mat_body = create_mat("pal_mill_body", "#E6DFC8", roughness=0.3)
    mat_cap = create_mat("pal_mill_cap", "#4A3A2C", roughness=0.35)
    mat_sails = create_mat("pal_mill_sails", "#F7F5EB", roughness=0.25)
    mat_axle = create_mat("pal_mill_gold", "#D9B26A", roughness=0.2, metallic=0.6)
    
    # Octagonal tapered body
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.0028, radius2=0.0018, depth=0.0045, location=(0, -0.0005, 0.0022))
    body = bpy.context.active_object
    body.data.materials.append(mat_body)
    
    # Rounded dome cap
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0019, location=(0, 0.0008, 0.0043))
    cap = bpy.context.active_object
    cap.scale = (1.0, 1.1, 0.7)
    cap.data.materials.append(mat_cap)
    
    # 4 lattice sails
    for i in range(4):
        ang = i * (math.pi / 2) + 0.35
        bpy.ops.mesh.primitive_cube_add(size=0.001, location=(math.cos(ang) * 0.0022, math.sin(ang) * 0.0022 + 0.0008, 0.0049))
        blade = bpy.context.active_object
        blade.scale = (0.7, 3.8, 0.25)
        blade.rotation_euler = (0, 0, ang)
        blade.data.materials.append(mat_sails)
    
    # Center gold axle boss
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0006, location=(0, 0.0008, 0.0052))
    axle = bpy.context.active_object
    axle.data.materials.append(mat_axle)
    
    join_and_finalize("charm_mini_windmill")
    export_glb(os.path.join(out_dir, "charm-mini-windmill.glb"))

# ---------------------------------------------------------------------------
# 2. charm-stroopwafel: Dutch waffle cookie with waffle grid & caramel glaze
# ---------------------------------------------------------------------------
def build_stroopwafel(out_dir):
    reset_scene()
    
    mat_waffle = create_mat("pal_waffle_crust", "#C88B46", roughness=0.35)
    mat_caramel = create_mat("pal_caramel_ooze", "#8C4A19", roughness=0.15)
    
    # Round embossed cookie disk
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.0038, depth=0.0014, location=(0, 0, 0.0014))
    waffle = bpy.context.active_object
    waffle.data.materials.append(mat_waffle)
    
    # Caramel filling layer peek
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.0039, depth=0.0004, location=(0, 0, 0.0012))
    caramel = bpy.context.active_object
    caramel.data.materials.append(mat_caramel)
    
    # Diagonal waffle grid lines
    for angle in [0.785, -0.785]:
        for offset in [-0.0022, -0.0011, 0, 0.0011, 0.0022]:
            bpy.ops.mesh.primitive_cube_add(size=0.001, location=(
                -math.sin(angle) * offset,
                math.cos(angle) * offset,
                0.0021
            ))
            line = bpy.context.active_object
            line.scale = (0.25, 6.2, 0.2)
            line.rotation_euler = (0, 0, angle)
            line.data.materials.append(mat_caramel)
            
    # Cute bite in top-right or caramel drip
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0007, location=(0.0026, -0.0024, 0.0016))
    drip = bpy.context.active_object
    drip.scale = (1.2, 0.8, 1.0)
    drip.data.materials.append(mat_caramel)
    
    join_and_finalize("charm_stroopwafel")
    export_glb(os.path.join(out_dir, "charm-stroopwafel.glb"))

# ---------------------------------------------------------------------------
# 3. charm-omafiets: Eliya's iconic Amsterdam omafiets bicycle
# ---------------------------------------------------------------------------
def build_omafiets(out_dir):
    reset_scene()
    
    mat_frame = create_mat("pal_bike_rose", "#C24F68", roughness=0.25)
    mat_chrome = create_mat("pal_bike_chrome", "#F0EDE6", roughness=0.15, metallic=0.7)
    mat_basket = create_mat("pal_bike_wicker", "#D9B88A", roughness=0.45)
    mat_tire = create_mat("pal_bike_tire", "#FAF5EE", roughness=0.3)
    
    # 2 Wheels (cream vintage Dutch tires)
    for x_pos in [-0.0027, 0.0027]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.0018, minor_radius=0.00038, major_segments=20, minor_segments=8, location=(x_pos, -0.0008, 0.0018))
        tire = bpy.context.active_object
        tire.rotation_euler = (math.pi / 2, 0, 0)
        tire.data.materials.append(mat_tire)
        # Hub
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.0004, depth=0.0008, location=(x_pos, -0.0008, 0.0018))
        hub = bpy.context.active_object
        hub.rotation_euler = (math.pi / 2, 0, 0)
        hub.data.materials.append(mat_chrome)
        
    # Curved step-through frame
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.00035, depth=0.0042, location=(0, -0.0008, 0.0017))
    tube = bpy.context.active_object
    tube.rotation_euler = (0, 1.25, 0)
    tube.data.materials.append(mat_frame)
    
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.00035, depth=0.0034, location=(-0.0012, -0.0008, 0.0028))
    seat_tube = bpy.context.active_object
    seat_tube.rotation_euler = (0, -0.4, 0)
    seat_tube.data.materials.append(mat_frame)
    
    # Handlebars & fork
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.00035, depth=0.0036, location=(0.0022, -0.0008, 0.0031))
    fork = bpy.context.active_object
    fork.rotation_euler = (0, -0.3, 0)
    fork.data.materials.append(mat_chrome)
    
    # Wicker front basket
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0.0032, -0.0006, 0.0038))
    basket = bpy.context.active_object
    basket.scale = (1.4, 1.0, 1.2)
    basket.data.materials.append(mat_basket)
    
    # Saddle
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0006, location=(-0.0016, -0.0008, 0.0042))
    saddle = bpy.context.active_object
    saddle.scale = (1.5, 0.8, 0.5)
    saddle.data.materials.append(mat_frame)
    
    join_and_finalize("charm_omafiets")
    export_glb(os.path.join(out_dir, "charm-omafiets.glb"))

# ---------------------------------------------------------------------------
# 4. charm-canal-house: Mini canal house stepped-gable facade
# ---------------------------------------------------------------------------
def build_canal_house(out_dir):
    reset_scene()
    
    mat_brick = create_mat("pal_house_brick", "#B24C58", roughness=0.35)
    mat_trim = create_mat("pal_house_white", "#FAF5EE", roughness=0.25)
    mat_window = create_mat("pal_house_glass", "#85B6D4", roughness=0.15)
    
    # Main house facade block
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0, -0.0005, 0.0028))
    wall = bpy.context.active_object
    wall.scale = (4.8, 1.2, 5.0)
    wall.data.materials.append(mat_brick)
    
    # 3 stepped gable steps
    for idx, (w, h, z_loc) in enumerate([(3.6, 1.2, 0.0056), (2.4, 1.2, 0.0066), (1.2, 1.2, 0.0074)]):
        bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0, -0.0005, z_loc))
        step = bpy.context.active_object
        step.scale = (w, h, 0.8)
        step.data.materials.append(mat_brick)
        
    # Hoist beam at the apex
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.0002, depth=0.0015, location=(0, 0.0002, 0.0078))
    beam = bpy.context.active_object
    beam.rotation_euler = (math.pi / 2, 0, 0)
    beam.data.materials.append(mat_trim)
    
    # 4 cute windows
    for wx in [-0.0014, 0.0014]:
        for wz in [0.0028, 0.0046]:
            bpy.ops.mesh.primitive_cube_add(size=0.001, location=(wx, 0.0002, wz))
            win = bpy.context.active_object
            win.scale = (0.9, 0.3, 1.2)
            win.data.materials.append(mat_window)
            
    # Ground floor arched door
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0006, location=(0, 0.0002, 0.0012))
    door = bpy.context.active_object
    door.scale = (1.0, 0.4, 1.6)
    door.data.materials.append(mat_trim)
    
    join_and_finalize("charm_canal_house")
    export_glb(os.path.join(out_dir, "charm-canal-house.glb"))

# ---------------------------------------------------------------------------
# 5. charm-clog: Tiny yellow wooden clog with a tulip on the toe
# ---------------------------------------------------------------------------
def build_clog(out_dir):
    reset_scene()
    
    mat_wood = create_mat("pal_clog_yellow", "#F4CF56", roughness=0.28)
    mat_tulip = create_mat("pal_clog_tulip", "#DE425B", roughness=0.25)
    mat_leaf = create_mat("pal_clog_green", "#60935D", roughness=0.3)
    
    # Elongated wooden shoe body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.0022, location=(0, 0, 0.0018))
    body = bpy.context.active_object
    body.scale = (0.9, 1.8, 0.8)
    body.data.materials.append(mat_wood)
    
    # Pointed upturned toe
    bpy.ops.mesh.primitive_cone_add(vertices=14, radius1=0.0014, radius2=0.0002, depth=0.0022, location=(0, 0.0028, 0.0024))
    toe = bpy.context.active_object
    toe.rotation_euler = (0.45, 0, 0)
    toe.data.materials.append(mat_wood)
    
    # Foot opening carve
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0011, location=(0, -0.0010, 0.0026))
    opening = bpy.context.active_object
    opening.scale = (0.8, 1.2, 0.7)
    opening.data.materials.append(create_mat("pal_clog_inside", "#D9B341", roughness=0.4))
    
    # Hand-painted tulip on top toe
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0005, location=(0, 0.0020, 0.0031))
    tulip = bpy.context.active_object
    tulip.scale = (1.0, 1.1, 0.5)
    tulip.data.materials.append(mat_tulip)
    
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.0003, location=(0.0004, 0.0012, 0.0030))
    leaf = bpy.context.active_object
    leaf.scale = (0.6, 1.2, 0.4)
    leaf.data.materials.append(mat_leaf)
    
    join_and_finalize("charm_clog")
    export_glb(os.path.join(out_dir, "charm-clog.glb"))

# ---------------------------------------------------------------------------
# 6. charm-mochi-bunny: Peach Mochi Bunny face (official game mascot)
# ---------------------------------------------------------------------------
def build_mochi_bunny(out_dir):
    reset_scene()
    
    mat_fur = create_mat("pal_bunny_cream", "#FFF6F0", roughness=0.28)
    mat_blush = create_mat("pal_bunny_blush", "#F7A8B8", roughness=0.32)
    mat_eye = create_mat("pal_bunny_eye", "#35221B", roughness=0.1)
    
    # Chubby rounded mochi face
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.0032, location=(0, -0.0004, 0.0026))
    head = bpy.context.active_object
    head.scale = (1.18, 0.95, 0.78)
    head.data.materials.append(mat_fur)
    
    # Puffy bunny ears
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0012, location=(side * 0.0016, 0.0026, 0.0026))
        ear = bpy.context.active_object
        ear.scale = (0.6, 1.5, 0.6)
        ear.rotation_euler = (0, 0, -side * 0.22)
        ear.data.materials.append(mat_fur)
        
        # Pink inner ear
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0007, location=(side * 0.0016, 0.0026, 0.0031))
        inner = bpy.context.active_object
        inner.scale = (0.5, 1.3, 0.3)
        inner.rotation_euler = (0, 0, -side * 0.22)
        inner.data.materials.append(mat_blush)
        
        # Rosy cheeks
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.00065, location=(side * 0.0022, -0.0008, 0.0034))
        cheek = bpy.context.active_object
        cheek.scale = (1.0, 0.7, 0.4)
        cheek.data.materials.append(mat_blush)
        
        # Closed happy crescent eye
        bpy.ops.mesh.primitive_torus_add(major_radius=0.0004, minor_radius=0.0001, major_segments=12, minor_segments=6, location=(side * 0.0012, -0.0001, 0.0038))
        eye = bpy.context.active_object
        eye.rotation_euler = (math.pi / 2, 0, 0)
        eye.data.materials.append(mat_eye)
        
    # Tiny pink nose
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.0003, location=(0, -0.0007, 0.0038))
    nose = bpy.context.active_object
    nose.data.materials.append(mat_blush)
    
    join_and_finalize("charm_mochi_bunny")
    export_glb(os.path.join(out_dir, "charm-mochi-bunny.glb"))

# ---------------------------------------------------------------------------
# 7. charm-strawberry: Glossy strawberry with calyx leaves & gold seed dots
# ---------------------------------------------------------------------------
def build_strawberry(out_dir):
    reset_scene()
    
    mat_berry = create_mat("pal_straw_red", "#E62E4C", roughness=0.18)
    mat_leaf = create_mat("pal_straw_calyx", "#589E50", roughness=0.28)
    mat_seed = create_mat("pal_straw_gold", "#F5D77F", roughness=0.2, metallic=0.4)
    
    # Tapered heart-shaped berry
    bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=0.0032, radius2=0.0012, depth=0.0052, location=(0, -0.0005, 0.0022))
    berry = bpy.context.active_object
    berry.rotation_euler = (math.pi, 0, 0)
    berry.scale = (1.0, 0.75, 1.0)
    berry.data.materials.append(mat_berry)
    
    # 5-pointed star calyx on top
    for i in range(5):
        ang = i * (math.pi * 2 / 5)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0008, location=(
            math.cos(ang) * 0.0018,
            math.sin(ang) * 0.0018 + 0.0020,
            0.0034
        ))
        leaf = bpy.context.active_object
        leaf.scale = (0.5, 1.4, 0.3)
        leaf.rotation_euler = (0, 0, ang)
        leaf.data.materials.append(mat_leaf)
        
    # Tiny stem
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.0003, depth=0.0014, location=(0, 0.0026, 0.0036))
    stem = bpy.context.active_object
    stem.data.materials.append(mat_leaf)
    
    # Golden seed dots
    for (sx, sy, sz) in [
        (-0.0014, 0.0006, 0.0030), (0.0014, 0.0006, 0.0030),
        (-0.0010, -0.0008, 0.0028), (0.0010, -0.0008, 0.0028),
        (0.0, -0.0018, 0.0024), (0.0, 0.0, 0.0032)
    ]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=6, ring_count=6, radius=0.00022, location=(sx, sy, sz))
        seed = bpy.context.active_object
        seed.data.materials.append(mat_seed)
        
    join_and_finalize("charm_strawberry")
    export_glb(os.path.join(out_dir, "charm-strawberry.glb"))

# ---------------------------------------------------------------------------
# 8. charm-butterfly: Two-tone translucent lavender/pink wings & pearl body
# ---------------------------------------------------------------------------
def build_butterfly(out_dir):
    reset_scene()
    
    mat_upper = create_mat("pal_fly_lavender", "#C29BDE", roughness=0.22)
    mat_lower = create_mat("pal_fly_pink", "#F5A3C7", roughness=0.22)
    mat_body = create_mat("pal_fly_pearl", "#FAF4EE", roughness=0.18, metallic=0.2)
    mat_gold = create_mat("pal_fly_gold", "#E8C174", roughness=0.15, metallic=0.7)
    
    # Center pearl body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0008, location=(0, 0, 0.0024))
    body = bpy.context.active_object
    body.scale = (0.7, 2.2, 0.7)
    body.data.materials.append(mat_body)
    
    # 2 Upper wings (large rounded lobes)
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.0022, location=(side * 0.0024, 0.0014, 0.0020))
        wing = bpy.context.active_object
        wing.scale = (1.2, 0.9, 0.28)
        wing.rotation_euler = (0.2, side * 0.25, side * 0.3)
        wing.data.materials.append(mat_upper)
        
        # 2 Lower wings (smaller teardrops)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0016, location=(side * 0.0019, -0.0014, 0.0018))
        lwing = bpy.context.active_object
        lwing.scale = (1.0, 0.8, 0.25)
        lwing.rotation_euler = (-0.2, side * 0.2, -side * 0.3)
        lwing.data.materials.append(mat_lower)
        
        # Antenna with gold ball tip
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.00012, depth=0.0018, location=(side * 0.0008, 0.0024, 0.0026))
        ant = bpy.context.active_object
        ant.rotation_euler = (0, 0, -side * 0.45)
        ant.data.materials.append(mat_gold)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.00028, location=(side * 0.0014, 0.0031, 0.0026))
        ball = bpy.context.active_object
        ball.data.materials.append(mat_gold)
        
    join_and_finalize("charm_butterfly")
    export_glb(os.path.join(out_dir, "charm-butterfly.glb"))

# ---------------------------------------------------------------------------
# 9. charm-moon: Satin gold crescent moon with hanging glitter star
# ---------------------------------------------------------------------------
def build_moon(out_dir):
    reset_scene()
    
    mat_gold = create_mat("pal_moon_gold", "#F2D07E", roughness=0.18, metallic=0.6)
    
    # Outer curved torus segment
    bpy.ops.mesh.primitive_torus_add(major_radius=0.0032, minor_radius=0.00095, major_segments=28, minor_segments=12, location=(-0.0006, 0, 0.0016))
    moon = bpy.context.active_object
    moon.scale = (1.0, 1.0, 0.7)
    moon.data.materials.append(mat_gold)
    
    # Cut crescent profile by removing half or masking with join
    bm = bmesh.new()
    bm.from_mesh(moon.data)
    for v in list(bm.verts):
        if v.co.x > 0.0012:
            bm.verts.remove(v)
    bm.to_mesh(moon.data)
    bm.free()
    moon.data.update()
    
    # Tiny dangling 4-point star in the crescent curve
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0.0010, 0.0004, 0.0020))
    star1 = bpy.context.active_object
    star1.scale = (0.4, 1.4, 0.3)
    star1.data.materials.append(mat_gold)
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0.0010, 0.0004, 0.0020))
    star2 = bpy.context.active_object
    star2.scale = (1.4, 0.4, 0.3)
    star2.data.materials.append(mat_gold)
    
    join_and_finalize("charm_moon")
    export_glb(os.path.join(out_dir, "charm-moon.glb"))

# ---------------------------------------------------------------------------
# 10. charm-cloud: Puffy white cumulus cloud with rosy cheeks and happy smile
# ---------------------------------------------------------------------------
def build_cloud(out_dir):
    reset_scene()
    
    mat_white = create_mat("pal_cloud_white", "#FFFFFF", roughness=0.28)
    mat_pink = create_mat("pal_cloud_pink", "#F7ADC0", roughness=0.35)
    mat_face = create_mat("pal_cloud_face", "#544641", roughness=0.2)
    
    # 3 Puffy lobes
    lobes = [
        (0, 0.0004, 0.0024, 0.0022),
        (-0.0021, -0.0004, 0.0020, 0.0017),
        (0.0021, -0.0004, 0.0020, 0.0017)
    ]
    for (lx, ly, lz, lr) in lobes:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=lr, location=(lx, ly, lz))
        sphere = bpy.context.active_object
        sphere.scale = (1.0, 0.9, 0.7)
        sphere.data.materials.append(mat_white)
        
    # Flat cloud base bar
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0, -0.0008, 0.0018))
    base = bpy.context.active_object
    base.scale = (4.8, 1.4, 1.4)
    base.data.materials.append(mat_white)
    
    # Rosy blush spots
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0005, location=(side * 0.0015, -0.0004, 0.0030))
        blush = bpy.context.active_object
        blush.scale = (1.0, 0.7, 0.3)
        blush.data.materials.append(mat_pink)
        
        # Tiny cute eye
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.00025, location=(side * 0.0009, 0.0004, 0.0033))
        eye = bpy.context.active_object
        eye.data.materials.append(mat_face)
        
    # Cute little smile curve
    bpy.ops.mesh.primitive_torus_add(major_radius=0.0004, minor_radius=0.00008, major_segments=10, minor_segments=6, location=(0, -0.0004, 0.0032))
    smile = bpy.context.active_object
    smile.rotation_euler = (math.pi / 2, 0, 0)
    smile.data.materials.append(mat_face)
    
    join_and_finalize("charm_cloud")
    export_glb(os.path.join(out_dir, "charm-cloud.glb"))

# ---------------------------------------------------------------------------
# 11. charm-shell: Scallop sea shell with fluted ridges & pearl sheen
# ---------------------------------------------------------------------------
def build_shell(out_dir):
    reset_scene()
    
    mat_shell = create_mat("pal_shell_nacre", "#FAF2E8", roughness=0.18, metallic=0.15)
    mat_hinge = create_mat("pal_shell_gold", "#E8C88B", roughness=0.2, metallic=0.5)
    
    # Fan of radiating flutes
    for idx, ang in enumerate([-0.5, -0.25, 0, 0.25, 0.5]):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.0012, location=(
            math.sin(ang) * 0.0022,
            math.cos(ang) * 0.0022 + 0.0002,
            0.0022
        ))
        flute = bpy.context.active_object
        flute.scale = (0.6, 2.0, 0.35)
        flute.rotation_euler = (0, 0, -ang)
        flute.data.materials.append(mat_shell)
        
    # Base hinge plate
    bpy.ops.mesh.primitive_cube_add(size=0.001, location=(0, -0.0018, 0.0016))
    hinge = bpy.context.active_object
    hinge.scale = (2.2, 0.9, 0.6)
    hinge.data.materials.append(mat_hinge)
    
    # Tiny iridescent center pearl
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=10, radius=0.0007, location=(0, -0.0006, 0.0026))
    pearl = bpy.context.active_object
    pearl.data.materials.append(create_mat("pal_shell_pearl", "#FFF8F2", roughness=0.12, metallic=0.25))
    
    join_and_finalize("charm_shell")
    export_glb(os.path.join(out_dir, "charm-shell.glb"))

# ---------------------------------------------------------------------------
# 12. charm-cherry: Duo of glossy plump cherries with leaf stem
# ---------------------------------------------------------------------------
def build_cherry(out_dir):
    reset_scene()
    
    mat_cherry = create_mat("pal_cherry_red", "#C9183B", roughness=0.15)
    mat_stem = create_mat("pal_cherry_stem", "#5E8C4E", roughness=0.3)
    
    # Left & right cherries
    for side, cx in [(-1, -0.0016), (1, 0.0016)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.0019, location=(cx, -0.0010, 0.0022))
        cherry = bpy.context.active_object
        cherry.scale = (1.05, 0.95, 0.8)
        cherry.data.materials.append(mat_cherry)
        
        # Stem arching up
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.00018, depth=0.0036, location=(cx * 0.45, 0.0008, 0.0026))
        stem = bpy.context.active_object
        stem.rotation_euler = (0, 0, -side * 0.42)
        stem.data.materials.append(mat_stem)
        
    # Top joining leaf
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.0009, location=(0.0008, 0.0025, 0.0028))
    leaf = bpy.context.active_object
    leaf.scale = (0.5, 1.4, 0.25)
    leaf.rotation_euler = (0, 0, 0.6)
    leaf.data.materials.append(mat_stem)
    
    join_and_finalize("charm_cherry")
    export_glb(os.path.join(out_dir, "charm-cherry.glb"))

# ---------------------------------------------------------------------------
# Master builder
# ---------------------------------------------------------------------------
def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    out_dir = os.path.join(repo_root, "public", "models", "charms")
    os.makedirs(out_dir, exist_ok=True)
    
    print("=== BUILDING BATCH B CHARMS ===")
    build_mini_windmill(out_dir)
    build_stroopwafel(out_dir)
    build_omafiets(out_dir)
    build_canal_house(out_dir)
    build_clog(out_dir)
    build_mochi_bunny(out_dir)
    build_strawberry(out_dir)
    build_butterfly(out_dir)
    build_moon(out_dir)
    build_cloud(out_dir)
    build_shell(out_dir)
    build_cherry(out_dir)
    print("=== ALL 12 BATCH B CHARMS EXPORTED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()
