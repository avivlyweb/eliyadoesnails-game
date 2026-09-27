import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---------- CONTENT (seeded, edited by us, read by the game) ----------
  materials: defineTable({
    key: v.string(),               // "sakura_petal"
    name: v.string(),
    nameKo: v.string(),
    modelId: v.string(),           // manifest id, e.g. "sakura-petal-bundle"
    district: v.string(),          // "meadow"
    respawnMinutes: v.number(),
    sellPrice: v.number(),
  }).index("by_key", ["key"]),

  resourceNodes: defineTable({     // fixed spawn points in the world
    key: v.string(),
    materialKey: v.string(),
    district: v.string(),
    theta: v.number(),
    phi: v.number(),               // spherical coords
    yield: v.number(),             // items per pickup
  })
    .index("by_key", ["key"])
    .index("by_district", ["district"]),

  charms: defineTable({
    key: v.string(),
    name: v.string(),
    modelId: v.string(),
    recipe: v.array(v.object({ materialKey: v.string(), qty: v.number() })),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  shades: defineTable({            // same 8 shades as the website's Nail Lab
    key: v.string(),
    name: v.string(),
    nameKo: v.string(),
    hex: v.string(),
    finish: v.union(v.literal("syrup"), v.literal("chrome"), v.literal("cateye")),
    unlockLevel: v.number(),
    price: v.number(),
  }).index("by_key", ["key"]),

  artStyles: defineTable({         // same 9 styles as the website
    key: v.string(),
    name: v.string(),
    nameKo: v.string(),
    minigame: v.string(),          // "trace" | "dots" | "magnet" | "fill" | "drops" | "none"
    difficulty: v.number(),        // 1..5
    requiredToolKey: v.optional(v.string()),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  looks: defineTable({             // finished sets; signature = real website look
    key: v.string(),
    name: v.string(),
    modelId: v.string(),
    shadeKey: v.string(),
    artStyleKey: v.string(),
    charmKey: v.optional(v.string()),
    signature: v.boolean(),
    websiteLookSlug: v.optional(v.string()),   // for "Book this look"
    baseReward: v.number(),
  }).index("by_key", ["key"]),

  tools: defineTable({
    key: v.string(),
    name: v.string(),
    modelId: v.string(),
    effect: v.string(),            // e.g. "trace_tolerance+30%"
    price: v.number(),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  decor: defineTable({
    key: v.string(),
    name: v.string(),
    modelId: v.string(),
    bonus: v.string(),
    price: v.number(),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  pets: defineTable({
    key: v.string(),
    name: v.string(),
    modelId: v.string(),
    ability: v.string(),
    unlockNpcKey: v.string(),
    unlockFriendship: v.number(),
  }).index("by_key", ["key"]),

  npcs: defineTable({
    key: v.string(),
    name: v.string(),
    role: v.string(),
    modelId: v.string(),
    district: v.string(),
    homeTheta: v.number(),
    homePhi: v.number(),
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
    key: v.string(),
    npcKey: v.string(),
    kind: v.union(v.literal("story"), v.literal("daily")),
    lookKey: v.string(),
    deadlineGameHours: v.optional(v.number()),
    minLevel: v.number(),
    minFriendship: v.number(),
    rewardGloss: v.number(),
    rewardXp: v.number(),
    rewardFriendship: v.number(),
    unlocks: v.optional(v.array(v.string())),    // e.g. ["district:meadow"]
    order: v.number(),                            // story order per npc
  })
    .index("by_key", ["key"])
    .index("by_npc", ["npcKey"]),

  districts: defineTable({         // see 04-WORLD-LAYOUT §2
    key: v.string(),
    name: v.string(),
    nameKo: v.string(),
    centerTheta: v.number(),
    centerPhi: v.number(),
    radius: v.number(),
    unlockLevel: v.number(),
  }).index("by_key", ["key"]),

  levels: defineTable({
    level: v.number(),
    xpToNext: v.number(),
    unlocks: v.array(v.string()),                 // "district:windmill", "shade:matcha_latte", "tool:micro_liner"
  }).index("by_level", ["level"]),

  // ---------- PLAYER STATE ----------
  players: defineTable({
    guestToken: v.string(),
    name: v.string(),
    level: v.number(),
    xp: v.number(),
    gloss: v.number(),
    unlocks: v.array(v.string()),                 // same strings as levels.unlocks
    position: v.object({ theta: v.number(), phi: v.number() }),
    gameMinutes: v.number(),                       // in-game clock
    activePetKey: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_token", ["guestToken"]),

  inventory: defineTable({
    playerId: v.id("players"),
    itemType: v.union(v.literal("material"), v.literal("charm"), v.literal("tool"), v.literal("decor"), v.literal("shade")),
    itemKey: v.string(),
    qty: v.number(),
  })
    .index("by_player_item", ["playerId", "itemType", "itemKey"])
    .index("by_player", ["playerId"]),

  nodeHarvests: defineTable({                      // per-player respawn tracking
    playerId: v.id("players"),
    nodeKey: v.string(),
    harvestedAt: v.number(),
  }).index("by_player_node", ["playerId", "nodeKey"]),

  quests: defineTable({
    playerId: v.id("players"),
    templateKey: v.string(),
    npcKey: v.string(),
    status: v.union(v.literal("offered"), v.literal("active"), v.literal("crafted"), v.literal("delivered"), v.literal("expired")),
    acceptedAt: v.optional(v.number()),
    deadlineGameMinutes: v.optional(v.number()),
    designId: v.optional(v.id("designs")),
    stars: v.optional(v.number()),
    dayKey: v.optional(v.string()),                // for dailies, "2026-09-27"
  })
    .index("by_player_status", ["playerId", "status"])
    .index("by_player_template", ["playerId", "templateKey"]),

  friendships: defineTable({
    playerId: v.id("players"),
    npcKey: v.string(),
    points: v.number(),
    level: v.number(),
  }).index("by_player_npc", ["playerId", "npcKey"]),

  designs: defineTable({                           // every set the player paints
    playerId: v.id("players"),
    lookKey: v.string(),
    shadeKey: v.string(),
    artStyleKey: v.string(),
    charmKey: v.optional(v.string()),
    scores: v.object({ base: v.number(), art: v.number(), finish: v.number() }), // 0..100 each
    stars: v.number(),
    createdAt: v.number(),
    minigameStartedAt: v.number(),
  }).index("by_player", ["playerId"]),

  placedDecor: defineTable({
    playerId: v.id("players"),
    decorKey: v.string(),
    slot: v.string(),
  }).index("by_player", ["playerId"]),

  // ---------- GLOBAL ----------
  featured: defineTable({
    weekKey: v.string(),
    lookKey: v.string(),
  }).index("by_week", ["weekKey"]),
});
