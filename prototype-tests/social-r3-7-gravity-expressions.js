/* SYSTEMBOOM — R3.7: GRAVITY EXPRESSIONS.
   Emotion Chamber (a bore, not a badge; a real core layer with preview parallax), the
   Gravity Dock (six characters on ONE ground, no tiles; a shallow arc on desktop; a staggered
   ≤180ms reveal), the five-state motion contract (REVEAL · PREVIEW · COMMIT · SETTLE ·
   RETOUCH) with a distinct preview wake per expression, CORE → BOOM LENS continuity (one
   flight), a chamber-led selected state, the family-banded Expression Field, both themes,
   360, reduced motion and zero passive motion. Structural proof; the beauty call is the
   owner's, on the evidence boards.
     node prototype-tests/social-r3-7-gravity-expressions.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];

async function open(page, w, h, { theme = "dark" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.goto(`${HOST}${S}?theme=${theme}&harness=0&viewer=maya`, { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page, settle = 400) => { await toRain(page); if (await page.$("[data-sb-expression-deck]")) return; const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(settle); };
const running = (page, sel = "body") => page.evaluate((s) => {
  const root = document.querySelector(s);
  let n = 0;
  root.querySelectorAll("*").forEach((e) => (e.getAnimations ? e.getAnimations() : []).forEach((a) => { if (a.playState === "running" && a.animationName !== "sb-roll") n += 1; }));
  return n;
}, sel);
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. GRAVITY DOCK — six characters on one ground, not six tiles ---- */
  console.log("1. Gravity Dock");
  await open(page, 1440, 1000);
  await toRain(page);
  await page.mouse.click(...Object.values(await centre(page, `${RAIN} [data-sb-express]`)));
  await sleep(30);
  const reveal = await page.evaluate(() => {
    const bodies = [...document.querySelectorAll("[data-sb-expression-deck] .sb-core-body")];
    const cs = bodies.map((b) => getComputedStyle(b));
    return { n: bodies.length, name: cs.every((c) => /sb-rise-in/.test(c.animationName)), dur: cs.map((c) => parseFloat(c.animationDuration)), delays: cs.map((c) => parseFloat(c.animationDelay)) };
  });
  ok(reveal.n === 6 && reveal.name, "REVEAL: the six rise into position (sb-rise-in on every character)");
  ok(reveal.dur.every((d) => d <= 0.18) && new Set(reveal.delays).size === 6 && Math.max(...reveal.delays) + Math.max(...reveal.dur) <= 0.18, `…staggered, and the whole reveal is inside 120–180ms (max ${Math.round((Math.max(...reveal.delays) + Math.max(...reveal.dur)) * 1000)}ms)`);
  await sleep(400);
  const dock = await page.evaluate(() => {
    const d = document.querySelector("[data-sb-expression-deck]");
    const seats = [...d.querySelectorAll("[data-sb-expression-option]")];
    const cs = seats.map((s) => getComputedStyle(s));
    const rects = seats.map((s) => s.getBoundingClientRect());
    // Owner-superseded (R3.8): the dock became the EMOTION HORIZON — six cores under one vessel
    const art = seats[2].querySelector("[data-sb-core]");
    return {
      gravity: d.hasAttribute("data-sb-emotion-horizon"),
      noCards: cs.every((c) => c.backgroundImage === "none" && /rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) && c.boxShadow === "none"),
      ground: /gradient/.test(getComputedStyle(d).backgroundImage),
      arc: seats.map((s) => parseFloat(getComputedStyle(s).translate.split(" ")[1] ?? "0")),
      oneRow: rects.every((r, i) => i === 0 || r.left > rects[i - 1].left) && Math.max(...rects.map((r) => r.top)) - Math.min(...rects.map((r) => r.top)) <= 14,
      shadow: /radial-gradient/.test(getComputedStyle(art, "::after").backgroundImage),
      hit: Math.min(...rects.map((r) => Math.min(r.width, r.height))),
    };
  });
  ok(dock.gravity && dock.noCards, "no seat has a background, border-well or shadow — six invisible hit targets on ONE shared ground");
  ok(dock.ground, "the ground itself is the material (one directional-light gradient)");
  ok(new Set(dock.arc).size >= 3 && dock.arc[0] === dock.arc[5] && dock.arc[1] === dock.arc[4] && dock.arc[0] < dock.arc[2], `desktop: a shallow symmetric horizon around the vessel (offsets ${dock.arc.join("/")}px)`);
  ok(dock.oneRow, "…still one horizontal row (no wrapping), the arc within a 14px band");
  ok(dock.shadow && dock.hit >= 44, `every character is grounded by a contact shadow; hit areas ≥44px (${dock.hit}px)`);

  /* ---- 2. EMOTION CHAMBER — a second layer, not a badge ---- */
  console.log("2. Emotion Chamber");
  // Owner-superseded (R3.8): the chamber layer lives on the ONE vessel — attend a core to see it
  await page.mouse.move(...Object.values(await centre(page, "[data-sb-expression-option='care']")), { steps: 2 });
  await sleep(160);
  const chamber = await page.evaluate(async () => {
    const seats = [...document.querySelectorAll("[data-sb-expression-deck] [data-sb-expression-option]")];
    const layer = document.querySelector("[data-sb-horizon-stage] [data-sb-core-layer]");
    const layers = layer ? [layer, layer, layer, layer, layer, layer] : [];
    const clip = !!layer && /ellipse/.test(getComputedStyle(layer).clipPath);
    const srcs = seats.map((s) => s.querySelector("img").getAttribute("src"));
    const hashes = [];
    for (const src of srcs) {
      const buf = new Uint8Array(await (await fetch(src)).arrayBuffer());
      let h = 0; for (let i = 0; i < buf.length; i += 7) h = (h * 31 + buf[i]) >>> 0;
      hashes.push(`${buf.length}:${h}`);
    }
    const lens = await Promise.all(["care", "joy", "laugh", "wow", "celebrate", "support"].map(async (id) => (await fetch(`/brand/expressions/${id}-lens-xs.webp`)).ok));
    return { clip, layers: layers.filter(Boolean).length, distinct: new Set(hashes).size, lens: lens.every(Boolean) };
  });
  ok(chamber.layers === 6 && chamber.clip, "the vessel carries a CORE LAYER clipped to the chamber opening — the chamber is real depth in the component, not paint");
  ok(chamber.distinct === 6 && chamber.lens, "six distinct core objects on disk, with the core-led Boom-Lens tiers for each");
  await page.mouse.move(4, 4);
  await sleep(200);

  /* ---- 3. PREVIEW — small, distinct per expression, never the expression ---- */
  console.log("3. Preview");
  const wakes = [];
  let parallaxOk = true, riseOk = true, noExprOk = true, captionOk = true;
  for (const id of QUICK) {
    await page.mouse.move(4, 4);
    await sleep(160);
    const c = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.move(c.x, c.y, { steps: 2 });
    await sleep(25);
    const w = await page.evaluate((i) => {
      // Owner-superseded (R3.8): the wake plays inside the ONE vessel's chamber
      const seat = document.querySelector("[data-sb-horizon-stage]");
      const wake = seat.querySelector("[data-sb-core-wake]");
      const cs = wake ? getComputedStyle(wake) : null;
      let expr = 0;
      seat.querySelectorAll("*").forEach((e) => (e.getAnimations ? e.getAnimations() : []).forEach((a) => { const n = a.animationName ?? ""; if (a.playState === "running" && /sb-g-|sb-mass|sb-boom-pulse|sb-expr-in|sb-core-in|sb-fuse|sb-lock/.test(n)) expr += 1; }));
      return { name: cs?.animationName ?? "", dur: cs ? parseFloat(cs.animationDuration) : 0, expr, caption: document.querySelector("[data-sb-deck-caption]").textContent.trim() };
    }, id);
    wakes.push(w.name);
    if (w.expr > 0) noExprOk = false;
    if (!w.caption || /How did/.test(w.caption)) captionOk = false;
    if (!(w.dur >= 0.08 && w.dur <= 0.14)) parallaxOk = false;
    await sleep(220);
    const st = await page.evaluate((i) => {
      const seat = document.querySelector(`[data-sb-expression-option='${i}']`);
      const body = seat.querySelector(".sb-core-body");
      const layer = document.querySelector("[data-sb-horizon-stage] [data-sb-core-layer]");
      return { rise: -parseFloat(getComputedStyle(body).translate.split(" ")[1] ?? "0"), lag: layer ? getComputedStyle(layer).translate : "none" };
    }, id);
    if (!(st.rise >= 3 && st.rise <= 6)) riseOk = false;
    if (!/px/.test(st.lag) || st.lag === "0px") parallaxOk = false;
  }
  ok(wakes.every((n, i) => n === `sb-cw-${QUICK[i]}`) && new Set(wakes).size === 6, `six DIFFERENT chamber wakes, one per expression (${wakes.join(", ")})`);
  ok(parallaxOk, "the wake lasts 80–140ms and the core lags the shell by ~1–2px (chamber depth) while previewed");
  ok(riseOk && captionOk, "preview: the core rises 3–6px and the semantic label appears");
  ok(noExprOk, "a preview NEVER plays the expression — no gesture, mass, pulse or ignition");
  await page.mouse.move(4, 4);
  await sleep(300);

  /* ---- 4. COMMIT → SETTLE, and CORE → BOOM LENS as one object ---- */
  console.log("4. Commit");
  const gestures = [];
  let flightOk = true, seqOk = true, stillOk = true;
  for (const id of QUICK) {
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
    // Owner-superseded (R3.8 §9): the flight is now the CORE entering the vessel's chamber; the
    // vessel performs on stage (~+200ms); the chamber then collapses into the lens.
    await sleep(40);
    const c0 = await page.evaluate((i) => { const f = document.querySelector("[data-sb-core-flight]"); const fcs = f ? getComputedStyle(f) : null; return f?.getAttribute("data-sb-core-flight") === i && /sb-core-flight/.test(fcs?.animationName ?? "") && parseFloat(fcs.animationDuration) <= 0.3; }, id);
    if (!c0) flightOk = false;
    await sleep(160);
    const c = await page.evaluate(() => {
      const names = [];
      document.querySelector("[data-sb-horizon-stage]").querySelectorAll("*").forEach((n) => { const cs = getComputedStyle(n); if (cs.animationName !== "none") names.push(cs.animationName); });
      const d = document.querySelector("[data-sb-expression-deck]");
      return { names: names.join(" "), deck: !d.hasAttribute("data-sb-committing") };
    });
    gestures.push(c.names.match(/sb-g-\w+/)?.[0] ?? "");
    if (!(new RegExp(`sb-g-${id}`).test(c.names) && /sb-core-in/.test(c.names) && /sb-boom-pulse/.test(c.names) && /sb-mass/.test(c.names)) || c.deck) seqOk = false;
    await sleep(1100);
    // (the sidebar LifeCounter's per-second digit roll, `sb-roll`, is the accepted Life
    // instrument and outside R3.7 — it is the one thing allowed to be running here)
    const after = await page.evaluate(() => ({ flight: !!document.querySelector("[data-sb-core-flight],[data-sb-lens-flight]"), running: [...document.querySelectorAll("[data-sb-social-frame] *")].flatMap((e) => (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").map((a) => `${e.tagName}.${e.className}:${a.animationName ?? a.transitionProperty ?? "?"}`) : [])) }));
    if (after.flight || after.running.length !== 0) { stillOk = false; console.log("    still running after", id, JSON.stringify(after)); }
  }
  ok(flightOk, "COMMIT: the chosen core leaves the horizon as ONE flight (≤300ms) into the vessel's chamber");
  ok(seqOk, "…then the vessel plays its own gesture + core ignition + physical response + Boom Pulse while the horizon is committing");
  ok(new Set(gestures).size === 6, `six unique body gestures (${gestures.join(", ")})`);
  ok(stillOk, "SETTLE: a second later the flight is gone and nothing in Social is running");

  /* ---- 5. RETOUCH — a small answer, never the commit again ---- */
  console.log("5. Retouch");
  await toRain(page);
  await page.mouse.click(...Object.values(await centre(page, `${RAIN} [data-sb-express]`)));
  await sleep(40);
  const rt = await page.evaluate(() => {
    const e = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]");
    const lens = e.querySelector("[data-sb-lens]");
    const cs = getComputedStyle(lens);
    const names = [];
    e.querySelectorAll("*").forEach((n) => (n.getAnimations ? n.getAnimations() : []).forEach((a) => { if (a.playState === "running") names.push(a.animationName ?? ""); }));
    return { attr: e.hasAttribute("data-sb-retouch"), name: cs.animationName, dur: parseFloat(cs.animationDuration), full: /sb-g-|sb-boom-pulse|sb-mass|sb-expr-in/.test(names.join(" ")) };
  });
  ok(rt.attr && /sb-retouch/.test(rt.name) && rt.dur >= 0.12 && rt.dur <= 0.2, `tapping the committed control answers with a ${Math.round(rt.dur * 1000)}ms core + rim response`);
  ok(!rt.full, "…and never replays the full commit");
  await sleep(320);
  ok(await page.$eval(`${RAIN} [data-sb-express]`, (e) => !e.hasAttribute("data-sb-retouch")), "the response is over and the attribute is gone");
  await page.keyboard.press("Escape");
  await sleep(200);

  /* ---- 6. SELECTED READABILITY — chamber-led lens, real size ---- */
  console.log("6. Selected state");
  const sel = await page.evaluate(async () => {
    const e = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]");
    const lens = e.querySelector("[data-sb-lens]");
    const hashes = [];
    for (const id of ["care", "joy", "laugh", "wow", "celebrate", "support"]) {
      const buf = new Uint8Array(await (await fetch(`/brand/expressions/${id}-core.webp`)).arrayBuffer());
      let h = 0; for (let i = 0; i < buf.length; i += 5) h = (h * 31 + buf[i]) >>> 0;
      hashes.push(`${buf.length}:${h}`);
    }
    return { lens: Math.round(lens.getBoundingClientRect().width), ctrl: Math.round(e.getBoundingClientRect().width), src: lens.querySelector("img").getAttribute("src"), distinct: new Set(hashes).size, ring: getComputedStyle(e).boxShadow !== "none" };
  });
  ok(sel.lens >= 36 && sel.ctrl >= 40, `the selected lens is a real object beside Respond (${sel.lens}px in a ${sel.ctrl}px control)`);
  // Owner-superseded (R3.9.1 Emotion Signet): the resting lens is the CORE OBJECT the person
  // touched, seated in the aperture ring — object permanence over optical crops. The invariant
  // (the compact state carries each expression's own distinct emotion) is unchanged.
  ok(/-core\.webp$/.test(sel.src) && sel.distinct === 6 && sel.ring, "it is the Emotion Signet — the touched core object in the aperture — six distinct — with the expression's ring");

  /* ---- 7. EXPRESSION FIELD — families as spatial bands, no cards ---- */
  console.log("7. Expression Field");
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(500);
  const field = await page.evaluate(() => {
    const p = document.querySelector("[data-sb-expression-field]");
    const bands = [...p.querySelectorAll("[data-sb-field-band]")];
    const cells = [...p.querySelectorAll("[data-sb-expression-option]")];
    const frame = document.querySelector("[data-sb-social-frame]").getBoundingClientRect();
    const r = p.getBoundingClientRect();
    return {
      bands: bands.map((b) => b.getAttribute("data-sb-field-band")),
      noCards: cells.every((c) => { const cs = getComputedStyle(c); return cs.backgroundImage === "none" && cs.boxShadow === "none"; }),
      named: cells.every((c) => [...c.querySelectorAll(":scope > span")].some((x) => (x.textContent ?? "").trim().length > 0)),
      n: cells.length,
      first: cells[0].getAttribute("data-sb-expression-option"),
      inFrame: r.left >= frame.left - 1 && r.right <= frame.right + 1 && r.top >= 0,
      separated: bands.filter((b) => getComputedStyle(b).borderTopWidth !== "0px").length,
    };
  });
  ok(field.bands.join() === "warmth,energy,wonder,connection", `four family bands in order (${field.bands.join(" · ")})`);
  ok(field.noCards && field.named && field.n === 18, "eighteen free-standing characters, each NAMED beneath, no card around any");
  ok(field.separated === 3 && field.first === "care", "bands separated by air + a hairline, never tabs; Care leads");
  ok(field.inFrame, "the field stays inside the frame at desktop (the old centred panel was clipped by the sheet — fixed)");
  await page.keyboard.press("Escape");
  await sleep(150);
  await page.keyboard.press("Escape");
  await sleep(200);

  /* ---- 8. PASSIVE MOTION — none ---- */
  console.log("8. Passive motion");
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(700);
  const passive = await running(page, "[data-sb-social-frame]");
  ok(passive === 0, `the feed at rest runs zero expression animations (${passive}; the LifeCounter's accepted seconds tick is the only exception, excluded by name)`);

  /* ---- 9. Light / dark ---- */
  console.log("9. Themes");
  const bg = {};
  for (const theme of ["dark", "light"]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    bg[theme] = await page.$eval("[data-sb-expression-deck]", (e) => getComputedStyle(e).backgroundImage);
  }
  ok(bg.light !== bg.dark && /gradient/.test(bg.light) && /gradient/.test(bg.dark), "Solar Observatory and Deep Cosmos grounds are two designed materials, both lit from one side");

  /* ---- 10. 360 ---- */
  console.log("10. 360");
  for (const theme of ["light", "dark"]) {
    await open(page, 360, 800, { theme });
    await openDeck(page);
    const m = await page.evaluate(() => {
      const d = document.querySelector("[data-sb-expression-deck]").getBoundingClientRect();
      const seats = [...document.querySelectorAll("[data-sb-expression-option]")];
      const resting = seats.find((x) => x !== document.activeElement && !x.hasAttribute("data-sb-previewing"));
      return { inFrame: d.left >= -1 && d.right <= innerWidth + 1 && d.top >= 0 && d.bottom <= innerHeight + 1, hit: Math.min(...seats.map((s) => s.getBoundingClientRect().width)), art: Math.round(resting.querySelector("[data-sb-core]").getBoundingClientRect().width), h: Math.round(d.height), n: seats.length, noCards: seats.every((s) => getComputedStyle(s).backgroundImage === "none") };
    });
    ok(m.inFrame && m.n === 6 && m.hit >= 44 && m.art === 36 && m.noCards, `${theme} 360: six cores at 36px on one ground under one vessel, ≥44px hits, fully on screen`);
    ok(m.h <= 300, `${theme} 360: the dock is compact — ${m.h}px, not the whole Moment`);
  }

  /* ---- 11. Reduced motion ---- */
  console.log("11. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await toRain(page);
  await page.mouse.click(...Object.values(await centre(page, `${RAIN} [data-sb-express]`)));
  await sleep(40);
  const rm1 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-expression-deck] .sb-core-body")].every((b) => parseFloat(getComputedStyle(b).animationDuration) <= 0.001 && getComputedStyle(b).opacity === "1"));
  ok(rm1, "reduce: the dock is simply there — no reveal, every character visible at once");
  const c = await centre(page, "[data-sb-expression-option='joy']");
  await page.mouse.move(c.x, c.y, { steps: 2 });
  await sleep(200);
  const rm2 = await page.$eval("[data-sb-horizon-stage] [data-sb-core-layer]", (l) => getComputedStyle(l).translate);
  ok(rm2 === "none" || rm2 === "0px", `reduce: no micro-parallax at all (${rm2})`);
  await page.mouse.click(c.x, c.y);
  await sleep(40);
  const rm3 = await page.evaluate(() => ({ flight: !!document.querySelector("[data-sb-core-flight],[data-sb-lens-flight]"), lens: getComputedStyle(document.querySelector("[data-sb-moment='m-rain'] [data-sb-express] [data-sb-lens]")).opacity }));
  ok(!rm3.flight && rm3.lens === "1", "reduce: no flight is made — the lens is the final state immediately");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 12. Page health ---- */
  console.log("12. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.7 GRAVITY EXPRESSIONS: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
