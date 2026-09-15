/** S5+S6 — evidence capture (not a test). prototype-evidence/s5-s6-discovery-motion/.
 *  Frame strips (28–36) are three real screenshots — start (the first paint after the trigger),
 *  mid (~90ms) and end (~450ms) — composed side by side. The framework dev indicator is hidden
 *  for evidence capture only (a style tag injected into the page; production untouched). */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s5-s6-discovery-motion";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EV, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  let vp = { w: 1440, h: 900 };
  const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  const go = async (params, { w = 1440, h = 900, dsf = 1.5, theme = "light", lang = "en" } = {}) => {
    vp = { w, h };
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf, hasTouch: w < 700 });
    await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
    const qs = new URLSearchParams({ harness: "0", theme, lang, ...params }).toString();
    await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
    await hideDev();
    await sleep(650);
  };
  const shot = async (n, opts = {}) => { await page.screenshot({ path: `${EV}/${n}.png`, ...opts }); console.log("shot", n); };
  const clipOf = async (sel, pad = 8) => page.$eval(sel, (e, p) => { const r = e.getBoundingClientRect(); return { x: Math.max(0, r.left - p), y: Math.max(0, r.top - p), width: r.width + p * 2, height: Math.min(r.height + p * 2, window.innerHeight - Math.max(0, r.top - p)) }; }, pad);
  const type = async (sel, v) => page.evaluate((s, val) => { const i = document.querySelector(s); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); }, sel, v);
  const search = async (v) => { await type("input[type=search]", v); await sleep(450); };
  const openPeople = async () => { await page.click("[data-sb-people]"); await sleep(450); };

  // a frame strip: trigger, then three real frames composed side by side with their timings.
  // A 200ms settle is over before a screenshot can land (~150–180ms latency), so for the strip
  // ONLY the page's animation playback rate is slowed 5× through the browser's Animation domain
  // (evidence method — nothing in the product changes); labels state the real-time equivalent.
  const RATE = 0.2;
  const cdp = await page.createCDPSession();
  await cdp.send("Animation.enable").catch(() => {});
  const strip = async (name, trigger, { mid = 90, end = 450 } = {}) => {
    await cdp.send("Animation.setPlaybackRate", { playbackRate: RATE }).catch(() => {});
    const t0 = Date.now();
    await trigger();
    const f1 = await page.screenshot({ encoding: "base64" }); const d1 = Math.round((Date.now() - t0) * RATE);
    await sleep(Math.max(0, mid / RATE - (Date.now() - t0)));
    const f2 = await page.screenshot({ encoding: "base64" }); const d2 = Math.round((Date.now() - t0) * RATE);
    await sleep(Math.max(0, end / RATE - (Date.now() - t0)));
    const f3 = await page.screenshot({ encoding: "base64" }); const d3 = Math.round((Date.now() - t0) * RATE);
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 }).catch(() => {});
    const p2 = await b.newPage();
    const scale = vp.w > 700 ? 0.5 : 1;
    const fw = Math.round(vp.w * scale), fh = Math.round(vp.h * scale);
    await p2.setViewport({ width: fw * 3 + 48, height: fh + 44, deviceScaleFactor: 1 });
    const cell = (src, label) => `<figure style="margin:0;display:flex;flex-direction:column;gap:6px"><img src="data:image/png;base64,${src}" style="width:${fw}px;height:${fh}px;object-fit:cover;object-position:top;border-radius:8px;box-shadow:0 1px 0 rgba(0,0,0,.08)"><figcaption style="font:12px system-ui;color:#5a6880">${label}</figcaption></figure>`;
    await p2.setContent(`<body style="margin:0;background:#e8ecf3;padding:12px;display:flex;gap:12px">${cell(f1, `start · ≈${d1}ms real time`)}${cell(f2, `mid · ≈${d2}ms`)}${cell(f3, `end · ≈${d3}ms (captured at ${1 / RATE}× slower playback)`)}</body>`);
    await p2.screenshot({ path: `${EV}/${name}.png` });
    await p2.close();
    console.log("strip", name);
  };

  /* ---- carryover: composer + people ---- */
  await go({ viewer: "maya", composer: "1" }, { w: 360, h: 800, dsf: 2 }); await sleep(300); await shot("02-composer-after-360");
  await go({ viewer: "maya", composer: "1" }); await sleep(300); await shot("03-composer-after-desktop");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2 }); await openPeople(); await shot("05-people-after-360");
  await go({ viewer: "maya" }); await openPeople(); await shot("06-people-after-desktop");

  /* ---- search ---- */
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2 }); await page.click("[data-sb-search-toggle]"); await sleep(450); await shot("07-search-zero-mobile");
  await type("[data-sb-search-input]", "Boudha"); await sleep(450); await shot("08-search-query-mobile");
  await type("[data-sb-search-input]", "Krishna"); await sleep(450); await shot("09-search-person-mobile");
  await type("[data-sb-search-input]", "reading"); await sleep(450); await shot("10-search-moment-mobile");
  await type("[data-sb-search-input]", "Pokhara"); await sleep(450); await shot("11-search-place-mobile");
  await go({ viewer: "maya" }); await search("a"); await shot("12-search-desktop");
  await search("Krishna"); await shot("13-search-person-desktop");
  await search("Boudha"); await shot("14-search-moment-desktop");
  await search("zzqx"); await shot("15-search-no-results");

  /* ---- notifications ---- */
  await go({ viewer: "maya", bell: "1" }, { w: 360, h: 800, dsf: 2 }); await shot("16-notifications-mobile");
  await go({ viewer: "maya", bell: "1" }); await shot("17-notifications-desktop");
  await shot("18-request-notification", { clip: await clipOf("[data-sb-notification-request]", 12) });
  await shot("19-moment-notification", { clip: await clipOf("[data-sb-notification-moment='m-panorama']", 12) });
  await page.click("[data-sb-notification-moment='m-panorama']"); await sleep(900); await page.click("[data-sb-bell]"); await sleep(450); await shot("20-notification-read-unread");
  await go({ viewer: "maya", bell: "1", notifications: "empty" }); await shot("21-notifications-empty");

  /* ---- discovery before / after ---- */
  await go({ viewer: "maya" }); await search("Ramesh"); await shot("22-search-to-person-before");
  await page.click("[data-sb-search-person]"); await sleep(500); await shot("23-search-to-person-after");
  await go({ viewer: "maya", bell: "1" }); await shot("24-notification-to-moment-before");
  await page.click("[data-sb-notification-moment='m-panorama']"); await sleep(700); await shot("25-notification-to-moment-after");
  await go({ viewer: "maya" }); await openPeople(); await shot("26-people-to-person-before");
  await page.click("[data-sb-people-yours] [data-sb-people-row] button"); await sleep(500); await shot("27-people-to-person-after");

  /* ---- motion frame strips ---- */
  await go({ viewer: "maya" }); await strip("28-search-open-start-mid-end", () => page.focus("input[type=search]"));
  await go({ viewer: "maya" }); await strip("29-people-open-start-mid-end", () => page.click("[data-sb-people]"));
  await go({ viewer: "maya" }); await strip("30-notifications-open-start-mid-end", () => page.click("[data-sb-bell]"));
  await go({ viewer: "maya" }, { w: 390, h: 844, dsf: 1 }); await strip("31-composer-open-start-mid-end", () => page.click("[data-sb-open-composer]"), { end: 520 });
  await go({ viewer: "maya" }); await openPeople(); await page.type("[data-sb-people-find]", "Ramesh"); await sleep(400);
  await strip("32-add-friend-start-mid-end", () => page.click("[data-sb-people-add]"), { mid: 80, end: 400 });
  await go({ viewer: "maya" }); await openPeople(); await strip("33-accept-request-start-mid-end", () => page.click("[data-sb-people-accept]"), { mid: 80, end: 400 });
  await go({ viewer: "maya" }); await strip("34-person-open-start-mid-end", () => page.click("[data-sb-open-person]"));
  await go({ viewer: "maya" }); await strip("35-public-preview-start-mid-end", () => page.click("[data-sb-view-as-public]"), { mid: 80, end: 400 });
  await go({ viewer: "maya" }); await page.click("[data-sb-open-composer]"); await sleep(500);
  await page.type("#sb-composer-text", "The kettle, the first light, the ridge.");
  await strip("36-moment-insert-start-mid-end", async () => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => x.textContent.trim() === "Post")?.click()); await sleep(950); }, { mid: 120, end: 600 });

  /* ---- mobile ---- */
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2 }); await shot("37-owner-360-light");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("38-owner-360-dark");
  await go({ viewer: "maya" }, { w: 390, h: 844, dsf: 2 }); await openPeople(); await shot("39-owner-390");
  await go({ viewer: "maya", bell: "1" }, { w: 412, h: 915, dsf: 2 }); await shot("40-owner-412");
  await go({ viewer: "maya" }, { w: 844, h: 390, dsf: 2 }); await openPeople(); await shot("41-phone-landscape");

  /* ---- multilingual ---- */
  await go({ viewer: "maya" }, { lang: "es" }); await search("a"); await shot("42-search-spanish");
  await go({ viewer: "maya", bell: "1" }, { lang: "ru" }); await shot("43-notifications-russian");
  await go({ viewer: "maya" }, { w: 390, h: 844, dsf: 2, lang: "ne" }); await openPeople(); await shot("44-people-nepali");
  await go({ viewer: "maya", composer: "1" }, { w: 390, h: 844, dsf: 2, lang: "zh-Hans" }); await sleep(300); await shot("45-composer-chinese");
  await go({ viewer: "maya", bell: "1" }, { w: 390, h: 844, dsf: 2, lang: "zh-Hans" }); await shot("46-notifications-chinese");

  /* ---- accessibility ---- */
  await go({ viewer: "maya" }); await page.focus("input[type=search]"); await page.keyboard.type("a"); await sleep(400); await page.keyboard.press("Tab"); await sleep(150); await shot("47-keyboard-search");
  await go({ viewer: "maya" }); await page.evaluate(() => document.querySelector("[data-sb-bell]").focus()); await page.keyboard.press("Enter"); await sleep(400); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await sleep(150); await shot("48-keyboard-notifications");
  await go({ viewer: "maya" }); await page.evaluate(() => document.querySelector("[data-sb-people]").focus()); await page.keyboard.press("Enter"); await sleep(400); await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await sleep(150); await shot("49-keyboard-people");
  await go({ viewer: "maya", composer: "1" }); await sleep(400); await page.keyboard.press("Tab"); await sleep(150); await shot("50-keyboard-composer");
  await go({ viewer: "maya" }, { w: 1440, h: 1200 }); await openPeople(); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300); await shot("51-200-percent"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({ viewer: "maya" }); await openPeople(); await shot("52-reduced-motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  await b.close();
  console.log("DONE s5s6 capture");
})();
