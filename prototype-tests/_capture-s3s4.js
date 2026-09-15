/** S3+S4 — evidence capture (not a test). prototype-evidence/s3-s4-human-social/. */
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s3-s4-human-social";
const BASE = "http://localhost:3210/style-lab/social";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
require("fs").mkdirSync(EV, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"] });
  const page = await b.newPage();
  const go = async (params, { w = 1440, h = 900, dsf = 1.5, theme = "light", lang = "en", cookie } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dsf, hasTouch: w < 700 });
    if (cookie) await page.setCookie({ name: "sb-locale", value: cookie, domain: "localhost", path: "/" });
    const qs = new URLSearchParams({ harness: "0", theme, lang, ...params }).toString();
    await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
    await sleep(650);
  };
  const shot = async (n, full = false) => { await page.screenshot({ path: `${EV}/${n}.png`, fullPage: full }); console.log("shot", n); };
  const loadAll = async () => { await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); }); await sleep(400); };
  const openPeople = async () => { await page.click("[data-sb-people]"); await sleep(400); };

  /* ---- S3 mobile ---- */
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("01-owner-360-feed-light");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "dark" }); await shot("02-owner-360-feed-dark");
  await go({ viewer: "visitor" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("03-visitor-360-feed");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await shot("04-composer-collapsed-360");
  await go({ viewer: "maya", composer: "1" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await sleep(300); await shot("05-composer-expanded-360");
  await go({ viewer: "maya", composer: "1" }, { w: 360, h: 720, dsf: 2, theme: "light" }); await sleep(300); await shot("06-composer-keyboard-360");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await loadAll(); await shot("07-text-moment-360", true);
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await loadAll(); await shot("08-photo-moment-360", true);
  await go({ viewer: "maya", composer: "1" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await sleep(300); await shot("13-backdated-moment-360");

  /* ---- S3 desktop + kinds (via full-page almanac) ---- */
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await loadAll(); await shot("14-almanac-desktop-light", true);
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "dark" }); await loadAll(); await shot("15-almanac-desktop-dark", true);
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await loadAll(); await shot("26-long-feed", true);
  await go({ viewer: "maya", composer: "1" }, { w: 1440, h: 1000, theme: "light" }); await sleep(300); await shot("16-composer-desktop");

  /* ---- S4 People ---- */
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await openPeople(); await shot("27-people-desktop-light");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "dark" }); await openPeople(); await shot("28-people-desktop-dark");
  await go({ viewer: "maya" }, { w: 360, h: 800, dsf: 2, theme: "light" }); await openPeople(); await shot("29-people-360");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await openPeople(); await page.type("[data-sb-people-find]", "ramesh"); await sleep(350); await shot("30-find-person");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await openPeople(); await shot("34-request-in");

  /* ---- relationship states on the Person surface (via Hero rel override) ---- */
  for (const [n, rel] of [["31-none", "none"], ["32-add-friend", "none"], ["33-requested", "request-out"], ["36-friend", "friend"], ["37-family-if-real", "family"]]) {
    await go({ viewer: "visitor", rel }, { w: 1440, h: 1000, theme: "light", cookie: "en" }); await shot(n);
  }

  /* ---- integrated ---- */
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await shot("40-moment-author-to-person-before");
  await page.click("[data-sb-open-person]").catch(() => {}); await sleep(400); await shot("40-moment-author-to-person");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await page.click("[data-sb-view-as-public]").catch(() => {}); await sleep(400); await shot("47-owner-public-preview-feed");

  /* ---- multilingual ---- */
  await go({ viewer: "maya", composer: "1" }, { w: 390, h: 844, dsf: 2, theme: "light", lang: "ne", cookie: "ne" }); await sleep(400); await shot("48-composer-nepali");
  await go({ viewer: "maya" }, { w: 390, h: 844, dsf: 2, theme: "light", lang: "ne", cookie: "ne" }); await loadAll(); await shot("49-moment-nepali", true);
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light", lang: "es", cookie: "es" }); await openPeople(); await shot("50-people-spanish");
  await go({ viewer: "visitor", rel: "request-in" }, { w: 1440, h: 1000, theme: "light", lang: "ru", cookie: "ru" }); await shot("51-relationship-russian");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light", lang: "zh-Hans", cookie: "zh-Hans" }); await loadAll(); await shot("52-moment-chinese", true);
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light", lang: "zh-Hans", cookie: "zh-Hans" }); await openPeople(); await shot("53-people-chinese");

  /* ---- accessibility ---- */
  await page.setCookie({ name: "sb-locale", value: "en", domain: "localhost", path: "/" });
  await go({ viewer: "maya", composer: "1" }, { w: 1440, h: 1000, theme: "light" }); await sleep(300); await page.keyboard.press("Tab"); await sleep(150); await shot("54-keyboard-composer");
  await go({ viewer: "maya" }, { w: 1440, h: 1000, theme: "light" }); await openPeople(); await page.keyboard.press("Tab"); await sleep(150); await shot("55-keyboard-people");
  await go({ viewer: "maya" }, { w: 1440, h: 1200, theme: "light" }); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300); await shot("56-200-percent-moment"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await go({ viewer: "maya" }, { w: 1440, h: 1200, theme: "light" }); await openPeople(); await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300); await shot("57-200-percent-people"); await page.evaluate(() => { document.body.style.zoom = "1"; });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go({ viewer: "maya", composer: "1" }, { w: 1440, h: 1000, theme: "light" }); await sleep(300); await shot("58-reduced-motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  await b.close();
  console.log("DONE s3s4 capture");
})();
