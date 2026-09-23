/** PHASE 2.2 — fallback path (?cosmos=fallback), storage-blocked case, theme-flash check. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-02-2";
const { launch, sleep, waitFor, shot } = require("./lib");
const G = require("./gate-lib");

const BASE = "http://localhost:3210";

async function fallbackFlow(mobile) {
  const tag = mobile ? "mobile" : "desktop";
  console.log(`--- fallback ${tag}`);
  const { browser, page, errors } = await launch({ mobile });
  await page.goto(`${BASE}/?cosmos=fallback`, { waitUntil: "networkidle2" });
  await waitFor(page, () => !!window.__SB_IDENTITY && !!document.querySelector("[data-sb-gate-opener]"), 15000, "fallback + chip");
  G.assert(!(await page.$("canvas")), "no canvas on the fallback path");
  G.assert(!(await page.evaluate(() => !!window.__SB_AMBIENCE)), "no ambience instantiated on the fallback path");
  await page.click(G.OPENER);
  await waitFor(page, () => !!document.querySelector("[role=dialog][aria-modal=true]"), 8000, "dialog");
  await sleep(600);
  const inert = await G.inertReport(page);
  G.assert(inert.prop && inert.focusRefused === true && inert.pointerBlocked, `inert effective on fallback (${inert.topAtCentre})`);
  await shot(page, `FB-${tag}-1-open`);
  await G.clickText(page, "Enter as Giulia Bianchi");
  await sleep(500);
  G.assert((await G.identity(page)).activeIdentityId === "u-demo-001", "Enter as Giulia on fallback");
  await shot(page, `FB-${tag}-2-signed-in`);
  await page.keyboard.press("Escape");
  await G.expectClosed(page, "fallback close");
  // planets still interactive
  await page.evaluate(() => { [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Mars" && b.getAttribute("aria-pressed") !== null)?.click(); });
  await sleep(300);
  const mars = await page.evaluate(() => document.body.innerText.includes("Fourth planet") || !![...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === "Mars"));
  G.assert(mars, "planet buttons work after the gate closed");
  await shot(page, `FB-${tag}-3-mars-after-close`);
  G.assert(errors.length === 0, `zero page errors (${errors.length})`);
  await browser.close();
}

async function storageBlocked() {
  console.log("--- storage blocked");
  const { browser, page, errors } = await launch();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("SecurityError: blocked"); } });
  });
  await page.goto(`${BASE}/?cosmos=fallback`, { waitUntil: "networkidle2" });
  await waitFor(page, () => !!window.__SB_IDENTITY && window.__SB_IDENTITY.hydrated, 15000, "hydrated");
  G.assert((await G.identity(page)).storageMode === "memory", "store degraded to memory mode");
  await page.click(G.OPENER);
  await waitFor(page, () => !!document.querySelector("[role=dialog][aria-modal=true]"), 8000, "dialog");
  await sleep(500);
  const txt = await page.evaluate(() => document.querySelector("[role=dialog]").innerText);
  G.assert(txt.includes("can't remember an identity"), "honest memory-mode line shown in the gate");
  await shot(page, "SB-storage-blocked");
  await G.clickText(page, "Enter as Giulia Bianchi");
  await sleep(400);
  G.assert((await G.identity(page)).activeIdentityId === "u-demo-001", "sign-in still works for the tab");
  G.assert(errors.length === 0, `zero page errors (${errors.length})`);
  await browser.close();
}

async function themeFlash(theme, path) {
  const { browser, page, errors } = await launch();
  await page.evaluateOnNewDocument((t) => {
    try { localStorage.setItem("sb-theme", t); } catch {}
    window.__THEME_LOG = [];
    const attach = () => {
      const html = document.documentElement;
      if (!html) return setTimeout(attach, 0);
      window.__THEME_LOG.push(["boot", html.dataset.theme || null, performance.now()]);
      new MutationObserver(() => window.__THEME_LOG.push(["mut", html.dataset.theme, performance.now()])).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
      requestAnimationFrame(() => window.__THEME_LOG.push(["firstFrame", html.dataset.theme, performance.now()]));
    };
    attach();
  }, theme);
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  await sleep(1500);
  const log = await page.evaluate(() => window.__THEME_LOG);
  const first = log.find((l) => l[0] === "firstFrame");
  const flips = log.filter((l) => l[0] === "mut").map((l) => l[1]);
  const finalTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  console.log(`  ${path} ${theme}: firstFrame=${first && first[1]} mutations=${JSON.stringify(flips)} final=${finalTheme}`);
  G.assert(first && first[1] === theme, `${path} ${theme}: first frame already in the stored theme`);
  G.assert(flips.every((f) => f === theme), `${path} ${theme}: no later flip to another theme`);
  await shot(page, `TH-${theme}-${path.replace(/\//g, "") || "root"}`);
  G.assert(errors.length === 0, "zero page errors");
  await browser.close();
}

(async () => {
  await fallbackFlow(false);
  await fallbackFlow(true);
  await storageBlocked();
  console.log("--- theme flash");
  for (const t of ["dark", "light"]) for (const p of ["/", "/world"]) await themeFlash(t, p);
  console.log("\nGATE FALLBACK/STORAGE/THEME: PASS");
})().catch((e) => {
  console.error("GATE FALLBACK: FAIL", e);
  process.exit(1);
});
