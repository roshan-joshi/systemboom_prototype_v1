#!/usr/bin/env node
/* CELESTIAL SOCIAL UNIVERSE — owner-review evidence.
   REAL-PAGE world captures (top nav · page background · profile hero · active Moment · Life
   panels, at the page top AND at feed scroll — the fix this pass exists for), the §69/§70
   page-level state set, a Celestial-controls-HIDDEN capture for the §74 acceptance question,
   the multi-person constellation scale states, the no-popularity A/B, and motion keyframes.
   No pixel changes after capture.
     node prototype-tests/celestial-universe-capture.cjs        (dev server on :3210)
   Output: prototype-evidence/celestial-social-universe/ */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");

const OUT = "prototype-evidence/celestial-social-universe";
const HOST = "http://localhost:3210";
const RAIN = "[data-sb-moment='m-rain']";
/* §74 — hide every Celestial CONTROL (never the page's own content) to judge the world alone. */
const HIDE_CONTROLS = "[data-sb-resonate],[data-sb-resonance-summary],[data-sb-resonate-field]{visibility:hidden!important}";

async function goto(page, { theme = "dark", q = "", lang = "en", harness = true } = {}) {
  await page.goto(`${HOST}/style-lab/social?theme=${theme}&celestial=1&lang=${lang}${harness ? "" : "&harness=0"}${q}`, { waitUntil: "networkidle2" });
  await sleep(800);
}
/* The earlier evidence round shipped a closed-light capture with the Moment photo missing —
   a lazy-load flake that polluted an owner judgment. Never capture before the images are real. */
async function imagesReady(page, scope = "body") {
  // Only images actually in the viewport: lazy images below the fold never start loading, so
  // waiting on every image on the page would only ever time out.
  await page.waitForFunction(
    (sel) => [...document.querySelector(sel)?.querySelectorAll("img") ?? []]
      .filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; })
      .every((i) => i.complete && (i.naturalWidth > 0 || !i.src)),
    { timeout: 20000 },
    scope,
  ).catch(() => {});
  await sleep(200);
}
/* Put the active Moment near the top third of the viewport: sticky nav above it, the Life
   panels beside it (desktop), the world around it. */
async function toRainPage(page, offset = 96) {
  await page.evaluate((o) => {
    const m = document.querySelector("[data-sb-moment='m-rain']");
    if (m) window.scrollTo(0, window.scrollY + m.getBoundingClientRect().top - o);
  }, offset);
  await sleep(450);
  await imagesReady(page);
}
async function toRain(page) {
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" }));
  await sleep(300);
  await imagesReady(page, "[data-sb-moment='m-rain']");
}
async function momentClip(page, path, pad = 24) {
  const clip = await page.$eval(RAIN, (e, p) => {
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.left - p), y: Math.max(0, window.scrollY + r.top - p), width: Math.min(window.innerWidth, r.width + p * 2), height: r.height + p * 2 };
  }, pad);
  await page.screenshot({ path, clip });
}
async function stripClip(page, path) {
  const clip = await page.$eval(`${RAIN} [data-sb-resonance-summary]`, (e) => {
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.left - 16), y: Math.max(0, window.scrollY + r.top - 16), width: Math.min(window.innerWidth, r.width + 32), height: r.height + 32 };
  });
  await page.screenshot({ path, clip });
}
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { browser, page } = await launch();
  try {
    /* ---- 1. THE WORLD — the real page, top and feed scroll, at every width ---- */
    for (const theme of ["dark", "light"]) {
      for (const [vp, key] of [[{ width: 1440, height: 950, deviceScaleFactor: 1 }, "desktop"], [{ width: 1920, height: 1080, deviceScaleFactor: 1 }, "1920"], [{ width: 1280, height: 800, deviceScaleFactor: 1 }, "1280"], [phone(390, 844), "390"], [phone(360, 800), "360"]]) {
        await page.setViewport(vp);
        await goto(page, { theme, q: "&resonance=16", harness: false });
        await imagesReady(page);
        await page.screenshot({ path: `${OUT}/world-${theme}-${key}-top.png` });
        await toRainPage(page, vp.width < 600 ? 72 : 96);
        await page.screenshot({ path: `${OUT}/world-${theme}-${key}-feed.png` });
        console.log(`world ${theme} ${key}`);
      }
      /* §74 — the same feed view with every Celestial control hidden */
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      await goto(page, { theme, q: "&resonance=16", harness: false });
      await page.addStyleTag({ content: HIDE_CONTROLS });
      await toRainPage(page);
      await page.screenshot({ path: `${OUT}/world-${theme}-desktop-nocontrols.png` });
      await page.setViewport(phone(390, 844));
      await goto(page, { theme, q: "&resonance=16", harness: false });
      await page.addStyleTag({ content: HIDE_CONTROLS });
      await toRainPage(page, 72);
      await page.screenshot({ path: `${OUT}/world-${theme}-390-nocontrols.png` });
      console.log(`world ${theme} no-controls`);
    }

    /* ---- 2. PAGE-LEVEL STATES (§69 / §70) — never only the component ---- */
    const PAGE_STATES = [["closed", ""], ["1p", "&resonance=1"], ["multi-8p", "&resonance=8"], ["all8-16p", "&resonance=16"], ["56p", "&resonance=50"]];
    for (const theme of ["dark", "light"]) {
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      for (const [key, q] of PAGE_STATES) {
        await goto(page, { theme, q, harness: false });
        await toRainPage(page);
        await page.screenshot({ path: `${OUT}/page-${theme}-${key}.png` });
      }
      await goto(page, { theme, q: "&resonance=16", harness: false });
      await toRainPage(page);
      await page.click(`${RAIN} [data-sb-resonate]`);
      await sleep(1100);
      await page.screenshot({ path: `${OUT}/page-${theme}-open.png` });
      await goto(page, { theme, q: "&resonance=16", harness: false });
      await toRainPage(page, 40);
      await page.click(`${RAIN} [data-sb-resonance-who]`);
      await sleep(500);
      await page.screenshot({ path: `${OUT}/page-${theme}-expanded.png` });
      await goto(page, { theme, q: "&resonance=mine", harness: false });
      await toRainPage(page);
      await page.screenshot({ path: `${OUT}/page-${theme}-change-before.png` });
      await page.click(`${RAIN} [data-sb-resonate]`);
      await sleep(900);
      await page.click(`${RAIN} [data-sb-resonance-item='venus-love']`);
      await sleep(1600);
      await toRainPage(page);
      await page.screenshot({ path: `${OUT}/page-${theme}-change-after.png` });
      for (const [w, h] of [[390, 844], [360, 800]]) {
        await page.setViewport(phone(w, h));
        await goto(page, { theme, q: "&resonance=16", harness: false });
        await toRainPage(page, 72);
        await page.evaluate(() => window.scrollBy(0, 260));
        await sleep(300);
        await page.screenshot({ path: `${OUT}/page-${theme}-${w}.png` });
      }
      console.log(`page states ${theme}`);
    }

    /* ---- 3. CONSTELLATION DETAIL (board B) ---- */
    const STATES = [["m0", ""], ["m1-1p", "&resonance=1"], ["m2-3p", "&resonance=3"], ["m3-8p", "&resonance=8"], ["m4-16p", "&resonance=16"], ["m5-56p", "&resonance=50"], ["m6-200same", "&resonance=200same"], ["m7-mine", "&resonance=mine"], ["m9-1204p", "&resonance=1000"], ["gateA-2v2m", "&resonance=2v2m"], ["gateB-45v2m", "&resonance=45v2m"]];
    for (const theme of ["dark", "light"]) {
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      for (const [key, q] of STATES) {
        await goto(page, { theme, q });
        await toRain(page);
        await momentClip(page, `${OUT}/state-${theme}-${key}.png`);
      }
      await goto(page, { theme, q: "&resonance=16" });
      await toRain(page);
      await page.click(`${RAIN} [data-sb-resonance-who]`);
      await sleep(450);
      await momentClip(page, `${OUT}/state-${theme}-expanded.png`);
      await goto(page, { theme, q: "&resonance=mine" });
      await toRain(page);
      await momentClip(page, `${OUT}/change-${theme}-before.png`);
      await page.click(`${RAIN} [data-sb-resonate]`);
      await sleep(900);
      await page.click(`${RAIN} [data-sb-resonance-item='venus-love']`);
      await sleep(1500);
      await toRain(page);
      await momentClip(page, `${OUT}/change-${theme}-after.png`);
      console.log(`states ${theme}`);
    }
    /* the gate-3 strips at 2x, side by side on the board */
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
    for (const theme of ["dark", "light"]) for (const [key, q] of [["gateA", "&resonance=2v2m"], ["gateB", "&resonance=45v2m"], ["all8-16", "&resonance=16"], ["all8-56", "&resonance=50"]]) {
      await goto(page, { theme, q });
      await toRain(page);
      await stripClip(page, `${OUT}/strip-${theme}-${key}.png`);
    }

    /* ---- 4. PHONE CONSTELLATION (§49) ---- */
    for (const theme of ["dark", "light"]) {
      for (const [w, h, key] of [[360, 800, "360"], [390, 844, "390"]]) {
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await goto(page, { theme, q: "&resonance=16" });
        await toRain(page);
        await momentClip(page, `${OUT}/phone-${theme}-${key}.png`, 8);
        await page.click(`${RAIN} [data-sb-resonance-who]`);
        await sleep(400);
        await momentClip(page, `${OUT}/phone-${theme}-${key}-expanded.png`, 8);
      }
      console.log(`phones ${theme}`);
    }

    /* ---- 5. MOTION KEYFRAMES (§73) — arrival, new type, expand ---- */
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
    await goto(page, { q: "&resonance=16" });
    await toRain(page);
    await stripClip(page, `${OUT}/motion-arrival-0-before.png`);
    await page.click("[data-sb-harness-arrive]");
    await sleep(70);
    await stripClip(page, `${OUT}/motion-arrival-1-70ms.png`);
    await sleep(160);
    await stripClip(page, `${OUT}/motion-arrival-2-230ms.png`);
    await sleep(400);
    await stripClip(page, `${OUT}/motion-arrival-3-settled.png`);
    await goto(page, { q: "&resonance=3" });
    await toRain(page);
    await stripClip(page, `${OUT}/motion-newtype-0-before.png`);
    await page.click("[data-sb-harness-arrive]");
    await sleep(90);
    await stripClip(page, `${OUT}/motion-newtype-1-90ms.png`);
    await sleep(500);
    await stripClip(page, `${OUT}/motion-newtype-2-settled.png`);
    await goto(page, { q: "&resonance=16" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(60);
    await momentClip(page, `${OUT}/motion-expand-1-60ms.png`);
    await sleep(300);
    await momentClip(page, `${OUT}/motion-expand-2-settled.png`);
    console.log("motion");

    /* ---- 6. LOCALES (spot) ---- */
    for (const lang of ["ne", "ru", "zh-Hans"]) {
      await goto(page, { q: "&resonance=16", lang });
      await toRain(page);
      await stripClip(page, `${OUT}/locale-${lang}.png`);
    }
    console.log("locales");
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
