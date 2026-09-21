const fs = require("fs");
const puppeteer = require("puppeteer-core");

const URL = "http://localhost:3210/";
const EV =
  process.env.SB_EV || "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-9a";
fs.mkdirSync(EV, { recursive: true });

const CHROME = process.env.SB_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function launch({ mobile = false } = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: process.env.SB_CHROME
      ? ["--hide-scrollbars", "--no-sandbox", "--disable-dev-shm-usage"]
      : ["--enable-gpu", "--use-angle=metal", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  if (mobile) {
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
  } else {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return { browser, page, errors };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fn, timeout = 30000, label = "condition") {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = await page.evaluate(fn);
    if (v) return v;
    await sleep(300);
  }
  throw new Error(`TIMEOUT waiting for ${label}`);
}

const getState = (page) => page.evaluate(() => window.__SB_STATE || null);
const getCam = (page) => page.evaluate(() => window.__SB_CAM || null);
const getSlots = (page) =>
  page.evaluate(() => {
    const s = window.__SB_SLOTS || {};
    const out = {};
    for (const k of Object.keys(s)) out[k] = { x: s[k].x, y: s[k].y, on: s[k].on };
    return out;
  });

/** Wait until a beacon is facing the camera; returns screen coords. */
async function waitSlot(page, id, timeout = 150000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const slots = await getSlots(page);
    const s = slots[id];
    if (s && s.on) return s;
    await sleep(500);
  }
  throw new Error(`TIMEOUT waiting for slot ${id} to face camera`);
}

async function shot(page, name) {
  await page.screenshot({ path: `${EV}/${name}.png` });
  console.log(`  shot ${name}`);
}

async function ready(page) {
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await waitFor(page, () => !!window.__SB_STATE && !!window.__SB_SLOTS, 30000, "dev hooks");
  await sleep(5000); // reveal + entrance travel settles
}

/** Click a button by (partial) accessible text. */
async function clickButton(page, text) {
  const ok = await page.evaluate((t) => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find(
      (x) =>
        (x.textContent || "").includes(t) ||
        (x.getAttribute("aria-label") || "").includes(t),
    );
    if (!b) return false;
    b.click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found: ${text}`);
}

module.exports = { launch, sleep, waitFor, getState, getCam, getSlots, waitSlot, shot, ready, clickButton, EV };
