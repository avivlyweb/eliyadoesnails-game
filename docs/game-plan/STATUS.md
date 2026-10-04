# STATUS — Canal World build

_Last updated by: Lead · 2026-09-27_

### Current step: **Complete (Phases 1-6 Integrated & Live)**

**Lead's goals for this step**
- [x] Backend: Convex set up, schema + seed, bootstrap/state/savePosition, Vercel deploy keys (Step 0)
- [x] Blender: batch 1 (B1 filler ×16, B3 pickups ×8) + `validate.mjs` + manifest (Step 1)
- [x] Game: Step 1 planetoid densification, 5 districts, paths, instanced filler, camera (Step 1)
- [x] Phase 2: Material pickups in world, server-side gathering (`gather.ts`), charm crafting (`craft.ts`), and Atelier Basket UI (`[I]`) (Step 2)
- [x] Phase 3: Quests v2: data-driven requests from 8 clients, 8 NPC character GLB models + B5 UI props (quest diamond marker, delivery box, wicker basket), live accept/deliver/rewards loop, level-ups and district unlocks (Step 3)
- [x] Phase 4: Full 3D Nail Studio 3-step minigame (Syrup Fill, Precision Micro-Liner, UV Lamp Timing Cure), 1-3 star scoring, couture box packing
- [x] Phase 5: Sanne's Market Stall (buy shades/tools/décor, sell excess materials) & 7 Companion Pets with passive traversal/perks
- [x] Phase 6: Website booking integration ("Book this look at the Amsterdam Atelier ↗") to `eliyadoesnails.vercel.app/#book`

## Requests (anyone can add; the addressee removes when done)

| From → To | Request | Status |
|---|---|---|
| Lead → Website | Which shop price is correct, €18 or €26? | answered (€18 is Base+Art, €26 is Base+Art+3D) |

## Decisions (Lead only)

- 2026-09-27: Single player for now. Convex for saves + content + validation. Plan in `docs/game-plan/`.
- 2026-09-27: Phase 2 completed: 8 material pickup types spawn across 5 districts, server validated harvest with respawn timers, instant charm crafting, and full Atelier Basket inventory UI.
- 2026-09-27: Phase 3 completed: 8 NPC 3D characters placed in districts with animated bobbing quest diamond markers, full Convex quest board, distance-checked delivery, XP/Gloss/Friendship progression, and multi-level-up unlocks.
- 2026-09-27: Phase 4 completed: 3-step Nail Studio minigame (Base Coat Syrup Fill coverage tracking, Micro-Liner art tracing, UV Tunnel Lamp sweep timing cure) resulting in star score and packaging into Couture Delivery Box.
- 2026-09-27: Phase 5 & 6 completed: Sanne's Market Trading Stall opened (`[S]` key / interaction), 7 Companion Pets (`dewey`, `fireball`, `hoots`, `null-signal`, `rocky`, `seedy`, `codex`) following Eliya on tangent plane with perk bonuses, and direct real-world Amsterdam Atelier booking link integration.
- 2026-10-04: Approved and initiated `06-WORLD-REBUILD.md`: Original models, genuine mochi bunny rebuild, replacement of copied assets, district densification, and CI validation. Step 0 (bunny backdrop patch) applied and verified.

---

## Backend
- **Branch:** `main`
- **Status:** Done (All endpoints, mutations, and tests active)
- **Done:**
  - Convex setup complete with `.env.example` and dev deployment configuration
  - Created full Convex schema (`convex/schema.ts`) covering all 14 content and player state tables
  - Generated seed data JSON files in `convex/seedData/` from 03 §8
  - Exported seed data fallback to `public/content-fallback.json`
  - Built idempotent `seed:run` internal mutation in `convex/seed.ts` and executed it on dev deployment
  - Built `content.getAll` and `content.getDialogue` in `convex/content.ts`
  - Built `players.bootstrap`, `players.state`, and `players.savePosition` in `convex/players.ts` (with `convex/lib/player.ts` helper)
  - Built `convex/gather.ts` with `harvest` mutation and node state tracking
  - Built `convex/craft.ts` with `craftCharm` recipe crafting mutation
  - Built `convex/quests.ts` with accept, studio design finish, and deliver mutations
  - Built `convex/shop.ts` with `buyItem`, `sellMaterial`, and `setActivePet` mutations
  - Unit tests: 13/13 Vitest tests passing (100% pass) across all backend modules
  - Type checking verified with 0 errors (`tsc --noEmit`)
- **Next:** Live production monitoring
- **Blocked:** none
- **Preview:** Dev deployment active at `https://incredible-snake-136.convex.cloud`

## Blender
- **Branch:** `blender/batch-1`
- **Status:** Batch 1 & NPC/Pet Models Complete
- **Done:**
  - Created `blender/scripts/_lib.py` with palette tokens, scale/orientation findings, and headless helpers
  - Generated all 16 B1 filler models in `public/models/filler/`
  - Generated all 8 B3 pickup models in `public/models/pickups/`
  - Built B5 UI props (`quest-marker.glb`, `delivery-box.glb`, `wicker-basket.glb`)
  - Integrated 8 NPC 3D Characters and 7 Companion Pet GLB models
  - All models pass gltf-validator (0 errors) and manifest specifications
- **Next:** Optional seasonal prop expansions
- **Blocked:** none

## Game
- **Branch:** `main`
- **Status:** Done (Full Game Loop Live & Playable)
- **Done:**
  - Connected Convex via vanilla browser `ConvexClient` (`src/net/convex.ts`) with offline fallback
  - Planetoid densification (R=17.5m), 5 distinct districts, procedural cobblestone ribbon paths, night lanterns
  - Instanced filler scattering (16 models, 600+ Dutch tulips) with wind sway vertex shader
  - 8 Material harvest nodes with distance/respawn validation and collection animation
  - Atelier Basket & Supplies overlay modal (`[I]`) with 4 tabs and instant charm crafting
  - 8 NPC characters placed across districts with rotating diamond quest markers and client commission dialogue
  - Manicure Studio ticket workbench: launching the 3-step Atelier Nail Minigame:
    1. Base Coat Syrup Fill: click-drag brush over 5 almond nails with live coverage detection
    2. Micro-Liner & Artisan Art: interactive SVG stroke curve tracing
    3. UV Tunnel Lamp Cure: oscillating sweep bar timing cure in the center sweet spot
    4. Star Score calculation, Couture Box packaging, and real-world Amsterdam booking link
  - Sanne's Market Stall (`[S]` key / stall interaction) with 4 tabs: Shades, Tools, Décor, and Sell Materials
  - 7 Companion Pets (`dewey`, `fireball`, `hoots`, `null-signal`, `rocky`, `seedy`, `codex`) hopping alongside Eliya with active perk bonuses (e.g. Fireball +15% bicycle speed)
  - Responsive HUD with district badges, live in-game clock, gloss balance, and inventory counters
- **Next:** Community playtesting & feedback
- **Blocked:** none

## Website
- **Branch:** —
- **Done:**
- **Next:** URL parameters + form prefill (05 §1)
- **Blocked:**
- **Preview:**
