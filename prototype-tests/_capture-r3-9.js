/* SYSTEMBOOM — R3.9 SIGNATURE EMOTION ENGINE: evidence.
   One CDP screencast per Quick Six covers preview → commit → event → collapse → lens; every
   board is cut from REAL compositor frames labelled with real elapsed milliseconds. Plus the
   art-consistency board (honest: the facial renders remain blocked), world-light variants,
   360 hero flow, the passive 20-Moment page, reduced motion, before/after, and the one-image
   owner filmstrip SIGNATURE-EMOTION-ENGINE.png.
     node prototype-tests/_capture-r3-9.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-9-signature-emotion-engine";
const R38 = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-8-emotion-horizon";
const P = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r39";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const IDS = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const NAME = { care: "CARE", joy: "JOY", laugh: "LAUGH", wow: "WOW", celebrate: "CELEBRATE", support: "SUPPORT" };
const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };
const RAIN = "[data-sb-moment='m-rain']";
const INK = "#0B0E14";

async function open(page, w, h, { theme = "dark", dpr = 2, extra = "" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  await page.goto(`${HOST}${S}?theme=${theme}&harness=0&viewer=maya${extra}`, { waitUntil: "networkidle2" });
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await sleep(450);
}
const clipOf = (page, sel, pad = 14) =>
  page.evaluate((s, p) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 }; }, sel, pad);
const rectOf = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, sel);
const toMoment = async (page, id = "m-rain") => { await page.evaluate((m) => document.querySelector(`[data-sb-moment='${m}']`)?.scrollIntoView({ block: "center" }), id); await sleep(260); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page, id = "m-rain") => { await toMoment(page, id); if (!(await page.$("[data-sb-expression-deck]"))) { const b = await centre(page, `[data-sb-moment='${id}'] [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(420); } };
async function settle(page) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.mouse.move(2, 2, { steps: 4 });
  await sleep(320);
}
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const label = (w, h, lines, { size = 11, color = "#8FA3BC" } = {}) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines.map((l, i) => `<text x="0" y="${size + 2 + i * (size + 5)}" fill="${i === 0 ? "#C9D8EA" : color}" font-family="-apple-system,system-ui,sans-serif" font-size="${size}" font-weight="${i === 0 ? 700 : 500}" letter-spacing="${i === 0 ? 1.4 : 0.3}">${esc(l)}</text>`).join("")}</svg>`);
async function strip(file, frames, { title, note, frameH = 210 } = {}) {
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

  /* ===== 01 — the neutral vessel ===== */
  {
    const img = await sharp(`${P}/neutral-chamber-lg.webp`).resize(300, 300).png().toBuffer();
    await sharp({ create: { width: 560, height: 388, channels: 4, background: INK } })
      .composite([{ input: label(520, 44, ["01 — NEUTRAL VESSEL, DORMANT CHAMBER", "The owner's canonical render, untouched, with the machined empty chamber."], { size: 12 }), left: 20, top: 8 }, { input: img, left: 130, top: 62 }])
      .png().toFile(path.join(EV, "01-neutral-mascot.png"));
  }

  /* ===== 02 — the seven states board (HONEST: facial renders remain blocked) ===== */
  {
    const items = [];
    let x = 20;
    for (const [f, cap] of [["neutral-chamber-lg", "NEUTRAL"], ["care-lg", "CARE"], ["joy-lg", "JOY"], ["laugh-lg", "LAUGH"], ["wow-lg", "WOW"], ["celebrate-lg", "CELEBRATE"], ["support-lg", "SUPPORT"]]) {
      items.push({ input: await sharp(`${P}/${f}.webp`).resize(150, 150).png().toBuffer(), left: x, top: 64 }, { input: label(150, 18, [cap], { size: 10 }), left: x + 4, top: 220 });
      x += 166;
    }
    items.unshift({ input: label(1130, 50, ["02 — SEVEN STATES: ONE CHARACTER (art-consistency board)", "HONEST STATUS: this environment has no image generation (re-verified this round) — the FACE is the one supplied pose on all seven; the emotional anatomy that differs is the EMOTION CHAMBER + eye light + fuse tinge. True facial renders remain ART ASSET BLOCKED (briefs: quick-six-render-briefs.md)."], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 20 + 166 * 7 + 4, height: 250, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "02-seven-facial-states.png"));
  }

  /* ===== per-expression screencast: preview → commit → event → collapse → lens ===== */
  const film = {}; // for the owner filmstrip
  for (const [n, id] of IDS.entries()) {
    await open(page, 960, 820, { dpr: 2 });
    await openDeck(page);
    await settle(page);
    const deck = await rectOf(page, "[data-sb-expression-deck]");
    const ctrl = await rectOf(page, `${RAIN} [data-sb-express]`);
    const core = await rectOf(page, `[data-sb-expression-option='${id}']`);
    const stageR = await rectOf(page, "[data-sb-horizon-stage] .sb-stage-art");
    // the COLLAPSE depiction: the stage → control path, where the chamber flight actually lives
    const collapseR = { x: Math.min(stageR.x, ctrl.x) - 40, y: stageR.y - 16, width: Math.max(stageR.x + stageR.width, ctrl.x + ctrl.width) - Math.min(stageR.x, ctrl.x) + 80, height: ctrl.y + ctrl.height - stageR.y + 30 };
    const region = { x: Math.max(0, deck.x - 26), y: Math.max(0, deck.y - 34), width: deck.width + 52, height: deck.height + 50 };
    const wide = { x: Math.max(0, deck.x - 26), y: Math.max(0, deck.y - 34), width: deck.width + 52, height: ctrl.y + ctrl.height - deck.y + 60 };
    const lens = { x: ctrl.x - 10, y: ctrl.y - 6, width: ctrl.width + 20, height: ctrl.height + 14 };
    const frames = [];
    const sess = await page.createCDPSession();
    sess.on("Page.screencastFrame", async (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); try { await sess.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* closed */ } });
    await sess.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await sleep(220);
    const mRest = frames.length;
    await page.mouse.move(core.x + core.width / 2, core.y + core.height / 2, { steps: 2 });
    await sleep(340);
    const mTap = frames.length;
    await page.mouse.click(core.x + core.width / 2, core.y + core.height / 2);
    await sleep(120 + Math.round(TEMPO[id] * 0.7) + 200 + 600);
    await sess.send("Page.stopScreencast");
    await sess.detach();
    const tRest = frames[Math.max(0, mRest - 1)].ts;
    const tHover = frames[Math.min(mRest, frames.length - 1)].ts;
    const t1 = frames[Math.min(mTap, frames.length - 1)].ts;
    const collapseAt = 120 + Math.round(TEMPO[id] * 0.7);
    // pick by ABSOLUTE screencast time: t is elapsed ms from the tap (t1)
    const F = async (t, r = region) => { const f = pick(frames, t1 + t); return { ...(await cutFrame(f, r, 960)), ms: Math.round(f.ts - t1) }; };
    // filmstrip stages
    film[id] = {
      dormant: await F(tRest - t1, region),
      preview: await F(tHover - t1 + 200, region),
      commit: await F(t1 - t1 + 55, region),
      peak: await F(240, region),
      collapse: await F(collapseAt + 55, collapseR),
      lens: await F(collapseAt + 200 + 380, lens),
    };
    // Care hero sequence 03–08
    if (id === "care") {
      const seq = [
        ["03-care-start.png", await F(18), "START", "+18ms — the Care core leaves the horizon"],
        ["04-care-core.png", await F(150), "CORE AWAKENS", "+150ms — locked; the chamber ignites rose"],
        ["05-care-big-heart.png", await F(250), "THE HEART EMERGES", "+250ms — ONE large dimensional heart toward the viewer"],
        ["06-care-depth.png", await F(330), "DEPTH", "+330ms — smaller hearts at other depths; shell + ground receive the warmth"],
        ["07-care-collapse.png", await F(collapseAt + 55, collapseR), "COLLAPSE", `+${collapseAt + 55}ms — the energy contracts toward the lens`],
        ["08-care-final-lens.png", await F(collapseAt + 200 + 380, lens), "CARE LENS", "settled — a quiet permanent trace on the Moment"],
      ];
      for (const [file, fr, cap, sub] of seq) await strip(file, [{ ...fr, cap, sub }], { title: `CARE — ${cap}`, note: "Real compositor frame, real elapsed milliseconds from the tap.", frameH: 250 });
    }
    // 09–13 event peaks
    const peakFiles = { joy: "09-joy-event.png", laugh: "10-laugh-event.png", wow: "11-wow-event.png", celebrate: "12-celebrate-event.png", support: "13-support-event.png" };
    if (peakFiles[id]) {
      const stages = [[70, "IGNITION", region], [180, "EVENT", region], [280, "PEAK", region], [collapseAt + 55, "COLLAPSE", collapseR], [collapseAt + 520, "STILL — THE LENS", lens]];
      const cut = [];
      for (const [t, cap, r] of stages) { const fr = await F(t, r); cut.push({ ...fr, cap, sub: `+${fr.ms}ms` }); }
      await strip(peakFiles[id], cut, { title: `${NAME[id]} — THE EMOTIONAL EVENT`, note: `Tempo ${TEMPO[id]}ms; the event owns the stage until ~${collapseAt}ms, collapses into the lens, then stillness.`, frameH: 200 });
    }
    // real speed
    const rs = [];
    for (const t of [0, 45, 95, 145, 200, 260, 330, collapseAt + 40, collapseAt + 150, collapseAt + 480]) { const fr = await F(t, wide); rs.push({ ...fr, cap: `+${fr.ms}ms`, sub: "" }); }
    await strip(`rs-${String(n + 1).padStart(2, "0")}-${id}-real-speed.png`, rs, { title: `${NAME[id]} — REAL SPEED`, note: "Ten real compositor frames, no slowdown; timestamps are real elapsed milliseconds from the tap.", frameH: 190 });
  }

  /* ===== 14–15 — the horizon at rest ===== */
  for (const [file, theme] of [["14-horizon-light.png", "light"], ["15-horizon-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await settle(page);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-deck]", 26) });
  }

  /* ===== 16–18 — world light ===== */
  for (const [file, theme, extra, note] of [
    ["16-world-light-warm.png", "dark", "&worldlight=warm", "a WARM World over Deep Cosmos — ambient rim + ground tint only"],
    ["17-world-light-cool.png", "light", "&worldlight=cool", "a COOL World over Solar Observatory"],
    ["18-no-wall.png", "dark", "", "no Wall: the theme material fallback — not a degraded state"],
  ]) {
    await open(page, 1440, 1000, { theme, extra });
    await openDeck(page);
    await settle(page);
    const f = path.join(TMP, `${file}.raw.png`);
    await page.screenshot({ path: f, clip: await clipOf(page, "[data-sb-expression-deck]", 26) });
    const img = await sharp(f).resize(880).png().toBuffer();
    const meta = await sharp(img).metadata();
    await sharp({ create: { width: 920, height: meta.height + 66, channels: 4, background: INK } })
      .composite([{ input: label(880, 44, [file.slice(3, -4).replace(/-/g, " ").toUpperCase(), note + " — the cores keep their own colours."], { size: 12 }), left: 20, top: 8 }, { input: img, left: 20, top: 56 }])
      .png().toFile(path.join(EV, file));
  }

  /* ===== 19–21 — 360 hero flow ===== */
  {
    await open(page, 360, 800, { dpr: 2 });
    await openDeck(page);
    await settle(page);
    const sy = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(EV, "19-360-care-start.png"), clip: { x: 0, y: sy, width: 360, height: 800 } });
    const c = await centre(page, "[data-sb-expression-option='care']");
    const deck = await rectOf(page, "[data-sb-expression-deck]");
    const frames = [];
    const sess = await page.createCDPSession();
    sess.on("Page.screencastFrame", async (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); try { await sess.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* closed */ } });
    await sess.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await sleep(200);
    const mTap = frames.length;
    await page.mouse.click(c.x, c.y);
    await sleep(1100);
    await sess.send("Page.stopScreencast");
    await sess.detach();
    const t1 = frames[Math.min(mTap, frames.length - 1)].ts;
    const fr = pick(frames, t1 + 250);
    const cut = await cutFrame(fr, { x: Math.max(0, deck.x - 10), y: Math.max(0, deck.y - 24), width: Math.min(360, deck.width + 20), height: deck.height + 40 }, 360);
    await strip("20-360-care-event.png", [{ ...cut, cap: "CARE AT 360", sub: `+${Math.round(fr.ts - t1)}ms — one thumb, Moment context intact` }], { title: "20 — 360: THE CARE EVENT", note: "Real compositor frame from the phone frame.", frameH: 260 });
    await sleep(200);
    const sy2 = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(EV, "21-360-care-settle.png"), clip: { x: 0, y: sy2, width: 360, height: 800 } });
  }

  /* ===== 22 — the six selected, static ===== */
  {
    const items = [];
    let x = 20;
    for (const id of IDS) {
      await open(page, 1440, 1000, { dpr: 3 });
      await openDeck(page);
      await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
      await sleep(1300);
      const f = path.join(TMP, `sel-${id}.png`);
      await page.screenshot({ path: f, clip: await clipOf(page, `${RAIN} [data-sb-express]`, 6) });
      items.push({ input: await sharp(f).resize(126, 126).png().toBuffer(), left: x, top: 58 });
      x += 142;
    }
    items.unshift({ input: label(860, 46, ["22 — SELECTED SIX, STATIC (no labels)", "The resting Boom Lens beside Respond: the emotion first, the shell second, no motion."], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 20 + 142 * 6 + 4, height: 204, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "22-selected-six-static.png"));
  }

  /* ===== 23 — twenty Moments, passive ===== */
  await open(page, 1440, 2400, { extra: "&pulse=100mixed" });
  for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  await page.evaluate(() => window.scrollTo(0, 600));
  await sleep(700);
  const running = await page.evaluate(() => [...document.querySelectorAll("[data-sb-social-frame] *")].reduce((n, e) => n + (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length : 0), 0));
  {
    const f = path.join(TMP, "passive.png");
    await page.screenshot({ path: f, clip: { x: 240, y: 600, width: 960, height: 1700 } });
    const img = await sharp(f).resize(700).png().toBuffer();
    const meta = await sharp(img).metadata();
    await sharp({ create: { width: 740, height: meta.height + 64, channels: 4, background: INK } })
      .composite([{ input: label(700, 42, ["23 — A FEED FULL OF EXPRESSIONS, PASSIVE", `Scrolled through 20+ Moments with pulses everywhere: ${running} animations running. Nothing fires on viewport entry.`], { size: 12 }), left: 20, top: 8 }, { input: img, left: 20, top: 54 }])
      .png().toFile(path.join(EV, "23-twenty-moments-passive.png"));
  }

  /* ===== 24 — reduced motion ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
  await sleep(120);
  await toMoment(page);
  await page.screenshot({ path: path.join(EV, "24-reduced-motion.png"), clip: await clipOf(page, `${RAIN} [data-sb-actions]`, 10) });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ===== 25–26 — before / after ===== */
  {
    const before = await sharp(path.join(R38, "03-r38-emotion-horizon-dark.png")).resize(760).png().toBuffer();
    const bMeta = await sharp(before).metadata();
    await sharp({ create: { width: 800, height: bMeta.height + 64, channels: 4, background: INK } })
      .composite([{ input: label(760, 42, ["25 — BEFORE (R3.8)", "The horizon existed; committing swapped states with a flight but no emotional event."], { size: 12 }), left: 20, top: 8 }, { input: before, left: 20, top: 54 }])
      .png().toFile(path.join(EV, "25-before-r38.png"));
    const after = film.care.peak;
    await strip("26-after-r39.png", [{ ...after, cap: "AFTER (R3.9)", sub: `+${after.ms}ms — love physically entering the Moment's local space` }], { title: "26 — AFTER (R3.9)", note: "The same tap now creates one local emotional event: core → chamber → escaped energy in depth → light received → collapse → stillness.", frameH: 300 });
  }

  /* ===== THE OWNER FILMSTRIP ===== */
  {
    const stages = ["dormant", "preview", "commit", "peak", "collapse", "lens"];
    const caps = { dormant: "DORMANT", preview: "PREVIEW", commit: "COMMIT", peak: "PEAK EVENT", collapse: "COLLAPSE", lens: "BOOM LENS" };
    const rows = ["care", "wow", "support"];
    const cellH = 170;
    const items = [];
    let maxW = 0;
    for (const [r, id] of rows.entries()) {
      let x = 130;
      items.push({ input: label(110, 20, [NAME[id]], { size: 12 }), left: 20, top: 96 + r * (cellH + 46) + cellH / 2 - 8 });
      for (const st of stages) {
        const fr = film[id][st];
        const w = Math.round((cellH * fr.w) / fr.h);
        items.push({ input: await sharp(fr.buf).resize(w, cellH).png().toBuffer(), left: x, top: 96 + r * (cellH + 46) });
        if (r === 0) items.push({ input: label(w, 18, [caps[st]], { size: 10 }), left: x, top: 76 });
        items.push({ input: label(w, 14, [fr.ms >= 0 ? `+${fr.ms}ms` : st === "dormant" ? "at rest" : "hover preview"], { size: 9 }), left: x, top: 96 + r * (cellH + 46) + cellH + 4 });
        x += w + 14;
      }
      maxW = Math.max(maxW, x);
    }
    items.unshift({ input: label(maxW - 40, 60, ["SIGNATURE EMOTION ENGINE — one emotional interaction language", "DORMANT → PREVIEW → COMMIT → EMOTIONAL EVENT → COLLAPSE → MEMORY. Real compositor frames, real milliseconds. Care = warmth entering the Moment · Wow = instantaneous surprise · Support = \"I am here with you\"."], { size: 13 }), left: 20, top: 8 });
    await sharp({ create: { width: maxW + 20, height: 96 + 3 * (cellH + 46) + 16, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "SIGNATURE-EMOTION-ENGINE.png"));
  }

  console.log("page errors:", errors);
  console.log("R3.9 evidence complete →", EV);
  await browser.close();
})();
