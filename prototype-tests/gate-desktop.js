/** PHASE 2.2 — Identity gate, desktop 1440×900. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-02-2";
const { launch, sleep, waitFor, getState, getCam, shot, ready, clickButton } = require("./lib");
const G = require("./gate-lib");

(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);
  const clipLeft = { x: 0, y: 120, width: 700, height: 600 }; // canvas-only region, clear of the panel

  /* ---- A. open: dialog, focus, inert, scrim, frame alive ---- */
  console.log("A. open");
  await G.openGate(page);
  let id = await G.identity(page);
  G.assert(id.gateOpen && id.gateView === "signin", "gate open in signin view");
  G.assert((await G.activeDesc(page)).startsWith("H2"), `focus lands on the dialog heading (${await G.activeDesc(page)})`);
  const inert = await G.inertReport(page);
  console.log("  inert report:", JSON.stringify(inert));
  G.assert(inert.attr && inert.prop, "inert attribute set on the Cosmos wrapper");
  G.assert(inert.supported, "inert supported by this Chrome");
  G.assert(inert.focusRefused === true, "inert EFFECTIVE: a Cosmos button refuses focus");
  G.assert(inert.pointerBlocked && inert.topAtCentre.includes("scrim"), `pointer at canvas centre hits the scrim, not the canvas (${inert.topAtCentre})`);
  G.assert(await G.frameAlive(page, clipLeft), "Cosmos frame still animating behind the open gate");
  await shot(page, "A-gate-open-desktop-dark");
  const stBefore = await getState(page);
  // Pointer at canvas centre while open → must not select a planet; scrim closes the gate.
  await page.mouse.click(720, 450);
  await G.expectClosed(page, "scrim click closes");
  const stAfter = await getState(page);
  G.assert(stAfter.mode === stBefore.mode && stAfter.selected === stBefore.selected, "canvas click while open did NOT reach the Cosmos (mode/selection unchanged)");
  G.assert((await G.activeDesc(page)).includes("[opener]"), `focus returned to the Sign In chip (${await G.activeDesc(page)})`);

  /* ---- F. gate lock while the map is live ---- */
  console.log("F. gate lock");
  // Runs BEFORE any manual manipulation: refocusing Earth after drag/wheel is a
  // pre-existing Phase 1 camera stall (documented in the 2.2 report), out of scope.
  await clickButton(page, "Earth");
  await waitFor(page, () => window.__SB_STATE.mode === "focus", 30000, "Earth focus");
  await G.waitSettled(page);
  await clickButton(page, "Show planet information");
  await sleep(400);
  await clickButton(page, "Explore Earth");
  await waitFor(page, () => window.__SB_STATE.stage === "live", 30000, "map live");
  await sleep(1500);
  G.assert((await G.identity(page)).locked === true, "gate locked while the map is live");
  G.assert(!(await page.$(G.OPENER)), "Sign In chip hidden while locked");
  const spaceBtn = await page.evaluate(() => !![...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Space")));
  G.assert(spaceBtn, "return path visible: ← Space");
  await shot(page, "F1-map-live-chip-hidden");
  await clickButton(page, "Space");
  await waitFor(page, () => window.__SB_STATE.stage === "off", 30000, "back to Earth");
  await sleep(800);
  G.assert((await G.identity(page)).locked === false && !!(await page.$(G.OPENER)), "unlocked and chip back after returning to space");
  await G.waitSettled(page);
  await shot(page, "F2-back-chip-visible");

  /* ---- B. Escape closes; Earth fully interactive afterwards ---- */
  console.log("B. escape + interactivity");
  await G.openGate(page);
  await page.keyboard.press("Escape");
  await G.expectClosed(page, "Escape closes");
  G.assert((await getState(page)).mode === "focus", "Escape inside the gate did not touch the Cosmos ladder (Earth still focused)");
  await G.waitSettled(page);
  let cam = await getCam(page);
  await page.keyboard.press("+");
  await sleep(700);
  let cam2 = await getCam(page);
  G.assert(cam2.dist < cam.dist - 0.01, `"+" key zooms after gate closed (${cam.dist} → ${cam2.dist})`);
  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: -300 });
  await sleep(700);
  cam = await getCam(page);
  G.assert(cam.dist < cam2.dist - 0.005, `wheel zooms after gate closed (${cam2.dist} → ${cam.dist})`);
  await page.mouse.move(640, 450);
  await page.mouse.down();
  await page.mouse.move(700, 470, { steps: 6 });
  const mid = await getCam(page);
  await page.mouse.up();
  G.assert(mid.interacting === true, "drag is received by OrbitControls after gate closed");
  await sleep(800);

  /* ---- C. gate while Earth is focused: keys suppressed, Escape stays inside ---- */
  console.log("C. gate over focused Earth");
  await G.openGate(page);
  const before = await getCam(page);
  await page.keyboard.press("+");
  await page.keyboard.press("ArrowLeft");
  await sleep(600);
  const during = await getCam(page);
  G.assert(Math.abs(during.dist - before.dist) < 0.002, "Earth keys suppressed while the gate is open");
  G.assert(await G.frameAlive(page, clipLeft), "frame alive behind gate with Earth focused");
  const amb = await page.evaluate(() => (window.__SB_AMBIENCE ? { paused: window.__SB_AMBIENCE.paused, volume: window.__SB_AMBIENCE.volume } : null));
  console.log("  ambience while open:", JSON.stringify(amb));
  await shot(page, "C-gate-over-focused-earth");
  await page.keyboard.press("Escape");
  await G.expectClosed(page, "Escape closes over focused Earth");
  G.assert((await getState(page)).mode === "focus", "Escape did NOT pop the Earth ladder (still focused)");
  await page.keyboard.press("-");
  await sleep(700);
  const after = await getCam(page);
  G.assert(after.dist > during.dist + 0.01, `"-" key works again after close (${during.dist} → ${after.dist})`);
  if (amb && !amb.paused) {
    await sleep(1200);
    const ambAfter = await page.evaluate(() => window.__SB_AMBIENCE.volume);
    G.assert(ambAfter > amb.volume, `ambience ducked while open, restored after (${amb.volume} → ${ambAfter})`);
  } else {
    console.log("  (ambience not playing in headless — duck verified by code path only)");
  }

  /* ---- D. create identity with unknown birth time ---- */
  console.log("D. create identity");
  await clickButton(page, "Solar System");
  await sleep(1500);
  await G.openGate(page);
  await G.clickText(page, "Create your identity");
  await sleep(500);
  G.assert((await G.activeDesc(page)).startsWith("H2"), "focus re-lands on the Create heading");
  // validation: empty submit
  await G.clickText(page, "Enter SYSTEMBOOM");
  await sleep(300);
  let txt = await page.evaluate(() => document.querySelector("[role=dialog]").innerText);
  G.assert(txt.includes("Your name is needed to enter."), "empty name → inline message");
  G.assert((await G.activeDesc(page)).startsWith("INPUT"), "focus moves to the first invalid field");
  await G.setInput(page, "input[type=text][autocomplete=name]", "Asha Gurung");
  await G.setInput(page, "input[type=date]", new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)); // tomorrow — never hard-code "the future"
  await G.clickText(page, "Enter SYSTEMBOOM");
  await sleep(300);
  txt = await page.evaluate(() => document.querySelector("[role=dialog]").innerText);
  G.assert(txt.includes("That date is in the future."), "future DOB → inline message");
  await shot(page, "D1-validation-future");
  await G.setInput(page, "input[type=date]", "1994-03-12");
  await page.click("input[type=checkbox]");
  await sleep(200);
  txt = await page.evaluate(() => document.querySelector("[role=dialog]").innerText);
  G.assert(txt.includes("Recorded as unknown"), "unknown-time hint shown, not an error");
  await G.setInput(page, "input[list]", "Kathmandu, Nepal");
  await shot(page, "D2-create-filled");
  await G.clickText(page, "Enter SYSTEMBOOM");
  await waitFor(page, () => window.__SB_IDENTITY.gateView === "signedIn", 8000, "signedIn view");
  await sleep(500);
  const stored = await page.evaluate(() => ({
    identity: localStorage.getItem("sb-identity"),
    session: localStorage.getItem("sb-session"),
  }));
  console.log("  sb-identity:", stored.identity);
  const idObj = JSON.parse(stored.identity);
  G.assert(idObj.birthTimeKnown === false && !("birthTime" in idObj) && !stored.identity.includes('"birthTime":'), "stored JSON: birthTimeKnown:false and NO birthTime key");
  G.assert(idObj.currentPlace && idObj.currentPlace.geoId === "cy-kathmandu", "place resolved to the curated Kathmandu anchor");
  const sess = JSON.parse(stored.session);
  G.assert(sess.identityId === idObj.id && sess.firstEntrySeen === false, "session names the created identity, firstEntrySeen:false");
  txt = await page.evaluate(() => document.querySelector("[role=dialog]").innerText);
  G.assert(txt.includes("birth time unknown"), "signed-in view visibly states birth time unknown");
  G.assert(txt.includes("You're in, Asha."), "signed-in greeting");
  await shot(page, "D3-signed-in-created");
  await G.clickText(page, "Back to the Cosmos");
  await G.expectClosed(page, "close from signed-in");
  const chipTxt = await page.evaluate(() => document.querySelector("[data-sb-gate-opener]").innerText.trim());
  G.assert(chipTxt.includes("AG") && chipTxt.includes("Asha"), `header chip shows initials + first name (${chipTxt.replace(/\n/g, " ")})`);
  await shot(page, "D4-chip-signed-in");

  /* ---- E. switch identity (testing affordance) ---- */
  console.log("E. switch identity");
  await G.openGate(page);
  G.assert((await G.identity(page)).gateView === "signedIn", "chip reopens the signed-in view");
  await G.clickText(page, "Switch identity");
  await sleep(400);
  const afterSwitch = await page.evaluate(() => ({
    identity: !!localStorage.getItem("sb-identity"),
    session: localStorage.getItem("sb-session"),
    view: window.__SB_IDENTITY.gateView,
    text: document.querySelector("[role=dialog]").innerText,
  }));
  G.assert(afterSwitch.identity && afterSwitch.session === null && afterSwitch.view === "signin", "session cleared, identity kept, back to sign-in");
  G.assert(afterSwitch.text.includes("Enter as Asha Gurung") && afterSwitch.text.includes("Enter as Maya Rai (demo identity)"), "created identity primary, Maya secondary");
  await shot(page, "E-switch-identity");
  await G.clickText(page, "Enter as Maya Rai");
  await sleep(400);
  G.assert((await G.identity(page)).activeIdentityId === "u-demo-001", "Enter as Maya activates the demo identity");
  G.assert(!!(await page.evaluate(() => localStorage.getItem("sb-identity"))), "entering as Maya did not overwrite the created identity");
  await page.keyboard.press("Escape");
  await G.expectClosed(page);

  /* ---- G. light theme look ---- */
  console.log("G. light theme");
  await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
  await sleep(600);
  await G.openGate(page);
  await shot(page, "G-gate-open-desktop-light");
  await page.keyboard.press("Escape");
  await G.expectClosed(page);

  G.assert(errors.length === 0, `zero page errors (${errors.length})`);
  console.log("\nGATE DESKTOP: PASS");
  await browser.close();
})().catch((e) => {
  console.error("GATE DESKTOP: FAIL", e);
  process.exit(1);
});
