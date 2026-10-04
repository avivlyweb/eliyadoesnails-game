"""
blender/scripts/street/build_batch_1.py
======================================
Builds Batch 1 of §5.2 Amsterdam Street Dressing:
1. bike-rack-with-bikes (3.0m wide, 3 distinct omafiets with baskets & bell)
2. canal-bench (1.8m wooden park bench with curved green cast-iron legs)
3. flower-box-window (1.0m terracotta window planter with trailing geraniums)
4. street-planter-tulips (1.2m square wooden tub with mixed blooming tulips)
5. amsterdammertje (0.9m iconic red-brown bollard with three white crosses)
6. canal-railing (2.0m tileable cast-iron canal balustrade)

All models touch ground at Z=0, face -Y, and follow blender/MODELING-RULES.md.
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
    if name in bpy.data.materials:
        return bpy.data.materials[name]
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

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_model(col, model_id, out_dir):
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:
        o.select_set(True)
    dest = os.path.join(out_dir, f"{model_id}.glb")
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dest,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT'
    )
    print(f"✅ Exported {model_id}.glb ({os.path.getsize(dest)} bytes)")

# -----------------------------------------------------------------------------
# 1. BIKE RACK WITH BIKES (bike-rack-with-bikes)
# -----------------------------------------------------------------------------
def build_bike_rack_with_bikes(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_BikeRack")
    bpy.context.scene.collection.children.link(col)

    m_galv = create_pbr_mat("Mat_GalvSteel", "#82898F", roughness=0.35, metallic=0.8)
    m_tire = create_pbr_mat("Mat_TireBlack", "#242526", roughness=0.85, metallic=0.0)
    m_chrome = create_pbr_mat("Mat_Chrome", "#E2E5E8", roughness=0.15, metallic=0.95)
    m_leather = create_pbr_mat("Mat_SaddleLeather", "#6E452B", roughness=0.6, metallic=0.0)
    m_wicker = create_pbr_mat("Mat_WickerBasket", "#C9A779", roughness=0.8, metallic=0.0)
    m_petal = create_pbr_mat("Mat_BikeFlowers", "#F7A8B8", roughness=0.4, metallic=0.0)
    m_leaf = create_pbr_mat("Mat_BikeLeaf", "#5A8564", roughness=0.6, metallic=0.0)

    # 1. Rack base rail: length 2.8m along X, slightly curved steel tubes
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=2.8, location=(0, 0, 0.05), rotation=(0, math.pi/2, 0))
    rail_front = bpy.context.active_object
    rail_front.data.materials.append(m_galv)
    col.objects.link(rail_front)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=2.8, location=(0, 0.5, 0.05), rotation=(0, math.pi/2, 0))
    rail_back = bpy.context.active_object
    rail_back.data.materials.append(m_galv)
    col.objects.link(rail_back)

    # 4 arched wheel hoops
    for x in [-1.05, -0.35, 0.35, 1.05]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.28, minor_radius=0.025, location=(x, 0.25, 0.28), rotation=(math.pi/2, 0, 0))
        hoop = bpy.context.active_object
        hoop.scale = (1.0, 0.5, 1.3)
        hoop.data.materials.append(m_galv)
        col.objects.link(hoop)

    # Helper to build an authentic omafiets
    bike_colors = [
        ("#1F2328", "Mat_BikeBlack"),
        ("#4B6B58", "Mat_BikeGreen"),
        ("#BA5C6E", "Mat_BikeRose")
    ]
    slots = [-0.7, 0.0, 0.7]

    for idx, (frame_hex, mat_name) in enumerate(bike_colors):
        x_off = slots[idx]
        m_frame = create_pbr_mat(mat_name, frame_hex, roughness=0.3, metallic=0.1)

        # Wheels: 28-inch (~0.7m diam)
        # Rear wheel: Y = -0.5, Front wheel: Y = 0.65
        for wy in [-0.48, 0.62]:
            bpy.ops.mesh.primitive_torus_add(major_radius=0.33, minor_radius=0.024, location=(x_off, wy, 0.35), rotation=(math.pi/2, 0, 0))
            tire = bpy.context.active_object
            tire.data.materials.append(m_tire)
            col.objects.link(tire)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.31, depth=0.015, location=(x_off, wy, 0.35), rotation=(0, math.pi/2, 0))
            rim = bpy.context.active_object
            rim.data.materials.append(m_chrome)
            col.objects.link(rim)

            # Wheel hub
            bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.08, location=(x_off, wy, 0.35), rotation=(0, math.pi/2, 0))
            hub = bpy.context.active_object
            hub.data.materials.append(m_chrome)
            col.objects.link(hub)

        # Step-through loop frame
        # Bottom bracket
        bb_pos = (x_off, 0.0, 0.28)
        # Seat tube
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.55, location=(x_off, -0.15, 0.52), rotation=(0.28, 0, 0))
        st = bpy.context.active_object
        st.data.materials.append(m_frame)
        col.objects.link(st)

        # Down tube / loop tube
        bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.68, location=(x_off, 0.12, 0.44), rotation=(-0.65, 0, 0))
        dt = bpy.context.active_object
        dt.data.materials.append(m_frame)
        col.objects.link(dt)

        # Head tube
        bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.28, location=(x_off, 0.45, 0.72), rotation=(0.32, 0, 0))
        ht = bpy.context.active_object
        ht.data.materials.append(m_frame)
        col.objects.link(ht)

        # Front fork down to front hub
        bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.42, location=(x_off, 0.54, 0.52), rotation=(0.35, 0, 0))
        ff = bpy.context.active_object
        ff.data.materials.append(m_frame)
        col.objects.link(ff)

        # Rear stays
        bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.48, location=(x_off, -0.32, 0.33), rotation=(-0.15, 0, 0))
        rs = bpy.context.active_object
        rs.data.materials.append(m_frame)
        col.objects.link(rs)

        # Rear luggage carrier
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_off, -0.42, 0.72))
        carrier = bpy.context.active_object
        carrier.scale = (0.16, 0.42, 0.02)
        carrier.data.materials.append(m_frame)
        col.objects.link(carrier)

        # Saddle
        bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.04, depth=0.08, location=(x_off, -0.22, 0.82), rotation=(0, 0, -math.pi/2))
        saddle = bpy.context.active_object
        saddle.scale = (0.7, 1.4, 0.5)
        saddle.data.materials.append(m_leather)
        col.objects.link(saddle)

        # Handlebars: curved sweeping Dutch cruiser style
        bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.016, location=(x_off, 0.38, 0.95), rotation=(0.3, 0, 0))
        bars = bpy.context.active_object
        bars.scale = (1.0, 0.6, 0.4)
        bars.data.materials.append(m_chrome)
        col.objects.link(bars)

        # Bell on left bar
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(x_off - 0.22, 0.36, 0.97))
        bell = bpy.context.active_object
        bell.data.materials.append(create_pbr_mat("Mat_BellGold", "#E4C07A", roughness=0.2, metallic=0.9))
        col.objects.link(bell)

        # Add wicker basket to the middle bike (idx == 1)
        if idx == 1:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_off, 0.58, 0.92))
            basket = bpy.context.active_object
            basket.scale = (0.34, 0.24, 0.22)
            basket.data.materials.append(m_wicker)
            col.objects.link(basket)

            # Flowers inside basket
            for fx, fy in [(-0.08, 0.56), (0.07, 0.60), (0.0, 0.54)]:
                bpy.ops.mesh.primitive_ico_sphere_add(radius=0.06, location=(x_off + fx, fy, 1.05))
                fl = bpy.context.active_object
                fl.data.materials.append(m_petal)
                col.objects.link(fl)

    export_model(col, "bike-rack-with-bikes", out_dir)

# -----------------------------------------------------------------------------
# 2. CANAL BENCH (canal-bench)
# -----------------------------------------------------------------------------
def build_canal_bench(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CanalBench")
    bpy.context.scene.collection.children.link(col)

    m_cast_iron = create_pbr_mat("Mat_CanalGreenIron", "#203B2A", roughness=0.45, metallic=0.2)
    m_wood = create_pbr_mat("Mat_BenchWood", "#9E6D48", roughness=0.68, metallic=0.0)

    width = 1.80 # 1.8m bench width

    # Two curved ornate cast-iron legs at X = -0.75 and +0.75
    for x in [-0.75, 0.75]:
        # Ground foot bar
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0.05, 0.03))
        foot = bpy.context.active_object
        foot.scale = (0.08, 0.65, 0.06)
        foot.data.materials.append(m_cast_iron)
        col.objects.link(foot)

        # Front vertical leg
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.42, location=(x, -0.22, 0.23))
        f_leg = bpy.context.active_object
        f_leg.data.materials.append(m_cast_iron)
        col.objects.link(f_leg)

        # Back upright & backrest support
        bpy.ops.mesh.primitive_cylinder_add(radius=0.038, depth=0.86, location=(x, 0.26, 0.44), rotation=(0.18, 0, 0))
        b_leg = bpy.context.active_object
        b_leg.data.materials.append(m_cast_iron)
        col.objects.link(b_leg)

        # Curved armrest
        bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.025, location=(x, 0.0, 0.58), rotation=(0, math.pi/2, 0))
        arm = bpy.context.active_object
        arm.scale = (1.0, 0.7, 0.3)
        arm.data.materials.append(m_cast_iron)
        col.objects.link(arm)

    # Seat slats (4 wooden planks, Y from -0.22 to 0.14, Z=0.44)
    for i in range(4):
        y_pos = -0.20 + i * 0.11
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_pos, 0.44))
        slat = bpy.context.active_object
        slat.scale = (width, 0.085, 0.028)
        slat.data.materials.append(m_wood)
        col.objects.link(slat)

    # Backrest slats (4 wooden planks, Y from 0.20 to 0.28, Z from 0.56 to 0.86)
    for i in range(4):
        z_pos = 0.56 + i * 0.10
        y_pos = 0.21 + i * 0.025
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_pos, z_pos), rotation=(0.18, 0, 0))
        b_slat = bpy.context.active_object
        b_slat.scale = (width, 0.028, 0.082)
        b_slat.data.materials.append(m_wood)
        col.objects.link(b_slat)

    export_model(col, "canal-bench", out_dir)

# -----------------------------------------------------------------------------
# 3. FLOWER BOX WINDOW (flower-box-window)
# -----------------------------------------------------------------------------
def build_flower_box_window(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_FlowerBox")
    bpy.context.scene.collection.children.link(col)

    m_terra = create_pbr_mat("Mat_TerracottaTrough", "#B8664D", roughness=0.82, metallic=0.0)
    m_soil = create_pbr_mat("Mat_GardenSoil", "#38291F", roughness=0.95, metallic=0.0)
    m_leaf = create_pbr_mat("Mat_GeraniumLeaf", "#487854", roughness=0.65, metallic=0.0)
    m_red_petal = create_pbr_mat("Mat_GeraniumRed", "#E02E42", roughness=0.35, metallic=0.0)
    m_pink_petal = create_pbr_mat("Mat_GeraniumPink", "#F27E9D", roughness=0.35, metallic=0.0)

    # Terracotta trough: width 1.0m, height 0.22m, depth 0.26m
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.11))
    box = bpy.context.active_object
    box.scale = (1.0, 0.26, 0.22)
    box.data.materials.append(m_terra)
    col.objects.link(box)

    # Molded outer top rim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.22))
    rim = bpy.context.active_object
    rim.scale = (1.05, 0.30, 0.04)
    rim.data.materials.append(m_terra)
    col.objects.link(rim)

    # Soil fill
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.21))
    soil = bpy.context.active_object
    soil.scale = (0.96, 0.22, 0.04)
    soil.data.materials.append(m_soil)
    col.objects.link(soil)

    # Lush leaves & flower blossom clusters along the trough
    # Front-trailing leaves spilling over the front edge (Y < -0.12)
    for x in [-0.4, -0.22, -0.05, 0.12, 0.32, 0.44]:
        # Green leaf clump
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.10, location=(x, -0.10, 0.25))
        foliage = bpy.context.active_object
        foliage.scale = (1.1, 1.2, 0.7)
        foliage.data.materials.append(m_leaf)
        col.objects.link(foliage)

        # Trailing foliage cascade
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.07, location=(x + 0.03, -0.16, 0.16))
        trail = bpy.context.active_object
        trail.scale = (0.9, 0.9, 1.3)
        trail.data.materials.append(m_leaf)
        col.objects.link(trail)

    # Flower clusters (domed heads of geranium blossoms)
    flowers = [
        (-0.35, -0.05, 0.32, m_red_petal),
        (-0.18, 0.02, 0.35, m_pink_petal),
        (0.0, -0.06, 0.34, m_red_petal),
        (0.18, 0.03, 0.36, m_pink_petal),
        (0.36, -0.04, 0.33, m_red_petal),
    ]

    for fx, fy, fz, fmat in flowers:
        for ox, oy, oz in [(0, 0, 0), (-0.03, 0.02, 0.03), (0.03, -0.02, 0.02)]:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(fx + ox, fy + oy, fz + oz))
            blossom = bpy.context.active_object
            blossom.data.materials.append(fmat)
            col.objects.link(blossom)

    export_model(col, "flower-box-window", out_dir)

# -----------------------------------------------------------------------------
# 4. STREET PLANTER TULIPS (street-planter-tulips)
# -----------------------------------------------------------------------------
def build_street_planter_tulips(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_PlanterTulips")
    bpy.context.scene.collection.children.link(col)

    m_wood = create_pbr_mat("Mat_PlanterWood", "#7C5335", roughness=0.75, metallic=0.0)
    m_band = create_pbr_mat("Mat_PlanterIronBand", "#28292B", roughness=0.4, metallic=0.8)
    m_soil = create_pbr_mat("Mat_RichCompost", "#2E2118", roughness=0.95, metallic=0.0)
    m_stem = create_pbr_mat("Mat_TulipStem", "#56854F", roughness=0.6, metallic=0.0)

    tulip_colors = [
        create_pbr_mat("Mat_TulipRed", "#DF2D38", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipYellow", "#F5CE42", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipPink", "#F47D9B", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipWhite", "#F7F5EE", roughness=0.35, metallic=0.0),
    ]

    # Big square wooden planter: 1.2m across, 0.55m tall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.275))
    box = bpy.context.active_object
    box.scale = (1.20, 1.20, 0.55)
    box.data.materials.append(m_wood)
    col.objects.link(box)

    # 4 corner post blocks
    for cx in [-0.58, 0.58]:
        for cy in [-0.58, 0.58]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, 0.285))
            post = bpy.context.active_object
            post.scale = (0.12, 0.12, 0.57)
            post.data.materials.append(m_wood)
            col.objects.link(post)

    # Two black iron perimeter bands (top and bottom)
    for z_band in [0.12, 0.46]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, z_band))
        band = bpy.context.active_object
        band.scale = (1.23, 1.23, 0.04)
        band.data.materials.append(m_band)
        col.objects.link(band)

    # Soil mound inside
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0, 0, 0.45))
    soil = bpy.context.active_object
    soil.scale = (0.95, 0.95, 0.28)
    soil.data.materials.append(m_soil)
    col.objects.link(soil)

    # 16 mixed blooming tulips arranged in a grid with natural jitter
    grid = [
        (-0.35, -0.35), (-0.12, -0.36), (0.14, -0.34), (0.36, -0.35),
        (-0.36, -0.12), (-0.10, -0.10), (0.12, -0.12), (0.35, -0.11),
        (-0.34,  0.13), (-0.11,  0.11), (0.13,  0.14), (0.36,  0.12),
        (-0.35,  0.36), (-0.13,  0.35), (0.12,  0.37), (0.34,  0.35),
    ]

    for idx, (tx, ty) in enumerate(grid):
        col_mat = tulip_colors[idx % len(tulip_colors)]
        t_height = 0.32 + (idx % 3) * 0.03
        base_z = 0.54

        # Stem
        bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=t_height, location=(tx, ty, base_z + t_height/2))
        stem = bpy.context.active_object
        stem.data.materials.append(m_stem)
        col.objects.link(stem)

        # Flower cup
        top_z = base_z + t_height
        bpy.ops.mesh.primitive_cone_add(radius1=0.052, radius2=0.02, depth=0.10, location=(tx, ty, top_z), rotation=(math.pi, 0, 0))
        flower = bpy.context.active_object
        flower.scale = (1.0, 1.0, 1.2)
        flower.data.materials.append(col_mat)
        col.objects.link(flower)

        # Leaves
        bpy.ops.mesh.primitive_cone_add(radius1=0.035, radius2=0.005, depth=0.20, location=(tx + 0.02, ty + 0.02, base_z + 0.10), rotation=(0.3, 0.2, 0))
        leaf = bpy.context.active_object
        leaf.scale = (0.5, 1.2, 1.0)
        leaf.data.materials.append(m_stem)
        col.objects.link(leaf)

    export_model(col, "street-planter-tulips", out_dir)

# -----------------------------------------------------------------------------
# 5. AMSTERDAMMERTJE (amsterdammertje)
# -----------------------------------------------------------------------------
def build_amsterdammertje(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_Amsterdammertje")
    bpy.context.scene.collection.children.link(col)

    # Reddish brown iron paint: #7A281E
    m_bollard = create_pbr_mat("Mat_AmsterdamRedBrown", "#7A281E", roughness=0.52, metallic=0.25)
    m_white = create_pbr_mat("Mat_CrossWhite", "#F8F6F2", roughness=0.35, metallic=0.0)

    # Base flared collar (Z=0 to 0.08)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.125, depth=0.08, location=(0, 0, 0.04))
    base = bpy.context.active_object
    base.data.materials.append(m_bollard)
    col.objects.link(base)

    # Main cylindrical column (slightly tapered: 0.105m to 0.095m, height 0.64m)
    bpy.ops.mesh.primitive_cone_add(radius1=0.105, radius2=0.095, depth=0.64, location=(0, 0, 0.40))
    shaft = bpy.context.active_object
    shaft.data.materials.append(m_bollard)
    col.objects.link(shaft)

    # Neck decorative groove / ring (Z=0.72)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.098, minor_radius=0.015, location=(0, 0, 0.72))
    neck = bpy.context.active_object
    neck.data.materials.append(m_bollard)
    col.objects.link(neck)

    # Dome top cap (Z=0.72 to 0.90)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.095, location=(0, 0, 0.74))
    dome = bpy.context.active_object
    dome.scale = (1.0, 1.0, 1.5)
    dome.data.materials.append(m_bollard)
    col.objects.link(dome)

    # Cap finial nub
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.022, location=(0, 0, 0.89))
    nub = bpy.context.active_object
    nub.data.materials.append(m_bollard)
    col.objects.link(nub)

    # Front facing is -Y: add the three vertical St. Andrew's crosses (XXX)
    # Positions along Z: 0.54, 0.44, 0.34. Front face Y = -0.102
    for z_cross in [0.54, 0.44, 0.34]:
        # Cross bar 1: 45 deg
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.102, z_cross), rotation=(0, math.radians(45), 0))
        b1 = bpy.context.active_object
        b1.scale = (0.055, 0.008, 0.012)
        b1.data.materials.append(m_white)
        col.objects.link(b1)

        # Cross bar 2: -45 deg
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.102, z_cross), rotation=(0, math.radians(-45), 0))
        b2 = bpy.context.active_object
        b2.scale = (0.055, 0.008, 0.012)
        b2.data.materials.append(m_white)
        col.objects.link(b2)

    export_model(col, "amsterdammertje", out_dir)

# -----------------------------------------------------------------------------
# 6. CANAL RAILING (canal-railing)
# -----------------------------------------------------------------------------
def build_canal_railing(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CanalRailing")
    bpy.context.scene.collection.children.link(col)

    m_iron = create_pbr_mat("Mat_CanalIron", "#222524", roughness=0.45, metallic=0.7)
    m_gold = create_pbr_mat("Mat_RailingFinial", "#D4AF37", roughness=0.25, metallic=0.9)

    length = 2.0 # 2.0m tileable segment
    x_half = length / 2.0

    # Two heavy end posts at X = -x_half and +x_half
    for x in [-x_half, x_half]:
        # Post shaft (0.95m tall)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 0.475))
        post = bpy.context.active_object
        post.scale = (0.10, 0.10, 0.95)
        post.data.materials.append(m_iron)
        col.objects.link(post)

        # Post base plinth
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 0.05))
        plinth = bpy.context.active_object
        plinth.scale = (0.14, 0.14, 0.10)
        plinth.data.materials.append(m_iron)
        col.objects.link(plinth)

        # Pyramidal cap
        bpy.ops.mesh.primitive_cone_add(radius1=0.08, radius2=0.0, depth=0.08, location=(x, 0, 0.99))
        cap = bpy.context.active_object
        cap.data.materials.append(m_iron)
        col.objects.link(cap)

    # Top rounded handrail (Z = 0.90)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=length, location=(0, 0, 0.90), rotation=(0, math.pi/2, 0))
    top_rail = bpy.context.active_object
    top_rail.data.materials.append(m_iron)
    col.objects.link(top_rail)

    # Bottom rail (Z = 0.16)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=length, location=(0, 0, 0.16), rotation=(0, math.pi/2, 0))
    bot_rail = bpy.context.active_object
    bot_rail.data.materials.append(m_iron)
    col.objects.link(bot_rail)

    # Mid horizontal rail (Z = 0.54)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=length, location=(0, 0, 0.54), rotation=(0, math.pi/2, 0))
    mid_rail = bpy.context.active_object
    mid_rail.data.materials.append(m_iron)
    col.objects.link(mid_rail)

    # 10 vertical balusters (between X = -0.85 and +0.85)
    for i in range(10):
        bx = -0.81 + i * 0.18
        bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.74, location=(bx, 0, 0.53))
        bal = bpy.context.active_object
        bal.data.materials.append(m_iron)
        col.objects.link(bal)

    # Central decorative medallion / ring in middle (X = 0, Z = 0.72)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.014, location=(0, 0, 0.72), rotation=(math.pi/2, 0, 0))
    ring = bpy.context.active_object
    ring.data.materials.append(m_iron)
    col.objects.link(ring)

    # Brass decorative center rosette
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.026, location=(0, 0, 0.72))
    rosette = bpy.context.active_object
    rosette.data.materials.append(m_gold)
    col.objects.link(rosette)

    export_model(col, "canal-railing", out_dir)

def main():
    out_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/street"
    print("🚀 Building Batch 1 Street Dressing Models...")
    build_bike_rack_with_bikes(out_dir)
    build_canal_bench(out_dir)
    build_flower_box_window(out_dir)
    build_street_planter_tulips(out_dir)
    build_amsterdammertje(out_dir)
    build_canal_railing(out_dir)
    print("✨ Finished Batch 1!")

if __name__ == "__main__":
    main()
