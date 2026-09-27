# 04 — World Layout & Interactivity (for the game agent)

Fixes "everything is scattered and far apart". **Target feeling:** you are never more than ~8 seconds' walk from something to look at or interact with, and you can always see the next district on the horizon.

The current code (the world class in `src/`) already has `getSphericalPoint(theta, phi, heightOffset)` and `orientToNormal(obj, normal, yaw)`. **Keep using them;** every position below is `(theta, phi)` in the same system (`phi` = angle from the planet's top, `theta` = around).

---

## 1. Planet size

- Find `this.radius` in the world class and the player's walk speed.
- New radius: **`R = walkSpeed × 70 / (2π)`**, so walking once around the planet takes about 70 s (currently it's far more). Expect roughly a **30–40% smaller** radius.
- After changing R, scale props so they keep their size in metres (the models are metric; don't scale them with R).
- The terrain sphere: raise its segments from 64×64 to 96×96, and add gentle **vertex noise** (±0.15 m, low frequency) so the ground isn't perfectly smooth. Keep flat areas (noise 0) under districts and paths.

## 2. Districts

Place the 5 districts from `03 §3` as **clusters**, each a circle on the sphere:

| District | Centre (θ, φ) (starting suggestion) | Radius (rad) | Must contain |
|---|---|---|---|
| canal (start) | the atelier's current position | 0.35 | the atelier, 3 canal houses, bridge, a canal strip, florist cart, 2 petal trees, bollards, 2 benches, bike rack, planters |
| market | +1.3 rad in θ from canal | 0.30 | photobooth, café kiosk, market stall, café table sets, crates, signpost, lanterns |
| meadow | +2.6 rad | 0.35 | greenhouse, tulip fields (instanced), flower patches, wind chime, fence rows |
| windmill | +3.9 rad | 0.30 | windmill, forest pines, bird tree, rocks, chrome-drop nodes near the mill |
| harbour | +5.1 rad, φ + 0.25 | 0.30 | salon boat, harbour dock, bollards, reeds, lily pads, gold-leaf nodes on the jetty |

Rules:
- **Gap between district edges: at most 0.25 rad** (about 3–4 s of walking). The gap is not empty: it holds the path, filler and 1–2 small "moments" (a bench with a pigeon, a lone lantern, a discovery).
- Move existing landmarks into their district. The windmill, salon boat, photobooth and flower cart already have coordinates in code; change them to sit inside the right cluster.
- Every district has one **tall landmark** visible from the neighbouring district (windmill, greenhouse roof, café awning, boat mast, atelier gable). It helps players find their way.
- Store district centres/radii in the Convex `districts` table (see `02`) so they can be tuned.

## 3. Paths (procedural, no Blender)

- Connect districts in a ring (canal → market → meadow → windmill → harbour → canal) plus **one shortcut** across the planet's top.
- Build each path as a **ribbon mesh**: sample the great-circle arc (slerp between the two centre vectors) every 0.5 m, add a small sine wiggle (amplitude 0.6 m, wavelength 12 m) so it isn't ruler-straight, and extrude a 1.8 m wide strip 0.02 m above the terrain along the surface normal.
- Material: `pal_taupe` (#C2AC94), roughness 0.95. Inside districts, switch to a 2.4 m wide "cobble" variant with a slightly darker colour.
- Edge stones: instance `cobble-edge-stone` every 0.7 m on both sides (random yaw ±10°, scale 0.9–1.1).
- The **canal**: a 3 m wide strip in the canal district (water colour `#9EC4C7`, roughness 0.1, with a slowly scrolling normal-free shimmer done by vertex colour animation), with the bridge crossing it and reeds/lily pads along the edges.
- Paths also mark where the bike is faster: +10% bike speed on paths.

## 4. Filler scatter (instancing)

Use `THREE.InstancedMesh`: **one InstancedMesh per filler model per district** (so each district can be frustum-culled separately; call `computeBoundingSphere()` after filling it).

Placement algorithm per district:
1. Poisson-disk sampling on the sphere inside the district circle (min distance per type, below).
2. Reject points: within 1.2 m of a path centre line, inside any building footprint (use each model's bounding radius + 0.5 m), within 2 m of an NPC schedule point or resource node.
3. Orient to the surface normal, random yaw, scale 0.8–1.2.
4. Use a **seeded** random (seed = district key), so the layout is the same on every load.

| Filler | canal | market | meadow | windmill | harbour | gaps (per gap) | min dist (m) |
|---|---|---|---|---|---|---|---|
| grass-tuft a/b/c (mixed) | 250 | 120 | 400 | 350 | 150 | 120 | 0.6 |
| tulip-cluster (4 colours) | 40 | 20 | **600 in rows** | 40 | 10 | 20 | 0.5 |
| clover-patch | 40 | 20 | 80 | 60 | 20 | 30 | 0.8 |
| pebble-set | 20 | 30 | 20 | 60 | 40 | 15 | 1.0 |
| round-bush small/large | 20 | 10 | 25 | 35 | 10 | 8 | 2.0 |
| mushroom-pair | 10 | 0 | 15 | 25 | 0 | 5 | 1.5 |
| fallen-petals | 30 (under petal trees) | 0 | 80 | 0 | 0 | 10 | 0.8 |
| reed-clump / lily-pad-set | canal edges only: 40 / 20 | 0 | 0 | 0 | 50 / 25 | 0 | 0.7 |

**Tulip rows in the meadow:** don't Poisson-sample; place them on 6–8 parallel curved rows, alternating colour per row. It's the "Dutch postcard" shot.

**Wind sway:** add a tiny vertex-shader sway to grass and tulips with `material.onBeforeCompile` (offset x/z by `sin(time × 1.5 + instancePhase) × 0.04 × vertexHeight`). Stronger during the golden hour.

**Performance budget:** under 250 draw calls, 60 fps on a mid-range laptop, under 1.2 M triangles visible. Shadows only from buildings, trees, NPCs and Eliya (not filler).

## 5. Hand-placed props per district (non-instanced)

| District | Props (count) |
|---|---|
| canal | wooden-bench ×2, planter-box ×4, bike-rack-with-bikes ×1, amsterdam-lantern-post ×5, cast-iron-mooring-bollard ×6, order-board ×2 (Mira, Nell) |
| market | cafe-table-set ×3, wooden-crate-stack ×3, district-signpost ×1, lanterns ×4, order-board ×3 (Pip, Joon, Sanne) |
| meadow | fence rows (a simple procedural post + rail in code), wooden-bench ×1, order-board ×2 (Truus, Lotte), district-gate at the market side |
| windmill | district-gate, rocks, bird-tree, forest-pine ×6, bench ×1 |
| harbour | district-gate, harbour-dock ×2, bollards ×6, lanterns ×3, order-board ×1 (Bea) |
| every junction | district-signpost with canvas-texture labels (EN + 한국어) |

**Lanterns:** remove the current 14-lantern ring; place them along paths every ~10 m instead and in district squares. They switch on at 20:00 game time.

## 6. Interactivity in the world

- **Interact prompt:** within 2.5 m of anything interactive, show a small floating "E" bubble plus the object's name. Only the nearest one is active.
- **Highlight:** pulse the `<id>_Glow` node (pickups) or add a soft rim (outline pass or emissive bump) on NPCs and boards.
- **Ambient reactions (no rewards, just life):**
  - Walking through tulips/grass: the instances near the player lean away (pass the player position as a uniform to the sway shader and push vertices away within 1 m).
  - Petal trees drop a few petal particles when you pass.
  - Lanterns brighten slightly when you're close at night.
  - Windmill blades speed up when you stand near them.
  - The wind chime rings when you walk past (it's also a discovery, see Collection Book).
  - Bike bell on B + Space while riding.
- **Footstep sounds** by surface: grass / cobble path / wooden dock (read what's under the player: path mask vs dock bounds vs terrain).
- **Discoveries:** 10 hidden spots (behind the greenhouse, under the bridge, on top of the windmill hill…). Walking into one adds a Collection Book entry and +10 Gloss. Mark them with the existing `discoveries/wind-chime` or a small sparkle only.

## 7. NPCs in the world

- Load each NPC by `modelId` from the manifest. Put them at their current schedule point (based on the game clock); they **walk along paths** to the next point when the hour changes (use the path ribbon as a navigation line; walk speed 0.6× the player's).
- **Code animation** (the models are rigid parts with pivots):
  - Walk: legs rotate ±25° around X at `2 Hz × speed`, arms opposite ±20°, body bobs 0.03 m.
  - Idle: breathing (`Body` scale.y 1 ± 0.01 at 0.3 Hz); every 4–8 s a small head turn.
  - Look-at: within 4 m, `Head` turns toward Eliya (clamp ±60°).
  - Talking: head nods + a speech bubble (HTML overlay projected from the head position).
  - Waiting with an order: a floating `quest-marker` above them + a small wave (`RightArm` −120° twice) when you come within 8 m.
- Clients wear delivered sets: attach the set model (scale 0.25) to `<id>_RightHandSocket`.

## 8. Camera

- The current camera is high and far back, so the world looks empty. **Lower it and move it closer:** distance −25%, pitch from roughly 35° down to 20–22°, FOV 50.
- Collision: if a building sits between the camera and Eliya, pull the camera in (raycast).
- In districts, allow a gentle zoom with the scroll wheel (min/max distance).
- A 1.5 s intro pan when a new district unlocks.

## 9. Done checks

- Record a 60 s walk around the whole planet: at every second at least one interactive object or NPC is visible on screen.
- Every district is recognisable from a screenshot alone.
- Draw calls and fps are within budget in Chrome's performance panel on a mid-range laptop.
