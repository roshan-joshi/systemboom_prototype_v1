/* SYSTEMBOOM — S2 PERSON WORLD: the Person / Profile / Identity acceptance.
   Owner + visitor context, desktop left-anchor (not centered), mobile priority,
   View as public (structure + DOM privacy), Life Ring semantics, World Wall
   (image / none / broken), identity resilience (real / bad / initials / broken /
   long name), relationship placement, and locale-safe profile strings.
     node prototype-tests/s2-person-world.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/s2-person-world";
fs.mkdirSync(EV, { recursive: true });
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer, lang = "en", cookie, extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  if (cookie) await page.setCookie({ name: "sb-locale", value: cookie, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang);
  if (viewer) u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(550);
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
const firstMoment = (page) => page.evaluate(() => { const el = document.querySelector("[data-sb-moment]"); return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null; });

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward/.test(f)) consoleErrors.push(f); });
  const shot = async (n) => { await page.screenshot({ path: `${EV}/test-${n}.png` }); };

  /* ---- 1. Owner context ---- */
  console.log("1. Owner context");
  await open(page, 1440, 900, { viewer: "maya" });
  ok(await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero")) === "owner", "owner hero is data-sb-hero='owner'");
  ok(/My World/.test(await page.$eval("[data-sb-world-context]", (e) => e.textContent)), "owner World context reads 'My World'");
  ok(!!(await page.$("[data-sb-contact]")), "owner sees the private contact pill");
  ok(!!(await page.$("[data-sb-view-as-public]")), "owner has a real View as public action");
  ok(!!(await page.$("[data-sb-life-entry]")), "owner has the Life entry (band · days · Life →)");

  /* ---- 2. Desktop is LEFT-ANCHORED, not centered ---- */
  console.log("2. Desktop left-anchored");
  const anchor = await page.evaluate(() => {
    const hero = document.querySelector("[data-sb-hero]");
    const region = hero.querySelector("[data-sb-world-context]").parentElement;
    const ring = hero.querySelector("[data-sb-ring]");
    const row = ring.closest("div.relative").parentElement;
    const heroBox = hero.getBoundingClientRect();
    const ringBox = ring.getBoundingClientRect();
    return {
      textAlign: getComputedStyle(region).textAlign,
      flexDir: getComputedStyle(row).flexDirection,
      ringFromLeft: Math.round(ringBox.left - heroBox.left),
      heroWidth: Math.round(heroBox.width),
    };
  });
  ok(anchor.textAlign === "left", `desktop identity region is left-aligned (${anchor.textAlign})`);
  ok(anchor.flexDir === "row", "desktop identity is an asymmetric row (ring + column), not a centered stack");
  ok(anchor.ringFromLeft < anchor.heroWidth * 0.28, `the person anchors the LEFT of the World, not the centre (ring ${anchor.ringFromLeft}px into a ${anchor.heroWidth}px card)`);

  /* ---- 3. Visitor context + permission ---- */
  console.log("3. Visitor context");
  await open(page, 1440, 900, { viewer: "visitor" });
  ok(await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero")) === "visitor", "visitor hero is data-sb-hero='visitor'");
  ok(/’s World|'s World/.test(await page.$eval("[data-sb-world-context]", (e) => e.textContent)), "visitor World context reads \"{name}'s World\"");
  ok(!(await page.$("[data-sb-contact]")), "no owner contact pill leaks to a visitor");
  ok(!(await page.$("[data-sb-view-as-public]")), "no owner View-as-public leaks to a visitor");
  ok(!!(await page.$("[data-sb-band-panel]")), "visitor sees the band-level panel (no exact life count)");
  const visitorHero = await page.$eval("[data-sb-hero]", (e) => e.textContent);
  ok(!/\d+y \d\dm \d\dd/.test(visitorHero) && !/12,732/.test(visitorHero), "visitor hero carries no exact age or day count");

  /* ---- 4. Relationship placement (visitor, OUTSIDE the ring) ---- */
  console.log("4. Relationship placement");
  await open(page, 1440, 900, { viewer: "visitor", extra: { rel: "request-in" } });
  ok(await page.$eval("[data-sb-hero-relationship]", (e) => e.getAttribute("data-sb-hero-relationship")) === "request-in", "request-in state renders on the visitor hero");
  ok(!!(await page.$("[data-sb-hero-accept]")) && !!(await page.$("[data-sb-hero-decline]")), "request-in offers Accept / Decline");
  const relOutsideRing = await page.evaluate(() => { const rel = document.querySelector("[data-sb-hero-relationship]"); const ring = document.querySelector("[data-sb-ring]"); return !ring.contains(rel); });
  ok(relOutsideRing, "relationship is rendered OUTSIDE the Life Ring (§32)");
  await open(page, 1440, 900, { viewer: "visitor", extra: { rel: "none" } });
  ok(!!(await page.$("[data-sb-hero-add-friend]")), "none state offers Add friend");

  /* ---- 5. View as public — structure + DOM privacy (no owner precision) ---- */
  console.log("5. View as public");
  await open(page, 1440, 900, { viewer: "maya" });
  const genuineVisitor = await (async () => { await open(page, 1440, 900, { viewer: "visitor" }); return page.$eval("[data-sb-hero]", (e) => ({ contact: !!e.querySelector("[data-sb-contact]"), band: !!e.querySelector("[data-sb-band-panel]"), born: /Born|जन्म|出生|Nacimiento/.test(e.textContent) })); })();
  await open(page, 1440, 900, { viewer: "maya" });
  await page.click("[data-sb-view-as-public]"); await sleep(350);
  const preview = await page.$eval("[data-sb-hero]", (e) => ({ contact: !!e.querySelector("[data-sb-contact]"), band: !!e.querySelector("[data-sb-band-panel]"), born: /Born/.test(e.textContent), selfPreview: e.hasAttribute("data-sb-self-preview") }));
  ok(!!(await page.$("[data-sb-viewing-as-public]")), "a quiet 'Viewing as public' state indicator appears");
  ok(!!(await page.$("[data-sb-return-to-my-world]")), "the preview offers Return to My World");
  ok(!preview.contact && !preview.born, "preview shows NO owner precision (no contact, no Born) in the DOM");
  ok(preview.band, "preview shows the visitor band panel");
  ok(preview.contact === genuineVisitor.contact && preview.band === genuineVisitor.band, "preview DOM shape matches a genuine visitor's (real visitor-safe model, not CSS masking)");
  await page.click("[data-sb-return-to-my-world]"); await sleep(300);
  ok(await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero")) === "owner", "Return to My World restores the owner view");

  /* ---- 6. Life Ring semantics ---- */
  console.log("6. Life Ring");
  await open(page, 1440, 900, { viewer: "maya" });
  ok(!!(await page.$("[data-sb-hero] [data-sb-ring]")), "the Life Ring frames the identity");
  ok(!!(await page.$("[data-sb-hero] [data-sb-ring-instrument]")), "at profile scale the ring is the dimensional Life Instrument");
  ok(!!(await page.$("[data-sb-hero] [data-sb-identity-photo]")), "owner shows a real photo inside the ring");

  /* ---- 7. Identity resilience ---- */
  console.log("7. Identity resilience");
  await open(page, 1440, 900, { viewer: "maya", extra: { photo: "none" } });
  ok(!!(await page.$("[data-sb-hero] [data-sb-identity-initials]")), "missing photo → initials inside the ring (never a broken icon)");
  await open(page, 1440, 900, { viewer: "maya", extra: { photo: "broken" } });
  await sleep(300);
  ok(!!(await page.$("[data-sb-hero] [data-sb-identity-initials]")), "broken portrait → initials fallback (onError)");

  /* ---- 8. World Wall — image / none / broken ---- */
  console.log("8. World Wall");
  await open(page, 1440, 900, { viewer: "maya" });
  ok(await page.$eval("[data-sb-cover-region]", (e) => e.getAttribute("data-sb-cover")) === "set" && !!(await page.$("[data-sb-cover-photo]")), "a set Wall renders as a real World horizon");
  await open(page, 1440, 900, { viewer: "maya", extra: { nocover: "1" } });
  ok(await page.$eval("[data-sb-cover-region]", (e) => e.getAttribute("data-sb-cover")) === "fallback" && !!(await page.$("[data-sb-cover-fallback]")), "no Wall → a theme atmospheric field, not a fake empty banner");
  await open(page, 1440, 900, { viewer: "maya", extra: { wall: "broken" } });
  await sleep(400);
  ok(await page.$eval("[data-sb-cover-region]", (e) => e.getAttribute("data-sb-cover")) === "fallback" && !(await page.$("[data-sb-cover-photo]")), "a broken Wall degrades to the atmospheric field, never a broken image (§55)");
  await open(page, 1440, 900, { viewer: "maya" });
  const coverH = await page.evaluate(() => Math.round(document.querySelector("[data-sb-cover-region]").getBoundingClientRect().height));
  ok(coverH <= 160, `the Wall is atmosphere, not a masthead (${coverH}px)`);

  /* ---- 9. Mobile priority ---- */
  console.log("9. Mobile priority");
  await open(page, 360, 800, { viewer: "maya" });
  const ownerFM = await firstMoment(page);
  ok(await noHScroll(page), "owner 360: no horizontal overflow");
  ok(ownerFM !== null && ownerFM < 820, `owner 360 first Moment near the first screen (${ownerFM}px)`);
  ok(!!(await page.$("[data-sb-open-composer]")), "owner keeps the composer (record into My World)");
  await open(page, 360, 800, { viewer: "visitor" });
  const visitorFM = await firstMoment(page);
  ok(visitorFM !== null && visitorFM < ownerFM, `visitor reaches Moments EARLIER than owner (${visitorFM} < ${ownerFM})`);
  ok(!(await page.$("[data-sb-open-composer]")), "visitor has no composer — the space brings Moments up");
  await shot("mobile-owner");

  /* ---- 10. Long name + name scripts ---- */
  console.log("10. Names");
  await open(page, 360, 800, { viewer: "maya", extra: { profileName: "Krishna Bahadur Gurung Tamang Magar Rana" } });
  ok(await noHScroll(page), "a 40-char name does not overflow at 360 (§25/§50)");
  const nameLines = await page.$eval("[data-sb-hero] h1", (e) => e.getBoundingClientRect().height);
  ok(nameLines > 40, "a long name wraps (does not truncate identity)");

  /* ---- 11. Locale-safe profile strings ---- */
  console.log("11. Localisation");
  await open(page, 1440, 900, { viewer: "maya", lang: "es", cookie: "es" });
  ok(/Mi Mundo/.test(await page.$eval("[data-sb-world-context]", (e) => e.textContent)), "es: World context is localised (Mi Mundo)");
  await open(page, 1440, 900, { viewer: "maya", lang: "ne", cookie: "ne" });
  ok(/मेरो संसार/.test(await page.$eval("[data-sb-world-context]", (e) => e.textContent)), "ne: World context is localised (मेरो संसार)");
  ok(await page.$eval("[data-sb-hero] h1 [aria-label]", (e) => e.getAttribute("aria-label")) === "प्रमाणित", "ne: the Verified badge aria is localised");
  await open(page, 1440, 900, { viewer: "maya", lang: "zh-Hans", cookie: "zh-Hans" });
  ok(/我的世界/.test(await page.$eval("[data-sb-world-context]", (e) => e.textContent)), "zh: World context is localised (我的世界)");
  await page.setCookie({ name: "sb-locale", value: "en", domain: "localhost", path: "/" });

  /* ---- 12. 200% zoom ---- */
  console.log("12. 200% zoom");
  await open(page, 1440, 1200, { viewer: "maya" });
  await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300);
  ok(await noHScroll(page), "at 200% page zoom the profile does not overflow horizontally (§50)");
  await page.evaluate(() => { document.body.style.zoom = "1"; });

  /* ---- 13. Page health ---- */
  console.log("13. Page health");
  // Steps 7–8 deliberately loaded missing portrait/cover assets to prove the fallbacks; those
  // expected 404s are cleared here so this check measures a genuinely clean owner page.
  consoleErrors.length = 0;
  await open(page, 1440, 900, { viewer: "maya" });
  await sleep(300);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S2 PERSON WORLD: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S2 PERSON WORLD: PASS");
  process.exit(failures.length ? 1 : 0);
})();
