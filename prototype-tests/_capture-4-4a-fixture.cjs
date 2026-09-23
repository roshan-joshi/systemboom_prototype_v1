#!/usr/bin/env node
/* PHASE 4.4-A — OWNER FIXTURE ADD-ON evidence (capture only; changes no product code or data).
     node prototype-tests/_capture-4-4a-fixture.cjs        (dev server on :3210)
   Raw runtime frames of the NORMAL My World page (/world) with the Celestial owner/dev enable
   path on (`?celestial=1`, stored locally — the committed default stays OFF, D-3), plus the one
   harness frame the owner's list needs (a visitor opening Giulia's person card), a measurement
   file for the phone action row (P0-6 is documented, not fixed), and a labelled contact sheet.
   Output: prototype-evidence/phase-4.4a-truth/owner-fixture/ (gitignored). */
const fs = require("fs");
const path = require("path");
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "prototype-evidence/phase-4.4a-truth/owner-fixture");
fs.mkdirSync(OUT, { recursive: true });
const HOST = "http://localhost:3210";
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const shots = [];
const metrics = {};

async function world(page, vp, theme) {
  await page.setViewport(vp);
  await page.goto(`${HOST}/world?celestial=1&theme=${theme}`, { waitUntil: "networkidle2" });
  await page.evaluate((t) => { try { localStorage.setItem("sb-theme", t); } catch {} }, theme);
  await page.goto(`${HOST}/world?celestial=1&theme=${theme}`, { waitUntil: "networkidle2" });
  await sleep(1100);
}
async function snap(page, name, label, clipSel, pad = 0) {
  const file = path.join(OUT, `${name}.png`);
  if (clipSel) {
    const box = await page.$eval(clipSel, (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height }; });
    await page.screenshot({ path: file, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2 }, captureBeyondViewport: true });
  } else {
    await page.screenshot({ path: file });
  }
  shots.push({ file, label });
}
async function toMoment(page, id, offset = 80) {
  for (let i = 0; i < 6 && !(await page.$(`[data-sb-moment='${id}']`)); i++) { await page.evaluate(() => document.querySelector("[data-sb-load-more]")?.click()); await sleep(450); }
  await page.evaluate((mid, off) => { const m = document.querySelector(`[data-sb-moment='${mid}']`); m.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, id, offset);
  await sleep(450);
}
async function openWho(page, id) {
  await page.evaluate((mid) => document.querySelector(`[data-sb-moment='${mid}'] [data-sb-resonance-who]`)?.click(), id);
  await sleep(600);
}
const M = (id) => `[data-sb-moment='${id}']`;

/* The action row at phone widths: is every control inside the viewport? (P0-6 — documented only) */
async function actionRow(page, id) {
  return page.$eval(M(id), (m) => {
    const vw = window.innerWidth;
    const pick = (sel) => { const e = m.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), visible: r.width > 0 && r.right <= vw + 1 && r.left >= -1 }; };
    return {
      viewport: vw,
      respond: pick("[data-sb-respond]"),
      boom: pick("[data-sb-express]"),
      resonate: pick("[data-sb-resonate]"),
      more: pick("button[aria-label=More]"),
      summary: pick("[data-sb-resonance-summary]"),
      docOverflow: document.documentElement.scrollWidth > vw + 1,
    };
  });
}

(async () => {
  const { browser, page } = await launch();
  try {
    /* ---- the identity gate, then enter as the demo identity (a fresh profile has no session) ---- */
    await page.setViewport(DESKTOP);
    await page.goto(`${HOST}/world?celestial=1&theme=dark`, { waitUntil: "networkidle2" });
    await page.waitForSelector("[role=dialog]", { timeout: 15000 });
    await sleep(700);
    await snap(page, "g-0-identity-gate", "Giulia — the identity gate reads the one demo identity: “Enter as Giulia Bianchi”");
    await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Giulia Bianchi/.test(x.textContent))?.click());
    await sleep(1200);

    /* ---- DESKTOP DARK — 0 · 1 · several · rich · expanded ---- */
    await world(page, DESKTOP, "dark");
    await toMoment(page, "m-rain");
    await snap(page, "d-dark-1-zero-resonance", "Desktop dark — E: m-rain (Giulia) with ZERO Resonance", M("m-rain"), 12);
    await toMoment(page, "m-activity");
    await snap(page, "d-dark-2-one-resonance", "Desktop dark — D: m-activity (Sofia) with ONE Resonance: Luca → Jupiter", M("m-activity"), 12);
    await toMoment(page, "m-sameage");
    await snap(page, "d-dark-3-several-mixed", "Desktop dark — A: m-sameage (Marco), 5 people · Venus ×2, Sun, Saturn, Moon", M("m-sameage"), 12);
    await toMoment(page, "m-meal");
    await snap(page, "d-dark-3b-small-multi", "Desktop dark — B: m-meal (Luca), 3 people · Mercury ×2, Comet", M("m-meal"), 12);
    await toMoment(page, "m-video");
    await snap(page, "d-dark-4-rich-constellation", "Desktop dark — C: m-video (Sofia), 8 people across six meanings", M("m-video"), 12);
    await openWho(page, "m-video");
    await snap(page, "d-dark-5-expanded-rich", "Desktop dark — C expanded: who resonated, by meaning, in canonical order", M("m-video"), 12);
    await world(page, DESKTOP, "dark");
    await toMoment(page, "m-sameage");
    await openWho(page, "m-sameage");
    await snap(page, "d-dark-5b-expanded-A", "Desktop dark — A expanded: Giulia → Venus (You), Sofia → Venus, Elena → Sun, Luca → Saturn, Chiara → Moon", M("m-sameage"), 12);
    await page.setViewport({ ...DESKTOP, height: 950 });
    await world(page, DESKTOP, "dark");
    await page.evaluate(() => { document.querySelector("[data-sb-sheet]")?.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); });
    await sleep(400);
    await snap(page, "d-dark-6-feed-first-screen", "Desktop dark — the normal feed's first screen: 5 · 3 · 0 · 1 side by side");

    /* ---- DESKTOP LIGHT — multi-person + expanded ---- */
    await world(page, DESKTOP, "light");
    await toMoment(page, "m-sameage");
    await snap(page, "d-light-1-multi-person", "Desktop light — A: m-sameage, 5 people, mixed Resonance", M("m-sameage"), 12);
    await openWho(page, "m-sameage");
    await snap(page, "d-light-2-expanded", "Desktop light — A expanded participation", M("m-sameage"), 12);
    await toMoment(page, "m-video");
    await openWho(page, "m-video");
    await snap(page, "d-light-3-expanded-rich", "Desktop light — C expanded: eight people, six meanings", M("m-video"), 12);

    /* ---- PHONES — multi-person Moment, the constellation, the action row ---- */
    for (const [w, h] of [[390, 844], [360, 800]]) {
      for (const theme of ["dark", "light"]) {
        await world(page, phone(w, h), theme);
        await toMoment(page, "m-sameage", 64);
        metrics[`${w}-${theme}-m-sameage`] = await actionRow(page, "m-sameage");
        await snap(page, `p${w}-${theme}-1-multi-person`, `Phone ${w} ${theme} — A: m-sameage, 5 people (action row as shipped — P0-6 not fixed)`);
        if (theme === "dark") {
          await openWho(page, "m-sameage");
          await page.evaluate(() => document.querySelector("[data-sb-moment='m-sameage'] [data-sb-resonance-who-panel]")?.scrollIntoView({ block: "center" }));
          await sleep(300);
          await snap(page, `p${w}-${theme}-2-expanded`, `Phone ${w} ${theme} — A expanded participation`);
          await world(page, phone(w, h), theme);
          await toMoment(page, "m-video", 64);
          metrics[`${w}-${theme}-m-video`] = await actionRow(page, "m-video");
          await snap(page, `p${w}-${theme}-3-rich`, `Phone ${w} ${theme} — C: m-video, 8 people, with its responses and Boom`);
        }
      }
    }

    /* ---- GIULIA (formerly Maya) ---- */
    await world(page, DESKTOP, "dark");
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await snap(page, "g-1-profile-desktop-dark", "Giulia — her World: profile, real photo inside the Life Ring (owner view)");
    await snap(page, "g-2-photo-life-ring", "Giulia — the profile photo with the Life Ring (crop)", "[data-sb-hero] [data-sb-ring]", 24);
    await toMoment(page, "m-panorama");
    await snap(page, "g-3-authored-moment", "Giulia — an authored Moment (m-panorama): six people resonated on HER Moment", M("m-panorama"), 12);
    await openWho(page, "m-panorama");
    await snap(page, "g-3b-authored-expanded", "Giulia — her Moment's participation, as the owner sees it", M("m-panorama"), 12);
    await toMoment(page, "m-sameage");
    await openWho(page, "m-sameage");
    await snap(page, "g-4-appearance-in-resonance", "Giulia — appearing in another person's Resonance (Marco's Moment): Venus, “You”", "[data-sb-moment='m-sameage'] [data-sb-resonance-who-panel]", 10);
    await toMoment(page, "m-meeting");
    await snap(page, "g-5-appearance-in-responses", "Giulia — present in a Meeting and answering in its responses (m-meeting, Elena)", M("m-meeting"), 12);
    await world(page, phone(360, 800), "light");
    await snap(page, "g-6-profile-360-light", "Giulia — profile at 360, light");
    /* the one harness frame: a VISITOR (Luca) opens Giulia's person card from Search */
    await page.setViewport(DESKTOP);
    await page.goto(`${HOST}/style-lab/social?harness=0&viewer=visitor&theme=dark&celestial=1`, { waitUntil: "networkidle2" });
    await sleep(1000);
    await page.evaluate(() => document.querySelector("button[aria-label=Search]")?.click());
    await sleep(300);
    await page.evaluate(() => { const i = document.querySelector("input[type=search]"); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Giulia"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(500);
    await page.evaluate(() => document.querySelector("[data-sb-search-person='u-demo-001']")?.click());
    await sleep(700);
    await snap(page, "g-7-personcard-as-visitor", "Giulia — her person card as a visitor (Luca) sees it: photo, band only. NOTE: card says Not connected while the hero says Friends — PRE-EXISTING (owner-centric relationship map), not fixed here");
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, "phone-action-row-metrics.json"), JSON.stringify(metrics, null, 2));

  /* contact sheet — an index of the raw frames above, nothing retouched */
  const sharp = require(path.join(ROOT, "node_modules/sharp"));
  const W = 420, cols = 4, labelH = 64, pad = 14;
  const tiles = [];
  for (const s of shots) {
    const meta = await sharp(s.file).metadata();
    const h = Math.round((meta.height / meta.width) * W);
    const cellH = Math.min(h, 620);
    const buf = await sharp(s.file).resize({ width: W }).extract({ left: 0, top: 0, width: W, height: cellH }).png().toBuffer();
    const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const lines = [""];
    for (const wd of s.label.split(" ")) { if ((lines[lines.length - 1] + " " + wd).length > 58) lines.push(wd); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + wd).trim(); }
    const label = Buffer.from(`<svg width="${W}" height="${labelH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#10141c"/>${lines.slice(0, 3).map((l, i) => `<text x="8" y="${18 + i * 18}" font-family="Helvetica, Arial" font-size="13" fill="#e8ecf2">${esc(l)}</text>`).join("")}</svg>`);
    tiles.push({ buf, cellH, label });
  }
  const rows = Math.ceil(tiles.length / cols);
  const rowH = [];
  for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.cellH)) + labelH);
  const sheetW = cols * W + (cols + 1) * pad;
  const sheetH = rowH.reduce((a, b) => a + b + pad, pad) + 60;
  const composites = [{ input: Buffer.from(`<svg width="${sheetW}" height="60" xmlns="http://www.w3.org/2000/svg"><text x="${pad}" y="38" font-family="Helvetica, Arial" font-size="24" font-weight="700" fill="#e8ecf2">SYSTEMBOOM 4.4-A owner fixture — Italian social circle + multi-person Celestial Resonance (unretouched)</text></svg>`), left: 0, top: 0 }];
  let y = 60 + pad;
  tiles.forEach((t, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    if (c === 0 && i > 0) y += rowH[r - 1] + pad;
    const x = pad + c * (W + pad);
    composites.push({ input: t.buf, left: x, top: y });
    composites.push({ input: t.label, left: x, top: y + t.cellH });
  });
  await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: "#0a0d14" } }).composite(composites).png().toFile(path.join(OUT, "OWNER-FIXTURE-CONTACT-SHEET.png"));
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(shots.map((s) => ({ file: path.basename(s.file), label: s.label })), null, 2));
  console.log(`captured ${shots.length} frames → ${OUT}`);
})();
