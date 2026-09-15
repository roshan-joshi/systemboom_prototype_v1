/** PHASE 1.10B CORRECTION — mobile: tap a NAME → map; gesture ≠ click. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-10b-final";
const { launch, sleep, waitFor, getState, shot, ready } = require("./lib");

(async () => {
  const { browser, page, errors } = await launch({ mobile: true });
  await ready(page);

  // focus Earth via nav
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Earth")?.click();
  });
  await waitFor(page, () => window.__SB_STATE.mode === "focus" && window.__SB_CAM && !window.__SB_CAM.travelling, 30000, "Earth focus");
  await sleep(2000);

  // find ASIA label; drag STARTING ON the label must NOT navigate
  const findAsia = () =>
    page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => x.getAttribute("aria-label") === "View Asia" && !x.closest("nav"),
      );
      if (!b) return null;
      const o = parseFloat(getComputedStyle(b.parentElement).opacity || "0");
      if (o < 0.25) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  let pos = null;
  for (let i = 0; i < 14 && !pos; i++) {
    pos = await findAsia();
    if (pos) break;
    const t = await page.evaluateHandle(() => document.querySelector("canvas"));
    await page.touchscreen.touchStart(195, 420);
    for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(195 - k * 20, 420); await sleep(30); }
    await page.touchscreen.touchEnd();
    await t.dispose();
    await sleep(1200);
  }
  if (!pos) throw new Error("ASIA not discoverable on mobile");

  /* gesture ≠ click: a drag that starts on the label rotates, never travels */
  await page.touchscreen.touchStart(pos.x, pos.y);
  for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(pos.x - k * 14, pos.y + k * 4); await sleep(35); }
  await page.touchscreen.touchEnd();
  await sleep(1500);
  let st = await getState(page);
  if (st.stage !== "off" || (st.journey && st.journey.kind === "descend"))
    throw new Error("drag on a label started a journey (gesture must not equal click)");
  await shot(page, "23-mobile-drag-not-click");
  console.log("PASS MOBILE gesture≠click — drag from a label only rotates");

  /* forgiving tap on the name → travel to the Asia map */
  pos = null;
  for (let i = 0; i < 14 && !pos; i++) {
    pos = await findAsia();
    if (pos) break;
    await page.touchscreen.touchStart(195, 420);
    for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(195 + k * 18, 420); await sleep(30); }
    await page.touchscreen.touchEnd();
    await sleep(1200);
  }
  if (!pos) throw new Error("ASIA lost after drag");
  await page.touchscreen.tap(pos.x, pos.y);
  await waitFor(page, () => window.__SB_STATE.stage === "live" && !!window.__SB_MAP, 45000, "map live");
  await sleep(4200);
  const mi = await page.evaluate(() => {
    const c = window.__SB_MAP.getCenter();
    return { lat: c.lat, lng: c.lng, zoom: window.__SB_MAP.getZoom(), territory: window.__SB_TERRITORY ?? null };
  });
  console.log("  mobile asia map:", JSON.stringify(mi));
  if (mi.zoom > 4.8) throw new Error(`Asia not extent-framed on mobile: z=${mi.zoom}`);
  await shot(page, "24-mobile-asia-map");
  console.log("PASS MOBILE tap ASIA → map extent");

  /* in-map NEPAL target tap → Nepal fit + boundary, still in map */
  const target = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".sb-geo-target")].find(
      (x) => x.textContent.trim().toUpperCase() === "NEPAL",
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  });
  if (!target) throw new Error("no in-map NEPAL target on mobile");
  await page.touchscreen.tap(target.x, target.y);
  await sleep(3800);
  st = await getState(page);
  if (st.stage !== "live") throw new Error("in-map target left the map");
  const mi2 = await page.evaluate(() => {
    const c = window.__SB_MAP.getCenter();
    return {
      lat: c.lat, lng: c.lng, zoom: window.__SB_MAP.getZoom(),
      territory: window.__SB_TERRITORY ?? null,
      boundary: !!document.querySelector("path.sb-territory"),
    };
  });
  console.log("  mobile nepal map:", JSON.stringify(mi2));
  if (mi2.territory !== "cn-nepal" || !mi2.boundary) throw new Error("Nepal boundary missing on mobile");
  if (mi2.zoom < 5.5 || mi2.zoom > 8.6) throw new Error(`Nepal fit wrong on mobile: z=${mi2.zoom}`);
  await shot(page, "25-mobile-nepal-map");
  console.log("PASS MOBILE in-map NEPAL target → country fit + boundary");

  /* EARTH crumb (always one tap away) exits to 3D facing the map view */
  await page.evaluate(() => {
    [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
      .find((b) => b.getAttribute("aria-label") === "View Earth")?.click();
  });
  await waitFor(page, () => {
    const s = window.__SB_STATE, cam = window.__SB_CAM;
    return s.stage === "off" && !s.journey && cam && !cam.travelling && cam.dist > 4.5;
  }, 45000, "3D return");
  const facing = await page.evaluate(() => window.__SB_FACING.current);
  console.log("  mobile facing after exit:", JSON.stringify(facing));
  if (Math.abs(facing.lat - mi2.lat) > 10 || Math.abs(facing.lon - mi2.lng) > 14)
    throw new Error("mobile EARTH exit faced an unrelated hemisphere");
  await sleep(1400);
  await shot(page, "26-mobile-earth-return");
  console.log("PASS MOBILE EARTH crumb → 3D facing the map view");

  console.log("PAGE ERRORS:", errors.length ? errors : "none");
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
