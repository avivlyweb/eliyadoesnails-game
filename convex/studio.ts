import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getPlayer } from "./lib/player";

export const startDesign = mutation({
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

    if (quest.status !== "active") {
      throw new Error("QUEST_NOT_ACTIVE");
    }

    const template = await ctx.db
      .query("questTemplates")
      .withIndex("by_key", (q) => q.eq("key", quest.templateKey))
      .unique();

    if (!template) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }

    const look = await ctx.db
      .query("looks")
      .withIndex("by_key", (q) => q.eq("key", template.lookKey))
      .unique();

    if (!look) {
      throw new Error("LOOK_NOT_FOUND");
    }

    // Check player owns charm if needed
    if (look.charmKey) {
      const charmInv = await ctx.db
        .query("inventory")
        .withIndex("by_player_item", (q) =>
          q
            .eq("playerId", player._id)
            .eq("itemType", "charm")
            .eq("itemKey", look.charmKey!)
        )
        .unique();

      if (!charmInv || charmInv.qty < 1) {
        throw new Error("CHARM_MISSING");
      }
    }

    const now = Date.now();
    const designId = await ctx.db.insert("designs", {
      playerId: player._id,
      lookKey: look.key,
      shadeKey: look.shadeKey,
      artStyleKey: look.artStyleKey,
      charmKey: look.charmKey,
      scores: { base: 0, art: 0, finish: 0 },
      stars: 0,
      createdAt: now,
      minigameStartedAt: now,
    });

    return {
      success: true,
      designId,
      look,
    };
  },
});

export const finishDesign = mutation({
  args: {
    guestToken: v.string(),
    questId: v.id("quests"),
    designId: v.id("designs"),
    scores: v.object({
      base: v.number(),
      art: v.number(),
      finish: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);
    const design = await ctx.db.get(args.designId);
    const quest = await ctx.db.get(args.questId);

    if (!design || design.playerId !== player._id) {
      throw new Error("DESIGN_NOT_FOUND");
    }

    if (!quest || quest.playerId !== player._id) {
      throw new Error("QUEST_NOT_FOUND");
    }

    // Clamp scores
    const base = Math.min(100, Math.max(0, args.scores.base));
    const art = Math.min(100, Math.max(0, args.scores.art));
    const finish = Math.min(100, Math.max(0, args.scores.finish));

    const avg = (base + art + finish) / 3;
    const stars = avg >= 85 ? 3 : avg >= 60 ? 2 : 1;

    // Update design record
    await ctx.db.patch(design._id, {
      scores: { base, art, finish },
      stars,
    });

    // Deduct charm from inventory if required
    if (design.charmKey) {
      const charmInv = await ctx.db
        .query("inventory")
        .withIndex("by_player_item", (q) =>
          q
            .eq("playerId", player._id)
            .eq("itemType", "charm")
            .eq("itemKey", design.charmKey!)
        )
        .unique();

      if (charmInv && charmInv.qty > 0) {
        await ctx.db.patch(charmInv._id, {
          qty: charmInv.qty - 1,
        });
      }
    }

    // Update quest status to crafted
    await ctx.db.patch(quest._id, {
      status: "crafted",
      designId: design._id,
      stars,
    });

    return {
      success: true,
      stars,
      averageScore: Math.round(avg),
    };
  },
});
