# AGENTS.md — How the agents work together

Put this file in the **root of the game repo** (next to `package.json`). Every agent reads it first, every session.
The plan itself is in `docs/game-plan/` (00–05). The live status is in `docs/game-plan/STATUS.md`.

---

## 1. The team

| Agent | Owns (only this agent edits these) | Reads |
|---|---|---|
| **Lead** (you or one coordinating agent) | `docs/game-plan/*`, `STATUS.md` task list, merging to `main` | everything |
| **Backend** | `convex/**`, `convex/seedData/**`, `.env.example` | 02, 03, 05 §4 |
| **Blender** | `blender/**`, `public/models/**` (new files only), `public/models/manifest.json` | 01 |
| **Game** | `src/**`, `index.html`, `public/content-fallback.json`, `vite.config.*` | 03, 04, 05 |
| **Website** | the website repo only (a separate project) | 05 |

**Rule 1: Never edit files another agent owns.** If you need a change there, write a request in `STATUS.md` (see §4) and keep working on something else.

## 2. Branches

- One branch per agent per step: `backend/step-0`, `blender/batch-1`, `game/step-1`, …
- Start every session with `git pull origin main` and merge `main` into your branch.
- Commit small and often, with messages like `backend: add harvest mutation`.
- Only the Lead merges into `main`, and only when that step's "Done when" check (in `00-README.md`) passes on the Vercel preview.

## 3. The contracts between agents (don't change them without the Lead)

These are the hand-off points. If they stay stable, agents can work at the same time without waiting for each other.

| Contract | Producer → Consumer | Rule |
|---|---|---|
| `public/models/manifest.json` | Blender → Game, Backend | Model ids are permanent. Add new ones; never rename or delete. |
| Model node names (`<id>_LeftArm`, `<id>_Glow`, …) | Blender → Game | As listed in `01`. |
| `convex/schema.ts` + function names/arguments | Backend → Game | Adding is fine. Renaming or removing needs a note in STATUS.md and the Lead's OK. |
| Content keys (`sakura_petal`, `rose_quartz`, `mira`…) | Backend (seed data) → Game, Website | Keys are permanent; names/numbers can change. |
| Website URL parameters `?look=&shade=&art=` | Website ↔ Game | As in `05 §1`. |

**Working before the other side is ready:**
- Game needs a model that doesn't exist yet → use a coloured placeholder box with the same id and size from `01`, and it swaps automatically when the manifest has the real file.
- Game needs a Convex function that doesn't exist yet → read from `public/content-fallback.json` and put the call behind a `TODO(backend)`.
- Backend needs a model id → take it from the tables in `01`; they are the source of truth.

## 4. STATUS.md: the shared board

Every agent updates `docs/game-plan/STATUS.md` **at the start and end of every session**, editing only its own section. The Lead edits the top part.

## 5. Every session, every agent

1. Read `AGENTS.md` → `STATUS.md` → your plan files.
2. `git pull`, merge `main` into your branch.
3. Check the **Requests** list in STATUS.md for anything addressed to you; do those first.
4. Work only on your current step. Don't start the next step on your own.
5. Before finishing:
   - run your checks (Backend: `npx convex dev` has no errors + tests; Blender: `node blender/validate.mjs`; Game: `npm run build` + a quick play in the preview),
   - push, and post the Vercel preview link,
   - update your section of STATUS.md: done / next / blocked / preview link.
6. If you're blocked, write it under **Requests** with what you need and from whom, and move to another task in your step.

## 6. Order and what can run at the same time

```
Step 0   Backend: Convex + save/load ─────────┐
         Blender: batch 1 (filler + pickups)   │  (at the same time)
                                               ▼
Step 1   Game: connect Convex, world densify (uses batch 1)
         Blender: batch 2 (props + UI markers)
Step 2   Game + Backend: materials & gathering
         Blender: batch 3 (NPCs, npc-base first, approval, then the 8)
Step 3   Game + Backend: quests v2 with the NPC models
Step 4   Game + Backend: crafting + studio mini-games
Step 5   All: progression, shop, pets, décor (Blender: batch 4)
Step 6   Game + Website: Signature links (Website agent can prepare earlier)
Step 7   Backend (optional): AI dialogue
```

## 7. Things no agent may do

- Deploy to production or change Vercel/Convex production settings. The Lead does that.
- Delete or rename existing model files, content keys or public functions.
- Put API keys in code. Secrets go in Convex env (`npx convex env set`) or Vercel env.
- Change the style (colours, textures) outside the palette in `01 §C3`.
- Show real prices for Eliya's services in the game.
