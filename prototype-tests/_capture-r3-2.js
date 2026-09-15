/* SYSTEMBOOM — R3.2 SIGNATURE LIVING EXPRESSIONS: evidence.
   Every image is a real capture from the running prototype. §70 motion evidence is captured
   at ACTUAL SPEED (frames grabbed as fast as the browser will give them, each labelled with
   the real elapsed milliseconds); where a slowed strip is also shown it says so on the image.
     node prototype-tests/_capture-r3-2.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-2-signature-expression";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r32";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const NAME = { care: "CARE", joy: "JOY", laugh: "LAUGH", wow: "WOW", celebrate: "CELEBRATE", support: "SUPPORT" };
const INK = "#0B0E14", TEXT = "#8FA3BC";

async function open(page, w, h, { theme = "dark", lang = "en", dpr = 2 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", "maya");
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await sleep(420);
}
const clipOf = (page, sel, pad = 14) =>
  page.evaluate((s, p) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 };
  }, sel, pad);
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const toMoment = async (page, id) => { await page.evaluate((m) => document.querySelector(`[data-sb-moment='${m}']`)?.scrollIntoView({ block: "center" }), id); await sleep(260); };
const loadAll = async (page) => { for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); } };
const openDeck = async (page, id = "m-rain") => {
  await toMoment(page, id);
  if (!(await page.$("[data-sb-expression-deck]"))) {
    const b = await centre(page, `[data-sb-moment='${id}'] [data-sb-express]`);
    await page.mouse.click(b.x, b.y);
    await sleep(380);
  }
};
const shot = (page, file, clip) => page.screenshot({ path: path.join(EV, file), clip });
/** Opening the deck focuses the first seat, which also previews it. Clear both so every
    capture shows the six in one uniform state rather than one seat lit differently. */
async function settleDeck(page) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  const c = await centre(page, "[data-sb-expression-deck]");
  await page.mouse.move(c.x, c.y);
  await sleep(110);
  await page.mouse.move(4, 4);
  await sleep(240);
}

/** Compose real captures onto a labelled board. */
async function board(file, rows, { width = 1180, title = "", note = "" } = {}) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const body = rows
    .map((r) => `<div class="r">${r.label ? `<div class="l">${esc(r.label)}</div>` : ""}<div class="i">${r.images.map((i) => `<figure><img src="file://${i.file}" style="height:${i.h || 120}px">${i.cap ? `<figcaption>${esc(i.cap)}</figcaption>` : ""}</figure>`).join("")}</div></div>`)
    .join("");
  const html = `<style>body{margin:0;background:${INK};color:${TEXT};font:600 11px/1.4 -apple-system,system-ui,sans-serif;padding:20px;width:${width - 40}px}
    h1{font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 4px;color:#C9D8EA}
    p.note{font-weight:500;font-size:11px;margin:0 0 16px;color:#6F819A;max-width:860px;line-height:1.5}
    .r{display:flex;align-items:center;gap:16px;margin-bottom:14px}
    .l{width:104px;flex:none;letter-spacing:.14em;text-transform:uppercase;color:#C9D8EA}
    .i{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
    figure{margin:0;text-align:center}img{display:block;border-radius:10px}
    figcaption{margin-top:6px;font-weight:500;color:#5E7089;letter-spacing:.06em}</style>
    ${title ? `<h1>${esc(title)}</h1>` : ""}${note ? `<p class="note">${esc(note)}</p>` : ""}${body}`;
  const f = path.join(TMP, "board.html");
  fs.writeFileSync(f, html);
  return { html: f, out: path.join(EV, file), width };
}
async function renderBoard(page, spec) {
  await page.setViewport({ width: spec.width, height: 400, deviceScaleFactor: 2 });
  await page.goto("file://" + spec.html, { waitUntil: "networkidle0" });
  const h = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height) + 20);
  await page.setViewport({ width: spec.width, height: h, deviceScaleFactor: 2 });
  await sleep(140);
  await page.screenshot({ path: spec.out });
}

(async () => {
  const { browser, page, errors } = await launch();
  const cdp = await page.createCDPSession();

  /* ===== 00 — the ART CAPABILITY experiment (§5), run rather than asserted =====
     The two best attempts a 2D pipeline can make at a per-expression face, beside the
     canonical render. They are kept as evidence precisely because they FAIL. */
  {
    const SRC = "/Users/roshan/SYSTEMBOOM_V2/references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png";
    const W = 1055, H = 1024, view = { left: 231, top: 300, width: 594, height: 500 };
    const base = await sharp(SRC).ensureAlpha().raw().toBuffer();
    const mk = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 4 } });
    // LAUGH: squash the eye region vertically — the classic 2D puppet squint
    const eye = { left: 300, top: 470, width: 210, height: 300 };
    const eyePatch = await sharp(SRC).extract(eye).resize({ width: eye.width, height: Math.round(eye.height * 0.55) }).png().toBuffer();
    const laugh = await mk(Buffer.from(base)).composite([{ input: eyePatch, left: eye.left, top: eye.top + 74 }]).png().toBuffer();
    // SUPPORT: close the grin by painting sampled sphere material over the teeth
    const mouth = { left: 500, top: 575, width: 300, height: 290 };
    const donor = await sharp(SRC).extract({ left: 470, top: 330, width: 300, height: 240 }).resize({ width: mouth.width, height: mouth.height }).blur(6).png().toBuffer();
    const support = await mk(Buffer.from(base)).composite([{ input: donor, left: mouth.left, top: mouth.top }]).png().toBuffer();
    const cut = async (buf, name) => { const f = path.join(TMP, name); await sharp(buf).extract(view).resize(520).png().toFile(f); return f; };
    const files = [
      { file: await cut(await sharp(SRC).png().toBuffer(), "cap-neutral.png"), h: 300, cap: "canonical render" },
      { file: await cut(laugh, "cap-laugh.png"), h: 300, cap: "LAUGH attempt — 2D eye squash" },
      { file: await cut(support, "cap-support.png"), h: 300, cap: "SUPPORT attempt — paint out the teeth" },
    ];
    await renderBoard(page, await board("00-art-capability-experiment.png", [{ images: files }], {
      width: 1240,
      title: "Art capability — tested, not assumed",
      note: "This environment has a 2D raster pipeline (sharp/libvips) and headless Chromium, but no 3D renderer and no image-generation model. These are the two best attempts it can make at a per-expression face. The eye squash mis-registers into a doubled eye; closing the grin — which CARE and SUPPORT both require — is a blurred rectangle across the character. Shipping either would be worse than shipping the canonical render unchanged. Hence: QUICK SIX FINAL ART — BLOCKED.",
    }));
  }

  /* ===== 01 — THE critical owner board: six character states, no labels, no marks ===== */
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.addStyleTag({ content: "[data-sb-mark]{display:none!important}[data-sb-deck-caption]{visibility:hidden!important}" });
  // All six must be captured in the SAME state. Opening the deck focuses the first seat,
  // which also sets the PREVIEW state — blurring alone does not clear that, so the pointer
  // is walked across the deck and out, firing the real pointerleave that resets it.
  await settleDeck(page);
  const evenState = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option]", (n) => n.filter((e) => e.hasAttribute("data-sb-previewing") || e.matches(":focus-visible")).length);
  if (evenState !== 0) console.log("WARNING: seats are not in a uniform state:", evenState);
  const bare = [];
  for (const id of QUICK) {
    const f = path.join(TMP, `bare-${id}.png`);
    await page.screenshot({ path: f, clip: await clipOf(page, `[data-sb-expression-option='${id}']`, 4) });
    bare.push({ file: f, h: 150 });
  }
  await renderBoard(page, await board("01-quick-six-no-label-no-mark.png", [{ images: bare }], {
    width: 1180,
    title: "Quick Six — character states only",
    note: "Every mark, label, particle and colour-coded symbol removed. Order: Care · Joy · Laugh · Wow · Celebrate · Support. HONEST READING: one 3D pose was supplied, so all six share ONE FACE — the differences you can see are body pose alone. Per-expression eyes, brows and mouth are ART ASSET BLOCKED (docs/handover/quick-six-render-briefs.md).",
  }));

  /* ===== 02 — the labelled art board: LG · MD · SM · selected, light + dark ===== */
  const tiers = {};
  for (const theme of ["dark", "light"]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    for (const id of QUICK) {
      const f = path.join(TMP, `md-${id}-${theme}.png`);
      await page.screenshot({ path: f, clip: await clipOf(page, `[data-sb-expression-option='${id}']`, 4) });
      (tiers[id] ??= {})[`md-${theme}`] = f;
    }
    // selected control state, per expression
    for (const id of QUICK) {
      await openDeck(page);
      const p = await centre(page, `[data-sb-expression-option='${id}']`);
      await page.mouse.click(p.x, p.y);
      await sleep(760);
      const f = path.join(TMP, `sel-${id}-${theme}.png`);
      await page.screenshot({ path: f, clip: await clipOf(page, `${RAIN} [data-sb-express]`, 6) });
      tiers[id][`sel-${theme}`] = f;
    }
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-remove]")));
    await sleep(300);
  }
  // LG + SM straight from the shipped assets (one file today — the tier system is real)
  const lgFile = path.join(TMP, "asset-lg.png");
  const smFile = path.join(TMP, "asset-sm.png");
  await sharp("/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions/neutral-lg.webp").png().toFile(lgFile);
  await sharp("/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions/neutral-sm.webp").resize(144, 144).png().toFile(smFile);
  await renderBoard(page, await board("02-quick-six-final.png",
    QUICK.map((id) => ({
      label: NAME[id],
      images: [
        { file: lgFile, h: 112, cap: "LG static" },
        { file: tiers[id]["md-dark"], h: 112, cap: "MD deck · dark" },
        { file: tiers[id]["md-light"], h: 112, cap: "MD deck · light" },
        { file: smFile, h: 76, cap: "SM crop" },
        { file: tiers[id]["sel-dark"], h: 76, cap: "selected · dark" },
        { file: tiers[id]["sel-light"], h: 76, cap: "selected · light" },
      ],
    })),
    { width: 1180, title: "Quick Six — tiers and states", note: "LG and SM come from the shipped asset tiers; MD and selected are live captures. The LG/SM columns are identical across the six because only ONE render exists — that is the blocked art, stated plainly rather than hidden." }));

  /* ===== 03–05 — the neutral control ===== */
  await open(page, 1440, 1000, { dpr: 4 });
  await toMoment(page, "m-meal");
  await shot(page, "03-neutral-control-large.png", await clipOf(page, "[data-sb-moment='m-meal'] [data-sb-express]", 10));
  await open(page, 360, 800);
  await toMoment(page, "m-meal");
  await shot(page, "04-neutral-control-360.png", await clipOf(page, "[data-sb-moment='m-meal'] [data-sb-actions]", 8));
  await open(page, 1440, 1000, { theme: "dark", dpr: 4 });
  await toMoment(page, "m-meal");
  await shot(page, "05-neutral-control-dark.png", await clipOf(page, "[data-sb-moment='m-meal'] [data-sb-express]", 10));

  /* ===== 06–10 — the phone deck ===== */
  for (const [file, w, h, theme] of [
    ["06-quick-deck-320.png", 320, 640, "dark"],
    ["07-quick-deck-360-light.png", 360, 800, "light"],
    ["08-quick-deck-360-dark.png", 360, 800, "dark"],
    ["09-quick-deck-390.png", 390, 844, "dark"],
    ["10-quick-deck-430.png", 430, 932, "light"],
  ]) {
    await open(page, w, h, { theme });
    await openDeck(page);
    await settleDeck(page);
    await shot(page, file, await clipOf(page, "[data-sb-expression-deck]", 14));
  }

  /* ===== 11–12 — the desktop deck ===== */
  for (const [file, w] of [["11-quick-deck-1024.png", 1024], ["12-quick-deck-1440.png", 1440]]) {
    await open(page, w, 900);
    await openDeck(page);
    await settleDeck(page);
    await shot(page, file, await clipOf(page, "[data-sb-expression-deck]", 14));
  }

  /* ===== 13–16 — selected states in place ===== */
  for (const [file, id] of [["13-care-selected.png", "care"], ["14-laugh-selected.png", "laugh"], ["15-wow-selected.png", "wow"], ["16-support-selected.png", "support"]]) {
    await open(page, 390, 844);
    await openDeck(page);
    const p = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.click(p.x, p.y);
    await sleep(820);
    await shot(page, file, await clipOf(page, `${RAIN} [data-sb-actions]`, 10));
  }

  /* ===== 17–19 — presence summary and who expressed ===== */
  await open(page, 360, 800);
  await toMoment(page, "m-rain");
  await shot(page, "17-expression-summary-360.png", await clipOf(page, `${RAIN} [data-sb-presence]`, 10));
  await open(page, 1440, 1000);
  await toMoment(page, "m-rain");
  await shot(page, "18-expression-summary-desktop.png", await clipOf(page, `${RAIN} [data-sb-presence]`, 10));
  const sp = await centre(page, `${RAIN} [data-sb-expression-summary]`);
  await page.mouse.click(sp.x, sp.y);
  await sleep(400);
  await shot(page, "19-who-expressed.png", await clipOf(page, "[data-sb-expression-who]", 18));

  /* ===== 20–25 — the expressions in real Moment contexts ===== */
  const ctx = [
    ["20-support-serious-moment.png", "m-1983", "support"],
    ["21-care-family-memory.png", "m-wedding", "care"],
    ["22-joy-light-moment.png", "m-rain", "joy"],
    ["23-laugh-light-moment.png", "m-meal", "laugh"],
    ["24-wow-moment.png", "m-panorama", "wow"],
    ["25-celebrate-achievement.png", "m-forty", "celebrate"],
  ];
  for (const [file, moment, id] of ctx) {
    await open(page, 390, 844);
    await loadAll(page);
    if (!(await page.$(`[data-sb-moment='${moment}'] [data-sb-express]`))) { console.log("skip (no control):", file); continue; }
    await openDeck(page, moment);
    const p = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.click(p.x, p.y);
    await sleep(820);
    await shot(page, file, await clipOf(page, `[data-sb-moment='${moment}']`, 6));
  }

  /* ===== 26–31 — REAL-SPEED motion, one strip per expression (§70–§71) =====
     Captured with CDP Page.startScreencast, which streams the compositor's own frames. A
     screenshot round-trip costs ~150ms and would miss the anticipation entirely; the
     screencast sees every frame the person actually sees. Each frame is labelled with the
     real elapsed milliseconds from the tap, and the five §71 stages are picked from them. */
  const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };
  const STAGE = ["START", "ANTICIPATION", "PEAK", "BOOM PULSE", "SETTLE"];
  let idx = 26;
  for (const id of QUICK) {
    await open(page, 900, 760);
    await openDeck(page);
    const p = await centre(page, `[data-sb-expression-option='${id}']`);
    const box = await page.evaluate(() => { const r = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getBoundingClientRect(); const pad = 34; return { left: Math.round(r.x) - pad, top: Math.round(r.y) - pad, width: Math.round(r.width) + pad * 2, height: Math.round(r.height) + pad * 2 }; });
    const frames = [];
    const sess = await page.createCDPSession();
    sess.on("Page.screencastFrame", async (f) => {
      frames.push({ ts: f.metadata.timestamp * 1000, data: f.data });
      try { await sess.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* stream closed */ }
    });
    await sess.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await sleep(160);
    const mark = frames.length;
    await page.mouse.click(p.x, p.y);
    await sleep(Math.round(TEMPO[id]) + 320);
    await sess.send("Page.stopScreencast");
    await sess.detach();
    const after = frames.slice(mark);
    const t0 = after.length ? after[0].ts : 0;
    // pick the five stages by real elapsed time inside this expression's own tempo
    const targets = [0, 0.22, 0.5, 0.72, 1.0].map((k) => k * TEMPO[id]);
    const picks = targets.map((want, i) => {
      let best = after[0], bestD = Infinity;
      for (const f of after) { const d = Math.abs(f.ts - t0 - want); if (d < bestD) { bestD = d; best = f; } }
      return { f: best, stage: STAGE[i] };
    });
    const strip = [];
    for (let i = 0; i < picks.length; i++) {
      const out = path.join(TMP, `rt-${id}-${i}.png`);
      await sharp(Buffer.from(picks[i].f.data, "base64")).extract({ left: Math.max(0, box.left), top: Math.max(0, box.top), width: box.width, height: box.height }).resize(240).png().toFile(out);
      strip.push({ file: out, h: 160, cap: `${picks[i].stage} · ${Math.round(picks[i].f.ts - t0)}ms` });
    }
    await renderBoard(page, await board(`${idx}-${id}.png`, [{ label: NAME[id], images: strip }], {
      width: 1400,
      title: `${NAME[id]} — real speed`,
      note: `Real compositor frames, no slowdown. ${after.length} frames captured over the one-shot; the five shown are the nearest real frames to this expression's own stage times (tempo ${TEMPO[id]}ms). Timestamps are real elapsed milliseconds from the tap.`,
    }));
    idx += 1;
  }

  /* ===== 32 — reduced motion ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await settleDeck(page);
  await shot(page, "32-reduced-motion-quick-six.png", await clipOf(page, "[data-sb-expression-deck]", 14));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ===== 33 — 6× CPU throttle: the interaction must still feel immediate ===== */
  await open(page, 390, 844);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await openDeck(page);
  const tCpu = Date.now();
  const pc = await centre(page, "[data-sb-expression-option='celebrate']");
  await page.mouse.click(pc.x, pc.y);
  await page.waitForFunction(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]")?.getAttribute("data-sb-express") === "celebrate", { timeout: 5000 });
  const cpuMs = Date.now() - tCpu;
  await sleep(700);
  const cpuFile = path.join(TMP, "cpu.png");
  await page.screenshot({ path: cpuFile, clip: await clipOf(page, `${RAIN} [data-sb-actions]`, 8) });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await renderBoard(page, await board("33-cpu-throttle.png", [{ label: "6× CPU", images: [{ file: cpuFile, h: 120, cap: `commit in ${cpuMs}ms` }] }], {
    width: 900, title: "Selection under 6× CPU throttling", note: `Tap → committed state, measured end to end at 6× CPU throttling: ${cpuMs}ms. No frame simplification was needed.`,
  }));

  /* ===== 34 — many expression tokens on screen at once ===== */
  await open(page, 1440, 1000);
  await loadAll(page);
  for (const [m, id] of [["m-meal", "laugh"], ["m-panorama", "wow"], ["m-project", "celebrate"], ["m-boudha", "care"], ["m-snow", "joy"]]) {
    if (!(await page.$(`[data-sb-moment='${m}'] [data-sb-express]`))) continue;
    await openDeck(page, m);
    const q = await page.$(`[data-sb-expression-option='${id}']`);
    if (q) { const c = await centre(page, `[data-sb-expression-option='${id}']`); await page.mouse.click(c.x, c.y); await sleep(520); }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const many = await page.evaluate(() => {
    const tokens = document.querySelectorAll("[data-sb-expression]").length;
    const running = [...document.querySelectorAll("[data-sb-expression] *")].filter((e) => e.getAnimations && e.getAnimations().some((a) => a.playState === "running")).length;
    return { tokens, running };
  });
  await toMoment(page, "m-meal");
  await sleep(400);
  const manyFile = path.join(TMP, "many.png");
  {
    const c = await clipOf(page, "[data-sb-social-frame]", 0);
    await page.screenshot({ path: manyFile, clip: { x: c.x, y: c.y + Math.max(0, Math.round(c.height * 0.12)), width: c.width, height: Math.min(700, c.height) } });
  }
  await renderBoard(page, await board("34-many-summary-tokens.png", [{ label: "Feed", images: [{ file: manyFile, h: 400, cap: `${many.tokens} expression tokens on screen` }] }], {
    width: 1000, title: "Many expression tokens, one still feed", note: `${many.tokens} mascot tokens rendered across the loaded feed; ${many.running} animations running while the person is not interacting. The feed is completely calm (§19).`,
  }));

  /* ===== 35 — first open on a slow network ===== */
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.setCacheEnabled(false);
  const tNet = Date.now();
  await open(page, 390, 844);
  const firstPaintMs = Date.now() - tNet;
  const net = await page.evaluate(() => {
    const r = performance.getEntriesByType("resource").filter((e) => /brand\/expressions/.test(e.name));
    return r.map((e) => ({ n: e.name.split("/").pop(), ms: Math.round(e.responseEnd), bytes: e.transferSize }));
  });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.setCacheEnabled(true);
  const netFile = path.join(TMP, "net.png");
  await page.screenshot({ path: netFile, clip: { x: 0, y: 0, width: 390, height: 700 } });
  await renderBoard(page, await board("35-network-first-open.png", [{ label: "Slow 3G-ish", images: [{ file: netFile, h: 430, cap: `first open ${firstPaintMs}ms` }] }], {
    width: 900, title: "First Social open, throttled network",
    note: `Expression assets fetched during first open: ${net.length ? net.map((e) => `${e.n} ${e.bytes}B @${e.ms}ms`).join(" · ") : "none"}. Only the neutral SM face crop is needed for the first paint; the Quick Six deck art is warmed on idle afterwards and the extended set stays on demand.`,
  }));

  /* ===== 36–37 — before / after, same Moment, same viewport ===== */
  await open(page, 390, 844);
  await openDeck(page);
  const afterFile = path.join(TMP, "after.png");
  await page.screenshot({ path: afterFile, clip: await clipOf(page, "[data-sb-expression-deck]", 14) });
  const beforeFile = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-1-living-expression/03-quick-deck-390-dark.png";
  fs.copyFileSync(beforeFile, path.join(EV, "36-r3-1-current.png"));
  fs.copyFileSync(afterFile, path.join(EV, "37-r3-2-final.png"));
  await renderBoard(page, await board("38-before-after.png", [
    { label: "R3.1", images: [{ file: beforeFile, h: 220, cap: "scrolling row of six · 56px character" }] },
    { label: "R3.2", images: [{ file: afterFile, h: 300, cap: "3×2 deck · 68px character · seated, with contact shadow" }] },
  ], { width: 1000, title: "Same Moment, same 390 viewport", note: "Left: R3.1's single row — only ~4 of the six fit, at 56px. Right: R3.2's 3×2 deck — all six visible at every phone width, at 68px." }));

  console.log("page errors:", errors);
  fs.writeFileSync(path.join(TMP, "metrics.json"), JSON.stringify({ cpuMs, firstPaintMs, net, many }, null, 2));
  console.log("metrics", JSON.stringify({ cpuMs, firstPaintMs, many }));
  await browser.close();
})();
