#!/usr/bin/env node
/* PHASE 4.4-A — owner-review evidence (capture only; changes no product code or data).
     node prototype-tests/_capture-4-4a.cjs        (dev server on :3210)
   Raw runtime frames of the fixed states, unretouched, plus one labelled contact sheet that only
   indexes them. Output: prototype-evidence/phase-4.4a-truth/owner-review/ (gitignored). */
const fs = require("fs");
const path = require("path");
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "prototype-evidence/phase-4.4a-truth/owner-review");
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3210/style-lab/social";
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const shots = [];

async function open(page, vp, theme, q = "") {
  await page.setViewport(vp);
  await page.goto(`${BASE}?theme=${theme}&harness=0${q}`, { waitUntil: "networkidle2" });
  await sleep(1000);
}
async function snap(page, name, label, clipSel) {
  const file = path.join(OUT, `${name}.png`);
  if (clipSel) {
    const el = await page.$(clipSel);
    await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file });
  }
  shots.push({ file, label });
}
const click = (page, js) => page.evaluate(js);
async function setValue(page, sel, v) {
  await page.evaluate((s, val) => {
    const el = document.querySelector(s);
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, sel, v);
  await sleep(150);
}
const press = (page, text, within = "body") => page.evaluate((t, w) => { const b = [...(document.querySelector(w) || document.body).querySelectorAll("button,[role^=menuitem]")].find((x) => x.textContent.replace(/\s+/g, " ").trim() === t); b?.click(); return !!b; }, text, within);
async function ensure(page, id) {
  for (let i = 0; i < 6 && !(await page.$(`[data-sb-moment='${id}']`)); i++) { await click(page, () => document.querySelector("[data-sb-load-more]")?.click()); await sleep(450); }
}

(async () => {
  const { browser, page } = await launch();
  try {
    /* desktop — owner Moment + Respond, dark and light */
    for (const theme of ["dark", "light"]) {
      await open(page, DESKTOP, theme);
      await click(page, () => { const m = document.querySelector("[data-sb-moment='m-rain']"); m.scrollIntoView({ block: "start" }); window.scrollBy(0, -90); m.querySelector("[data-sb-respond]").click(); });
      await sleep(600);
      await snap(page, `d-${theme}-owner-moment-respond`, `Desktop ${theme} — owner Moment, Respond open (cursor in composer)`);
    }
    /* desktop — View as public, and its paused stranger's menu */
    await open(page, DESKTOP, "light");
    await press(page, "View as public");
    await sleep(700);
    await click(page, () => { document.querySelector("[data-sb-sheet]").scrollIntoView({ block: "start" }); window.scrollBy(0, -70); });
    await sleep(400);
    await snap(page, "d-light-view-as-public", "Desktop light — View as public: stream via the public stand-in, pause stated");
    await click(page, () => document.querySelector("[data-sb-moment='m-rain'] button[aria-label=More]").click());
    await sleep(300);
    await snap(page, "d-light-view-as-public-menu", "Desktop light — View as public: the owner's own Moment shows a stranger's menu, paused");

    /* edit — before / after same date / after moved date */
    await open(page, DESKTOP, "light");
    await click(page, () => document.querySelector("[data-sb-moment='m-rain']").scrollIntoView({ block: "center" }));
    await sleep(300);
    await snap(page, "e1-edit-before", "Edit — before: m-rain at 07:40 (minute precision)", "[data-sb-moment='m-rain']");
    await click(page, () => document.querySelector("[data-sb-moment='m-rain'] button[aria-label=More]").click()); await sleep(250);
    await press(page, "Edit", "[data-sb-moment='m-rain']"); await sleep(700);
    await setValue(page, "#sb-composer-text", "Thamel smelled of rain and juniper before the shops opened. Still raining at noon.");
    await press(page, "Save", "[data-sb-composer] footer"); await sleep(1400);
    await click(page, () => document.querySelector("[data-sb-moment='m-rain']").scrollIntoView({ block: "center" })); await sleep(300);
    await snap(page, "e2-edit-after-same-date", "Edit — after, same date: still 07:40, marked edited (no fabricated 12:00)", "[data-sb-moment='m-rain']");
    await click(page, () => document.querySelector("[data-sb-moment='m-rain'] button[aria-label=More]").click()); await sleep(250);
    await press(page, "Edit", "[data-sb-moment='m-rain']"); await sleep(700);
    await setValue(page, "[data-sb-composer] input[type=date]", "2026-09-05");
    await press(page, "Save", "[data-sb-composer] footer"); await sleep(1400);
    await ensure(page, "m-rain");
    await click(page, () => document.querySelector("[data-sb-moment='m-rain']").scrollIntoView({ block: "center" })); await sleep(300);
    await snap(page, "e3-edit-moved-date", "Edit — date moved to 05 SEP: day precision, no clock, “shared 10 sep 2026” kept", "[data-sb-moment='m-rain']");

    /* discard during posting — the prompt inside the posting window, then the feed */
    await open(page, DESKTOP, "light");
    await click(page, () => document.querySelector("[data-sb-open-composer]").click()); await sleep(700);
    await setValue(page, "#sb-composer-text", "Discard me — I should never appear.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(120);
    await snap(page, "x1-posting", "Discard — Post pressed: posting in progress, body inert");
    await press(page, "Cancel", "[data-sb-composer] footer");
    await sleep(200);
    await snap(page, "x2-discard-prompt-during-posting", "Discard — Cancel inside the posting window: the pending post is cancelled, the prompt asks");
    await press(page, "Discard", "[data-sb-composer] footer");
    await sleep(1800);
    await click(page, () => { document.querySelector("[data-sb-sheet]").scrollIntoView({ block: "start" }); window.scrollBy(0, -70); });
    await sleep(300);
    await snap(page, "x3-feed-after-discard", "Discard — 1.8 s later (past the 900 ms delay): the feed has no such Moment");

    /* pre-birth refusal */
    await open(page, DESKTOP, "light");
    await click(page, () => document.querySelector("[data-sb-open-composer]").click()); await sleep(700);
    await setValue(page, "#sb-composer-text", "A memory from before I was born?");
    await setValue(page, "[data-sb-composer] input[type=date]", "1985-06-01");
    await sleep(200);
    await snap(page, "c1-pre-birth-refusal", "Composer — a date before the owner's birth is refused with the Life rule's sentence; Post disabled");

    /* phones — Moment, conversation, reply composer, PersonCard above the thread */
    for (const [w, h] of [[390, 844], [360, 800]]) {
      await open(page, phone(w, h), "dark");
      await ensure(page, "m-forty");
      await click(page, () => { const m = document.querySelector("[data-sb-moment='m-forty']"); m.scrollIntoView({ block: "start" }); window.scrollBy(0, -60); });
      await sleep(400);
      await snap(page, `p${w}-1-moment`, `Phone ${w} — the 40-response Moment in the feed`);
      await click(page, () => document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]").click());
      await sleep(800);
      await snap(page, `p${w}-2-conversation`, `Phone ${w} — Respond: focused conversation, cursor in the composer`);
      await click(page, () => { const row = document.querySelector("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']"); [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply").click(); });
      await sleep(400);
      await page.keyboard.type("Replying from the phone thread.");
      await sleep(200);
      await snap(page, `p${w}-3-reply-composer`, `Phone ${w} — Reply: the reply composer under its response`);
      await page.keyboard.press("Enter");
      await sleep(900);
      await snap(page, `p${w}-4-reply-sent`, `Phone ${w} — the reply lands beneath its parent and is revealed`);
      await click(page, () => document.querySelector("[data-sb-conversation-surface] [data-sb-note-author]").click());
      await sleep(700);
      await snap(page, `p${w}-5-personcard-above`, `Phone ${w} — a person opened from the thread shows ABOVE it`);
    }
    /* phone light, one frame for theme coverage */
    await open(page, phone(390, 844), "light");
    await ensure(page, "m-forty");
    await click(page, () => { const m = document.querySelector("[data-sb-moment='m-forty']"); m.scrollIntoView({ block: "start" }); m.querySelector("[data-sb-respond]").click(); });
    await sleep(800);
    await snap(page, "p390-6-conversation-light", "Phone 390 light — the focused conversation");
  } finally {
    await browser.close();
  }

  /* contact sheet — an index of the raw frames above, nothing retouched */
  const sharp = require(path.join(ROOT, "node_modules/sharp"));
  const W = 420, cols = 4, labelH = 64, pad = 14;
  const tiles = [];
  for (const s of shots) {
    const img = sharp(s.file);
    const meta = await img.metadata();
    const h = Math.round((meta.height / meta.width) * W);
    const cellH = Math.min(h, 560);
    const buf = await sharp(s.file).resize({ width: W }).extract({ left: 0, top: 0, width: W, height: cellH }).png().toBuffer();
    const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const words = s.label.split(" ");
    const lines = [""];
    for (const wd of words) { if ((lines[lines.length - 1] + " " + wd).length > 58) lines.push(wd); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + wd).trim(); }
    const label = Buffer.from(`<svg width="${W}" height="${labelH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#10141c"/>${lines.slice(0, 3).map((l, i) => `<text x="8" y="${18 + i * 18}" font-family="Helvetica, Arial" font-size="13" fill="#e8ecf2">${esc(l)}</text>`).join("")}</svg>`);
    tiles.push({ buf, cellH, label });
  }
  const rows = Math.ceil(tiles.length / cols);
  const rowH = [];
  for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.cellH)) + labelH);
  const sheetW = cols * W + (cols + 1) * pad;
  const sheetH = rowH.reduce((a, b) => a + b + pad, pad) + 60;
  const composites = [{ input: Buffer.from(`<svg width="${sheetW}" height="60" xmlns="http://www.w3.org/2000/svg"><text x="${pad}" y="38" font-family="Helvetica, Arial" font-size="24" font-weight="700" fill="#e8ecf2">SYSTEMBOOM Phase 4.4-A — Moment + Respond truth · runtime evidence (unretouched frames)</text></svg>`), left: 0, top: 0 }];
  let y = 60 + pad;
  tiles.forEach((t, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    if (c === 0 && i > 0) y += rowH[r - 1] + pad;
    const x = pad + c * (W + pad);
    composites.push({ input: t.buf, left: x, top: y });
    composites.push({ input: t.label, left: x, top: y + t.cellH });
  });
  await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: "#0a0d14" } }).composite(composites).png().toFile(path.join(OUT, "PHASE-4.4A-CONTACT-SHEET.png"));
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(shots.map((s) => ({ file: path.basename(s.file), label: s.label })), null, 2));
  console.log(`captured ${shots.length} frames → ${OUT}`);
})();
