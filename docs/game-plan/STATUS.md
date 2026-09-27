# STATUS — Canal World build

_Last updated by: Lead · 2026-09-27_

## Current step: **0**

**Lead's goals for this step**
- [x] Backend: Convex set up, schema + seed, bootstrap/state/savePosition, Vercel deploy keys
- [x] Blender: batch 1 (B1 filler ×16, B3 pickups ×8) + `validate.mjs` + manifest
- [ ] Website: agree look slugs, answer the €18 vs €26 question

## Requests (anyone can add; the addressee removes when done)

| From → To | Request | Status |
|---|---|---|
| Lead → Website | Which shop price is correct, €18 or €26? | open |

## Decisions (Lead only)

- 2026-09-27: Single player for now. Convex for saves + content + validation. Plan in `docs/game-plan/`.

---

## Backend
- **Branch:** `backend/step-0`
- **Status:** Done
- **Done:**
  - Convex setup complete with `.env.example` and dev deployment configuration
  - Created full Convex schema (`convex/schema.ts`) covering all 14 content and player state tables
  - Generated seed data JSON files in `convex/seedData/` from 03 §8
  - Exported seed data fallback to `public/content-fallback.json`
  - Built idempotent `seed:run` internal mutation in `convex/seed.ts` and executed it on dev deployment
  - Built `content.getAll` and `content.getDialogue` in `convex/content.ts`
  - Built `players.bootstrap`, `players.state`, and `players.savePosition` in `convex/players.ts` (with `convex/lib/player.ts` helper)
  - Installed `convex-test` and `vitest` with unit tests for bootstrap, savePosition, seed, and content (100% pass)
  - Type checking verified with 0 errors (`tsc --noEmit`, `convex codegen --typecheck enable`)
- **Next:** Step 1 support and Phase 2 gather mutations (`convex/gather.ts`)
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
- **Next:** Batch 2 (B2 street props + B5 UI markers) in Step 1
- **Blocked:** none
- **Previews:**
  - Filler: [grass-tuft-a](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-a.png), [grass-tuft-b](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-b.png), [grass-tuft-c](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/grass-tuft-c.png), [tulip-cluster-pink](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-pink.png), [tulip-cluster-red](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-red.png), [tulip-cluster-yellow](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-yellow.png), [tulip-cluster-white](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/tulip-cluster-white.png), [pebble-set](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/pebble-set.png), [round-bush-small](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/round-bush-small.png), [round-bush-large](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/round-bush-large.png), [clover-patch](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/clover-patch.png), [reed-clump](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/reed-clump.png), [lily-pad-set](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/lily-pad-set.png), [fallen-petals](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/fallen-petals.png), [cobble-edge-stone](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/cobble-edge-stone.png), [mushroom-pair](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/mushroom-pair.png)
  - Pickups: [sakura-petal-bundle](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/sakura-petal-bundle.png), [daisy-sprig](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/daisy-sprig.png), [freshwater-pearl-oyster](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/freshwater-pearl-oyster.png), [chrome-droplet](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/chrome-droplet.png), [syrup-glass-vial](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/syrup-glass-vial.png), [aurora-crystal-shard](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/aurora-crystal-shard.png), [silk-ribbon-spool](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/silk-ribbon-spool.png), [gold-leaf-flake](file:///Users/avivly/Downloads/avivly/clients/Fysio%20utrecht%20oost/eliyadoesnails-game-blender/blender/previews/gold-leaf-flake.png)

## Game
- **Branch:** `game/step-1`
- **Status:** Done (Step 0 game side + Step 1)
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
- **Next:** Step 2 (gathering mechanics & mini-game polish)
- **Blocked:** none
- **Preview:** https://eliyadoesnails-game.vercel.app

## Website
- **Branch:** —
- **Done:**
- **Next:** URL parameters + form prefill (05 §1)
- **Blocked:**
- **Preview:**
