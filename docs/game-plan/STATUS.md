# STATUS — Canal World build

_Last updated by: Lead · 2026-09-27_

## Current step: **0**

**Lead's goals for this step**
- [ ] Backend: Convex set up, schema + seed, bootstrap/state/savePosition, Vercel deploy keys
- [ ] Blender: batch 1 (B1 filler ×16, B3 pickups ×8) + `validate.mjs` + manifest
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
- **Done:**
- **Next:**
- **Blocked:**
- **Previews:** (link the PNGs in `blender/previews/`)

## Game
- **Branch:** —
- **Done:**
- **Next:** waiting for backend step 0 (can start the district/path/scatter code with placeholder boxes)
- **Blocked:**
- **Preview:**

## Website
- **Branch:** —
- **Done:**
- **Next:** URL parameters + form prefill (05 §1)
- **Blocked:**
- **Preview:**
