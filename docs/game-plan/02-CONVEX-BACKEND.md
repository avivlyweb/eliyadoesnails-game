# 02 — Convex Backend (for the backend agent)

Read `00-README.md` and `03-GAMEPLAY-SPEC.md` first. The numbers and content come from `03`; this file is how to store and serve them.

**What Convex does in this game (single player):**
1. **Saves progress:** player, inventory, quests, friendships, unlocks, designs.
2. **Holds all game content** (clients, materials, recipes, shades, looks, levels) so it can be changed without redeploying the game, and later shared with the website.
3. **Validates and grants rewards** on the server.
4. **Scheduled jobs:** daily requests, the weekly featured look.
5. (Phase 7) AI dialogue through an action.

---

## 1. Setup

```bash
npm i convex
npx convex dev            # creates the project, writes CONVEX_DEPLOYMENT to .env.local and VITE_CONVEX_URL
```

- Put `VITE_CONVEX_URL` in `.env.local` (Vite exposes only `VITE_*` variables to the browser).
- The game is **vanilla three.js, not React**, so use the browser client:

```ts
// src/net/convex.ts
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
export const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL);
export { api };
```

- Queries: `convex.query(api.x.y, args)` (one-off) or `convex.onUpdate(api.x.y, args, cb)` (live).
- Mutations: `await convex.mutation(api.x.y, args)`.

### Deploying with Vercel

In the Vercel project for the game:

1. Convex dashboard → Project settings → **generate a Production deploy key**.
2. Vercel → Settings → Environment Variables → add `CONVEX_DEPLOY_KEY` (Production only).
3. Vercel → Build command: `npx convex deploy --cmd 'npm run build'`
   (this deploys the Convex functions, then builds the game with the right `VITE_CONVEX_URL`).
4. For preview deployments, add a separate **Preview deploy key** for the Preview environment, so previews don't touch production data.

---

## 2. Player identity (no login for now)

- On first launch the game creates `guestToken = crypto.randomUUID()` and stores it in `localStorage` (inside try/catch; if storage fails, the player is simply a new guest).
- Every function takes `guestToken`. The server looks up the player by it. **Never return one player's token in another player's data.**
- Later (optional): add Convex Auth so progress can move between devices; a `linkAccount` mutation copies the guest's `playerId` to the account.

Helper used by every function:

```ts
// convex/lib/player.ts
import { QueryCtx, MutationCtx } from "../_generated/server";
export async function getPlayer(ctx: QueryCtx | MutationCtx, guestToken: string) {
  const p = await ctx.db.query("players").withIndex("by_token", q => q.eq("guestToken", guestToken)).unique();
  if (!p) throw new Error("NO_PLAYER");
  return p;
}
```

---

## 3. Schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---------- CONTENT (seeded, edited by us, read by the game) ----------
  materials: defineTable({
    key: v.string(),               // "sakura_petal"
    name: v.string(), nameKo: v.string(),
    modelId: v.string(),           // manifest id, e.g. "sakura-petal-bundle"
    district: v.string(),          // "meadow"
    respawnMinutes: v.number(),
    sellPrice: v.number(),
  }).index("by_key", ["key"]),

  resourceNodes: defineTable({     // fixed spawn points in the world
    key: v.string(), materialKey: v.string(), district: v.string(),
    theta: v.number(), phi: v.number(),   // same spherical coords the game already uses
    yield: v.number(),                    // items per pickup
  }).index("by_district", ["district"]),

  charms: defineTable({
    key: v.string(), name: v.string(), modelId: v.string(),
    recipe: v.array(v.object({ materialKey: v.string(), qty: v.number() })),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  shades: defineTable({            // same 8 shades as the website's Nail Lab
    key: v.string(), name: v.string(), nameKo: v.string(), hex: v.string(),
    finish: v.union(v.literal("syrup"), v.literal("chrome"), v.literal("cateye")),
    unlockLevel: v.number(), price: v.number(),
  }).index("by_key", ["key"]),

  artStyles: defineTable({         // same 9 styles as the website
    key: v.string(), name: v.string(), nameKo: v.string(),
    minigame: v.string(),          // "trace" | "dots" | "magnet" | "fill" | "drops"
    difficulty: v.number(),        // 1..5
    requiredToolKey: v.optional(v.string()),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  looks: defineTable({             // finished sets; signature = real website look
    key: v.string(), name: v.string(), modelId: v.string(),
    shadeKey: v.string(), artStyleKey: v.string(), charmKey: v.optional(v.string()),
    signature: v.boolean(),
    websiteLookSlug: v.optional(v.string()),   // for "Book this look"
    baseReward: v.number(),
  }).index("by_key", ["key"]),

  tools: defineTable({
    key: v.string(), name: v.string(), modelId: v.string(),
    effect: v.string(),            // e.g. "trace_tolerance+30%"
    price: v.number(), unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  decor: defineTable({
    key: v.string(), name: v.string(), modelId: v.string(),
    bonus: v.string(), price: v.number(), unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  pets: defineTable({
    key: v.string(), name: v.string(), modelId: v.string(),
    ability: v.string(), unlockNpcKey: v.string(), unlockFriendship: v.number(),
  }).index("by_key", ["key"]),

  npcs: defineTable({
    key: v.string(), name: v.string(), role: v.string(), modelId: v.string(),
    district: v.string(), homeTheta: v.number(), homePhi: v.number(),
    personality: v.string(),                     // used by scripted lines + later AI
    schedule: v.array(v.object({ fromHour: v.number(), theta: v.number(), phi: v.number() })),
    isClient: v.boolean(),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  dialogue: defineTable({          // scripted lines
    npcKey: v.string(),
    trigger: v.string(),           // "greet" | "request" | "deliver_1" | "deliver_3" | "late" | "friend_3" …
    minFriendship: v.number(),
    lines: v.array(v.string()),
  }).index("by_npc_trigger", ["npcKey", "trigger"]),

  questTemplates: defineTable({
    key: v.string(), npcKey: v.string(),
    kind: v.union(v.literal("story"), v.literal("daily")),
    lookKey: v.string(),
    deadlineGameHours: v.optional(v.number()),
    minLevel: v.number(), minFriendship: v.number(),
    rewardGloss: v.number(), rewardXp: v.number(), rewardFriendship: v.number(),
    unlocks: v.optional(v.array(v.string())),    // e.g. ["district:meadow"]
    order: v.number(),                            // story order per npc
  }).index("by_npc", ["npcKey"]),

  districts: defineTable({         // see 04-WORLD-LAYOUT §2
    key: v.string(), name: v.string(), nameKo: v.string(),
    centerTheta: v.number(), centerPhi: v.number(), radius: v.number(),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  levels: defineTable({
    level: v.number(), xpToNext: v.number(),
    unlocks: v.array(v.string()),                 // "district:windmill", "shade:matcha_latte", "tool:micro_liner"
  }).index("by_level", ["level"]),

  // ---------- PLAYER STATE ----------
  players: defineTable({
    guestToken: v.string(),
    name: v.string(),
    level: v.number(), xp: v.number(), gloss: v.number(),
    unlocks: v.array(v.string()),                 // same strings as levels.unlocks
    position: v.object({ theta: v.number(), phi: v.number() }),
    gameMinutes: v.number(),                       // in-game clock
    activePetKey: v.optional(v.string()),
    createdAt: v.number(), lastSeenAt: v.number(),
  }).index("by_token", ["guestToken"]),

  inventory: defineTable({
    playerId: v.id("players"),
    itemType: v.union(v.literal("material"), v.literal("charm"), v.literal("tool"), v.literal("decor"), v.literal("shade")),
    itemKey: v.string(), qty: v.number(),
  }).index("by_player_item", ["playerId", "itemType", "itemKey"])
    .index("by_player", ["playerId"]),

  nodeHarvests: defineTable({                      // per-player respawn tracking
    playerId: v.id("players"), nodeKey: v.string(), harvestedAt: v.number(),
  }).index("by_player_node", ["playerId", "nodeKey"]),

  quests: defineTable({
    playerId: v.id("players"), templateKey: v.string(), npcKey: v.string(),
    status: v.union(v.literal("offered"), v.literal("active"), v.literal("crafted"), v.literal("delivered"), v.literal("expired")),
    acceptedAt: v.optional(v.number()),
    deadlineGameMinutes: v.optional(v.number()),
    designId: v.optional(v.id("designs")),
    stars: v.optional(v.number()),
    dayKey: v.optional(v.string()),                // for dailies, "2026-09-27"
  }).index("by_player_status", ["playerId", "status"])
    .index("by_player_template", ["playerId", "templateKey"]),

  friendships: defineTable({
    playerId: v.id("players"), npcKey: v.string(), points: v.number(), level: v.number(),
  }).index("by_player_npc", ["playerId", "npcKey"]),

  designs: defineTable({                           // every set the player paints
    playerId: v.id("players"), lookKey: v.string(),
    shadeKey: v.string(), artStyleKey: v.string(), charmKey: v.optional(v.string()),
    scores: v.object({ base: v.number(), art: v.number(), finish: v.number() }), // 0..100 each
    stars: v.number(), createdAt: v.number(),
    minigameStartedAt: v.number(),
  }).index("by_player", ["playerId"]),

  placedDecor: defineTable({
    playerId: v.id("players"), decorKey: v.string(), slot: v.string(),
  }).index("by_player", ["playerId"]),

  // ---------- GLOBAL ----------
  featured: defineTable({ weekKey: v.string(), lookKey: v.string() }).index("by_week", ["weekKey"]),
});
```

---

## 4. Functions (file by file)

All mutations: **look up the player → validate → change state → return the new relevant state**. Throw short error codes (`"NOT_ENOUGH_MATERIALS"`), and the game shows a friendly message for each code.

### `convex/content.ts`
- `query getAll()` → every content table in one object `{materials, resourceNodes, charms, shades, artStyles, looks, tools, decor, pets, npcs, questTemplates, levels}`. The game calls it once at boot and caches it. (Dialogue loads per NPC through `getDialogue(npcKey)`.)

### `convex/players.ts`
- `mutation bootstrap({ guestToken, name? })` → creates the player if missing (level 1, 0 xp, 50 gloss, unlocks = level 1's unlocks from `levels`, starter inventory = 3 starter shades + `czech_glass_file` + `micro_liner_brush` + 2 `silk_ribbon`, and Mira's first story quest as `offered`) and returns the full player state.
- `query state({ guestToken })` → player + inventory + active quests + friendships + placed décor. **The game subscribes with `onUpdate`, so the HUD updates by itself.**
- `mutation savePosition({ guestToken, theta, phi, gameMinutes })` → the game calls this **every 10 s at most** and on `visibilitychange`/`pagehide`. Clamp `gameMinutes` so it can only increase, by at most real elapsed time × the time scale + 5%.

### `convex/gather.ts`
- `mutation harvest({ guestToken, nodeKey })`
  - The node exists; its district is in the player's unlocks.
  - **Distance check:** the player's last saved position must be within 0.15 rad of the node. (The game calls `savePosition` just before harvesting.)
  - Respawn check: `now − harvestedAt ≥ respawnMinutes`.
  - Adds `yield` (+1 if the active pet's ability matches the material) to inventory; upserts `nodeHarvests`.
- `query nodeStates({ guestToken })` → `{nodeKey, readyAt}[]` so the game can hide harvested pickups.

### `convex/craft.ts`
- `mutation craftCharm({ guestToken, charmKey })` → checks the level and the recipe materials, removes the materials, adds the charm.

### `convex/studio.ts`
- `mutation startDesign({ guestToken, questId })` → the quest is `active`; the player owns the required shade, charm (if any) and tool; creates a design with `minigameStartedAt = now` and returns its `designId`.
- `mutation finishDesign({ guestToken, designId, scores })`
  - Clamp each score to 0–100.
  - **Anti-cheat:** `now − minigameStartedAt ≥ 12 s × number of mini-game steps` (see `03`), otherwise reject. A perfect 100/100/100 finished in under 20 s is rejected.
  - Stars: average ≥ 85 → 3, ≥ 60 → 2, otherwise 1.
  - Removes the charm, sets the quest to `crafted`, links the design.

### `convex/quests.ts`
- `query board({ guestToken, npcKey })` → the offered/active quests for that client.
- `mutation accept({ guestToken, questId })` → `offered` → `active`, sets the deadline from `gameMinutes`.
- `mutation deliver({ guestToken, questId })`
  - status `crafted`; player within 0.12 rad of the NPC's current schedule position.
  - Late (past the deadline) → rewards × 0.5 and the "late" dialogue; otherwise rewards × (1 + 0.25 × (stars − 1)).
  - Adds gloss, xp and friendship (+ decor bonuses). Handles **level-up**: while `xp ≥ xpToNext`, level up and add that level's `unlocks`.
  - Applies the template's `unlocks`, offers the NPC's next story quest, and returns `{ rewards, levelUps: [...], newUnlocks: [...], dialogueTrigger }` so the game can play the celebration.
- `internal function offerDailies(playerId)` → called from `bootstrap`/`state` when the stored dayKey differs from today (Europe/Amsterdam): picks 3 daily templates from unlocked clients using a seeded random `hash(playerId + dayKey)`, expires yesterday's unaccepted dailies.

### `convex/shop.ts`
- `mutation buy({ guestToken, itemType: "shade"|"tool"|"decor", itemKey })` → checks the level and price, deducts gloss, adds the item.
- `mutation sell({ guestToken, materialKey, qty })`.
- `mutation placeDecor({ guestToken, decorKey, slot })` / `removeDecor`.

### `convex/pets.ts`
- `mutation setActivePet({ guestToken, petKey })` → the player's friendship with `unlockNpcKey` ≥ `unlockFriendship`.

### `convex/seed.ts`
- `internalMutation run()` → **upserts** every content row from `convex/seedData/*.json` by `key`. It can run many times without creating duplicates. Run it with `npx convex run seed:run`, and for production `npx convex run --prod seed:run`.
- The JSON files are generated from the tables in `03-GAMEPLAY-SPEC.md` §8. Put the **same JSON** in the game as `public/content-fallback.json` for offline/dev.

### `convex/crons.ts`
```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.weekly("featured look", { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 }, internal.featured.pick);
crons.daily("cleanup expired", { hourUTC: 3, minuteUTC: 0 }, internal.quests.expireOld);
export default crons;
```
(Dailies are created lazily per player, so we don't need a cron that loops over all players.)

- `convex/featured.ts` → `internalMutation pick()`: chooses one Signature look for the week (rotating in order), writes `featured`. The game shows it on the market stall as "Look of the week" with a +25% reward on dailies that use it.
- `quests.expireOld` → marks `offered` dailies older than 2 days as `expired`.

---

## 5. Phase 7 (optional) — AI dialogue

- `action chat({ guestToken, npcKey, message })`:
  1. `ctx.runQuery` → the NPC's personality, the player's friendship level, the last 5 `memories` for this npc/player, the current quest.
  2. Call the Anthropic Messages API with `fetch` (key stored with `npx convex env set ANTHROPIC_API_KEY …`). System prompt = persona + rules: **max 2 sentences, stay in the world, never mention prices other than those in the content, never make promises about real bookings, reply in English with light Korean**.
  3. `ctx.runMutation` → saves a one-line summary to a new `memories` table (`playerId, npcKey, text, createdAt`; keep the last 20).
  - Rate limit: 20 chats per player per hour (count in a `chatLog` table). Over the limit, or on any error → return a random scripted `dialogue` line.
- The game shows it in the same speech bubble; scripted lines are always the default.

---

## 6. Done checks

- `npx convex dev` runs with no type errors; `seed:run` fills every table; running it twice changes no counts.
- Unit tests with `convex-test` + Vitest for: harvest distance/respawn, craftCharm with too few materials, finishDesign under the time limit (rejected), deliver late vs on time, a level-up that crosses 2 levels at once.
- A fresh browser → bootstrap → gather → craft → paint → deliver works on the Vercel preview, and a reload keeps everything.
