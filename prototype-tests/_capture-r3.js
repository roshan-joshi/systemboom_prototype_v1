/** R3 — expression language + conversation evidence (not a test).
 *  prototype-evidence/social-r3-3d-expression/. Motion strips use the browser Animation
 *  domain at 5× slower playback (evidence method only; labels give real-time equivalents)
 *  and real pointer clicks so no keyboard focus ring appears. Dev indicator hidden for
 *  capture only. */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-r3-3d-expression";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EV, { recursive: true });
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const EXT = ["respect", "thanks", "inspired", "curious", "touched", "withyou"];
const NAME = { care: "Care", joy: "Joy", laugh: "Laugh", wow: "Wow", celebrate: "Celebrate", support: "Support", respect: "Respect", thanks: "Thanks", inspired: "Inspired", curious: "Curious", touched: "Touched", withyou: "With you" };
const MEANING = { care: "warmth given", joy: "this made me happy", laugh: "genuinely funny", wow: "surprise", celebrate: "congratulations", support: "steady, I'm with you", respect: "recognition", thanks: "gratitude", inspired: "this moves me", curious: "tell me more", touched: "moved (receiving)", withyou: "empathy, presence" };

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send("Animation.enable").catch(() => {});
  const go = async (params, { w = 390, h = 844, dsf = 2, theme = "light", lang = "en" } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf, hasTouch: w < 900 });
    await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
    await page.goto(`${BASE}?${new URLSearchParams({ harness: "0", theme, lang, ...params })}`, { waitUntil: "networkidle2" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await sleep(520);
  };
  const shot = async (n, opts = {}) => { await page.screenshot({ path: `${EV}/${n}.png`, ...opts }); console.log("shot", n); };
  const clip = (sel, pad = 10) => page.evaluate((s, p) => { const r = document.querySelector(s).getBoundingClientRect(); const vx = Math.max(0, Math.floor(r.left - p)), vy = Math.max(0, Math.floor(r.top - p)); return { x: vx + Math.round(scrollX), y: vy + Math.round(scrollY), width: Math.max(1, Math.min(Math.floor(innerWidth) - vx - 1, Math.ceil(r.width + p * 2))), height: Math.max(1, Math.min(Math.floor(innerHeight) - vy - 1, Math.ceil(r.height + p * 2))) }; }, sel, pad);
  const tap = async (sel) => { const pt = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, sel); await page.mouse.click(pt.x, pt.y); };
  const toM = async (id) => { await page.evaluate((x) => document.querySelector(`[data-sb-moment='${x}']`)?.scrollIntoView({ block: "center" }), id); await sleep(250); };
  const loadAll = async () => { for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); } };
  const rail = async () => { await tap("[data-sb-moment='m-rain'] [data-sb-express]"); await sleep(350); };
  const clearMine = async () => { await rail(); const rm = await page.$("[data-sb-expression-remove]"); if (rm) { await tap("[data-sb-expression-remove]"); await sleep(250); } else { await page.keyboard.press("Escape"); await sleep(150); } };

  /* ---- 97: the expression language contact sheet (the major owner-review artifact) ---- */
  const cells = [];
  for (const theme of ["light", "dark"]) {
    await go({}, { w: 760, h: 900, dsf: 2, theme });
    await toM("m-rain");
    for (const id of [...QUICK, ...EXT]) {
      await rail();
      if (EXT.includes(id)) { await tap("[data-sb-expression-more]"); await sleep(320); }
      const statik = await page.screenshot({ encoding: "base64", clip: await clip(`[data-sb-expression-option='${id}'] [data-sb-expression]`, 3) });
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.2 }).catch(() => {});
      await tap(`[data-sb-expression-option='${id}']`); await sleep(340);
      const ctl = await clip("[data-sb-moment='m-rain'] [data-sb-express]", 16);
      const key = await page.screenshot({ encoding: "base64", clip: ctl });
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
      await sleep(700);
      const sel = await page.screenshot({ encoding: "base64", clip: ctl });
      cells.push({ theme, id, statik, key, sel });
      await clearMine();
    }
  }
  const p2 = await b.newPage();
  await p2.setViewport({ width: 1500, height: 12 * 96 + 120, deviceScaleFactor: 1.4 });
  const row = (c) => `<b style="font-size:14px">${NAME[c.id]}</b><i style="font-size:12px;color:#5a6880;font-style:normal">${MEANING[c.id]}</i>` +
    ["statik", "key", "sel"].map((k) => `<img src="data:image/png;base64,${c[k]}" style="height:78px;background:${c.theme === "dark" ? "#10141e" : "#fff"};border-radius:10px;object-fit:contain">`).join("");
  const grid = (theme) => `<div style="flex:1"><h2 style="font:600 14px system-ui;color:#0f1520;margin:0 0 8px">${theme === "light" ? "Solar Observatory (light)" : "Deep Cosmos (dark)"}</h2>
    <div style="display:grid;grid-template-columns:96px 132px 92px 92px 92px;gap:6px 10px;align-items:center;font:13px system-ui;color:#0f1520">
      <b></b><b></b><b style="font-size:11px;color:#5a6880">static</b><b style="font-size:11px;color:#5a6880">key frame</b><b style="font-size:11px;color:#5a6880">selected</b>
      ${cells.filter((c) => c.theme === theme).map(row).join("")}
    </div></div>`;
  await p2.setContent(`<body style="margin:0;background:#e8ecf3;padding:16px;display:flex;gap:26px">${grid("light")}${grid("dark")}</body>`);
  await p2.screenshot({ path: `${EV}/expression-language.png` });
  await p2.close();
  console.log("shot expression-language");

  /* ---- 98: motion storyboard — quick six get five beats, extended six get three ---- */
  const RATE = 0.2;
  const storyboard = async (id, beats) => {
    await go({}, { w: 760, h: 900, dsf: 2 });
    await toM("m-rain"); await rail();
    if (EXT.includes(id)) { await tap("[data-sb-expression-more]"); await sleep(320); }
    const pt = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, `[data-sb-expression-option='${id}']`);
    const ctl = await clip("[data-sb-moment='m-rain'] [data-sb-express]", 18);
    await cdp.send("Animation.setPlaybackRate", { playbackRate: RATE }).catch(() => {});
    const t0 = Date.now(); const frames = [];
    await page.mouse.click(pt.x, pt.y);
    for (const [label, at] of beats) {
      await sleep(Math.max(0, at / RATE - (Date.now() - t0)));
      frames.push({ label, ms: Math.round((Date.now() - t0) * RATE), img: await page.screenshot({ encoding: "base64", clip: ctl }) });
    }
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
    const p3 = await b.newPage();
    await p3.setViewport({ width: frames.length * 138 + 40, height: 190, deviceScaleFactor: 2 });
    await p3.setContent(`<body style="margin:0;background:#e8ecf3;padding:12px;display:flex;gap:10px">${frames.map((f) => `<figure style="margin:0;display:flex;flex-direction:column;gap:4px;align-items:center"><img src="data:image/png;base64,${f.img}" style="height:124px;background:#fff;border-radius:10px"><figcaption style="font:10px system-ui;color:#5a6880;text-align:center">${f.label}<br>≈${f.ms}ms</figcaption></figure>`).join("")}</body>`);
    await p3.screenshot({ path: `${EV}/motion-${id}.png` });
    await p3.close();
    console.log("storyboard", id);
  };
  const FIVE = [["start", 10], ["anticipation", 90], ["peak", 200], ["boom pulse", 330], ["settled", 620]];
  const THREE = [["start", 10], ["peak", 200], ["settled", 560]];
  for (const id of QUICK) await storyboard(id, FIVE);
  for (const id of EXT) await storyboard(id, THREE);

  /* ---- expression UX ---- */
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await shot("01-moment-actions-390", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 844, theme: "dark" }); await toM("m-rain"); await shot("02-moment-actions-390-dark", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await rail(); await shot("03-quick-rail-390", { clip: await clip("[data-sb-moment='m-rain']", 16) });
  await tap("[data-sb-expression-more]"); await sleep(350); await shot("04-more-panel-390", { clip: await clip("[data-sb-moment='m-rain']", 16) });
  await tap("[data-sb-expression-option='touched']"); await sleep(900); await toM("m-rain"); await shot("05-selected-extended", { clip: await clip("[data-sb-moment='m-rain']") });
  await rail(); await shot("06-change-expression", { clip: await clip("[data-sb-moment='m-rain']", 16) });
  await tap("[data-sb-expression-remove]"); await sleep(400); await toM("m-rain"); await shot("07-removed", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await page.click("[data-sb-moment='m-rain'] [data-sb-expression-summary]"); await sleep(350); await shot("08-who-expressed", { clip: await clip("[data-sb-moment='m-rain']", 16) });
  await go({}, { w: 320, h: 640 }); await toM("m-rain"); await rail(); await shot("09-quick-rail-320", { clip: await clip("[data-sb-moment='m-rain']", 12) });
  await tap("[data-sb-expression-more]"); await sleep(350); await shot("10-more-panel-320", { clip: await clip("[data-sb-moment='m-rain']", 12) });
  await go({}, { w: 1440, h: 900, dsf: 1.5 }); await toM("m-rain"); await rail(); await shot("11-quick-rail-desktop", { clip: await clip("[data-sb-moment='m-rain']", 30) });

  /* ---- 99: conversation ---- */
  await go({}, { w: 390, h: 844 }); await loadAll(); await toM("m-snow"); await shot("12-conversation-none", { clip: await clip("[data-sb-moment='m-snow']") });
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await shot("13-conversation-one", { clip: await clip("[data-sb-moment='m-rain']") });
  await page.click("[data-sb-moment='m-rain'] [data-sb-responses]"); await sleep(400); await toM("m-rain"); await shot("14-conversation-inline", { clip: await clip("[data-sb-moment='m-rain']") });
  await page.type("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea", "The kettle outlasts us all ☕️🙏🏽");
  await shot("15-response-composer", { clip: await clip("[data-sb-moment='m-rain']") });
  await page.keyboard.press("Enter"); await sleep(700); await toM("m-rain"); await shot("16-response-sent-emoji", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 500 }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-respond]"); await sleep(450); await shot("17-conversation-keyboard-short", { clip: await clip("[data-sb-moment='m-rain']", 8) });
  await go({}, { w: 390, h: 844 }); await loadAll();
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']")?.scrollIntoView({ block: "center" })); await sleep(250);
  await shot("18-deep-collapsed", { clip: await clip("[data-sb-moment='m-forty']") });
  await page.click("[data-sb-moment='m-forty'] [data-sb-responses]"); await sleep(600); await shot("19-focused-conversation-mobile", { clip: await clip("[data-sb-conversation-surface] [role=dialog]", 0) });
  await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] [data-sb-response-composer] textarea")?.focus()); await sleep(200);
  await shot("20-focused-conversation-composer", { clip: await clip("[data-sb-conversation-surface] [role=dialog]", 0) });
  await go({}, { w: 1440, h: 1000, dsf: 1.5 }); await loadAll();
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']")?.scrollIntoView({ block: "center" })); await sleep(250);
  await page.click("[data-sb-moment='m-forty'] [data-sb-responses]"); await sleep(450); await shot("21-deep-conversation-desktop", { clip: await clip("[data-sb-moment='m-forty']", 16) });
  await go({}, { w: 390, h: 844, lang: "ne" }); await toM("m-rain");
  await page.click("[data-sb-moment='m-rain'] [data-sb-responses]"); await sleep(350);
  await page.type("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea", "आज साँच्चै खुसी लाग्यो 🙏");
  await page.keyboard.press("Enter"); await sleep(700); await toM("m-rain"); await shot("22-response-nepali-emoji", { clip: await clip("[data-sb-moment='m-rain']") });

  /* ---- 100: devices (action area focus) ---- */
  for (const [w, h, theme, n] of [[320, 640, "light", "23-320-light"], [320, 640, "dark", "24-320-dark"], [360, 800, "light", "25-360-light"], [360, 800, "dark", "26-360-dark"], [390, 844, "light", "27-390"], [430, 932, "light", "28-430"], [768, 1024, "light", "29-768"], [1024, 768, "light", "30-1024"], [1440, 900, "light", "31-1440"], [1920, 1080, "light", "32-1920"]]) {
    await go({}, { w, h, dsf: w > 900 ? 1.5 : 2, theme });
    await toM("m-rain");
    await shot(n, { clip: await clip("[data-sb-moment='m-rain']") });
  }

  /* ---- 101: languages ---- */
  for (const [lang, n] of [["es", "33-spanish"], ["ru", "34-russian"], ["ne", "35-nepali"], ["zh-Hans", "36-chinese"]]) {
    await go({}, { w: 390, h: 844, lang });
    await toM("m-rain"); await rail(); await tap("[data-sb-expression-more]"); await sleep(350);
    await shot(n, { clip: await clip("[data-sb-moment='m-rain']", 16) });
  }

  /* ---- 102: accessibility ---- */
  await go({}, { w: 1440, h: 900, dsf: 1.5 }); await toM("m-rain");
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await sleep(150);
  await shot("37-keyboard-expression", { clip: await clip("[data-sb-moment='m-rain']", 30) });
  await page.keyboard.press("Enter"); await sleep(600);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").click()); await sleep(350);
  await shot("38-selected-high-contrast", { clip: await clip("[data-sb-expression-rail]", 10) });
  await go({}, { w: 390, h: 1100, dsf: 2 }); await toM("m-rain"); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]")?.click()); await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-expression-more]")?.click()); await sleep(350);
  await shot("39-200-percent", { clip: await clip("[data-sb-expression-panel]", 14) }); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({}, { w: 390, h: 844 }); await toM("m-rain"); await rail(); await tap("[data-sb-expression-more]"); await sleep(250);
  await shot("40-reduced-motion-poses", { clip: await clip("[data-sb-expression-panel]", 14) });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- owner / visitor / preview / health / problem ---- */
  await go({}, { w: 390, h: 844 }); await loadAll(); await toM("m-panorama"); await shot("41-owner-own-moment", { clip: await clip("[data-sb-moment='m-panorama']") });
  await go({ viewer: "visitor" }, { w: 390, h: 844 }); await toM("m-rain"); await shot("42-visitor", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 844 }); await page.click("[data-sb-view-as-public]"); await sleep(400); await toM("m-rain"); await shot("43-view-as-public", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 390, h: 844 }); await loadAll();
  for (const [kind, n] of [["health", "44-health-no-expression"], ["problem", "45-problem-no-expression"]]) {
    const id = await page.evaluate((k) => document.querySelector(`[data-sb-moment][data-sb-kind='${k}']`)?.getAttribute("data-sb-moment"), kind);
    await toM(id); await shot(n, { clip: await clip(`[data-sb-moment='${id}']`) });
  }

  /* ---- 103: performance ---- */
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await go({}, { w: 390, h: 844 }); await toM("m-rain");
  let t = Date.now(); await rail(); const railMs = Date.now() - t;
  t = Date.now(); await tap("[data-sb-expression-more]"); await sleep(50); const moreMs = Date.now() - t;
  t = Date.now(); await tap("[data-sb-expression-option='curious']"); await sleep(600); const selMs = Date.now() - t;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await shot("46-cpu-throttle", { clip: await clip("[data-sb-moment='m-rain']") });
  await go({}, { w: 1440, h: 1400, dsf: 1 }); await loadAll();
  await page.evaluate(() => window.scrollTo(0, 600));
  await sleep(400);
  const idle = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  await shot("47-many-summaries-still", { clip: await clip("[data-sb-sheet]", 0) });
  const mascotKB = Math.round(fs.statSync("/Users/roshan/SYSTEMBOOM_V2/public/brand/systemboom-mascot.png").size / 1024);
  console.log(`perf: 4x-throttled rail ${railMs}ms · More ${moreMs}ms · select+settle ${selMs}ms; idle running animations ${idle}; shipped mascot ${mascotKB}KB (one raster + inline SVG marks; the twelve 3D renders are pending owner asset)`);

  await b.close();
  console.log("DONE r3 capture");
})();
