#!/usr/bin/env node
/* CELESTIAL — Solar Observatory LIGHT-MODE correction evidence (before / after, same frames).
     node prototype-tests/celestial-light-capture.cjs <before|after>     (dev server on :3210)
   Output: prototype-evidence/celestial-light-correction/<label>/
   Frames: desktop light closed · open · focus · page top · controls-hidden · a tall full-page
   view (top bar + hero + Moments + Life panels) · 390 and 360 open · dark closed/open as
   Deep Cosmos regression guards. Then (after the "after" run) builds the comparison board. */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");
const path = require("path");

const label = process.argv[2] || "after";
const ROOT = "prototype-evidence/celestial-light-correction";
const OUT = path.join(ROOT, label);
const HOST = "http://localhost:3210";
const RAIN = "[data-sb-moment='m-rain']";
const HIDE_CONTROLS = "[data-sb-resonate],[data-sb-resonance-summary],[data-sb-resonate-field]{visibility:hidden!important}";

async function imagesReady(page) {
  await page.waitForFunction(() => [...document.querySelectorAll("img")]
    .filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; })
    .every((i) => i.complete && (i.naturalWidth > 0 || !i.src)), { timeout: 20000 }).catch(() => {});
  await sleep(250);
}
async function go(page, vp, { theme = "light", q = "&resonance=16" } = {}) {
  await page.setViewport(vp);
  await page.goto(`${HOST}/style-lab/social?theme=${theme}&celestial=1&harness=0${q}`, { waitUntil: "networkidle2" });
  await sleep(900);
  await imagesReady(page);
}
async function toRain(page, offset) {
  await page.evaluate((o) => { const m = document.querySelector("[data-sb-moment='m-rain']"); window.scrollTo(0, scrollY + m.getBoundingClientRect().top - o); }, offset);
  await sleep(500);
  await imagesReady(page);
}
async function openField(page) {
  await page.click(`${RAIN} [data-sb-resonate]`);
  await sleep(1200);
}
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const DESK = { width: 1440, height: 950, deviceScaleFactor: 1 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { browser, page } = await launch();
  try {
    await go(page, DESK);
    await page.screenshot({ path: `${OUT}/light-desktop-top.png` });
    await toRain(page, 96);
    await page.screenshot({ path: `${OUT}/light-desktop-closed.png` });
    await openField(page);
    await page.screenshot({ path: `${OUT}/light-desktop-open.png` });

    /* Focus with REAL keys (a programmatic focus after a mouse open never shows :focus-visible):
       Enter opens the Field, focus enters on Venus, ArrowRight ×5 walks canonical order to Saturn. */
    await go(page, DESK);
    await toRain(page, 96);
    await page.focus(`${RAIN} [data-sb-resonate]`);
    await page.keyboard.press("Enter");
    await sleep(1200);
    for (let i = 0; i < 5; i++) { await page.keyboard.press("ArrowRight"); await sleep(140); }
    await page.evaluate(() => document.querySelector("[data-sb-celestial-field]")?.scrollIntoView({ block: "center" }));
    await sleep(700);
    await page.screenshot({ path: `${OUT}/light-desktop-focus.png` });

    /* The viewer's own orbit ring (the viewer holds Saturn) — its contrast on pearl. */
    await go(page, DESK, { q: "&resonance=mine" });
    await toRain(page, 96);
    await page.screenshot({ path: `${OUT}/light-desktop-mine.png` });

    await go(page, DESK);
    await page.addStyleTag({ content: HIDE_CONTROLS });
    await toRain(page, 96);
    await page.screenshot({ path: `${OUT}/light-desktop-nocontrols.png` });

    // The full page: a tall viewport from the top — top bar, hero, Moments, Life panels together.
    await go(page, { width: 1440, height: 2100, deviceScaleFactor: 1 });
    await page.screenshot({ path: `${OUT}/light-fullpage.png` });

    for (const [w, h] of [[390, 844], [360, 800]]) {
      await go(page, phone(w, h));
      await toRain(page, 110);
      await page.screenshot({ path: `${OUT}/light-${w}-closed.png` });
      await openField(page);
      await page.evaluate(() => document.querySelector("[data-sb-celestial-field]")?.scrollIntoView({ block: "center" }));
      await sleep(500);
      await page.screenshot({ path: `${OUT}/light-${w}-open.png` });
    }

    // Deep Cosmos regression guards — must be unchanged by a light-mode pass.
    await go(page, DESK, { theme: "dark" });
    await toRain(page, 96);
    await page.screenshot({ path: `${OUT}/dark-desktop-closed.png` });
    await openField(page);
    await page.screenshot({ path: `${OUT}/dark-desktop-open.png` });
    console.log(`captured → ${OUT}`);
  } finally {
    await browser.close();
  }

  /* The before/after board, once both sides exist. */
  const B = path.join(ROOT, "before");
  const A = path.join(ROOT, "after");
  if (!fs.existsSync(A) || !fs.existsSync(B)) return;
  const sharp = require("sharp");
  const BG = "#101318";
  const cap = (t, w) => sharp(Buffer.from(`<svg width="${w}" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="34" fill="${BG}"/><text x="12" y="23" font-family="Helvetica, Arial" font-size="15" fill="#d7deeb">${t.replace(/&/g, "&amp;")}</text></svg>`)).png().toBuffer();
  const cell = async (f, t, w) => {
    const img = await sharp(f).resize({ width: w }).png().toBuffer();
    const m = await sharp(img).metadata();
    return sharp({ create: { width: w, height: m.height + 34, channels: 4, background: BG } }).composite([{ input: await cap(t, w), top: 0, left: 0 }, { input: img, top: 34, left: 0 }]).png().toBuffer();
  };
  const row = async (cells) => {
    const ms = await Promise.all(cells.map((c) => sharp(c).metadata()));
    const h = Math.max(...ms.map((m) => m.height));
    let x = 0;
    const comps = cells.map((c, i) => { const o = { input: c, top: 0, left: x }; x += ms[i].width + 14; return o; });
    return sharp({ create: { width: x - 14, height: h, channels: 4, background: BG } }).composite(comps).png().toBuffer();
  };
  const FRAMES = [
    ["light-desktop-closed.png", "desktop closed", 700], ["light-desktop-open.png", "desktop open", 700],
    ["light-desktop-focus.png", "desktop keyboard focus (Saturn)", 700], ["light-desktop-mine.png", "viewer's own orbit (Saturn)", 700],
    ["light-desktop-top.png", "page top", 700],
    ["light-desktop-nocontrols.png", "Celestial controls hidden", 700], ["light-fullpage.png", "full page (tall viewport)", 700],
    ["light-390-open.png", "390 open", 340], ["light-360-open.png", "360 open", 340],
    ["dark-desktop-closed.png", "DARK closed — regression guard", 700], ["dark-desktop-open.png", "DARK open — regression guard", 700],
  ];
  const rows = [];
  for (const [f, t, w] of FRAMES) {
    if (w === 340 && f.includes("360")) continue;
    if (w === 340) {
      rows.push(await row([
        await cell(path.join(B, "light-390-open.png"), "BEFORE — 390 open", 340), await cell(path.join(A, "light-390-open.png"), "AFTER — 390 open", 340),
        await cell(path.join(B, "light-360-open.png"), "BEFORE — 360 open", 340), await cell(path.join(A, "light-360-open.png"), "AFTER — 360 open", 340),
      ]));
      continue;
    }
    rows.push(await row([await cell(path.join(B, f), `BEFORE — ${t}`, w), await cell(path.join(A, f), `AFTER — ${t}`, w)]));
  }
  const ms = await Promise.all(rows.map((r) => sharp(r).metadata()));
  const W = Math.max(...ms.map((m) => m.width)) + 36;
  let y = 64;
  const comps = [{ input: await sharp(Buffer.from(`<svg width="${W}" height="52" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="52" fill="${BG}"/><text x="18" y="34" font-family="Helvetica, Arial" font-size="21" fill="#f0f4fb">SOLAR OBSERVATORY — LIGHT-MODE CORRECTION · before vs after (same frames)</text></svg>`)).png().toBuffer(), top: 0, left: 0 }];
  rows.forEach((r, i) => { comps.push({ input: r, top: y, left: 18 }); y += ms[i].height + 14; });
  const out = path.join(ROOT, "SOLAR-OBSERVATORY-BEFORE-AFTER.png");
  await sharp({ create: { width: W, height: y + 18, channels: 4, background: BG } }).composite(comps).png().toFile(out);
  console.log(out);
})().catch((e) => { console.error(e); process.exitCode = 1; });
