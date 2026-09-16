/* SYSTEMBOOM — R3.8 EMOTION HORIZON: evidence.
   01 the R3.7 picker (before) · 02–03 the Emotion Horizon light/dark · 04 at 360 · 05 one mascot
   + six cores, no labels · 06–09 previews (Care/Laugh/Wow/Support) · 10 the core entering the
   chamber · 11 the chamber locked · 12 core → lens · 13 the six selected lenses · 14–15 the
   Emotion Atlas · 16 Human Pulse with the new lenses · 17 Support on a serious Moment · 18 reduced
   motion · rs-* one real-speed capture per Quick Six (real compositor frames, real ms).
     node prototype-tests/_capture-r3-8.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-8-emotion-horizon";
const R37 = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-7-gravity-expressions";
const P = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r38";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const IDS = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const NAME = { care: "CARE", joy: "JOY", laugh: "LAUGH", wow: "WOW", celebrate: "CELEBRATE", support: "SUPPORT" };
const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };
const RAIN = "[data-sb-moment='m-rain']";
const INK = "#0B0E14";

async function open(page, w, h, { theme = "dark", dpr = 2, pulse = "" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("viewer", "maya");
  if (pulse) u.searchParams.set("pulse", pulse);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await sleep(450);
}
const clipOf = (page, sel, pad = 14) =>
  page.evaluate((s, p) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 }; }, sel, pad);
const rectOf = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, sel);
const toMoment = async (page, id = "m-rain") => { await page.evaluate((m) => document.querySelector(`[data-sb-moment='${m}']`)?.scrollIntoView({ block: "center" }), id); await sleep(260); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page, id = "m-rain") => { await toMoment(page, id); if (!(await page.$("[data-sb-expression-deck]"))) { const b = await centre(page, `[data-sb-moment='${id}'] [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(420); } };
/** the horizon at rest: no core previewed, the vessel dormant (or owned) */
async function settle(page) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.mouse.move(2, 2, { steps: 4 });
  await sleep(320);
}
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const label = (w, h, lines, { size = 11, color = "#8FA3BC" } = {}) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines.map((l, i) => `<text x="0" y="${size + 2 + i * (size + 5)}" fill="${i === 0 ? "#C9D8EA" : color}" font-family="-apple-system,system-ui,sans-serif" font-size="${size}" font-weight="${i === 0 ? 700 : 500}" letter-spacing="${i === 0 ? 1.4 : 0.3}">${esc(l)}</text>`).join("")}</svg>`);
async function strip(file, frames, { title, note, frameH = 200 } = {}) {
  const items = [];
  let x = 20;
  const W = 20 + frames.reduce((n, f) => n + Math.round((frameH * f.w) / f.h) + 16, 0) + 4;
  for (const f of frames) {
    const w = Math.round((frameH * f.w) / f.h);
    items.push({ input: await sharp(f.buf).resize(w, frameH).png().toBuffer(), left: x, top: 62 });
    items.push({ input: label(w + 40, 40, [f.cap, f.sub ?? ""], { size: 10 }), left: x, top: 62 + frameH + 8 });
    x += w + 16;
  }
  items.unshift({ input: label(Math.max(W - 40, 300), 56, [title, note ?? ""], { size: 12 }), left: 20, top: 8 });
  await sharp({ create: { width: Math.max(W, 340), height: 62 + frameH + 62, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, file));
}
const pick = (frames, t) => { let best = frames[0], d = Infinity; for (const f of frames) { const dd = Math.abs(f.ts - t); if (dd < d) { d = dd; best = f; } } return best; };
const cutFrame = async (f, region, vw) => {
  const meta = await sharp(Buffer.from(f.data, "base64")).metadata();
  const k = meta.width / vw;
  const left = Math.max(0, Math.round(region.x * k)), top = Math.max(0, Math.round(region.y * k));
  const width = Math.min(meta.width - left, Math.round(region.width * k)), height = Math.min(meta.height - top, Math.round(region.height * k));
  return { buf: await sharp(Buffer.from(f.data, "base64")).extract({ left, top, width, height }).png().toBuffer(), w: width, h: height };
};

(async () => {
  const { browser, page, errors } = await launch();

  /* ===== 01 — R3.7, before ===== */
  {
    const before = await sharp(path.join(R37, "02-gravity-dock-dark.png")).png().toBuffer();
    const m = await sharp(before).metadata();
    await sharp({ create: { width: m.width + 40, height: m.height + 70, channels: 4, background: INK } })
      .composite([{ input: label(m.width, 50, ["01 — R3.7, BEFORE: six mascot seats on a ground", "The owner's verdict: still an old reaction menu — six repeated copies of the same mascot."], { size: 12 }), left: 20, top: 8 }, { input: before, left: 20, top: 60 }])
      .png().toFile(path.join(EV, "01-r37-before.png"));
  }

  /* ===== 02–03 — the Emotion Horizon ===== */
  for (const [file, theme] of [["02-r38-emotion-horizon-light.png", "light"], ["03-r38-emotion-horizon-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await settle(page);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-deck]", 22) });
  }

  /* ===== 04 — 360 ===== */
  await open(page, 360, 800, { theme: "dark" });
  await openDeck(page);
  await settle(page);
  {
    const sy = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(EV, "04-r38-360.png"), clip: { x: 0, y: sy, width: 360, height: 800 } });
  }

  /* ===== 05 — one mascot, six cores, no labels ===== */
  {
    const items = [{ input: await sharp(`${P}/neutral-chamber-lg.webp`).resize(200, 200).png().toBuffer(), left: 262, top: 60 }];
    let x = 40;
    for (const id of IDS) { items.push({ input: await sharp(`${P}/${id}-core.webp`).resize(72, 72).png().toBuffer(), left: x, top: 280 }); x += 108; }
    items.unshift({ input: label(700, 50, ["05 — ONE MASCOT, SIX CORES (no labels)", "The vessel with its dormant chamber; the six emotions as lit core objects. Can each be identified?"], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 724, height: 380, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "05-one-mascot-six-cores.png"));
  }

  /* ===== 06–09 — previews ===== */
  for (const [n, id] of [[6, "care"], [7, "laugh"], [8, "wow"], [9, "support"]]) {
    await open(page, 1440, 1000, { theme: n % 2 ? "light" : "dark" });
    await openDeck(page);
    await settle(page);
    const c = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.move(c.x, c.y, { steps: 3 });
    await sleep(300);
    await page.screenshot({ path: path.join(EV, `${String(n).padStart(2, "0")}-${id}-preview.png`), clip: await clipOf(page, "[data-sb-expression-deck]", 22) });
  }

  /* ===== 10–12 + rs-* — the commit, real compositor frames ===== */
  let lensFrames = null;
  for (const [n, id] of IDS.entries()) {
    await open(page, 960, 820, { theme: "dark", dpr: 2 });
    await openDeck(page);
    await settle(page);
    const deck = await rectOf(page, "[data-sb-expression-deck]");
    const ctrl = await rectOf(page, `${RAIN} [data-sb-express]`);
    const core = await rectOf(page, `[data-sb-expression-option='${id}']`);
    const all = { x: Math.max(0, Math.min(deck.x, ctrl.x) - 12), y: Math.max(0, deck.y - 10), width: Math.max(deck.x + deck.width, ctrl.x + ctrl.width) - Math.min(deck.x, ctrl.x) + 24, height: ctrl.y + ctrl.height - deck.y + 22 };
    const frames = [];
    const sess = await page.createCDPSession();
    sess.on("Page.screencastFrame", async (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); try { await sess.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* closed */ } });
    await sess.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await sleep(200);
    const mark = frames.length;
    // tap without a hover first (the phone path): the core enters a dormant vessel
    await page.mouse.click(core.x + core.width / 2, core.y + core.height / 2);
    await sleep(120 + TEMPO[id] + 700);
    await sess.send("Page.stopScreencast");
    await sess.detach();
    const t1 = frames[mark]?.ts ?? frames[0].ts;
    const tLens = t1 + 120 + Math.round(TEMPO[id] * 0.5);
    if (id === "care") {
      const enter = [];
      for (const t of [12, 45, 80, 112]) { const f = pick(frames, t1 + t); const c = await cutFrame(f, { x: deck.x - 10, y: deck.y - 10, width: deck.width + 20, height: deck.height + 20 }, 960); enter.push({ ...c, cap: `+${Math.round(f.ts - t1)}ms`, sub: "" }); }
      await strip("10-core-entering-chamber.png", enter, { title: "10 — THE CORE ENTERS THE CHAMBER (Care)", note: "From the tap: the Care core leaves the horizon and accelerates into the vessel's opening while the other five recede (≈120ms). Real compositor frames.", frameH: 220 });
      const lock = pick(frames, t1 + 210);
      const lc = await cutFrame(lock, { x: deck.x - 10, y: deck.y - 10, width: deck.width + 20, height: deck.height + 20 }, 960);
      await strip("11-chamber-locked.png", [{ ...lc, cap: "LOCKED", sub: `+${Math.round(lock.ts - t1)}ms — the shell absorbs the core; the vessel performs Care` }], { title: "11 — CHAMBER LOCKED", note: "The core is inside; the shell contracts and releases, the vessel gestures, the fuse answers, one Boom Pulse.", frameH: 260 });
    }
    if (id === "celebrate") lensFrames = { frames, t1, tLens, all };
    const after = frames.filter((f) => f.ts >= t1 - 5);
    const wanted = [0, 40, 90, 130, 180, 250, 320, 400, 480, 600];
    const rs = [];
    for (const t of wanted) { const f = pick(after, t1 + t); const c = await cutFrame(f, all, 960); rs.push({ ...c, cap: `+${Math.round(f.ts - t1)}ms`, sub: "" }); }
    await strip(`rs-${String(n + 1).padStart(2, "0")}-${id}-real-speed.png`, rs, { title: `${NAME[id]} — REAL SPEED`, note: `Real compositor frames, no slowdown: core → chamber (≈120ms) → the vessel performs (tempo ${TEMPO[id]}ms) → the chamber collapses into the Boom Lens → still.`, frameH: 200 });
  }

  /* ===== 12 — core → lens ===== */
  if (lensFrames) {
    const { frames, t1, tLens, all } = lensFrames;
    const picks = [[tLens + 10, "START — the chamber leaves the vessel"], [tLens + 90, "MID — one object, shrinking toward the control"], [tLens + 185, "END — landed as the Boom Lens"], [tLens + 520, "SETTLED — still"]];
    const items = [];
    for (const [t, cap] of picks) { const f = pick(frames, t); const c = await cutFrame(f, all, 960); items.push({ ...c, cap, sub: `+${Math.round(f.ts - t1)}ms from tap (Celebrate)` }); }
    await strip("12-core-to-lens.png", items, { title: "12 — CORE → LENS", note: "Large core → mascot chamber → Boom Lens: the same object changing scale. Same shape, colour, material and orientation.", frameH: 230 });
  }

  /* ===== 13 — the six selected lenses ===== */
  {
    const items = [];
    let x = 20;
    for (const id of IDS) {
      await open(page, 1440, 1000, { theme: "dark", dpr: 3 });
      await openDeck(page);
      await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
      await sleep(1300);
      const f = path.join(TMP, `sel-${id}.png`);
      await page.screenshot({ path: f, clip: await clipOf(page, `${RAIN} [data-sb-express]`, 6) });
      items.push({ input: await sharp(f).resize(132, 132).png().toBuffer(), left: x, top: 60 });
      x += 148;
    }
    items.unshift({ input: label(900, 50, ["13 — SELECTED, SIX LENSES (no labels)", "The chamber-shaped Boom Lens beside Respond for each of the six. Read primarily by the core."], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 20 + 148 * 6 + 4, height: 212, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "13-selected-six-lenses.png"));
  }

  /* ===== 14–15 — the Emotion Atlas ===== */
  for (const [file, theme] of [["14-emotion-atlas-light.png", "light"], ["15-emotion-atlas-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
    await sleep(600);
    await page.evaluate(() => { document.querySelector("[data-sb-expression-library] [role=radiogroup]").scrollTop = 0; (document.activeElement instanceof HTMLElement) && document.activeElement.blur(); });
    await page.mouse.move(2, 2, { steps: 4 });
    await sleep(300);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-library]", 18) });
  }

  /* ===== 16 — Human Pulse with the new lenses ===== */
  await open(page, 390, 844, { theme: "dark", dpr: 3, pulse: "100mixed" });
  await toMoment(page);
  await page.screenshot({ path: path.join(EV, "16-human-pulse-new-lenses.png"), clip: await clipOf(page, `${RAIN} [data-sb-presence]`, 10) });

  /* ===== 17 — Support on a serious Moment ===== */
  await open(page, 390, 844, { theme: "dark" });
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); }
  await toMoment(page, "m-1983");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(420);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(1300);
  await page.screenshot({ path: path.join(EV, "17-serious-support.png"), clip: await clipOf(page, "[data-sb-moment='m-1983']", 6) });

  /* ===== 18 — reduced motion ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000, { theme: "dark" });
  await openDeck(page);
  await sleep(40);
  await page.screenshot({ path: path.join(EV, "18-reduced-motion.png"), clip: await clipOf(page, "[data-sb-expression-deck]", 22) });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  console.log("page errors:", errors);
  console.log("R3.8 evidence complete →", EV);
  await browser.close();
})();
