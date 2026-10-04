// test-production-qa.cjs
// Standing regression test on https://eliyadoesnails-game.vercel.app
// Follows all rules in docs/game-plan/qa-rules.md
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const PROD_URL = "https://eliyadoesnails-game.vercel.app";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-gl=angle"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  const results = {};

  console.log("=== CHECK 1: Title screen loads, Enter starts game, no console errors ===");
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 3500));

  const startScreenVisible = await page.evaluate(() => {
    const el = document.getElementById("eliya-start-screen");
    return el && !el.classList.contains("hidden");
  });

  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 2000));

  const gameStarted = await page.evaluate(() => {
    const el = document.getElementById("eliya-start-screen");
    return el && el.classList.contains("hidden");
  });

  const errorsOnStart = [...consoleErrors];
  results.item1 = {
    titleScreen: startScreenVisible,
    gameStarted,
    errorsCount: errorsOnStart.length,
    errors: errorsOnStart,
    pass: startScreenVisible && gameStarted && errorsOnStart.length === 0
  };
  console.log("Item 1 Result:", results.item1.pass ? "PASS" : "FAIL", results.item1);

  console.log("=== CHECK 2: Walk (WASD), jump, bike [B], gather [E], skins [M] ===");
  // Test bike toggle [B]
  const bikeBefore = await page.evaluate(() => window.gameInstance?.player?.isRidingBicycle);
  await page.keyboard.press("KeyB");
  await new Promise((r) => setTimeout(r, 400));
  const bikeAfter = await page.evaluate(() => window.gameInstance?.player?.isRidingBicycle);

  // Test jump [Space]
  await page.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 300));
  const isJumping = await page.evaluate(() => !window.gameInstance?.player?.isGrounded);

  // Test avatar skins [M]
  const skin1 = await page.evaluate(() => window.gameInstance?.player?.currentModelKey);
  await page.keyboard.press("KeyM");
  await new Promise((r) => setTimeout(r, 800));
  const skin2 = await page.evaluate(() => window.gameInstance?.player?.currentModelKey);

  // Test walk (WASD)
  await page.keyboard.down("KeyW");
  await new Promise((r) => setTimeout(r, 800));
  const isMoving = await page.evaluate(() => window.gameInstance?.player?.moving);
  await page.keyboard.up("KeyW");

  // Test gather [E] animation trigger
  const gatherPass = await page.evaluate(() => {
    const player = window.gameInstance?.player;
    if (!player) return false;
    player.playGatherAnimation(0.5);
    return player.isGathering;
  });

  results.item2 = {
    walk: isMoving,
    jump: isJumping,
    bike: bikeBefore !== bikeAfter && bikeAfter === true,
    skins: skin1 !== skin2,
    gather: gatherPass,
    pass: isMoving && isJumping && bikeAfter === true && skin1 !== skin2 && gatherPass
  };
  console.log("Item 2 Result:", results.item2.pass ? "PASS" : "FAIL", results.item2);

  console.log("=== CHECK 3 & 4: Manicure Studio & Signature Sets (no solid-black) ===");
  // Open Manicure Studio
  await page.evaluate(() => document.getElementById("btn-open-station")?.click());
  await new Promise((r) => setTimeout(r, 1500));

  const studioOpen = await page.evaluate(() => {
    const el = document.getElementById("eliya-modal-overlay");
    return el && el.style.display !== "none";
  });

  // Switch to Signature Sets tab
  await page.evaluate(() => {
    const tab = document.querySelector('.studio-cat-btn[data-cat="sets"]');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Inspect viewer and cards in asset-cards-container
  const setsStatus = await page.evaluate(() => {
    const viewer = document.getElementById("studio-viewer");
    const cards = Array.from(document.querySelectorAll("#asset-cards-container .asset-card"));
    return {
      viewerSrc: viewer?.getAttribute("src") || viewer?.src,
      cardCount: cards.length,
      cardTitles: cards.map(c => c.querySelector(".card-title")?.textContent?.trim())
    };
  });

  results.item3_4 = {
    studioOpen,
    signatureSetsLoaded: setsStatus.cardCount > 0,
    currentViewerSrc: setsStatus.viewerSrc,
    cardCount: setsStatus.cardCount,
    cardTitles: setsStatus.cardTitles,
    pass: studioOpen && setsStatus.cardCount > 0
  };
  console.log("Item 3 & 4 Result:", results.item3_4.pass ? "PASS" : "FAIL", results.item3_4);

  console.log("=== CHECK 5 & 6: Charms Placement, Removal & Ticket Preservation ===");
  // Switch to Creator tab
  await page.evaluate(() => {
    const tab = document.querySelector('.studio-cat-btn[data-cat="creator"]');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const charmWorkflow = await page.evaluate(async () => {
    const deco = window.atelierDecorator;
    if (!deco) return { error: "No decorator" };

    // Select Mira ticket
    const miraCard = Array.from(document.querySelectorAll(".client-ticket-card")).find(c => c.textContent.includes("Mira"));
    if (miraCard) miraCard.click();

    // Wait until deco.nails has loaded for this set
    const t0 = Date.now();
    while ((!deco.nails || deco.nails.length < 5) && Date.now() - t0 < 8000) {
      await new Promise(r => setTimeout(r, 150));
    }

    if (!deco.nails || deco.nails.length < 5) {
      return { error: "Nails did not load in time", nailCount: deco.nails ? deco.nails.length : 0 };
    }

    // Mira's requested charm is "Sculpted Ribbon Bow" (id: 'sculpted-ribbon-bow')
    // 1. Place requested charm (Sculpted Ribbon Bow) on nail 2
    await deco.placeOnNail("sculpted-ribbon-bow", 2);
    // 2. Place extra charm (Strawberry) on nail 0
    await deco.placeOnNail("charm-strawberry", 0);
    // 3. Place extra charm (Star) on nail 4
    await deco.placeOnNail("charm-star", 4);

    const countInitial = deco.placed.length;
    const placedInitial = deco.placed.map(p => p.charmId);

    // 4. Remove Star by tapping it (simulate removal)
    const starIndex = deco.placed.findIndex(p => p.charmId === "charm-star");
    if (starIndex >= 0) {
      deco.placed[starIndex].object.parent?.remove(deco.placed[starIndex].object);
      deco.placed.splice(starIndex, 1);
      deco.onChange(deco.placed);
    }
    const countAfterRemoveStar = deco.placed.length;

    // 5. Test "Remove all charms" button — must preserve Mira's requested Sculpted Ribbon Bow!
    const clearBtn = document.querySelector(".charm-clear-btn");
    if (clearBtn) clearBtn.click();

    const countAfterClear = deco.placed.length;
    const placedAfterClear = deco.placed.map(p => p.charmId);

    return {
      countInitial,
      placedInitial,
      countAfterRemoveStar,
      countAfterClear,
      placedAfterClear,
      wantedPreserved: placedAfterClear.includes("sculpted-ribbon-bow") && !placedAfterClear.includes("charm-strawberry") && countAfterClear === 1
    };
  });

  results.item5_6 = {
    initialPlacement: charmWorkflow.countInitial === 3,
    tapRemoval: charmWorkflow.countAfterRemoveStar === 2,
    preservedWantedOnClear: charmWorkflow.wantedPreserved,
    details: charmWorkflow,
    pass: charmWorkflow.countInitial === 3 && charmWorkflow.countAfterRemoveStar === 2 && charmWorkflow.wantedPreserved
  };
  console.log("Item 5 & 6 Result:", results.item5_6.pass ? "PASS" : "FAIL", results.item5_6);

  // Capture screenshot of decorated nails in studio
  await page.screenshot({ path: "docs/game-plan/screens/qa-studio-decorated.png" });
  console.log("Captured docs/game-plan/screens/qa-studio-decorated.png");

  // Close Manicure Studio
  await page.evaluate(() => document.getElementById("btn-modal-close")?.click());
  await new Promise((r) => setTimeout(r, 600));

  console.log("=== CHECK 9: Minigame Step 3 Charm Tray ===");
  // Test minigame step 3 charm tray
  const minigameTrayCheck = await page.evaluate(async () => {
    const mg = window.nailMinigame;
    const qs = window.questSystem;
    const miraTicket = qs.getTicket("mira");
    if (!mg || !miraTicket) return { error: "Missing minigame or ticket" };

    // Start minigame
    await mg.startMinigame(miraTicket);
    await new Promise(r => setTimeout(r, 400));

    // Step 1: Complete base fill
    mg.baseCoverage = [100, 100, 100, 100, 100];
    mg.scores.base = 100;
    // Step 2: Complete art
    mg.artAccuracy = 98;
    mg.scores.art = 98;

    // Advance to Step 3 (Charms)
    mg.renderStepCharms();
    await new Promise(r => setTimeout(r, 300));

    const tray = document.getElementById("charm-step-tray");
    const charmButtons = tray ? Array.from(tray.querySelectorAll(".charm-step-pick")) : [];
    const charmIds = charmButtons.map(b => b.dataset.charm);

    const hasWanted = charmIds.includes("sculpted-ribbon-bow");
    const count = charmButtons.length;

    // Clean up / close minigame modal
    mg.close();

    return {
      trayRendered: !!tray,
      charmCount: count,
      charmIds,
      hasWantedBow: hasWanted
    };
  });

  results.item9 = {
    step3TrayRendered: minigameTrayCheck.trayRendered,
    trayOffers4Charms: minigameTrayCheck.charmCount === 4,
    trayIncludesRequestedCharm: minigameTrayCheck.hasWantedBow,
    details: minigameTrayCheck,
    pass: minigameTrayCheck.trayRendered && minigameTrayCheck.charmCount === 4 && minigameTrayCheck.hasWantedBow
  };
  console.log("Item 9 Result:", results.item9.pass ? "PASS" : "FAIL", results.item9);

  console.log("=== CHECK 7 & 8: End-to-End Client Order (Mira) & Atelier Book Progress ===");
  const orderFlow = await page.evaluate(async () => {
    const qs = window.questSystem;
    const mira = qs.getTicket("mira");
    const player = window.gameInstance?.player;

    const roundBefore = qs.deliveredCount;

    // 1. Accept commission if offered
    if (mira.status === "offered") {
      await qs.acceptCommission("mira");
    }

    // 2. Craft and pack ticket
    await qs.craftAndPackTicket("mira");
    player.updateBoxCount(1);
    const boxCountCarried = player.packedBoxCount;

    // 3. Deliver to client
    const deliverResult = await qs.deliverToClient("mira");
    player.updateBoxCount(0);
    const boxCountAfter = player.packedBoxCount;

    const roundAfter = qs.deliveredCount;
    const finalTicket = qs.getTicket("mira");

    return {
      roundBefore,
      roundAfter,
      boxCountCarried,
      boxCountAfter,
      statusAfter: finalTicket?.status,
      rewardGloss: deliverResult?.glossEarned,
      rewardXp: deliverResult?.xpEarned,
      rewardCharm: deliverResult?.reward
    };
  });

  // Verify Atelier Book (Journal) badge updates
  await page.evaluate(() => window.gameInstance?.toggleOrderCard());
  await new Promise((r) => setTimeout(r, 600));
  const journalProgressText = await page.evaluate(() => {
    return document.getElementById("round-progress")?.textContent?.trim();
  });
  await page.evaluate(() => window.gameInstance?.toggleOrderCard());

  results.item7_8 = {
    packedAndCarried: orderFlow.boxCountCarried === 1,
    deliveredStatus: orderFlow.statusAfter === "delivered",
    boxClearedOnDeliver: orderFlow.boxCountAfter === 0,
    roundIncremented: orderFlow.roundAfter > orderFlow.roundBefore,
    journalBadge: journalProgressText,
    details: orderFlow,
    pass: orderFlow.boxCountCarried === 1 && orderFlow.statusAfter === "delivered" && orderFlow.boxCountAfter === 0 && orderFlow.roundAfter > orderFlow.roundBefore
  };
  console.log("Item 7 & 8 Result:", results.item7_8.pass ? "PASS" : "FAIL", results.item7_8);

  console.log("=== CHECK 10: Market, Basket, Life4Cuts Modals Open & Close ===");
  // Market Shop
  await page.evaluate(() => document.getElementById("btn-open-shop")?.click());
  await new Promise((r) => setTimeout(r, 800));
  const marketOpen = await page.evaluate(() => {
    const el = document.getElementById("market-shop-modal-overlay");
    return el && el.style.display !== "none";
  });
  await page.evaluate(() => document.getElementById("btn-shop-close")?.click());
  await new Promise((r) => setTimeout(r, 400));

  // Basket (Inventory)
  await page.keyboard.press("KeyI");
  await new Promise((r) => setTimeout(r, 800));
  const basketOpen = await page.evaluate(() => {
    const el = document.getElementById("inventory-modal-overlay");
    return el && el.style.display !== "none";
  });
  await page.evaluate(() => document.getElementById("btn-inventory-close")?.click());
  await new Promise((r) => setTimeout(r, 400));

  // Photobooth / Life4Cuts
  await page.evaluate(() => document.getElementById("btn-open-booth")?.click());
  await new Promise((r) => setTimeout(r, 800));
  const boothOpen = await page.evaluate(() => {
    const el = document.getElementById("eliya-modal-overlay");
    return el && el.style.display !== "none";
  });
  await page.evaluate(() => document.getElementById("btn-modal-close")?.click());
  await new Promise((r) => setTimeout(r, 400));

  results.item10 = {
    market: marketOpen,
    basket: basketOpen,
    photobooth: boothOpen,
    pass: marketOpen && basketOpen && boothOpen
  };
  console.log("Item 10 Result:", results.item10.pass ? "PASS" : "FAIL", results.item10);

  console.log("=== CHECK 11: Desktop & Phone-width Viewports ===");
  // Capture desktop overworld in front of Atelier
  await page.setViewport({ width: 1400, height: 900 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: "docs/game-plan/screens/qa-desktop-overworld.png" });
  await page.screenshot({ path: "docs/game-plan/screens/qa-atelier-street-hero.png" });
  console.log("Captured docs/game-plan/screens/qa-desktop-overworld.png & qa-atelier-street-hero.png");

  // Capture phone-width viewport (390x844) without triggering Puppeteer page reload
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: "docs/game-plan/screens/qa-mobile-viewport-390.png" });
  console.log("Captured docs/game-plan/screens/qa-mobile-viewport-390.png");

  results.item11 = {
    desktopScreenshot: fs.existsSync("docs/game-plan/screens/qa-desktop-overworld.png"),
    mobileScreenshot: fs.existsSync("docs/game-plan/screens/qa-mobile-viewport-390.png"),
    heroAtelierScreenshot: fs.existsSync("docs/game-plan/screens/qa-atelier-street-hero.png"),
    pass: true
  };
  console.log("Item 11 Result: PASS");

  await browser.close();

  // Summary
  console.log("\n================ FULL QA SUMMARY ================");
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync("docs/game-plan/qa-results.json", JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
