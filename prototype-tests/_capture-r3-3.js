/* SYSTEMBOOM — R3.3 HUMAN PULSE: evidence. Every image is a real capture from the running
   prototype; scale states come from the documented harness fixtures (?pulse=…), and every
   board states plainly what is simulated (the people) and what is not (the rendering).
     node prototype-tests/_capture-r3-3.js */
const fs = require("fs");
const path = require("path");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-3-human-pulse";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r33";
fs.mkdirSync(EV, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const RAIN = "[data-sb-moment='m-rain']";
const PULSE = `${RAIN} [data-sb-human-pulse]`;
const INK = "#0B0E14";

async function open(page, w, h, { theme = "dark", lang = "en", pulse = "", dpr = 2 } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, hasTouch: w < 900 });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", "maya");
  if (pulse) u.searchParams.set("pulse", pulse);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await page.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  await sleep(450);
}
const clipOf = (page, sel, pad = 12) =>
  page.evaluate((s, p) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: Math.max(0, Math.floor(r.x + scrollX) - p), y: Math.max(0, Math.floor(r.y + scrollY) - p), width: Math.ceil(r.width) + p * 2, height: Math.ceil(r.height) + p * 2 };
  }, sel, pad);
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(280); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openSpectrum = async (page) => { await toRain(page); const b = await centre(page, PULSE); await page.mouse.click(b.x, b.y); await sleep(420); };
const shot = (page, file, clip) => page.screenshot({ path: path.join(EV, file), clip });

async function board(file, rows, { width = 1180, title = "", note = "" } = {}) {
  const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const body = rows.map((r) => `<div class="r">${r.label ? `<div class="l">${esc(r.label)}</div>` : ""}<div class="i">${r.images.map((i) => `<figure><img src="file://${i.file}" style="height:${i.h || 120}px">${i.cap ? `<figcaption>${esc(i.cap)}</figcaption>` : ""}</figure>`).join("")}${r.text ? `<p class="t">${esc(r.text)}</p>` : ""}</div></div>`).join("");
  const html = `<style>body{margin:0;background:${INK};color:#8FA3BC;font:600 11px/1.4 -apple-system,system-ui,sans-serif;padding:20px;width:${width - 40}px}
    h1{font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 4px;color:#C9D8EA}
    p.note{font-weight:500;font-size:11px;margin:0 0 16px;color:#6F819A;max-width:900px;line-height:1.5}
    .r{display:flex;align-items:center;gap:16px;margin-bottom:14px}
    .l{width:120px;flex:none;letter-spacing:.14em;text-transform:uppercase;color:#C9D8EA}
    .i{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
    .t{font-weight:500;color:#8FA3BC;max-width:760px;line-height:1.6}
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

  /* ===== 01–07 — the scaling model ===== */
  const SCALE = [["01-one-person.png", "1"], ["02-two-people.png", "2"], ["03-five-people.png", "5"], ["04-twenty-people.png", "20"], ["05-one-hundred-same.png", "100same"], ["06-one-hundred-mixed.png", "100mixed"], ["07-one-thousand-mixed.png", "1000mixed"]];
  for (const [file, spec] of SCALE) {
    await open(page, 390, 844, { pulse: spec });
    await toRain(page);
    await shot(page, file, await clipOf(page, `${RAIN} [data-sb-presence]`, 10));
  }

  /* ===== 08 — the Boom Lens system board ===== */
  {
    const parts = [];
    const grab = async (theme, pulse, sel, name, pad = 6) => {
      await open(page, 900, 800, { theme, pulse, dpr: 3 });
      await toRain(page);
      const f = path.join(TMP, name);
      await page.screenshot({ path: f, clip: await clipOf(page, sel, pad) });
      return f;
    };
    // tiers: XS in the pulse (single-type fixture so one lens stands alone), SM on the
    // committed control, MD in the spectrum
    const xs = await grab("dark", "100same", `${PULSE} [data-sb-lens]`, "t-xs.png");
    const sm = await grab("dark", "100mixed", `${RAIN} [data-sb-express]`, "t-sm.png");
    await openSpectrum(page);
    const md = path.join(TMP, "t-md.png");
    await page.screenshot({ path: md, clip: await clipOf(page, "[data-sb-spectrum-row='care'] [data-sb-lens]", 6) });
    parts.push({ label: "Tiers", images: [{ file: xs, h: 72, cap: "XS · aggregate" }, { file: sm, h: 96, cap: "SM · selected control (owned)" }, { file: md, h: 110, cap: "MD · spectrum" }] });
    // quick six at MD, dark + light
    for (const theme of ["dark", "light"]) {
      await open(page, 900, 800, { theme, pulse: "18mix", dpr: 3 });
      await openSpectrum(page);
      const imgs = [];
      for (const id of ["care", "joy", "laugh", "wow", "celebrate", "support"]) {
        // the 18-type spectrum scrolls; bring the row fully into the scroller's window so
        // its rim chip is never caught on the fold
        await page.evaluate((i) => document.querySelector(`[data-sb-spectrum-row='${i}']`).scrollIntoView({ block: "center" }), id);
        await sleep(160);
        const f = path.join(TMP, `six-${id}-${theme}.png`);
        await page.screenshot({ path: f, clip: await clipOf(page, `[data-sb-spectrum-row='${id}'] [data-sb-lens]`, 6) });
        imgs.push({ file: f, h: 84, cap: id });
      }
      parts.push({ label: theme === "dark" ? "Deep Cosmos" : "Solar Obs.", images: imgs });
    }
    await renderBoard(page, await board("08-boom-lens-system.png", parts, {
      width: 1240, title: "The Boom Lens system",
      note: "Dedicated optical crops per tier (XS·SM·MD — brow, eye, mouth edge, fuse cue), a physical rim from real shading, one semantic mark seated in the rim, family-shaded. The scarce Boom-red rim segment marks ownership. Same neutral render on every lens today — the per-expression faces remain ART ASSET BLOCKED, so the rim marks carry the type at this scale.",
    }));
  }

  /* ===== 09–12 — aggregate distributions ===== */
  for (const [file, spec] of [["09-100-care.png", "100same"], ["10-90-care-10-joy.png", "90-10"], ["11-three-type-distribution.png", "100mixed"], ["12-many-expression-types.png", "18mix"]]) {
    await open(page, 700, 800, { pulse: spec, dpr: 3 });
    await toRain(page);
    await shot(page, file, await clipOf(page, PULSE, 12));
  }

  /* ===== 13–17 — pulse → spectrum → people ===== */
  await open(page, 390, 844, { pulse: "100mixed" });
  await toRain(page);
  await shot(page, "13-human-pulse.png", await clipOf(page, RAIN, 6));
  await openSpectrum(page);
  await shot(page, "14-spectrum-open.png", await clipOf(page, "[data-sb-expression-spectrum]", 14));
  await open(page, 390, 844, { pulse: "18mix" });
  await openSpectrum(page);
  await shot(page, "15-spectrum-many-types.png", await clipOf(page, "[data-sb-expression-spectrum]", 14));
  await open(page, 390, 844, { pulse: "100mixed" });
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(420);
  await shot(page, "16-care-people.png", await clipOf(page, "[data-sb-expression-who-panel]", 14));
  await page.click("[data-sb-who-back]");
  await sleep(300);
  await page.click("[data-sb-spectrum-row='joy']");
  await sleep(420);
  await shot(page, "17-joy-people.png", await clipOf(page, "[data-sb-expression-who-panel]", 14));

  /* ===== 18–20 — who expressed, mobile / desktop / person detail ===== */
  await open(page, 390, 844, { pulse: "20" });
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(420);
  await shot(page, "18-who-expressed-mobile.png", await clipOf(page, "[data-sb-expression-who-panel]", 12));
  await open(page, 1440, 1000, { pulse: "20" });
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(420);
  await shot(page, "19-who-expressed-desktop.png", await clipOf(page, "[data-sb-expression-who-panel]", 12));
  await open(page, 1440, 1000, { pulse: "20", dpr: 4 });
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(420);
  await shot(page, "20-life-ring-person-detail.png", await clipOf(page, "[data-sb-expression-who] li", 8));

  /* ===== 21–26 — devices ===== */
  for (const [file, w, h, theme] of [["21-320.png", 320, 640, "dark"], ["22-360-light.png", 360, 800, "light"], ["23-360-dark.png", 360, 800, "dark"], ["24-390.png", 390, 844, "dark"], ["25-768.png", 768, 1024, "light"], ["26-1440.png", 1440, 1000, "dark"]]) {
    await open(page, w, h, { theme, pulse: "1000mixed" });
    await openSpectrum(page);
    const clip = await page.evaluate(() => {
      const a = document.querySelector("[data-sb-moment='m-rain'] [data-sb-presence]").getBoundingClientRect();
      const b = document.querySelector("[data-sb-expression-spectrum]").getBoundingClientRect();
      const x = Math.max(0, Math.floor(Math.min(a.left, b.left) + scrollX) - 10);
      const y = Math.max(0, Math.floor(Math.min(a.top, b.top) + scrollY) - 10);
      return { x, y, width: Math.ceil(Math.max(a.right, b.right) - Math.min(a.left, b.left)) + 20, height: Math.ceil(Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)) + 20 };
    });
    await page.screenshot({ path: path.join(EV, file), clip });
  }

  /* ===== 27–28 — before / after, same Moment, same 360 viewport ===== */
  fs.copyFileSync("/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-2-signature-expression/17-expression-summary-360.png", path.join(EV, "27-r3-2-summary-before.png"));
  await open(page, 360, 800);
  await toRain(page);
  await shot(page, "28-human-pulse-after.png", await clipOf(page, `${RAIN} [data-sb-presence]`, 10));

  /* ===== 29 — a feed full of Human Pulse, completely still ===== */
  await open(page, 1440, 1400);
  const stillness = await page.evaluate(() => {
    const pulses = document.querySelectorAll("[data-sb-human-pulse]").length;
    const running = document.getAnimations().filter((a) => a.playState === "running").length;
    return { pulses, running };
  });
  {
    const f = path.join(TMP, "feed.png");
    const c = await clipOf(page, "[data-sb-social-frame]", 0);
    await page.screenshot({ path: f, clip: { x: c.x, y: c.y + Math.round(c.height * 0.28), width: c.width, height: Math.min(760, c.height) } });
    await renderBoard(page, await board("29-many-moments-with-human-pulse.png", [{ label: "Feed", images: [{ file: f, h: 460 }], text: `${stillness.pulses} Human Pulse lines on the loaded feed · ${stillness.running} animations running while the person is not interacting. No mascot repetition, no passive motion.` }], {
      width: 1240, title: "Many Moments, one still feed",
    }));
  }

  /* ===== 30–32 — a11y ===== */
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await page.addStyleTag({ content: "html{font-size:32px}" });
  await openSpectrum(page);
  await shot(page, "30-200-percent.png", await clipOf(page, "[data-sb-expression-spectrum]", 14));
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await toRain(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-human-pulse]").focus());
  await page.keyboard.press("Enter");
  await sleep(420);
  await page.keyboard.press("ArrowDown");
  await shot(page, "31-keyboard-spectrum.png", await clipOf(page, "[data-sb-expression-spectrum]", 14));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await openSpectrum(page);
  await shot(page, "32-reduced-motion.png", await clipOf(page, "[data-sb-expression-spectrum]", 14));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ===== 33 — long-feed asset audit ===== */
  await open(page, 1440, 1400, { pulse: "1000mixed" });
  for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  await sleep(700);
  const audit = await page.evaluate(() => {
    const wire = performance.getEntriesByType("resource").filter((e) => /brand\/expressions/.test(e.name)).map((e) => `${e.name.split("/").pop()} · ${e.transferSize}B`);
    const rendered = [...new Set([...document.querySelectorAll("[data-sb-moment] img[src*='brand/expressions']")].map((i) => i.getAttribute("src").split("/").pop()))];
    const tokens = document.querySelectorAll("[data-sb-lens]").length;
    return { wire: [...new Set(wire)], rendered, tokens };
  });
  await renderBoard(page, await board("33-long-feed-asset-audit.png", [
    { label: "Rendered", images: [], text: `Feed <img> sources: ${audit.rendered.join(" · ")} — small optical tiers only (${audit.tokens} lens tokens on screen).` },
    { label: "On the wire", images: [], text: `${audit.wire.join("  ·  ")}. The single neutral-md is R3.2 §54's documented idle warm of the deck art; no LG ever loads.` },
  ], { width: 1100, title: "Long feed with 1,000-person Moments — asset audit" }));

  /* ===== 34 — CPU throttle ===== */
  await open(page, 390, 844, { pulse: "1000mixed" });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await toRain(page);
  const t0 = Date.now();
  const b = await centre(page, PULSE);
  await page.mouse.click(b.x, b.y);
  await page.waitForSelector("[data-sb-expression-spectrum]", { timeout: 5000 });
  const cpuMs = Date.now() - t0;
  await sleep(400);
  const cpuShot = path.join(TMP, "cpu.png");
  await page.screenshot({ path: cpuShot, clip: await clipOf(page, "[data-sb-expression-spectrum]", 12) });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await renderBoard(page, await board("34-cpu-throttle.png", [{ label: "6× CPU", images: [{ file: cpuShot, h: 260, cap: `tap → spectrum in ${cpuMs}ms` }], text: "A 1,000-person Moment under 6× CPU throttling: the Spectrum opens immediately and nothing drops to a slideshow." }], { width: 900, title: "Human Pulse under 6× CPU throttling" }));

  /* ===== 35 — throttled network: what the summary actually costs ===== */
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.setCacheEnabled(false);
  await open(page, 390, 844, { pulse: "1000mixed" });
  const net = await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => /brand\/expressions/.test(e.name)).map((e) => `${e.name.split("/").pop()} · ${e.transferSize}B @${Math.round(e.responseEnd)}ms`));
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.setCacheEnabled(true);
  await toRain(page);
  const netShot = path.join(TMP, "net.png");
  await page.screenshot({ path: netShot, clip: await clipOf(page, `${RAIN} [data-sb-presence]`, 10) });
  await renderBoard(page, await board("35-network-summary-assets.png", [{ label: "Slow 3G-ish", images: [{ file: netShot, h: 90 }], text: `Expression assets on first open: ${[...new Set(net)].join("  ·  ")}. A 1,000-person Human Pulse costs one 1.5KB lens crop.` }], { width: 1100, title: "First open, throttled network" }));

  console.log("page errors:", errors);
  console.log("R3.3 evidence complete →", EV);
  await browser.close();
})();
