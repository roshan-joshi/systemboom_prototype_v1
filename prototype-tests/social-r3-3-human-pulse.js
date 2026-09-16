/* SYSTEMBOOM — R3.3: HUMAN PULSE.
   How many people expressing feeling around one Moment is represented without repeating the
   mascot into noise: the BOOM LENS (a dedicated optical token, never the whole bomb shrunk
   down), the HUMAN PULSE (≤3 equal lenses + PEOPLE, never reaction analytics), the
   EXPRESSION SPECTRUM (truthful counts in canonical order, no bars, no ranking) and the
   WHO-EXPRESSED human surface with deterministic micro-variants. Scales 1 → 1,000+.
     node prototype-tests/social-r3-3-human-pulse.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const PULSE = `${RAIN} [data-sb-human-pulse]`;

async function open(page, w, h, { theme = "dark", lang = "en", viewer = "maya", pulse = "" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", viewer);
  if (pulse) u.searchParams.set("pulse", pulse);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const readPulse = (page) => page.$eval(PULSE, (e) => ({
  people: Number(e.getAttribute("data-sb-expression-summary")),
  text: e.textContent.replace(/\s+/g, " ").trim(),
  aria: e.getAttribute("aria-label") ?? "",
  h: Math.round(e.getBoundingClientRect().height),
  lenses: [...e.querySelectorAll("[data-sb-lens]")].map((l) => ({
    id: l.getAttribute("data-sb-lens"),
    tier: l.getAttribute("data-sb-lens-tier"),
    w: Math.round(l.getBoundingClientRect().width),
    owned: l.hasAttribute("data-sb-lens-owned"),
  })),
}));
const openSpectrum = async (page) => { await toRain(page); await page.click(PULSE); await sleep(400); };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. The scaling model: 1 → 1,000+ humans, one calm line ---- */
  console.log("1. Scaling 1 → 1,000");
  const heights = [];
  for (const [spec, people, maxLenses] of [["1", 1, 1], ["2", 2, 2], ["5", 5, 3], ["20", 20, 3], ["100same", 100, 1], ["90-10", 100, 2], ["100mixed", 100, 3], ["1000mixed", 1000, 3], ["18mix", 111, 3]]) {
    await open(page, 390, 844, { pulse: spec });
    await toRain(page);
    const r = await readPulse(page);
    heights.push(r.h);
    ok(r.people === people && r.lenses.length <= maxLenses && r.lenses.length >= 1, `${spec}: ${people} humans render as ${r.lenses.length} lens(es), never ${people} mascots`);
    ok(new RegExp(`^[\\d,]+\\s`).test(r.text) && /people|person/.test(r.text), `${spec}: the count speaks PEOPLE, not reactions (“${r.text}”)`);
    ok(!/\b(care|joy|laugh|wow|celebrate|support)\b.*\d/i.test(r.text), `${spec}: no per-expression counts in the feed`);
  }
  ok(new Set(heights).size === 1, `the feed line is the same physical height at every scale (${[...new Set(heights)].join(",")}px)`);

  /* ---- 2. One type = one lens; artwork size independent of count (§8, §33) ---- */
  console.log("2. No popularity scale");
  await open(page, 390, 844, { pulse: "100same" });
  await toRain(page);
  const same = await readPulse(page);
  ok(same.lenses.length === 1 && same.lenses[0].id === "care", "100 people choosing Care is ONE Care lens + 100 people");
  await open(page, 390, 844, { pulse: "1" });
  await toRain(page);
  const one = await readPulse(page);
  ok(one.lenses[0].w === same.lenses[0].w, `the lens is the same size for 1 person and for 100 (${one.lenses[0].w}px = ${same.lenses[0].w}px)`);
  await open(page, 390, 844, { pulse: "100mixed" });
  await toRain(page);
  const mixed = await readPulse(page);
  ok(new Set(mixed.lenses.map((l) => l.w)).size === 1, "representative lenses are all equal size — no winner (§9)");
  ok(mixed.lenses[0].id === "support" && mixed.lenses[0].owned, "the viewer's own expression comes first, marked by the scarce Boom rim — not by size");
  ok(mixed.lenses.map((l) => l.id).join(",") === "support,care,joy", `then the most represented types, informational only (${mixed.lenses.map((l) => l.id).join(",")})`);

  /* ---- 3. The Boom Lens is an optical object, not a shrunken bomb ---- */
  console.log("3. Boom Lens");
  const lens = await page.$eval(`${PULSE} [data-sb-lens]`, (e) => {
    const cs = getComputedStyle(e.querySelector(".sb-lens-surface"));
    const img = e.querySelector("img");
    return {
      src: img.getAttribute("src"),
      family: e.getAttribute("data-sb-lens-family"),
      marks: e.querySelectorAll("[data-sb-lens-mark]").length,
      floating: e.querySelectorAll("[data-sb-mark]").length,
      rim: /inset/.test(cs.boxShadow),
      blur: (cs.backdropFilter ?? "none") === "none" && !/blur/.test(cs.filter ?? "none"),
    };
  });
  ok(/-lens-xs\.webp$/.test(lens.src), `the feed uses the dedicated XS optical crop (${lens.src})`);
  ok(lens.rim, "a physical rim from real shading — material, not a flat badge");
  ok(lens.blur, "no glassmorphism: no backdrop blur, no glow filters (§2, §35)");
  ok(lens.marks <= 1 && lens.floating === 0, "ONE semantic mark, seated in the rim — never a floating sticker (§5)");
  ok(!!lens.family, `colour comes from the family palette, inside the expression object only (${lens.family})`);
  await openSpectrum(page);
  const families = await page.$$eval("[data-sb-expression-spectrum] [data-sb-lens]", (n) => [...new Set(n.map((e) => e.getAttribute("data-sb-lens-family")))]);
  ok(families.length >= 3, `the spectrum draws on the restrained family palette (${families.sort().join(", ")})`);
  const mdTier = await page.$$eval("[data-sb-expression-spectrum] [data-sb-lens]", (n) => [...new Set(n.map((e) => e.getAttribute("data-sb-lens-tier")))]);
  ok(mdTier.join() === "md", "the Spectrum uses the MD lens tier — a dedicated crop, not a scaled XS");

  /* ---- 4. The Expression Spectrum (§16–§17) ---- */
  console.log("4. Expression Spectrum");
  const spec = await page.$eval("[data-sb-expression-spectrum]", (e) => ({
    rows: [...e.querySelectorAll("[data-sb-spectrum-row]")].map((r) => `${r.getAttribute("data-sb-spectrum-row")}:${r.getAttribute("data-sb-spectrum-count")}`),
    widths: [...new Set([...e.querySelectorAll("[data-sb-lens]")].map((l) => Math.round(l.getBoundingClientRect().width)))],
    pct: /%/.test(e.textContent),
    bars: [...e.querySelectorAll("*")].some((el) => { const cs = getComputedStyle(el); return cs.width.endsWith("%") && el.getAttribute("role") === "progressbar"; }),
  }));
  ok(spec.rows.join(" ") === "care:50 joy:25 wow:10 support:15", `every type present, truthful counts, CANONICAL order — wow (10) stays before support (15), never popularity order (${spec.rows.join(" ")})`);
  ok(spec.rows.length === 4 && spec.widths.length === 1, "same-size lens per type; zero-count types are omitted");
  ok(!spec.pct && !spec.bars, "no bars, no percentages, no ranking graphic (§16)");
  const sum = spec.rows.reduce((a, r) => a + Number(r.split(":")[1]), 0);
  ok(sum === 100, `the spectrum accounts for every human, truthfully (${sum}/100)`);

  await open(page, 390, 844, { pulse: "18mix" });
  await openSpectrum(page);
  const many = await page.$$eval("[data-sb-spectrum-row]", (n) => n.map((r) => r.getAttribute("data-sb-spectrum-row")));
  ok(many.length === 18, `all eighteen types can be present at once and the spectrum still holds (${many.length})`);
  const canon = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("[data-sb-spectrum-row]")].map((r) => r.getAttribute("data-sb-spectrum-row"));
    return rows.slice(0, 6).join(",");
  });
  ok(canon === "care,joy,laugh,wow,celebrate,support", `quick six lead in canonical order (${canon})`);
  const specBox = await page.$eval("[data-sb-expression-spectrum]", (e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1; });
  ok(specBox && (await noHScroll(page)), "eighteen types stay on a 390 screen — the spectrum scrolls itself, never the page");

  /* ---- 5. Who expressed — a human surface (§19–§20) ---- */
  console.log("5. Who expressed");
  await open(page, 390, 844, { pulse: "100mixed" });
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(400);
  const who = await page.$eval("[data-sb-expression-who]", (e) => ({
    rows: [...e.querySelectorAll("li")].filter((li) => li.querySelector("[data-sb-ring]")).length,
    ringPx: Math.round(e.querySelector("[data-sb-ring]").getBoundingClientRect().width),
    lenses: e.querySelectorAll("[data-sb-lens]").length,
    variants: [...new Set([...e.querySelectorAll("[data-sb-lens-variant]")].map((l) => l.getAttribute("data-sb-lens-variant")))],
    names: (e.textContent.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) ?? []).length,
    band: /band \d+–\d+|\d+y \d\dm \d\dd/.test(e.textContent),
    more: !!e.querySelector("[data-sb-who-more]"),
  }));
  ok(who.rows === 24 && who.more, `long lists arrive in calm batches — 24 shown of 50, more on request (${who.rows})`);
  ok(who.ringPx >= 36, `identity at human scale, not a dense 24px table (${who.ringPx}px rings)`);
  ok(who.lenses === who.rows, "each person carries their own Boom Lens");
  ok(who.variants.length >= 2, `micro-variants break the cloned-character repetition (${who.variants.join(",")})`);
  ok(!who.band, "IDENTITY-ONLY: no band, no exact age in the dense people list");
  const firstVariant = await page.$eval("[data-sb-expression-who] [data-sb-lens-variant]", (e) => e.getAttribute("data-sb-lens-variant"));
  await page.click("[data-sb-who-more]");
  await sleep(300);
  const grown = await page.$eval("[data-sb-expression-who]", (e) => [...e.querySelectorAll("li")].filter((li) => li.querySelector("[data-sb-ring]")).length);
  ok(grown === 50, `Show more reveals the rest, truthfully (${grown}/50)`);
  // §22 — determinism: close everything (the pulse toggles shut; Show more just consumed
  // its own focus, so Escape has no anchor here), reopen, same person → same variant.
  await page.click(PULSE); await sleep(300);
  await openSpectrum(page);
  await page.click("[data-sb-spectrum-row='care']");
  await sleep(400);
  const again = await page.$eval("[data-sb-expression-who] [data-sb-lens-variant]", (e) => e.getAttribute("data-sb-lens-variant"));
  ok(again === firstVariant, `variants are deterministic — the same person never changes between opens (${again})`);
  await page.keyboard.press("Escape"); await sleep(200);
  await page.keyboard.press("Escape"); await sleep(200);

  /* ---- 6. Commit / change / remove update the pulse quietly (§26–§30) ---- */
  console.log("6. Quiet updates");
  await open(page, 1440, 1000);
  await toRain(page);
  ok((await readPulse(page)).people === 2, "baseline: two people");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(350);
  await page.click(`${RAIN} [data-sb-expression-option='celebrate']`); await sleep(150);
  const during = await page.evaluate(() => {
    const pulse = document.querySelector("[data-sb-moment='m-rain'] [data-sb-human-pulse]");
    let running = 0;
    pulse.querySelectorAll("*").forEach((e) => (e.getAnimations ? e.getAnimations() : []).forEach((a) => { if (a.playState === "running" && !(a instanceof CSSTransition)) running += 1; }));
    return running;
  });
  await sleep(700);
  const after = await readPulse(page);
  ok(after.people === 3 && after.lenses[0].id === "celebrate" && after.lenses[0].owned, `commit: 2 → 3 people, the viewer's lens arrives first (${after.text})`);
  ok(during === 0, "no aggregate token animates on a commit — only the control's own one-shot (§26)");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(350);
  await page.click("[data-sb-expression-remove]"); await sleep(400);
  ok((await readPulse(page)).people === 2, "remove: the total decreases truthfully, no reverse explosion (§30)");

  /* ---- 7. The feed stays completely still (§14, §25) ---- */
  console.log("7. Stillness");
  await open(page, 1440, 1400, { pulse: "1000mixed" });
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
  await toRain(page);
  await sleep(600);
  const still = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  ok(still === 0, `1,000 humans on screen and nothing moves without interaction (${still} running)`);

  /* ---- 8. Devices ---- */
  console.log("8. Devices");
  for (const [w, h] of [[320, 640], [360, 800], [390, 844], [768, 1024], [1440, 1000]]) {
    await open(page, w, h, { pulse: "1000mixed" });
    await toRain(page);
    const r = await readPulse(page);
    const inFrame = await page.$eval(PULSE, (e) => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 1; });
    ok(inFrame && r.h <= 40 && (await noHScroll(page)), `${w}: Human Pulse stays one compact row (${r.h}px), no overflow`);
    ok(/^1,000\s/.test(r.text) && r.lenses.length <= 3, `${w}: the same human-presence model — no extra metrics because there is room (§37)`);
    // found at 320 by the evidence pass: the open panels must be frame-clamped like the deck
    await openSpectrum(page);
    const sb = await page.$eval("[data-sb-expression-spectrum]", (e) => { const b = e.getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1 && b.top >= 0; });
    ok(sb && (await noHScroll(page)), `${w}: the open Spectrum stays inside the frame too`);
    await page.click("[data-sb-spectrum-row]"); await sleep(380);
    const wb = await page.$eval("[data-sb-expression-who-panel]", (e) => { const b = e.getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1; });
    ok(wb, `${w}: and so does Who Expressed`);
    await page.click(PULSE); await sleep(250);
  }

  /* ---- 9. Performance: the feed never decodes the big mascot tiers (§41–§42) ---- */
  console.log("9. Asset discipline");
  await open(page, 1440, 1400, { pulse: "1000mixed" });
  for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  await sleep(600);
  // §41–§42 — what the FEED RENDERS must be the small optical tiers. The one exception on
  // the wire is R3.2 §54's deliberate idle warm of the Quick-Six MD (7KB, once, after Social
  // settles) so the deck opens instantly — that is a prefetch, not feed rendering, and it is
  // asserted as exactly that. LG never loads at all.
  const rendered = await page.$$eval("[data-sb-moment] img[src*='brand/expressions']", (n) => [...new Set(n.map((i) => i.getAttribute("src").split("/").pop()))]);
  ok(rendered.every((a) => /-lens-(xs|sm)\.webp$|neutral-sm\.webp$/.test(a)), `a long feed RENDERS only the small optical tiers (${rendered.join(", ")})`);
  const wire = await page.evaluate(() => [...new Set(performance.getEntriesByType("resource").filter((e) => /brand\/expressions/.test(e.name)).map((e) => e.name.split("/").pop()))]);
  const mdOnWire = wire.filter((a) => /-md\.webp$/.test(a) && !/-lens-md\.webp$/.test(a));
  // R3.5: the idle warm covers the quick six's own Emotion-Core deck art (six small files)
  ok(!wire.some((a) => /-lg\.webp$/.test(a)) && mdOnWire.every((a) => /^(care|joy|laugh|wow|celebrate|support|neutral)-md\.webp$/.test(a)), `no LG ever, and the only MD on the wire is the documented idle warm of the deck art (${wire.join(", ")})`);

  /* ---- 10. Accessibility (§38–§39) ---- */
  console.log("10. Accessibility");
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await toRain(page);
  const aria = await page.$eval(PULSE, (e) => e.getAttribute("aria-label"));
  ok(/100 people expressed feelings on this Moment/.test(aria), `the pulse label communicates presence (${aria.slice(0, 60)}…)`);
  ok(/Care/.test(aria) && /Support/.test(aria), "…and names the represented feelings");
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-human-pulse]").focus());
  await page.keyboard.press("Enter");
  await sleep(400);
  ok(await page.evaluate(() => !!document.querySelector("[data-sb-expression-spectrum]") && document.activeElement?.hasAttribute("data-sb-spectrum-row")), "keyboard opens the Spectrum onto its first feeling");
  const rowAria = await page.$eval("[data-sb-spectrum-row='care']", (e) => e.getAttribute("aria-label"));
  ok(/Care/.test(rowAria) && /50 people/.test(rowAria), `each feeling reads name + people (${rowAria})`);
  await page.keyboard.press("Enter");
  await sleep(400);
  ok(!!(await page.$("[data-sb-expression-who]")), "Enter opens the people behind the feeling");
  await page.keyboard.press("Escape");
  await sleep(300);
  ok(!!(await page.$("[data-sb-expression-spectrum]")), "Escape steps back to the Spectrum");
  await page.keyboard.press("Escape");
  await sleep(300);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-expression-spectrum]") && document.activeElement?.hasAttribute("data-sb-human-pulse")), "Escape closes and returns focus to the pulse");

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await openSpectrum(page);
  const rmDur = await page.$eval("[data-sb-expression-spectrum]", (e) => parseFloat(getComputedStyle(e).animationDuration) || 0);
  ok(rmDur <= 0.001 && !!(await page.$("[data-sb-spectrum-row]")), `reduced motion: the Spectrum appears directly (${rmDur}s)`);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 11. Languages ---- */
  console.log("11. Languages");
  for (const [lang, probe] of [["en", /people/], ["es", /personas/], ["it", /persone/], ["nl", /mensen/], ["ru", /человек/], ["hi", /लोग/], ["ne", /जना/], ["zh-Hans", /人/]]) {
    await open(page, 1440, 1000, { lang, pulse: "100mixed" });
    await toRain(page);
    const text = await page.$eval(PULSE, (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(probe.test(text) && (lang === "en" || !/people/.test(text)), `${lang}: the pulse speaks the language (“${text}”)`);
  }

  /* ---- 12. Untouched systems ---- */
  console.log("12. Untouched systems");
  await open(page, 1440, 1000);
  for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  for (const id of ["m-health", "m-problem"]) {
    ok(!(await page.$(`[data-sb-moment='${id}'] [data-sb-human-pulse]`)) && !(await page.$(`[data-sb-moment='${id}'] [data-sb-express]`)), `${id}: records never carry a pulse or an expression control`);
  }
  await open(page, 1440, 1000, { pulse: "1000mixed" });
  await toRain(page);
  const ringBefore = await page.$eval(`${RAIN} [data-sb-ring]`, (e) => e.outerHTML);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(350);
  await page.click(`${RAIN} [data-sb-expression-option='care']`); await sleep(500);
  ok(ringBefore === (await page.$eval(`${RAIN} [data-sb-ring]`, (e) => e.outerHTML)), "1,000 expressions and a commit change NOTHING about the Life Ring");

  /* ---- 13. Page health ---- */
  console.log("13. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.3 HUMAN PULSE: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
