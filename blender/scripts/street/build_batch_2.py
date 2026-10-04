"""
blender/scripts/street/build_batch_2.py
======================================
Builds Batch 2 of §5.2 Amsterdam Street Dressing:
7. houseboat-small (9m green canal houseboat with cabin, roof planters, deck bike)
8. rowboat-moored (3.2m clinker wooden rowboat with oars & mooring rope)
9. street-sign-amsterdam (0.6m enamel street sign on 2.4m cast-iron post)
10. post-box-dutch (1.2m iconic Dutch orange postbox with twin letter slots)
11. cafe-terrace-set (1.5m bistro table with 2 chairs & coffee cups)
12. market-stall-cheese (3m market stall with yellow/cream awning & Gouda cheese wheels)

All models touch ground/water at Z=0, face -Y, and follow blender/MODELING-RULES.md.
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
# 7. HOUSEBOAT SMALL (houseboat-small)
# -----------------------------------------------------------------------------
def build_houseboat_small(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_Houseboat")
    bpy.context.scene.collection.children.link(col)

    m_hull = create_pbr_mat("Mat_HouseboatHull", "#1E3B2B", roughness=0.5, metallic=0.1) # dark canal green
    m_deck = create_pbr_mat("Mat_TeakDeck", "#8A5E3F", roughness=0.7, metallic=0.0)
    m_cabin = create_pbr_mat("Mat_HouseboatCabin", "#F4F0E8", roughness=0.6, metallic=0.0) # cream wood
    m_trim = create_pbr_mat("Mat_DarkTrim", "#2B2118", roughness=0.5, metallic=0.0)
    m_roof = create_pbr_mat("Mat_RoofFelt", "#42484C", roughness=0.8, metallic=0.0)
    m_glass = create_pbr_mat("Mat_CabinGlass", "#7DA4B8", roughness=0.1, metallic=0.2)
    m_terra = create_pbr_mat("Mat_RoofTerra", "#B56247", roughness=0.8, metallic=0.0)
    m_leaf = create_pbr_mat("Mat_RoofPlants", "#487D52", roughness=0.6, metallic=0.0)
    m_metal = create_pbr_mat("Mat_StovePipe", "#242526", roughness=0.4, metallic=0.8)

    # 1. Flat-bottom steel hull: length 9.0m along Y, width 2.8m along X, height 0.9m (Z=0 to 0.9)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.45))
    hull = bpy.context.active_object
    hull.scale = (2.80, 8.80, 0.90)
    hull.data.materials.append(m_hull)
    col.objects.link(hull)

    # Tapered bow at Y = 4.4 and stern at Y = -4.4
    bpy.ops.mesh.primitive_cylinder_add(radius=1.40, depth=0.90, location=(0, 4.2, 0.45))
    bow = bpy.context.active_object
    bow.scale = (1.0, 0.6, 1.0)
    bow.data.materials.append(m_hull)
    col.objects.link(bow)

    # Teak deck surface (Z = 0.91)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.91))
    deck = bpy.context.active_object
    deck.scale = (2.75, 8.60, 0.04)
    deck.data.materials.append(m_deck)
    col.objects.link(deck)

    # Cabin structure: length 6.2m, width 2.2m, height 1.6m (Z = 0.93 to 2.53)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.2, 1.73))
    cabin = bpy.context.active_object
    cabin.scale = (2.20, 6.20, 1.60)
    cabin.data.materials.append(m_cabin)
    col.objects.link(cabin)

    # Cabin rounded arch roof
    bpy.ops.mesh.primitive_cylinder_add(radius=1.15, depth=6.30, location=(0, -0.2, 2.50), rotation=(math.pi/2, 0, 0))
    roof = bpy.context.active_object
    roof.scale = (1.0, 0.25, 1.0)
    roof.data.materials.append(m_roof)
    col.objects.link(roof)

    # Windows on port and starboard sides (X = -1.11 and +1.11)
    for x in [-1.11, 1.11]:
        for y_win in [-2.4, -1.2, 0.0, 1.2, 2.2]:
            # Window frame
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y_win, 1.80))
            wf = bpy.context.active_object
            wf.scale = (0.05, 0.70, 0.60)
            wf.data.materials.append(m_trim)
            col.objects.link(wf)

            # Window glass pane
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x * 1.01, y_win, 1.80))
            wg = bpy.context.active_object
            wg.scale = (0.02, 0.60, 0.50)
            wg.data.materials.append(m_glass)
            col.objects.link(wg)

    # Front door at Y = 2.9 (facing front deck)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 2.91, 1.60))
    door = bpy.context.active_object
    door.scale = (0.75, 0.04, 1.40)
    door.data.materials.append(m_trim)
    col.objects.link(door)

    # Roof details: planter boxes with lush trailing greenery
    for ry in [-1.8, -0.4, 1.0]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.6, ry, 2.70))
        box = bpy.context.active_object
        box.scale = (0.50, 0.80, 0.16)
        box.data.materials.append(m_terra)
        col.objects.link(box)

        # Plant dome
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.28, location=(0.6, ry, 2.82))
        plant = bpy.context.active_object
        plant.scale = (0.9, 1.4, 0.6)
        plant.data.materials.append(m_leaf)
        col.objects.link(plant)

    # Stove pipe chimney
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.85, location=(-0.65, -2.2, 2.85))
    chimney = bpy.context.active_object
    chimney.data.materials.append(m_metal)
    col.objects.link(chimney)

    # Chimney H-cap
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.35, location=(-0.65, -2.2, 3.25), rotation=(0, math.pi/2, 0))
    cap = bpy.context.active_object
    cap.data.materials.append(m_metal)
    col.objects.link(cap)

    # Deck bike leaning on aft deck (Y = -3.8)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.04, location=(-0.6, -3.8, 1.20), rotation=(0, math.pi/2, 0.15))
    dbike = bpy.context.active_object
    dbike.data.materials.append(m_metal)
    col.objects.link(dbike)

    export_model(col, "houseboat-small", out_dir)

# -----------------------------------------------------------------------------
# 8. ROWBOAT MOORED (rowboat-moored)
# -----------------------------------------------------------------------------
def build_rowboat_moored(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_Rowboat")
    bpy.context.scene.collection.children.link(col)

    m_wood = create_pbr_mat("Mat_BoatWood", "#8C5835", roughness=0.65, metallic=0.0)
    m_inner = create_pbr_mat("Mat_BoatInterior", "#BA8961", roughness=0.75, metallic=0.0)
    m_oar = create_pbr_mat("Mat_OarWood", "#D1A779", roughness=0.55, metallic=0.0)
    m_rope = create_pbr_mat("Mat_HempRope", "#B59E7A", roughness=0.85, metallic=0.0)
    m_iron = create_pbr_mat("Mat_MooringRing", "#36383B", roughness=0.3, metallic=0.8)

    # Wooden dinghy hull: length 3.2m, width 1.25m, height 0.55m
    bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=3.2, location=(0, 0, 0.28), rotation=(math.pi/2, 0, 0))
    hull = bpy.context.active_object
    hull.scale = (1.0, 0.65, 1.0)
    hull.data.materials.append(m_wood)
    col.objects.link(hull)

    # Interior cutout / scooped floor
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.32))
    floor = bpy.context.active_object
    floor.scale = (0.95, 2.70, 0.38)
    floor.data.materials.append(m_inner)
    col.objects.link(floor)

    # 3 wooden bench thwarts across the boat
    for by in [-0.8, 0.0, 0.8]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, by, 0.42))
        thwart = bpy.context.active_object
        thwart.scale = (1.08, 0.22, 0.04)
        thwart.data.materials.append(m_inner)
        col.objects.link(thwart)

    # Pair of oars resting across gunwales
    # Oar 1
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=2.0, location=(-0.15, 0.2, 0.48), rotation=(0.1, 0.3, 0.4))
    oar1 = bpy.context.active_object
    oar1.data.materials.append(m_oar)
    col.objects.link(oar1)
    # Blade 1
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.65, 0.95, 0.58), rotation=(0.1, 0.3, 0.4))
    b1 = bpy.context.active_object
    b1.scale = (0.12, 0.55, 0.02)
    b1.data.materials.append(m_oar)
    col.objects.link(b1)

    # Oar 2
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=2.0, location=(0.15, -0.1, 0.48), rotation=(-0.1, -0.3, -0.35))
    oar2 = bpy.context.active_object
    oar2.data.materials.append(m_oar)
    col.objects.link(oar2)
    # Blade 2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.65, -0.85, 0.58), rotation=(-0.1, -0.3, -0.35))
    b2 = bpy.context.active_object
    b2.scale = (0.12, 0.55, 0.02)
    b2.data.materials.append(m_oar)
    col.objects.link(b2)

    # Bow mooring rope coil
    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.03, location=(0, 1.50, 0.44))
    coil = bpy.context.active_object
    coil.data.materials.append(m_rope)
    col.objects.link(coil)

    # Mooring painter rope trailing to pier
    bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=1.2, location=(0, 2.0, 0.48), rotation=(0.3, 0, 0))
    rope = bpy.context.active_object
    rope.data.materials.append(m_rope)
    col.objects.link(rope)

    export_model(col, "rowboat-moored", out_dir)

# -----------------------------------------------------------------------------
# 9. STREET SIGN AMSTERDAM (street-sign-amsterdam)
# -----------------------------------------------------------------------------
def build_street_sign_amsterdam(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_StreetSign")
    bpy.context.scene.collection.children.link(col)

    m_post = create_pbr_mat("Mat_SignPost", "#1F2923", roughness=0.45, metallic=0.6) # dark canal green iron
    m_plate = create_pbr_mat("Mat_EnamelBlue", "#153B6B", roughness=0.25, metallic=0.0) # royal Amsterdam street sign blue
    m_white = create_pbr_mat("Mat_SignWhite", "#F8F7F2", roughness=0.35, metallic=0.0)

    # Cast-iron post: 2.4m tall, radius 0.045m
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=2.40, location=(0, 0, 1.20))
    post = bpy.context.active_object
    post.data.materials.append(m_post)
    col.objects.link(post)

    # Flared decorative base plinth (Z=0 to 0.25)
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.05, depth=0.25, location=(0, 0, 0.125))
    base = bpy.context.active_object
    base.data.materials.append(m_post)
    col.objects.link(base)

    # Acorn finial cap at top (Z=2.45)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, location=(0, 0, 2.45))
    finial = bpy.context.active_object
    finial.scale = (1.0, 1.0, 1.4)
    finial.data.materials.append(m_post)
    col.objects.link(finial)

    # Enamel street name plate: width 0.65m, height 0.20m, depth 0.024m (at Z = 2.15)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28, 0, 2.15))
    plate = bpy.context.active_object
    plate.scale = (0.65, 0.024, 0.20)
    plate.data.materials.append(m_plate)
    col.objects.link(plate)

    # White enamel inner border (front face Y = -0.013)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28, -0.013, 2.15))
    border = bpy.context.active_object
    border.scale = (0.61, 0.004, 0.17)
    border.data.materials.append(m_white)
    col.objects.link(border)

    # Inset blue background for text
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28, -0.015, 2.15))
    inner = bpy.context.active_object
    inner.scale = (0.58, 0.003, 0.14)
    inner.data.materials.append(m_plate)
    col.objects.link(inner)

    # White embossed street name bars (representing letters "PRINSENGRACHT")
    for lx in [-0.20, -0.12, -0.04, 0.04, 0.12, 0.20]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.28 + lx, -0.017, 2.15))
        letter = bpy.context.active_object
        letter.scale = (0.05, 0.003, 0.08)
        letter.data.materials.append(m_white)
        col.objects.link(letter)

    export_model(col, "street-sign-amsterdam", out_dir)

# -----------------------------------------------------------------------------
# 10. POST BOX DUTCH (post-box-dutch)
# -----------------------------------------------------------------------------
def build_post_box_dutch(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_PostBox")
    bpy.context.scene.collection.children.link(col)

    m_orange = create_pbr_mat("Mat_DutchPostOrange", "#F06015", roughness=0.38, metallic=0.0) # classic PostNL orange
    m_pedestal = create_pbr_mat("Mat_PostPedestal", "#3B3D40", roughness=0.55, metallic=0.4)
    m_slot = create_pbr_mat("Mat_SlotBlack", "#1C1D1F", roughness=0.7, metallic=0.1)
    m_brass = create_pbr_mat("Mat_SlotBrass", "#D4AF37", roughness=0.25, metallic=0.9)

    # Cast-iron mounting pedestal: height 0.40m, radius 0.09m
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.40, location=(0, 0, 0.20))
    ped = bpy.context.active_object
    ped.data.materials.append(m_pedestal)
    col.objects.link(ped)

    # Flared footing
    bpy.ops.mesh.primitive_cone_add(radius1=0.18, radius2=0.09, depth=0.10, location=(0, 0, 0.05))
    foot = bpy.context.active_object
    foot.data.materials.append(m_pedestal)
    col.objects.link(foot)

    # Main orange rectangular body: width 0.58m, depth 0.38m, height 0.65m (Z = 0.40 to 1.05)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.725))
    body = bpy.context.active_object
    body.scale = (0.58, 0.38, 0.65)
    body.data.materials.append(m_orange)
    col.objects.link(body)

    # Curved barrel-vault top hood (Z = 1.05 to 1.22)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.19, depth=0.58, location=(0, 0, 1.05), rotation=(0, math.pi/2, 0))
    hood = bpy.context.active_object
    hood.data.materials.append(m_orange)
    col.objects.link(hood)

    # Twin drop letter slots on front (Y = -0.192, Z = 0.88 and 0.72)
    # Left slot ("Streekpost") and Right slot ("Overige Bestemmingen")
    for sx in [-0.15, 0.15]:
        # Slot hood flap
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, -0.195, 0.82))
        flap = bpy.context.active_object
        flap.scale = (0.22, 0.03, 0.07)
        flap.data.materials.append(m_brass)
        col.objects.link(flap)

        # Slot dark aperture
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, -0.197, 0.81))
        aperture = bpy.context.active_object
        aperture.scale = (0.18, 0.015, 0.02)
        aperture.data.materials.append(m_slot)
        col.objects.link(aperture)

    # Front service collection door seams
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.192, 0.58))
    door = bpy.context.active_object
    door.scale = (0.44, 0.01, 0.28)
    door.data.materials.append(m_orange)
    col.objects.link(door)

    # Brass keyhole lock
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.02, location=(0, -0.198, 0.58), rotation=(math.pi/2, 0, 0))
    lock = bpy.context.active_object
    lock.data.materials.append(m_brass)
    col.objects.link(lock)

    export_model(col, "post-box-dutch", out_dir)

# -----------------------------------------------------------------------------
# 11. CAFE TERRACE SET (cafe-terrace-set)
# -----------------------------------------------------------------------------
def build_cafe_terrace_set(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_CafeTerrace")
    bpy.context.scene.collection.children.link(col)

    m_cast_iron = create_pbr_mat("Mat_BistroIron", "#202224", roughness=0.45, metallic=0.7)
    m_marble = create_pbr_mat("Mat_WhiteMarble", "#F5F3EC", roughness=0.25, metallic=0.0) # polished marble top
    m_brass_rim = create_pbr_mat("Mat_BistroBrass", "#D8B255", roughness=0.2, metallic=0.9)
    m_wicker = create_pbr_mat("Mat_ChairWicker", "#D9B88F", roughness=0.75, metallic=0.0)
    m_green_frame = create_pbr_mat("Mat_ChairFrame", "#2D4C3A", roughness=0.4, metallic=0.1)
    m_ceramic = create_pbr_mat("Mat_CoffeeCup", "#FCFAF5", roughness=0.2, metallic=0.0)
    m_coffee = create_pbr_mat("Mat_Espresso", "#3E271B", roughness=0.15, metallic=0.0)

    # 1. Round bistro table (Center at X=0, Y=0)
    # Tripod cast-iron base (Z = 0 to 0.08)
    for a in [0, 2*math.pi/3, 4*math.pi/3]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.36, location=(math.cos(a)*0.18, math.sin(a)*0.18, 0.04), rotation=(0, math.pi/3, a))
        leg = bpy.context.active_object
        leg.data.materials.append(m_cast_iron)
        col.objects.link(leg)

    # Central fluted pillar (height 0.70m, radius 0.045m)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.70, location=(0, 0, 0.38))
    pillar = bpy.context.active_object
    pillar.data.materials.append(m_cast_iron)
    col.objects.link(pillar)

    # Round marble tabletop: diameter 0.75m, thickness 0.035m (Z = 0.74)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.375, depth=0.035, location=(0, 0, 0.74))
    top = bpy.context.active_object
    top.data.materials.append(m_marble)
    col.objects.link(top)

    # Brass perimeter rim
    bpy.ops.mesh.primitive_torus_add(major_radius=0.375, minor_radius=0.015, location=(0, 0, 0.74))
    rim = bpy.context.active_object
    rim.data.materials.append(m_brass_rim)
    col.objects.link(rim)

    # Two coffee cups with saucers on table
    for cx, cy in [(-0.12, 0.08), (0.12, -0.06)]:
        # Saucer
        bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.012, location=(cx, cy, 0.762))
        saucer = bpy.context.active_object
        saucer.data.materials.append(m_ceramic)
        col.objects.link(saucer)

        # Cup
        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.055, location=(cx, cy, 0.795))
        cup = bpy.context.active_object
        cup.data.materials.append(m_ceramic)
        col.objects.link(cup)

        # Coffee liquid
        bpy.ops.mesh.primitive_cylinder_add(radius=0.040, depth=0.01, location=(cx, cy, 0.815))
        liquid = bpy.context.active_object
        liquid.data.materials.append(m_coffee)
        col.objects.link(liquid)

    # 2. Two Parisian/Amsterdam bistro chairs (at Y = -0.55 facing +Y, and Y = +0.55 facing -Y)
    for cy, rot_z in [(-0.55, 0), (0.55, math.pi)]:
        # Chair 4 tubular legs (Z = 0 to 0.44)
        for lx in [-0.20, 0.20]:
            for ldy in [-0.20, 0.20]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.45, location=(lx, cy + ldy, 0.225))
                cleg = bpy.context.active_object
                cleg.data.materials.append(m_green_frame)
                col.objects.link(cleg)

        # Round woven wicker seat (Z = 0.45)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.04, location=(0, cy, 0.45))
        seat = bpy.context.active_object
        seat.data.materials.append(m_wicker)
        col.objects.link(seat)

        # Seat ring
        bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.02, location=(0, cy, 0.45))
        sring = bpy.context.active_object
        sring.data.materials.append(m_green_frame)
        col.objects.link(sring)

        # Curved arch backrest (Z = 0.45 to 0.86)
        back_y = cy - 0.22 if cy < 0 else cy + 0.22
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.022, location=(0, back_y, 0.65), rotation=(0, math.pi/2, 0))
        arch = bpy.context.active_object
        arch.scale = (1.0, 0.4, 1.2)
        arch.data.materials.append(m_green_frame)
        col.objects.link(arch)

        # Woven wicker back inset
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.02, location=(0, back_y, 0.66), rotation=(math.pi/2, 0, 0))
        bweave = bpy.context.active_object
        bweave.data.materials.append(m_wicker)
        col.objects.link(bweave)

    export_model(col, "cafe-terrace-set", out_dir)

# -----------------------------------------------------------------------------
# 12. MARKET STALL CHEESE (market-stall-cheese)
# -----------------------------------------------------------------------------
def build_market_stall_cheese(out_dir):
    clear_scene()
    col = bpy.data.collections.new("Col_StallCheese")
    bpy.context.scene.collection.children.link(col)

    m_timber = create_pbr_mat("Mat_StallTimber", "#8B5A36", roughness=0.75, metallic=0.0)
    m_counter = create_pbr_mat("Mat_StallCounter", "#BA8C63", roughness=0.65, metallic=0.0)
    m_yellow_awning = create_pbr_mat("Mat_AwningYellow", "#F5CE42", roughness=0.55, metallic=0.0)
    m_cream_awning = create_pbr_mat("Mat_AwningCream", "#F9F7F0", roughness=0.55, metallic=0.0)
    m_cheese_yellow = create_pbr_mat("Mat_GoudaYellowWax", "#FABE28", roughness=0.35, metallic=0.0)
    m_cheese_red = create_pbr_mat("Mat_EdamRedWax", "#C72C35", roughness=0.35, metallic=0.0)
    m_chalk = create_pbr_mat("Mat_PriceBoard", "#2B2D2F", roughness=0.7, metallic=0.0)

    # Stall dimensions: 3.0m wide (X), 1.6m deep (Y), 2.5m tall (Z)
    # 4 heavy corner timber posts
    for px in [-1.45, 1.45]:
        for py in [-0.75, 0.75]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 1.25))
            post = bpy.context.active_object
            post.scale = (0.10, 0.10, 2.50)
            post.data.materials.append(m_timber)
            col.objects.link(post)

    # Front counter table (Z = 0.90, Y = -0.35, width 2.9m, depth 0.85m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.35, 0.88))
    table = bpy.context.active_object
    table.scale = (2.90, 0.85, 0.06)
    table.data.materials.append(m_counter)
    col.objects.link(table)

    # Counter front modesty skirt panel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.72, 0.44))
    skirt = bpy.context.active_object
    skirt.scale = (2.85, 0.04, 0.84)
    skirt.data.materials.append(m_timber)
    col.objects.link(skirt)

    # 2 raised tiered display shelves on counter (Z = 0.98 and 1.15)
    for sz, sy in [(1.02, -0.15), (1.18, 0.12)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, sy, sz))
        shelf = bpy.context.active_object
        shelf.scale = (2.75, 0.38, 0.04)
        shelf.data.materials.append(m_counter)
        col.objects.link(shelf)

    # Display of Gouda and Edam cheese wheels
    cheese_positions = [
        # Lower counter
        (-1.10, -0.42, 0.98, m_cheese_yellow, 0.22, 0.10),
        (-0.75, -0.42, 0.98, m_cheese_yellow, 0.22, 0.10),
        (-0.75, -0.42, 1.08, m_cheese_yellow, 0.20, 0.09), # stacked
        (-0.35, -0.42, 0.98, m_cheese_red, 0.18, 0.12),
        (0.00,  -0.42, 0.98, m_cheese_red, 0.18, 0.12),
        (0.38,  -0.42, 0.98, m_cheese_yellow, 0.24, 0.11),
        (0.78,  -0.42, 0.98, m_cheese_yellow, 0.24, 0.11),
        (1.15,  -0.42, 0.98, m_cheese_red, 0.18, 0.12),
        # Middle tier
        (-0.90, -0.15, 1.10, m_cheese_red, 0.18, 0.12),
        (-0.45, -0.15, 1.10, m_cheese_yellow, 0.22, 0.10),
        (0.10,  -0.15, 1.10, m_cheese_yellow, 0.22, 0.10),
        (0.60,  -0.15, 1.10, m_cheese_red, 0.18, 0.12),
        (1.00,  -0.15, 1.10, m_cheese_yellow, 0.20, 0.10),
        # Top tier
        (-0.70, 0.12, 1.26, m_cheese_yellow, 0.22, 0.10),
        (-0.20, 0.12, 1.26, m_cheese_red, 0.18, 0.12),
        (0.30,  0.12, 1.26, m_cheese_yellow, 0.22, 0.10),
        (0.80,  0.12, 1.26, m_cheese_yellow, 0.22, 0.10),
    ]

    for cx, cy, cz, cmat, rad, dep in cheese_positions:
        bpy.ops.mesh.primitive_cylinder_add(radius=rad, depth=dep, location=(cx, cy, cz))
        wheel = bpy.context.active_object
        wheel.data.materials.append(cmat)
        col.objects.link(wheel)

    # Chalkboard sign hanging on front ("OUDE GOUDA")
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.74, 0.50))
    board = bpy.context.active_object
    board.scale = (0.75, 0.02, 0.35)
    board.data.materials.append(m_chalk)
    col.objects.link(board)

    # Slanted Striped Canvas Awning on top (Z = 2.45 to 2.15, sloping forward)
    # 8 alternating stripes along X
    num_stripes = 10
    stripe_w = 3.10 / num_stripes
    for i in range(num_stripes):
        sx = -1.55 + (i + 0.5) * stripe_w
        smat = m_yellow_awning if i % 2 == 0 else m_cream_awning
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, -0.10, 2.36), rotation=(-0.25, 0, 0))
        awning = bpy.context.active_object
        awning.scale = (stripe_w, 1.85, 0.04)
        awning.data.materials.append(smat)
        col.objects.link(awning)

        # Scalloped wavy valance at front overhang
        bpy.ops.mesh.primitive_cylinder_add(radius=stripe_w/2, depth=0.18, location=(sx, -0.98, 2.14))
        scallop = bpy.context.active_object
        scallop.scale = (1.0, 0.2, 1.0)
        scallop.data.materials.append(smat)
        col.objects.link(scallop)

    export_model(col, "market-stall-cheese", out_dir)

def main():
    out_dir = "/Users/avivly/Downloads/avivly/clients/Fysio utrecht oost/eliyadoesnails-game/public/models/street"
    print("🚀 Building Batch 2 Street Dressing Models...")
    build_houseboat_small(out_dir)
    build_rowboat_moored(out_dir)
    build_street_sign_amsterdam(out_dir)
    build_post_box_dutch(out_dir)
    build_cafe_terrace_set(out_dir)
    build_market_stall_cheese(out_dir)
    print("✨ Finished Batch 2!")

if __name__ == "__main__":
    main()
