/**
 * SOCIAL WALL S7 — UX COMPLETION FOR THE NEW SURFACES (focused regression suite).
 *
 * The accepted device-mastery suite (s7-device-mastery, 56) already guards the wall itself;
 * this suite holds the NEW S1–S6 surfaces to the same bar:
 * §1 320 survival — the conversation surface, People panel, Saved surface and notification
 *    rows fit the smallest phone, no horizontal scroll
 * §2 dark theme — the new panels draw from the theme tokens, never hardcoded light
 * §3 reduced motion — the landing settle and rel-resolve collapse to instant final states
 * §4 keyboard — the Saved surface is reachable, escapable, and returns focus to its control
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const TINY = { width: 320, height: 700, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };

async function open(page, vp, theme = "light", extra = "", reduced = false) {
  await page.setCookie({ name: "sb-locale", value: "en", url: HOST });
  await page.emulateMediaFeatures(reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : []);
  await page.setViewport(vp);
  await page.goto(`${HOST}/style-lab/social?harness=0&theme=${theme}${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const fits = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    console.log("§1 320 survival");
    await open(page, TINY);
    // the focused conversation
    await page.evaluate(async () => { for (let i = 0; i < 8 && document.querySelector("[data-sb-load-more]"); i++) { document.querySelector("[data-sb-load-more]").click(); await new Promise((r) => setTimeout(r, 250)); } });
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]")?.click());
    await sleep(600);
    const conv = await page.evaluate(() => {
      const s = document.querySelector("[data-sb-conversation-surface]");
      const boom = s?.querySelector("[data-sb-note-boom]")?.getBoundingClientRect();
      return { open: !!s, fits: document.documentElement.scrollWidth <= innerWidth, boomOn: !!boom && boom.right <= innerWidth };
    });
    ok(conv.open && conv.fits && conv.boomOn, "the conversation with its Boom controls fits 320");
    await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] header button")?.click());
    await sleep(300);
    // People panel
    await page.evaluate(() => document.querySelector("[data-sb-people]")?.click());
    await sleep(400);
    ok(!!(await page.$("[data-sb-people-panel]")) && (await fits(page)), "the People panel fits 320");
    await page.keyboard.press("Escape");
    await sleep(200);
    // Saved surface
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-actions-more] button[aria-expanded]")?.click());
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-rain'] [role=menu] [role^=menuitem]")].find((x) => x.textContent.trim() === "Save")?.click());
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-account-trigger]")?.click());
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu][aria-label=Account] [role=menuitem]")].find((x) => /^Saved/.test(x.textContent.trim()))?.click());
    await sleep(400);
    ok(!!(await page.$("[data-sb-saved-panel]")) && (await fits(page)), "the Saved surface fits 320");
    // notification rows with the new event kinds
    await page.keyboard.press("Escape");
    await sleep(200);
    await page.click("[data-sb-bell]");
    await sleep(400);
    ok((await fits(page)) && !!(await page.$("[data-sb-notifications]")), "the notification list with the S4 event rows fits 320");

    console.log("§2 dark theme");
    await open(page, DESKTOP, "dark");
    await page.evaluate(() => document.querySelector("[data-sb-account-trigger]")?.click());
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu][aria-label=Account] [role=menuitem]")].find((x) => /^Saved/.test(x.textContent.trim()))?.click());
    await sleep(400);
    const dark = await page.evaluate(() => {
      const p = document.querySelector("[data-sb-saved-panel]");
      const bg = getComputedStyle(p).backgroundColor;
      const m = bg.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
      return { bg, dark: (m[0] + m[1] + m[2]) / 3 < 128 };
    });
    ok(dark.dark, `the Saved surface draws the dark theme's own material (${dark.bg})`);
    await page.keyboard.press("Escape");

    console.log("§3 reduced motion");
    await open(page, DESKTOP, "light", "", true);
    await page.click("[data-sb-bell]");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-notification-moment='m-rain']")?.click());
    await sleep(900);
    const rm = await page.evaluate(() => {
      const el = document.querySelector("[data-sb-note='n-rain-1']");
      const d = el ? parseFloat(getComputedStyle(el).animationDuration || "0") : 99;
      return { focused: document.activeElement?.getAttribute("data-sb-note"), instant: d < 0.05 };
    });
    ok(rm.focused === "n-rain-1" && rm.instant, "a reduced-motion landing still lands exactly — with an instant settle");

    console.log("§4 keyboard");
    await open(page, DESKTOP);
    await page.evaluate(() => document.querySelector("[data-sb-account-trigger]")?.click());
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu][aria-label=Account] [role=menuitem]")].find((x) => /^Saved/.test(x.textContent.trim()))?.click());
    await sleep(400);
    await page.keyboard.press("Escape");
    await sleep(300);
    const back = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-account-trigger"));
    ok(!!back, "Escape closes the Saved surface and returns focus to the account control");

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s7-polish: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
