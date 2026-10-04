import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getPlayer } from "./lib/player";

export const buyItem = mutation({
  args: {
    guestToken: v.string(),
    itemType: v.union(v.literal("shade"), v.literal("tool"), v.literal("decor")),
    itemKey: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);

    let price = 0;
    let unlockLevel = 1;
    let itemName = args.itemKey;

    if (args.itemType === "shade") {
      const shade = await ctx.db
        .query("shades")
        .withIndex("by_key", (q) => q.eq("key", args.itemKey))
        .unique();
      if (!shade) throw new Error("SHADE_NOT_FOUND");
      price = shade.price;
      unlockLevel = shade.unlockLevel;
      itemName = shade.name;
    } else if (args.itemType === "tool") {
      const tool = await ctx.db
        .query("tools")
        .withIndex("by_key", (q) => q.eq("key", args.itemKey))
        .unique();
      if (!tool) throw new Error("TOOL_NOT_FOUND");
      price = tool.price;
      unlockLevel = tool.unlockLevel;
      itemName = tool.name;
    } else if (args.itemType === "decor") {
      const decor = await ctx.db
        .query("decor")
        .withIndex("by_key", (q) => q.eq("key", args.itemKey))
        .unique();
      if (!decor) throw new Error("DECOR_NOT_FOUND");
      price = decor.price;
      unlockLevel = decor.unlockLevel;
      itemName = decor.name;
    }

    if (player.level < unlockLevel) {
      throw new Error("LEVEL_TOO_LOW");
    }

    // Check if player already owns this item
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_player_item", (q) =>
        q
          .eq("playerId", player._id)
          .eq("itemType", args.itemType)
          .eq("itemKey", args.itemKey)
      )
      .unique();

    if (existing && existing.qty > 0) {
      throw new Error("ALREADY_OWNED");
    }

    // Discount if player has pearl-crab (or legacy null-signal) pet active
    if (player.activePetKey === "pearl-crab" || player.activePetKey === "null-signal") {
      price = Math.round(price * 0.9);
    }

    if (player.gloss < price) {
      throw new Error("NOT_ENOUGH_GLOSS");
    }

    // Deduct gloss
    await ctx.db.patch(player._id, {
      gloss: player.gloss - price,
    });

    // Add to inventory
    await ctx.db.insert("inventory", {
      playerId: player._id,
      itemType: args.itemType,
      itemKey: args.itemKey,
      qty: 1,
    });

    return {
      success: true,
      itemKey: args.itemKey,
      itemName,
      cost: price,
      newGloss: player.gloss - price,
    };
  },
});

export const sellMaterial = mutation({
  args: {
    guestToken: v.string(),
    materialKey: v.string(),
    qty: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.qty <= 0) throw new Error("INVALID_QTY");

    const player = await getPlayer(ctx, args.guestToken);

    const material = await ctx.db
      .query("materials")
      .withIndex("by_key", (q) => q.eq("key", args.materialKey))
      .unique();

    if (!material) throw new Error("MATERIAL_NOT_FOUND");

    const inv = await ctx.db
      .query("inventory")
      .withIndex("by_player_item", (q) =>
        q
          .eq("playerId", player._id)
          .eq("itemType", "material")
          .eq("itemKey", args.materialKey)
      )
      .unique();

    if (!inv || inv.qty < args.qty) {
      throw new Error("NOT_ENOUGH_MATERIAL");
    }

    const payout = material.sellPrice * args.qty;

    if (inv.qty === args.qty) {
      await ctx.db.delete(inv._id);
    } else {
      await ctx.db.patch(inv._id, {
        qty: inv.qty - args.qty,
      });
    }

    await ctx.db.patch(player._id, {
      gloss: player.gloss + payout,
    });

    return {
      success: true,
      materialKey: args.materialKey,
      soldQty: args.qty,
      payout,
      newGloss: player.gloss + payout,
    };
  },
});

export const setActivePet = mutation({
  args: {
    guestToken: v.string(),
    petKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);

    let targetPetKey = args.petKey;
    if (targetPetKey === "codex") targetPetKey = "matcha-moth";
    if (targetPetKey === "null-signal") targetPetKey = "pearl-crab";

    if (targetPetKey) {
      const pet = await ctx.db
        .query("pets")
        .withIndex("by_key", (q) => q.eq("key", targetPetKey!))
        .unique();

      if (!pet) throw new Error("PET_NOT_FOUND");

      // Verify friendship prerequisite
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_player_npc", (q) =>
          q.eq("playerId", player._id).eq("npcKey", pet.unlockNpcKey)
        )
        .unique();

      const currentFriendLevel = friendship?.level ?? 0;
      if (currentFriendLevel < pet.unlockFriendship) {
        throw new Error("PET_LOCKED");
      }
    }

    await ctx.db.patch(player._id, {
      activePetKey: targetPetKey,
    });

    return {
      success: true,
      activePetKey: targetPetKey,
    };
  },
});

export const migratePetKeys = mutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    let migratedCount = 0;
    for (const player of players) {
      if (player.activePetKey === "codex") {
        await ctx.db.patch(player._id, { activePetKey: "matcha-moth" });
        migratedCount++;
      } else if (player.activePetKey === "null-signal") {
        await ctx.db.patch(player._id, { activePetKey: "pearl-crab" });
        migratedCount++;
      }
    }
    return { success: true, migratedCount };
  },
});
