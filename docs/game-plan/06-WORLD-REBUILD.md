# 06 — World Rebuild: original models, a real bunny, a full world

**For:** the Lead agent, who splits it into tasks for the Blender, Game and Backend agents (ownership as in `AGENTS.md`).
**Put this file at:** `docs/game-plan/06-WORLD-REBUILD.md`, and add a line for it in `STATUS.md`.
**Lead's OK:** this brief is Avivly's (the Lead's) approval for the exceptions it lists, mainly deleting the copied model files in §2, which `AGENTS.md` §7 normally forbids.

**Goal:** by the end, the canal world feels as full and handmade as Little Ritual, and every model in it is our own original work.

---

## 0. First, apply the waiting patch (Game agent, 5 minutes)

```
git am eliyadoesnails-bunny-backdrop-fix.patch
npm run build && npx vitest run
git push origin main
```

This stops the bunny's 8×8 m studio backdrop from appearing in the world when you press [M].

---

## 1. Why our models look wrong (read this before modelling anything)

The Peach Mochi Bunny looks soft in Blender and like an orange box in the game. The causes are in the pipeline, not in the idea:

| Problem | What happened | Rule that fixes it |
|---|---|---|
| Modifiers never exported | `export_apply` was off, so Bevel and Subsurf stayed in Blender. The body in the GLB is an **8-vertex cube**. | Apply modifiers before export (§3, rule 6). |
| Scene junk exported | `Studio_Backdrop` (8×8 m plane) and `Cam_Target` went into the GLB. | Export only the model's own collection. |
| Materials that only Blender can render | Velvet noise bump and subsurface "skin" don't exist in glTF, so the body turns flat orange in three.js. | glTF-safe materials only (§3, rule 5). |
| Face too small | Eyes 4 cm wide on a 50 cm body: invisible from the game camera. | Size details for the game camera distance. |
| Judged in the wrong place | Checked in Blender's Cycles render, never in the game. | Every model is approved from in-game screenshots (§3, rule 7). |
| Built from loose primitives | A cube plus cylinders plus spheres placed by coordinates. Reads as "programmer art". | Reference-first workflow, real shapes (§3, rules 1–3). |

---

## 2. Remove the copied models (Lead approval granted here)

**54 model files** in `public/models/` have the same names and folders as the models served by the Little Ritual site (`little-ritual.openai.chatgpt.site`), and none of them has a build script in `blender/`. They have to be treated as copied work and removed: we can't publish someone else's models in a game that promotes Avivly's business. The full list is in **Appendix A**.

**Already live in the game (replace first):**

| File | Used in | Replace with (new original, §5) |
|---|---|---|
| `world/windmill.glb` | `src/engine/spherical-planet.ts` (windmill landmark) | `windmill-de-gooyer` |
| `discoveries/petal-tree.glb` (×2) | `spherical-planet.ts` (canal district) | `blossom-tree-canal` |
| `discoveries/bird-tree.glb` | `spherical-planet.ts` (windmill hill) | `linden-tree` |
| `discoveries/forest-pine.glb` | `spherical-planet.ts` (windmill hill) | `poplar-tree` |
| `discoveries/wind-chime.glb` | `spherical-planet.ts` (meadow landmark) | `greenhouse-wind-chime` |
| `pets/*.glb` (9 files) | `src/engine/character.ts` (`/models/pets/${petKey}.glb`) and `convex/seedData/pets.json` | 7 original pets (§5.4) |

**Steps:**
1. **Blender:** build the replacements in §5.1 and §5.4 first, so nothing in the live world disappears.
2. **Game:** point the code at the new files.
3. **Blender:** delete all 54 files in Appendix A, remove them from `public/models/manifest.json`, and check that `dist/` doesn't ship them after a build.
4. **Backend:** pets. Keep the content **keys** stable (`hoots`, `dewey`, `rocky`, `seedy`, `fireball`), as `AGENTS.md` requires. **Rename** `codex` and `null-signal`: those are OpenAI's names. Use new keys, `matcha-moth` and `pearl-crab`, add a migration that moves any player's `activePetKey`, and update `convex/shop.ts`, `convex/gather.ts` and `src/engine/character.ts`. Display names can be anything original.
5. **Lead:** add a CI check (§6) so this can't happen again.

**Rule from now on:** never download, rip or copy models, textures or names from other games or websites. Every `.glb` in `public/models/` must have its build script (`blender/scripts/**`) or `.blend` source in the repo.

---

## 3. Modelling rules → save as `blender/MODELING-RULES.md` (Blender agent)

**Target:** every object is recognisable at a glance, like a real miniature. Stylised, soft and toy-like (the Little Ritual feel), not photorealistic. A player should say "market stall", "bike rack", "tulip bed" without reading a label.

1. **Reference first.** Before modelling, collect 2–3 reference photos of the real object (Amsterdam street photos are perfect), or ask Avivly. Write down the **3–5 features that make it recognisable** in the build script's header comment. Example, Dutch canal house: tall narrow front; stepped, neck or bell gable; big white-framed sash windows; hoisting beam at the top; stoep steps to the door.
2. **Silhouette and proportions first.** Make a rough blockout and compare it to the reference from the front and side. Fix proportions now; detail can't save a wrong silhouette.
3. **Real shapes, not single primitives.**
   - Bevel every edge (0.5–2 cm on props, 2–5 cm on buildings). Nothing is razor-sharp.
   - Soft things (creatures, cushions, foliage) start from a sphere or metaball, or a remeshed blockout with smooth and subdivision.
   - Model the giveaway details as geometry: window frames and sills, door handles, planks, bricks on edges, awnings, flower boxes, bike spokes as thin cylinders. No flat "box with a picture on it".
   - Add small imperfections: slight lean, varied plank widths, rounded corners.
4. **Real scale (1 unit = 1 m).** Door 2.0 m, bench seat 0.45 m, lamp post 3.0 m, canal house 9–12 m, bike 1.7 m long, people about 1.5 m. Origin at bottom centre, facing −Y.
5. **glTF-safe materials only:** base colour, roughness, metallic, emissive and alpha, using the palette in `blender/scripts/_lib.py`. Don't use procedural noise, subsurface, velvet or coat: three.js won't show them. If a surface needs pattern (bricks, wood grain, fabric), **bake** it to a small texture (512 px for props, 1024 px for buildings).
6. **Export correctly:**
   - Apply all modifiers before adding shape keys, then export with `export_apply=True`.
   - Export only the model's collection (`use_selection=True` on that collection). No backdrops, cameras, lights or helper empties, except named sockets the game uses.
   - Check after export: re-import the GLB and print vertex counts per mesh. If anything that should be rounded has fewer than about 200 vertices, it failed.
7. **Approve it in the game, not in Blender.** Load the GLB in three.js (the game, or a small viewer page using the game's lights and camera). Screenshot it at the **in-game camera distance** from the front, three-quarter and back. Put the screenshots next to the reference in `blender/previews/<id>/`. If it doesn't read instantly, it isn't done.
8. **Budgets:** small prop ≤ 3k tris, character or NPC ≤ 20k, building ≤ 15k, file ≤ 1 MB (buildings ≤ 2 MB). Grass, flowers and stones are instanced filler (they already exist).
9. **Every model ships with** its build script in `blender/scripts/<category>/<id>.py`, its manifest entry (`id`, `path`, `category`, `tris`, `bytes`, `nodes`), and its preview screenshots. Then run `node blender/validate.mjs`.

---

## 4. The Peach Mochi Bunny, rebuilt (Blender agent)

**Reference:** the bunny face image Avivly attaches is the source of truth. Match its face and mood exactly.

- **Shape:** a round, soft, mochi-like body, **not a box**. The head and body are one plump, slightly pear-shaped form, wider at the bottom. Head about 60% of the total height (chibi proportions). Height about 1.0 m.
- **Ears:** two long, tapered ears with a rounded tip and a lighter inner-ear colour. One ear slightly drooped or bent. Slight sway pivot at the ear base: add `eliya_EarL` / `eliya_EarR` empties so the game can animate them.
- **Face** (must read from 4–6 m away):
  - eyes 12–15% of head width, glossy dark with a white highlight sphere
  - small mouth
  - blush circles clearly visible (use emissive or a brighter colour, not subsurface)
- **Limbs:** small round arms and jellybean feet. The bunny stands on its feet with no gap under the body.
- **Colour:** soft peach `#F6B3A6` body, inner ears and blush `#F28C8C`, eyes `#2A1A14`. Roughness 0.55–0.7, no metallic.
- **Keep the game contract:**
  - same node names: `eliya_Root`, `eliya_Head`, `eliya_LeftArm`, `eliya_RightArm`, `eliya_LeftLeg`, `eliya_RightLeg`, `eliya_TraySocket`
  - mesh names `Eye_L`, `Eye_R`, `Mouth`, `Blush_L`, `Blush_R` with the same wink and smile morph targets
  - origin at the feet, facing −Y
- **Done when:**
  - the body mesh has ≥ 1,500 vertices, total ≤ 20k tris, file ≤ 1 MB
  - in-game screenshots (press [M]) from front, side and back are saved in `blender/previews/peach-mochi-bunny/`
  - Avivly says "that's the bunny" when comparing them to the reference

---

## 5. New original models: Blender batch 5

All follow §3. Ids are permanent once added. Sizes are approximate.

### 5.1 Replacements for live copied models (do first)

| id | What it is | Size | Must have (recognisable features) |
|---|---|---|---|
| `windmill-de-gooyer` | Amsterdam brick windmill | 14 m tall | octagonal brick-and-thatch body, wooden stage/balcony around the middle, 4 lattice sails as a separate node `windmill_Sails` (the game spins it), small door and windows |
| `blossom-tree-canal` | Cherry/apple blossom tree | 4.5 m | curved trunk, 4–6 clustered blossom clumps (petal pink), a few fallen petals at the base |
| `linden-tree` | Classic Dutch street tree | 6 m | straight trunk, rounded layered canopy, small trunk guard ring |
| `poplar-tree` | Tall narrow poplar | 8 m | column-shaped canopy, slight wind lean |
| `greenhouse-wind-chime` | Hanging chime | 1.6 m | wooden post and arm, 5 brass tubes (separate nodes for sway), a small glass bead |

### 5.2 Amsterdam street dressing (makes the world feel full)

| id | What it is | Size | Must have |
|---|---|---|---|
| `bike-rack-with-bikes` | Rack with 3 parked omafiets | 3 m | black upright Dutch bikes in different colours, baskets, one with flowers |
| `canal-bench` | Wooden park bench | 1.8 m | green cast-iron legs, wooden slats, slight wear |
| `flower-box-window` | Window planter | 1 m | terracotta box, red and pink geraniums trailing over |
| `street-planter-tulips` | Big square planter | 1.2 m | wooden box, mixed tulips |
| `amsterdammertje` | Brown-red bollard with three crosses | 0.9 m | iconic shape, three white X marks |
| `canal-railing` | Iron canal railing segment | 2 m | tileable, black, ends match |
| `houseboat-small` | Green houseboat | 9 m | flat hull, cabin with windows, plants on the roof, bike on deck |
| `rowboat-moored` | Small wooden boat | 3 m | oars, rope to bollard |
| `street-sign-amsterdam` | Street name sign | 0.6 m | red background, white letters (our own street names) |
| `post-box-dutch` | Orange PostNL-style box (no logo) | 1.2 m | orange body, two slots, rounded top |
| `cafe-terrace-set` | Table and 2 chairs | 1.5 m | bistro chairs, small round table, coffee cups |
| `market-stall-cheese` | Cheese stall | 3 m | striped awning, stacked yellow wheels, wooden crates |
| `market-stall-flowers` | Flower stall | 3 m | buckets of tulips, paper-wrapped bunches |
| `market-stall-stroopwafel` | Stroopwafel stand | 2.5 m | griddle, stacked waffles, chalkboard |
| `crate-stack` | Wooden crates | 1 m | 3 crates, one with apples |
| `herring-cart` | Small food cart | 2 m | awning, wheels, flag (no real brand) |
| `canal-house-narrow-a` / `-b` / `-c` | 3 more façades | 10–12 m | different gables (spout, step, cornice), different brick colours, shopfront on the ground floor (bakery, bookshop, nail-polish boutique) |
| `tram-stop-shelter` | Glass tram shelter | 3 m | bench inside, timetable panel |
| `greenhouse-glass` | Victorian greenhouse (meadow landmark) | 6 m | white frame, glass panes (alpha), plant tables inside |
| `tulip-field-rows` | Instanced tulip strip | 4 m | rows in 4 colours, works with instancing |
| `harbour-crane` | Small old dock crane | 7 m | lattice arm, hook, rope |
| `wooden-jetty` | Jetty segment | 4 m | planks, posts, tileable |
| `lantern-string` | Lights across the street | 6 m | catenary wire with bulbs (emissive), attach points at both ends |

### 5.3 Small "moments" between districts (2–3 per gap)

`pigeon-pair`, `cat-on-crate`, `painter-easel-canal` (our own design), `ice-cream-cart`, `book-crate-sale`, `heart-lock-railing`, `duck-family`, `picnic-blanket`.

### 5.4 Original pets (replace all 9 copied pets)

Keep keys `hoots`, `dewey`, `rocky`, `seedy`, `fireball`. New keys `matcha-moth` and `pearl-crab` replace `codex` and `null-signal`. Drop `bsod` and `stacky`. Same contract as now: about 0.4 m, origin at feet, facing −Y, and a small idle-bob node `pet_Body`.

| key | Idea |
|---|---|
| `hoots` | tiny round tulip owl |
| `dewey` | canal duckling with a pearl |
| `rocky` | chrome-pebble hedgehog |
| `seedy` | daisy sprout creature |
| `fireball` | little red bike-bell bird (speed perk) |
| `matcha-moth` | soft green moth with a tea-leaf pattern |
| `pearl-crab` | pink crab holding a nail-polish bottle |

---

## 6. Game agent: fill the districts and frame them

1. **Densify by district** (use `04-WORLD-LAYOUT.md` §2). Each district gets its full "must contain" list plus the §5.2 dressing:
   - **canal:** atelier + 4 houses + houseboat + railings + 2 bike racks + benches + flower boxes on windows + lantern string
   - **market:** 3 stalls + café terrace + crates + sign + tram shelter
   - **meadow:** greenhouse + tulip rows + planters + picnic
   - **windmill:** mill + poplars + lindens + fence
   - **harbour:** jetty + crane + rowboats + duck family

   Rule: from any spot in a district you can see at least 6 objects within 8 m.
2. **Gaps:** at most 3–4 s walk between districts, each gap with 1–2 "moments" (§5.3) and instanced filler.
3. **Camera** (`src/engine/planet-camera.ts`): raise the pitch from about 21° to about 40°, distance 7.5 → 9, so the player looks *down into* the world like a diorama instead of at the horizon. Keep the current view as an option (key [V]).
4. **Lighting:** add a soft hemisphere fill and slightly warmer sun so the pastel materials read, and check that shadows show under every prop.
5. **Performance:** instance every repeated model (bikes, bollards, railings, flowers). Target 60 fps on a mid laptop, under 150 draw calls.
6. **Done when:** screenshots of each district, taken at the new camera, are in `docs/game-plan/screens/` and each looks "full" next to the Little Ritual reference.

---

## 7. CI guard (Lead)

Add to `blender/validate.mjs` (and run it in CI):
- every `.glb` under `public/models/` must have a manifest entry **and** a build script or `.blend` in `blender/`
- fail if any file name in Appendix A comes back
- fail if a character or prop GLB contains a mesh named `*Backdrop*` or a plane larger than 4 m

---

## 8. Order and checks

| Step | Who | Done when |
|---|---|---|
| 0 | Game | bunny backdrop patch on main |
| 1 | Blender | `MODELING-RULES.md` written; bunny rebuilt and approved by Avivly |
| 2 | Blender | §5.1 replacements done; Game wires them in |
| 3 | Blender + Backend + Game | copied files deleted, pets migrated, CI guard green |
| 4 | Blender | §5.2 and §5.3 in batches of 6, each batch approved from in-game screenshots |
| 5 | Game | districts filled, camera and lighting updated, district screenshots posted |

Each step: `npm run build`, `npx vitest run`, Vercel preview link and screenshots in `STATUS.md`. Only the Lead merges to `main`.

---

## Appendix A — the 54 copied files to delete

These paths match files served by the Little Ritual site and have no source in our repo.

```
public/models/architecture/artist-house.glb
public/models/architecture/canopy-archive.glb
public/models/architecture/clock-house.glb
public/models/architecture/cloudrest.glb
public/models/architecture/juniper-house.glb
public/models/architecture/kiln-steps.glb
public/models/architecture/lantern-bridge.glb
public/models/architecture/lantern-lofts.glb
public/models/architecture/reading-house.glb
public/models/architecture/tidemark-baths.glb
public/models/architecture/tortoise-garden.glb
public/models/delights/mushroom-choir.glb
public/models/delights/rain-can.glb
public/models/delights/snail-race.glb
public/models/delights/sockling.glb
public/models/discoveries/apple-basket.glb
public/models/discoveries/bird-tree.glb
public/models/discoveries/cloudlet.glb
public/models/discoveries/fern-clump.glb
public/models/discoveries/field-note.glb
public/models/discoveries/firefly-lantern.glb
public/models/discoveries/flower-patch.glb
public/models/discoveries/forest-pine.glb
public/models/discoveries/giant-mushroom.glb
public/models/discoveries/glade-stone.glb
public/models/discoveries/hollow-log.glb
public/models/discoveries/mossbun.glb
public/models/discoveries/mushling.glb
public/models/discoveries/music-box.glb
public/models/discoveries/paint-easel.glb
public/models/discoveries/park-swing.glb
public/models/discoveries/pebblit.glb
public/models/discoveries/petal-tree.glb
public/models/discoveries/pipbird.glb
public/models/discoveries/rain-grump.glb
public/models/discoveries/shell-shrine.glb
public/models/discoveries/star-scope.glb
public/models/discoveries/teasnail.glb
public/models/discoveries/tree-stump.glb
public/models/discoveries/wind-chime.glb
public/models/discoveries/wishing-bell.glb
public/models/discoveries/woodland-snail.glb
public/models/pets/bsod.glb
public/models/pets/codex.glb
public/models/pets/dewey.glb
public/models/pets/fireball.glb
public/models/pets/hoots.glb
public/models/pets/null-signal.glb
public/models/pets/rocky.glb
public/models/pets/seedy.glb
public/models/pets/stacky.glb
public/models/world/fountain.glb
public/models/world/froge-statue.glb
public/models/world/windmill.glb
```

Delete command (Blender agent, after §5.1 replacements are wired in):

```bash
git rm \
  public/models/architecture/artist-house.glb \
  public/models/architecture/canopy-archive.glb \
  public/models/architecture/clock-house.glb \
  public/models/architecture/cloudrest.glb \
  public/models/architecture/juniper-house.glb \
  public/models/architecture/kiln-steps.glb \
  public/models/architecture/lantern-bridge.glb \
  public/models/architecture/lantern-lofts.glb \
  public/models/architecture/reading-house.glb \
  public/models/architecture/tidemark-baths.glb \
  public/models/architecture/tortoise-garden.glb \
  public/models/delights/mushroom-choir.glb \
  public/models/delights/rain-can.glb \
  public/models/delights/snail-race.glb \
  public/models/delights/sockling.glb \
  public/models/discoveries/apple-basket.glb \
  public/models/discoveries/bird-tree.glb \
  public/models/discoveries/cloudlet.glb \
  public/models/discoveries/fern-clump.glb \
  public/models/discoveries/field-note.glb \
  public/models/discoveries/firefly-lantern.glb \
  public/models/discoveries/flower-patch.glb \
  public/models/discoveries/forest-pine.glb \
  public/models/discoveries/giant-mushroom.glb \
  public/models/discoveries/glade-stone.glb \
  public/models/discoveries/hollow-log.glb \
  public/models/discoveries/mossbun.glb \
  public/models/discoveries/mushling.glb \
  public/models/discoveries/music-box.glb \
  public/models/discoveries/paint-easel.glb \
  public/models/discoveries/park-swing.glb \
  public/models/discoveries/pebblit.glb \
  public/models/discoveries/petal-tree.glb \
  public/models/discoveries/pipbird.glb \
  public/models/discoveries/rain-grump.glb \
  public/models/discoveries/shell-shrine.glb \
  public/models/discoveries/star-scope.glb \
  public/models/discoveries/teasnail.glb \
  public/models/discoveries/tree-stump.glb \
  public/models/discoveries/wind-chime.glb \
  public/models/discoveries/wishing-bell.glb \
  public/models/discoveries/woodland-snail.glb \
  public/models/pets/bsod.glb \
  public/models/pets/codex.glb \
  public/models/pets/dewey.glb \
  public/models/pets/fireball.glb \
  public/models/pets/hoots.glb \
  public/models/pets/null-signal.glb \
  public/models/pets/rocky.glb \
  public/models/pets/seedy.glb \
  public/models/pets/stacky.glb \
  public/models/world/fountain.glb \
  public/models/world/froge-statue.glb \
  public/models/world/windmill.glb
```
