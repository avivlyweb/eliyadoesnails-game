"""
blender/scripts/street/build_batch_5.py
======================================
Builds Batch 5 of §5.2 & §5.3 (Street Dressing & District Gap Moments):
25. lantern-string (6m catenary cable with 7 glowing warm Edison incandescent bulbs)
26. pigeon-pair (Two plump Amsterdam city pigeons peck/bobbing)
27. cat-on-crate (Curled up sleeping calico cat napping on a wooden crate)
28. painter-easel-canal (Wooden painting easel with canal landscape canvas)
29. ice-cream-cart (Vintage pushcart with striped umbrella & brass gelato churns)
30. book-crate-sale (Crate packed with vintage books on sale)
31. heart-lock-railing (Canal railing segment with colorful love padlocks)
32. duck-family (Mother duck with 3 little ducklings swimming in row)
33. picnic-blanket (Gingham picnic blanket with wicker basket & tea mugs)

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

def create_pbr_mat(name, hex_color, roughness=0.6, metallic=0.0, emissive=None, emissive_strength=1.0):
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
    if emissive:
        bsdf.inputs["Emission Color"].default_value = hex_to_linear(emissive)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
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
# 25. LANTERN STRING (lantern-string)
# -----------------------------------------------------------------------------
def build_lantern_string(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_LanternString")
    bpy.context.scene.collection.children.link(col)

    m_wire = create_pbr_mat("Mat_BlackWire", "#1A1B1C", roughness=0.7, metallic=0.2)
    m_brass = create_pbr_mat("Mat_BulbSocket", "#BFA04A", roughness=0.3, metallic=0.85)
    m_bulb = create_pbr_mat("Mat_WarmBulb", "#FFF4D1", roughness=0.1, metallic=0.1, emissive="#FFDC8A", emissive_strength=2.5)

    span = 6.0
    num_bulbs = 7
    # 7 light bulbs along a drooping catenary arc (Z = 0.0 at ends X = +/-3, droop -0.65m in middle)
    x_positions = [-span/2 + (i + 0.5) * (span / num_bulbs) for i in range(num_bulbs)]

    # Wire segments between bulbs
    for i in range(num_bulbs + 1):
        x0 = -span/2 if i == 0 else x_positions[i-1]
        x1 = span/2 if i == num_bulbs else x_positions[i]
        xm = (x0 + x1) / 2
        # Catenary parabola: z = droop * (1 - (x / (span/2))^2)
        zm = -0.55 * (1.0 - (xm / (span/2.0))**2)

        seg_len = math.hypot(x1 - x0, 0.1)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=seg_len, location=(xm, 0, zm), rotation=(0, math.pi/2, 0))
        wire = bpy.context.active_object
        wire.data.materials.append(m_wire)
        col.objects.link(wire)

    # 7 hanging bulbs
    for bx in x_positions:
        bz = -0.55 * (1.0 - (bx / (span/2.0))**2)
        # Socket collar
        bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.07, location=(bx, 0, bz - 0.035))
        sock = bpy.context.active_object
        sock.data.materials.append(m_brass)
        col.objects.link(sock)

        # Edison bulb teardrop
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, location=(bx, 0, bz - 0.11))
        bulb = bpy.context.active_object
        bulb.scale = (1.0, 1.0, 1.35)
        bulb.data.materials.append(m_bulb)
        col.objects.link(bulb)

    export_model(col, "lantern-string", out_dir)

# -----------------------------------------------------------------------------
# 26. PIGEON PAIR (pigeon-pair)
# -----------------------------------------------------------------------------
def build_pigeon_pair(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_PigeonPair")
    bpy.context.scene.collection.children.link(col)

    m_grey = create_pbr_mat("Mat_PigeonGrey", "#6B7280", roughness=0.7, metallic=0.0)
    m_wing = create_pbr_mat("Mat_PigeonWing", "#4B5563", roughness=0.75, metallic=0.0)
    m_irid = create_pbr_mat("Mat_NeckIrid", "#4F8275", roughness=0.4, metallic=0.2)
    m_beak = create_pbr_mat("Mat_PigeonBeak", "#F59E0B", roughness=0.3, metallic=0.0)
    m_eye = create_pbr_mat("Mat_PigeonEye", "#1F2937", roughness=0.1, metallic=0.0)

    # Helper to build a cute chunky Amsterdam street pigeon (length ~0.26m)
    def make_pigeon(px, py, pz, rot_z=0, pecking=False):
        # Plump body
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(px, py, pz + 0.12))
        body = bpy.context.active_object
        body.scale = (0.9, 1.3, 0.95)
        body.data.materials.append(m_grey)
        col.objects.link(body)

        # Iridescent neck ring
        neck_z = pz + 0.14 if not pecking else pz + 0.08
        neck_y = py - 0.08 if not pecking else py - 0.12
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.05, location=(px, neck_y, neck_z))
        neck = bpy.context.active_object
        neck.data.materials.append(m_irid)
        col.objects.link(neck)

        # Head
        head_z = pz + 0.20 if not pecking else pz + 0.06
        head_y = py - 0.12 if not pecking else py - 0.18
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(px, head_y, head_z))
        head = bpy.context.active_object
        head.data.materials.append(m_grey)
        col.objects.link(head)

        # Beak
        beak_z = head_z - (0.01 if not pecking else 0.02)
        beak_y = head_y - 0.06
        bpy.ops.mesh.primitive_cone_add(radius1=0.018, radius2=0.0, depth=0.045, location=(px, beak_y, beak_z), rotation=(math.radians(85) if not pecking else math.radians(45), 0, 0))
        beak = bpy.context.active_object
        beak.data.materials.append(m_beak)
        col.objects.link(beak)

        # Eyes
        for ex in [-0.04, 0.04]:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.010, location=(px + ex, head_y - 0.01, head_z + 0.015))
            eye = bpy.context.active_object
            eye.data.materials.append(m_eye)
            col.objects.link(eye)

        # Wings on sides
        for wx in [-0.08, 0.08]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.065, radius2=0.01, depth=0.16, location=(px + wx, py + 0.04, pz + 0.11), rotation=(math.radians(100), 0, math.radians(15) if wx < 0 else math.radians(-15)))
            wing = bpy.context.active_object
            wing.scale = (0.4, 1.0, 1.2)
            wing.data.materials.append(m_wing)
            col.objects.link(wing)

        # Tail feathers
        bpy.ops.mesh.primitive_cone_add(radius1=0.05, radius2=0.01, depth=0.12, location=(px, py + 0.16, pz + 0.12), rotation=(math.radians(70), 0, 0))
        tail = bpy.context.active_object
        tail.scale = (0.8, 0.3, 1.0)
        tail.data.materials.append(m_wing)
        col.objects.link(tail)

        # Red-pink matchstick feet
        for fx in [-0.035, 0.035]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.07, location=(px + fx, py - 0.01, pz + 0.035))
            foot = bpy.context.active_object
            foot.data.materials.append(m_beak)
            col.objects.link(foot)

    # Pigeon 1 (standing upright, alert)
    make_pigeon(-0.16, 0.05, 0.0, pecking=False)
    # Pigeon 2 (head down pecking breadcrumb)
    make_pigeon(0.18, -0.05, 0.0, pecking=True)

    export_model(col, "pigeon-pair", out_dir)

# -----------------------------------------------------------------------------
# 27. CAT ON CRATE (cat-on-crate)
# -----------------------------------------------------------------------------
def build_cat_on_crate(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CatOnCrate")
    bpy.context.scene.collection.children.link(col)

    m_crate = create_pbr_mat("Mat_CrateWood", "#8C5832", roughness=0.8, metallic=0.0)
    m_cat_ginger = create_pbr_mat("Mat_CatGinger", "#E67E33", roughness=0.7, metallic=0.0)
    m_cat_white = create_pbr_mat("Mat_CatWhite", "#F8F6F2", roughness=0.65, metallic=0.0)
    m_cat_pink = create_pbr_mat("Mat_CatNose", "#F5A1A8", roughness=0.4, metallic=0.0)

    # 1. Wooden crate: 0.65m x 0.50m, 0.38m tall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.19))
    crate = bpy.context.active_object
    crate.scale = (0.65, 0.50, 0.38)
    crate.data.materials.append(m_crate)
    col.objects.link(crate)

    # 2. Sleeping Cat curled up in a crescent doughnut on top (Z = 0.38)
    cat_z = 0.38
    # Torso curved torus
    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.065, location=(0, 0, cat_z + 0.07))
    body = bpy.context.active_object
    body.scale = (1.1, 0.9, 0.85)
    body.data.materials.append(m_cat_ginger)
    col.objects.link(body)

    # White belly patch
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0.04, 0.02, cat_z + 0.06))
    belly = bpy.context.active_object
    belly.scale = (0.9, 0.7, 0.6)
    belly.data.materials.append(m_cat_white)
    col.objects.link(belly)

    # Sleeping head tucked into paws (X = -0.12, Y = -0.06, Z = 0.45)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, location=(-0.12, -0.06, cat_z + 0.075))
    head = bpy.context.active_object
    head.scale = (1.0, 0.9, 0.85)
    head.data.materials.append(m_cat_ginger)
    col.objects.link(head)

    # White muzzle
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(-0.16, -0.08, cat_z + 0.055))
    muzzle = bpy.context.active_object
    muzzle.data.materials.append(m_cat_white)
    col.objects.link(muzzle)

    # Pink nose
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.010, location=(-0.18, -0.09, cat_z + 0.065))
    nose = bpy.context.active_object
    nose.data.materials.append(m_cat_pink)
    col.objects.link(nose)

    # Pointed ears
    for ex, ey in [(-0.11, -0.01), (-0.07, -0.08)]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.024, radius2=0.005, depth=0.045, location=(ex, ey, cat_z + 0.135), rotation=(0.2, 0.2, 0))
        ear = bpy.context.active_object
        ear.data.materials.append(m_cat_ginger)
        col.objects.link(ear)

    # Curled tail wrapped along the body perimeter
    bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.025, location=(0, 0, cat_z + 0.04))
    tail = bpy.context.active_object
    tail.scale = (1.1, 0.9, 0.6)
    tail.data.materials.append(m_cat_ginger)
    col.objects.link(tail)

    # White tail tip
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028, location=(-0.14, 0.08, cat_z + 0.05))
    tip = bpy.context.active_object
    tip.data.materials.append(m_cat_white)
    col.objects.link(tip)

    export_model(col, "cat-on-crate", out_dir)

# -----------------------------------------------------------------------------
# 28. PAINTER EASEL CANAL (painter-easel-canal)
# -----------------------------------------------------------------------------
def build_painter_easel_canal(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_PainterEasel")
    bpy.context.scene.collection.children.link(col)

    m_wood = create_pbr_mat("Mat_EaselWood", "#9A653C", roughness=0.72, metallic=0.0) # oiled beechwood
    m_canvas = create_pbr_mat("Mat_CanvasWhite", "#F8F5EE", roughness=0.85, metallic=0.0)
    m_paint_blue = create_pbr_mat("Mat_CanalPaintBlue", "#457EAB", roughness=0.45, metallic=0.0)
    m_paint_green = create_pbr_mat("Mat_CanalPaintGreen", "#4E8752", roughness=0.45, metallic=0.0)
    m_paint_gold = create_pbr_mat("Mat_CanalPaintGold", "#DE9E36", roughness=0.45, metallic=0.0)
    m_palette_wood = create_pbr_mat("Mat_PaletteWood", "#BA8454", roughness=0.65, metallic=0.0)

    # Tripod legs: height 1.65m
    # 2 front legs (leaning forward-outward)
    for lx in [-0.38, 0.38]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=1.70, location=(lx, -0.15, 0.82), rotation=(0.12, 0.18 if lx < 0 else -0.18, 0))
        f_leg = bpy.context.active_object
        f_leg.data.materials.append(m_wood)
        col.objects.link(f_leg)

    # Back prop leg (leaning back to Y = 0.55)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=1.70, location=(0, 0.32, 0.80), rotation=(-0.35, 0, 0))
    b_leg = bpy.context.active_object
    b_leg.data.materials.append(m_wood)
    col.objects.link(b_leg)

    # Center mast mast upright (Z = 0.40 to 1.75)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.15, 1.05), rotation=(0.12, 0, 0))
    mast = bpy.context.active_object
    mast.scale = (0.05, 0.05, 1.40)
    mast.data.materials.append(m_wood)
    col.objects.link(mast)

    # Horizontal canvas shelf bar (Z = 0.85)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.22, 0.85), rotation=(0.12, 0, 0))
    shelf = bpy.context.active_object
    shelf.scale = (0.75, 0.08, 0.04)
    shelf.data.materials.append(m_wood)
    col.objects.link(shelf)

    # Stretched Canvas: 0.65m wide, 0.48m tall (Z = 0.87 to 1.35)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.25, 1.10), rotation=(0.12, 0, 0))
    canvas = bpy.context.active_object
    canvas.scale = (0.65, 0.03, 0.48)
    canvas.data.materials.append(m_canvas)
    col.objects.link(canvas)

    # Painted canal scene swatches on canvas face
    # Canal water (blue)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.27, 0.98), rotation=(0.12, 0, 0))
    p_water = bpy.context.active_object
    p_water.scale = (0.58, 0.005, 0.18)
    p_water.data.materials.append(m_paint_blue)
    col.objects.link(p_water)

    # Windmill / greenery (green)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.10, -0.27, 1.15), rotation=(0.12, 0, 0))
    p_hill = bpy.context.active_object
    p_hill.scale = (0.35, 0.005, 0.15)
    p_hill.data.materials.append(m_paint_green)
    col.objects.link(p_hill)

    # Sunset sky (gold)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.12, -0.27, 1.22), rotation=(0.12, 0, 0))
    p_sky = bpy.context.active_object
    p_sky.scale = (0.30, 0.005, 0.10)
    p_sky.data.materials.append(m_paint_gold)
    col.objects.link(p_sky)

    # Wooden artist thumb palette resting on shelf
    bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=0.015, location=(0.28, -0.25, 0.89), rotation=(0.12, 0, 0))
    pal = bpy.context.active_object
    pal.scale = (1.0, 0.65, 1.0)
    pal.data.materials.append(m_palette_wood)
    col.objects.link(pal)

    export_model(col, "painter-easel-canal", out_dir)

# -----------------------------------------------------------------------------
# 29. ICE CREAM CART (ice-cream-cart)
# -----------------------------------------------------------------------------
def build_ice_cream_cart(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_IceCreamCart")
    bpy.context.scene.collection.children.link(col)

    m_mint = create_pbr_mat("Mat_IceCreamMint", "#A5D6B8", roughness=0.35, metallic=0.0) # retro pastel mint
    m_cream = create_pbr_mat("Mat_IceCreamCream", "#FAF6EB", roughness=0.35, metallic=0.0)
    m_brass = create_pbr_mat("Mat_IceChurnBrass", "#DEBA54", roughness=0.2, metallic=0.9)
    m_umbrella_pink = create_pbr_mat("Mat_UmbrellaPink", "#F58EA7", roughness=0.55, metallic=0.0)
    m_wheel = create_pbr_mat("Mat_CartWheelWhite", "#383B3D", roughness=0.5, metallic=0.6)

    # 2 spoke wheels (radius 0.38m at X = -0.48 and +0.48, Y = 0)
    for wx in [-0.48, 0.48]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.38, minor_radius=0.02, location=(wx, 0, 0.38), rotation=(0, math.pi/2, 0))
        wheel = bpy.context.active_object
        wheel.data.materials.append(m_wheel)
        col.objects.link(wheel)

    # Insulated cart chest: 0.85m wide (X), 1.25m long (Y), 0.55m tall (Z = 0.35 to 0.90)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.625))
    chest = bpy.context.active_object
    chest.scale = (0.85, 1.25, 0.55)
    chest.data.materials.append(m_mint)
    col.objects.link(chest)

    # Polished stainless/cream countertop
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.915))
    top = bpy.context.active_object
    top.scale = (0.90, 1.30, 0.03)
    top.data.materials.append(m_cream)
    col.objects.link(top)

    # 4 round brass pozzetto gelato churn lids on top (Z = 0.94)
    for cx, cy in [(-0.20, -0.28), (0.20, -0.28), (-0.20, 0.18), (0.20, 0.18)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.03, location=(cx, cy, 0.94))
        churn = bpy.context.active_object
        churn.data.materials.append(m_brass)
        col.objects.link(churn)

        # Churn handle knob
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, location=(cx, cy, 0.97))
        knob = bpy.context.active_object
        knob.data.materials.append(m_brass)
        col.objects.link(knob)

    # Brass umbrella mast upright pole (center, reaches Z = 2.4m)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=1.60, location=(0, 0, 1.70))
    upole = bpy.context.active_object
    upole.data.materials.append(m_brass)
    col.objects.link(upole)

    # Striped parasol / umbrella canopy (radius 0.95m, height 0.40m, Z = 2.20 to 2.45)
    bpy.ops.mesh.primitive_cone_add(radius1=0.95, radius2=0.04, depth=0.35, location=(0, 0, 2.35))
    parasol = bpy.context.active_object
    parasol.data.materials.append(m_umbrella_pink)
    col.objects.link(parasol)

    # Handlebar grips at rear (Y = 0.65)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.60, location=(0, 0.75, 0.85), rotation=(0, math.pi/2, 0))
    bar = bpy.context.active_object
    bar.data.materials.append(m_brass)
    col.objects.link(bar)

    export_model(col, "ice-cream-cart", out_dir)

# -----------------------------------------------------------------------------
# 30. BOOK CRATE SALE (book-crate-sale)
# -----------------------------------------------------------------------------
def build_book_crate_sale(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_BookCrate")
    bpy.context.scene.collection.children.link(col)

    m_crate = create_pbr_mat("Mat_BookCrateWood", "#7A4E2C", roughness=0.8, metallic=0.0)
    m_paper = create_pbr_mat("Mat_BookPages", "#F5EFE1", roughness=0.85, metallic=0.0)
    book_colors = [
        create_pbr_mat("Mat_CoverNavy", "#1C355E", roughness=0.5, metallic=0.0),
        create_pbr_mat("Mat_CoverBurgundy", "#7D2228", roughness=0.5, metallic=0.0),
        create_pbr_mat("Mat_CoverForest", "#2E5938", roughness=0.5, metallic=0.0),
        create_pbr_mat("Mat_CoverOchre", "#C78B32", roughness=0.5, metallic=0.0),
        create_pbr_mat("Mat_CoverPlum", "#5E2548", roughness=0.5, metallic=0.0),
    ]

    # Sturdy low wooden crate: 0.90m long (X), 0.55m wide (Y), 0.32m tall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.16))
    box = bpy.context.active_object
    box.scale = (0.90, 0.55, 0.32)
    box.data.materials.append(m_crate)
    col.objects.link(box)

    # Interior cutout
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.18))
    bin_in = bpy.context.active_object
    bin_in.scale = (0.82, 0.47, 0.28)
    bin_in.data.materials.append(m_paper)
    col.objects.link(bin_in)

    # 2 rows of vintage books standing spine-up
    for row_y in [-0.14, 0.14]:
        num_books = 14
        for b in range(num_books):
            bx = -0.36 + b * 0.055
            b_mat = book_colors[(b + int(row_y*10)) % len(book_colors)]
            h = 0.22 + (b % 4) * 0.015

            # Book spine
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, row_y, 0.18 + h/2))
            book = bpy.context.active_object
            book.scale = (0.045, 0.22, h)
            book.data.materials.append(b_mat)
            col.objects.link(book)

    # Cardboard price sign wedged in crate ("ELK BOEK € 2,-")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28, -0.28, 0.36), rotation=(0.15, 0.1, -0.2))
    psign = bpy.context.active_object
    psign.scale = (0.24, 0.01, 0.16)
    psign.data.materials.append(create_pbr_mat("Mat_PriceTag", "#F7E6C1", roughness=0.8, metallic=0.0))
    col.objects.link(psign)

    export_model(col, "book-crate-sale", out_dir)

# -----------------------------------------------------------------------------
# 31. HEART LOCK RAILING (heart-lock-railing)
# -----------------------------------------------------------------------------
def build_heart_lock_railing(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_HeartLockRailing")
    bpy.context.scene.collection.children.link(col)

    m_iron = create_pbr_mat("Mat_BridgeIron", "#202422", roughness=0.45, metallic=0.7)
    lock_colors = [
        create_pbr_mat("Mat_LockRosePink", "#E84370", roughness=0.25, metallic=0.4),
        create_pbr_mat("Mat_LockGold", "#E5BF47", roughness=0.2, metallic=0.9),
        create_pbr_mat("Mat_LockAqua", "#3DBAA8", roughness=0.25, metallic=0.4),
        create_pbr_mat("Mat_LockRuby", "#BA1C2D", roughness=0.25, metallic=0.4),
        create_pbr_mat("Mat_LockPurple", "#8B3DB8", roughness=0.25, metallic=0.4),
    ]

    length = 2.0
    # Two end posts
    for x in [-length/2, length/2]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 0.475))
        post = bpy.context.active_object
        post.scale = (0.10, 0.10, 0.95)
        post.data.materials.append(m_iron)
        col.objects.link(post)

    # Top & bottom rails
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=length, location=(0, 0, 0.90), rotation=(0, math.pi/2, 0))
    top = bpy.context.active_object
    top.data.materials.append(m_iron)
    col.objects.link(top)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=length, location=(0, 0, 0.16), rotation=(0, math.pi/2, 0))
    bot = bpy.context.active_object
    bot.data.materials.append(m_iron)
    col.objects.link(bot)

    # Vertical balusters
    balusters_x = [-0.75, -0.50, -0.25, 0.0, 0.25, 0.50, 0.75]
    for bx in balusters_x:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.014, depth=0.74, location=(bx, 0, 0.53))
        bal = bpy.context.active_object
        bal.data.materials.append(m_iron)
        col.objects.link(bal)

    # Clusters of colourful heart-shaped and rectangular love padlocks clipped onto balusters
    lock_data = [
        (-0.50, 0.02, 0.65, 0),
        (-0.50, -0.02, 0.58, 1),
        (-0.25, 0.02, 0.72, 2),
        (-0.25, -0.02, 0.66, 3),
        (-0.25, 0.02, 0.52, 0),
        (0.00,  0.02, 0.75, 1), # heart lock
        (0.00, -0.02, 0.68, 4),
        (0.00,  0.02, 0.60, 3),
        (0.25,  0.02, 0.70, 0),
        (0.25, -0.02, 0.62, 1),
        (0.50,  0.02, 0.66, 2),
    ]

    for lx, ly, lz, c_idx in lock_data:
        l_mat = lock_colors[c_idx]
        # Padlock shackle loop
        bpy.ops.mesh.primitive_torus_add(major_radius=0.025, minor_radius=0.005, location=(lx, ly, lz + 0.028))
        shackle = bpy.context.active_object
        shackle.data.materials.append(create_pbr_mat("Mat_ShackleChrome", "#D1D5DB", roughness=0.2, metallic=0.9))
        col.objects.link(shackle)

        # Padlock body (heart or box)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, lz))
        lbody = bpy.context.active_object
        lbody.scale = (0.045, 0.020, 0.040)
        lbody.data.materials.append(l_mat)
        col.objects.link(lbody)

    export_model(col, "heart-lock-railing", out_dir)

# -----------------------------------------------------------------------------
# 32. DUCK FAMILY (duck-family)
# -----------------------------------------------------------------------------
def build_duck_family(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_DuckFamily")
    bpy.context.scene.collection.children.link(col)

    m_duck_brown = create_pbr_mat("Mat_MallardHenBrown", "#7C5838", roughness=0.75, metallic=0.0)
    m_duck_wing = create_pbr_mat("Mat_MallardWing", "#4E3520", roughness=0.75, metallic=0.0)
    m_duck_spec = create_pbr_mat("Mat_WingSpeculumBlue", "#2B589C", roughness=0.3, metallic=0.2)
    m_beak_orange = create_pbr_mat("Mat_DuckBeakOrange", "#F5871F", roughness=0.3, metallic=0.0)
    m_duckling_yellow = create_pbr_mat("Mat_DucklingFluff", "#FCE158", roughness=0.85, metallic=0.0)
    m_eye = create_pbr_mat("Mat_DuckEye", "#18191A", roughness=0.1, metallic=0.0)

    # 1. Mother Duck (at Y = 0.45)
    my = 0.45
    # Body (sitting on water waterline Z=0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(0, my, 0.09))
    m_body = bpy.context.active_object
    m_body.scale = (0.9, 1.4, 0.8)
    m_body.data.materials.append(m_duck_brown)
    col.objects.link(m_body)

    # Wings & speculum
    for wx in [-0.13, 0.13]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, my - 0.02, 0.11))
        wing = bpy.context.active_object
        wing.scale = (0.04, 0.22, 0.10)
        wing.data.materials.append(m_duck_wing)
        col.objects.link(wing)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx * 1.05, my - 0.04, 0.10))
        spec = bpy.context.active_object
        spec.scale = (0.02, 0.08, 0.04)
        spec.data.materials.append(m_duck_spec)
        col.objects.link(spec)

    # Neck & Head
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.16, location=(0, my - 0.14, 0.18), rotation=(0.3, 0, 0))
    m_neck = bpy.context.active_object
    m_neck.data.materials.append(m_duck_brown)
    col.objects.link(m_neck)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, location=(0, my - 0.18, 0.26))
    m_head = bpy.context.active_object
    m_head.data.materials.append(m_duck_brown)
    col.objects.link(m_head)

    # Bill
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, my - 0.27, 0.24))
    m_bill = bpy.context.active_object
    m_bill.scale = (0.05, 0.10, 0.025)
    m_bill.data.materials.append(m_beak_orange)
    col.objects.link(m_bill)

    # 2. Three little ducklings swimming in line behind mother
    duckling_ys = [0.12, -0.16, -0.42]
    for idx, dy in enumerate(duckling_ys):
        dx = (idx % 2 - 0.5) * 0.06
        # Fluffy body
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(dx, dy, 0.045))
        d_body = bpy.context.active_object
        d_body.scale = (0.9, 1.2, 0.85)
        d_body.data.materials.append(m_duckling_yellow)
        col.objects.link(d_body)

        # Head
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.042, location=(dx, dy - 0.06, 0.11))
        d_head = bpy.context.active_object
        d_head.data.materials.append(m_duckling_yellow)
        col.objects.link(d_head)

        # Bill
        bpy.ops.mesh.primitive_cone_add(radius1=0.016, radius2=0.005, depth=0.035, location=(dx, dy - 0.105, 0.10), rotation=(math.pi/2, 0, 0))
        d_bill = bpy.context.active_object
        d_bill.data.materials.append(m_beak_orange)
        col.objects.link(d_bill)

        # Eyes
        for ex in [-0.032, 0.032]:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.007, location=(dx + ex, dy - 0.06, 0.12))
            eye = bpy.context.active_object
            eye.data.materials.append(m_eye)
            col.objects.link(eye)

    export_model(col, "duck-family", out_dir)

# -----------------------------------------------------------------------------
# 33. PICNIC BLANKET (picnic-blanket)
# -----------------------------------------------------------------------------
def build_picnic_blanket(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_PicnicBlanket")
    bpy.context.scene.collection.children.link(col)

    m_gingham_red = create_pbr_mat("Mat_GinghamRed", "#C93442", roughness=0.85, metallic=0.0)
    m_gingham_white = create_pbr_mat("Mat_GinghamWhite", "#F8F5EE", roughness=0.85, metallic=0.0)
    m_basket = create_pbr_mat("Mat_WickerHamper", "#B88A58", roughness=0.75, metallic=0.0)
    m_mug = create_pbr_mat("Mat_EnamelMug", "#FAF7F2", roughness=0.3, metallic=0.0)
    m_tea = create_pbr_mat("Mat_TeaLiquid", "#486B42", roughness=0.15, metallic=0.0) # matcha green tea

    size = 2.0 # 2.0m x 2.0m blanket
    # Red & white checkered blanket pattern (8x8 tiles)
    num_tiles = 8
    t_size = size / num_tiles
    for ix in range(num_tiles):
        for iy in range(num_tiles):
            tx = -size/2 + (ix + 0.5) * t_size
            ty = -size/2 + (iy + 0.5) * t_size
            t_mat = m_gingham_red if (ix + iy) % 2 == 0 else m_gingham_white
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.008))
            tile = bpy.context.active_object
            tile.scale = (t_size, t_size, 0.016)
            tile.data.materials.append(t_mat)
            col.objects.link(tile)

    # Wicker picnic hamper basket: 0.50m x 0.35m, 0.30m tall (at X = -0.42, Y = 0.28)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.42, 0.28, 0.16))
    hamper = bpy.context.active_object
    hamper.scale = (0.50, 0.35, 0.30)
    hamper.data.materials.append(m_basket)
    col.objects.link(hamper)

    # Hamper arched lid
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.52, location=(-0.42, 0.28, 0.31), rotation=(0, math.pi/2, 0))
    hlid = bpy.context.active_object
    hlid.scale = (1.0, 0.95, 0.5)
    hlid.data.materials.append(m_basket)
    col.objects.link(hlid)

    # Leather straps on hamper
    for sx in [-0.55, -0.29]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0.28, 0.17))
        strap = bpy.context.active_object
        strap.scale = (0.03, 0.36, 0.32)
        strap.data.materials.append(create_pbr_mat("Mat_HamperLeather", "#5C361E", roughness=0.6, metallic=0.0))
        col.objects.link(strap)

    # Two enamel tea mugs on blanket with green matcha tea
    for mx, my in [(0.25, -0.15), (0.45, 0.10)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.11, location=(mx, my, 0.065))
        mug = bpy.context.active_object
        mug.data.materials.append(m_mug)
        col.objects.link(mug)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.01, location=(mx, my, 0.105))
        tea = bpy.context.active_object
        tea.data.materials.append(m_tea)
        col.objects.link(tea)

    export_model(col, "picnic-blanket", out_dir)

def main():
    street_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/street"
    disc_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/discoveries"
    print("🚀 Building Batch 5 Street & Moments Models...")
    build_lantern_string(street_dir)
    build_pigeon_pair(disc_dir)
    build_cat_on_crate(disc_dir)
    build_painter_easel_canal(disc_dir)
    build_ice_cream_cart(street_dir)
    build_book_crate_sale(disc_dir)
    build_heart_lock_railing(street_dir)
    build_duck_family(disc_dir)
    build_picnic_blanket(disc_dir)
    print("✨ Finished Batch 5!")

if __name__ == "__main__":
    main()
