import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getPlayer } from "./lib/player";

export const harvest = mutation({
  args: {
    guestToken: v.string(),
    nodeKey: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);

    // 1. Look up the resource node
    const node = await ctx.db
      .query("resourceNodes")
      .withIndex("by_key", (q) => q.eq("key", args.nodeKey))
      .unique();

    if (!node) {
      throw new Error("NODE_NOT_FOUND");
    }

    // 2. District unlock check
    const requiredDistrictUnlock = `district:${node.district}`;
    if (!player.unlocks.includes(requiredDistrictUnlock)) {
      throw new Error("DISTRICT_LOCKED");
    }

    // 3. Distance check: angular distance on unit sphere
    // Angular distance = acos(sin(phi1)*sin(phi2)*cos(theta1-theta2) + cos(phi1)*cos(phi2))
    const pTheta = player.position.theta;
    const pPhi = player.position.phi;
    const nTheta = node.theta;
    const nPhi = node.phi;

    const cosAngularDist =
      Math.sin(pPhi) * Math.sin(nPhi) * Math.cos(pTheta - nTheta) +
      Math.cos(pPhi) * Math.cos(nPhi);
    const angularDist = Math.acos(Math.min(1, Math.max(-1, cosAngularDist)));

    // Tolerance: 0.18 rad (covers ~2.8m on a 17.5m radius planet)
    if (angularDist > 0.18) {
      throw new Error("TOO_FAR");
    }

    // 4. Material and Respawn check
    const material = await ctx.db
      .query("materials")
      .withIndex("by_key", (q) => q.eq("key", node.materialKey))
      .unique();

    if (!material) {
      throw new Error("MATERIAL_NOT_FOUND");
    }

    const now = Date.now();
    const existingHarvest = await ctx.db
      .query("nodeHarvests")
      .withIndex("by_player_node", (q) =>
        q.eq("playerId", player._id).eq("nodeKey", node.key)
      )
      .unique();

    const respawnMs = material.respawnMinutes * 60 * 1000;
    if (existingHarvest && now - existingHarvest.harvestedAt < respawnMs) {
      throw new Error("NODE_DEPLETED");
    }

    // 5. Compute yield (check companion pet ability bonus)
    let yieldAmount = node.yield;
    if (player.activePetKey) {
      const activePet = await ctx.db
        .query("pets")
        .withIndex("by_key", (q) => q.eq("key", player.activePetKey!))
        .unique();

      if (activePet) {
        // e.g., Hoots gives +1 Sakura Petal, Dewey gives +1 Pearl, Rocky gives +1 Chrome, Seedy gives +1 Daisy
        if (
          (activePet.key === "hoots" && material.key === "sakura_petal") ||
          (activePet.key === "dewey" && material.key === "freshwater_pearl") ||
          (activePet.key === "rocky" && material.key === "chrome_drop") ||
          (activePet.key === "seedy" && material.key === "daisy_sprig")
        ) {
          yieldAmount += 1;
        }
      }
    }

    // 6. Update inventory (upsert inventory record)
    const existingInventory = await ctx.db
      .query("inventory")
      .withIndex("by_player_item", (q) =>
        q
          .eq("playerId", player._id)
          .eq("itemType", "material")
          .eq("itemKey", material.key)
      )
      .unique();

    if (existingInventory) {
      await ctx.db.patch(existingInventory._id, {
        qty: existingInventory.qty + yieldAmount,
      });
    } else {
      await ctx.db.insert("inventory", {
        playerId: player._id,
        itemType: "material",
        itemKey: material.key,
        qty: yieldAmount,
      });
    }

    // 7. Upsert nodeHarvests record
    if (existingHarvest) {
      await ctx.db.patch(existingHarvest._id, {
        harvestedAt: now,
      });
    } else {
      await ctx.db.insert("nodeHarvests", {
        playerId: player._id,
        nodeKey: node.key,
        harvestedAt: now,
      });
    }

    return {
      success: true,
      materialKey: material.key,
      materialName: material.name,
      materialNameKo: material.nameKo,
      qty: yieldAmount,
      nextReadyAt: now + respawnMs,
    };
  },
});

export const nodeStates = query({
  args: {
    guestToken: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await getPlayer(ctx, args.guestToken);
    const harvests = await ctx.db
      .query("nodeHarvests")
      .withIndex("by_player_node", (q) => q.eq("playerId", player._id))
      .collect();

    // Map each harvest to readyAt time
    const result: Array<{ nodeKey: string; readyAt: number }> = [];
    for (const h of harvests) {
      const node = await ctx.db
        .query("resourceNodes")
        .withIndex("by_key", (q) => q.eq("key", h.nodeKey))
        .unique();

      if (!node) continue;
      const mat = await ctx.db
        .query("materials")
        .withIndex("by_key", (q) => q.eq("key", node.materialKey))
        .unique();

      const respawnMs = (mat?.respawnMinutes ?? 5) * 60 * 1000;
      result.push({
        nodeKey: h.nodeKey,
        readyAt: h.harvestedAt + respawnMs,
      });
    }

    return result;
  },
});
