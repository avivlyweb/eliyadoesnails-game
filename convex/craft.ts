import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getPlayer } from "./lib/player";

export const craftCharm = mutation({
  args: {
    guestToken: v.string(),
    charmKey: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);

    // 1. Look up charm definition
    const charm = await ctx.db
      .query("charms")
      .withIndex("by_key", (q) => q.eq("key", args.charmKey))
      .unique();

    if (!charm) {
      throw new Error("CHARM_NOT_FOUND");
    }

    // 2. Level requirement check
    if (player.level < charm.unlockLevel) {
      throw new Error("LEVEL_TOO_LOW");
    }

    // 3. Verify player has all required materials
    const inventoryUpdates: Array<{ id: any; remaining: number }> = [];

    for (const ingredient of charm.recipe) {
      const inv = await ctx.db
        .query("inventory")
        .withIndex("by_player_item", (q) =>
          q
            .eq("playerId", player._id)
            .eq("itemType", "material")
            .eq("itemKey", ingredient.materialKey)
        )
        .unique();

      if (!inv || inv.qty < ingredient.qty) {
        throw new Error("NOT_ENOUGH_MATERIALS");
      }

      inventoryUpdates.push({
        id: inv._id,
        remaining: inv.qty - ingredient.qty,
      });
    }

    // 4. Deduct materials from inventory
    for (const update of inventoryUpdates) {
      await ctx.db.patch(update.id, {
        qty: update.remaining,
      });
    }

    // 5. Add or increment crafted charm
    const existingCharm = await ctx.db
      .query("inventory")
      .withIndex("by_player_item", (q) =>
        q
          .eq("playerId", player._id)
          .eq("itemType", "charm")
          .eq("itemKey", charm.key)
      )
      .unique();

    if (existingCharm) {
      await ctx.db.patch(existingCharm._id, {
        qty: existingCharm.qty + 1,
      });
    } else {
      await ctx.db.insert("inventory", {
        playerId: player._id,
        itemType: "charm",
        itemKey: charm.key,
        qty: 1,
      });
    }

    return {
      success: true,
      charmKey: charm.key,
      charmName: charm.name,
    };
  },
});
