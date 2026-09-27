import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getPlayer } from "./lib/player";

export const board = query({
  args: {
    guestToken: v.string(),
    npcKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);

    // Query active/offered/crafted quests for player
    let questsQuery = ctx.db
      .query("quests")
      .withIndex("by_player_status", (q) => q.eq("playerId", player._id));

    const allPlayerQuests = await ctx.db
      .query("quests")
      .filter((q) => q.eq(q.field("playerId"), player._id))
      .collect();

    const activeOrOffered = allPlayerQuests.filter(
      (q) =>
        (q.status === "offered" || q.status === "active" || q.status === "crafted") &&
        (!args.npcKey || q.npcKey === args.npcKey)
    );

    // Attach template and look details
    const result = [];
    for (const q of activeOrOffered) {
      const template = await ctx.db
        .query("questTemplates")
        .withIndex("by_key", (query) => query.eq("key", q.templateKey))
        .unique();

      let look = null;
      if (template) {
        look = await ctx.db
          .query("looks")
          .withIndex("by_key", (query) => query.eq("key", template.lookKey))
          .unique();
      }

      result.push({
        ...q,
        template,
        look,
      });
    }

    return result;
  },
});

export const accept = mutation({
  args: {
    guestToken: v.string(),
    questId: v.id("quests"),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);
    const quest = await ctx.db.get(args.questId);

    if (!quest || quest.playerId !== player._id) {
      throw new Error("QUEST_NOT_FOUND");
    }

    if (quest.status !== "offered") {
      throw new Error("QUEST_ALREADY_ACCEPTED");
    }

    const template = await ctx.db
      .query("questTemplates")
      .withIndex("by_key", (q) => q.eq("key", quest.templateKey))
      .unique();

    const deadlineGameMinutes = template?.deadlineGameHours
      ? player.gameMinutes + template.deadlineGameHours * 60
      : undefined;

    await ctx.db.patch(quest._id, {
      status: "active",
      acceptedAt: Date.now(),
      deadlineGameMinutes,
    });

    return {
      success: true,
      questId: quest._id,
      deadlineGameMinutes,
    };
  },
});

export const deliver = mutation({
  args: {
    guestToken: v.string(),
    questId: v.id("quests"),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);
    const quest = await ctx.db.get(args.questId);

    if (!quest || quest.playerId !== player._id) {
      throw new Error("QUEST_NOT_FOUND");
    }

    if (quest.status !== "crafted" && quest.status !== "active") {
      throw new Error("QUEST_NOT_READY_FOR_DELIVERY");
    }

    // 1. NPC Distance check
    const npc = await ctx.db
      .query("npcs")
      .withIndex("by_key", (q) => q.eq("key", quest.npcKey))
      .unique();

    if (npc) {
      const pTheta = player.position.theta;
      const pPhi = player.position.phi;
      const nTheta = npc.homeTheta;
      const nPhi = npc.homePhi;

      const cosAngularDist =
        Math.sin(pPhi) * Math.sin(nPhi) * Math.cos(pTheta - nTheta) +
        Math.cos(pPhi) * Math.cos(nPhi);
      const angularDist = Math.acos(Math.min(1, Math.max(-1, cosAngularDist)));

      if (angularDist > 0.22) {
        throw new Error("TOO_FAR_FROM_CLIENT");
      }
    }

    // 2. Deadline and reward calculation
    const isLate =
      quest.deadlineGameMinutes !== undefined &&
      player.gameMinutes > quest.deadlineGameMinutes;

    const stars = quest.stars ?? 2;
    const starMultiplier = isLate ? 0.5 : 1 + 0.25 * (stars - 1);

    const template = await ctx.db
      .query("questTemplates")
      .withIndex("by_key", (q) => q.eq("key", quest.templateKey))
      .unique();

    const baseGloss = template?.rewardGloss ?? 50;
    const baseXp = template?.rewardXp ?? 100;
    const baseFriendship = template?.rewardFriendship ?? 15;

    const glossReward = Math.round(baseGloss * starMultiplier);
    const xpReward = Math.round(baseXp * starMultiplier);
    const friendshipReward = baseFriendship;

    // 3. Level-up progression
    let currentLevel = player.level;
    let currentXp = player.xp + xpReward;
    let currentGloss = player.gloss + glossReward;
    const newUnlocks: string[] = [];
    const levelUps: number[] = [];

    let nextLevelDef = await ctx.db
      .query("levels")
      .withIndex("by_level", (q) => q.eq("level", currentLevel))
      .unique();

    while (
      nextLevelDef &&
      nextLevelDef.xpToNext > 0 &&
      currentXp >= nextLevelDef.xpToNext
    ) {
      currentXp -= nextLevelDef.xpToNext;
      currentLevel += 1;
      levelUps.push(currentLevel);

      const leveledUpDef = await ctx.db
        .query("levels")
        .withIndex("by_level", (q) => q.eq("level", currentLevel))
        .unique();

      if (leveledUpDef) {
        for (const u of leveledUpDef.unlocks) {
          if (!player.unlocks.includes(u) && !newUnlocks.includes(u)) {
            newUnlocks.push(u);
          }
        }
      }
      nextLevelDef = leveledUpDef;
    }

    if (template?.unlocks) {
      for (const u of template.unlocks) {
        if (!player.unlocks.includes(u) && !newUnlocks.includes(u)) {
          newUnlocks.push(u);
        }
      }
    }

    const updatedUnlocks = [...player.unlocks, ...newUnlocks];
    await ctx.db.patch(player._id, {
      level: currentLevel,
      xp: currentXp,
      gloss: currentGloss,
      unlocks: updatedUnlocks,
    });

    // 4. Friendship progression (thresholds: 0, 30, 80, 150, 250, 400)
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_player_npc", (q) =>
        q.eq("playerId", player._id).eq("npcKey", quest.npcKey)
      )
      .unique();

    const fPoints = (friendship?.points ?? 0) + friendshipReward;
    const thresholds = [0, 30, 80, 150, 250, 400];
    let fLevel = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (fPoints >= thresholds[i]) {
        fLevel = i;
        break;
      }
    }

    if (friendship) {
      await ctx.db.patch(friendship._id, {
        points: fPoints,
        level: fLevel,
      });
    } else {
      await ctx.db.insert("friendships", {
        playerId: player._id,
        npcKey: quest.npcKey,
        points: fPoints,
        level: fLevel,
      });
    }

    // 5. Update delivered quest record
    await ctx.db.patch(quest._id, {
      status: "delivered",
    });

    // 6. Offer next story quest if eligible
    if (template?.kind === "story") {
      const nextStoryTemplate = await ctx.db
        .query("questTemplates")
        .withIndex("by_npc", (q) => q.eq("npcKey", quest.npcKey))
        .filter((q) => q.eq(q.field("order"), template.order + 1))
        .first();

      if (
        nextStoryTemplate &&
        currentLevel >= nextStoryTemplate.minLevel &&
        fLevel >= nextStoryTemplate.minFriendship
      ) {
        await ctx.db.insert("quests", {
          playerId: player._id,
          templateKey: nextStoryTemplate.key,
          npcKey: quest.npcKey,
          status: "offered",
        });
      }
    }

    const dialogueTrigger = isLate
      ? "late"
      : stars >= 3
      ? "deliver_3"
      : "deliver_1";

    return {
      success: true,
      rewards: {
        gloss: glossReward,
        xp: xpReward,
        friendship: friendshipReward,
      },
      levelUps,
      newUnlocks,
      dialogueTrigger,
    };
  },
});
