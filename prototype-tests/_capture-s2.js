/** S2 Person World — evidence capture (not a test). Generates prototype-evidence/s2-person-world/. */
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s2-person-world";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
require("fs").mkdirSync(EV, { recursive: true });

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  const go = async (params, { w = 1440, h = 900, dsf = 1.5, theme = "light", lang = "en", cookie } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf });
    if (cookie) await page.setCookie({ name: "sb-locale", value: cookie, domain: "localhost", path: "/" });
    const qs = new URLSearchParams({ harness: "0", theme, lang, ...params }).toString();
    await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
    await sleep(650);
  };
  const shot = async (name) => { await page.screenshot({ path: `${EV}/${name}.png` }); console.log("shot", name); };

  /* ---- owner ---- */
  await go({ viewer: "maya" }, { w: 1440, theme: "light" }); await shot("01-owner-desktop-light");
  await go({ viewer: "maya" }, { w: 1440, theme: "dark" }); await shot("02-owner-desktop-dark");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("03-owner-360-light");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("04-owner-360-dark");
  await go({ viewer: "maya" }, { w: 390, h: 844, dsf: 2, theme: "light" }); await shot("05-owner-390-light");
  await go({ viewer: "maya" }, { w: 412, h: 915, dsf: 2, theme: "dark" }); await shot("06-owner-412-dark");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light", lang: "es", cookie: "es" }); await shot("07-owner-spanish-360");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light", lang: "ne", cookie: "ne" }); await shot("08-owner-nepali-360");
  await go({ viewer: "maya" }, { w: 1440, theme: "light", lang: "zh-Hans", cookie: "zh-Hans" }); await shot("09-owner-chinese-desktop");

  /* ---- visitor ---- */
  await go({ viewer: "visitor" }, { w: 1440, theme: "light", cookie: "en" }); await shot("10-visitor-desktop-light");
  await go({ viewer: "visitor" }, { w: 1440, theme: "dark" }); await shot("11-visitor-desktop-dark");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("12-visitor-360-light");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("13-visitor-360-dark");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "light", lang: "es", cookie: "es" }); await shot("14-visitor-spanish");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "light", lang: "ne", cookie: "ne" }); await shot("15-visitor-nepali");
  await go({ viewer: "visitor" }, { w: 1440, theme: "light", lang: "zh-Hans", cookie: "zh-Hans" }); await shot("16-visitor-chinese");

  /* ---- identity resilience ---- */
  await go({ viewer: "maya" }, { w: 1440, theme: "light", cookie: "en" }); await shot("17-real-photo");
  await go({ viewer: "maya", photo: "bad" }, { w: 1440, theme: "light" }); await shot("18-bad-photo");
  await go({ viewer: "maya", photo: "none" }, { w: 1440, theme: "light" }); await shot("19-initials-fallback");
  await go({ viewer: "maya" }, { w: 1440, theme: "light" }); await shot("20-wall");
  await go({ viewer: "maya", nocover: "1" }, { w: 1440, theme: "light" }); await shot("21-no-wall");
  await go({ viewer: "maya", wall: "bad" }, { w: 1440, theme: "light" }); await shot("22-bad-wall");
  await go({ viewer: "maya" }, { w: 1440, theme: "light" }); await shot("23-life-ring-large-light");
  await go({ viewer: "maya" }, { w: 1440, theme: "dark" }); await shot("24-life-ring-large-dark");
  await go({ viewer: "maya", profileName: "Krishna Bahadur Gurung Tamang Magar Rana" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("25-long-name");
  await go({ viewer: "maya", profileName: "陈美娟", photo: "none" }, { w: 1440, theme: "light", lang: "zh-Hans", cookie: "zh-Hans" }); await shot("26-cjk-name");
  await go({ viewer: "maya", profileName: "कृष्ण बहादुर गुरुङ" }, { w: 360, h: 800, dsf: 2, theme: "light", lang: "ne", cookie: "ne" }); await shot("27-devanagari-name");

  /* ---- relationship states (visitor Hero, forced via ?rel=) ---- */
  for (const [n, rel] of [["28-none", "none"], ["29-request-out", "request-out"], ["30-request-in", "request-in"], ["31-friend", "friend"], ["32-family-if-real", "family"]]) {
    await go({ viewer: "visitor", rel }, { w: 1440, theme: "light", cookie: "en" }); await shot(n);
  }
  // view as public + returns
  await go({ viewer: "maya" }, { w: 1440, theme: "light" });
  await page.click("[data-sb-view-as-public]").catch(() => {}); await sleep(400); await shot("33-view-as-public");
  await shot("34-return-to-my-view"); // the preview banner carries Return to My World
  await go({ viewer: "visitor" }, { w: 1440, theme: "light" });
  await page.evaluate(() => { const a = [...document.querySelectorAll("button")].find((b) => /—|menu/.test(b.getAttribute("aria-label") || "")); a && a.click(); }); await sleep(300); await shot("35-return-to-my-world");

  /* ---- accessibility ---- */
  await go({ viewer: "maya" }, { w: 1440, theme: "light" });
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await sleep(200);
  await page.evaluate(() => document.querySelector("[data-sb-hero-ring-entry]")?.focus()); await sleep(200); await shot("36-keyboard");
  await go({ viewer: "maya" }, { w: 1440, theme: "light" });
  await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300); await shot("37-200-percent-text");
  await page.evaluate(() => { document.body.style.zoom = "1"; });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({ viewer: "maya" }, { w: 1440, theme: "light" }); await shot("38-reduced-motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await go({ viewer: "maya", photo: "broken", wall: "broken" }, { w: 1440, theme: "light" }); await shot("39-image-failure");

  /* ---- profile→moment transition ---- */
  await go({ viewer: "visitor" }, { w: 1440, theme: "light" }); await shot("40-person-source-moment");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("41-person-world-arrival");

  await b.close();
  console.log("DONE s2 capture");
})();
