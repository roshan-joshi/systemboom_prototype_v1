/** S1 evidence capture (not a test). Rounds out prototype-evidence/i18n-s1/. */
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/i18n-s1";
const BASE = "http://localhost:3210/style-lab/social?viewer=maya";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
require("fs").mkdirSync(EV, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--enable-gpu","--use-angle=metal"] });
  const p = await b.newPage();
  await p.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1.5 });

  // first paint for the remaining locales
  for (const loc of ["es","it","nl","hi"]) {
    await p.setCookie({ name: "sb-locale", value: loc, domain: "localhost", path: "/" });
    await p.goto(BASE, { waitUntil: "networkidle2" });
    await sleep(700);
    await p.screenshot({ path: `${EV}/first-paint-${loc}.png` });
    console.log("shot first-paint-" + loc);
  }

  // account menu with the embedded language control (desktop), ne
  await p.setCookie({ name: "sb-locale", value: "ne", domain: "localhost", path: "/" });
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await sleep(700);
  await p.evaluate(() => { const a=[...document.querySelectorAll("button")].find(b=>/मेनु|—/.test(b.getAttribute("aria-label")||"")); a && a.click(); });
  await sleep(400);
  await p.screenshot({ path: `${EV}/account-language-ne.png` });
  console.log("shot account-language-ne");

  // mobile language bottom sheet open, ne
  await p.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });
  await p.goto(BASE + "&w=360", { waitUntil: "networkidle2" });
  await sleep(700);
  await p.evaluate(() => { const a=[...document.querySelectorAll("button")].find(b=>/मेनु|—/.test(b.getAttribute("aria-label")||"")); a && a.click(); });
  await sleep(300);
  await p.evaluate(() => document.querySelector("[data-sb-account-language] [data-sb-language-trigger]")?.click());
  await sleep(400);
  await p.screenshot({ path: `${EV}/language-sheet-mobile-ne.png` });
  console.log("shot language-sheet-mobile-ne");

  // pre-login language menu in Cosmos (immersive)
  await p.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1.5 });
  await p.deleteCookie({ name: "sb-locale", domain: "localhost", path: "/" });
  await p.goto("http://localhost:3210/", { waitUntil: "networkidle2" });
  await sleep(3500);
  await p.evaluate(() => document.querySelector("[data-sb-language] [data-sb-language-trigger]")?.click());
  await sleep(400);
  await p.screenshot({ path: `${EV}/cosmos-language-prelogin.png` });
  console.log("shot cosmos-language-prelogin");

  // region suggestion strip (inject a region that maps to a different language)
  await p.setCookie({ name: "sb-locale", value: "en", domain: "localhost", path: "/" });
  await p.setCookie({ name: "sb-region", value: "NP", domain: "localhost", path: "/" });
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await sleep(900);
  const hasSuggestion = await p.$("[data-sb-region-suggestion]");
  if (hasSuggestion) { await p.screenshot({ path: `${EV}/region-suggestion.png` }); console.log("shot region-suggestion"); }
  else console.log("region-suggestion: not shown (en active, NP→ne suggestion expected — check policy)");

  await b.close();
})();
