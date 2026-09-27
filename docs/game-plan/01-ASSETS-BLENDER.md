# 01 — Assets & Blender (for the Blender agent)

Read `00-README.md` first. This file answers two questions: **do we need more models?** (yes, but fewer than you'd think, because most existing ones just need a game role) and **how exactly do we make them** so they match what's there.

---

## Part A — Give every existing model a job (no new modelling)

All paths are under `/models/` (the high-detail versions are under `/models/high-detail/`).

| Existing asset(s) | New game role |
|---|---|
| `sets/*` (7): set-cherry-blossom, cyberpunk-liquid-chrome-set, set-moonlight-cateye, blush-glaze-coquette-set, set-rose-quartz-french, set-matcha-glaze, set-apricot-pearl | **Finished products.** Shown in the result screen, carried on Eliya's tray (`eliya_TraySocket`) during delivery, then worn/displayed by the client. Four are **Signature Recipes** (match website looks). |
| `charms/*` (8): sculpted-ribbon-bow, molten-chrome-drops, baroque-nacre-pearl, barbed-wire-cyber-heart, faceted-aurora-teardrop-gem, saturn-orbital-charm, charm-chrome-monkey, charm-y2k-cyber-stars | **Craftable items** (recipes from materials, see `03`). Shown in the inventory and crafting UI (rendered with a turntable icon camera). |
| `tools/*` (8): magnetic-cat-eye-wand, cuticle-serum-dropper, czech-glass-nail-file, precision-angled-tweezers, micro-liner-brush, chrome-burnishing-sponge-pen, aura-micro-diffusion-airbrush, nail-sizing-kit-wheel | **Unlockable tools.** Each one unlocks or eases a mini-game (see `03`). Bought at the market stall or earned at levels. |
| `station/*` + `furniture/*` décor: celadon-tea-ceremony-set, hinoki-incense-burner, washi-folding-screen, brass-arc-floor-lamp, potted-fiddle-leaf-fig, floating-lacquer-display, cloud-ergonomic-hand-rest, steaming-ceramic-matcha-mug, client-wish-journal, artist-lookbook-catalog | **Atelier décor rewards.** Each placed item gives a small passive bonus (e.g. tea set = +5% Gloss from tips). The `client-wish-journal` becomes the **quest log** prop; `artist-lookbook-catalog` becomes the **collection book** prop. |
| `pets/*` (7): dewey, rocky, seedy, hoots, fireball, codex, null-signal | **Companions** unlocked through client friendship. Each has one ability (see `03`). |
| `discoveries/*`: bird-tree, petal-tree, forest-pine, fern-clump, flower-patch, wind-chime | **Resource landmarks**: petal-tree drops Sakura Petals, flower-patch drops Daisy Sprigs, wind-chime = hidden discovery collectible. |
| `architecture/*`, `street/*`, `world/windmill` | **District anchors** (see `04`). florist-flower-cart = Mira's post, moored-wooden-salon-boat = Bea, photobooth-kiosk = Pip, canal-house-bell-gable = Nell. |

**Action for the Blender agent in Part A:** none, except checking that each file's origin is at the base centre and that it faces the same way as `canal-house-stepped-gable.glb`. Fix and re-export any that don't, **keeping the same file name**.

---

## Part B — New models needed (54 total: 48 for launch, 6 later)

Priority: **P1** = needed for Phases 1–3, **P2** = Phase 5.

### B1. Filler pack for instancing (P1, 16 models) → `/models/filler/`

These get repeated hundreds of times with `THREE.InstancedMesh`, so there are **strict rules**: **one mesh object, max 2 materials, under 400 triangles, no child nodes.**

| File | Description | Size (m) | Tris max |
|---|---|---|---|
| `grass-tuft-a.glb`, `grass-tuft-b.glb`, `grass-tuft-c.glb` | 5–9 tapered blades, slight lean; 2 greens | 0.3 tall | 120 |
| `tulip-cluster-pink.glb`, `-red.glb`, `-yellow.glb`, `-white.glb` | 3–5 tulips on stems + 2 leaves | 0.45 tall | 350 |
| `pebble-set.glb` | 3 flattened low-poly stones | 0.3 wide | 120 |
| `round-bush-small.glb`, `round-bush-large.glb` | 3–4 merged, beveled icospheres (subdiv 1) | 0.6 / 1.1 | 400 |
| `clover-patch.glb` | flat leaf cluster | 0.4 wide | 150 |
| `reed-clump.glb` | canal-edge reeds with 2 cattail heads | 0.8 tall | 250 |
| `lily-pad-set.glb` | 3 pads, one with a pink bloom | 0.6 wide | 200 |
| `fallen-petals.glb` | ground scatter of 8 flat petals (for the meadow) | 0.5 wide | 100 |
| `cobble-edge-stone.glb` | a single rounded kerb stone for path edges | 0.25 | 60 |
| `mushroom-pair.glb` | 2 small cream mushrooms | 0.15 | 150 |

### B2. Street & district props (P1, 12 models) → `/models/street/` and `/models/architecture/`

Normal models (up to 30 child parts, up to 6k tris).

| File | Description | Used in |
|---|---|---|
| `street/wooden-bench.glb` | Amsterdam slatted bench | all districts |
| `street/planter-box.glb` | wooden box with tulips | Canal Street |
| `street/bike-rack-with-bikes.glb` | rack with 2 parked bikes (reuse the bicycle proportions) | Canal Street |
| `street/cafe-table-set.glb` | round table, 2 chairs, a cup | Market Square |
| `street/wooden-crate-stack.glb` | 2–3 crates, one with flowers | Market Square |
| `street/district-signpost.glb` | post with 3 arrow boards (text is added in code as a canvas texture, so leave the boards blank) | every junction |
| `street/order-board.glb` | small easel/board with pinned cards: **the quest board** | each client's post |
| `street/district-gate.glb` | pastel arch with a hanging lock charm (a separate node `gate_Lock` so code can animate unlocking) | district borders |
| `architecture/cafe-kiosk.glb` | small café with awning and counter: **Joon's café** | Market Square |
| `architecture/market-stall.glb` | striped awning stall with shelves: **the shop** | Market Square |
| `architecture/tulip-greenhouse.glb` | small glass house (glass = light tint, roughness 0.2, opacity handled in code) | Flower Meadow |
| `architecture/harbour-dock.glb` | wooden jetty section with bollards and a rope coil | Harbour |

### B3. Material pickups (P1, 8 models) → `/models/pickups/`

Small, readable from far away, **slightly oversized** (0.35–0.5 m) and bright. Each has a **separate node `<id>_Glow`** (a simple disc or sphere slightly larger than the item) that code uses for the pulsing highlight.

| File | Material in game | Look |
|---|---|---|
| `sakura-petal-bundle.glb` | Sakura Petal | 5 pink petals in a spiral |
| `daisy-sprig.glb` | Daisy Sprig | 3 daisies on one stem |
| `freshwater-pearl-oyster.glb` | Freshwater Pearl | open shell with a pearl (the pearl is a separate node `pearl_Pearl`) |
| `chrome-droplet.glb` | Chrome Drop | teardrop, metallic 1.0, roughness 0.15 |
| `syrup-glass-vial.glb` | Syrup Base | small corked vial; the liquid is a separate node `vial_Liquid` so code can recolour it per shade |
| `aurora-crystal-shard.glb` | Aurora Crystal | 3 clustered prisms, lilac/mint |
| `silk-ribbon-spool.glb` | Silk Ribbon | spool with a ribbon tail |
| `gold-leaf-flake.glb` | Gold Leaf | 3 crinkled gold sheets, metallic 1.0 |

### B4. NPC characters (P1, 8 NPCs + 1 base) → `/models/npcs/`

**Copy the construction of `eliyadoesnails/eliya-artisan.glb` exactly:** separate rigid parts, no armature or skinning, the same node names with the NPC id as prefix, and pivots at the joints so code can swing them.

**Required nodes for every NPC:** `<id>_Root` (empty at the feet), `<id>_Body`, `<id>_Hips`, `<id>_Neck`, `<id>_Head`, `<id>_LeftArm`, `<id>_RightArm`, `<id>_LeftLeg`, `<id>_RightLeg`, `<id>_LeftHandSocket`, `<id>_RightHandSocket`, `<id>_TraySocket`, `<id>_Eye_L`, `<id>_Eye_R`.

- **Pivots:** each arm's origin is at the shoulder, each leg's at the hip, the head's at the neck. **This is the most important rule.** If the pivots are wrong, the walk animation will look broken.
- **Height:** the same as Eliya (import `eliya-artisan.glb` and match it); a child NPC is 0.75× that.
- Under 8k tris per NPC, max 10 materials.

| File | NPC | Distinguishing look |
|---|---|---|
| `npc-base.glb` | template | neutral body kit that the other NPCs are built from (not shipped in the game) |
| `mira-florist.glb` | Mira (existing client) | green apron, flower in hair |
| `nell-potter.glb` | Nell (existing) | clay-stained overalls, short hair |
| `bea-houseboat.glb` | Bea (existing) | striped top, bucket hat |
| `pip-photo.glb` | Pip (existing) | oversized cardigan, film camera at `RightHandSocket` |
| `joon-barista.glb` | Joon (new, café) | black apron, round glasses |
| `sanne-stall.glb` | Sanne (new, shop) | headscarf, tote bag |
| `truus-tulips.glb` | Oma Truus (new, meadow) | grey bun, cardigan, gardening gloves |
| `lotte-junior.glb` | Lotte (new, child) | 0.75 scale, backpack, pigtails |

Build every NPC from `npc-base.glb` (the same body, with different hair, clothes, props and colours), so they all share proportions and pivots.

### B5. UI-in-world props (P1, 3 models) → `/models/ui/`

| File | Description |
|---|---|
| `quest-marker.glb` | floating faceted diamond, pink; node `marker_Gem`. Code bobs/rotates it. |
| `delivery-parcel.glb` | small ribbon-tied box for carrying on the tray |
| `material-basket.glb` | wicker basket worn at Eliya's hip when gathering (attach to `eliya_LeftHandSocket`) |

### B6. Atelier décor extras (P2, 6 models) → `/models/decor/`

`hanging-plant.glb`, `neon-heart-sign.glb`, `record-player.glb`, `rug-round-scalloped.glb`, `wall-shelf-polish.glb` (a shelf of 12 bottles, bottle caps as one material), `framed-lookbook-print.glb`.

---

## Part C — How to build them (exact rules)

### C1. Tooling

- The same Blender major version that made the existing files (the files say `Khronos glTF Blender I/O v5.2.x`, so use Blender 5.x).
- Build **with Python scripts only**, one script per model, stored in the repo under `blender/scripts/<category>/<file-name>.py`. Run them headless:
  `blender -b -P blender/scripts/filler/grass-tuft-a.py`
- Each script writes: `public/models/<category>/<file-name>.glb` **and** `blender/previews/<file-name>.png` (a thumbnail for review).
- Commit the scripts. If a model needs changing, change the script and re-run it; **never hand-edit the .glb**.

### C2. Style rules (match the existing models)

- **Flat colour only.** A Principled BSDF with Base Color, Roughness and Metallic set. **No image textures, no UVs needed, no vertex paint.**
- **Roughness:** 0.55–0.9 for most surfaces; 0.15–0.3 for glass, chrome and glossy gel; metallic 1.0 only for chrome and gold.
- **Soft edges:** add a Bevel modifier (width 0.01–0.03 m, 2 segments) to boxy parts, then apply it before export.
- **Simple shapes:** build from cubes, cylinders, UV/ico spheres and cones (low segment counts: 12–24 for cylinders). Chunky and toy-like, not realistic.
- **Materials are named after palette tokens** (`pal_cream`, `pal_rose`…), so the same colour is literally the same material name everywhere.

### C3. Palette (hex, sRGB)

These values were extracted from the existing models (converted approximately). Before starting, **re-extract them exactly** by reading `baseColorFactor` from 5 existing .glb files and updating this table.

| Token | Hex | Use |
|---|---|---|
| `pal_cream` | `#F8F6F1` | walls, porcelain, bases |
| `pal_butter` | `#F6E09E` | warm lights, accents, straw |
| `pal_sand` | `#E0CDB3` | wood (light), stone |
| `pal_taupe` | `#C2AC94` | cobbles, clay |
| `pal_wood` | `#AC8061` | dark wood |
| `pal_terracotta` | `#C78A75` | pots, roofs |
| `pal_rose` | `#EDA4A4` | main pink |
| `pal_blush` | `#F9E2E2` | soft pink |
| `pal_petal` | `#F9C2D2` | petals, tulips |
| `pal_lilac` | `#A894FF` | crystal, cat-eye |
| `pal_mint` | `#B1CDBD` | accents |
| `pal_sage` | `#B3CABA` | foliage (light) |
| `pal_leaf` | `#5A806F` | foliage (dark), stems |
| `pal_grass` | `#768F72` | matches the planet ground |
| `pal_ink` | `#2A2A38` | iron, eyes, outlines |
| `pal_chrome` | `#E9EAED` + metallic 1.0, roughness 0.15 | chrome |
| `pal_gold` | `#E4C07A` + metallic 1.0, roughness 0.25 | gold leaf, brass |

### C4. Scale, orientation and pivot

- **1 Blender unit = 1 metre.** Before modelling a character or street prop, import `eliya-artisan.glb` and `canal-house-stepped-gable.glb` into a scratch scene and measure them; make everything proportional to those.
- **Blender is Z-up, the export is Y-up** (default glTF setting); don't rotate things to compensate.
- **Origin/pivot at the bottom centre** (where it touches the ground), because the game places models on the sphere by that point and rotates them to the surface normal.
- **Front faces −Y in Blender** (the same as the existing houses; check this on one file first and write down what you find at the top of your first script).
- **Apply all transforms** (location/rotation/scale) before export; the root object's scale must be 1.

### C5. Naming

- File names: `kebab-case.glb`.
- Node names: `<prefix>_<PartName>` in PascalCase, the same pattern as the existing models (`house_MonumentDoor`, `lamp_PoleShaft`, `eliya_LeftArm`). Code finds parts by these names, so don't leave defaults like `Cube.003`.

### C6. Export settings

```python
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=True,        # apply modifiers
    export_yup=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,  # all motion is done in code
    export_materials='EXPORT',
)
```

No Draco or meshopt compression (the game's loader isn't set up for it). File size target: filler under 40 KB, pickups under 80 KB, props under 250 KB, NPCs under 350 KB.

### C7. Script template (copy this for every model)

```python
# blender/scripts/_lib.py  — shared helpers (tested with Blender 5.0 / bpy 5.0.1, headless)
import bpy, math, os

PALETTE = {
  "pal_cream": ("#F8F6F1", 0.8, 0.0), "pal_butter": ("#F6E09E", 0.7, 0.0),
  "pal_sand": ("#E0CDB3", 0.8, 0.0), "pal_taupe": ("#C2AC94", 0.85, 0.0),
  "pal_wood": ("#AC8061", 0.75, 0.0), "pal_terracotta": ("#C78A75", 0.8, 0.0),
  "pal_rose": ("#EDA4A4", 0.6, 0.0), "pal_blush": ("#F9E2E2", 0.6, 0.0),
  "pal_petal": ("#F9C2D2", 0.6, 0.0), "pal_lilac": ("#A894FF", 0.3, 0.0),
  "pal_mint": ("#B1CDBD", 0.7, 0.0), "pal_sage": ("#B3CABA", 0.85, 0.0),
  "pal_leaf": ("#5A806F", 0.85, 0.0), "pal_grass": ("#768F72", 0.9, 0.0),
  "pal_ink": ("#2A2A38", 0.6, 0.0), "pal_chrome": ("#E9EAED", 0.15, 1.0),
  "pal_gold": ("#E4C07A", 0.25, 1.0),
}

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def mat(token):
    if token in bpy.data.materials:
        return bpy.data.materials[token]
    hexv, rough, metal = PALETTE[token]
    r, g, b = (int(hexv[i:i+2], 16) / 255 for i in (1, 3, 5))
    m = bpy.data.materials.new(token)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    m.diffuse_color = (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1)  # so Workbench previews show the colour
    return m

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def part(kind, name, loc=(0,0,0), rot=(0,0,0), scale=(1,1,1), token="pal_cream", bevel=0.0, **kw):
    ops = {
      "cube": bpy.ops.mesh.primitive_cube_add,
      "cyl": bpy.ops.mesh.primitive_cylinder_add,
      "sphere": bpy.ops.mesh.primitive_uv_sphere_add,
      "ico": bpy.ops.mesh.primitive_ico_sphere_add,
      "cone": bpy.ops.mesh.primitive_cone_add,
      "torus": bpy.ops.mesh.primitive_torus_add,
    }
    ops[kind](location=loc, rotation=[math.radians(a) for a in rot], **kw)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(mat(token))
    if bevel > 0:
        mod = o.modifiers.new("Bevel", "BEVEL"); mod.width = bevel; mod.segments = 2
    bpy.ops.object.shade_smooth() if kind in ("sphere", "ico", "torus") else None
    return o

def root(name):
    bpy.ops.object.empty_add(location=(0, 0, 0))
    r = bpy.context.active_object; r.name = name
    return r

def parent_all(r, objs):
    for o in objs:
        o.parent = r

def apply_all():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def join_into_one(objs, name):
    """For filler: merge into a single mesh."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]

def export(out_glb, preview_png, dist=1.2):
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_cameras=False, export_lights=False,
        export_animations=False, export_materials='EXPORT')
    render_preview(preview_png, dist)

def render_preview(png, dist=1.2):
    """dist: ~1.2 for filler/pickups, ~5 for props, ~3.5 for NPCs.
    Called after export, so the camera is never part of the .glb."""
    os.makedirs(os.path.dirname(png), exist_ok=True)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.display.shading.color_type = 'MATERIAL'
    scn.render.resolution_x = scn.render.resolution_y = 512
    scn.render.film_transparent = True
    scn.view_settings.view_transform = 'Standard'   # true palette colours, not AgX-dimmed
    # look at the object's centre from the front-right, slightly above
    h = max((o.dimensions.z for o in scn.objects if o.type == 'MESH'), default=1.0)
    target = (0, 0, h * 0.5)
    loc = (dist * 0.7, -dist * 0.7, target[2] + dist * 0.45)
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object; scn.camera = cam
    bpy.ops.object.empty_add(location=target); tgt = bpy.context.active_object
    c = cam.constraints.new('TRACK_TO'); c.target = tgt
    c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    scn.render.filepath = png
    bpy.ops.render.render(write_still=True)
```

For props call `export(glb, png, dist=5)`, for NPCs `dist=3.5`.

Example model script:

```python
# blender/scripts/pickups/freshwater-pearl-oyster.py
import sys, os; sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from _lib import *
reset()
r = root("pearl_Root")
bottom = part("sphere", "pearl_ShellBottom", loc=(0,0,0.06), scale=(0.22,0.18,0.06), token="pal_blush", segments=24, ring_count=12)
top    = part("sphere", "pearl_ShellTop", loc=(0,0.1,0.2), rot=(-55,0,0), scale=(0.22,0.18,0.05), token="pal_blush", segments=24, ring_count=12)
pearl  = part("sphere", "pearl_Pearl", loc=(0,0,0.14), scale=(0.08,0.08,0.08), token="pal_cream", segments=24, ring_count=12)
glow   = part("cyl", "pearl_Glow", loc=(0,0,0.005), scale=(0.3,0.3,0.005), token="pal_butter", vertices=24)
parent_all(r, [bottom, top, pearl, glow])
apply_all()
export("public/models/pickups/freshwater-pearl-oyster.glb", "blender/previews/freshwater-pearl-oyster.png")
```

Look at every preview PNG before handing off. If it doesn't read clearly at 512 px, it won't read in the game either.

### C8. Validation (run on every new file, fail the task if it doesn't pass)

Write `blender/validate.mjs` (Node, using `@gltf-transform/core`) that checks for each `.glb`:

1. It loads without errors (also run `npx gltf-validator <file>` and require 0 errors).
2. Triangle count is within the budget for its folder (see B1–B5).
3. Material count: filler ≤ 2, everything else ≤ 10; every material name starts with `pal_`.
4. No textures (`images.length === 0`).
5. The **world-space** bounding box minimum Y (with node transforms applied, not the raw accessor min/max) is between −0.02 and 0.02, so it sits on the ground.
6. Height is within ±25% of the size in the tables above.
7. NPCs contain every required node name from B4.
8. Filler files contain exactly one mesh node.

Print a table of results and exit non-zero on any failure.

### C9. Hand-off

When a batch is done, commit the scripts + .glbs + previews, and add every new file to `public/models/manifest.json`:

```json
{ "id": "freshwater-pearl-oyster", "path": "/models/pickups/freshwater-pearl-oyster.glb",
  "category": "pickup", "tris": 812, "bytes": 41234, "instanced": false,
  "nodes": ["pearl_Pearl", "pearl_Glow"] }
```

The game agent loads models by `id` through this manifest, and Convex content refers to the same `id`s.

### Batch order

1. B1 filler + B3 pickups (unblocks Phases 1–2)
2. B2 street & district props + B5 UI props
3. B4 NPCs (build `npc-base` first, send its preview for approval, then the 8 variants)
4. B6 décor
