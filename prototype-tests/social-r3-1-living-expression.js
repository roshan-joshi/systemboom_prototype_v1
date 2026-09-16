/* SYSTEMBOOM — R3.1: LIVING EXPRESSION ART DIRECTION.
   The R3 interaction architecture was ACCEPTED; its visual art was REJECTED as dull. This
   suite protects what R3.1 changed: eighteen expressions in three emotional groups, the
   Quick DECK of dimensional seats (not a flat rail), the premium Expression LIBRARY (not a
   settings grid), the owned seat + Boom notch, MASS-based motion, the shipped 3D artwork and
   its optical head crop, the neutral social mascot, and — honestly — the no-marks test that
   records what is still ART ASSET BLOCKED.
     node prototype-tests/social-r3-1-living-expression.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
/** R3.8 — the picker has ONE vessel: attend a core and the vessel declares that expression
    (pose · mass · energy · tier · render). Collect per id by hovering. */
const heroOf = async (page, id) => {
  const r = await page.evaluate((i) => { const b = document.querySelector(`[data-sb-expression-option='${i}']`).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, id);
  await page.mouse.move(r.x, r.y, { steps: 2 });
  await sleep(160);
  return page.$eval("[data-sb-horizon-stage] [data-sb-expression]", (e) => ({ pose: getComputedStyle(e.querySelector("[data-sb-pose]")).transform, mass: e.getAttribute("data-sb-expression-mass"), energy: e.getAttribute("data-sb-expression-energy"), tier: e.querySelector("[data-sb-pose-applied]")?.getAttribute("data-sb-pose-applied") ?? "", src: e.querySelector("img")?.getAttribute("src") ?? "" }));
};

const ENERGY = ["proud", "speechless"];
const WARMTH = ["love", "thanks", "touched", "withyou"];
const THOUGHT = ["respect", "inspired", "curious", "agree", "thinking", "nostalgia"];
const ALL = [...QUICK, ...ENERGY, ...WARMTH, ...THOUGHT];

async function open(page, w, h, { theme = "dark", lang = "en", viewer = "maya" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", viewer);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(220); };
const openDeck = async (page) => { await toRain(page); await page.click(`${RAIN} [data-sb-express]`); await sleep(360); };
const openLibrary = async (page) => { await openDeck(page); await page.click("[data-sb-expression-more]"); await sleep(380); };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Eighteen expressions in three emotional groups ---- */
  console.log("1. The expanded language");
  await open(page, 1440, 1000);
  await openLibrary(page);
  const ids = await page.$$eval("[data-sb-expression-library] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("data-sb-expression-option")));
  ok(ids.length === 18, `the registry is eighteen expressions (${ids.length})`);
  // Owner-superseded (R3.7 §10): the field is organised by emotional FAMILY — warmth · energy ·
  // wonder · connection — each family one spatial band. The invariant (all eighteen, in one
  // stable, meaningful order, quick expressions leading their family) is unchanged.
  const FIELD = ["care", "love", "thanks", "touched", "nostalgia", "joy", "laugh", "celebrate", "proud", "wow", "speechless", "inspired", "curious", "thinking", "support", "withyou", "respect", "agree"];
  ok(ids.join(",") === FIELD.join(","), "the field orders by family — warmth · energy · wonder · connection — each quick expression leading its family");
  // Owner-superseded (R3.8 §13): the Atlas is organised by the four colour FAMILIES, as spatial bands
  const groups = await page.$$eval("[data-sb-expression-library] [data-sb-field-band]", (n) => n.map((e) => e.getAttribute("data-sb-field-band")));
  ok(groups.join(",") === "warmth,energy,wonder,connection", `four emotional families order the Atlas (${groups.join(", ")})`);
  const tabs = await page.$$eval("[data-sb-expression-library]", (n) => n.some((p) => p.querySelector("[role=tab],[role=tablist]")));
  ok(!tabs, "the groups are structure and air — never exposed as tabs (§11)");
  ok(!(await page.$("[data-sb-expression-option='surprised']")), "Surprised is gone — it duplicated Wow; Nostalgia took the slot (§14)");
  const careLove = await page.evaluate(() => {
    const g = (id) => document.querySelector(`[data-sb-expression-option='${id}']`)?.getAttribute("aria-label");
    return { care: g("care"), love: g("love") };
  });
  ok(!!careLove.care && !!careLove.love && careLove.care !== careLove.love, "Care and Love are distinct expressions, not one feeling twice (§12)");

  /* ---- 2. The QUICK DECK — seats, not a flat rail ---- */
  console.log("2. The Quick Deck");
  await open(page, 1440, 1000);
  await openDeck(page);
  const deck = await page.evaluate(() => {
    const d = document.querySelector("[data-sb-expression-deck]");
    const seats = [...d.querySelectorAll("[data-sb-expression-option]")];
    // Suite correction (R3.6): the deck opens with the first seat focused, whose art is
    // RISEN (scale 1.10) — the size bound describes the resting tile, so measure one at rest.
    const s0 = seats.find((x) => x !== document.activeElement && !x.hasAttribute("data-sb-previewing")) ?? seats[0];
    const cs = getComputedStyle(s0);
    // Owner-superseded (R3.8 §1–§4): the Quick Six are CORE OBJECTS on a horizon below ONE vessel
    const art = s0.querySelector("[data-sb-core]").getBoundingClientRect();
    return {
      n: seats.length,
      cell: Math.round(s0.getBoundingClientRect().width),
      art: Math.round(art.width),
      // Owner-superseded (R3.7 §4): the seat is an INVISIBLE hit target on one shared ground —
      // no well, no card. Dimension still comes from material (the ground + contact shadow),
      // never from glow; the invariant is asserted on the seat being transparent.
      onGround: cs.backgroundImage === "none" && cs.boxShadow === "none",
      seatClass: s0.className.includes("sb-core"),
      caption: (d.querySelector("[data-sb-deck-caption]")?.textContent ?? "").trim(),
      deckMaterial: getComputedStyle(d).backgroundImage !== "none",
    };
  });
  ok(deck.n === 6, `the deck seats the quick six (${deck.n})`);
  ok(deck.cell >= 44 && deck.cell <= 72, `a core's hit target is real, 44–72px (${deck.cell}px)`);
  ok(deck.art >= 36 && deck.art <= 48, `the core object inside it is 36–48px — an object, not an icon (${deck.art}px)`);
  ok(deck.onGround && deck.seatClass, "each core is a transparent hit target on ONE shared ground — dimension from material, not from glow");
  ok(deck.deckMaterial, "the deck itself carries a material gradient, not a flat plate");
  ok(deck.caption.length > 0, `the deck states a semantic name (“${deck.caption}”)`);
  const noGlow = await page.$$eval("[data-sb-expression-deck] [data-sb-expression]", (n) => n.every((e) => {
    const f = getComputedStyle(e).filter;
    return f === "none" || !/drop-shadow/.test(f);
  }));
  ok(noGlow, "no glow, no halo, no baked drop shadow on the character (§40)");

  /* the caption follows attention */
  const before = deck.caption;
  await page.hover("[data-sb-expression-option='celebrate']");
  await sleep(220);
  const after = await page.$eval("[data-sb-deck-caption]", (e) => e.textContent.trim());
  ok(after !== before && /celebr/i.test(after), `the name follows what the person is attending to (${before} → ${after})`);

  /* ---- 3. The owned seat ---- */
  console.log("3. Owning a seat");
  await page.click("[data-sb-expression-option='celebrate']");
  await sleep(420);
  await openDeck(page);
  const owned = await page.$eval("[data-sb-expression-option][aria-checked=true]", (e) => ({
    seat: e.className.includes("sb-seat-own"),
    notch: !!e.querySelector("[data-sb-own-mark]"),
    round: e.querySelector("[data-sb-own-mark]") ? getComputedStyle(e.querySelector("[data-sb-own-mark]")).borderRadius : "",
    checked: e.getAttribute("aria-checked"),
  }));
  ok(owned.checked === "true" && owned.seat, "the chosen expression OWNS its seat — a deeper recess it has settled into");
  ok(owned.notch && !/50%/.test(owned.round), "ownership is a small Boom notch on the rim, never a red circle (§24)");
  await page.click("[data-sb-expression-remove]");
  await sleep(320);
  ok((await page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"))) === "", "Remove gives the seat back");

  /* ---- 4. The EXPRESSION LIBRARY — a considered room, not a settings grid ---- */
  console.log("4. The Expression Library");
  await open(page, 1440, 1000);
  await openLibrary(page);
  const lib = await page.evaluate(() => {
    const p = document.querySelector("[data-sb-expression-library]");
    const cells = [...p.querySelectorAll("[data-sb-expression-option]")];
    const r = p.getBoundingClientRect();
    const art = cells[0].querySelector("[data-sb-core]").getBoundingClientRect();
    const rows = [...new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top)))];
    return {
      named: cells.every((c) => (c.textContent ?? "").trim().length > 0),
      art: Math.round(art.width),
      material: getComputedStyle(p).backgroundImage !== "none",
      withinTop: r.top >= 0,
      withinBottom: r.bottom <= innerHeight + 1,
      cols: cells.filter((c) => Math.round(c.getBoundingClientRect().top) === rows[0]).length,
      separated: [...p.querySelectorAll("[role=radiogroup] > div")].filter((d) => getComputedStyle(d).borderTopWidth !== "0px").length,
    };
  });
  ok(lib.named, "every expression in the library is NAMED — this is how the language is learned");
  ok(lib.art >= 36, `the Atlas's cores are real objects (${lib.art}px)`);
  ok(lib.material, "the library has a domed material ground, not a generic white rectangle (§26)");
  ok(lib.cols >= 4 && lib.cols <= 6, `four to six cores per family row, with room to breathe (${lib.cols})`);
  ok(lib.separated >= 3, `the emotional groups are separated by air, not by tabs (${lib.separated} divisions)`);
  ok(lib.withinTop && lib.withinBottom, "the library never leaves the screen — its scroller is capped to the room above the control");

  /* ---- 5. The shipped 3D artwork and its optical crops ---- */
  console.log("5. The artwork");
  await open(page, 1440, 1000);
  await toRain(page);
  const neutral = await page.$eval(`${RAIN} [data-sb-express]`, (b) => b.querySelector("[data-sb-express-neutral]")?.getAttribute("src") ?? "");
  // Owner-superseded (R3.8 §12): the closed control is the compact DORMANT CHAMBER, never a tiny mascot
  ok(/neutral-chamber-lens-sm\.webp$/.test(neutral), `the control wears the DORMANT chamber (${neutral})`);
  const srcs = await page.evaluate(() => {
    const summary = document.querySelector("[data-sb-moment='m-rain'] [data-sb-expression-summary] img")?.getAttribute("src") ?? "";
    return { summary };
  });
  // R3.3 owner-superseded: the presence line moved from the sm face crop to the dedicated
  // Boom-Lens XS optical crop — tighter still, designed for aggregate scale.
  // R3.5: the quick six carry their own EMOTION-CORE lens crops now
  ok(/-lens-xs\.webp$/.test(srcs.summary), `the presence line uses the Boom-Lens XS optical crop (${srcs.summary})`);
  await openDeck(page);
  const deckSrc = await page.$eval("[data-sb-expression-option='joy'] img", (e) => e.getAttribute("src"));
  ok(/-core\.webp$/.test(deckSrc), `the horizon shows the CORE object (${deckSrc}); the one vessel carries the md/lg render`);
  const res = await page.evaluate(async () => {
    const r = await fetch("/brand/expressions/neutral-md.webp");
    return { ok: r.ok, type: r.headers.get("content-type"), bytes: Number(r.headers.get("content-length") || 0) };
  });
  ok(res.ok && /webp/.test(res.type ?? ""), `the artwork really is a WebP with alpha (${res.type})`);
  ok(res.bytes > 0 && res.bytes <= 70000, `md stays inside its budget (${res.bytes} bytes ≤ 70KB)`);

  /* ---- 6. MASS — the character is a heavy metal bomb, not a rubber emoji ---- */
  console.log("6. Mass");
  // Owner-superseded (R3.8): mass lives on the ONE vessel — attend a core and the vessel declares it;
  // the commit impulse plays on the vessel (the lens beside Respond only LANDS afterwards)
  const mass = [`support:${(await heroOf(page, "support")).mass}`, `celebrate:${(await heroOf(page, "celebrate")).mass}`];
  ok(mass.includes("support:heavy") && mass.includes("celebrate:light"), `mass is declared per expression (${mass.join(", ")})`);
  const bands = [...new Set(mass.map((m) => m.split(":")[1]))].sort();
  ok(bands.length >= 2, `more than one mass band is really in use (${bands.join(", ")})`);
  await page.click("[data-sb-expression-option='support']");
  await sleep(200);
  const impulse = await page.evaluate(() => {
    const el = document.querySelector("[data-sb-horizon-stage] [class*='sb-mass']");
    if (!el) return null;
    const cs = getComputedStyle(el);
    const ring = document.querySelector("[data-sb-horizon-stage] .sb-boom-pulse");
    return { name: cs.animationName, dur: cs.animationDuration, ring: ring ? getComputedStyle(ring).getPropertyValue("--pulse-to").trim() : "" };
  });
  ok(!!impulse && /sb-mass-heavy/.test(impulse.name), `committing plays the mass impulse layer on the vessel (${impulse && impulse.name})`);
  ok(impulse && impulse.ring === "1.62", `the pressure ring is mass-scaled — heavy displaces least (${impulse && impulse.ring})`);
  await sleep(1100);
  const atRest = await page.$eval(RAIN, (m) => [...m.querySelectorAll("*")].filter((e) => e.getAnimations && e.getAnimations().some((a) => a.playState === "running")).length);
  ok(atRest === 0, `nothing loops — the feed is still a second later (${atRest} running)`);

  /* ---- 7. The no-marks test, reported honestly (§4, §43, §62) ---- */
  console.log("7. No-marks (ART ASSET BLOCKED — recorded, not hidden)");
  await open(page, 1440, 1000);
  await openDeck(page);
  const marks = await page.$$eval("[data-sb-expression-deck] [data-sb-mark]", (n) => n.length);
  // R3.6 owner-superseded: the tile carries meaning INTERNALLY (Emotion Core + face + fuse),
  // so the external badges left the tray entirely — the honest no-marks state is now the
  // permanent state, not a test-only toggle. The invariant (never rely on tiny external
  // badges) is asserted directly.
  ok(marks === 0, `the tray shows NO external badges — the vessel itself carries the emotion (${marks})`);
  const faces = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option] img", (n) => [...new Set(n.map((e) => e.getAttribute("src")))]);
  // R3.5 owner-superseded: the quick six now differ through the EMOTION CORE revealed inside
  // the body — six distinct assets. The FACE itself is still the one supplied pose, and the
  // per-expression facial renders remain ART ASSET BLOCKED (the invariant this check protects
  // is honesty about what differentiates the six, and that is now recorded here).
  ok(faces.length === 6, `each quick expression carries its own Emotion-Core artwork (${faces.length}/6); the facial renders remain artist work`);
  const poses = [];
  for (const id of QUICK) poses.push((await heroOf(page, id)).pose);
  ok(new Set(poses).size >= 5, `what a POSE can honestly carry is carried: ${new Set(poses).size} distinct body transforms of 6 (on the one vessel)`);

  /* ---- 8. Device range ---- */
  console.log("8. Device range");
  for (const [w, h] of [[320, 640], [360, 800], [390, 844], [1440, 1000]]) {
    await open(page, w, h);
    await openDeck(page);
    const d = await page.evaluate(() => {
      const el = document.querySelector("[data-sb-expression-deck]");
      const b = el.getBoundingClientRect();
      const more = document.querySelector("[data-sb-expression-more]").getBoundingClientRect();
      const seats = [...el.querySelectorAll("[data-sb-expression-option]")].map((o) => Math.round(o.getBoundingClientRect().width));
      return { within: b.left >= -1 && b.right <= innerWidth + 1, min: Math.min(...seats), n: seats.length, moreIn: more.left >= b.left - 1 && more.right <= b.right + 1 && more.width > 0 };
    });
    ok(d.within && (await noHScroll(page)), `${w}: the deck stays inside the frame, no page overflow`);
    ok(d.min >= 44 && d.n === 6, `${w}: six real touch targets, never shrunk to dots (${d.min}px)`);
    ok(d.moreIn, `${w}: More stays reachable — the seats may scroll, the affordance may not`);
    await page.click("[data-sb-expression-more]");
    await sleep(380);
    const l = await page.evaluate(() => {
      const r = document.querySelector("[data-sb-expression-library]").getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, vh: innerHeight };
    });
    ok((await noHScroll(page)) && l.top >= -1 && l.bottom <= l.vh + 1, `${w}: the eighteen-expression library fits the screen (${Math.round(l.top)}–${Math.round(l.bottom)} of ${l.vh})`);
  }

  /* ---- 9. Serious emotion stays serious (§17) ---- */
  console.log("9. Serious emotion");
  await open(page, 1440, 1000);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(240); }
  for (const id of ["m-health", "m-problem"]) {
    const has = await page.$(`[data-sb-moment='${id}'] [data-sb-express]`);
    ok(!has, `${id}: a record is never given an expression control`);
  }

  /* ---- 10. Reduced motion ---- */
  console.log("10. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  const rm = [];
  for (const id of QUICK) rm.push((await heroOf(page, id)).pose);
  ok(rm.every((t) => t !== "none") && new Set(rm).size >= 5, "reduced motion keeps every POSE — the emotion survives with no animation at all");
  const rise = await page.$eval("[data-sb-expression-option='joy']", (e) => getComputedStyle(e.querySelector(".sb-core-body")).transitionDuration);
  ok(parseFloat(rise) <= 0.001, `the seat's rise collapses to instant, the state stays legible (${rise})`);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 11. Eight languages name all eighteen ---- */
  console.log("11. Languages");
  for (const lang of ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"]) {
    await open(page, 1440, 1000, { lang });
    await openLibrary(page);
    const labels = await page.$$eval("[data-sb-expression-library] [data-sb-expression-option]", (n) => n.map((o) => (o.textContent ?? "").trim()));
    ok(labels.length === 18 && new Set(labels).size === 18 && labels.every(Boolean), `${lang}: eighteen distinct names (${new Set(labels).size}/18)`);
  }

  /* ---- 12. Nothing else moved ---- */
  console.log("12. Untouched systems");
  await open(page, 1440, 1000);
  await toRain(page);
  const ringHtml = () => page.$eval(`${RAIN} [data-sb-ring]`, (e) => e.outerHTML);
  const ring = await ringHtml();
  await openDeck(page);
  await page.click("[data-sb-expression-option='care']");
  await sleep(420);
  ok(ring === (await ringHtml()), "an Expression changes NOTHING about the Life Ring — bit-for-bit identical");
  ok(!!(await page.$(`${RAIN} [data-sb-respond]`)), "Respond is still the verb, still beside the expression");
  ok(!!(await page.$(`${RAIN} [data-sb-responses]`)), "the written conversation is still its own object");

  /* ---- 13. Page health ---- */
  console.log("13. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.1 LIVING EXPRESSION: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
