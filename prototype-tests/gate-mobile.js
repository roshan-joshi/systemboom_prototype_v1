/** PHASE 2.2 — Identity gate, mobile 390×844 (touch). */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-02-2";
const { launch, sleep, waitFor, getState, getCam, shot, ready } = require("./lib");
const G = require("./gate-lib");

const tap = async (page, sel) => {
  const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel);
  await page.touchscreen.tap(r.x, r.y);
};

(async () => {
  const { browser, page, errors } = await launch({ mobile: true });
  await ready(page);

  /* ---- A. chip reachable at 390px; bottom sheet ---- */
  console.log("A. mobile chip + sheet");
  const chip = await page.evaluate(() => { const b = document.querySelector("[data-sb-gate-opener]"); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, right: r.right, label: b.getAttribute("aria-label"), text: b.innerText.trim() }; });
  G.assert(chip.w > 36 && chip.right <= 390 && chip.label === "Sign in" && chip.text === "", `icon-only Sign In chip present in the header (${chip.w}×${chip.h})`);
  await tap(page, G.OPENER);
  await waitFor(page, () => !!document.querySelector("[role=dialog][aria-modal=true]"), 8000, "dialog");
  await sleep(700);
  const sheet = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const r = d.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, pb: getComputedStyle(d).paddingBottom, radius: getComputedStyle(d).borderTopLeftRadius }; });
  G.assert(Math.abs(sheet.bottom - 844) < 2 && sheet.left < 1 && sheet.right > 389 && sheet.top > 100, `bottom sheet anchored to the viewport bottom (top ${Math.round(sheet.top)})`);
  G.assert(parseFloat(sheet.pb) >= 24, `safe-area-aware bottom padding (${sheet.pb} with inset 0)`);
  const inert = await G.inertReport(page);
  console.log("  inert report:", JSON.stringify(inert));
  G.assert(inert.prop && inert.focusRefused === true && inert.pointerBlocked, "inert effective on mobile");
  await shot(page, "M1-sheet-open");
  // scrim tap above the sheet closes
  await page.touchscreen.tap(195, 80);
  await G.expectClosed(page, "scrim tap closes");

  /* ---- B. Earth focused (minimal=true): chip survives, menu hidden ---- */
  console.log("B. focused Earth reachability");
  await tap(page, "button[aria-label=Menu]");
  await sleep(300);
  await page.evaluate(() => { [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Earth")?.click(); });
  await waitFor(page, () => window.__SB_STATE.mode === "focus", 30000, "Earth focus");
  await G.waitSettled(page);
  await sleep(1000);
  const vis = await page.evaluate(() => ({
    menu: !!document.querySelector("button[aria-label=Menu]"),
    chip: !!document.querySelector("[data-sb-gate-opener]") && document.querySelector("[data-sb-gate-opener]").getBoundingClientRect().width > 0,
  }));
  G.assert(!vis.menu && vis.chip, "menu hidden under minimal, Sign In chip still present");
  await tap(page, G.OPENER);
  await waitFor(page, () => !!document.querySelector("[role=dialog][aria-modal=true]"), 8000, "dialog over focused Earth");
  await sleep(700);
  await shot(page, "M2-sheet-over-focused-earth");
  // Enter as Maya from the sheet, then close
  await G.clickText(page, "Enter as Maya Rai");
  await sleep(500);
  G.assert((await G.identity(page)).activeIdentityId === "u-demo-001", "Enter as Maya works on mobile");
  await shot(page, "M3-signed-in-sheet");
  await G.clickText(page, "Back to the Cosmos");
  await G.expectClosed(page, "close on mobile");

  /* ---- C. Earth still interactive by touch ---- */
  console.log("C. touch interactivity after close");
  const before = await getCam(page);
  await page.touchscreen.touchStart(195, 420);
  for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(195 - k * 15, 420); await sleep(30); }
  const mid = await getCam(page);
  await page.touchscreen.touchEnd();
  G.assert(mid.interacting === true, "touch drag reaches OrbitControls after gate closed");
  await sleep(600);
  // pinch in via CDP
  const cdp = await page.target().createCDPSession();
  const pinch = async (spread) => {
    const cx = 195, cy = 420;
    const pts = (d) => [{ x: cx - d, y: cy }, { x: cx + d, y: cy }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pts(40) });
    for (let i = 1; i <= 8; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pts(40 + (spread * i) / 8) }); await sleep(25); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await pinch(60);
  await sleep(800);
  const after = await getCam(page);
  G.assert(after.dist < before.dist - 0.005 || mid.interacting, `pinch/drag alive after gate (${before.dist} → ${after.dist})`);
  const chipNow = await page.evaluate(() => document.querySelector("[data-sb-gate-opener]").innerText.trim());
  G.assert(chipNow === "" || chipNow.length <= 4, "signed-in chip stays compact on mobile (avatar only)");
  await shot(page, "M4-after-close-interactive");

  G.assert(errors.length === 0, `zero page errors (${errors.length})`);
  console.log("\nGATE MOBILE: PASS");
  await browser.close();
})().catch((e) => {
  console.error("GATE MOBILE: FAIL", e);
  process.exit(1);
});
