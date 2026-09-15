/** PHASE 2.2.1 — CameraRig focus-memory hotfix: refocus never stalls. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-02-2-1";
const { launch, sleep, waitFor, getState, getCam, shot, ready, clickButton } = require("./lib");
const G = require("./gate-lib");

const focus = async (page, name) => {
  await page.evaluate((n) => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === n && b.closest("nav,[role=menu],[role=dialog]"))?.click()
      ?? [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === n)?.click();
  }, name);
  await waitFor(page, () => window.__SB_STATE.mode === "focus", 30000, `${name} focus`);
};
const explore = async (page, name) => {
  await clickButton(page, "Explore");
  await sleep(300);
  await page.evaluate((n) => {
    [...document.querySelectorAll("[role=menuitem]")].find((b) => b.textContent.trim() === n)?.click();
  }, name);
  const start = Date.now();
  while (Date.now() - start < 30000) {
    const st = await getState(page);
    if (st && st.mode === "focus" && st.selected === name.toLowerCase()) return;
    await sleep(300);
  }
  throw new Error(`TIMEOUT waiting for ${name} focus`);
};
const leave = async (page) => {
  await clickButton(page, "Solar System");
  await waitFor(page, () => window.__SB_STATE.mode === "system", 8000, "system");
};
/** Settles within `timeout` (travelling false + stable) — the stall would time out. */
const settle = (page) => G.waitSettled(page, 15000);
const manipulate = async (page) => {
  await page.keyboard.press("+"); await sleep(600);
  await page.mouse.move(720, 450); await page.mouse.wheel({ deltaY: -300 }); await sleep(600);
  await page.mouse.move(640, 450); await page.mouse.down(); await page.mouse.move(700, 470, { steps: 6 }); await page.mouse.up(); await sleep(700);
  await page.keyboard.press("-"); await sleep(1200);
};

(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);

  console.log("1. first focus (default composition)");
  await focus(page, "Earth");
  const first = await settle(page);
  G.assert(first.dist > 5.5 && first.dist < 6.2 && first.memory === null, `Earth settles at ~5.8r with no memory (${first.dist}r)`);

  console.log("2. leave (full return) → refocus WITHOUT manipulation");
  await leave(page);
  await sleep(9000);
  await focus(page, "Earth");
  const re1 = await settle(page);
  G.assert(Math.abs(re1.dist - first.dist) < 0.15, `refocus settles at the remembered offset (${first.dist}r → ${re1.dist}r), travelling=${re1.travelling}`);
  G.assert(re1.memory !== null && re1.memory < 13, `remembered offset is reachable (${re1.memory}r < 13r)`);
  await shot(page, "1-refocus-no-manip");

  console.log("3. manipulate → leave → refocus (repro A)");
  await manipulate(page);
  const shaped = await settle(page);
  await leave(page);
  await sleep(9000);
  await focus(page, "Earth");
  const re2 = await settle(page);
  G.assert(Math.abs(re2.dist - shaped.dist) < 0.15 && !re2.travelling, `repro A fixed: settles at the manipulated offset (${shaped.dist}r → ${re2.dist}r)`);
  await shot(page, "2-refocus-after-manipulation");

  console.log("4. quick refocus mid-return-flight (repro B)");
  await leave(page);
  await sleep(1200);
  await focus(page, "Earth");
  const re3 = await settle(page);
  G.assert(!re3.travelling && re3.dist < 13 && Math.abs(re3.dist - shaped.dist) < 0.3, `repro B fixed: mid-flight refocus settles (${re3.dist}r)`);
  await shot(page, "3-refocus-mid-flight");

  console.log("5. leave before ever settling → no stale memory, default composition");
  await leave(page);
  await sleep(9000);
  await focus(page, "Earth");
  await sleep(150); // still travelling
  await leave(page);
  await sleep(9000);
  await focus(page, "Earth");
  const re4 = await settle(page);
  G.assert(!re4.travelling && re4.dist < 13, `leaving mid-travel never strands the next focus (${re4.dist}r, memory=${re4.memory})`);

  console.log("6. other body: Mars memory preserved");
  await leave(page);
  await sleep(9000);
  await explore(page, "Mars");
  const mars = await settle(page);
  // Keyboard +/- is Earth-only by design; other bodies zoom via the InspectBar.
  await clickButton(page, "Zoom in"); await sleep(400); await clickButton(page, "Zoom in"); await sleep(800);
  const marsZoomed = await settle(page);
  G.assert(marsZoomed.dist < mars.dist - 0.3, `Mars zoomed in (${mars.dist}r → ${marsZoomed.dist}r)`);
  await leave(page);
  await sleep(9000);
  await explore(page, "Mars");
  const marsBack = await settle(page);
  G.assert(Math.abs(marsBack.dist - marsZoomed.dist) < 0.15, `Mars focus memory preserved (${marsZoomed.dist}r → ${marsBack.dist}r)`);
  await shot(page, "4-mars-memory");

  console.log("7. Earth quality floor + handoff detector unaffected");
  await leave(page);
  await sleep(9000);
  await focus(page, "Earth");
  await settle(page);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 40; i++) { await page.mouse.wheel({ deltaY: -400 }); await sleep(60); const c = await getCam(page); if (c.dist < 1.62 * 1.03) break; }
  await sleep(900);
  const floor = await getCam(page);
  G.assert(floor.dist >= 1.6 && floor.dist < 1.75 && (await getState(page)).stage === "off", `wheel stops at the quality floor without handoff (${floor.dist}r)`);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel({ deltaY: -200 }); await sleep(120); }
  await waitFor(page, () => window.__SB_STATE.stage !== "off", 8000, "handoff intent fires");
  await waitFor(page, () => window.__SB_STATE.stage === "live", 20000, "map live");
  await shot(page, "5-handoff-live");
  await clickButton(page, "Space");
  await waitFor(page, () => window.__SB_STATE.stage === "off", 30000, "back");
  const back = await settle(page);
  G.assert(!back.travelling, `Earth settles after map return (${back.dist}r)`);

  console.log("8. office inspect journey completes");
  await clickButton(page, "SYSTEMBOOM locations on Earth");
  await sleep(300);
  await clickButton(page, "Head Office");
  await waitFor(page, () => window.__SB_STATE.journey !== null, 5000, "journey started");
  await waitFor(page, () => window.__SB_STATE.journey === null, 20000, "journey done");
  const inspect = await settle(page);
  G.assert(Math.abs(inspect.dist - 1.85) < 0.12, `inspect journey arrives at ~1.85r (${inspect.dist}r)`);
  await shot(page, "6-office-inspect");

  G.assert(errors.length === 0, `zero page errors (${errors.length})`);
  console.log("\nCAMERA REFOCUS: PASS");
  await browser.close();
})().catch((e) => {
  console.error("CAMERA REFOCUS: FAIL", e);
  process.exit(1);
});
