// test-production-qa.cjs
// Standing regression test on https://eliyadoesnails-game.vercel.app
const puppeteer = require("puppeteer-core");
const fs = require("fs");

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
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  console.log("=== 1. CHECK TITLE SCREEN & ENTER ===");
  await page.goto(PROD_URL, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 3000));
  const hasStart = await page.evaluate(() => {
    const el = document.getElementById("eliya-start-screen");
    return el && !el.classList.contains("hidden");
  });
  console.log("Start screen displayed:", hasStart);

  // Press Enter to start
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 2000));
  const gameStarted = await page.evaluate(() => {
    const el = document.getElementById("eliya-start-screen");
    return el && el.classList.contains("hidden");
  });
  console.log("Game started after Enter:", gameStarted);
  console.log("Console errors on start:", consoleErrors.length ? consoleErrors : "None");

  console.log("=== 2. CHECK WASD, JUMP, BIKE, GATHER, SKINS ===");
  // Test bike toggle [B]
  const bikeBefore = await page.evaluate(() => window.gameInstance?.player?.isRidingBicycle);
  await page.keyboard.press("KeyB");
  await new Promise((r) => setTimeout(r, 400));
  const bikeAfter = await page.evaluate(() => window.gameInstance?.player?.isRidingBicycle);
  console.log("Bicycle toggle [B]:", bikeBefore, "->", bikeAfter);

  // Test jump [Space]
  await page.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 300));
  const isJumping = await page.evaluate(() => !window.gameInstance?.player?.isGrounded);
  console.log("Player jumped [Space]:", isJumping);

  // Test skin toggle [M]
  const skin1 = await page.evaluate(() => window.gameInstance?.player?.currentModelKey);
  await page.keyboard.press("KeyM");
  await new Promise((r) => setTimeout(r, 800));
  const skin2 = await page.evaluate(() => window.gameInstance?.player?.currentModelKey);
  console.log("Avatar skin toggle [M]:", skin1, "->", skin2);

  // Test gather [E]
  await page.keyboard.press("KeyE");
  await new Promise((r) => setTimeout(r, 300));
  const isGathering = await page.evaluate(() => window.gameInstance?.player?.isGathering);
  console.log("Player gather animation [E]:", isGathering);

  // Test walk (WASD)
  await page.keyboard.down("KeyW");
  await new Promise((r) => setTimeout(r, 1000));
  const isMoving = await page.evaluate(() => window.gameInstance?.player?.moving);
  await page.keyboard.up("KeyW");
  console.log("Player walking (WASD):", isMoving);

  console.log("=== 3. CHECK MANICURE STUDIO & SIGNATURE SETS ===");
  await page.evaluate(() => {
    document.getElementById("btn-open-station")?.click();
  });
  await new Promise((r) => setTimeout(r, 2000));
  const studioOpen = await page.evaluate(() => {
    const el = document.getElementById("eliya-modal-overlay");
    return el && el.style.display !== "none" && !el.classList.contains("hidden");
  });
  console.log("Manicure Studio opened:", studioOpen);

  // Switch to Signature Sets tab and check models
  await page.evaluate(() => {
    document.querySelector(`.studio-tab-btn[data-tab="sets"]`)?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const setsRenderCheck = await page.evaluate(() => {
    const viewer = document.getElementById("atelier-model-viewer");
    return {
      viewerPresent: !!viewer,
      src: viewer?.src || null
    };
  });
  console.log("Sets viewer status:", setsRenderCheck);

  console.log("=== 4. CHECK CHARMS: PICK -> PLACE -> REMOVE -> PRESERVE ON CLEAR ===");
  await page.evaluate(() => {
    document.querySelector(`.studio-tab-btn[data-tab="creator"]`)?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const charmTest = await page.evaluate(async () => {
    const deco = window.atelierDecorator;
    if (!deco) return { error: "No decorator" };

    // Select Mira ticket
    const miraCard = Array.from(document.querySelectorAll(".client-ticket-card")).find(c => c.textContent.includes("Mira"));
    if (miraCard) miraCard.click();

    // Place requested charm (Sakura) + 2 extra charms (Strawberry + Star)
    await deco.placeOnNail("charm-sakura", 2);
    await deco.placeOnNail("charm-strawberry", 1);
    await deco.placeOnNail("charm-star", 3);

    const countBefore = deco.placed.length;
    const placedBefore = deco.placed.map(p => p.charmId);

    // Click "Remove all charms"
    const clearBtn = document.querySelector(".charm-clear-btn");
    if (clearBtn) clearBtn.click();

    const countAfter = deco.placed.length;
    const placedAfter = deco.placed.map(p => p.charmId);

    return {
      countBefore,
      placedBefore,
      countAfter,
      placedAfter,
      preservedWanted: placedAfter.includes("charm-sakura") && placedAfter.length === 1
    };
  });
  console.log("Charm placement & clear test:", charmTest);

  console.log("=== 5. CHECK CLIENT ORDER (PACK & COMPLETE) ===");
  const packTest = await page.evaluate(async () => {
    const deco = window.atelierDecorator;
    if (deco && !deco.placed.some(p => p.charmId === "charm-sakura")) {
      await deco.placeOnNail("charm-sakura", 2);
    }
    const packBtn = document.getElementById("btn-creator-pack");
    if (packBtn) packBtn.click();
    return { packed: true };
  });
  console.log("Pack button clicked:", packTest);
  await new Promise((r) => setTimeout(r, 1500));

  const courierBoxes = await page.evaluate(() => {
    return window.gameInstance?.player?.packedBoxCount;
  });
  console.log("Player carried box count:", courierBoxes);

  // Close studio
  await page.evaluate(() => {
    document.getElementById("btn-modal-close")?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("=== 6. CHECK MARKET, BASKET, LIFE4CUTS MODALS ===");
  // Market
  await page.evaluate(() => document.getElementById("btn-open-shop")?.click());
  await new Promise((r) => setTimeout(r, 1000));
  const marketOpened = await page.evaluate(() => {
    const el = document.getElementById("market-shop-modal-overlay");
    return el && el.style.display !== "none" && !el.classList.contains("hidden");
  });
  await page.evaluate(() => document.getElementById("btn-shop-close")?.click());
  await new Promise((r) => setTimeout(r, 500));

  // Basket
  await page.keyboard.press("KeyI");
  await new Promise((r) => setTimeout(r, 1000));
  const basketOpened = await page.evaluate(() => {
    const el = document.getElementById("inventory-modal-overlay");
    return el && el.style.display !== "none" && !el.classList.contains("hidden");
  });
  await page.evaluate(() => document.getElementById("btn-inventory-close")?.click());
  await new Promise((r) => setTimeout(r, 500));

  // Life4Cuts
  await page.evaluate(() => document.getElementById("btn-open-booth")?.click());
  await new Promise((r) => setTimeout(r, 1000));
  const boothOpened = await page.evaluate(() => {
    const el = document.getElementById("photobooth-modal");
    return el && el.style.display !== "none" && !el.classList.contains("hidden");
  });
  await page.evaluate(() => document.getElementById("btn-booth-close")?.click());
  await new Promise((r) => setTimeout(r, 500));

  console.log("Modals: Market =", marketOpened, "Basket =", basketOpened, "Life4Cuts =", boothOpened);

  console.log("=== 7. CHECK PHONE-WIDTH VIEWPORT (390x844) ===");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "docs/game-plan/screens/qa-mobile-viewport-390.png" });
  console.log("Captured docs/game-plan/screens/qa-mobile-viewport-390.png");

  // Reset to desktop viewport and capture overworld screenshot
  await page.setViewport({ width: 1400, height: 900 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "docs/game-plan/screens/qa-desktop-overworld.png" });
  console.log("Captured docs/game-plan/screens/qa-desktop-overworld.png");

  console.log("=== REGRESSION TEST COMPLETE ===");
  await browser.close();
}

run().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
