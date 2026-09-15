/**
 * PHASE 1.10B BEHAVIOR CORRECTION — desktop verification.
 * FINAL MODEL: manual gesture = explore 3D; clicking a geographic NAME =
 * one journey through the atmosphere into the MAP at that geography.
 * Map ladder navigates WITHIN the map; only EARTH exits to 3D.
 */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-10b-final";
const { launch, sleep, waitFor, getState, getCam, shot, ready, clickButton } = require("./lib");

const passes = [];
const pass = (n, note = "") => { passes.push(`${n} ${note}`); console.log(`PASS ${n} ${note}`); };

async function clickLabel(page, name) {
  return page.evaluate((n) => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => x.getAttribute("aria-label") === `View ${n}` && !x.closest("aside") && !x.closest("nav"),
    );
    if (!b) return "missing";
    const o = parseFloat(getComputedStyle(b.parentElement).opacity || "0");
    if (o < 0.25) return `invisible(${o.toFixed(2)})`;
    b.click();
    return "ok";
  }, name);
}
async function labelVisible(page, name, min = 0.2) {
  return page.evaluate(({ n, m }) => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => x.getAttribute("aria-label") === `View ${n}` && !x.closest("aside") && !x.closest("nav"),
    );
    return !!b && parseFloat(getComputedStyle(b.parentElement).opacity || "0") >= m;
  }, { n: name, m: min });
}
async function drag(page, x, y, dx, dy) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(x + (dx * i) / 8, y + (dy * i) / 8); await sleep(26); }
  await page.mouse.up();
}
/** Rotate the globe steering the label's registered slot toward center. */
async function steerToLabel(page, id, name, maxIter = 26) {
  for (let it = 0; it < maxIter; it++) {
    if (await labelVisible(page, name, 0.25)) return true;
    const s = await page.evaluate((i) => {
      const e = (window.__SB_SLOTS || {})[i];
      return e ? { x: e.x, y: e.y } : null;
    }, id);
    if (s) {
      const dx = Math.max(-170, Math.min(170, (720 - s.x) * 0.45));
      const dy = Math.max(-100, Math.min(100, (450 - s.y) * 0.45));
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) { await sleep(900); continue; }
      await drag(page, 720, 450, dx, dy);
    } else {
      await drag(page, 720, 450, -130, 0);
    }
    await sleep(1000);
  }
  return labelVisible(page, name, 0.25);
}
async function rotateUntilLabel(page, name, tries = 14, dir = -1) {
  for (let a = 0; a < tries; a++) {
    if (await labelVisible(page, name, 0.25)) return true;
    await page.mouse.move(720, 450);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(720 + dir * i * 28, 450); await sleep(28); }
    await page.mouse.up();
    await sleep(1300);
  }
  return labelVisible(page, name, 0.25);
}
const mapInfo = (page) =>
  page.evaluate(() => {
    if (!window.__SB_MAP) return null;
    const c = window.__SB_MAP.getCenter();
    return {
      lat: c.lat, lng: c.lng, zoom: window.__SB_MAP.getZoom(),
      territory: window.__SB_TERRITORY ?? null,
      boundaryDrawn: !!document.querySelector("path.sb-territory"),
      card: !!document.querySelector('aside[aria-label$="destination"]'),
      crumbs: (document.querySelector('nav[aria-label="Geographic scale ladder"]')?.innerText || "").replace(/\n/g, " "),
    };
  });
const waitLive = (page, t = 40000) =>
  waitFor(page, () => window.__SB_STATE.stage === "live" && !!window.__SB_MAP, t, "map live");
const waitMapSettled = async (page, ms = 4200) => { await sleep(ms); return mapInfo(page); };
/** Assert the map NEVER leaves live while fn's transition settles. */
async function stayLive(page, ms = 3500) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const st = await getState(page);
    if (st.stage !== "live") throw new Error(`left the map mid-navigation (stage=${st.stage})`);
    await sleep(300);
  }
}
const crumbClick = (page, name) =>
  page.evaluate((n) => {
    const b = [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
      .find((x) => x.getAttribute("aria-label") === `View ${n}`);
    if (!b) return false;
    b.click();
    return true;
  }, name);

(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);

  /* ================= FLOW C first: continent NAME → MAP ================ */
  await clickButton(page, "Earth");
  await waitFor(page, () => window.__SB_STATE.mode === "focus" && window.__SB_CAM && !window.__SB_CAM.travelling, 25000, "Earth focus");
  await sleep(1800);
  await shot(page, "01-earth-full");
  if (!(await steerToLabel(page, "ct-asia", "Asia"))) throw new Error("ASIA not discoverable");
  await shot(page, "02-earth-asia-label");
  let r = await clickLabel(page, "Asia");
  if (r !== "ok") throw new Error(`ASIA click: ${r}`);
  // one-shot: descend begins, NO intermediate settled 3D stop
  await waitFor(page, () => {
    const st = window.__SB_STATE;
    return (st.journey && st.journey.kind === "descend") || st.stage !== "off";
  }, 8000, "immediate travel");
  await sleep(1200);
  await shot(page, "03-asia-descent-atmosphere");
  await waitLive(page);
  let mi = await waitMapSettled(page);
  console.log("  asia map:", JSON.stringify(mi));
  if (mi.zoom > 4.8) throw new Error(`Asia not extent-framed: z=${mi.zoom}`);
  if (mi.territory) throw new Error("continent must not draw a giant polygon");
  if (mi.card) throw new Error("continent arrival must not show a destination card");
  await shot(page, "04-asia-map-extent");
  pass("FLOW C", `ASIA name → map extent z=${mi.zoom.toFixed(2)}, no polygon, no card`);

  /* ============ FLOW E: in-map NEPAL target flies in-map =============== */
  const hasTarget = await page.evaluate(() =>
    [...document.querySelectorAll(".sb-geo-target")].some((el) => el.textContent.trim().toUpperCase() === "NEPAL"),
  );
  if (!hasTarget) throw new Error("no in-map NEPAL target at Asia scale");
  await shot(page, "05-asia-map-country-targets");
  const clickGeoTarget = async (name) => {
    const p = await page.evaluate((n) => {
      const el = [...document.querySelectorAll(".sb-geo-target")].find(
        (x) => x.textContent.trim().toUpperCase() === n,
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, name);
    if (!p) throw new Error(`in-map ${name} target missing`);
    await page.mouse.click(p.x, p.y); // real hit-tested click
  };
  await clickGeoTarget("NEPAL");
  await stayLive(page, 3200);
  mi = await waitMapSettled(page, 2500);
  console.log("  nepal map (from asia):", JSON.stringify(mi));
  if (mi.zoom < 6 || mi.zoom > 8.4) throw new Error(`Nepal not bounds-fitted: z=${mi.zoom}`);
  if (mi.territory !== "cn-nepal" || !mi.boundaryDrawn) throw new Error("real Nepal boundary missing");
  if (mi.card) throw new Error("country arrival must not show a destination card");
  if (Math.abs(mi.lat - 28.3) > 1.6 || Math.abs(mi.lng - 84.1) > 2.2) throw new Error("not centered on Nepal");
  await shot(page, "06-nepal-map-from-asia-target");
  pass("FLOW E", `in-map NEPAL target → fitBounds z=${mi.zoom.toFixed(2)}, boundary + no card, no reload`);

  /* ============ FLOW B: ladder navigates WITHIN the map ================ */
  if (!(await crumbClick(page, "Asia"))) throw new Error("ASIA crumb missing");
  await stayLive(page, 3200);
  mi = await waitMapSettled(page, 2000);
  if (mi.zoom > 4.8) throw new Error(`ASIA crumb did not fit extent: z=${mi.zoom}`);
  if (mi.territory) throw new Error("territory should retire at continent scale");
  await shot(page, "07-crumb-asia-in-map");
  // and back down again via the in-map country target (real click)
  await clickGeoTarget("NEPAL");
  await stayLive(page, 3200);
  mi = await waitMapSettled(page, 2200);
  if (mi.territory !== "cn-nepal") throw new Error("Nepal boundary did not return");
  await shot(page, "08-nepal-map-boundary-night");
  pass("FLOW B", "ASIA crumb stays in-map; territory retires and returns correctly");

  /* ---------- day/night boundary + ladder legibility ---------- */
  await clickButton(page, "Switch to Solar Observatory (light) mode");
  await sleep(1800);
  await shot(page, "09-nepal-map-boundary-day");
  await clickButton(page, "Switch to Deep Cosmos (dark) mode");
  await sleep(1200);
  pass("LEGIBILITY", "boundary + ladder captured on day and night maps");

  /* ============ FLOW D: ONLY EARTH exits — facing the map view ========= */
  const beforeExit = await mapInfo(page);
  if (!(await crumbClick(page, "Earth"))) throw new Error("EARTH crumb missing");
  await sleep(800);
  await shot(page, "10-earth-exit-atmosphere");
  await waitFor(page, () => {
    const st = window.__SB_STATE, cam = window.__SB_CAM;
    return st.stage === "off" && !st.journey && cam && Math.abs(cam.dist - 5.7) < 0.4 && !cam.travelling;
  }, 45000, "3D Earth return at full view");
  const facing = await page.evaluate(() => window.__SB_FACING.current);
  console.log("  facing after exit:", JSON.stringify(facing), "map was:", beforeExit.lat.toFixed(1), beforeExit.lng.toFixed(1));
  if (Math.abs(facing.lat - beforeExit.lat) > 10 || Math.abs(facing.lon - beforeExit.lng) > 14)
    throw new Error("globe returned facing an unrelated hemisphere");
  const st1 = await getState(page);
  if (st1.selectedGeo) throw new Error("selection should clear on EARTH exit");
  await sleep(1400);
  await shot(page, "11-earth-return-facing-nepal");
  pass("FLOW D", `EARTH crumb → 3D facing ${facing.lat.toFixed(1)},${facing.lon.toFixed(1)} (map view kept)`);

  /* ============ FLOW A: country NAME on 3D → country MAP =============== */
  // manual zoom (stays 3D) until Nepal's name appears, then click it
  await page.mouse.move(720, 450);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel({ deltaY: -170 });
    await sleep(240);
    const cam = await getCam(page);
    if (cam && cam.dist <= 1.95) break;
  }
  await sleep(1500);
  let st = await getState(page);
  if (st.stage !== "off") throw new Error("manual zoom must NOT open the map");
  await shot(page, "12-manual-zoom-still-3d");
  pass("FLOW G(1)", "manual zoom explores 3D indefinitely — no auto-map");
  if (!(await steerToLabel(page, "cn-nepal", "Nepal"))) throw new Error("Nepal label not discoverable");
  await shot(page, "13-nepal-label-3d");
  r = await clickLabel(page, "Nepal");
  if (r !== "ok") throw new Error(`NEPAL click: ${r}`);
  await waitFor(page, () => {
    const st2 = window.__SB_STATE;
    return (st2.journey && st2.journey.kind === "descend") || st2.stage !== "off";
  }, 8000, "immediate country travel");
  await shot(page, "14-nepal-descent");
  await waitLive(page);
  mi = await waitMapSettled(page);
  console.log("  nepal map (from 3D name):", JSON.stringify(mi));
  if (mi.zoom < 6 || mi.zoom > 8.4) throw new Error(`Nepal arrival not country-fitted: z=${mi.zoom}`);
  if (mi.zoom >= 9) throw new Error("auto-zoomed toward Kathmandu — must stay at whole-country");
  if (mi.territory !== "cn-nepal" || !mi.boundaryDrawn) throw new Error("Nepal boundary missing");
  if (mi.card) throw new Error("country arrival must not show a destination card");
  await shot(page, "15-nepal-map-fitted");
  pass("FLOW A", `NEPAL name → ONE journey → country map z=${mi.zoom.toFixed(2)}, real boundary, free`);

  /* user is FREE after arrival — drag the map somewhere else */
  await page.mouse.move(720, 450); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(720 - i * 30, 450 + i * 8); await sleep(30); }
  await page.mouse.up();
  await sleep(900);
  st = await getState(page);
  if (st.stage !== "live") throw new Error("selection caged the user");
  await shot(page, "16-nepal-map-free-pan");
  pass("FLOW A(free)", "selection is context — panning away is unrestricted");

  /* ============ FLOW F: city NAME → city-scale map ===================== */
  if (!(await crumbClick(page, "Earth"))) throw new Error("EARTH crumb missing (2)");
  await waitFor(page, () => {
    const st2 = window.__SB_STATE, cam = window.__SB_CAM;
    return st2.stage === "off" && !st2.journey && cam && !cam.travelling && cam.dist > 4.5;
  }, 45000, "back at 3D");
  await sleep(1200);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 44; i++) {
    await page.mouse.wheel({ deltaY: -170 });
    await sleep(220);
    const cam = await getCam(page);
    if (cam && cam.dist <= 1.8) break;
  }
  await sleep(1400);
  if (!(await steerToLabel(page, "cy-kathmandu", "Kathmandu")))
    throw new Error("Kathmandu label not discoverable");
  r = await clickLabel(page, "Kathmandu");
  if (r !== "ok") throw new Error(`KATHMANDU click: ${r}`);
  await waitLive(page);
  mi = await waitMapSettled(page);
  console.log("  kathmandu map:", JSON.stringify(mi));
  if (Math.abs(mi.zoom - 11.5) > 1.1) throw new Error(`city scale wrong: z=${mi.zoom}`);
  if (Math.hypot(mi.lat - 27.717, mi.lng - 85.324) > 0.5) throw new Error("not centered on Kathmandu");
  await shot(page, "17-kathmandu-city-map");
  pass("FLOW F", `KATHMANDU name → city map z=${mi.zoom.toFixed(2)} (curated card allowed: ${mi.card})`);

  /* keyboard: ladder crumb Tab/Enter navigates within the map */
  const kbOk = await page.evaluate(() => {
    const b = [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
      .find((x) => x.getAttribute("aria-label") === "View Nepal");
    if (!b) return false;
    b.focus();
    return document.activeElement === b;
  });
  if (!kbOk) throw new Error("NEPAL crumb not focusable");
  await page.keyboard.press("Enter");
  await stayLive(page, 3200);
  mi = await waitMapSettled(page, 2200);
  if (mi.zoom < 6 || mi.zoom > 8.4 || mi.territory !== "cn-nepal")
    throw new Error(`keyboard crumb failed: z=${mi.zoom} territory=${mi.territory}`);
  await shot(page, "18-keyboard-crumb-nepal");
  pass("KEYBOARD (map)", "Tab/Enter on NEPAL crumb → whole-Nepal fit in-map");

  /* ============ FLOW G(2): natural deep-intent entry unchanged ========= */
  if (!(await crumbClick(page, "Earth"))) throw new Error("EARTH crumb missing (3)");
  await waitFor(page, () => {
    const st2 = window.__SB_STATE, cam = window.__SB_CAM;
    return st2.stage === "off" && !st2.journey && cam && !cam.travelling && cam.dist > 4.5;
  }, 45000, "back at 3D (2)");
  await sleep(1200);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 44; i++) {
    await page.mouse.wheel({ deltaY: -190 });
    await sleep(240);
    const cam = await getCam(page);
    if (cam && cam.dist <= 1.65) break;
  }
  await sleep(2200);
  st = await getState(page);
  if (st.stage !== "off") throw new Error("map opened at the floor without pinned intent");
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel({ deltaY: -170 });
    await sleep(240);
    if ((await getState(page)).stage !== "off") break;
  }
  await waitLive(page, 25000);
  await sleep(2500);
  await shot(page, "19-natural-detent-entry");
  pass("FLOW G(2)", "pinned deep-zoom intent still crosses into the map");

  /* ============ keyboard G-mode: Enter travels to the map ============== */
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Space"))?.click();
  });
  await waitFor(page, () => window.__SB_STATE.stage === "off" && window.__SB_STATE.mode === "focus", 25000, "3D again");
  await sleep(1500);
  await page.keyboard.press("g");
  await sleep(400);
  await page.keyboard.press("Enter");
  await waitLive(page, 40000);
  mi = await waitMapSettled(page, 3000);
  console.log("  g-mode arrival:", JSON.stringify(mi));
  if (mi.card) throw new Error("continent keyboard arrival must not show a card");
  await shot(page, "20-keyboard-gmode-map");
  pass("KEYBOARD (globe)", `G-mode Enter → map at z=${mi.zoom.toFixed(2)}`);

  console.log("\nPAGE ERRORS:", errors.length ? errors : "none");
  if (errors.length) process.exitCode = 1;
  console.log(`\n${passes.length} desktop flows PASS`);
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
