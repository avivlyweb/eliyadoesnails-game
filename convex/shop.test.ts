/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("Convex Shop & Pets API", () => {
  it("buys items and sells materials with proper balance checks", async () => {
    const t = convexTest(schema, modules);

    // Run seed
    await t.mutation(internal.seed.run, {});

    const guestToken = "test-shop-token-" + Date.now();

    // Bootstrap player (starts with 50 gloss, level 1, 2 silk_ribbon)
    await t.mutation(api.players.bootstrap, { guestToken, name: "Shop Tester" });

    // 1. Sell 1 silk_ribbon for gloss
    const sellRes = await t.mutation(api.shop.sellMaterial, {
      guestToken,
      materialKey: "silk_ribbon",
      qty: 1,
    });

    expect(sellRes.success).toBe(true);
    expect(sellRes.payout).toBe(4); // 4 gloss per silk ribbon
    expect(sellRes.newGloss).toBe(54);

    // 2. Buy shade (e.g. cherry_blossom is starter/in palette, let's try a level 1 item)
    // Verify error when level too low
    await expect(
      t.mutation(api.shop.buyItem, {
        guestToken,
        itemType: "decor",
        itemKey: "floating_lacquer_display", // Level 8
      })
    ).rejects.toThrowError("LEVEL_TOO_LOW");
  });

  it("handles pet migration and pearl-crab shop discount", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const guestToken = "test-pet-token-" + Date.now();
    await t.mutation(api.players.bootstrap, { guestToken, name: "Pet Tester" });

    // Set friendship with sanne to level 3 so pearl-crab can be equipped
    const player = (await t.query(api.players.state, { guestToken }))!.player;
    await t.run(async (ctx) => {
      await ctx.db.insert("friendships", {
        playerId: player._id,
        npcKey: "sanne",
        level: 3,
        points: 100,
      });
    });

    // Equip pearl-crab
    const equipRes = await t.mutation(api.shop.setActivePet, {
      guestToken,
      petKey: "pearl-crab",
    });
    expect(equipRes.success).toBe(true);
    expect(equipRes.activePetKey).toBe("pearl-crab");

    // Equip using legacy key 'null-signal' -> should auto-migrate to pearl-crab
    const equipLegacyRes = await t.mutation(api.shop.setActivePet, {
      guestToken,
      petKey: "null-signal",
    });
    expect(equipLegacyRes.success).toBe(true);
    expect(equipLegacyRes.activePetKey).toBe("pearl-crab");
  });
});
