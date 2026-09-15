const { launch, sleep, waitFor, shot, ready, clickButton } = require("./lib");
(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);
  await clickButton(page, "Earth");
  await waitFor(page, () => window.__SB_STATE.mode === "focus" && window.__SB_CAM && !window.__SB_CAM.travelling, 25000, "focus");
  await sleep(1500);
  // steer to Asia and click it
  let clicked = false;
  for (let it = 0; it < 30; it++) {
    const ok = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => x.getAttribute("aria-label") === "View Asia" && !x.closest("nav"),
      );
      if (!b) return false;
      if (parseFloat(getComputedStyle(b.parentElement).opacity || "0") < 0.25) return false;
      b.click();
      return true;
    });
    if (ok) { clicked = true; break; }
    const s = await page.evaluate(() => (window.__SB_SLOTS || {})["ct-asia"]);
    const dx = s ? Math.max(-170, Math.min(170, (720 - s.x) * 0.45)) : -130;
    const dy = s ? Math.max(-100, Math.min(100, (450 - s.y) * 0.45)) : 0;
    await page.mouse.move(720, 450); await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(720 + dx * i / 8, 450 + dy * i / 8); await sleep(25); }
    await page.mouse.up(); await sleep(1000);
  }
  if (!clicked) { const s = await page.evaluate(() => (window.__SB_SLOTS||{})["ct-asia"]); const cam = await page.evaluate(() => window.__SB_CAM); throw new Error("never clicked Asia; slot=" + JSON.stringify(s) + " cam=" + JSON.stringify(cam)); }
  await waitFor(page, () => window.__SB_STATE.stage === "live" && !!window.__SB_MAP, 45000, "live");
  await sleep(4500);
  // replicate the suite's manual wheel path
  for (let i = 0; i < 16; i++) {
    const z = await page.evaluate(() => window.__SB_MAP.getZoom());
    if (z >= 12.5) break;
    const kp = await page.evaluate(() => {
      const p = window.__SB_MAP.latLngToContainerPoint([27.727, 85.328]);
      return { x: p.x, y: p.y };
    });
    await page.mouse.move(Math.max(20, Math.min(1420, kp.x)), Math.max(120, Math.min(880, kp.y)));
    await page.mouse.wheel({ deltaY: -240 });
    await sleep(500);
  }
  await sleep(1600);
  console.log("zoom now:", await page.evaluate(() => window.__SB_MAP.getZoom()));
  const pt = await page.evaluate(() => {
    const p = window.__SB_MAP.latLngToContainerPoint([27.7358, 85.3305]);
    return { x: p.x, y: p.y };
  });
  console.log("TUTH screen pt:", pt);
  // what element is at that point?
  const el = await page.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    return e ? { tag: e.tagName, cls: String(e.className).slice(0, 80) } : null;
  }, pt);
  console.log("element at point:", el);
  await page.mouse.click(pt.x, pt.y);
  await sleep(2500);
  const state = await page.evaluate(() => ({
    trail: window.__SB_TRAIL,
    aside: document.querySelector("aside")?.innerText.replace(/\n/g, " | ").slice(0, 140) ?? null,
  }));
  console.log("after click:", JSON.stringify(state, null, 1));
  await shot(page, "probe-click");
  console.log("errors:", errors);
  await browser.close();
})().catch((e) => { console.error("PROBE FAIL:", e.message); process.exit(1); });
