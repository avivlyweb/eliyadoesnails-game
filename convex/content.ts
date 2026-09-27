import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const [
      materials,
      resourceNodes,
      charms,
      shades,
      artStyles,
      looks,
      tools,
      decor,
      pets,
      npcs,
      questTemplates,
      levels,
      districts,
    ] = await Promise.all([
      ctx.db.query("materials").collect(),
      ctx.db.query("resourceNodes").collect(),
      ctx.db.query("charms").collect(),
      ctx.db.query("shades").collect(),
      ctx.db.query("artStyles").collect(),
      ctx.db.query("looks").collect(),
      ctx.db.query("tools").collect(),
      ctx.db.query("decor").collect(),
      ctx.db.query("pets").collect(),
      ctx.db.query("npcs").collect(),
      ctx.db.query("questTemplates").collect(),
      ctx.db.query("levels").collect(),
      ctx.db.query("districts").collect(),
    ]);

    return {
      materials,
      resourceNodes,
      charms,
      shades,
      artStyles,
      looks,
      tools,
      decor,
      pets,
      npcs,
      questTemplates,
      levels,
      districts,
    };
  },
});

export const getDialogue = query({
  args: {
    npcKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dialogue")
      .withIndex("by_npc_trigger", (q) => q.eq("npcKey", args.npcKey))
      .collect();
  },
});
