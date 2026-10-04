"""
blender/scripts/street/build_batch_4.py
======================================
Builds Batch 4 of §5.2 Amsterdam Street & Architecture:
19. canal-house-narrow-c (10.8m facade, bell/cornice gable, rose brick, nail boutique)
20. tram-stop-shelter (3m modern glass shelter with wooden bench & timetable panel)
21. greenhouse-glass (6m Victorian greenhouse with white frame & glass panes)
22. tulip-field-rows (4m instanced tulip strip with 4 colored rows)
23. harbour-crane (7m historic dock crane with lattice boom, cables & hook)
24. wooden-jetty (4m tileable wooden canal jetty with pilings & planks)

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
# 19. CANAL HOUSE NARROW C (canal-house-narrow-c) - Cornice Gable + Nail Boutique
# -----------------------------------------------------------------------------
def build_canal_house_narrow_c(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CanalHouseC")
    bpy.context.scene.collection.children.link(col)

    m_brick = create_pbr_mat("Mat_RoseBrick", "#A25C54", roughness=0.82, metallic=0.0) # rose-tinted Dutch brick
    m_stone = create_pbr_mat("Mat_CorniceSandstone", "#E8DFCD", roughness=0.6, metallic=0.0)
    m_boutique = create_pbr_mat("Mat_NailBoutiqueWood", "#D48B96", roughness=0.45, metallic=0.0) # chic dusty rose woodwork
    m_glass = create_pbr_mat("Mat_BoutiqueGlass", "#9ABCC7", roughness=0.1, metallic=0.1)
    m_gold = create_pbr_mat("Mat_GoldBoutiqueLettering", "#E5BF67", roughness=0.2, metallic=0.95)

    width = 4.20
    depth = 3.20
    height = 8.60

    # 1. Main brick façade block
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height/2))
    body = bpy.context.active_object
    body.scale = (width, depth, height)
    body.data.materials.append(m_brick)
    col.objects.link(body)

    # 2. Ornate Cornice Gable (Lijstgevel) with carved sandstone balustrade & urns (Z = 8.6 to 10.4)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 + 0.15, 8.85))
    cornice = bpy.context.active_object
    cornice.scale = (width + 0.20, 0.40, 0.50)
    cornice.data.materials.append(m_stone)
    col.objects.link(cornice)

    # Attic pediment crest
    bpy.ops.mesh.primitive_cylinder_add(radius=1.20, depth=0.25, location=(0, -depth/2 + 0.15, 9.60), rotation=(math.pi/2, 0, 0))
    crest = bpy.context.active_object
    crest.scale = (1.0, 0.5, 1.0)
    crest.data.materials.append(m_stone)
    col.objects.link(crest)

    # Sandstone decorative urn finials at corners
    for ux in [-width/2 + 0.2, width/2 - 0.2]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(ux, -depth/2 + 0.15, 9.40))
        urn = bpy.context.active_object
        urn.scale = (1.0, 1.0, 1.4)
        urn.data.materials.append(m_stone)
        col.objects.link(urn)

    # 3. Ground Floor Nail Polish Boutique Shopfront
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.12, 1.45))
    shop = bpy.context.active_object
    shop.scale = (4.00, 0.38, 2.50)
    shop.data.materials.append(m_boutique)
    col.objects.link(shop)

    # Curved display bay window
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.85, -depth/2 - 0.35, 1.45))
    bwin = bpy.context.active_object
    bwin.scale = (2.00, 0.04, 1.80)
    bwin.data.materials.append(m_glass)
    col.objects.link(bwin)

    # Fascia sign ("ATELIER DE VERNIS · NAIL BOUTIQUE")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.33, 2.55))
    sign = bpy.context.active_object
    sign.scale = (3.80, 0.04, 0.32)
    sign.data.materials.append(m_boutique)
    col.objects.link(sign)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -depth/2 - 0.36, 2.55))
    sign_text = bpy.context.active_object
    sign_text.scale = (2.60, 0.02, 0.14)
    sign_text.data.materials.append(m_gold)
    col.objects.link(sign_text)

    # Glass boutique entrance door
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.25, -depth/2 + 0.02, 1.45))
    door = bpy.context.active_object
    door.scale = (0.90, 0.08, 2.20)
    door.data.materials.append(m_boutique)
    col.objects.link(door)

    # 4. Upper Floor Sash Windows with curved lintels
    for wz in [4.0, 6.2, 8.2]:
        for wx in [-1.15, 0.0, 1.15]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.03, wz + 0.82))
            lintel = bpy.context.active_object
            lintel.scale = (0.85, 0.08, 0.12)
            lintel.data.materials.append(m_stone)
            col.objects.link(lintel)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.02, wz))
            wf = bpy.context.active_object
            wf.scale = (0.75, 0.06, 1.50)
            wf.data.materials.append(m_stone)
            col.objects.link(wf)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, -depth/2 - 0.04, wz))
            wg = bpy.context.active_object
            wg.scale = (0.65, 0.03, 1.38)
            wg.data.materials.append(m_glass)
            col.objects.link(wg)

    export_model(col, "canal-house-narrow-c", out_dir)

# -----------------------------------------------------------------------------
# 20. TRAM STOP SHELTER (tram-stop-shelter)
# -----------------------------------------------------------------------------
def build_tram_stop_shelter(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_TramShelter")
    bpy.context.scene.collection.children.link(col)

    m_steel = create_pbr_mat("Mat_ShelterSteel", "#23282D", roughness=0.35, metallic=0.85) # anthracite grey steel
    m_glass = create_pbr_mat("Mat_ShelterGlass", "#8BB4C4", roughness=0.1, metallic=0.1)
    m_wood = create_pbr_mat("Mat_ShelterBenchWood", "#C28F5F", roughness=0.65, metallic=0.0)
    m_panel = create_pbr_mat("Mat_TimetablePanel", "#F8F6F1", roughness=0.3, metallic=0.0)
    m_sign = create_pbr_mat("Mat_GVBBlue", "#104F96", roughness=0.3, metallic=0.0)

    # 4 tubular steel upright columns: width 3.2m (X), depth 1.4m (Y), height 2.5m (Z)
    for cx in [-1.50, 0.0, 1.50]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=2.50, location=(cx, 0.60, 1.25))
        col_post = bpy.context.active_object
        col_post.data.materials.append(m_steel)
        col.objects.link(col_post)

    # Cantilever roof canopy sloping gently backward (Z = 2.45 to 2.55)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.52), rotation=(-0.05, 0, 0))
    roof = bpy.context.active_object
    roof.scale = (3.40, 1.60, 0.08)
    roof.data.materials.append(m_steel)
    col.objects.link(roof)

    # Back tempered glass panels (Y = 0.60, X from -1.5 to +1.5)
    for gx in [-0.75, 0.75]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(gx, 0.60, 1.30))
        pane = bpy.context.active_object
        pane.scale = (1.42, 0.02, 2.10)
        pane.data.materials.append(m_glass)
        col.objects.link(pane)

    # Side windbreak glass panel on left (X = -1.50)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.50, 0.0, 1.30))
    spane = bpy.context.active_object
    spane.scale = (0.02, 1.20, 2.10)
    spane.data.materials.append(m_glass)
    col.objects.link(spane)

    # Cantilever wooden waiting bench inside (Z = 0.45)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.40, 0.45))
    bench = bpy.context.active_object
    bench.scale = (2.20, 0.38, 0.05)
    bench.data.materials.append(m_wood)
    col.objects.link(bench)

    # Illuminated Timetable / Route Map Box on right post (X = 1.35)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, 0.40, 1.45))
    tbox = bpy.context.active_object
    tbox.scale = (0.28, 0.60, 1.10)
    tbox.data.materials.append(m_panel)
    col.objects.link(tbox)

    # Front fascia tram stop header sign ("TRAM 14 · PLANTAGE / ATELIER")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.75, 2.50))
    tsign = bpy.context.active_object
    tsign.scale = (3.20, 0.04, 0.22)
    tsign.data.materials.append(m_sign)
    col.objects.link(tsign)

    export_model(col, "tram-stop-shelter", out_dir)

# -----------------------------------------------------------------------------
# 21. GREENHOUSE GLASS (greenhouse-glass)
# -----------------------------------------------------------------------------
def build_greenhouse_glass(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_GreenhouseGlass")
    bpy.context.scene.collection.children.link(col)

    m_frame = create_pbr_mat("Mat_GreenhouseWhite", "#F8F6F2", roughness=0.4, metallic=0.1) # white painted Victorian iron
    m_base = create_pbr_mat("Mat_GreenhousePlinth", "#B85848", roughness=0.85, metallic=0.0) # low red brick knee-wall
    m_glass = create_pbr_mat("Mat_GreenhousePanes", "#8AB4C7", roughness=0.1, metallic=0.1)
    m_wood = create_pbr_mat("Mat_PlantTables", "#8A5A38", roughness=0.75, metallic=0.0)
    m_leaf = create_pbr_mat("Mat_GreenhouseFlora", "#488554", roughness=0.6, metallic=0.0)
    m_terra = create_pbr_mat("Mat_ClayPots", "#B86548", roughness=0.8, metallic=0.0)

    # Dimensions: 5.8m long (Y), 4.2m wide (X), 4.2m tall (Z to ridge)
    # Low brick perimeter plinth wall (Z = 0 to 0.65)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.325))
    plinth = bpy.context.active_object
    plinth.scale = (4.20, 5.80, 0.65)
    plinth.data.materials.append(m_base)
    col.objects.link(plinth)

    # Interior cutout
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.35))
    p_in = bpy.context.active_object
    p_in.scale = (3.70, 5.30, 0.70)
    p_in.data.materials.append(create_pbr_mat("Mat_SoilFloor", "#3B2B1F", roughness=0.9, metallic=0.0))
    col.objects.link(p_in)

    # White iron frame columns around perimeter (Z = 0.65 to 2.40)
    for x in [-2.05, 2.05]:
        for y in [-2.7, -1.35, 0.0, 1.35, 2.7]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.75, location=(x, y, 1.525))
            c = bpy.context.active_object
            c.data.materials.append(m_frame)
            col.objects.link(c)

    # Glass vertical side walls
    for x in [-2.05, 2.05]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, 0, 1.525))
        wall = bpy.context.active_object
        wall.scale = (0.02, 5.40, 1.70)
        wall.data.materials.append(m_glass)
        col.objects.link(wall)

    # Gable ends (front Y = -2.85, back Y = 2.85)
    for y in [-2.85, 2.85]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y, 1.525))
        end = bpy.context.active_object
        end.scale = (4.00, 0.02, 1.70)
        end.data.materials.append(m_glass)
        col.objects.link(end)

    # Pitched roof (ridge at Z = 3.80, slopes down to Z = 2.40 at X = +/- 2.10)
    # Left roof slope
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.10, 0, 3.10), rotation=(0, 0.58, 0))
    r_left = bpy.context.active_object
    r_left.scale = (2.45, 5.85, 0.04)
    r_left.data.materials.append(m_glass)
    col.objects.link(r_left)

    # Right roof slope
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.10, 0, 3.10), rotation=(0, -0.58, 0))
    r_right = bpy.context.active_object
    r_right.scale = (2.45, 5.85, 0.04)
    r_right.data.materials.append(m_glass)
    col.objects.link(r_right)

    # Ornamental Victorian ridge cresting along top (Z = 3.85)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=5.90, location=(0, 0, 3.85), rotation=(math.pi/2, 0, 0))
    ridge = bpy.context.active_object
    ridge.data.materials.append(m_frame)
    col.objects.link(ridge)

    # Wooden plant tables inside along left and right walls
    for tx in [-1.45, 1.45]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, 0, 0.85))
        table = bpy.context.active_object
        table.scale = (0.75, 4.80, 0.40)
        table.data.materials.append(m_wood)
        col.objects.link(table)

        # Clay pots with lush exotic green plants on tables
        for ty in [-1.8, -0.9, 0.0, 0.9, 1.8]:
            bpy.ops.mesh.primitive_cone_add(radius1=0.14, radius2=0.09, depth=0.18, location=(tx, ty, 1.14))
            pot = bpy.context.active_object
            pot.data.materials.append(m_terra)
            col.objects.link(pot)

            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.22, location=(tx, ty, 1.35))
            shrub = bpy.context.active_object
            shrub.scale = (1.0, 1.0, 1.3)
            shrub.data.materials.append(m_leaf)
            col.objects.link(shrub)

    export_model(col, "greenhouse-glass", out_dir)

# -----------------------------------------------------------------------------
# 22. TULIP FIELD ROWS (tulip-field-rows)
# -----------------------------------------------------------------------------
def build_tulip_field_rows(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_TulipRows")
    bpy.context.scene.collection.children.link(col)

    m_soil = create_pbr_mat("Mat_FieldEarth", "#3F2E22", roughness=0.95, metallic=0.0)
    m_stem = create_pbr_mat("Mat_FieldStem", "#4F7D48", roughness=0.6, metallic=0.0)

    # 4 distinct vivid Dutch tulip row colors
    row_colors = [
        create_pbr_mat("Mat_TulipRowRed", "#DF2838", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipRowYellow", "#F7CE36", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipRowPink", "#F582A0", roughness=0.35, metallic=0.0),
        create_pbr_mat("Mat_TulipRowWhite", "#F8F6EF", roughness=0.35, metallic=0.0),
    ]

    length = 4.0 # 4.0m strip
    # Mounded soil bed base: 4.0m long (Y), 2.2m wide (X), 0.12m tall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.05))
    bed = bpy.context.active_object
    bed.scale = (2.20, length, 0.10)
    bed.data.materials.append(m_soil)
    col.objects.link(bed)

    # 4 raised furrows / mounded ridges along X
    row_x_positions = [-0.75, -0.25, 0.25, 0.75]

    for r_idx, rx in enumerate(row_x_positions):
        # Soil ridge
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=length, location=(rx, 0, 0.08), rotation=(math.pi/2, 0, 0))
        ridge = bpy.context.active_object
        ridge.scale = (1.0, 0.45, 1.0)
        ridge.data.materials.append(m_soil)
        col.objects.link(ridge)

        c_mat = row_colors[r_idx]

        # 12 blooming tulips per row (dense Dutch bulb field look)
        for i in range(12):
            ty = -1.80 + i * 0.33
            # Stem
            bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.32, location=(rx, ty, 0.24))
            stem = bpy.context.active_object
            stem.data.materials.append(m_stem)
            col.objects.link(stem)

            # Flower cup
            bpy.ops.mesh.primitive_cone_add(radius1=0.055, radius2=0.02, depth=0.11, location=(rx, ty, 0.43), rotation=(math.pi, 0, 0))
            cup = bpy.context.active_object
            cup.scale = (1.0, 1.0, 1.25)
            cup.data.materials.append(c_mat)
            col.objects.link(cup)

            # Leaves
            bpy.ops.mesh.primitive_cone_add(radius1=0.035, radius2=0.005, depth=0.22, location=(rx + 0.02, ty, 0.18), rotation=(0.25, 0.1, 0))
            leaf = bpy.context.active_object
            leaf.scale = (0.5, 1.4, 1.0)
            leaf.data.materials.append(m_stem)
            col.objects.link(leaf)

    export_model(col, "tulip-field-rows", out_dir)

# -----------------------------------------------------------------------------
# 23. HARBOUR CRANE (harbour-crane)
# -----------------------------------------------------------------------------
def build_harbour_crane(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_HarbourCrane")
    bpy.context.scene.collection.children.link(col)

    m_cast_iron = create_pbr_mat("Mat_CraneIronBlack", "#24282B", roughness=0.45, metallic=0.8)
    m_stone = create_pbr_mat("Mat_CraneQuayStone", "#7D7B77", roughness=0.85, metallic=0.0)
    m_wood = create_pbr_mat("Mat_CraneCabinWood", "#7A4E30", roughness=0.75, metallic=0.0)
    m_cable = create_pbr_mat("Mat_SteelCable", "#9CA3A8", roughness=0.3, metallic=0.9)
    m_hook = create_pbr_mat("Mat_ForgedHook", "#1A1A1C", roughness=0.3, metallic=0.95)

    # 1. Circular granite quay mounting plinth (radius 1.1m, height 0.45m)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.10, depth=0.45, location=(0, 0, 0.225))
    plinth = bpy.context.active_object
    plinth.data.materials.append(m_stone)
    col.objects.link(plinth)

    # Cast-iron swivel ring
    bpy.ops.mesh.primitive_cylinder_add(radius=0.90, depth=0.15, location=(0, 0, 0.525))
    ring = bpy.context.active_object
    ring.data.materials.append(m_cast_iron)
    col.objects.link(ring)

    # 2. Operator Cabin / Winch House: 1.8m wide, 2.2m long, 2.0m tall (Z = 0.60 to 2.60)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, 1.60))
    cabin = bpy.context.active_object
    cabin.scale = (1.80, 2.20, 2.00)
    cabin.data.materials.append(m_wood)
    col.objects.link(cabin)

    # Slanted cabin roof
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, 2.65), rotation=(0.1, 0, 0))
    croof = bpy.context.active_object
    croof.scale = (1.95, 2.40, 0.10)
    croof.data.materials.append(m_cast_iron)
    col.objects.link(croof)

    # 3. Lattice Boom / Jib Arm extending forward and upward (45 deg angle, reaching 7.0m height)
    # Pivot base at Z = 1.20, extending to Y = -3.8, Z = 6.8
    boom_len = 5.80
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=boom_len, location=(0, -1.8, 4.0), rotation=(math.radians(52), 0, 0))
    main_spar = bpy.context.active_object
    main_spar.data.materials.append(m_cast_iron)
    col.objects.link(main_spar)

    # Lattice cross braces along boom
    for i in range(7):
        by = -0.5 - i * 0.45
        bz = 2.4 + i * 0.58
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.55, location=(0, by, bz), rotation=(0, math.pi/2, 0))
        brace = bpy.context.active_object
        brace.data.materials.append(m_cast_iron)
        col.objects.link(brace)

    # Boom tip pulley wheel at top (Y = -3.8, Z = 6.8)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.08, location=(0, -3.8, 6.8), rotation=(0, math.pi/2, 0))
    pulley = bpy.context.active_object
    pulley.data.materials.append(m_cast_iron)
    col.objects.link(pulley)

    # Steel hoist cable dropping down to Z = 2.40
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=4.40, location=(0, -3.8, 4.60))
    cable = bpy.context.active_object
    cable.data.materials.append(m_cable)
    col.objects.link(cable)

    # Heavy forged cargo hook at cable end (Z = 2.30)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.04, location=(0, -3.8, 2.30), rotation=(0, math.pi/2, 0))
    hook = bpy.context.active_object
    hook.scale = (1.0, 0.7, 1.3)
    hook.data.materials.append(m_hook)
    col.objects.link(hook)

    # Counterweight chest at rear of cabin (Y = 1.6, Z = 1.2)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.60, 1.20))
    cweight = bpy.context.active_object
    cweight.scale = (1.60, 0.70, 1.00)
    cweight.data.materials.append(m_cast_iron)
    col.objects.link(cweight)

    export_model(col, "harbour-crane", out_dir)

# -----------------------------------------------------------------------------
# 24. WOODEN JETTY (wooden-jetty)
# -----------------------------------------------------------------------------
def build_wooden_jetty(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_WoodenJetty")
    bpy.context.scene.collection.children.link(col)

    m_plank = create_pbr_mat("Mat_JettyPlanks", "#8B5A36", roughness=0.72, metallic=0.0) # weathered dock wood
    m_piling = create_pbr_mat("Mat_DockPiling", "#5C3E28", roughness=0.85, metallic=0.0) # dark creosote wood
    m_iron = create_pbr_mat("Mat_DockBolts", "#2B2D2F", roughness=0.4, metallic=0.8)

    length = 4.0 # 4.0m tileable jetty segment along Y
    width = 1.8  # 1.8m wide across X

    # 4 heavy round wooden pilings / stanchions (Z = -0.6 to 0.75, height 1.35m)
    piling_positions = [
        (-width/2 + 0.12, -length/2 + 0.3),
        ( width/2 - 0.12, -length/2 + 0.3),
        (-width/2 + 0.12,  length/2 - 0.3),
        ( width/2 - 0.12,  length/2 - 0.3),
    ]

    for px, py in piling_positions:
        # Piling post
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=1.40, location=(px, py, 0.10))
        post = bpy.context.active_object
        post.data.materials.append(m_piling)
        col.objects.link(post)

        # Domed top cap
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(px, py, 0.78))
        cap = bpy.context.active_object
        cap.scale = (1.0, 1.0, 0.5)
        cap.data.materials.append(m_piling)
        col.objects.link(cap)

    # 2 longitudinal support stringer beams (X = -0.75 and +0.75, Z = 0.48)
    for sx in [-0.72, 0.72]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 0.48))
        stringer = bpy.context.active_object
        stringer.scale = (0.14, length, 0.18)
        stringer.data.materials.append(m_piling)
        col.objects.link(stringer)

    # 24 transverse deck planks (across X, spaced every 0.165m along Y, Z = 0.60)
    num_planks = 24
    plank_pitch = length / num_planks
    for i in range(num_planks):
        py = -length/2 + (i + 0.5) * plank_pitch
        # Plank
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, py, 0.60))
        plank = bpy.context.active_object
        plank.scale = (width, 0.145, 0.045)
        plank.data.materials.append(m_plank)
        col.objects.link(plank)

        # 2 iron bolt heads per plank
        for bx in [-0.72, 0.72]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.014, depth=0.015, location=(bx, py, 0.625))
            bolt = bpy.context.active_object
            bolt.data.materials.append(m_iron)
            col.objects.link(bolt)

    export_model(col, "wooden-jetty", out_dir)

def main():
    street_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/street"
    arch_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/architecture"
    print("🚀 Building Batch 4 Street & Architecture Models...")
    build_canal_house_narrow_c(arch_dir)
    build_tram_stop_shelter(street_dir)
    build_greenhouse_glass(arch_dir)
    build_tulip_field_rows(street_dir)
    build_harbour_crane(arch_dir)
    build_wooden_jetty(arch_dir)
    print("✨ Finished Batch 4!")

if __name__ == "__main__":
    main()
