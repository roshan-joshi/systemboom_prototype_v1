/* SYSTEMBOOM — R3.1 LIVING EXPRESSION ART DIRECTION: evidence.
   Every capture is real, taken from the running prototype. Motion strips are captured with
   playback SLOWED and are labelled with their real-time equivalent — nothing is simulated
   without saying so. The no-marks board (02) is the honest test the brief demands.
     node prototype-tests/_capture-r3-1.js */
const fs = require("fs");
const path = require("path");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-1-living-expression";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r31";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const RAIN = "[data-sb-moment='m-rain']";
let n = 0;
const name = (label) => `${String(++n).padStart(2, "0")}-${label}.png`;

async function open(page, w, h, { theme = "dark", lang = "en", viewer = "maya", dpr = 2 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", viewer);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await sleep(450);
}

/** Document-space clip (puppeteer clips are document coords, not viewport coords). */
async function clip(page, sel, pad = 16) {
  return page.evaluate(
    (s, p) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return {
        x: Math.max(0, Math.floor(r.x + scrollX) - p),
        y: Math.max(0, Math.floor(r.y + scrollY) - p),
        width: Math.ceil(r.width) + p * 2,
        height: Math.ceil(r.height) + p * 2,
      };
    },
    sel,
    pad,
  );
}
const shotOf = async (page, sel, label, pad = 16, dir = EV) =>
  page.screenshot({ path: path.join(dir, typeof label === "number" ? label : name(label)), clip: await clip(page, sel, pad) });

/** A real pointer click at the element's measured centre — keeps Chrome in pointer mode, so
    no keyboard focus ring appears in art-direction captures. */
async function tap(page, sel) {
  const b = await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, sel);
  await page.mouse.click(b.x, b.y);
  await sleep(380);
}
const toRain = async (page) => {
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" }));
  await sleep(260);
};
const openDeck = async (page) => { await toRain(page); await tap(page, `${RAIN} [data-sb-express]`); };

(async () => {
  const { browser, page, errors } = await launch();

  /* ---------- 01 — the art-direction board: deck, owned seat, library ---------- */
  await open(page, 1440, 1000);
  await openDeck(page);
  await shotOf(page, "[data-sb-expression-deck]", "expression-art-direction", 22);

  /* ---------- 02 — MANDATORY: the quick six with every mark removed (§4, §43, §62) ------- */
  await page.addStyleTag({ content: "[data-sb-mark]{display:none !important}" });
  await sleep(200);
  await shotOf(page, "[data-sb-expression-deck]", "quick-six-no-marks", 22);

  /* ---------- 03–06 — the Quick Deck across the device range ---------- */
  for (const [w, h, theme, label] of [[390, 844, "dark", "quick-deck-390-dark"], [390, 844, "light", "quick-deck-390-light"], [320, 640, "dark", "quick-deck-320"], [1440, 1000, "light", "quick-deck-desktop-light"]]) {
    await open(page, w, h, { theme });
    await openDeck(page);
    await shotOf(page, "[data-sb-expression-deck]", label, 18);
  }

  /* ---------- 07–10 — the Expression Library ---------- */
  for (const [w, h, theme, label] of [[390, 844, "dark", "library-390-dark"], [390, 844, "light", "library-390-light"], [320, 640, "dark", "library-320"], [1440, 1000, "dark", "library-desktop"]]) {
    await open(page, w, h, { theme });
    await openDeck(page);
    await tap(page, "[data-sb-expression-more]");
    await page.evaluate(() => { document.querySelector("[data-sb-expression-library] [role=radiogroup]").scrollTop = 0; });
    await sleep(220);
    await shotOf(page, "[data-sb-expression-library]", label, 18);
  }

  /* ---------- 11 — the OWNED SEAT: the character settled into its well ---------- */
  await open(page, 1440, 1000);
  await openDeck(page);
  await tap(page, "[data-sb-expression-option='celebrate']");
  await openDeck(page);
  await shotOf(page, "[data-sb-expression-deck]", "owned-seat", 22);

  /* ---------- 12 — the committed control, settled beside Respond ---------- */
  await page.keyboard.press("Escape");
  await sleep(300);
  await shotOf(page, `${RAIN} [data-sb-actions]`, "committed-control", 14);

  /* ---------- 13 — the NEUTRAL social mascot: nothing committed, an invitation ---------- */
  await open(page, 1440, 1000);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-meal']")?.scrollIntoView({ block: "center" }));
  await sleep(300);
  await shotOf(page, "[data-sb-moment='m-meal'] [data-sb-actions]", "neutral-control", 14);

  /* ---------- 14–15 — presence: optical head crops + who felt what ---------- */
  await toRain(page);
  await shotOf(page, `${RAIN} [data-sb-presence]`, "presence-summary", 14);
  await tap(page, `${RAIN} [data-sb-expression-summary]`);
  await shotOf(page, "[data-sb-expression-who]", "who-expressed", 20);

  /* ---------- 16–18 — MASS: heavy vs normal vs light, slowed frame strips ---------- */
  // Playback is slowed 8× so single frames are legible; the label states the real duration.
  for (const [id, mass, real] of [["support", "heavy", "300ms"], ["wow", "normal", "380ms"], ["celebrate", "light", "460ms"]]) {
    await open(page, 900, 700);
    await toRain(page);
    await tap(page, `${RAIN} [data-sb-express]`);
    // Slowed playback so single frames are legible. Uniform 2400ms across every layer, which
    // is ~6-8× the real per-energy duration — the caption states the real number.
    await page.addStyleTag({ content: ".sb-social [data-sb-expression] *{animation-duration:2400ms !important}" });
    const strip = [];
    const box = await page.evaluate((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, `[data-sb-expression-option='${id}']`);
    await page.mouse.click(box.x, box.y);
    for (let i = 0; i < 6; i++) {
      await sleep(i === 0 ? 30 : 420);
      const f = path.join(TMP, `mass-${mass}-${i}.png`);
      await page.screenshot({ path: f, clip: await clip(page, `${RAIN} [data-sb-express]`, 26) });
      strip.push(f);
    }
    await board(page, strip, `MASS · ${mass.toUpperCase()} — ${id} · captured at slowed playback (2400ms per layer) · REAL duration ${real}`, name(`mass-${mass}-${id}`));
  }

  /* ---------- 19 — reduced motion: the pose survives, nothing moves ---------- */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await shotOf(page, "[data-sb-expression-deck]", "reduced-motion-poses-survive", 22);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---------- 20–23 — the language in four more languages ---------- */
  for (const [lang, label] of [["es", "library-spanish"], ["ru", "library-russian"], ["ne", "library-nepali"], ["zh-Hans", "library-chinese"]]) {
    await open(page, 1440, 1000, { lang });
    await openDeck(page);
    await tap(page, "[data-sb-expression-more]");
    await page.evaluate(() => { document.querySelector("[data-sb-expression-library] [role=radiogroup]").scrollTop = 0; });
    await sleep(200);
    await shotOf(page, "[data-sb-expression-library]", label, 18);
  }

  /* ---------- 24 — keyboard: the focus ring on a seat ---------- */
  await open(page, 1440, 1000);
  await toRain(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter");
  await sleep(350);
  await page.keyboard.press("ArrowRight");
  await sleep(200);
  await shotOf(page, "[data-sb-expression-deck]", "keyboard-focus-seat", 22);

  /* ---------- 25 — 200% text: the deck and its caption still hold ---------- */
  await open(page, 1440, 1000);
  await page.addStyleTag({ content: "html{font-size:32px}" });
  await openDeck(page);
  await shotOf(page, "[data-sb-expression-deck]", "text-200-percent", 18);

  /* ---------- 26–27 — §17 serious emotion: Health and Problem stay records ---------- */
  await open(page, 1440, 1000);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(260); }
  for (const [id, label] of [["m-health", "health-no-expression"], ["m-problem", "problem-no-expression"]]) {
    await page.evaluate((m) => document.querySelector(`[data-sb-moment='${m}']`)?.scrollIntoView({ block: "center" }), id);
    await sleep(260);
    await shotOf(page, `[data-sb-moment='${id}']`, label, 10);
  }

  /* ---------- 28 — the Moment in full, with the language in place ---------- */
  await open(page, 390, 844);
  await toRain(page);
  await shotOf(page, RAIN, "moment-in-context-390", 8);

  /* ---------- 29 — the shipped asset at its three optical sizes ---------- */
  await assetSheet(page, name("mascot-optical-sizes"));

  /* ---------- 30 — MANDATORY before / after ---------- */
  const before = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-3d-expression/03-quick-rail-390.png";
  await open(page, 390, 844);
  await openDeck(page);
  const afterFile = path.join(TMP, "after-deck-390.png");
  await page.screenshot({ path: afterFile, clip: await clip(page, "[data-sb-expression-deck]", 18) });
  await beforeAfter(page, before, afterFile, name("before-after"));

  console.log(`R3.1 evidence: ${n} captures → ${EV}`);
  console.log("page errors:", errors);
  await browser.close();

  /* ---------- helpers that compose real captures into one labelled board ---------- */
  async function board(pg, files, caption, out) {
    const imgs = files.map((f) => `<img src="file://${f}">`).join("");
    const html = `<style>body{margin:0;background:#0B0E14;font:500 13px/1.4 -apple-system,system-ui,sans-serif;color:#C9D8EA;padding:18px}
      .s{display:flex;gap:10px;align-items:flex-end}.s img{height:130px;border-radius:12px;background:#11151F}
      p{margin:12px 2px 0;letter-spacing:.04em;font-size:12px;color:#8FA3BC}</style>
      <div class="s">${imgs}</div><p>${caption}</p>`;
    const f = path.join(TMP, "board.html");
    fs.writeFileSync(f, html);
    await pg.setViewport({ width: 1200, height: 300, deviceScaleFactor: 2 });
    await pg.goto("file://" + f, { waitUntil: "networkidle0" });
    const h = await pg.evaluate(() => Math.ceil(document.querySelector("p").getBoundingClientRect().bottom + 18));
    await pg.setViewport({ width: 1200, height: h, deviceScaleFactor: 2 });
    await sleep(120);
    await pg.screenshot({ path: path.join(EV, out) });
  }
  async function beforeAfter(pg, b, a, out) {
    const html = `<style>body{margin:0;background:#0B0E14;font:600 12px/1.4 -apple-system,system-ui,sans-serif;color:#8FA3BC;padding:22px;display:flex;gap:26px;align-items:flex-start}
      figure{margin:0;width:520px}figcaption{letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
      .win{overflow:hidden;border-radius:16px}img{display:block;width:520px}</style>
      <figure><figcaption>Before — R3 flat rail (rejected: “too dull”)</figcaption>
        <div class="win" style="height:124px"><img src="file://${b}" style="margin-top:-470px"></div></figure>
      <figure><figcaption>After — R3.1 Quick Deck, real 3D mascot</figcaption>
        <div class="win"><img src="file://${a}"></div></figure>`;
    const f = path.join(TMP, "ba.html");
    fs.writeFileSync(f, html);
    await pg.setViewport({ width: 1160, height: 420, deviceScaleFactor: 2 });
    await pg.goto("file://" + f, { waitUntil: "networkidle0" });
    const h = await pg.evaluate(() => Math.ceil(Math.max(...[...document.querySelectorAll("figure")].map((x) => x.getBoundingClientRect().bottom)) + 22));
    await pg.setViewport({ width: 1160, height: h, deviceScaleFactor: 2 });
    await sleep(120);
    await pg.screenshot({ path: path.join(EV, out) });
  }
  async function assetSheet(pg, out) {
    const html = `<style>body{margin:0;background:#0B0E14;font:600 11px/1.4 -apple-system,system-ui,sans-serif;color:#8FA3BC;padding:22px;display:flex;gap:30px;align-items:flex-end}
      figure{margin:0;text-align:center}figcaption{letter-spacing:.14em;text-transform:uppercase;margin-top:10px}</style>
      <figure><img src="${HOST}/brand/expressions/neutral-lg.webp" width="180"><figcaption>lg 256 · full character</figcaption></figure>
      <figure><img src="${HOST}/brand/expressions/neutral-md.webp" width="110"><figcaption>md 128 · full character</figcaption></figure>
      <figure><img src="${HOST}/brand/expressions/neutral-sm.webp" width="64"><figcaption>sm 72 · optical head crop</figcaption></figure>`;
    const f = path.join(TMP, "assets.html");
    fs.writeFileSync(f, html);
    await pg.setViewport({ width: 620, height: 300, deviceScaleFactor: 2 });
    await pg.goto("file://" + f, { waitUntil: "networkidle0" });
    const h = await pg.evaluate(() => document.body.scrollHeight);
    await pg.setViewport({ width: 620, height: h + 8, deviceScaleFactor: 2 });
    await sleep(150);
    await pg.screenshot({ path: path.join(EV, out) });
  }
})();
