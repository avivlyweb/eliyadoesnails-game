# eliyadoesnails — Canal World: Game Build Plan

**Goal:** turn `eliyadoesnails-game.vercel.app` from a pretty walk-around into a real **single-player game** with a clear loop, progression and saved progress, which also sells the real atelier at `eliyadoesnails.vercel.app`.

**Stack (keep it):** vanilla three.js + Vite (current game) · Blender (all 3D assets) · **Convex** (save data, game content, validation, scheduled jobs) · **Vercel** (hosting).

---

## What exists today (audit, 27 Sep 2026)

| Area | Current state | Problem |
|---|---|---|
| 3D models | ~100 `.glb` files referenced in code, all Blender-exported, flat colours, no textures, no baked animation. ~43 load on start. | Most of them are decoration only. The **55 high-detail items** (7 nail sets, 8 charms, 8 tools, 13 studio items) have no gameplay role. |
| World | A sphere planet. `spawnNatureAndCanalFlora()` places **only 7** flora items; 14 lantern posts in a ring; a few houses/landmarks. | Big empty stretches, no paths, nothing between landmarks. |
| Gameplay | One hard-coded list of 4 clients (Mira/florist, Nell/potter, Bea/houseboat, Pip/photo booth), each asking for a set + a charm. "Atelier Book 0/4 delivered". | 4 deliveries, then nothing. No materials, no progression, no saving. |
| Characters | Part-based rigs (no skinning): nodes named `<id>_Head`, `<id>_LeftArm`, `<id>_RightArm`, `<id>_LeftLeg`, `<id>_RightLeg`, `<id>_LeftHandSocket`, `<id>_TraySocket`… animated by code. | Clients have no bodies of their own in the world. |
| Backend | None. | Nothing is saved. |

## The game in one paragraph

You play **Eliya**. Clients around Amsterdam post nail requests. You **walk and bike through the districts to gather materials** (petals, pearls, chrome drops, syrups…), **craft charms**, **paint the set in the studio through short skill mini-games** (1–3 stars), then **deliver it before the deadline**. You earn **Gloss (coins)** and **Reputation (XP)**, which level up your atelier, **unlock new districts, shades, tools, pets and décor**, and build **friendship** with each client, who then gives harder, better-paying requests. The **real looks from the website are the rare "Signature Recipes"**, and finishing one offers a "Book this look" link to the real atelier.

---

## Documents (hand each one to the agent named)

| File | Agent | Contents |
|---|---|---|
| `01-ASSETS-BLENDER.md` | **Blender agent** | What to reuse, the full list of new models, exact modelling/export rules, a Python template, and validation. |
| `02-CONVEX-BACKEND.md` | **Backend agent** | Convex setup, full `schema.ts`, functions, seed data, crons, Vercel deploy. |
| `03-GAMEPLAY-SPEC.md` | **Game agent** | Loop, systems, mini-games, economy numbers, quests, content data. |
| `04-WORLD-LAYOUT.md` | **Game agent** | Planet size, districts, paths, scatter/instancing, camera, interaction. |
| `05-WEBSITE-LINK.md` | **Game agent + website agent** | Deep links, shared catalog. |

## Build order (each phase must be playable before starting the next)

| Phase | What | Who | Done when |
|---|---|---|---|
| **0** | Convex project + save/load of player; game reads content from Convex | Backend + Game | Reloading the page keeps position, coins, level |
| **1** | World densify: smaller planet, 5 districts, paths, instanced filler (uses the Blender filler pack) | Blender + Game | You never walk >8 s without passing something |
| **2** | Materials: pickups in the world + inventory UI | Blender + Game + Backend | You can collect 8 material types; they respawn |
| **3** | Quests v2: data-driven requests from 8 clients (4 existing + 4 new NPC models) | Blender + Backend + Game | Clients have bodies, request boards, deadlines |
| **4** | Crafting: charm recipes + studio mini-games with star scores | Game + Backend | A full loop: gather → craft → paint → deliver → reward |
| **5** | Progression: levels, district gates, shop, unlocks, pets, atelier décor | All | Levels 1–12 playable (~2–3 h of content) |
| **6** | Website link: Signature Recipes, "Book this look", shared catalog | Game + Website | A delivered signature set can open the booking form prefilled |
| **7 (optional)** | AI dialogue for NPCs via Convex action | Backend | NPCs remember you and chat, with scripted fallback |

## Rules for every agent

1. **Don't break the current game.** Work on a branch; each phase is merged only when the "Done when" check passes on a Vercel preview deployment.
2. **Content lives in data, not code.** No new hard-coded arrays of clients/items in the three.js code; they come from Convex (with a bundled JSON fallback for offline/dev).
3. **Reuse before you build.** Every existing model listed in `01` gets a game role before a new model is made.
4. **The server decides rewards.** The client asks, Convex validates and grants (see `02`).
5. **Keep the look.** Flat colours from the palette, no textures, soft bevels, pastel + cream + sage.
