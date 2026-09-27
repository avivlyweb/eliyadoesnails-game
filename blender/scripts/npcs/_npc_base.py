import sys, os, math
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import bpy
from _lib import reset, part, root, parent_all, ground_all, export

def build_npc(npc_id, config):
    """
    Builds an articulated NPC character following the exact node contract in 01-ASSETS-BLENDER §B4.
    """
    reset()
    s = config.get("scale", 1.0)
    skin = config.get("skin", "pal_sand")
    top = config.get("top", "pal_cream")
    bottom = config.get("bottom", "pal_taupe")
    shoes = config.get("shoes", "pal_wood")
    hair_color = config.get("hair_color", "pal_ink")

    r = root(f"{npc_id}_Root")

    # 1. Hips (Z = 0.68 * s)
    hips = part("cube", f"{npc_id}_Hips", loc=(0, 0, 0.68 * s), scale=(0.16 * s, 0.11 * s, 0.08 * s), token=bottom, bevel=0.01 * s)

    # 2. Body / Torso (Z = 0.95 * s)
    body = part("cube", f"{npc_id}_Body", loc=(0, 0, 0.95 * s), scale=(0.17 * s, 0.12 * s, 0.18 * s), token=top, bevel=0.015 * s)

    # Apron overlay if specified
    if config.get("apron"):
        apron = part("cube", f"{npc_id}_Apron", loc=(0, -0.122 * s, 0.92 * s), scale=(0.15 * s, 0.008 * s, 0.20 * s), token=config["apron"], bevel=0.005 * s)
        apron.parent = body

    # 3. Neck (Z = 1.18 * s)
    neck = part("cyl", f"{npc_id}_Neck", loc=(0, 0, 1.18 * s), scale=(0.06 * s, 0.06 * s, 0.06 * s), token=skin, vertices=10)

    # 4. Head (pivot at neck base Z = 1.25 * s, head center at Z = 1.38 * s)
    head = part("ico", f"{npc_id}_Head", loc=(0, 0, 1.38 * s), scale=(0.17 * s, 0.16 * s, 0.17 * s), token=skin, subdivisions=2)

    # Eyes
    eye_l = part("sphere", f"{npc_id}_Eye_L", loc=(-0.055 * s, -0.155 * s, 1.39 * s), scale=(0.018 * s, 0.018 * s, 0.018 * s), token="pal_ink", segments=8, ring_count=6)
    eye_r = part("sphere", f"{npc_id}_Eye_R", loc=(0.055 * s, -0.155 * s, 1.39 * s), scale=(0.018 * s, 0.018 * s, 0.018 * s), token="pal_ink", segments=8, ring_count=6)
    eye_l.parent = head
    eye_r.parent = head

    # Hair / Head Accessories
    style = config.get("hair_style", "short")
    if style == "bun":
        hair_top = part("ico", f"{npc_id}_HairTop", loc=(0, 0.02 * s, 1.45 * s), scale=(0.18 * s, 0.17 * s, 0.14 * s), token=hair_color, subdivisions=2)
        bun = part("sphere", f"{npc_id}_HairBun", loc=(0, 0.16 * s, 1.46 * s), scale=(0.09 * s, 0.09 * s, 0.09 * s), token=hair_color)
        hair_top.parent = head
        bun.parent = head
        if config.get("prop") == "flower":
            flw = part("sphere", f"{npc_id}_Flower", loc=(0.14 * s, -0.06 * s, 1.48 * s), scale=(0.04 * s, 0.04 * s, 0.04 * s), token="pal_petal")
            flw.parent = head
    elif style == "short":
        hair = part("ico", f"{npc_id}_Hair", loc=(0, 0.01 * s, 1.44 * s), scale=(0.185 * s, 0.175 * s, 0.15 * s), token=hair_color, subdivisions=2)
        hair.parent = head
    elif style == "hat": # Bucket hat
        crown = part("cyl", f"{npc_id}_HatCrown", loc=(0, 0, 1.50 * s), scale=(0.18 * s, 0.18 * s, 0.08 * s), token="pal_sand", vertices=14)
        brim = part("cyl", f"{npc_id}_HatBrim", loc=(0, 0, 1.44 * s), scale=(0.25 * s, 0.25 * s, 0.015 * s), token="pal_sand", vertices=14)
        crown.parent = head
        brim.parent = head
    elif style == "glasses":
        hair = part("ico", f"{npc_id}_Hair", loc=(0, 0.02 * s, 1.45 * s), scale=(0.18 * s, 0.17 * s, 0.14 * s), token=hair_color, subdivisions=2)
        g_l = part("torus", f"{npc_id}_GlassL", loc=(-0.055 * s, -0.17 * s, 1.39 * s), rot=(90, 0, 0), token="pal_gold", major_radius=0.035 * s, minor_radius=0.005 * s, major_segments=10, minor_segments=4)
        g_r = part("torus", f"{npc_id}_GlassR", loc=(0.055 * s, -0.17 * s, 1.39 * s), rot=(90, 0, 0), token="pal_gold", major_radius=0.035 * s, minor_radius=0.005 * s, major_segments=10, minor_segments=4)
        hair.parent = head
        g_l.parent = head
        g_r.parent = head
    elif style == "headscarf":
        scarf = part("ico", f"{npc_id}_Scarf", loc=(0, 0.02 * s, 1.45 * s), scale=(0.19 * s, 0.18 * s, 0.15 * s), token="pal_rose", subdivisions=2)
        knot = part("sphere", f"{npc_id}_ScarfKnot", loc=(0, 0.16 * s, 1.34 * s), scale=(0.05 * s, 0.05 * s, 0.05 * s), token="pal_rose")
        scarf.parent = head
        knot.parent = head
    elif style == "pigtails":
        hair = part("ico", f"{npc_id}_Hair", loc=(0, 0.01 * s, 1.44 * s), scale=(0.18 * s, 0.17 * s, 0.14 * s), token=hair_color, subdivisions=2)
        pig_l = part("cyl", f"{npc_id}_PigtailL", loc=(-0.16 * s, 0.05 * s, 1.36 * s), rot=(15, 0, 30), scale=(0.035 * s, 0.035 * s, 0.10 * s), token=hair_color, vertices=8)
        pig_r = part("cyl", f"{npc_id}_PigtailR", loc=(0.16 * s, 0.05 * s, 1.36 * s), rot=(15, 0, -30), scale=(0.035 * s, 0.035 * s, 0.10 * s), token=hair_color, vertices=8)
        hair.parent = head
        pig_l.parent = head
        pig_r.parent = head

    # 5. Left Arm (Shoulder pivot at X = -0.22, Z = 1.12)
    arm_l = part("cube", f"{npc_id}_LeftArm", loc=(-0.22 * s, 0, 0.90 * s), scale=(0.045 * s, 0.045 * s, 0.22 * s), token=top, bevel=0.008 * s)
    hand_l = part("sphere", f"{npc_id}_LeftHand", loc=(-0.22 * s, 0, 0.66 * s), scale=(0.045 * s, 0.045 * s, 0.045 * s), token=config.get("prop") == "gloves" and "pal_butter" or skin)
    socket_lh = root(f"{npc_id}_LeftHandSocket")
    socket_lh.location = (-0.22 * s, 0, 0.62 * s)
    hand_l.parent = arm_l
    socket_lh.parent = arm_l

    # 6. Right Arm (Shoulder pivot at X = 0.22, Z = 1.12)
    arm_r = part("cube", f"{npc_id}_RightArm", loc=(0.22 * s, 0, 0.90 * s), scale=(0.045 * s, 0.045 * s, 0.22 * s), token=top, bevel=0.008 * s)
    hand_r = part("sphere", f"{npc_id}_RightHand", loc=(0.22 * s, 0, 0.66 * s), scale=(0.045 * s, 0.045 * s, 0.045 * s), token=config.get("prop") == "gloves" and "pal_butter" or skin)
    socket_rh = root(f"{npc_id}_RightHandSocket")
    socket_rh.location = (0.22 * s, 0, 0.62 * s)
    hand_r.parent = arm_r
    socket_rh.parent = arm_r

    # Camera prop in Pip's hand
    if config.get("prop") == "camera":
        cam = part("cube", f"{npc_id}_Camera", loc=(0.22 * s, -0.06 * s, 0.64 * s), scale=(0.05 * s, 0.03 * s, 0.04 * s), token="pal_ink", bevel=0.005 * s)
        lens = part("cyl", f"{npc_id}_Lens", loc=(0.22 * s, -0.10 * s, 0.64 * s), rot=(90, 0, 0), scale=(0.02 * s, 0.02 * s, 0.015 * s), token="pal_chrome", vertices=8)
        cam.parent = arm_r
        lens.parent = cam

    # Backpack prop for Lotte
    if config.get("prop") == "backpack":
        bp = part("cube", f"{npc_id}_Backpack", loc=(0, 0.14 * s, 0.92 * s), scale=(0.14 * s, 0.06 * s, 0.16 * s), token="pal_rose", bevel=0.01 * s)
        bp.parent = body

    # 7. Left Leg (Hip pivot at X = -0.10, Z = 0.68)
    leg_l = part("cube", f"{npc_id}_LeftLeg", loc=(-0.10 * s, 0, 0.38 * s), scale=(0.055 * s, 0.055 * s, 0.30 * s), token=bottom, bevel=0.008 * s)
    shoe_l = part("cube", f"{npc_id}_LeftShoe", loc=(-0.10 * s, -0.04 * s, 0.04 * s), scale=(0.06 * s, 0.09 * s, 0.04 * s), token=shoes, bevel=0.008 * s)

    # 8. Right Leg (Hip pivot at X = 0.10, Z = 0.68)
    leg_r = part("cube", f"{npc_id}_RightLeg", loc=(0.10 * s, 0, 0.38 * s), scale=(0.055 * s, 0.055 * s, 0.30 * s), token=bottom, bevel=0.008 * s)
    shoe_r = part("cube", f"{npc_id}_RightShoe", loc=(0.10 * s, -0.04 * s, 0.04 * s), scale=(0.06 * s, 0.09 * s, 0.04 * s), token=shoes, bevel=0.008 * s)

    # 9. Tray Socket (center in front of waist for delivery boxes)
    socket_tray = root(f"{npc_id}_TraySocket")
    socket_tray.location = (0, -0.24 * s, 0.75 * s)
    socket_tray.parent = body

    parent_all(r, [hips, body, neck, head, arm_l, arm_r, leg_l, leg_r, shoe_l, shoe_r])

    out_glb = os.path.abspath(f"public/models/npcs/{npc_id}.glb")
    prev_png = os.path.abspath(f"blender/previews/{npc_id}.png")
    export(out_glb, prev_png, dist=2.8 * s)
    print(f"Exported NPC: {out_glb}")
