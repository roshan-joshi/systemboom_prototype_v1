/** Phase 2.2 — shared helpers for the identity-gate suites. */
const { sleep, waitFor } = require("./lib");

const OPENER = "[data-sb-gate-opener]";
const DIALOG = "[role=dialog][aria-modal=true]";
const SCRIM = "[data-sb-gate-scrim]";
const ROOT = "[data-sb-cosmos-root]";

const identity = (page) => page.evaluate(() => window.__SB_IDENTITY || null);

async function openGate(page) {
  await page.click(OPENER);
  await waitFor(page, () => !!document.querySelector("[role=dialog][aria-modal=true]"), 8000, "gate dialog");
  await sleep(600); // rise-in
}

async function expectClosed(page, label = "gate closed") {
  await waitFor(
    page,
    () =>
      !document.querySelector("[role=dialog][aria-modal=true]") &&
      !document.querySelector("[data-sb-gate-scrim]"),
    8000,
    label,
  );
  const root = await page.evaluate(() => document.querySelector("[data-sb-cosmos-root]").inert);
  if (root) throw new Error("cosmos root still inert after close");
}

/** Is the Cosmos wrapper inert AND effective (focus refused, pointer blocked)? */
async function inertReport(page) {
  return page.evaluate(() => {
    const root = document.querySelector("[data-sb-cosmos-root]");
    const supported = "inert" in HTMLElement.prototype;
    const attr = root.hasAttribute("inert");
    const prop = root.inert === true;
    // Effective for focus: a button inside must refuse focus.
    const btn = root.querySelector("button");
    let focusRefused = null;
    if (btn) {
      const before = document.activeElement;
      btn.focus();
      focusRefused = document.activeElement !== btn;
      if (before && before.focus) before.focus();
    }
    // Effective for pointer: the top-most element at canvas centre must not be inside the root.
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const top = document.elementFromPoint(cx, cy);
    const pointerBlocked = !!top && !root.contains(top);
    return {
      supported,
      attr,
      prop,
      focusRefused,
      pointerBlocked,
      topAtCentre: top ? `${top.tagName}${top.dataset.sbGateScrim !== undefined ? "[scrim]" : ""}` : null,
    };
  });
}

async function activeDesc(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return null;
    return `${a.tagName}${a.matches("[data-sb-gate-opener]") ? "[opener]" : ""}:${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}`;
  });
}

/** Set a React-controlled input's value via the native setter so React sees it. */
async function setInput(page, selector, value) {
  await page.evaluate(
    (sel, v) => {
      const el = document.querySelector(sel);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    selector,
    value,
  );
}

async function clickText(page, text) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      (x.textContent || "").replace(/\s+/g, " ").trim().includes(t),
    );
    if (!b) return false;
    b.click();
    return true;
  }, text);
  if (!ok) throw new Error(`button not found: ${text}`);
}

/** Two clipped JPEG captures — different bytes ⇒ the frame is alive. */
async function frameAlive(page, clip, gapMs = 1500) {
  const a = await page.screenshot({ type: "jpeg", quality: 80, clip });
  await sleep(gapMs);
  const b = await page.screenshot({ type: "jpeg", quality: 80, clip });
  return !a.equals(b);
}

/** Camera truly settled: not travelling AND distance stable across two samples. */
async function waitSettled(page, timeout = 45000) {
  const start = Date.now();
  let prev = null;
  while (Date.now() - start < timeout) {
    const cam = await page.evaluate(() => window.__SB_CAM || null);
    if (cam && !cam.travelling && prev !== null && Math.abs(cam.dist - prev) < 0.003) return cam;
    prev = cam ? cam.dist : null;
    await sleep(500);
  }
  throw new Error("TIMEOUT waiting for camera to settle");
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

module.exports = {
  OPENER, DIALOG, SCRIM, ROOT,
  identity, openGate, expectClosed, inertReport, activeDesc, setInput, clickText, frameAlive, waitSettled, assert,
};
