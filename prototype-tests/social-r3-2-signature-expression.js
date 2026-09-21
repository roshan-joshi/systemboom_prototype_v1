/* SYSTEMBOOM — R3.2: SIGNATURE LIVING EXPRESSIONS.
   Structural outcomes only (§79). A test can prove the Quick Six are six real, distinct,
   committable objects with the right asset tier, the right deck at every phone width, the
   right motion wiring and no passive animation. It CANNOT prove the artwork is good — that
   is the owner's eye, and the no-marks board is what it judges.
     node prototype-tests/social-r3-2-signature-expression.js */
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

/** R3.2 §16 — per-expression tempo. Guidance bands from the brief, not exact numbers. */
const TEMPO_BAND = { care: [280, 420], joy: [260, 380], laugh: [320, 460], wow: [240, 360], celebrate: [360, 520], support: [300, 460] };

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
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
// idempotent: the control TOGGLES, so opening an already-open deck would close it
const openDeck = async (page) => {
  await toRain(page);
  if (await page.$("[data-sb-expression-deck]")) return;
  const b = await centre(page, `${RAIN} [data-sb-express]`);
  await page.mouse.click(b.x, b.y);
  await sleep(380);
};
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. The Quick Six are the product ---- */
  console.log("1. Quick Six registry");
  await open(page, 1440, 1000);
  await openDeck(page);
  const ids = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("data-sb-expression-option")));
  ok(ids.join(",") === QUICK.join(","), `the deck is exactly Care · Joy · Laugh · Wow · Celebrate · Support (${ids.join(", ")})`);
  const named = await page.evaluate(() => [...document.querySelectorAll("[data-sb-expression-deck] [data-sb-expression-option]")].every((o) => (o.getAttribute("aria-label") ?? "").length > 3));
  ok(named, "each carries its own localized accessible name");
  // Owner-superseded (R3.8 §1): ONE vessel, six cores — the body language is read on the vessel per core
  const heroes = {};
  for (const id of QUICK) heroes[id] = await heroOf(page, id);
  const distinctPose = new Set(Object.values(heroes).map((h) => h.pose)).size;
  ok(distinctPose === 6, `six genuinely different body poses, no repeats (${distinctPose}/6)`);
  const masses = [...new Set(Object.values(heroes).map((h) => h.mass))].sort();
  ok(masses.length >= 2, `more than one mass band across the six (${masses.join(", ")})`);

  /* ---- 2. Asset tiers (§52) ---- */
  console.log("2. Asset tiers");
  const deckSrc = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option] img", (n) => [...new Set(n.map((e) => e.getAttribute("src")))]);
  // Owner-superseded (R3.8): the horizon holds CORE objects; the one vessel carries the render
  ok(deckSrc.every((s) => /-core\.webp$/.test(s)) && Object.values(heroes).every((h) => /-(md|lg)\.webp$/.test(h.src)), `six core objects on the horizon; the vessel renders md/lg (${deckSrc.length} cores)`);
  ok(!deckSrc.some((s) => /-lg\.webp$/.test(s)), "no LG asset is ever loaded into a feed action row as a picker tile (§52)");
  const ctrlSrc = await page.$eval(`${RAIN} [data-sb-express] img`, (e) => e.getAttribute("src"));
  ok(/-sm\.webp$/.test(ctrlSrc), `the Moment action control resolves the SM optical crop (${ctrlSrc})`);
  const tierFace = [...new Set(Object.values(heroes).map((h) => h.tier))];
  ok(tierFace.join() === "body", "the vessel's art carries the BODY pose — posture is part of the expression there");
  const budget = await page.evaluate(async () => {
    const out = {};
    for (const t of ["sm", "md", "lg"]) {
      const r = await fetch(`/brand/expressions/neutral-${t}.webp`);
      out[t] = { ok: r.ok, type: r.headers.get("content-type"), bytes: Number(r.headers.get("content-length") || 0) };
    }
    return out;
  });
  ok(budget.sm.ok && budget.md.ok && budget.lg.ok && Object.values(budget).every((v) => /webp/.test(v.type ?? "")), "every tier is a real WebP with alpha");
  ok(budget.sm.bytes <= 24000 && budget.md.bytes <= 70000 && budget.lg.bytes <= 140000, `each tier is inside its budget (sm ${budget.sm.bytes} · md ${budget.md.bytes} · lg ${budget.lg.bytes})`);

  /* ---- 3. Selection, one-active, change, remove (§31) ---- */
  console.log("3. Selection");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='laugh']")));
  await sleep(420);
  ok((await mine(page)) === "laugh", "tapping a seat commits that expression");
  const own = await page.$eval(`${RAIN} [data-sb-express]`, (e) => ({ seat: e.className.includes("sb-seat-own"), rim: !!e.querySelector("[data-sb-own-mark]"), face: e.querySelector("img")?.getAttribute("src") ?? "" }));
  ok(own.seat && own.rim, "the control becomes an OWNED SEAT with a Boom rim, not a flat coloured circle (§30, §58)");
  // Owner-superseded (R3.9.1 Emotion Signet): the compact state is the touched CORE OBJECT in
  // the aperture ring — same invariant (a designed compact state, never a shrunken full mascot)
  ok(/-core\.webp$/.test(own.face), "the selected control shows the expression's own core object in the signet");
  await openDeck(page);
  const checked = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option][aria-checked=true]", (n) => n.map((o) => o.getAttribute("data-sb-expression-option")));
  ok(checked.length === 1 && checked[0] === "laugh", `exactly one expression is active for this viewer (${checked.join(",")})`);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='wow']")));
  await sleep(420);
  ok((await mine(page)) === "wow", "choosing another REPLACES — never two from one viewer");
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-remove]")));
  await sleep(380);
  ok((await mine(page)) === "", "Remove clears it, with no settings menu anywhere (§31)");

  /* ---- 4. Quick / More split (§35) ---- */
  console.log("4. Quick and More");
  await openDeck(page);
  ok(!!(await page.$("[data-sb-expression-more]")), "More reveals the extended library without crowding the Quick Six");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(400);
  const lib = await page.$$eval("[data-sb-expression-library] [data-sb-expression-option]", (n) => n.length);
  ok(lib === 18, `the extended architecture is intact behind More (${lib})`);

  /* ---- 5. The phone deck: ONE pattern, all six visible (§20–§22) ---- */
  console.log("5. Phone deck");
  for (const [w, h] of [[320, 640], [360, 800], [390, 844], [430, 932]]) {
    await open(page, w, h);
    await openDeck(page);
    const d = await page.evaluate(() => {
      const deck = document.querySelector("[data-sb-expression-deck]");
      const group = deck.querySelector("[role=radiogroup]");
      const r = deck.getBoundingClientRect();
      const seats = [...deck.querySelectorAll("[data-sb-expression-option]")];
      const art = seats.map((s) => Math.round(s.querySelector("[data-sb-core]").getBoundingClientRect().width));
      const boxes = seats.map((s) => s.getBoundingClientRect());
      const heroEl = deck.querySelector("[data-sb-horizon-stage] [data-sb-expression], [data-sb-horizon-stage] [data-sb-vessel-dormant]");
      return {
        hero: Math.round(heroEl.getBoundingClientRect().width),
        pattern: group.getAttribute("data-sb-deck-pattern"),
        n: seats.length,
        seat: Math.round(boxes[0].width),
        art: Math.min(...art),
        // every seat fully inside the deck AND inside the viewport — nothing scrolled away
        allVisible: boxes.every((b) => b.left >= r.left - 1 && b.right <= r.right + 1 && b.top >= 0 && b.bottom <= innerHeight + 1),
        inFrame: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1,
        scroller: ["visible", "clip"].includes(getComputedStyle(group).overflowX),
      };
    });
    // Owner-superseded (R3.8 §1, §22): ONE vessel + six cores on a horizon replaces the 3×2 of six mascots
    ok(d.pattern === "horizon", `${w}: the one phone pattern is the Emotion Horizon (${d.pattern})`);
    ok(d.n === 6 && d.allVisible, `${w}: all six cores are visible at once — nothing scrolled out of sight`);
    ok(d.art >= 34 && d.art <= 48 && d.hero >= 84 && d.hero <= 110, `${w}: cores ${d.art}px under one ${d.hero}px vessel — big enough to read`);
    ok(d.seat >= 44, `${w}: the seat is a real touch target (${d.seat}px)`);
    ok(d.inFrame && (await noHScroll(page)), `${w}: the deck stays on screen with no page overflow`);
    ok(d.scroller, `${w}: the six are laid out, never parked behind a horizontal scroller`);
  }

  /* ---- 6. Desktop deck (§23) ---- */
  console.log("6. Desktop deck");
  await open(page, 1440, 1000);
  await openDeck(page);
  const dd = await page.evaluate(() => {
    const deck = document.querySelector("[data-sb-expression-deck]");
    const r = deck.getBoundingClientRect();
    // Owner-superseded (R3.7 §4): the desktop six sit on a shallow ARC, so their tops differ by
    // up to ~10px. The invariant — one horizontal row, no wrapping — is asserted directly.
    const rects = [...deck.querySelectorAll("[data-sb-expression-option]")].map((s) => s.getBoundingClientRect());
    const rows = { size: rects.every((r, i) => i === 0 || r.left > rects[i - 1].left) && Math.max(...rects.map((r) => r.top)) - Math.min(...rects.map((r) => r.top)) <= 14 ? 1 : 2 };
    const moment = document.querySelector("[data-sb-moment='m-rain']").getBoundingClientRect();
    return { pattern: deck.querySelector("[role=radiogroup]").getAttribute("data-sb-deck-pattern"), rows: rows.size, width: Math.round(r.width), nearMoment: r.left >= moment.left - 8 && r.right <= moment.right + 8 };
  });
  ok(dd.pattern === "horizon" && dd.rows === 1, `desktop shows all six cores on one horizon (${dd.rows} row)`);
  ok(dd.width <= 520, `it stays a compact deck, not a giant floating palette (${dd.width}px)`);
  ok(dd.nearMoment, "it stays anchored to the Moment it belongs to (§48)");

  /* ---- 7. Touch: tap always works, drag previews without performing (§24–§25) ---- */
  console.log("7. Touch");
  await open(page, 390, 844);
  await openDeck(page);
  const a = await centre(page, "[data-sb-expression-option='care']");
  const b2 = await centre(page, "[data-sb-expression-option='support']");
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b2.x) / 2, (a.y + b2.y) / 2, { steps: 5 });
  const mid = await page.evaluate(() => {
    const previewing = [...document.querySelectorAll("[data-sb-expression-option][data-sb-previewing]")].map((e) => e.getAttribute("data-sb-expression-option"));
    let keyframes = 0;
    // Owner-superseded (R3.7 §6–§7): a PREVIEW may wake the chamber (`sb-cw-*`, ≤140ms) and the
    // dock's own reveal (`sb-rise-in`) may still be finishing; neither is the expression. The
    // invariant — passing over a seat never plays the EXPRESSION — counts expression keyframes.
    document.querySelectorAll("[data-sb-expression-deck] *").forEach((e) => (e.getAnimations ? e.getAnimations() : []).forEach((an) => { if (an.playState === "running" && !(an instanceof CSSTransition) && !/^sb-cw-|^sb-rise-in$|^sb-hero-preview$/.test(an.animationName ?? "")) keyframes += 1; }));
    return { previewing, keyframes, caption: document.querySelector("[data-sb-deck-caption]").textContent.trim() };
  });
  ok(mid.previewing.length === 1, `dragging previews the seat under the finger (${mid.previewing.join(",")})`);
  ok(mid.keyframes === 0, "a finger passing over a seat NEVER plays the expression (§25)");
  await page.mouse.move(b2.x, b2.y, { steps: 5 });
  await page.mouse.up();
  await sleep(420);
  ok((await mine(page)) === "support", "the expression commits only on an intentional release");
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='joy']")));
  await sleep(420);
  ok((await mine(page)) === "joy", "TAP still works exactly as before — drag is an enhancement, never a requirement");

  /* ---- 8. Motion: shared DNA, per-expression tempo, nothing passive (§14–§19) ---- */
  console.log("8. Motion");
  await open(page, 1440, 1000);
  await openDeck(page);
  const wired = {};
  for (const id of QUICK) wired[id] = await heroOf(page, id);
  ok(Object.values(wired).every((v) => v.mass && v.energy), "every Quick expression declares its mass and energy");
  for (const id of ["wow", "celebrate"]) {
    await openDeck(page);
    const p = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.click(p.x, p.y);
    // Owner-superseded (R3.8 §9): the performance happens on the VESSEL (after the core enters the
    // chamber, ~120ms); the lens beside Respond only lands afterwards. Same names, same tempo.
    await sleep(200);
    const m = await page.evaluate(() => {
      const el = document.querySelector("[data-sb-horizon-stage]");
      const names = [];
      let dur = 0;
      el.querySelectorAll("*").forEach((n) => {
        const cs = getComputedStyle(n);
        if (cs.animationName && cs.animationName !== "none") {
          names.push(cs.animationName);
          dur = Math.max(dur, ...cs.animationDuration.split(",").map((d) => parseFloat(d) * 1000));
        }
      });
      return { names: names.join(" "), dur: Math.round(dur) };
    });
    const [lo, hi] = TEMPO_BAND[id];
    ok(new RegExp(`sb-g-${id}`).test(m.names), `${id}: plays its own emotional gesture, not a shared one (${m.names.split(" ")[0]})`);
    ok(m.dur >= lo - 40 && m.dur <= hi + 40, `${id}: runs at its own tempo, inside the brief's band (${m.dur}ms in ${lo}–${hi})`);
    ok(/sb-boom-pulse/.test(m.names), `${id}: the Boom Pulse is part of the one-shot`);
    await sleep(1100);
  }
  const atRest = await page.$eval(RAIN, (m) => [...m.querySelectorAll("*")].filter((e) => e.getAnimations && e.getAnimations().some((an) => an.playState === "running")).length);
  ok(atRest === 0, `the feed is completely calm a second later — no blink, breathe, bob or spark loop (${atRest} running) (§19)`);
  const passive = await page.evaluate(() => {
    let n = 0;
    document.querySelectorAll("[data-sb-expression]").forEach((e) => e.querySelectorAll("*").forEach((c) => { const cs = getComputedStyle(c); if (cs.animationName !== "none" && cs.animationIterationCount !== "1") n += 1; }));
    return n;
  });
  ok(passive === 0, `no expression declares a repeating animation anywhere (${passive})`);

  /* ---- 9. Presence summary (§32–§34) ---- */
  console.log("9. Summary");
  await open(page, 1440, 1000);
  await toRain(page);
  const sum = await page.evaluate(() => {
    const s = document.querySelector("[data-sb-moment='m-rain'] [data-sb-expression-summary]");
    const imgs = [...s.querySelectorAll("img")].map((i) => i.getAttribute("src"));
    return { n: imgs.length, srcs: [...new Set(imgs)], marks: s.querySelectorAll("[data-sb-mark]").length, lenses: s.querySelectorAll("[data-sb-lens]").length, lensMarks: s.querySelectorAll("[data-sb-lens-mark]").length, text: s.textContent.trim() };
  });
  ok(sum.n <= 3, `at most three distinct expression miniatures (${sum.n})`);
  // R3.3 owner-superseded: the miniatures are Boom Lenses on the dedicated XS optical crop;
  // the ONE semantic mark per lens is seated IN the rim (§5 of R3.3) — floating marks stay banned.
  // Owner-superseded (R3.9.1 Emotion Signet): the resting lens is the CORE OBJECT the person
  // touched, seated in the aperture ring — object permanence over optical crops. The invariant
  // (the compact state carries each expression's own distinct emotion) is unchanged.
  ok(sum.srcs.every((s) => /-core\.webp$/.test(s)), "the miniatures are Emotion Signets — each person's own core object, never a shrunken MD asset");
  ok(sum.marks === 0 && sum.lensMarks <= sum.lenses, "no floating symbols — at most one rim-integrated mark per lens");
  ok(!/%|top|trend|popular|score/i.test(sum.text), `no ranking or popularity language (“${sum.text}”)`);

  /* ---- 10. Health / Problem stay records (§40 context, R3 §17) ---- */
  console.log("10. Serious kinds");
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(240); }
  for (const id of ["m-health", "m-problem"]) {
    ok(!(await page.$(`[data-sb-moment='${id}'] [data-sb-express]`)), `${id}: never given an expression control`);
  }

  /* ---- 11. Life is untouched (§50) ---- */
  console.log("11. Life");
  await open(page, 1440, 1000);
  await toRain(page);
  const ringBefore = await page.$eval(`${RAIN} [data-sb-ring]`, (e) => e.outerHTML);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='celebrate']")));
  await sleep(500);
  ok(ringBefore === (await page.$eval(`${RAIN} [data-sb-ring]`, (e) => e.outerHTML)), "expressing changes NOTHING about the Life Ring — bit-for-bit identical");

  /* ---- 12. Keyboard, reduced motion, high contrast (§56–§58) ---- */
  console.log("12. Accessibility");
  await open(page, 1440, 1000);
  await toRain(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter");
  await sleep(380);
  ok(await page.evaluate(() => document.activeElement?.getAttribute("role") === "radio"), "keyboard opens the deck onto a seat");
  await page.keyboard.press("ArrowRight");
  await sleep(120);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-expression-option"));
  const focusStill = await page.evaluate(() => {
    const el = document.activeElement;
    return [...el.querySelectorAll("*")].every((c) => { const cs = getComputedStyle(c); return cs.animationName === "none" || cs.animationIterationCount === "1"; });
  });
  ok(!!focused, `arrows move between expressions (${focused})`);
  ok(focusStill, "keyboard focus is a static treatment — no continuous motion (§27)");
  await page.keyboard.press("Enter");
  await sleep(420);
  ok((await mine(page)) === focused, "Enter commits the focused expression");
  const announced = await page.$eval(`${RAIN} [role=status]`, (e) => e.textContent.trim());
  ok(announced.length > 0, `the commit is announced politely (“${announced}”)`);
  await page.keyboard.press("Enter");
  await sleep(350);
  await page.keyboard.press("Escape");
  await sleep(300);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-expression-deck]") && document.activeElement?.hasAttribute("data-sb-express")), "Escape closes the deck and returns focus to the control");

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  const rm = [];
  for (const id of QUICK) rm.push((await heroOf(page, id)).pose);
  ok(rm.every((t) => t !== "none") && new Set(rm).size === 6, "reduced motion: all six poses survive on the vessel — the emotion is in the static state (§13, §57)");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
  await sleep(260);
  // R3.3: the committed control is the viewer's Boom Lens (§1B/§26)
  const rmDur = await page.$eval(`${RAIN} [data-sb-express] [data-sb-lens]`, (e) => Math.max(...[...e.querySelectorAll("*")].map((c) => parseFloat(getComputedStyle(c).animationDuration) || 0)));
  ok(rmDur <= 0.001, `reduced motion replaces the animation with the immediate static state (${rmDur}s)`);
  ok((await mine(page)) === "care", "and the expression still commits, meaning complete");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 13. Eight languages (§59) ---- */
  console.log("13. Languages");
  for (const lang of ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"]) {
    await open(page, 1440, 1000, { lang });
    await openDeck(page);
    const labels = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("aria-label") ?? ""));
    const caption = await page.$eval("[data-sb-deck-caption]", (e) => e.textContent.trim());
    ok(labels.length === 6 && new Set(labels).size === 6 && labels.every(Boolean), `${lang}: six distinct Quick Six names`);
    ok(caption.length > 0 && (lang === "en" || !/^How did this moment feel/.test(caption)), `${lang}: the deck caption speaks the language`);
  }

  /* ---- 14. Page health ---- */
  console.log("14. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.2 SIGNATURE EXPRESSION: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
