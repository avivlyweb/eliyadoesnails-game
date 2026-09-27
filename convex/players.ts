import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { getPlayer } from "./lib/player";

async function getFullPlayerState(
  ctx: QueryCtx | MutationCtx,
  player: Doc<"players">
) {
  const [inventory, quests, friendships, placedDecor] = await Promise.all([
    ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect(),
    ctx.db
      .query("quests")
      .withIndex("by_player_status", (q) => q.eq("playerId", player._id))
      .collect(),
    ctx.db
      .query("friendships")
      .withIndex("by_player_npc", (q) => q.eq("playerId", player._id))
      .collect(),
    ctx.db
      .query("placedDecor")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect(),
  ]);

  return {
    player,
    inventory,
    quests,
    friendships,
    placedDecor,
  };
}

export const bootstrap = mutation({
  args: {
    guestToken: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let player = await ctx.db
      .query("players")
      .withIndex("by_token", (q) => q.eq("guestToken", args.guestToken))
      .unique();

    const now = Date.now();

    if (!player) {
      // Find level 1 unlocks from levels table if seeded
      const level1 = await ctx.db
        .query("levels")
        .withIndex("by_level", (q) => q.eq("level", 1))
        .unique();
      const unlocks = level1?.unlocks ?? [
        "district:canal",
        "npc:mira",
        "npc:nell",
      ];

      const playerId = await ctx.db.insert("players", {
        guestToken: args.guestToken,
        name: args.name ?? "Eliya",
        level: 1,
        xp: 0,
        gloss: 50,
        unlocks,
        position: { theta: 0.8, phi: 0.8 },
        gameMinutes: 480, // 08:00 AM
        createdAt: now,
        lastSeenAt: now,
      });

      // Starter inventory:
      // 3 starter shades + czech_glass_file + micro_liner_brush + 2 silk_ribbon
      const starterInventory: Array<{
        itemType: "shade" | "charm" | "tool" | "decor" | "material";
        itemKey: string;
        qty: number;
      }> = [
        { itemType: "shade", itemKey: "rose_quartz", qty: 1 },
        { itemType: "shade", itemKey: "cherry_blossom", qty: 1 },
        { itemType: "shade", itemKey: "apricot_peach", qty: 1 },
        { itemType: "tool", itemKey: "czech_glass_file", qty: 1 },
        { itemType: "tool", itemKey: "micro_liner_brush", qty: 1 },
        { itemType: "material", itemKey: "silk_ribbon", qty: 2 },
      ];

      for (const item of starterInventory) {
        await ctx.db.insert("inventory", {
          playerId,
          itemType: item.itemType,
          itemKey: item.itemKey,
          qty: item.qty,
        });
      }

      // Mira's first story quest as offered
      await ctx.db.insert("quests", {
        playerId,
        templateKey: "quest_mira_1",
        npcKey: "mira",
        status: "offered",
      });

      // Initial friendships with starting NPCs
      await ctx.db.insert("friendships", {
        playerId,
        npcKey: "mira",
        points: 0,
        level: 0,
      });
      await ctx.db.insert("friendships", {
        playerId,
        npcKey: "nell",
        points: 0,
        level: 0,
      });

      player = (await ctx.db.get(playerId))!;
    } else {
      await ctx.db.patch(player._id, {
        lastSeenAt: now,
        ...(args.name ? { name: args.name } : {}),
      });
      player = (await ctx.db.get(player._id))!;
    }

    return await getFullPlayerState(ctx, player);
  },
});

export const state = query({
  args: {
    guestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_token", (q) => q.eq("guestToken", args.guestToken))
      .unique();
    if (!player) return null;

    return await getFullPlayerState(ctx, player);
  },
});

export const savePosition = mutation({
  args: {
    guestToken: v.string(),
    theta: v.number(),
    phi: v.number(),
    gameMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);
    const now = Date.now();

    // Clamp gameMinutes:
    // 1 real second = 1 in-game minute (60 min / 60 sec)
    // Clock can only increase, by at most real elapsed time * time scale + 5%
    const realElapsedSec = Math.max(0, (now - player.lastSeenAt) / 1000);
    const maxIncrease = Math.max(1, (realElapsedSec + 5) * 1.05);

    const clampedGameMinutes = Math.min(
      Math.max(player.gameMinutes, args.gameMinutes),
      player.gameMinutes + maxIncrease
    );

    await ctx.db.patch(player._id, {
      position: { theta: args.theta, phi: args.phi },
      gameMinutes: clampedGameMinutes,
      lastSeenAt: now,
    });

    return {
      position: { theta: args.theta, phi: args.phi },
      gameMinutes: clampedGameMinutes,
    };
  },
});
