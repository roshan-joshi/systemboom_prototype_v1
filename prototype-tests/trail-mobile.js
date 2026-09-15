/** PHASE 1.10C — FLOW H mobile: deep trail, smart compression, one-hand return. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-10c";
const { launch, sleep, waitFor, getState, shot, ready } = require("./lib");

const getTrail = (page) =>
  page.evaluate(() => {
    const t = window.__SB_TRAIL || { entries: null, locating: false };
    return { names: t.entries ? t.entries.map((e) => e.name) : null, locating: t.locating };
  });
const screenPt = (page, lat, lon) =>
  page.evaluate(({ la, lo }) => {
    const p = window.__SB_MAP.latLngToContainerPoint([la, lo]);
    return { x: p.x, y: p.y };
  }, { la: lat, lo: lon });
const zoomOf = (page) => page.evaluate(() => window.__SB_MAP.getZoom());

/** Double-tap to zoom in one level toward a point (Leaflet touch gesture). */
async function doubleTapZoom(page, x, y) {
  await page.touchscreen.tap(x, y);
  await sleep(90);
  await page.touchscreen.tap(x, y);
  await sleep(1400);
}

(async () => {
  const { browser, page, errors } = await launch({ mobile: true });
  await ready(page);

  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Earth")?.click();
  });
  await waitFor(page, () => window.__SB_STATE.mode === "focus" && window.__SB_CAM && !window.__SB_CAM.travelling, 30000, "Earth focus");
  await sleep(2000);

  // discover + tap ASIA
  let pos = null;
  for (let i = 0; i < 16 && !pos; i++) {
    pos = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => x.getAttribute("aria-label") === "View Asia" && !x.closest("nav"),
      );
      if (!b) return null;
      if (parseFloat(getComputedStyle(b.parentElement).opacity || "0") < 0.25) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (pos) break;
    await page.touchscreen.touchStart(195, 420);
    for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(195 - k * 20, 420); await sleep(30); }
    await page.touchscreen.touchEnd();
    await sleep(1200);
  }
  if (!pos) throw new Error("ASIA not discoverable on mobile");
  await page.touchscreen.tap(pos.x, pos.y);
  await waitFor(page, () => window.__SB_STATE.stage === "live" && !!window.__SB_MAP, 45000, "map live");
  await sleep(4200);

  // in-map NEPAL target → Nepal fit
  const np = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".sb-geo-target")].find(
      (x) => x.textContent.trim().toUpperCase() === "NEPAL",
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!np) throw new Error("no NEPAL target on mobile");
  await page.touchscreen.tap(np.x, np.y);
  await sleep(4000);

  // drag Kathmandu to center, then the zoom-in control to city depth
  for (let d = 0; d < 4; d++) {
    const kp = await screenPt(page, 27.727, 85.328);
    const dx = 195 - kp.x;
    const dy = 430 - kp.y;
    if (Math.abs(dx) < 25 && Math.abs(dy) < 25) break;
    const sx = Math.max(30, Math.min(360, kp.x));
    const sy = Math.max(150, Math.min(700, kp.y));
    await page.touchscreen.touchStart(sx, sy);
    for (let k = 1; k <= 8; k++) {
      await page.touchscreen.touchMove(sx + (dx * k) / 8, sy + (dy * k) / 8);
      await sleep(28);
    }
    await page.touchscreen.touchEnd();
    await sleep(1100);
  }
  const zoomIn = () =>
    page.evaluate(() => {
      [...document.querySelectorAll("button")]
        .find((b) => b.getAttribute("aria-label") === "Zoom in")?.click();
    });
  for (let i = 0; i < 18; i++) {
    const z = await zoomOf(page);
    if (z >= 13.25) break;
    await zoomIn();
    await sleep(750);
  }
  const zNow = await zoomOf(page);
  console.log("  mobile zoom before place tap:", zNow);
  if (zNow < 12.5) throw new Error(`could not reach city depth (z=${zNow})`);
  await sleep(800);
  let tp = await screenPt(page, 27.7358, 85.3305);
  console.log("  TUTH pt:", JSON.stringify(tp), "center:", JSON.stringify(await page.evaluate(() => window.__SB_MAP.getCenter())));
  if (tp.x < 10 || tp.y < 130 || tp.x > 380 || tp.y > 800) {
    // recenter directly on TUTH and retry once
    const dx = 195 - tp.x;
    const dy = 430 - tp.y;
    const sx = Math.max(30, Math.min(360, tp.x));
    const sy = Math.max(150, Math.min(700, tp.y));
    await page.touchscreen.touchStart(sx, sy);
    for (let k = 1; k <= 8; k++) {
      await page.touchscreen.touchMove(sx + (dx * k) / 8, sy + (dy * k) / 8);
      await sleep(28);
    }
    await page.touchscreen.touchEnd();
    await sleep(1200);
    tp = await screenPt(page, 27.7358, 85.3305);
    console.log("  TUTH pt after recenter:", JSON.stringify(tp));
  }
  if (tp.x < 0 || tp.y < 0 || tp.x > 390 || tp.y > 844) throw new Error("TUTH off-screen");
  await page.touchscreen.tap(tp.x, tp.y);
  await waitFor(page, () => {
    const a = document.querySelector("aside");
    return !!a && a.innerText.includes("T.U. Teaching Hospital");
  }, 20000, "TUTH card on mobile");
  await sleep(2200);
  let t = await getTrail(page);
  console.log("  mobile deep trail:", JSON.stringify(t.names));
  if (t.names[t.names.length - 1] !== "T.U. Teaching Hospital")
    throw new Error(`deep selection failed: ${t.names}`);

  /* compression: EARTH + … + last two visible; middle hidden; no overflow */
  const laddr = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Geographic scale ladder"]');
    const visible = [...nav.querySelectorAll("button, [aria-current]")]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => el.textContent.trim());
    return {
      visible,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      navRight: nav.getBoundingClientRect().right,
    };
  });
  console.log("  mobile ladder:", JSON.stringify(laddr));
  if (!laddr.visible.some((v) => v === "EARTH")) throw new Error("EARTH not one tap away");
  if (!laddr.visible.some((v) => v === "…")) throw new Error("compression ellipsis missing");
  if (laddr.visible.some((v) => v === "NEPAL")) throw new Error("middle rungs not compressed");
  if (laddr.overflow || laddr.navRight > 392) throw new Error("ladder overflows horizontally");
  await shot(page, "17-mobile-deep-trail-compressed");

  /* expand ancestors via …, then one-hand return: city → country → Earth */
  await page.evaluate(() => {
    [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
      .find((b) => b.getAttribute("aria-label") === "Show all geographic levels")?.click();
  });
  await sleep(600);
  await shot(page, "18-mobile-trail-expanded");
  const tapCrumb = (name) =>
    page.evaluate((n) => {
      const b = [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
        .find((x) => x.getAttribute("aria-label") === `View ${n}`);
      if (!b) return false;
      b.click();
      return true;
    }, name);
  if (!(await tapCrumb("Kathmandu"))) throw new Error("KATHMANDU crumb missing after expand");
  await sleep(3000);
  let st = await getState(page);
  if (st.stage !== "live") throw new Error("city crumb left the map");
  t = await getTrail(page);
  if (t.names[t.names.length - 1] !== "Kathmandu") throw new Error(`truncation failed: ${t.names}`);
  await shot(page, "19-mobile-crumb-kathmandu");
  if (!(await tapCrumb("Nepal"))) throw new Error("NEPAL crumb missing");
  await sleep(3200);
  const mz = await page.evaluate(() => ({
    zoom: window.__SB_MAP.getZoom(),
    territory: window.__SB_TERRITORY ?? null,
  }));
  if (mz.zoom < 5.4 || mz.zoom > 8.6 || mz.territory !== "cn-nepal")
    throw new Error(`Nepal fit wrong on mobile: ${JSON.stringify(mz)}`);
  await shot(page, "20-mobile-crumb-nepal");
  if (!(await tapCrumb("Earth"))) throw new Error("EARTH crumb missing");
  await waitFor(page, () => {
    const s = window.__SB_STATE, cam = window.__SB_CAM;
    return s.stage === "off" && !s.journey && cam && !cam.travelling && cam.dist > 4.5;
  }, 45000, "3D return");
  await sleep(1300);
  await shot(page, "21-mobile-earth-return");
  console.log("PASS FLOW H — mobile deep trail, compression, one-hand return to Earth");

  console.log("PAGE ERRORS:", errors.length ? errors : "none");
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
