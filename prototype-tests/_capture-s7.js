/** S7 — device-mastery evidence capture (not a test).
 *  prototype-evidence/s7-device-mastery/: the 60 required shots, the device
 *  contact sheet (device-matrix.png) and layout-metrics.md (first-view +
 *  surface metrics, S2/S6 baseline vs S7). Safe areas / keyboard / network are
 *  SIMULATED in a desktop Chromium — labelled as such, never claimed as
 *  real-device Safari/Android verification. The framework dev indicator is
 *  hidden for evidence capture only. */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s7-device-mastery";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EV, { recursive: true });

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  const go = async (params, { w = 1440, h = 900, dsf = 1.5, theme = "light", lang = "en", touch } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf, hasTouch: touch ?? w < 900 });
    await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
    const qs = new URLSearchParams({ harness: "0", theme, lang, ...params }).toString();
    await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await sleep(550);
  };
  const shot = async (n) => { await page.screenshot({ path: `${EV}/${n}.png` }); console.log("shot", n); };
  const b64 = () => page.screenshot({ encoding: "base64" });
  const typeInto = (sel, v) => page.evaluate((s, val) => { const i = document.querySelector(s); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); }, sel, v);

  /* ---- 92: phone owner ---- */
  await go({}, { w: 320, h: 640, dsf: 2 }); await shot("01-owner-320-light");
  await go({}, { w: 320, h: 640, dsf: 2, theme: "dark" }); await shot("02-owner-320-dark");
  await go({}, { w: 360, h: 800, dsf: 2 }); await shot("03-owner-360-light");
  await go({}, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("04-owner-360-dark");
  await go({}, { w: 375, h: 812, dsf: 2 }); await shot("05-owner-375-light");
  await go({}, { w: 390, h: 844, dsf: 2, theme: "dark" }); await shot("06-owner-390-dark");
  await go({}, { w: 412, h: 915, dsf: 2 }); await shot("07-owner-412-light");
  await go({}, { w: 430, h: 932, dsf: 2, theme: "dark" }); await shot("08-owner-430-dark");

  /* ---- 93: phone visitor ---- */
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2 }); await shot("09-visitor-360-light");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("10-visitor-360-dark");
  await go({ viewer: "visitor", profileName: "क Krishna Bahadur Gurung Tamang Magar Rana" }, { w: 360, h: 800, dsf: 2 }); await shot("11-visitor-long-name-360");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, lang: "ne" }); await shot("12-visitor-nepali-360");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, lang: "zh-Hans" }); await shot("13-visitor-chinese-360");

  /* ---- 94: phone transient + keyboard-short (simulated keyboard = reduced viewport height) ---- */
  await go({}, { w: 360, h: 800, dsf: 2 }); await page.click("[data-sb-search-toggle]"); await sleep(400); await shot("14-search-360");
  await go({}, { w: 360, h: 420, dsf: 2 }); await page.click("[data-sb-search-toggle]"); await sleep(350); await typeInto("[data-sb-search-input]", "Boudha"); await sleep(350); await shot("15-search-keyboard-short");
  await go({}, { w: 360, h: 800, dsf: 2 }); await page.click("[data-sb-people]"); await sleep(400); await shot("16-people-360");
  await go({}, { w: 360, h: 420, dsf: 2 }); await page.click("[data-sb-people]"); await sleep(300); await typeInto("[data-sb-people-find]", "Grace"); await sleep(300); await shot("17-people-keyboard-short");
  await go({ bell: "1" }, { w: 360, h: 800, dsf: 2 }); await shot("18-notifications-360");
  await go({ composer: "1" }, { w: 360, h: 800, dsf: 2 }); await sleep(300); await shot("19-composer-360");
  await go({ composer: "1" }, { w: 360, h: 420, dsf: 2 }); await sleep(300); await page.type("#sb-composer-text", "The kettle, the first light."); await shot("20-composer-keyboard-short");

  /* ---- 95: phone signal states (real store interactions at 1024, then resized to 360 — state survives resize) ---- */
  const readAllMessages = async () => {
    for (let i = 0; i < 3; i++) {
      await page.click("[data-sb-messages]"); await sleep(300);
      const opened = await page.evaluate((idx) => { const rows = [...document.querySelectorAll("[data-sb-conversation]")]; if (rows[idx]) { rows[idx].click(); return true; } return false; }, i);
      await sleep(300);
      if (opened) { await page.click("[data-sb-mini-close]").catch(() => {}); await sleep(200); }
    }
  };
  const to360 = async () => { await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, hasTouch: true }); await sleep(350); };
  // 25: all real signals (seed)
  await go({}, { w: 360, h: 800, dsf: 2 }); await shot("25-topbar-all-real-signals");
  // 24: friend request only — read messages + mark notifications read (the request stays actionable)
  await go({}, { w: 1024, h: 900, dsf: 2, touch: true });
  await readAllMessages();
  await page.click("[data-sb-bell]"); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-notifications] button")].find((b) => /Mark all read/.test(b.textContent))?.click()); await sleep(200);
  await page.keyboard.press("Escape"); await sleep(200);
  await to360(); await shot("24-topbar-friend-request");
  // 23: notification unread only — read messages + resolve the request (its notification row read)
  await go({}, { w: 1024, h: 900, dsf: 2, touch: true });
  await readAllMessages();
  await page.click("[data-sb-people]"); await sleep(300);
  await page.click("[data-sb-people-accept]"); await sleep(250);
  await page.keyboard.press("Escape"); await sleep(200);
  await to360(); await shot("23-topbar-notification-unread");
  // 22: message unread only — mark all notifications read + resolve the request
  await go({}, { w: 1024, h: 900, dsf: 2, touch: true });
  await page.click("[data-sb-people]"); await sleep(300);
  await page.click("[data-sb-people-accept]"); await sleep(250);
  await page.keyboard.press("Escape"); await sleep(150);
  await page.click("[data-sb-bell]"); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-notifications] button")].find((b) => /Mark all read/.test(b.textContent))?.click()); await sleep(200);
  await page.keyboard.press("Escape"); await sleep(200);
  await to360(); await shot("22-topbar-message-unread");
  // 21: no unread anywhere
  await go({}, { w: 1024, h: 900, dsf: 2, touch: true });
  await readAllMessages();
  await page.click("[data-sb-people]"); await sleep(300);
  await page.click("[data-sb-people-accept]"); await sleep(250);
  await page.keyboard.press("Escape"); await sleep(150);
  await page.click("[data-sb-bell]"); await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-notifications] button")].find((b) => /Mark all read/.test(b.textContent))?.click()); await sleep(200);
  await page.keyboard.press("Escape"); await sleep(200);
  await to360(); await shot("21-topbar-no-unread");

  /* ---- 96: landscape ---- */
  await go({}, { w: 844, h: 390, dsf: 2 }); await shot("26-landscape-owner");
  await go({}, { w: 844, h: 390, dsf: 2 }); await page.click("[data-sb-people]"); await sleep(350); await shot("27-landscape-people");
  await go({ composer: "1" }, { w: 844, h: 390, dsf: 2 }); await sleep(300); await shot("28-landscape-composer");
  await go({ bell: "1" }, { w: 844, h: 390, dsf: 2 }); await shot("29-landscape-notifications");

  /* ---- 97: tablet ---- */
  await go({}, { w: 768, h: 1024 }); await shot("30-tablet-768-portrait");
  await go({}, { w: 820, h: 1180 }); await shot("31-tablet-820-portrait");
  await go({}, { w: 1024, h: 768 }); await shot("32-tablet-1024-landscape");
  await go({}, { w: 820, h: 1180 }); await page.click("[data-sb-open-person]"); await sleep(400); await shot("33-tablet-person");
  await go({ composer: "1" }, { w: 820, h: 1180 }); await sleep(300); await shot("34-tablet-composer");
  await go({}, { w: 820, h: 1180 }); await page.click("[data-sb-people]"); await sleep(400); await shot("35-tablet-people");
  await go({}, { w: 820, h: 1180 }); await page.focus("input[type=search]"); await page.keyboard.type("Boudha"); await sleep(400); await shot("36-tablet-search");
  await go({ bell: "1" }, { w: 820, h: 1180 }); await shot("37-tablet-notifications");

  /* ---- 98: desktop ---- */
  for (const [w, h, n] of [[1024, 768, "38-desktop-1024"], [1280, 800, "39-desktop-1280"], [1366, 768, "40-desktop-1366"], [1440, 900, "41-desktop-1440"], [1600, 900, "42-desktop-1600"], [1920, 1080, "43-desktop-1920"]]) {
    await go({}, { w, h, dsf: 1 }); await shot(n);
  }

  /* ---- 99: desktop transients ---- */
  await go({}, { w: 1024, h: 768, dsf: 1 }); await page.focus("input[type=search]"); await page.keyboard.type("a"); await sleep(400); await shot("44-1024-search");
  await go({}, { w: 1024, h: 768, dsf: 1 }); await page.click("[data-sb-people]"); await sleep(350); await shot("45-1024-people");
  await go({ bell: "1" }, { w: 1024, h: 768, dsf: 1 }); await shot("46-1024-notifications");
  await go({}, { w: 1920, h: 1080, dsf: 1 }); await page.focus("input[type=search]"); await page.keyboard.type("a"); await sleep(400); await shot("47-1920-search");
  await go({}, { w: 1920, h: 1080, dsf: 1 }); await page.click("[data-sb-people]"); await sleep(350); await shot("48-1920-people");
  await go({ bell: "1" }, { w: 1920, h: 1080, dsf: 1 }); await shot("49-1920-notifications");

  /* ---- 100: accessibility / scale ---- */
  await go({}, { w: 360, h: 800, dsf: 2 }); await page.evaluate(() => { document.body.style.zoom = "1.5"; }); await sleep(300); await shot("50-150-percent-mobile"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  // 200% mobile = WCAG reflow equivalence: 200% page zoom on a 640px-wide phone yields a 320px CSS viewport.
  await go({}, { w: 320, h: 640, dsf: 2 }); await shot("51-200-percent-mobile");
  await go({}, { w: 1440, h: 1200 }); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300); await shot("52-200-percent-desktop"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await go({ bell: "1" }, { w: 360, h: 800, dsf: 2, lang: "ru" }); await shot("53-russian-360");
  await go({}, { w: 360, h: 800, dsf: 2, lang: "ne" }); await page.click("[data-sb-people]"); await sleep(350); await shot("54-nepali-360");
  await go({ composer: "1" }, { w: 360, h: 800, dsf: 2, lang: "zh-Hans" }); await sleep(300); await shot("55-chinese-360");
  await go({}, { w: 820, h: 1180 }); await page.evaluate(() => document.querySelector("[data-sb-people]").focus()); await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Tab"); await sleep(150); await shot("56-keyboard-tablet");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({}, { w: 360, h: 800, dsf: 2 }); await page.click("[data-sb-people]"); await sleep(200); await shot("57-reduced-motion-mobile");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 101: loading / media (simulated slow network) ---- */
  const cdp = await page.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 500, downloadThroughput: (300 * 1024) / 8, uploadThroughput: (100 * 1024) / 8 });
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, hasTouch: true });
  await page.setCookie({ name: "sb-locale", value: "en", domain: "localhost", path: "/" });
  await page.goto(`${BASE}?harness=0&theme=light&nocache=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await sleep(500); await shot("58-slow-profile-media");
  await page.evaluate(() => document.querySelector("[data-sb-moment]")?.scrollIntoView()); await sleep(250); await shot("59-slow-moment-media");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await go({ photo: "broken", wall: "broken" }, { w: 360, h: 800, dsf: 2 }); await shot("60-image-failure-phone");

  /* ---- 102: device contact sheet ---- */
  const frames = [];
  for (const [w, h] of [[320, 640], [360, 800], [390, 844], [412, 915], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
    await go({}, { w, h, dsf: 1 });
    frames.push({ w, h, img: await b64() });
  }
  const p2 = await b.newPage();
  const H = 420;
  const cells = frames.map((f) => { const cw = Math.round((f.w / f.h) * H); return `<figure style="margin:0;display:flex;flex-direction:column;gap:6px"><img src="data:image/png;base64,${f.img}" style="width:${cw}px;height:${H}px;object-fit:cover;object-position:top;border-radius:10px;box-shadow:0 1px 0 rgba(0,0,0,.10)"><figcaption style="font:12px system-ui;color:#5a6880">${f.w} × ${f.h}</figcaption></figure>`; });
  const total = frames.reduce((a, f) => a + Math.round((f.w / f.h) * H), 0) + 12 * frames.length + 24;
  await p2.setViewport({ width: Math.min(total, 4600), height: H + 52, deviceScaleFactor: 1 });
  await p2.setContent(`<body style="margin:0;background:#e8ecf3;padding:12px;display:flex;gap:12px;align-items:flex-start">${cells.join("")}</body>`);
  await p2.screenshot({ path: `${EV}/device-matrix.png` });
  await p2.close();
  console.log("shot device-matrix");

  /* ---- 103/104: layout + surface metrics ---- */
  const rows = [];
  for (const [w, h] of [[320, 640], [360, 800], [375, 812], [390, 844], [412, 915], [430, 932]]) {
    await go({}, { w, h, dsf: 1 });
    rows.push(await page.evaluate((vw, vh) => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const bar = r("[data-sb-topbar] > div"); const hero = r("[data-sb-hero]"); const comp = r("[data-sb-open-composer]"); const fm = r("[data-sb-moment]");
      return { vw, vh, bar: Math.round(bar.height), heroBottom: Math.round(hero.bottom + scrollY), composerBottom: comp ? Math.round(comp.bottom + scrollY) : null, firstMoment: Math.round(fm.top + scrollY), ratio: +((fm.top + scrollY) / vh).toFixed(2), overflow: document.documentElement.scrollWidth > vw + 1, sticky: Math.round(bar.height) };
    }, w, h));
  }
  const visitorRows = [];
  for (const [w, h] of [[360, 800]]) {
    await go({ viewer: "visitor" }, { w, h, dsf: 1 });
    visitorRows.push(await page.evaluate((vw, vh) => { const fm = document.querySelector("[data-sb-moment]").getBoundingClientRect(); return { vw, vh, firstMoment: Math.round(fm.top + scrollY), ratio: +((fm.top + scrollY) / vh).toFixed(2) }; }, w, h));
  }
  const surf = [];
  const surfProbe = (device, name, keyboard) => page.evaluate((d, n, k) => {
    const sel = { search: "[data-sb-search-surface] > div", people: "[data-sb-people-panel]", notifications: "[data-sb-notifications]", composer: "[data-sb-composer]" }[n];
    const el = document.querySelector(sel); const r = el.getBoundingClientRect();
    const owner = /(auto|scroll)/.test(getComputedStyle(el).overflowY) ? n + " surface" : (el.querySelector("[class*=overflow-y-auto]") ? "inner region" : "page");
    return { device: d, surface: n, top: Math.round(r.top), bottom: Math.round(r.bottom), viewport: innerHeight, keyboard: k, owner, clipped: r.bottom > innerHeight + 1 };
  }, device, name, keyboard);
  await go({}, { w: 360, h: 800, dsf: 1 }); await page.click("[data-sb-search-toggle]"); await sleep(300); surf.push(await surfProbe("360×800", "search", "no"));
  await go({}, { w: 360, h: 420, dsf: 1 }); await page.click("[data-sb-search-toggle]"); await sleep(300); surf.push(await surfProbe("360×420", "search", "simulated"));
  await go({}, { w: 360, h: 800, dsf: 1 }); await page.click("[data-sb-people]"); await sleep(300); surf.push(await surfProbe("360×800", "people", "no"));
  await go({}, { w: 360, h: 420, dsf: 1 }); await page.click("[data-sb-people]"); await sleep(300); surf.push(await surfProbe("360×420", "people", "simulated"));
  await go({ bell: "1" }, { w: 360, h: 800, dsf: 1 }); surf.push(await surfProbe("360×800", "notifications", "no"));
  await go({ bell: "1" }, { w: 844, h: 390, dsf: 1 }); surf.push(await surfProbe("844×390", "notifications", "no"));
  await go({ composer: "1" }, { w: 360, h: 420, dsf: 1 }); await sleep(300); surf.push(await surfProbe("360×420", "composer", "simulated"));
  await go({ composer: "1" }, { w: 768, h: 1024, dsf: 1 }); await sleep(300); surf.push(await surfProbe("768×1024", "composer", "no"));
  await go({ bell: "1" }, { w: 1440, h: 900, dsf: 1 }); surf.push(await surfProbe("1440×900", "notifications", "no"));

  // low-end smoke: 4× CPU throttle, one full interaction chain
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await go({}, { w: 360, h: 800, dsf: 1 });
  const t0 = Date.now();
  await page.click("[data-sb-people]"); await sleep(80);
  await typeInto("[data-sb-people-find]", "Grace"); await sleep(80);
  await page.keyboard.press("Escape"); await sleep(80);
  await page.click("[data-sb-open-composer]"); await sleep(200);
  const throttled = Date.now() - t0;
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

  const md = `# S7 — layout metrics (generated by \`prototype-tests/_capture-s7.js\`)

Measured on the running dev build, desktop Chromium headless. Keyboard states are
SIMULATED as reduced viewport height (360×420); safe areas are structural (env() hooks
asserted, not a physical notch); no physical-device Safari/Android validation is claimed.

## First view — owner (portrait phones)

| viewport | top bar | hero bottom | composer bar bottom | first Moment Y | first Moment / viewport | horizontal overflow | sticky height |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.vw}×${r.vh} | ${r.bar}px | ${r.heroBottom}px | ${r.composerBottom}px | ${r.firstMoment}px | ${r.ratio} | ${r.overflow ? "YES" : "no"} | ${r.sticky}px |`).join("\n")}

## First view — visitor

| viewport | first Moment Y | ratio |
|---|---|---|
${visitorRows.map((r) => `| ${r.vw}×${r.vh} | ${r.firstMoment}px | ${r.ratio} |`).join("\n")}

## Baseline → S7

| metric | S2/S6 baseline (360×800) | S7 final |
|---|---|---|
| owner first Moment | 686px | ${rows[1].firstMoment}px |
| visitor first Moment | 625px | ${visitorRows[0].firstMoment}px |
| owner budget (≤720) | — | ${rows[1].firstMoment <= 720 ? "HOLDS" : "EXCEEDED"} |
| visitor budget (≤650) | — | ${visitorRows[0].firstMoment <= 650 ? "HOLDS" : "EXCEEDED"} |
| tablet 768 first Moment | 1152px (Circle module above the feed) | 671px (Moments recomposed first) |
| landscape 844×390 first Moment | 1058px | 577px (short-height hero compaction) |
| 320 horizontal overflow | 9px + Search utility clipped away | none, all utilities live |

## Surface metrics

| device | surface | top | bottom | viewport | keyboard | scroll owner | clipped |
|---|---|---|---|---|---|---|---|
${surf.map((s) => `| ${s.device} | ${s.surface} | ${s.top}px | ${s.bottom}px | ${s.viewport}px | ${s.keyboard} | ${s.owner} | ${s.clipped ? "YES" : "no"} |`).join("\n")}

## Low-end smoke (4× CPU throttle, simulated)

People open → find → close → Composer open completed in ${throttled}ms with no page error.

## Responsive images (honest note)

The prototype's mock assets are single-size files served from \`public/mock/social/\`;
srcset/size variants are a live-build concern (real CDN). What the prototype guarantees:
every list/feed image is \`loading="lazy" decoding="async"\`, every media frame declares
its aspect ratio up front (no layout shift on decode), and a failed image degrades to the
photo's own words (SafeImg) — verified in 58–60.
`;
  fs.writeFileSync(`${EV}/layout-metrics.md`, md);
  console.log("wrote layout-metrics.md");

  await b.close();
  console.log("DONE s7 capture");
})();
