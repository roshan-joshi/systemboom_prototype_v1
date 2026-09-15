/**
 * PHASE S1 — Global Language Foundation.
 *
 * Proves the binding i18n rules against the running app:
 *  · first paint is the resolved locale, in the SSR HTML — English never paints
 *    first (§23, §83);
 *  · no hydration mismatch / no "script tag" error in the browser, per locale (§23);
 *  · system text is localized while human content is NOT translated (§31–§35);
 *  · locale-aware, DETERMINISTIC formatting (own month tables; no ICU drift, §38–§44);
 *  · switching language preserves context — no route change, no reload (§21, §60–§62).
 *
 * The §5 resolution priority + region-suggestion matrix is covered by the Node suite
 * `locale-resolution.js`; this is the browser half.
 */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/i18n-s1";
const fs = require("fs");
const { launch, sleep } = require("./lib");
const EV = process.env.SB_EV;
const BASE = "http://localhost:3210/style-lab/social";
fs.mkdirSync(EV, { recursive: true });

let passed = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) { passed += 1; console.log(`  ✓ ${msg}`); }
  else { failures.push(msg); console.log(`  ✗ ${msg}`); }
}

// world.context.my ("My World") — the owner kicker ProfileHero renders in SSR, and now
// the persistent top-bar Brand context word too. Values mirror the catalogs exactly.
const MY_WORLD = {
  en: "My World", es: "Mi Mundo", it: "Il mio mondo", nl: "Mijn wereld",
  ru: "Мой мир", hi: "मेरी दुनिया", ne: "मेरो संसार", "zh-Hans": "我的世界",
};
const LOCALES = ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"];

/** Raw SSR HTML for a locale (proves first paint — before any client JS). */
async function ssr(locale) {
  const res = await fetch(`${BASE}?viewer=maya`, { headers: { cookie: `sb-locale=${locale}` } });
  return res.text();
}

(async () => {
  const { browser, page } = await launch();

  /* ---- 1. first paint per locale (no wrong-language flash) ---- */
  console.log("1. first paint / no-flash (SSR HTML)");
  for (const loc of LOCALES) {
    const html = await ssr(loc);
    ok(new RegExp(`<html[^>]*\\blang="${loc.replace("-", "\\-")}"`).test(html), `${loc}: SSR <html lang="${loc}"> — the resolved locale, not English`);
    ok(html.includes(MY_WORLD[loc]), `${loc}: SSR body carries the localized "My World" (${MY_WORLD[loc]}) — system text is server-rendered in-locale`);
    // The visible Brand context word is localized too — the English "My World" must not be
    // the painted context on a non-English first paint (the string may still appear inside a
    // localized aria template, so anchor to the data-sb-context span specifically).
    if (loc !== "en") {
      const ctx = html.match(/data-sb-context[^>]*>([^<]*)</);
      ok(ctx && ctx[1].trim() === MY_WORLD[loc], `${loc}: the painted Brand context is "${ctx ? ctx[1].trim() : "?"}", not English`);
    }
  }

  /* ---- 2. human content is never translated (§31–§35) ---- */
  console.log("2. human content untranslated");
  for (const loc of ["ne", "ru", "zh-Hans"]) {
    const html = await ssr(loc);
    ok(html.includes("Maya Rai"), `${loc}: the person's name "Maya Rai" stays original`);
    ok(html.includes("Kathmandu"), `${loc}: the place "Kathmandu" stays original`);
  }

  /* ---- 3. deterministic locale formatting (own tables; no ICU drift) ---- */
  console.log("3. deterministic formatting");
  const neHtml = await ssr("ne");
  ok(/सेप्टेम्बर|अगस्ट|जुन/.test(neHtml), "ne: dates use the shipped Devanagari month table (deterministic, not Intl)");
  ok(!/[०-९]/.test(neHtml), "ne: digits are Latin (numberingSystem=latn) — identical on server and browser");
  const ruHtml = await ssr("ru");
  ok(ruHtml.includes("Показать ещё") || /ещё/.test(ruHtml), "ru: pagination label is localized");

  /* ---- 4. no hydration mismatch / no script-tag error, per locale ---- */
  console.log("4. no hydration mismatch in the browser");
  for (const loc of ["en", "ru", "ne", "zh-Hans"]) {
    const errs = [];
    const onErr = (m) => { if (m.type() === "error") errs.push(m.text()); };
    page.on("console", onErr);
    await page.setViewport({ width: 900, height: 1100, deviceScaleFactor: 1.5 });
    await page.setCookie({ name: "sb-locale", value: loc, domain: "localhost", path: "/" });
    await page.goto(`${BASE}?viewer=maya`, { waitUntil: "networkidle2" });
    await sleep(900);
    page.off("console", onErr);
    const hydr = errs.filter((e) => /hydrat|did not match|server rendered|script tag while rendering/i.test(e));
    ok(hydr.length === 0, `${loc}: zero hydration / script-tag errors (${hydr.length})${hydr[0] ? " — " + hydr[0].slice(0, 80) : ""}`);
    const lang = await page.evaluate(() => document.documentElement.lang);
    ok(lang === loc, `${loc}: <html lang> is "${lang}" after hydration`);
    await page.screenshot({ path: `${EV}/first-paint-${loc}.png` });
    console.log(`  shot first-paint-${loc}`);
  }

  /* ---- 5. context preserved on switch — no route change, no reload (§21, §60–§62) ---- */
  console.log("5. switch preserves context");
  await page.setCookie({ name: "sb-locale", value: "ne", domain: "localhost", path: "/" });
  await page.goto(`${BASE}?viewer=maya`, { waitUntil: "networkidle2" });
  await sleep(600);
  const urlBefore = page.url();
  // mark the DOM so a full reload would wipe it
  await page.evaluate(() => { window.__sbNoReload = true; });
  // open account menu → open language menu → pick English
  await page.evaluate(() => document.querySelector("[data-sb-account-language]")?.scrollIntoView?.());
  const opened = await page.evaluate(() => {
    const acc = [...document.querySelectorAll("button")].find((b) => /मेनु|menu|—/.test(b.getAttribute("aria-label") || ""));
    if (acc) { acc.click(); return true; } return false;
  });
  await sleep(300);
  const switched = await page.evaluate(() => {
    const trig = document.querySelector("[data-sb-account-language] [data-sb-language-trigger]");
    if (!trig) return "no-trigger";
    trig.click();
    return "opened";
  });
  await sleep(300);
  await page.evaluate(() => { document.querySelector('[data-sb-language-option="en"]')?.click(); });
  await sleep(500);
  const survived = await page.evaluate(() => window.__sbNoReload === true);
  const urlAfter = page.url();
  const langAfter = await page.evaluate(() => document.documentElement.lang);
  ok(opened && switched === "opened", "the authenticated Language control is reachable inside the Account menu (not a top-bar icon)");
  ok(survived, "switching language did NOT reload the page (context preserved)");
  ok(urlAfter === urlBefore, `switching language did NOT change the route (${urlAfter.replace("http://localhost:3210", "")})`);
  ok(langAfter === "en", `after choosing English in place, <html lang> is "${langAfter}"`);
  const afterText = await page.evaluate(() => document.body.innerText);
  ok(/Maya Rai/.test(afterText) && /Kathmandu/.test(afterText), "human content (name, place) is unchanged by the switch");
  await page.screenshot({ path: `${EV}/switch-to-en.png` });
  console.log("  shot switch-to-en");

  /* ---- summary ---- */
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("I18N: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("I18N: PASS");
  await browser.close();
  process.exit(failures.length ? 1 : 0);
})();
