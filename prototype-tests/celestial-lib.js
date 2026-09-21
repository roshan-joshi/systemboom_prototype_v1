/* Launcher for the Celestial suites.
   Identical in spirit to prototype-tests/lib.js, but resolves the browser from SB_CHROME when
   set, so the same suite runs on the owner's Mac (default path, unchanged) and in a Linux CI
   or sandbox. Kept separate so lib.js — which the accepted suites depend on — is never edited. */
const fs = require("fs");
const puppeteer = require("puppeteer-core");

const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CHROME = process.env.SB_CHROME || MAC_CHROME;
const EV = process.env.SB_EV || `${process.cwd()}/prototype-evidence/celestial-resonance`;

async function launch({ mobile = false } = {}) {
  fs.mkdirSync(EV, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--hide-scrollbars", "--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true } : { width: 1440, height: 950, deviceScaleFactor: 1 });
  return { page, browser, EV };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { launch, sleep, EV };
