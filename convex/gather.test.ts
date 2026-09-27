/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("Gather / Harvest mutations", () => {
  it("harvests a node when within range and district unlocked", async () => {
    const t = convexTest(schema, modules);

    // 1. Seed the database
    await t.mutation(internal.seed.run, {});

    // 2. Bootstrap player (starts with district:canal unlocked)
    const token = "guest-gather-test";
    const initial = await t.mutation(api.players.bootstrap, { guestToken: token });
    expect(initial.player.unlocks).toContain("district:canal");

    // 3. Move player close to canal sakura petal node (node_canal_sakura_1: theta 0.86, phi 0.86)
    await t.mutation(api.players.savePosition, {
      guestToken: token,
      theta: 0.86,
      phi: 0.86,
      gameMinutes: 490,
    });

    // 4. Harvest the node
    const result = await t.mutation(api.gather.harvest, {
      guestToken: token,
      nodeKey: "node_canal_sakura_1",
    });

    expect(result.success).toBe(true);
    expect(result.materialKey).toBe("sakura_petal");
    expect(result.qty).toBeGreaterThanOrEqual(1);

    // 5. Query nodeStates and verify nextReadyAt
    const states = await t.query(api.gather.nodeStates, { guestToken: token });
    expect(states.length).toBe(1);
    expect(states[0].nodeKey).toBe("node_canal_sakura_1");

    // 6. Attempting to harvest again immediately must fail with NODE_DEPLETED
    await expect(
      t.mutation(api.gather.harvest, {
        guestToken: token,
        nodeKey: "node_canal_sakura_1",
      })
    ).rejects.toThrow("NODE_DEPLETED");
  });

  it("rejects harvest when player is too far away", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-far-test";
    await t.mutation(api.players.bootstrap, { guestToken: token });

    // Move player far away on opposite side of the planet (theta 3.5, phi 1.5)
    await t.mutation(api.players.savePosition, {
      guestToken: token,
      theta: 3.5,
      phi: 1.5,
      gameMinutes: 500,
    });

    // Attempt harvest of canal node
    await expect(
      t.mutation(api.gather.harvest, {
        guestToken: token,
        nodeKey: "node_canal_sakura_1",
      })
    ).rejects.toThrow("TOO_FAR");
  });

  it("rejects harvest when district is locked", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-locked-district-test";
    await t.mutation(api.players.bootstrap, { guestToken: token });

    // Player is level 1, so district:windmill (level 5) is locked
    // Move player right to the windmill chrome node coords
    await t.mutation(api.players.savePosition, {
      guestToken: token,
      theta: 4.65,
      phi: 0.84,
      gameMinutes: 500,
    });

    // Attempt harvest of windmill node
    await expect(
      t.mutation(api.gather.harvest, {
        guestToken: token,
        nodeKey: "node_windmill_chrome_1",
      })
    ).rejects.toThrow("DISTRICT_LOCKED");
  });
});
