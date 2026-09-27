# STATUS — Canal World build

_Last updated by: Lead · 2026-09-27_

## Current step: **2 (Completed)** → Next: **3 (Quests v2)**

**Lead's goals for this step**
- [x] Backend: Convex set up, schema + seed, bootstrap/state/savePosition, Vercel deploy keys (Step 0)
- [x] Blender: batch 1 (B1 filler ×16, B3 pickups ×8) + `validate.mjs` + manifest (Step 1)
- [x] Game: Step 1 planetoid densification, 5 districts, paths, instanced filler, camera (Step 1)
- [x] Phase 2: Material pickups in world, server-side gathering (`gather.ts`), charm crafting (`craft.ts`), and Atelier Basket UI (`[I]`) (Step 2)
- [ ] Phase 3: Quests v2: data-driven requests from 8 clients (4 existing + 4 new NPC models)
- [ ] Website: agree look slugs, answer the €18 vs €26 question (resolved: €18 is Base+Art, €26 is Base+Art+3D)

## Requests (anyone can add; the addressee removes when done)

| From → To | Request | Status |
|---|---|---|
| Lead → Website | Which shop price is correct, €18 or €26? | answered (€18 is Base+Art, €26 is Base+Art+3D) |

## Decisions (Lead only)

- 2026-09-27: Single player for now. Convex for saves + content + validation. Plan in `docs/game-plan/`.
- 2026-09-27: Phase 2 completed: 8 material pickup types spawn across 5 districts, server validated harvest with respawn timers, instant charm crafting, and full Atelier Basket inventory UI.

---

## Backend
- **Branch:** `main` (merged `backend/step-0` & Phase 2)
- **Status:** Done
- **Done:**
  - Convex setup complete with `.env.example` and dev deployment configuration
  - Created full Convex schema (`convex/schema.ts`) covering all 14 content and player state tables
  - Generated seed data JSON files in `convex/seedData/` from 03 §8
  - Exported seed data fallback to `public/content-fallback.json`
  - Built idempotent `seed:run` internal mutation in `convex/seed.ts` and executed it on dev deployment
  - Built `content.getAll` and `content.getDialogue` in `convex/content.ts`
  - Built `players.bootstrap`, `players.state`, and `players.savePosition` in `convex/players.ts` (with `convex/lib/player.ts` helper)
  - Built `convex/gather.ts` with `harvest` mutation (distance check ≤0.18 rad, district unlock check, respawn timer calculation, pet yield bonus, inventory upsert, `nodeHarvests` tracking) and `nodeStates` query
  - Built `convex/craft.ts` with `craftCharm` mutation (unlock level check, material requirement verification, recipe material consumption, charm inventory creation)
  - Unit tests: 10/10 tests passing across `players.test.ts`, `content.test.ts`, `gather.test.ts`, and `craft.test.ts` (100% pass)
  - Type checking verified with 0 errors (`tsc --noEmit`)
- **Next:** Quests v2 server functions (`convex/quests.ts` accept/deliver/board/dailies)
- **Blocked:** none
- **Preview:** Dev deployment active at `https://incredible-snake-136.convex.cloud`

## Blender
- **Branch:** `blender/batch-1`
- **Status:** Batch 1 Complete (Passed 24/24 validations)
- **Done:**
  - Created `blender/scripts/_lib.py` with palette tokens, scale/orientation findings, and headless helpers
  - Generated all 16 B1 filler models in `public/models/filler/` (single mesh node, ≤2 materials, ≤400 tris, ground min Y = 0.000m)
  - Generated all 8 B3 pickup models in `public/models/pickups/` with `<id>_Glow` highlight nodes and required subnodes (`pearl_Pearl`, `vial_Liquid`)
  - Rendered 24 512x512 preview thumbnails in `blender/previews/`
  - Implemented and ran `blender/validate.mjs`: all 24 models pass gltf-validator (0 errors) and spec limits
  - Created `public/models/manifest.json` indexing all 24 models
- **Next:** Batch 2 (B2 street props + B5 UI markers + 4 new NPC bodies) in Step 3
- **Blocked:** none
- **Previews:**
  - Filler: [grass-tuft-a](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-a.png), [grass-tuft-b](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-b.png), [grass-tuft-c](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-c.png), [tulip-cluster-pink](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-pink.png), [tulip-cluster-red](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-red.png), [tulip-cluster-yellow](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-yellow.png), [tulip-cluster-white](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-white.png), [pebble-set](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/pebble-set.png), [round-bush-small](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/round-bush-small.png), [round-bush-large](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/round-bush-large.png), [clover-patch](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/clover-patch.png), [reed-clump](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/reed-clump.png), [lily-pad-set](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/lily-pad-set.png), [fallen-petals](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/fallen-petals.png), [cobble-edge-stone](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/cobble-edge-stone.png), [mushroom-pair](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/mushroom-pair.png)
  - Pickups: [sakura-petal-bundle](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/sakura-petal-bundle.png), [daisy-sprig](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/daisy-sprig.png), [freshwater-pearl-oyster](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/freshwater-pearl-oyster.png), [chrome-droplet](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/chrome-droplet.png), [syrup-glass-vial](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/syrup-glass-vial.png), [aurora-crystal-shard](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/aurora-crystal-shard.png), [silk-ribbon-spool](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/silk-ribbon-spool.png), [gold-leaf-flake](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/gold-leaf-flake.png)

## Game
- **Branch:** `main` (merged `game/step-1` & Phase 2)
- **Status:** Done (Step 0 game side + Step 1 + Step 2)
- **Done:**
  - Connected Convex via vanilla browser `ConvexClient` (`src/net/convex.ts`)
  - Initialized `content.getAll` with offline fallback to `public/content-fallback.json`
  - Wired `players.bootstrap` and subscribed to live `players.state`
  - Synchronized in-game clock (1 in-game hour = 1 real minute) and throttled position saves (`players.savePosition` every 10s and on tab hide)
  - Resized planetoid to radius R = 17.5m (Spec §1, ~70s circumference walk) with 96x96 vertex noise terrain
  - Clustered 5 distinct districts (Canal Street, Market Square, Tulip Meadow, Windmill Hill, Harbour) with tall landmarks
  - Built procedural ribbon paths with sine wiggles, cobble kerb stone instancing, and +10% bike speed bonus
  - Built instanced filler scattering for 16 manifest models with seeded PRNG and wind sway shader (`onBeforeCompile`)
  - Placed Dutch tulip fields (600+ instanced tulips in 7 curved parallel color rows) in Tulip Meadow
  - Lowered camera distance to 7.5m with 20–22° pitch, FOV 50, and scroll wheel zoom (Spec §8)
  - Placed night lanterns along paths with time-reactive lighting (20:00–06:00)
  - Built Character Gathering Animation (`playGatherAnimation(0.8)`) with bend, arm reach, and sound triggers
  - Placed all 10 material pickups in the world with glowing bobbing meshes
  - Connected gathering flow: E key interaction, server distance and unlock validation, respawn timers, and visual node depletion/regrowth
  - Created Floating Material Harvest Toast (`#harvest-toast`) with Petal Rose branding and Korean nomenclature
  - Created Atelier Basket & Supplies overlay modal (`#inventory-modal-overlay` / `[I]`) with 4 tabs (Materials, Charms, Tools, Shades)
  - Built in-basket instant Charm Crafting with live ingredient checks and toast confirmations
- **Next:** Step 3: Quests v2 (data-driven NPC requests, request board, deadlines)
- **Blocked:** none
- **Preview:** https://eliyadoesnails-game.vercel.app
- **Blocked:** none
- **Preview:** https://eliyadoesnails-game.vercel.app

## Website
- **Branch:** —
- **Done:**
- **Next:** URL parameters + form prefill (05 §1)
- **Blocked:**
- **Preview:**
