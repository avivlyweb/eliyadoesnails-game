import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCompanionState = query({
  args: { companionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companionState")
      .withIndex("by_companion_id", (q) => q.eq("companionId", args.companionId))
      .first();
  },
});

export const updateCompanion = mutation({
  args: {
    companionId: v.string(),
    happinessDelta: v.number(),
    addCharm: v.optional(v.string()),
    incrementDeliveries: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("companionState")
      .withIndex("by_companion_id", (q) => q.eq("companionId", args.companionId))
      .first();

    const now = Date.now();
    if (!existing) {
      const initialCharms = args.addCharm ? [args.addCharm] : ["Rose Satin Ribbon"];
      return await ctx.db.insert("companionState", {
        companionId: args.companionId,
        name: "Gomi (고미)",
        happiness: Math.min(100, Math.max(10, 80 + args.happinessDelta)),
        level: 1,
        collectedCharms: initialCharms,
        totalDelivered: args.incrementDeliveries ? 1 : 0,
        lastInteracted: now,
      });
    }

    const newHappiness = Math.min(100, Math.max(10, existing.happiness + args.happinessDelta));
    const newCharms = args.addCharm && !existing.collectedCharms.includes(args.addCharm)
      ? [...existing.collectedCharms, args.addCharm]
      : existing.collectedCharms;
    const newDeliveries = args.incrementDeliveries ? existing.totalDelivered + 1 : existing.totalDelivered;
    const newLevel = Math.max(1, Math.floor(newDeliveries / 2) + 1);

    await ctx.db.patch(existing._id, {
      happiness: newHappiness,
      level: newLevel,
      collectedCharms: newCharms,
      totalDelivered: newDeliveries,
      lastInteracted: now,
    });

    return { happiness: newHappiness, level: newLevel, totalDelivered: newDeliveries };
  },
});

export const recordDelivery = mutation({
  args: {
    clientId: v.string(),
    clientName: v.string(),
    setDesignName: v.string(),
    requestedCharm: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clientDeliveries", {
      clientId: args.clientId,
      clientName: args.clientName,
      setDesignName: args.setDesignName,
      requestedCharm: args.requestedCharm,
      deliveredAt: Date.now(),
    });
  },
});

export const getRecentDeliveries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clientDeliveries")
      .withIndex("by_delivered_at")
      .order("desc")
      .take(10);
  },
});
