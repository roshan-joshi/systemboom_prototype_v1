/** R2 — expression + conversation evidence capture (not a test).
 *  prototype-evidence/social-r2-expression/: the 57 required artifacts, the six-expression
 *  contact sheet, the mascot source audit, and six motion frame strips (captured at 5×
 *  slower playback via the browser Animation domain — evidence method only; labels state
 *  real-time equivalents). Dev indicator hidden for capture only. */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r2-expression";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EV, { recursive: true });
const EXPR = ["care", "joy", "wonder", "support", "celebrate", "respect"];
const NAMES = { care: "Care", joy: "Joy", wonder: "Wonder", support: "Support", celebrate: "Celebrate", respect: "Respect" };

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send("Animation.enable").catch(() => {});
  const go = async (params, { w = 1440, h = 900, dsf = 2, theme = "light", lang = "en" } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf, hasTouch: w < 900 });
    await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
    const qs = new URLSearchParams({ harness: "0", theme, lang, ...params }).toString();
    await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await sleep(500);
  };
  const shot = async (n, opts = {}) => { await page.screenshot({ path: `${EV}/${n}.png`, ...opts }); console.log("shot", n); };
  const toM = async (id) => { await page.evaluate((x) => document.querySelector(`[data-sb-moment='${x}']`)?.scrollIntoView({ block: "center" }), id); await sleep(250); };
  const inVp = (r, p = 0) => { const x = Math.max(0, Math.floor(r.left - p)); const y = Math.max(0, Math.floor(r.top - p)); return { x, y, width: Math.max(1, Math.min(Math.floor(innerWidth) - x - 1, Math.ceil(r.width + p * 2))), height: Math.max(1, Math.min(Math.floor(innerHeight) - y - 1, Math.ceil(r.height + p * 2))) }; };
  const clipM = (id, pad = 10) => page.evaluate(`((r, p) => { const vx = Math.max(0, Math.floor(r.left - p)); const vy = Math.max(0, Math.floor(r.top - p)); return { x: vx + Math.round(scrollX), y: vy + Math.round(scrollY), width: Math.max(1, Math.min(Math.floor(innerWidth) - vx - 1, Math.ceil(r.width + p * 2))), height: Math.max(1, Math.min(Math.floor(innerHeight) - vy - 1, Math.ceil(r.height + p * 2))) }; })(document.querySelector("[data-sb-moment='${id}']").getBoundingClientRect(), ${pad})`);
  const domClick = (sel) => page.evaluate((x) => document.querySelector(x)?.click(), sel);
  /** A real pointer click at the element's measured centre — never scrolls (so a clip measured
   *  around it stays valid) and keeps Chrome's focus-visible heuristic in POINTER mode, so
   *  motion evidence shows what a tap shows, not a keyboard focus ring. */
  const tap = async (sel) => {
    const pt = await page.evaluate((x) => { const r = document.querySelector(x).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, sel);
    await page.mouse.click(pt.x, pt.y);
  };
  const openRail = async () => { await tap("[data-sb-moment='m-rain'] [data-sb-express]"); await sleep(350); };
  const loadAll = async () => { for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(250); } };

  /* ---- 115: core Moment ---- */
  await go({}, { w: 390, h: 844 }); await toM("m-sameage"); await shot("01-moment-no-interaction-light", { clip: await clipM("m-sameage") });
  await go({}, { w: 390, h: 844, theme: "dark" }); await toM("m-sameage"); await shot("02-moment-no-interaction-dark", { clip: await clipM("m-sameage") });
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await shot("03-moment-expression-summary", { clip: await clipM("m-rain") });
  await shot("04-moment-responses-preview", { clip: await clipM("m-rain") });
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(350); await toM("m-rain"); await shot("05-moment-full-conversation-mobile");
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(350); await toM("m-rain"); await shot("06-moment-full-conversation-desktop");

  /* ---- 116: rail ---- */
  await go({}, { w: 360, h: 800 }); await toM("m-rain"); await openRail(); await shot("07-expression-rail-360-light");
  await go({}, { w: 360, h: 800, theme: "dark" }); await toM("m-rain"); await openRail(); await shot("08-expression-rail-360-dark");
  await go({}, { w: 320, h: 640 }); await toM("m-rain"); await openRail(); await shot("09-expression-rail-320");
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await toM("m-rain"); await openRail(); await shot("10-expression-rail-desktop", { clip: await clipM("m-rain", 30) });
  await page.click("[data-sb-expression-option='care']"); await sleep(600); await shot("11-expression-selected", { clip: await clipM("m-rain") });
  await openRail(); await sleep(200); await shot("12-expression-change", { clip: await clipM("m-rain", 30) });
  await page.click("[data-sb-expression-option='wonder']"); await sleep(500);
  await openRail(); await page.click("[data-sb-expression-remove]"); await sleep(400); await shot("13-expression-remove", { clip: await clipM("m-rain") });

  /* ---- 117: six-expression contact sheet ---- */
  const cells = [];
  await go({}, { w: 800, h: 900, dsf: 2 }); await toM("m-rain");
  for (const id of EXPR) {
    await openRail();
    const optClip = await page.evaluate(`((r) => ({ x: Math.max(0, Math.floor(r.left - 4)) + Math.round(scrollX), y: Math.max(0, Math.floor(r.top - 10)) + Math.round(scrollY), width: Math.ceil(r.width + 8), height: Math.ceil(r.height + 14) }))(document.querySelector("[data-sb-expression-option='${id}']").getBoundingClientRect())`);
    const staticShot = (await page.screenshot({ encoding: "base64", clip: optClip }));
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.2 }).catch(() => {});
    await domClick(`[data-sb-expression-option='${id}']`); await sleep(350); // ≈70ms real time — mid animation
    const ctl = await page.evaluate(() => { const r = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.left - 14)) + Math.round(scrollX), y: Math.max(0, Math.floor(r.top - 14)) + Math.round(scrollY), width: Math.ceil(r.width + 28), height: Math.ceil(r.height + 28) }; });
    const animShot = (await page.screenshot({ encoding: "base64", clip: ctl }));
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
    await sleep(700);
    const selShot = (await page.screenshot({ encoding: "base64", clip: ctl }));
    cells.push({ id, staticShot, animShot, selShot });
    await openRail(); await domClick("[data-sb-expression-remove]"); await sleep(250);
  }
  const p2 = await b.newPage();
  await p2.setViewport({ width: 1180, height: 6 * 150 + 90, deviceScaleFactor: 1.5 });
  await p2.setContent(`<body style="margin:0;background:#e8ecf3;padding:16px;font:13px system-ui;color:#0f1520">
    <div style="display:grid;grid-template-columns:110px 200px 200px 200px;gap:10px 22px;align-items:center">
    <b></b><b>static</b><b>key animation frame</b><b>selected state</b>
    ${cells.map((c) => `<b style="font-size:15px">${NAMES[c.id]}</b>
      <img src="data:image/png;base64,${c.staticShot}" style="height:120px;background:#fff;border-radius:12px;object-fit:contain">
      <img src="data:image/png;base64,${c.animShot}" style="height:120px;background:#fff;border-radius:12px;object-fit:contain">
      <img src="data:image/png;base64,${c.selShot}" style="height:120px;background:#fff;border-radius:12px;object-fit:contain">`).join("")}
    </div></body>`);
  await p2.screenshot({ path: `${EV}/14-expression-system.png` });
  await p2.close();
  console.log("shot 14-expression-system");

  /* ---- 118: mascot audit ---- */
  fs.writeFileSync(`${EV}/15-mascot-source-audit.md`, `# R2 — mascot source audit (§7–§10, §118)

| question | answer |
|---|---|
| Canonical source | \`references/brand/logo.png\`, shipped as \`public/brand/systemboom-logo.png\` (1219×249, transparent) and \`public/brand/systemboom-plate.jpeg\` (red plate) |
| Vector / raster | RASTER only — no vector mascot exists anywhere in the repo |
| The mascot | the cartoon bomb: dark sphere, mischievous grin, angled eyes, rope fuse, lit spark; carries its own white outline so it reads on Deep Cosmos and Solar Observatory |
| What was reused | \`public/brand/systemboom-mascot.png\` (228×228) — an ALPHA-BOUNDED CROP of the official logo's mascot region (column-alpha valley at x=172 separates it from the wordmark), pixels untouched |
| What was NOT altered | everything: no redraw, no second mascot, no facial edits, no pose changes, no proportion changes, no recolour — §9 raster policy applied |
| How expressions derive | each Expression = the SAME canonical mascot + a small surrounding SVG mark (heart / laugh arcs / star / cradling arc / spark burst / laurel) + an accent used only inside the expressive object, + the shared motion personality (quick arrival, tiny overshoot, one Boom Pulse, calm settle). Registry: \`src/components/style-lab/social/expressions.tsx\` |
| Brand integrity | one silhouette, one border language (the artwork's own outline), one motion grammar across all six — blur the UI text and the set still reads SYSTEMBOOM (§113) |
`);
  console.log("wrote 15-mascot-source-audit.md");

  /* ---- 119: motion frame strips (5× slower playback, labels give real-time equivalents) ---- */
  const RATE = 0.2;
  for (const [n, id] of [["16-care", "care"], ["17-joy", "joy"], ["18-wonder", "wonder"], ["19-support", "support"], ["20-celebrate", "celebrate"], ["21-respect", "respect"]]) {
    await go({}, { w: 800, h: 900, dsf: 2 }); await toM("m-rain"); await openRail();
    // document coordinates (clip is page-space, not viewport-space) — the strip's own padding
    const ctl = await page.evaluate(() => { const r = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.left - 18)) + Math.round(scrollX), y: Math.max(0, Math.floor(r.top - 18)) + Math.round(scrollY), width: Math.ceil(r.width + 36), height: Math.ceil(r.height + 36) }; });
    // A real pointer click (never a synthetic DOM click): a tap must not leave the
    // keyboard :focus-visible ring on the control in motion evidence. mouse.click never
    // scrolls, so the clip measured above stays valid.
    const opt = await page.evaluate(`((r) => ({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }))(document.querySelector("[data-sb-expression-option='${id}']").getBoundingClientRect())`);
    await cdp.send("Animation.setPlaybackRate", { playbackRate: RATE }).catch(() => {});
    const t0 = Date.now();
    await page.mouse.click(opt.x, opt.y); // real pointer: no focus ring, no scroll
    const f1 = await page.screenshot({ encoding: "base64", clip: ctl }); const d1 = Math.round((Date.now() - t0) * RATE);
    await sleep(Math.max(0, 180 / RATE - (Date.now() - t0)));
    const f2 = await page.screenshot({ encoding: "base64", clip: ctl }); const d2 = Math.round((Date.now() - t0) * RATE);
    await sleep(Math.max(0, 460 / RATE - (Date.now() - t0)));
    const f3 = await page.screenshot({ encoding: "base64", clip: ctl }); const d3 = Math.round((Date.now() - t0) * RATE);
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
    const p3 = await b.newPage();
    await p3.setViewport({ width: 3 * 170 + 60, height: 220, deviceScaleFactor: 2 });
    const cell = (src, l) => `<figure style="margin:0;display:flex;flex-direction:column;gap:4px;align-items:center"><img src="data:image/png;base64,${src}" style="height:150px;background:#fff;border-radius:12px"><figcaption style="font:11px system-ui;color:#5a6880">${l}</figcaption></figure>`;
    await p3.setContent(`<body style="margin:0;background:#e8ecf3;padding:12px;display:flex;gap:14px">${cell(f1, `start · ≈${d1}ms`)}${cell(f2, `mid · ≈${d2}ms`)}${cell(f3, `end · ≈${d3}ms (5× slowed capture)`)}</body>`);
    await p3.screenshot({ path: `${EV}/${n}-start-mid-end.png` });
    await p3.close();
    console.log("strip", n);
    await openRail(); await domClick("[data-sb-expression-remove]"); await sleep(200);
  }

  /* ---- 120: responses ---- */
  await go({}, { w: 390, h: 844 }); await toM("m-sameage");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-sameage'] button")].find((x) => /Write a note/.test(x.textContent))?.click());
  await sleep(300); await toM("m-sameage"); await shot("22-response-empty", { clip: await clipM("m-sameage") });
  await page.focus("[data-sb-moment='m-sameage'] textarea"); await page.type("[data-sb-moment='m-sameage'] textarea", "Same square, same breath.");
  await shot("23-response-compose-mobile", { clip: await clipM("m-sameage") });
  await go({}, { w: 390, h: 500 }); await toM("m-sameage");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-sameage'] button")].find((x) => /Write a note/.test(x.textContent))?.click());
  await sleep(250); await page.focus("[data-sb-moment='m-sameage'] textarea"); await page.type("[data-sb-moment='m-sameage'] textarea", "Under the keyboard line");
  await page.evaluate(() => document.activeElement?.scrollIntoView({ block: "center" })); await sleep(200);
  await shot("24-response-keyboard-mobile");
  await go({}, { w: 390, h: 844 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(250);
  await page.type("[data-sb-moment='m-rain'] textarea[aria-label='Write a note…']", "The kettle outlasts us all.");
  await page.keyboard.press("Enter"); await sleep(700); await toM("m-rain"); await shot("25-response-sent", { clip: await clipM("m-rain") });
  await loadAll(); await toM("m-forty");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] button")].find((x) => /notes/.test(x.textContent))?.click());
  await sleep(300); await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] button")].find((x) => /View \d+ more/.test(x.textContent))?.click());
  await sleep(300); await toM("m-forty"); await shot("26-response-long");
  await go({}, { w: 390, h: 844 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(250);
  await page.type("[data-sb-moment='m-rain'] textarea[aria-label='Write a note…']", "चिया ☕️ 🙏🏽 👨‍👩‍👧 ✨");
  await page.keyboard.press("Enter"); await sleep(700); await toM("m-rain"); await shot("27-response-emoji", { clip: await clipM("m-rain") });
  await go({}, { w: 390, h: 844, lang: "ne" }); await toM("m-rain");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-rain'] button")].find((x) => /टिप्पणी/.test(x.textContent))?.click());
  await sleep(300); await page.type("[data-sb-moment='m-rain'] textarea", "आज साँच्चै खुसी लाग्यो 🙏");
  await page.keyboard.press("Enter"); await sleep(700); await toM("m-rain"); await shot("28-response-nepali-emoji", { clip: await clipM("m-rain") });
  await go({}, { w: 390, h: 844, lang: "zh-Hans" }); await toM("m-rain");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-rain'] button")].find((x) => /留言/.test(x.textContent))?.click());
  await sleep(300); await toM("m-rain"); await shot("29-response-chinese", { clip: await clipM("m-rain") });
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(300);
  await page.click("[data-sb-moment='m-rain'] [data-sb-note-author]"); await sleep(450); await shot("30-response-author-to-person");

  /* ---- 121: heavy conversation ---- */
  await go({}, { w: 390, h: 844 }); await loadAll(); await toM("m-forty"); await shot("31-many-responses-feed-collapsed", { clip: await clipM("m-forty") });
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] button")].find((x) => /notes/.test(x.textContent))?.click());
  await sleep(300); await toM("m-forty"); await shot("32-many-responses-open");

  /* ---- 122: owner / visitor / preview / health / problem ---- */
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await shot("33-owner-own-moment", { clip: await clipM("m-rain") });
  await go({ viewer: "visitor" }, { w: 390, h: 844 }); await toM("m-rain"); await shot("34-visitor-moment", { clip: await clipM("m-rain") });
  await go({}, { w: 390, h: 844 }); await page.click("[data-sb-view-as-public]"); await sleep(400); await toM("m-rain"); await shot("35-view-as-public", { clip: await clipM("m-rain") });
  await go({}, { w: 390, h: 844 }); await loadAll();
  const healthId = await page.evaluate(() => document.querySelector("[data-sb-moment][data-sb-kind='health']")?.getAttribute("data-sb-moment"));
  await toM(healthId); await shot("36-health-no-expression", { clip: await clipM(healthId) });
  const problemId = await page.evaluate(() => document.querySelector("[data-sb-moment][data-sb-kind='problem']")?.getAttribute("data-sb-moment"));
  await toM(problemId); await shot("37-problem-no-expression", { clip: await clipM(problemId) });

  /* ---- 123: devices (rail open) ---- */
  for (const [w, h, n] of [[320, 640, "38-320"], [360, 800, "39-360"], [390, 844, "40-390"], [430, 932, "41-430"], [768, 1024, "42-768"], [1024, 768, "43-1024"], [1440, 900, "44-1440"]]) {
    await go({}, { w, h, dsf: w > 900 ? 1.5 : 2 }); await toM("m-rain"); await openRail(); await shot(n);
  }

  /* ---- 124: languages (rail open) ---- */
  await go({}, { w: 390, h: 844, lang: "es" }); await toM("m-rain"); await openRail(); await shot("45-spanish");
  await go({}, { w: 390, h: 844, lang: "ru" }); await toM("m-rain"); await openRail(); await shot("46-russian");
  await go({}, { w: 390, h: 844, lang: "ne" }); await toM("m-rain"); await openRail(); await shot("47-nepali");
  await go({}, { w: 390, h: 844, lang: "zh-Hans" }); await toM("m-rain"); await openRail(); await shot("48-chinese");

  /* ---- 125: accessibility ---- */
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await toM("m-rain");
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("ArrowRight"); await sleep(150);
  await shot("49-keyboard-expression", { clip: await clipM("m-rain", 30) });
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(250);
  await page.focus("[data-sb-moment='m-rain'] textarea[aria-label='Write a note…']"); await sleep(150);
  await shot("50-keyboard-response", { clip: await clipM("m-rain") });
  await go({}, { w: 1440, h: 1300, dsf: 1.5 }); await toM("m-rain"); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(200);
  await shot("51-200-percent"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await openRail(); await page.click("[data-sb-expression-option='care']"); await sleep(200);
  await shot("52-reduced-motion-expression", { clip: await clipM("m-rain") });
  await page.click("[data-sb-moment='m-rain'] [data-sb-response-preview]"); await sleep(200);
  await page.type("[data-sb-moment='m-rain'] textarea[aria-label='Write a note…']", "Still complete without motion.");
  await page.keyboard.press("Enter"); await sleep(600); await toM("m-rain"); await shot("53-reduced-motion-response", { clip: await clipM("m-rain") });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 126: performance ---- */
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await go({}, { w: 390, h: 844 }); await toM("m-rain");
  const t0 = Date.now();
  await openRail(); await page.click("[data-sb-expression-option='joy']"); await sleep(500);
  const throttleMs = Date.now() - t0;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await shot("54-cpu-throttle-expression", { clip: await clipM("m-rain") });
  await go({}, { w: 1440, h: 1400, dsf: 1 }); await loadAll();
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "start" })); await sleep(400);
  const idle = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  await shot("55-many-static-expression-summaries");
  const mascotKB = Math.round(fs.statSync("/Users/roshan/SYSTEMBOOM_V2/public/brand/systemboom-mascot.png").size / 1024);
  console.log(`perf: 4x-throttled rail→select→settle ${throttleMs}ms; idle running animations with summaries on screen: ${idle}; mascot asset ${mascotKB}KB (one raster + inline SVG marks, no Lottie/GIF/canvas)`);

  /* ---- 127: before / after ---- */
  fs.copyFileSync("/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s3-s4-human-social/07-text-moment-360.png", `${EV}/56-current-respond-before.png`);
  await go({}, { w: 360, h: 800 }); await toM("m-rain"); await shot("57-r2-respond-after", { clip: await clipM("m-rain") });

  await b.close();
  console.log("DONE r2 capture");
})();
