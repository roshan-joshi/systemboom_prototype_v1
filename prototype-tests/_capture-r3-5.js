/* SYSTEMBOOM — R3.5 EMOTION CORE: evidence.
   Board 01 is THE test: the six at LG / MD / XS with NO LABELS — if the emotions cannot be
   identified from the mascot and its core alone, the design fails. Everything is a real
   capture or the real shipped asset; the composites are stated as composites.
     node prototype-tests/_capture-r3-5.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-5-emotion-core";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r35";
const P = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";
fs.mkdirSync(EV, { recursive: true });

const IDS = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const RAIN = "[data-sb-moment='m-rain']";

async function open(page, w, h, { theme = "dark", pulse = "", dpr = 2 } = {}) {
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
const clipOf = (page, sel, pad = 12) =>
  page.evaluate((s, p) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 }; }, sel, pad);
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(260); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page) => { await toRain(page); if (!(await page.$("[data-sb-expression-deck]"))) { const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(380); } };

(async () => {
  const { browser, page, errors } = await launch();

  /* ===== 01 — THE test board: LG · MD · XS, NO LABELS ===== */
  {
    const rows = [["lg", 170], ["md", 96], ["lens-xs", 36]];
    const comp = [];
    let y = 74;
    for (const [tier, sz] of rows) {
      let x = 20;
      for (const id of IDS) {
        const b = await sharp(`${P}/${id}-${tier === "lens-xs" ? "lens-xs" : tier}.webp`).resize(sz, sz).png().toBuffer();
        comp.push({ input: b, left: x + Math.round((170 - sz) / 2), top: y + Math.round((tier === "lg" ? 170 : tier === "md" ? 100 : 44) - sz) / 2 });
        x += 186;
      }
      y += tier === "lg" ? 190 : tier === "md" ? 118 : 62;
    }
    const W = 20 + 186 * 6 + 8;
    const note = Buffer.from(`<svg width="${W}" height="64" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="28" fill="#C9D8EA" font-family="-apple-system,system-ui" font-size="15" font-weight="700" letter-spacing="2">EMOTION CORE — NO LABELS, NO NAMES</text>
      <text x="20" y="50" fill="#6F819A" font-family="-apple-system,system-ui" font-size="12" font-weight="500">The test: can a person identify each emotion from the mascot and its core alone? Rows: LG mascot · MD picker · XS Boom Lens.</text></svg>`);
    await sharp({ create: { width: W, height: y + 26, channels: 4, background: "#0B0E14" } })
      .composite([{ input: note, left: 0, top: 0 }, ...comp])
      .png().toFile(path.join(EV, "01-emotion-core-six.png"));
  }

  /* ===== 02–07 — each core, close ===== */
  for (const [i, id] of IDS.entries()) {
    // the chamber region of the LG composite master (source coords ×2 device scale)
    await sharp(path.join(TMP, `master-${id}.png`))
      .extract({ left: (694 - 150) * 2, top: (583 - 155) * 2, width: 300 * 2, height: 310 * 2 })
      .resize(420)
      .png().toFile(path.join(EV, `${String(i + 2).padStart(2, "0")}-${id}-core.png`));
  }

  /* ===== 08 — the Boom Lens six (MD + XS, dark) ===== */
  {
    const comp = [];
    let x = 20;
    for (const id of IDS) {
      const md = await sharp(`${P}/${id}-lens-md.webp`).resize(104, 104).png().toBuffer();
      const xs = await sharp(`${P}/${id}-lens-xs.webp`).resize(34, 34).png().toBuffer();
      comp.push({ input: md, left: x, top: 24 }, { input: xs, left: x + 35, top: 146 });
      x += 128;
    }
    await sharp({ create: { width: x + 12, height: 204, channels: 4, background: "#0B0E14" } })
      .composite(comp).png().toFile(path.join(EV, "08-boom-lens-six.png"));
  }

  /* ===== 09–10 — Human Pulse, unchanged model, cores visible ===== */
  await open(page, 390, 844, { pulse: "100same" });
  await toRain(page);
  await page.screenshot({ path: path.join(EV, "09-human-pulse-100-care.png"), clip: await clipOf(page, `${RAIN} [data-sb-presence]`, 10) });
  await open(page, 390, 844, { pulse: "100mixed" });
  await toRain(page);
  await page.screenshot({ path: path.join(EV, "10-human-pulse-mixed.png"), clip: await clipOf(page, `${RAIN} [data-sb-presence]`, 10) });

  /* ===== 11–12 — the deck at 360, light + dark: six vessels in their seats ===== */
  for (const [file, theme] of [["11-360-light.png", "light"], ["12-360-dark.png", "dark"]]) {
    await open(page, 360, 800, { theme });
    await openDeck(page);
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    const c = await centre(page, "[data-sb-expression-deck]");
    await page.mouse.move(c.x, c.y);
    await sleep(110);
    await page.mouse.move(4, 4);
    await sleep(240);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-deck]", 14) });
  }

  /* ===== 13 — Support on a serious, reflective Moment ===== */
  await open(page, 390, 844);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); }
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-1983']")?.scrollIntoView({ block: "center" }));
  await sleep(280);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(380);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(700);
  await page.screenshot({ path: path.join(EV, "13-serious-support.png"), clip: await clipOf(page, "[data-sb-moment='m-1983']", 6) });

  /* ===== 14 — reduced motion: final cores, immediately ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.mouse.move(4, 4);
  await sleep(240);
  await page.screenshot({ path: path.join(EV, "14-reduced-motion.png"), clip: await clipOf(page, "[data-sb-expression-deck]", 14) });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  console.log("page errors:", errors);
  console.log("R3.5 evidence complete →", EV);
  await browser.close();
})();
