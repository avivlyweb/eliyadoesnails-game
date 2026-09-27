/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("players", () => {
  it("bootstraps a new player with starter items, level 1, and offered quest", async () => {
    const t = convexTest(schema, modules);
    // Seed levels first
    await t.mutation(internal.seed.run, {});

    const guestToken = "test-guest-token-1";
    const res = await t.mutation(api.players.bootstrap, {
      guestToken,
      name: "Eliya Tester",
    });

    expect(res.player).toBeDefined();
    expect(res.player.guestToken).toBe(guestToken);
    expect(res.player.name).toBe("Eliya Tester");
    expect(res.player.level).toBe(1);
    expect(res.player.gloss).toBe(50);
    expect(res.player.xp).toBe(0);

    // Starter inventory: 3 shades, 2 tools, 1 material (qty 2)
    expect(res.inventory.length).toBe(6);
    const itemKeys = res.inventory.map((i) => i.itemKey).sort();
    expect(itemKeys).toEqual([
      "apricot_peach",
      "cherry_blossom",
      "czech_glass_file",
      "micro_liner_brush",
      "rose_quartz",
      "silk_ribbon",
    ]);

    // Check silk ribbon qty = 2
    const ribbon = res.inventory.find((i) => i.itemKey === "silk_ribbon");
    expect(ribbon?.qty).toBe(2);

    // Quest offered
    expect(res.quests.length).toBe(1);
    expect(res.quests[0].templateKey).toBe("quest_mira_1");
    expect(res.quests[0].status).toBe("offered");

    // Calling bootstrap again should not duplicate
    const res2 = await t.mutation(api.players.bootstrap, { guestToken });
    expect(res2.player._id).toBe(res.player._id);
    expect(res2.inventory.length).toBe(6);
  });

  it("queries player state via state query", async () => {
    const t = convexTest(schema, modules);
    const guestToken = "test-guest-token-state";
    const initial = await t.query(api.players.state, { guestToken });
    expect(initial).toBeNull();

    await t.mutation(api.players.bootstrap, { guestToken });
    const loaded = await t.query(api.players.state, { guestToken });
    expect(loaded).not.toBeNull();
    expect(loaded?.player.guestToken).toBe(guestToken);
  });

  it("saves player position and clamps gameMinutes correctly", async () => {
    const t = convexTest(schema, modules);
    const guestToken = "test-guest-token-pos";
    await t.mutation(api.players.bootstrap, { guestToken });

    // Initial position was (0.8, 0.8), gameMinutes 480
    const update1 = await t.mutation(api.players.savePosition, {
      guestToken,
      theta: 1.2,
      phi: 0.9,
      gameMinutes: 482,
    });

    expect(update1.position.theta).toBe(1.2);
    expect(update1.position.phi).toBe(0.9);
    expect(update1.gameMinutes).toBe(482);

    // Clock cannot decrease
    const update2 = await t.mutation(api.players.savePosition, {
      guestToken,
      theta: 1.3,
      phi: 0.95,
      gameMinutes: 400, // tried to decrease
    });
    expect(update2.gameMinutes).toBe(482);

    // Clock cannot jump forward unreasonably
    const update3 = await t.mutation(api.players.savePosition, {
      guestToken,
      theta: 1.4,
      phi: 1.0,
      gameMinutes: 99999, // huge jump
    });
    // Should be clamped to roughly 482 + maxIncrease
    expect(update3.gameMinutes).toBeLessThan(500);
  });
});
