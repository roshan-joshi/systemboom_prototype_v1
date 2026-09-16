/* SYSTEMBOOM — R3.6 PREMIUM LIVING EXPRESSIONS: evidence.
   Board 01 is the test: the six at large tile · tray scale · Boom-Lens scale, NO labels.
     node prototype-tests/_capture-r3-6.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-6-premium-expressions";
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
const clipOf = (page, sel, pad = 14) =>
  page.evaluate((s, p) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 }; }, sel, pad);
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(260); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page) => { await toRain(page); if (!(await page.$("[data-sb-expression-deck]"))) { const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(400); } };
/** every seat in one uniform resting state: blur, walk the pointer across and OUT slowly */
async function settle(page) {
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  const c = await centre(page, "[data-sb-expression-deck]");
  await page.mouse.move(c.x, c.y, { steps: 4 });
  await sleep(120);
  await page.mouse.move(2, c.y, { steps: 8 });
  await sleep(120);
  await page.mouse.move(2, 2, { steps: 4 });
  await sleep(260);
}

(async () => {
  const { browser, page, errors } = await launch();

  /* ===== 01 — the six, three scales, NO LABELS ===== */
  {
    const rows = [["lg", 168], ["md", 84], ["lens-xs", 34]];
    const comp = [];
    let y = 70;
    for (const [tier, sz] of rows) {
      let x = 20;
      for (const id of IDS) {
        const b = await sharp(`${P}/${id}-${tier}.webp`).resize(sz, sz).png().toBuffer();
        comp.push({ input: b, left: x + Math.round((168 - sz) / 2), top: y });
        x += 184;
      }
      y += sz + 26;
    }
    const W = 20 + 184 * 6 + 8;
    const note = Buffer.from(`<svg width="${W}" height="60" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="26" fill="#C9D8EA" font-family="-apple-system,system-ui" font-size="15" font-weight="700" letter-spacing="2">PRIMARY SIX — NO LABELS</text>
      <text x="20" y="48" fill="#6F819A" font-family="-apple-system,system-ui" font-size="12" font-weight="500">Large tile · quick-tray scale · compact Boom Lens. Can each expression be identified visually?</text></svg>`);
    await sharp({ create: { width: W, height: y + 20, channels: 4, background: "#0B0E14" } })
      .composite([{ input: note, left: 0, top: 0 }, ...comp])
      .png().toFile(path.join(EV, "01-primary-six-no-labels.png"));
  }

  /* ===== 02–07 — each expression: tile + lens ===== */
  for (const [i, id] of IDS.entries()) {
    const lg = await sharp(`${P}/${id}-lg.webp`).resize(280, 280).png().toBuffer();
    const lens = await sharp(`${P}/${id}-lens-md.webp`).resize(120, 120).png().toBuffer();
    const xs = await sharp(`${P}/${id}-lens-xs.webp`).resize(40, 40).png().toBuffer();
    await sharp({ create: { width: 470, height: 310, channels: 4, background: "#0B0E14" } })
      .composite([{ input: lg, left: 14, top: 14 }, { input: lens, left: 322, top: 60 }, { input: xs, left: 362, top: 210 }])
      .png().toFile(path.join(EV, `${String(i + 2).padStart(2, "0")}-${id}.png`));
  }

  /* ===== 08–09 — the quick tray ===== */
  for (const [file, theme] of [["08-quick-tray-light.png", "light"], ["09-quick-tray-dark.png", "dark"]]) {
    await open(page, 390, 844, { theme });
    await openDeck(page);
    await settle(page);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-deck]") });
  }

  /* ===== 10–11 — the expression library ===== */
  for (const [file, theme] of [["10-more-panel-light.png", "light"], ["11-more-panel-dark.png", "dark"]]) {
    await open(page, 390, 844, { theme });
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
    await sleep(600);
    await page.evaluate(() => { document.querySelector("[data-sb-expression-library] [role=radiogroup]").scrollTop = 0; });
    await page.mouse.move(2, 2, { steps: 4 });
    await sleep(260);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, "[data-sb-expression-library]") });
  }

  /* ===== 12–13 — the selected state beside Respond ===== */
  for (const [file, theme] of [["12-selected-state-light.png", "light"], ["13-selected-state-dark.png", "dark"]]) {
    await open(page, 1440, 1000, { theme, dpr: 3 });
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
    await sleep(820);
    await page.screenshot({ path: path.join(EV, file), clip: await clipOf(page, `${RAIN} [data-sb-actions]`, 10) });
  }

  /* ===== 14 — Human Pulse at feed scale ===== */
  await open(page, 390, 844, { pulse: "100mixed" });
  await toRain(page);
  await page.screenshot({ path: path.join(EV, "14-human-pulse-small.png"), clip: await clipOf(page, `${RAIN} [data-sb-presence]`, 10) });

  /* ===== 15 — Support on a serious Moment ===== */
  await open(page, 390, 844);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); }
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-1983']")?.scrollIntoView({ block: "center" }));
  await sleep(280);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(400);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(700);
  await page.screenshot({ path: path.join(EV, "15-serious-support.png"), clip: await clipOf(page, "[data-sb-moment='m-1983']", 6) });

  /* ===== 16–17 — mobile 360, tray in context ===== */
  for (const [file, theme] of [["16-mobile-360-light.png", "light"], ["17-mobile-360-dark.png", "dark"]]) {
    await open(page, 360, 800, { theme });
    await openDeck(page);
    await settle(page);
    await page.screenshot({ path: path.join(EV, file), clip: { x: 0, y: 0, width: 360, height: 800 } });
  }

  /* ===== 18 — reduced motion: everything simply there ===== */
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 390, 844);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(200);
  await page.screenshot({ path: path.join(EV, "18-reduced-motion.png"), clip: await clipOf(page, "[data-sb-expression-library]") });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  console.log("page errors:", errors);
  console.log("R3.6 evidence complete →", EV);
  await browser.close();
})();
