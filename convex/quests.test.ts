/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("Quests v2 and Delivery mutations", () => {
  it("queries the order board, accepts a quest, crafts, and delivers with level-up", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-quest-test";
    const init = await t.mutation(api.players.bootstrap, { guestToken: token });
    expect(init.player.level).toBe(1);
    expect(init.player.xp).toBe(0);

    // 1. Check board for Mira
    const board = await t.query(api.quests.board, {
      guestToken: token,
      npcKey: "mira",
    });
    expect(board.length).toBeGreaterThanOrEqual(1);
    const tutorialQuest = board.find((q) => q.templateKey === "quest_mira_1");
    expect(tutorialQuest).toBeDefined();
    expect(tutorialQuest?.status).toBe("offered");

    // 2. Accept quest
    const acceptRes = await t.mutation(api.quests.accept, {
      guestToken: token,
      questId: tutorialQuest!._id,
    });
    expect(acceptRes.success).toBe(true);

    // 3. Craft the design in studio
    // Tutorial quest requires cherry_blossom_french (needs 1 ribbon_bow charm)
    // Add ribbon_bow charm to player's inventory
    const p = await t.query(api.players.state, { guestToken: token });
    // Start design
    // Player needs a ribbon bow charm in inventory for cherry_blossom_french
    // First, let's harvest 1 sakura petal and craft ribbon bow
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
    await t.mutation(api.craft.craftCharm, {
      guestToken: token,
      charmKey: "ribbon_bow",
    });

    const startRes = await t.mutation(api.studio.startDesign, {
      guestToken: token,
      questId: tutorialQuest!._id,
    });
    expect(startRes.success).toBe(true);

    // Finish design with high scores
    const finishRes = await t.mutation(api.studio.finishDesign, {
      guestToken: token,
      questId: tutorialQuest!._id,
      designId: startRes.designId,
      scores: { base: 95, art: 90, finish: 92 },
    });
    expect(finishRes.stars).toBe(3);

    // 4. Position player close to Mira (mira is at canal: homeTheta 0.80, homePhi 0.80)
    await t.mutation(api.players.savePosition, {
      guestToken: token,
      theta: 0.80,
      phi: 0.80,
      gameMinutes: 510,
    });

    // 5. Deliver quest
    const deliverRes = await t.mutation(api.quests.deliver, {
      guestToken: token,
      questId: tutorialQuest!._id,
    });

    expect(deliverRes.success).toBe(true);
    expect(deliverRes.rewards.gloss).toBeGreaterThanOrEqual(40);
    expect(deliverRes.dialogueTrigger).toBe("deliver_3");
    // Tutorial delivery gives 100 XP * 1.5 (3 stars) = 150 XP. Level 1 xpToNext is 100 XP -> Leveled up to Lv 2!
    expect(deliverRes.levelUps).toContain(2);

    // 6. Verify player state after delivery: Level 2 reached, Market Square unlocked!
    const updatedState = await t.query(api.players.state, { guestToken: token });
    expect(updatedState.player.level).toBe(2);
    expect(updatedState.player.unlocks).toContain("district:market");

    // 7. Verify next quest offered for Mira (quest_mira_2)
    const nextBoard = await t.query(api.quests.board, {
      guestToken: token,
      npcKey: "mira",
    });
    const nextQuest = nextBoard.find((q) => q.templateKey === "quest_mira_2");
    expect(nextQuest).toBeDefined();
    expect(nextQuest?.status).toBe("offered");
  });

  it("rejects delivery when player is too far from NPC", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.run, {});

    const token = "guest-far-deliver-test";
    await t.mutation(api.players.bootstrap, { guestToken: token });

    const board = await t.query(api.quests.board, { guestToken: token, npcKey: "mira" });
    const quest = board[0];
    await t.mutation(api.quests.accept, { guestToken: token, questId: quest._id });

    // Craft charm & finish design
    await t.mutation(api.players.savePosition, { guestToken: token, theta: 0.86, phi: 0.86, gameMinutes: 490 });
    await t.mutation(api.gather.harvest, { guestToken: token, nodeKey: "node_canal_sakura_1" });
    await t.mutation(api.craft.craftCharm, { guestToken: token, charmKey: "ribbon_bow" });
    const design = await t.mutation(api.studio.startDesign, { guestToken: token, questId: quest._id });
    await t.mutation(api.studio.finishDesign, {
      guestToken: token,
      questId: quest._id,
      designId: design.designId,
      scores: { base: 80, art: 80, finish: 80 },
    });

    // Move player far away (theta 4.5, phi 1.2)
    await t.mutation(api.players.savePosition, { guestToken: token, theta: 4.5, phi: 1.2, gameMinutes: 500 });

    await expect(
      t.mutation(api.quests.deliver, { guestToken: token, questId: quest._id })
    ).rejects.toThrow("TOO_FAR_FROM_CLIENT");
  });
});
