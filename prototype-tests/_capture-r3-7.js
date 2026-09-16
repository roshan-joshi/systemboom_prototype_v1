/* SYSTEMBOOM — R3.7 GRAVITY EXPRESSIONS: evidence.
   01–02 the Gravity Dock (light/dark) · 03 at 360 · 04–05 the Expression Field · 06 the Emotion
   Chamber in layers · 07–12 preview → commit per expression (real compositor frames, real ms)
   · 13–15 core → lens start/mid/end · 16 the six selected states, no labels · 17 Support on a
   serious Moment · 18 reduced motion · rs-* one real-speed capture per Quick Six.
     node prototype-tests/_capture-r3-7.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-7-gravity-expressions";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r37";
const LAYERS = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r35";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const IDS = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const NAME = { care: "CARE", joy: "JOY", laugh: "LAUGH", wow: "WOW", celebrate: "CELEBRATE", support: "SUPPORT" };
const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };
const RAIN = "[data-sb-moment='m-rain']";
const INK = "#0B0E14";

async function open(page, w, h, { theme = "dark", dpr = 2 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("viewer", "maya");
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
/** every character in one uniform resting state: blur, walk the pointer across and OUT */
async function settle(page) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  const c = await centre(page, "[data-sb-expression-deck]");
  await page.mouse.move(c.x, c.y, { steps: 4 });
  await sleep(120);
  await page.mouse.move(2, c.y, { steps: 8 });
  await sleep(120);
  await page.mouse.move(2, 2, { steps: 4 });
  await sleep(300);
}
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const label = (w, h, lines, { size = 11, color = "#8FA3BC", bold = false } = {}) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines.map((l, i) => `<text x="0" y="${size + 2 + i * (size + 5)}" fill="${i === 0 ? "#C9D8EA" : color}" font-family="-apple-system,system-ui,sans-serif" font-size="${size}" font-weight="${bold || i === 0 ? 700 : 500}" letter-spacing="${i === 0 ? 1.4 : 0.3}">${esc(l)}</text>`).join("")}</svg>`);

/** a labelled strip of frames on ink */
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

(async () => {
  const { browser, page, errors } = await launch();

  /* ===== 01–02 — the Gravity Dock ===== */
  for (const [file, theme] of [["01-gravity-dock-light.png", "light"], ["02-gravity-dock-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await settle(page);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-deck]", 18) });
  }

  /* ===== 03 — 360 ===== */
  await open(page, 360, 800, { theme: "dark" });
  await openDeck(page);
  await settle(page);
  {
    const sy = await page.evaluate(() => scrollY);
    await page.screenshot({ path: path.join(EV, "03-gravity-dock-360.png"), clip: { x: 0, y: sy, width: 360, height: 800 } });
  }

  /* ===== 04–05 — the Expression Field ===== */
  for (const [file, theme] of [["04-expression-field-light.png", "light"], ["05-expression-field-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
    await sleep(600);
    await page.evaluate(() => { document.querySelector("[data-sb-expression-library] [role=radiogroup]").scrollTop = 0; (document.activeElement instanceof HTMLElement) && document.activeElement.blur(); });
    await page.mouse.move(2, 2, { steps: 4 });
    await sleep(300);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-library]", 14) });
  }

  /* ===== 06 — the Emotion Chamber in layers ===== */
  {
    const P = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";
    const stages = [["shell", "SHELL", "the owner's render, untouched"], ["aperture", "APERTURE", "lip · oblique bore wall · interior"], ["core", "CORE", "the heart, drawn deeper + larger"], ["final", "ASSEMBLED", "core under the wall's shadow; its light on the far wall"]];
    const items = [];
    let x = 20;
    for (const [k, t, sub] of stages) {
      const buf = await sharp(path.join(LAYERS, `layer-care-${k}.png`)).resize(300, 300).flatten({ background: k === "shell" ? "#1a1d24" : INK }).png().toBuffer();
      items.push({ input: buf, left: x, top: 64 }, { input: label(320, 40, [t, sub], { size: 10 }), left: x, top: 372 });
      x += 316;
    }
    // the assembled chamber at the sizes that matter
    const scales = [["care-md.webp", 68, "picker 68px"], ["care-lens-sm.webp", 36, "lens 36px"], ["care-lens-xs.webp", 22, "pulse 22px"]];
    let sx = 20;
    for (const [f, sz, cap] of scales) {
      const circ = /lens/.test(f) ? [{ input: Buffer.from(`<svg width="${sz}" height="${sz}"><circle cx="${sz / 2}" cy="${sz / 2}" r="${sz / 2}" fill="#fff"/></svg>`), blend: "dest-in" }] : [];
      items.push({ input: await sharp(`${P}/${f}`).resize(sz, sz).composite(circ).png().toBuffer(), left: sx + Math.round((68 - sz) / 2), top: 440 + Math.round((68 - sz) / 2) }, { input: label(120, 20, [cap], { size: 10 }), left: sx, top: 516 });
      sx += 120;
    }
    items.unshift({ input: label(1200, 56, ["06 — EMOTION CHAMBER, IN LAYERS (Care)", "A bore seen obliquely: the opening is offset inside the lip, so the shell wall is thick upper-left and thin lower-right; the core sits deeper and partly UNDER the wall. Composite over the untouched render — the R3.2 facial blocker still stands."], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 20 + 316 * 4 + 4, height: 550, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "06-emotion-chamber-cutaway.png"));
  }

  /* ===== 07–12 + 13–15 + rs-* — preview → commit, real compositor frames ===== */
  const pick = (frames, t) => { let best = frames[0], d = Infinity; for (const f of frames) { const dd = Math.abs(f.ts - t); if (dd < d) { d = dd; best = f; } } return best; };
  const cutFrame = async (f, region, scale) => {
    const meta = await sharp(Buffer.from(f.data, "base64")).metadata();
    const k = meta.width / scale.vw; // device px per css px in the screencast frame
    const left = Math.max(0, Math.round(region.x * k)), top = Math.max(0, Math.round(region.y * k));
    const width = Math.min(meta.width - left, Math.round(region.width * k)), height = Math.min(meta.height - top, Math.round(region.height * k));
    return { buf: await sharp(Buffer.from(f.data, "base64")).extract({ left, top, width, height }).png().toBuffer(), w: width, h: height };
  };
  let flightFrames = null;
  for (const [n, id] of IDS.entries()) {
    await open(page, 960, 780, { theme: "dark", dpr: 2 });
    await openDeck(page);
    await settle(page);
    const seat = await rectOf(page, `[data-sb-expression-option='${id}']`);
    const deck = await rectOf(page, "[data-sb-expression-deck]");
    const ctrl = await rectOf(page, `${RAIN} [data-sb-express]`);
    // preview frames show the whole dock (the caption names the character); commit frames
    // are cut to the seat → control path, where the flight actually travels
    const region = { x: Math.max(0, deck.x - 12), y: Math.max(0, deck.y - 10), width: deck.width + 24, height: deck.height + 20 };
    const x0 = Math.min(seat.x, ctrl.x) - 16, x1 = Math.max(seat.x + seat.width, ctrl.x + ctrl.width) + 16;
    const path_ = { x: Math.max(0, x0), y: Math.max(0, seat.y - 16), width: x1 - Math.max(0, x0), height: ctrl.y + ctrl.height - seat.y + 32 };
    const frames = [];
    const sess = await page.createCDPSession();
    sess.on("Page.screencastFrame", async (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); try { await sess.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* closed */ } });
    await sess.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await sleep(200);
    const mPrev = frames.length;
    await page.mouse.move(seat.x + seat.width / 2, seat.y + seat.height / 2, { steps: 2 });
    await sleep(320);
    const mCommit = frames.length;
    await page.mouse.click(seat.x + seat.width / 2, seat.y + seat.height / 2);
    await sleep(TEMPO[id] + 560);
    await sess.send("Page.stopScreencast");
    await sess.detach();
    const scale = { vw: 960 };
    const t0 = frames[mPrev]?.ts ?? frames[0].ts;
    const t1 = frames[mCommit]?.ts ?? t0;
    const rest = frames[Math.max(0, mPrev - 1)];
    const stages = [
      { f: rest, r: region, cap: "REST", sub: "before attention" },
      { f: pick(frames, t0 + 70), r: region, cap: "PREVIEW · wake", sub: `+${Math.round(pick(frames, t0 + 70).ts - t0)}ms from hover` },
      { f: pick(frames, t0 + 240), r: region, cap: "PREVIEW · risen", sub: `+${Math.round(pick(frames, t0 + 240).ts - t0)}ms · core lags shell` },
      { f: pick(frames, t1 + 45), r: path_, cap: "COMMIT · flight", sub: `+${Math.round(pick(frames, t1 + 45).ts - t1)}ms from tap` },
      { f: pick(frames, t1 + 160), r: path_, cap: "COMMIT · gesture", sub: `+${Math.round(pick(frames, t1 + 160).ts - t1)}ms` },
      { f: pick(frames, t1 + TEMPO[id] * 0.75), r: path_, cap: "BOOM PULSE", sub: `+${Math.round(pick(frames, t1 + TEMPO[id] * 0.75).ts - t1)}ms` },
      { f: pick(frames, t1 + TEMPO[id] + 420), r: path_, cap: "SETTLED", sub: `+${Math.round(pick(frames, t1 + TEMPO[id] + 420).ts - t1)}ms · still` },
    ];
    const cut = [];
    for (const st of stages) { const c = await cutFrame(st.f, st.r, scale); cut.push({ ...c, cap: st.cap, sub: st.sub }); }
    await strip(`${String(n + 7).padStart(2, "0")}-${id}-preview-commit.png`, cut, { title: `${NAME[id]} — PREVIEW → COMMIT → SETTLE (real compositor frames, real elapsed ms)`, note: `Hover wakes the chamber (~120ms, ${id}'s own wake) and lifts the character; the tap sends the chamber to the Boom Lens while the control plays its gesture (tempo ${TEMPO[id]}ms), pressure ring, then stillness.`, frameH: 210 });
    // real-speed capture: eight consecutive real frames from the tap
    const after = frames.filter((f) => f.ts >= t1).slice(0, 8);
    const rs = [];
    for (const f of after) { const c = await cutFrame(f, path_, scale); rs.push({ ...c, cap: `+${Math.round(f.ts - t1)}ms`, sub: "" }); }
    await strip(`rs-${String(n + 1).padStart(2, "0")}-${id}-real-speed.png`, rs, { title: `${NAME[id]} — REAL SPEED`, note: `${after.length} consecutive compositor frames from the tap, no slowdown; timestamps are real elapsed milliseconds.`, frameH: 170 });
    if (id === "celebrate") flightFrames = { frames, t1, region: path_, scale, ctrl, seat };
  }

  /* ===== 13–15 — core → lens: start / mid / end ===== */
  if (flightFrames) {
    const { frames, t1, region, scale } = flightFrames;
    const targets = [["13-core-to-lens-start.png", 12, "START — the chamber leaves the character"], ["14-core-to-lens-mid.png", 110, "MID — one object crossing to the control"], ["15-core-to-lens-end.png", 235, "END — landed as the Boom Lens; the control's own lens is arriving"]];
    for (const [file, t, cap] of targets) {
      const f = pick(frames, t1 + t);
      const c = await cutFrame(f, region, scale);
      await strip(file, [{ ...c, cap, sub: `+${Math.round(f.ts - t1)}ms from tap (Celebrate)` }], { title: "CORE → BOOM LENS", note: "Living Mascot → Emotion Chamber → Boom Lens: the same emotional object at every scale.", frameH: 300 });
    }
  }

  /* ===== 16 — the six selected states, no labels ===== */
  {
    const items = [];
    let x = 20;
    for (const id of IDS) {
      await open(page, 1440, 1000, { theme: "dark", dpr: 3 });
      await openDeck(page);
      await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
      await sleep(900);
      const f = path.join(TMP, `sel-${id}.png`);
      await page.screenshot({ path: f, clip: await clipOf(page, `${RAIN} [data-sb-express]`, 6) });
      items.push({ input: await sharp(f).resize(132, 132).png().toBuffer(), left: x, top: 60 });
      x += 148;
    }
    items.unshift({ input: label(900, 50, ["16 — SELECTED, NO LABELS", "The committed control beside Respond for each of the six. Can each be identified?"], { size: 12 }), left: 20, top: 8 });
    await sharp({ create: { width: 20 + 148 * 6 + 4, height: 212, channels: 4, background: INK } }).composite(items).png().toFile(path.join(EV, "16-selected-six-no-labels.png"));
  }

  /* ===== 17 — Support on a serious Moment ===== */
  await open(page, 390, 844, { theme: "dark" });
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); }
  await toMoment(page, "m-1983");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(420);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(800);
  await page.screenshot({ path: path.join(EV, "17-serious-support.png"), clip: await clipOf(page, "[data-sb-moment='m-1983']", 6) });

  /* ===== 18 — reduced motion ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000, { theme: "dark" });
  await openDeck(page);
  await sleep(40);
  await page.screenshot({ path: path.join(EV, "18-reduced-motion.png"), clip: await clipOf(page, "[data-sb-expression-deck]", 18) });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  console.log("page errors:", errors);
  console.log("R3.7 evidence complete →", EV);
  await browser.close();
})();
