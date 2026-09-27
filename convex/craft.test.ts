/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("Crafting mutations", () => {
  it("crafts a charm when materials are sufficient", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-craft-test";
    // Bootstrap: player starts with 2 silk_ribbon
    await t.mutation(api.players.bootstrap, { guestToken: token });

    // Ribbon bow requires: 2 silk_ribbon + 1 sakura_petal
    // Let's harvest 1 sakura petal node (first position near canal sakura node)
    await t.mutation(api.players.savePosition, {
      guestToken: token,
      theta: 0.86,
      phi: 0.86,
      gameMinutes: 490,
    });
    await t.mutation(api.gather.harvest, {
      guestToken: token,
      nodeKey: "node_canal_sakura_1",
    });

    // Now player has >= 1 sakura petal and 2 silk ribbon
    const craftRes = await t.mutation(api.craft.craftCharm, {
      guestToken: token,
      charmKey: "ribbon_bow",
    });

    expect(craftRes.success).toBe(true);
    expect(craftRes.charmKey).toBe("ribbon_bow");

    // Check inventory state
    const state = await t.query(api.players.state, { guestToken: token });
    const craftedCharm = state.inventory.find(
      (i) => i.itemType === "charm" && i.itemKey === "ribbon_bow"
    );
    expect(craftedCharm).toBeDefined();
    expect(craftedCharm?.qty).toBe(1);

    // Verify silk ribbon was consumed
    const silkRibbon = state.inventory.find(
      (i) => i.itemType === "material" && i.itemKey === "silk_ribbon"
    );
    expect(silkRibbon?.qty).toBe(0);
  });

  it("rejects crafting when materials are missing", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-no-mat-test";
    await t.mutation(api.players.bootstrap, { guestToken: token });

    // Player does not have 3 freshwater_pearl for baroque_pearl
    await expect(
      t.mutation(api.craft.craftCharm, {
        guestToken: token,
        charmKey: "baroque_pearl",
      })
    ).rejects.toThrow("NOT_ENOUGH_MATERIALS");
  });

  it("rejects crafting when level is too low", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-low-level-test";
    await t.mutation(api.players.bootstrap, { guestToken: token });

    // molten_chrome_drops requires Level 5, player is Level 1
    await expect(
      t.mutation(api.craft.craftCharm, {
        guestToken: token,
        charmKey: "molten_chrome_drops",
      })
    ).rejects.toThrow("LEVEL_TOO_LOW");
  });
});
