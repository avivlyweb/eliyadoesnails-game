"""
blender/scripts/street/build_batch_3.py
======================================
Builds Batch 3 of §5.2 Amsterdam Street & Architecture:
13. market-stall-flowers (3m wooden stall with green/white awning & zinc buckets of tulips)
14. market-stall-stroopwafel (2.5m stall with waffle griddle & stacked syrup waffles)
15. crate-stack (1m stack of 3 wooden harvest crates with red/green apples)
16. herring-cart (2m traditional Dutch herring cart with spoked wheels & ice tray)
17. canal-house-narrow-a (10.5m facade, spout gable, dark red brick, bakery shopfront)
18. canal-house-narrow-b (11.2m facade, step gable, ochre brick, antiquarian bookshop)

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
# 13. MARKET STALL FLOWERS (market-stall-flowers)
# -----------------------------------------------------------------------------
def build_market_stall_flowers(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_StallFlowers")
    bpy.context.scene.collection.children.link(col)

    m_timber = create_pbr_mat("Mat_FlowerStallWood", "#7A5030", roughness=0.75, metallic=0.0)
    m_counter = create_pbr_mat("Mat_FlowerStallDeck", "#B5865E", roughness=0.65, metallic=0.0)
    m_green_awn = create_pbr_mat("Mat_AwningGreen", "#3B6E47", roughness=0.55, metallic=0.0)
    m_white_awn = create_pbr_mat("Mat_AwningWhite", "#F8F7F2", roughness=0.55, metallic=0.0)
    m_zinc = create_pbr_mat("Mat_ZincBucket", "#8E9499", roughness=0.35, metallic=0.7)
    m_leaf = create_pbr_mat("Mat_FlowerFoliage", "#4B7A54", roughness=0.6, metallic=0.0)
    m_paper = create_pbr_mat("Mat_BrownKraftPaper", "#C7A677", roughness=0.85, metallic=0.0)

    tulip_mats = [
        create_pbr_mat("Mat_FlRed", "#E02E42", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_FlPink", "#F587A3", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_FlYellow", "#FACD32", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_FlWhite", "#FAF8F2", roughness=0.35, metallic=0.0),
    ]

    # Corner timber posts: 3.0m wide (X), 1.6m deep (Y), 2.5m tall (Z)
    for px in [-1.45, 1.45]:
        for py in [-0.75, 0.75]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 1.25))
            post = bpy.context.active_object
            post.scale = (0.10, 0.10, 2.50)
            post.data.materials.append(m_timber)
            col.objects.link(post)

    # 3-tier stepped bleacher counter for flower buckets (Z = 0.45, 0.75, 1.05)
    for idx, (sz, sy) in enumerate([(0.45, -0.55), (0.75, -0.20), (1.05, 0.15)]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sy, sz))
        step = bpy.context.active_object
        step.scale = (2.85, 0.35, 0.05)
        step.data.materials.append(m_counter)
        col.objects.link(step)

        # Under-step skirt
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sy - 0.17, sz/2))
        sk = bpy.context.active_object
        sk.scale = (2.85, 0.04, sz)
        sk.data.materials.append(m_timber)
        col.objects.link(sk)

        # Zinc flower buckets on each tier
        for bx in [-1.05, -0.52, 0.0, 0.52, 1.05]:
            # Tapered zinc flower bucket
            bpy.ops.mesh.primitive_cone_add(radius1=0.15, radius2=0.11, depth=0.32, location=(bx, sy, sz + 0.185))
            bucket = bpy.context.active_object
            bucket.data.materials.append(m_zinc)
            col.objects.link(bucket)

            # Flower bouquet head
            f_mat = tulip_mats[(idx * 2 + int(bx * 2)) % len(tulip_mats)]
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=(bx, sy, sz + 0.38))
            bloom = bpy.context.active_object
            bloom.scale = (1.0, 1.0, 0.8)
            bloom.data.materials.append(f_mat)
            col.objects.link(bloom)

            # Paper wrap collar
            bpy.ops.mesh.primitive_cone_add(radius1=0.17, radius2=0.12, depth=0.14, location=(bx, sy, sz + 0.28))
            wrap = bpy.context.active_object
            wrap.data.materials.append(m_paper)
            col.objects.link(wrap)

    # Green & white striped awning on top (Z = 2.45 to 2.15, sloping forward)
    num_stripes = 10
    stripe_w = 3.10 / num_stripes
    for i in range(num_stripes):
        sx = -1.55 + (i + 0.5) * stripe_w
        smat = m_green_awn if i % 2 == 0 else m_white_awn
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, -0.10, 2.36), rotation=(-0.25, 0, 0))
        awn = bpy.context.active_object
        awn.scale = (stripe_w, 1.85, 0.04)
        awn.data.materials.append(smat)
        col.objects.link(awn)

        # Valance scallop
        bpy.ops.mesh.primitive_cylinder_add(radius=stripe_w/2, depth=0.18, location=(sx, -0.98, 2.14))
        scallop = bpy.context.active_object
        scallop.scale = (1.0, 0.2, 1.0)
        scallop.data.materials.append(smat)
        col.objects.link(scallop)

    export_model(col, "market-stall-flowers", out_dir)

# -----------------------------------------------------------------------------
# 14. MARKET STALL STROOPWAFEL (market-stall-stroopwafel)
# -----------------------------------------------------------------------------
def build_market_stall_stroopwafel(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_StallStroopwafel")
    bpy.context.scene.collection.children.link(col)

    m_timber = create_pbr_mat("Mat_StroopWood", "#6E3F24", roughness=0.75, metallic=0.0)
    m_counter = create_pbr_mat("Mat_StroopCounter", "#A8764E", roughness=0.6, metallic=0.0)
    m_red_awn = create_pbr_mat("Mat_AwningBurgundy", "#8A242B", roughness=0.55, metallic=0.0)
    m_cream_awn = create_pbr_mat("Mat_AwningWarmCream", "#F7F2E6", roughness=0.55, metallic=0.0)
    m_waffle = create_pbr_mat("Mat_WaffleGolden", "#CFA261", roughness=0.6, metallic=0.0)
    m_syrup = create_pbr_mat("Mat_CaramelSyrup", "#85451D", roughness=0.2, metallic=0.0)
    m_iron = create_pbr_mat("Mat_WaffleGriddleIron", "#2B2D2F", roughness=0.4, metallic=0.8)
    m_glass = create_pbr_mat("Mat_DisplayGlass", "#9ABCC7", roughness=0.1, metallic=0.1)

    # Stall timber frame: 2.5m wide, 1.6m deep, 2.4m tall
    for px in [-1.20, 1.20]:
        for py in [-0.75, 0.75]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 1.20))
            post = bpy.context.active_object
            post.scale = (0.09, 0.09, 2.40)
            post.data.materials.append(m_timber)
            col.objects.link(post)

    # Main counter table (Z = 0.88, width 2.4m, depth 0.85m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.35, 0.88))
    table = bpy.context.active_object
    table.scale = (2.40, 0.85, 0.06)
    table.data.materials.append(m_counter)
    col.objects.link(table)

    # Modesty panel skirt
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.72, 0.44))
    skirt = bpy.context.active_object
    skirt.scale = (2.36, 0.04, 0.84)
    skirt.data.materials.append(m_timber)
    col.objects.link(skirt)

    # Round heavy cast-iron waffle griddle on counter (X = -0.55, Y = -0.32, Z = 0.94)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.08, location=(-0.55, -0.32, 0.94))
    griddle = bpy.context.active_object
    griddle.data.materials.append(m_iron)
    col.objects.link(griddle)

    # Griddle open top lid angled up
    bpy.ops.mesh.primitive_cylinder_add(radius=0.23, depth=0.05, location=(-0.55, -0.18, 1.15), rotation=(0.8, 0, 0))
    lid = bpy.context.active_object
    lid.data.materials.append(m_iron)
    col.objects.link(lid)

    # Glass sneeze-guard display case (X = 0.45, Y = -0.35, Z = 1.10)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.45, -0.35, 1.10))
    case = bpy.context.active_object
    case.scale = (1.00, 0.65, 0.38)
    case.data.materials.append(m_glass)
    col.objects.link(case)

    # Stacks of golden round stroopwafels inside glass case
    for sx, sy in [(0.25, -0.42), (0.45, -0.42), (0.65, -0.42), (0.35, -0.28), (0.55, -0.28)]:
        for h in range(5):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.016, location=(sx, sy, 0.93 + h * 0.018))
            waffle = bpy.context.active_object
            waffle.data.materials.append(m_waffle)
            col.objects.link(waffle)

    # Hanging chalkboard menu: "WARME STROOPWAFELS € 3,50"
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.74, 0.48))
    board = bpy.context.active_object
    board.scale = (0.70, 0.02, 0.34)
    board.data.materials.append(create_pbr_mat("Mat_StroopChalk", "#242526", roughness=0.7, metallic=0.0))
    col.objects.link(board)

    # Awning: burgundy & warm cream stripes
    num_stripes = 8
    stripe_w = 2.60 / num_stripes
    for i in range(num_stripes):
        sx = -1.30 + (i + 0.5) * stripe_w
        smat = m_red_awn if i % 2 == 0 else m_cream_awn
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, -0.10, 2.26), rotation=(-0.25, 0, 0))
        awn = bpy.context.active_object
        awn.scale = (stripe_w, 1.80, 0.04)
        awn.data.materials.append(smat)
        col.objects.link(awn)

        # Scallop
        bpy.ops.mesh.primitive_cylinder_add(radius=stripe_w/2, depth=0.18, location=(sx, -0.96, 2.04))
        scallop = bpy.context.active_object
        scallop.scale = (1.0, 0.2, 1.0)
        scallop.data.materials.append(smat)
        col.objects.link(scallop)

    export_model(col, "market-stall-stroopwafel", out_dir)

# -----------------------------------------------------------------------------
# 15. CRATE STACK (crate-stack)
# -----------------------------------------------------------------------------
def build_crate_stack(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CrateStack")
    bpy.context.scene.collection.children.link(col)

    m_crate = create_pbr_mat("Mat_HarvestCrate", "#9B6B45", roughness=0.78, metallic=0.0)
    m_inner = create_pbr_mat("Mat_CrateInterior", "#B88A63", roughness=0.82, metallic=0.0)
    m_apple_red = create_pbr_mat("Mat_AppleRed", "#DF2B35", roughness=0.3, metallic=0.0)
    m_apple_green = create_pbr_mat("Mat_AppleGreen", "#89B84D", roughness=0.3, metallic=0.0)

    # Helper to build a wooden slatted orchard crate (0.55m x 0.40m x 0.30m)
    def make_crate(cx, cy, cz, rot_z=0):
        # 4 corner wooden blocks
        for bx in [-0.25, 0.25]:
            for by in [-0.18, 0.18]:
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + bx, cy + by, cz + 0.15), rotation=(0, 0, rot_z))
                post = bpy.context.active_object
                post.scale = (0.04, 0.04, 0.30)
                post.data.materials.append(m_crate)
                col.objects.link(post)

        # Floor slats
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 0.02), rotation=(0, 0, rot_z))
        fl = bpy.context.active_object
        fl.scale = (0.54, 0.38, 0.03)
        fl.data.materials.append(m_inner)
        col.objects.link(fl)

        # 3 horizontal perimeter slats (Z = 0.06, 0.15, 0.24)
        for sz in [0.06, 0.15, 0.24]:
            # Front & back slats
            for dy in [-0.19, 0.19]:
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy + dy, cz + sz), rotation=(0, 0, rot_z))
                slat = bpy.context.active_object
                slat.scale = (0.54, 0.02, 0.06)
                slat.data.materials.append(m_crate)
                col.objects.link(slat)
            # Side slats
            for dx in [-0.26, 0.26]:
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + dx, cy, cz + sz), rotation=(0, 0, rot_z))
                slat = bpy.context.active_object
                slat.scale = (0.02, 0.38, 0.06)
                slat.data.materials.append(m_crate)
                col.objects.link(slat)

    # 1. Base Crate Left
    make_crate(-0.25, 0.0, 0.0, rot_z=0.05)
    # 2. Base Crate Right
    make_crate(0.28, 0.05, 0.0, rot_z=-0.08)
    # 3. Top Crate (stacked across the two, tilted slightly askew)
    make_crate(0.02, 0.02, 0.31, rot_z=0.22)

    # Fill top crate with apples (red and crisp green)
    for ax, ay in [(-0.16, -0.08), (-0.05, -0.09), (0.07, -0.07), (0.16, -0.06),
                   (-0.12, 0.05), (0.0, 0.06), (0.12, 0.07), (-0.06, 0.14), (0.06, 0.13)]:
        c_mat = m_apple_red if (ax + ay) > 0 else m_apple_green
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.048, location=(ax, ay, 0.50))
        apple = bpy.context.active_object
        apple.scale = (1.0, 1.0, 0.92)
        apple.data.materials.append(c_mat)
        col.objects.link(apple)

    # A couple apples fallen onto the ground beside the crates
    for fx, fy in [(-0.48, -0.22), (0.46, -0.18)]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.048, location=(fx, fy, 0.048))
        f_apple = bpy.context.active_object
        f_apple.data.materials.append(m_apple_red)
        col.objects.link(f_apple)

    export_model(col, "crate-stack", out_dir)

# -----------------------------------------------------------------------------
# 16. HERRING CART (herring-cart)
# -----------------------------------------------------------------------------
def build_herring_cart(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_HerringCart")
    bpy.context.scene.collection.children.link(col)

    m_cart_white = create_pbr_mat("Mat_CartEnamelWhite", "#F8F6F1", roughness=0.4, metallic=0.0)
    m_cart_blue = create_pbr_mat("Mat_CartRoyalBlue", "#1A4685", roughness=0.35, metallic=0.0)
    m_cart_red = create_pbr_mat("Mat_CartDutchRed", "#C72E3A", roughness=0.35, metallic=0.0)
    m_ice = create_pbr_mat("Mat_CrushedIce", "#CFE4EE", roughness=0.2, metallic=0.1)
    m_silver = create_pbr_mat("Mat_SilverFish", "#D4DCDE", roughness=0.15, metallic=0.85)
    m_timber = create_pbr_mat("Mat_CartWood", "#7C4E2D", roughness=0.7, metallic=0.0)
    m_iron_wheel = create_pbr_mat("Mat_WheelIron", "#2B2D2F", roughness=0.5, metallic=0.8)

    # Two large spoke wheels at sides (X = -0.65 and +0.65, Y = 0.0, radius 0.45m)
    for wx in [-0.65, 0.65]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.45, minor_radius=0.025, location=(wx, 0, 0.45), rotation=(0, math.pi/2, 0))
        rim = bpy.context.active_object
        rim.data.materials.append(m_iron_wheel)
        col.objects.link(rim)

        # Hub
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.10, location=(wx, 0, 0.45), rotation=(0, math.pi/2, 0))
        hub = bpy.context.active_object
        hub.data.materials.append(m_iron_wheel)
        col.objects.link(hub)

        # 8 spokes
        for sp in range(8):
            ang = sp * math.pi / 4
            bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.86, location=(wx, 0, 0.45), rotation=(ang, 0, 0))
            spoke = bpy.context.active_object
            spoke.data.materials.append(m_iron_wheel)
            col.objects.link(spoke)

    # Main cart chest body: length 1.8m (Y), width 1.1m (X), height 0.65m (Z = 0.35 to 1.00)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.68))
    chest = bpy.context.active_object
    chest.scale = (1.10, 1.80, 0.65)
    chest.data.materials.append(m_cart_white)
    col.objects.link(chest)

    # Blue bottom trim band
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.40))
    band = bpy.context.active_object
    band.scale = (1.12, 1.82, 0.12)
    band.data.materials.append(m_cart_blue)
    col.objects.link(band)

    # Front counter serving surface (stainless/marble) with ice trough
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.02))
    counter = bpy.context.active_object
    counter.scale = (1.16, 1.86, 0.05)
    counter.data.materials.append(m_cart_white)
    col.objects.link(counter)

    # Ice bed in recessed trough (Z = 1.05)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.20, 1.05))
    ice = bpy.context.active_object
    ice.scale = (0.95, 1.10, 0.05)
    ice.data.materials.append(m_ice)
    col.objects.link(ice)

    # Silver Dutch herrings laid on the crushed ice bed
    for hy in [-0.55, -0.38, -0.21, -0.04, 0.13]:
        for hx in [-0.25, 0.0, 0.25]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.035, radius2=0.015, depth=0.28, location=(hx, hy, 1.08), rotation=(0, math.pi/2, 0.15))
            fish = bpy.context.active_object
            fish.scale = (0.5, 1.2, 1.0)
            fish.data.materials.append(m_silver)
            col.objects.link(fish)

    # 4 canopy upright poles (Z = 1.0 to 2.2)
    for px in [-0.52, 0.52]:
        for py in [-0.85, 0.85]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=1.25, location=(px, py, 1.625))
            pole = bpy.context.active_object
            pole.data.materials.append(m_timber)
            col.objects.link(pole)

    # Canopy arched roof (blue, white & red Dutch tricolor stripes)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.25))
    roof = bpy.context.active_object
    roof.scale = (1.25, 1.95, 0.05)
    roof.data.materials.append(m_cart_red)
    col.objects.link(roof)

    # Dutch flag pennant on top pole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.60, location=(0, -0.85, 2.55))
    flagpole = bpy.context.active_object
    flagpole.data.materials.append(m_iron_wheel)
    col.objects.link(flagpole)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.14, -0.85, 2.70))
    flag = bpy.context.active_object
    flag.scale = (0.28, 0.01, 0.18)
    flag.data.materials.append(m_cart_blue)
    col.objects.link(flag)

    export_model(col, "herring-cart", out_dir)

# -----------------------------------------------------------------------------
# 17. CANAL HOUSE NARROW A (canal-house-narrow-a) - Spout Gable + Bakery
# -----------------------------------------------------------------------------
def build_canal_house_narrow_a(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CanalHouseA")
    bpy.context.scene.collection.children.link(col)

    m_brick = create_pbr_mat("Mat_RedAmsterdamBrick", "#7E3228", roughness=0.85, metallic=0.0) # warm red brick
    m_stone = create_pbr_mat("Mat_SandstoneTrim", "#E2D3B8", roughness=0.65, metallic=0.0) # cream sandstone
    m_wood = create_pbr_mat("Mat_BakeryWood", "#1E3B29", roughness=0.45, metallic=0.0) # canal green woodwork
    m_glass = create_pbr_mat("Mat_BakeryGlass", "#8BB6C7", roughness=0.1, metallic=0.1)
    m_roof = create_pbr_mat("Mat_SlateRoof", "#383E45", roughness=0.8, metallic=0.0)
    m_gold = create_pbr_mat("Mat_GoldLettering", "#DDA83B", roughness=0.25, metallic=0.9)

    width = 4.20
    depth = 3.20
    height = 8.50 # to roofline

    # 1. Main brick façade block (Z = 0 to 8.5)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height/2))
    body = bpy.context.active_object
    body.scale = (width, depth, height)
    body.data.materials.append(m_brick)
    col.objects.link(body)

    # 2. Spout Gable (Tuitgevel) triangular top (Z = 8.5 to 10.8)
    bpy.ops.mesh.primitive_cone_add(radius1=width/2, radius2=0.45, depth=2.30, location=(0, -depth/2 + 0.15, 8.50 + 1.15), rotation=(0, 0, math.pi/4))
    gable = bpy.context.active_object
    gable.scale = (1.0, 0.15, 1.0)
    gable.data.materials.append(m_brick)
    col.objects.link(gable)

    # Sandstone gable coping border
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 + 0.16, 10.85))
    hoist_block = bpy.context.active_object
    hoist_block.scale = (0.90, 0.30, 0.20)
    hoist_block.data.materials.append(m_stone)
    col.objects.link(hoist_block)

    # Classic Dutch Hoist Beam (Hijsbalk) protruding forward
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.40, 10.75))
    beam = bpy.context.active_object
    beam.scale = (0.16, 0.90, 0.16)
    beam.data.materials.append(m_wood)
    col.objects.link(beam)

    # Iron hoist hook
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.02, location=(0, -depth/2 - 0.75, 10.60))
    hook = bpy.context.active_object
    hook.data.materials.append(create_pbr_mat("Mat_IronHook", "#222426", roughness=0.3, metallic=0.9))
    col.objects.link(hook)

    # 3. Ground Floor Bakery Shopfront (Y = -depth/2)
    # Bay window projection
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.85, -depth/2 - 0.15, 1.45))
    shop_bay = bpy.context.active_object
    shop_bay.scale = (2.10, 0.45, 2.50)
    shop_bay.data.materials.append(m_wood)
    col.objects.link(shop_bay)

    # Shopfront display windows
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.85, -depth/2 - 0.38, 1.45))
    win = bpy.context.active_object
    win.scale = (1.80, 0.04, 1.80)
    win.data.materials.append(m_glass)
    col.objects.link(win)

    # Shop fascia sign board ("DE AMSTERDAMSCHE BAKKERIJ")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.85, -depth/2 - 0.39, 2.55))
    sign = bpy.context.active_object
    sign.scale = (2.05, 0.05, 0.32)
    sign.data.materials.append(m_wood)
    col.objects.link(sign)

    # Gold sign letters
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.85, -depth/2 - 0.42, 2.55))
    letters = bpy.context.active_object
    letters.scale = (1.60, 0.02, 0.14)
    letters.data.materials.append(m_gold)
    col.objects.link(letters)

    # Entrance door & stoep steps (X = 1.25)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.25, -depth/2 - 0.30, 0.25))
    steps = bpy.context.active_object
    steps.scale = (1.10, 0.65, 0.50)
    steps.data.materials.append(m_stone)
    col.objects.link(steps)

    # Front door
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.25, -depth/2 - 0.02, 1.65))
    door = bpy.context.active_object
    door.scale = (0.95, 0.08, 2.30)
    door.data.materials.append(m_wood)
    col.objects.link(door)

    # 4. Upper Floors 2, 3, 4 sash windows (Z = 4.0, 6.2, 8.2)
    for wz in [4.0, 6.2, 8.2]:
        for wx in [-1.15, 0.0, 1.15]:
            # Sandstone window lintel
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.03, wz + 0.85))
            lintel = bpy.context.active_object
            lintel.scale = (0.85, 0.08, 0.14)
            lintel.data.materials.append(m_stone)
            col.objects.link(lintel)

            # Window frame
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.02, wz))
            wf = bpy.context.active_object
            wf.scale = (0.75, 0.06, 1.50)
            wf.data.materials.append(m_stone)
            col.objects.link(wf)

            # Window glass
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.04, wz))
            wg = bpy.context.active_object
            wg.scale = (0.65, 0.03, 1.38)
            wg.data.materials.append(m_glass)
            col.objects.link(wg)

    export_model(col, "canal-house-narrow-a", out_dir)

# -----------------------------------------------------------------------------
# 18. CANAL HOUSE NARROW B (canal-house-narrow-b) - Step Gable + Bookshop
# -----------------------------------------------------------------------------
def build_canal_house_narrow_b(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CanalHouseB")
    bpy.context.scene.collection.children.link(col)

    m_brick = create_pbr_mat("Mat_OchreBrick", "#B88D56", roughness=0.82, metallic=0.0) # warm ochre/sand brick
    m_stone = create_pbr_mat("Mat_LimestoneTrim", "#F0E8D5", roughness=0.6, metallic=0.0) # white/cream limestone
    m_wood = create_pbr_mat("Mat_BookshopNavy", "#1C2D42", roughness=0.45, metallic=0.0) # navy woodwork
    m_glass = create_pbr_mat("Mat_BookshopGlass", "#8BB4C4", roughness=0.1, metallic=0.1)
    m_gold = create_pbr_mat("Mat_GoldBookshopSign", "#E0B345", roughness=0.25, metallic=0.9)

    width = 4.40
    depth = 3.40
    height = 8.80

    # 1. Main brick façade block
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height/2))
    body = bpy.context.active_object
    body.scale = (width, depth, height)
    body.data.materials.append(m_brick)
    col.objects.link(body)

    # 2. Classic Dutch Step Gable (Trapgevel) with 5 symmetrical steps
    steps_data = [
        # (step width, step height, center Z)
        (4.20, 0.50, 9.05),
        (3.30, 0.50, 9.55),
        (2.40, 0.50, 10.05),
        (1.50, 0.50, 10.55),
        (0.80, 0.60, 11.05), # top step with pinnacle
    ]

    for sw, sh, sz in steps_data:
        # Brick step block
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 + 0.15, sz))
        step = bpy.context.active_object
        step.scale = (sw, 0.30, sh)
        step.data.materials.append(m_brick)
        col.objects.link(step)

        # Limestone coping cap tablet on top of each step
        for ex in [-sw/2, sw/2]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ex, -depth/2 + 0.16, sz + sh/2))
            cap = bpy.context.active_object
            cap.scale = (0.28, 0.34, 0.08)
            cap.data.materials.append(m_stone)
            col.objects.link(cap)

    # Top hoist beam (Hijsbalk)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.40, 10.95))
    beam = bpy.context.active_object
    beam.scale = (0.16, 0.90, 0.16)
    beam.data.materials.append(m_wood)
    col.objects.link(beam)

    # 3. Ground Floor Bookshop Shopfront
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.12, 1.45))
    shop = bpy.context.active_object
    shop.scale = (4.20, 0.38, 2.50)
    shop.data.materials.append(m_wood)
    col.objects.link(shop)

    # Left & right book display bay windows
    for bx in [-1.20, 0.60]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, -depth/2 - 0.32, 1.45))
        bwin = bpy.context.active_object
        bwin.scale = (1.40, 0.04, 1.80)
        bwin.data.materials.append(m_glass)
        col.objects.link(bwin)

    # Fascia sign ("BOEKHANDEL 'T CANAELTJE")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.33, 2.55))
    sign = bpy.context.active_object
    sign.scale = (3.80, 0.04, 0.32)
    sign.data.materials.append(m_wood)
    col.objects.link(sign)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.36, 2.55))
    sign_text = bpy.context.active_object
    sign_text.scale = (2.80, 0.02, 0.14)
    sign_text.data.materials.append(m_gold)
    col.objects.link(sign_text)

    # Recessed entry door at X = 1.70
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.70, -depth/2 + 0.05, 1.45))
    door = bpy.context.active_object
    door.scale = (0.80, 0.08, 2.20)
    door.data.materials.append(m_wood)
    col.objects.link(door)

    # 4. Upper Floors Sash Windows with carved stone pediments
    for wz in [4.2, 6.4, 8.4]:
        for wx in [-1.25, 0.0, 1.25]:
            # Arched stone pediment
            bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.08, location=(wx, -depth/2 - 0.03, wz + 0.85), rotation=(math.pi/2, 0, 0))
            ped = bpy.context.active_object
            ped.scale = (1.0, 0.4, 1.0)
            ped.data.materials.append(m_stone)
            col.objects.link(ped)

            # Window frame
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.02, wz))
            wf = bpy.context.active_object
            wf.scale = (0.78, 0.06, 1.50)
            wf.data.materials.append(m_stone)
            col.objects.link(wf)

            # Window glass
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.04, wz))
            wg = bpy.context.active_object
            wg.scale = (0.68, 0.03, 1.38)
            wg.data.materials.append(m_glass)
            col.objects.link(wg)

    export_model(col, "canal-house-narrow-b", out_dir)

def main():
    street_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/street"
    arch_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/architecture"
    print("🚀 Building Batch 3 Street & Architecture Models...")
    build_market_stall_flowers(street_dir)
    build_market_stall_stroopwafel(street_dir)
    build_crate_stack(street_dir)
    build_herring_cart(street_dir)
    build_canal_house_narrow_a(arch_dir)
    build_canal_house_narrow_b(arch_dir)
    print("✨ Finished Batch 3!")

if __name__ == "__main__":
    main()
