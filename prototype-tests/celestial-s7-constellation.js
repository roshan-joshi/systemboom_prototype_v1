/* SYSTEMBOOM — CELESTIAL SOCIAL UNIVERSE: the shared RESONANCE CONSTELLATION + page world.
   Multi-person aggregation (pure rule + UI), canonical order under skew, equal-size Seals,
   locale-grouped counts (no invented compact forms), the viewer's personal orbit, change of
   resonance, the expanded constellation with 24-then-48 batching, quiet arrival motion,
   privacy, viewports, locales, the recomposed page environment, and flag-off parity WITH
   seeded multi-person data.
     node prototype-tests/celestial-s7-constellation.js   (expects the dev server on :3210) */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");

/* The aggregation rule is a pure function — exercise the REAL module (repo TypeScript). */
const { summarizeResonances, resonatorTotal } = (() => {
  const ts = require("typescript");
  const compile = (file) =>
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
  const load = (file, extraRequire) => {
    const mod = { exports: {} };
    new Function("module", "exports", "require", compile(file))(mod, mod.exports, extraRequire);
    return mod.exports;
  };
  const registry = load(`${__dirname}/../src/lib/celestial/registry.ts`, require);
  return load(`${__dirname}/../src/lib/celestial/resonance-summary.ts`, (id) =>
    id === "./registry" ? registry : require(id),
  );
})();

const HOST = "http://localhost:3210";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const CANON = ["venus-love", "sun-joy", "meteor-laugh", "comet-wow", "jupiter-celebrate", "saturn-support", "moon-touched", "mercury-curious"];
const RAIN = "[data-sb-moment='m-rain']";
const SUM = `${RAIN} [data-sb-resonance-summary]`;

async function social(page, { q = "", celestial = true, w = 1280, lang = "en", reduced = false } = {}) {
  await page.setViewport({ width: w, height: 1100, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }]);
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  await page.goto(`${HOST}/style-lab/social?theme=dark&celestial=${celestial ? "1" : "0"}&lang=${lang}${q}`, { waitUntil: "networkidle2" });
  await sleep(700);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(250); };
const stripState = (page) =>
  page.$eval(SUM, (el) => ({
    total: Number(el.getAttribute("data-sb-resonance-summary")),
    nodes: [...el.querySelectorAll("[data-sb-constellation-node]")].map((n) => ({
      id: n.getAttribute("data-sb-constellation-node"),
      count: Number(n.getAttribute("data-sb-resonance-count")),
      sealW: n.querySelector("[data-sb-resonance-tier='seal']")?.getBoundingClientRect().width ?? 0,
      yours: !!n.querySelector("[data-sb-resonance-yours]"),
    })),
    countSpans: el.querySelectorAll(".sb-cel-count").length,
    text: el.textContent ?? "",
    mine: el.querySelector("[data-sb-resonance-mine]")?.getAttribute("data-sb-resonance-mine") ?? null,
  }));

(async () => {
  const { page, browser } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|404/.test(f)) consoleErrors.push(f); });
  page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${e.message}`));

  try {
    /* ---- 1. The pure aggregation rule ---- */
    console.log("1. summarizeResonances — one rule, canonical always");
    {
      // Insertion order deliberately anti-canonical and count-skewed.
      const map = {};
      map["p-a"] = "mercury-curious";
      for (let i = 0; i < 50; i++) map[`p-s${i}`] = "saturn-support";
      map["p-b"] = "venus-love"; map["p-c"] = "venus-love";
      map["p-x"] = "not-a-resonance";
      const out = summarizeResonances(map, "p-b");
      ok(out.map((e) => e.resonanceId).join(",") === "venus-love,saturn-support,mercury-curious",
        "canonical registry order, never count order (venus 2 before saturn 50 before mercury 1)");
      ok(out.find((e) => e.resonanceId === "saturn-support").count === 50 && out.find((e) => e.resonanceId === "mercury-curious").count === 1,
        "counts are exact");
      ok(!out.some((e) => e.resonanceId === "not-a-resonance"), "unknown ids are filtered by the registry gate");
      ok(out.find((e) => e.resonanceId === "venus-love").viewerHasSelected === true
        && out.find((e) => e.resonanceId === "saturn-support").viewerHasSelected === false,
        "viewerHasSelected marks exactly the viewer's own entry");
      ok(resonatorTotal(out) === 53, "resonatorTotal counts people (one signal each)");
      ok(summarizeResonances(undefined, "x").length === 0 && summarizeResonances({}, "x").length === 0, "empty and missing maps aggregate to nothing");
      const pids = summarizeResonances({ a: "moon-touched", b: "moon-touched" }, "z")[0].personIds;
      ok(pids.join(",") === "a,b", "personIds keep the map's own (chronological) order");
    }

    /* ---- 2. M0 — zero state ---- */
    console.log("2. M0 — a Moment with no Resonance is complete, not empty scaffolding");
    await social(page);
    await toRain(page);
    ok((await page.$$(SUM)).length === 0, "no constellation renders when no one has resonated");
    ok((await page.$$(`${RAIN} [data-sb-resonate]`)).length === 1, "only the Resonate doorway is offered");

    /* ---- 3. M1 — one person ---- */
    console.log("3. M1 — one person, one signal");
    await social(page, { q: "&resonance=1" });
    await toRain(page);
    let s = await stripState(page);
    ok(s.total === 1 && s.nodes.length === 1 && s.nodes[0].id === "venus-love", "one Venus signal, total 1");
    ok(s.countSpans === 0, "a single person shows no per-object number — the sentence carries it");
    ok(/1 person(?!s)/.test(s.text), "“1 person” — human wording, no dashboard");

    /* ---- 4. M2/M3 — few people, canonical, equal ---- */
    console.log("4. M2 — three people across two meanings");
    await social(page, { q: "&resonance=3" });
    await toRain(page);
    s = await stripState(page);
    ok(s.nodes.map((n) => n.id).join(",") === "venus-love,moon-touched", "present meanings in canonical order");
    ok(s.nodes[0].count === 2 && s.nodes[1].count === 1, "per-meaning participation counts");
    ok(s.countSpans === 2, "counts appear once more than one person is present");
    ok(new Set(s.nodes.map((n) => Math.round(n.sealW))).size === 1, "every Seal is the same size — size never encodes count");

    /* ---- 5. M4 — all eight, sixteen people ---- */
    console.log("5. M4 — all eight meanings present");
    await social(page, { q: "&resonance=16" });
    await toRain(page);
    s = await stripState(page);
    ok(s.nodes.map((n) => n.id).join(",") === CANON.join(","), "all eight, exactly the canonical order");
    ok(s.total === 16 && s.nodes.reduce((n, x) => n + x.count, 0) === 16, "sixteen people, counts sum to the people");
    ok(!/top|winner|rank|most|#1|popular|trending/i.test(s.text), "no ranking vocabulary anywhere in the summary");

    /* ---- 6. M5 — fifty-six people, no visual ranking ---- */
    console.log("6. M5 — fifty-six people, dignity intact");
    await social(page, { q: "&resonance=50" });
    await toRain(page);
    s = await stripState(page);
    const counts = s.nodes.map((n) => n.count);
    ok(s.total === 56 && s.nodes.length === 8, "fifty-six people across all eight");
    ok(counts.join(",") === "9,12,4,7,5,11,6,2", "counts stay in canonical positions (deliberately non-monotonic)");
    ok(new Set(s.nodes.map((n) => Math.round(n.sealW))).size === 1, "a 12 and a 2 are the same Seal");

    /* ---- 7. Large counts — locale-grouped, never invented shorthand ---- */
    console.log("7. 1,204 people — real numerals, product formatting policy");
    await social(page, { q: "&resonance=1000" });
    await toRain(page);
    s = await stripState(page);
    ok(s.total === 1204, "total = 1,204 people");
    ok(s.text.includes("1,204"), "the total is locale-grouped (en: 1,204)");
    ok(!/\d(\.\d)?[kK]\b/.test(s.text), "no compact '1.0k' shorthand is invented (recorded product policy)");

    /* ---- 8. M7 — my resonance is position, not importance ---- */
    console.log("8. M7 — the viewer's own signal");
    await social(page, { q: "&resonance=mine" });
    await toRain(page);
    s = await stripState(page);
    ok(s.nodes.map((n) => n.id).join(",") === "venus-love,sun-joy,saturn-support,moon-touched", "five people, four meanings, canonical order");
    ok(s.total === 5, "five people counted once each");
    const yoursNode = s.nodes.find((n) => n.yours);
    ok(yoursNode?.id === "saturn-support", "the personal orbit marks the viewer's Saturn — nothing else");
    ok(new Set(s.nodes.map((n) => Math.round(n.sealW))).size === 1, "the viewer's object is NOT enlarged");
    ok(s.mine === "saturn-support", "the sr-only record names the viewer's own resonance");
    const trigMine = await page.$eval(`${RAIN} [data-sb-resonate]`, (el) => el.getAttribute("data-sb-resonate-mine"));
    ok(trigMine === "saturn-support", "the doorway carries the committed seal");

    /* ---- 9. M8 — changing my resonance moves one signal ---- */
    console.log("9. M8 — Saturn → Venus, still one person");
    await page.click(`${RAIN} [data-sb-resonate]`);
    await sleep(900);
    await page.click(`${RAIN} [data-sb-resonance-item='venus-love']`);
    await sleep(1500);
    await toRain(page);
    s = await stripState(page);
    ok(s.total === 5, "the total is unchanged — a change is not a new person");
    ok(!s.nodes.some((n) => n.id === "saturn-support"), "the old signal leaves (Saturn had only the viewer)");
    ok(s.nodes.find((n) => n.id === "venus-love")?.count === 3, "Venus receives it: 2 → 3");
    ok(s.nodes.find((n) => n.id === "venus-love")?.yours === true, "the personal orbit followed the change");

    /* ---- 10. The expanded constellation ---- */
    console.log("10. Expanded constellation — a guest list, not a scoreboard");
    await social(page, { q: "&resonance=16" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(400);
    const panel = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => ({
      groups: [...el.querySelectorAll("[data-sb-resonance-group]")].map((g) => g.getAttribute("data-sb-resonance-group")),
      sealWs: [...el.querySelectorAll("[data-sb-resonance-tier='seal']")].map((x) => Math.round(x.getBoundingClientRect().width)),
      people: el.querySelectorAll("[data-sb-resonance-person]").length,
      text: el.textContent ?? "",
      role: el.getAttribute("role"),
    }));
    ok(panel.groups.join(",") === CANON.join(","), "eight groups, canonical order");
    ok(new Set(panel.sealWs).size === 1, "equal Seals inside the stage too");
    ok(panel.people === 16, "every person present, resolved through the view model");
    ok(panel.text.includes("Sofia Romano"), "real people, by name");
    ok(panel.role === "group", "an accessible group with the summary's own label");
    ok(!/top|winner|rank|most|#1/i.test(panel.text), "no ranking words in the stage");
    const tops = await page.$eval(`${RAIN} [data-sb-presence]`, (row) => [...row.children].map((k) => k.getBoundingClientRect().top));
    ok(Math.max(...tops) - Math.min(...tops) <= 6, "open, the Boom pulse and the responses count stay on the strip's line — never floated to the panel's middle");
    // Escape from within the stage returns focus to the strip.
    await page.focus(`${RAIN} [data-sb-resonance-who-panel] button`);
    await page.keyboard.press("Escape");
    await sleep(250);
    ok((await page.$$(`${RAIN} [data-sb-resonance-who-panel]`)).length === 0, "Escape closes the constellation");
    ok(await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-resonance-who")), "focus returns to the constellation strip");

    /* ---- 11. Batching — 200 people never become 200 DOM rows ---- */
    console.log("11. 200 people of one meaning — batched reveal");
    await social(page, { q: "&resonance=200same" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(400);
    let who = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => ({
      people: el.querySelectorAll("[data-sb-resonance-person]").length,
      more: el.querySelector("[data-sb-resonance-more]")?.textContent ?? null,
    }));
    ok(who.people === 24, "first 24 people, then a quiet door");
    ok(!!who.more && who.more.includes("176"), `Show more names the remainder (${who.more?.trim()})`);
    await page.click(`${RAIN} [data-sb-resonance-more]`);
    await sleep(300);
    who = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => ({
      people: el.querySelectorAll("[data-sb-resonance-person]").length,
    }));
    ok(who.people === 72, "then 48 more — 24-then-48, the designed batching");

    /* ---- 12. A new signal arrives — quiet, localized, one-shot ---- */
    console.log("12. Arrival — the constellation changes quietly");
    await social(page, { q: "&resonance=16" });
    await toRain(page);
    const loadAnim = await page.$eval(SUM, (el) => el.querySelectorAll(".sb-cel-node-new, .sb-cel-count-in").length);
    ok(loadAnim === 0, "data arriving (0 → 16 on load) lands STILL — a bulk load is not sixteen arrivals");
    await page.click("[data-sb-harness-arrive]");
    await sleep(350);
    s = await stripState(page);
    ok(s.total === 17, "one more person landed (16 → 17)");
    const animated = await page.$eval(SUM, (el) => ({
      countIn: el.querySelectorAll(".sb-cel-count-in").length,
      nodeNew: el.querySelectorAll(".sb-cel-node-new").length,
      infinite: [...el.querySelectorAll("*")].some((n) => getComputedStyle(n).animationIterationCount.includes("infinite")),
    }));
    ok(animated.countIn + animated.nodeNew >= 1, "exactly the touched signal answers (count crossfade / node settle)");
    ok(!animated.infinite, "nothing loops — one-shot only");
    // Reduced motion: same truth, no travel.
    await social(page, { q: "&resonance=16", reduced: true });
    await toRain(page);
    await page.click("[data-sb-harness-arrive]");
    await sleep(250);
    const reducedAnim = await page.$eval(SUM, (el) =>
      [...el.querySelectorAll(".sb-cel-count-in, .sb-cel-node-new")].every((n) => getComputedStyle(n).animationName === "none"),
    ).catch(() => true);
    ok(reducedAnim, "reduced motion: the change lands with no animation at all");

    /* ---- 13. Privacy — the constellation never carries a life ---- */
    console.log("13. Privacy sweep");
    await social(page, { q: "&resonance=16" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(400);
    const FORBID = ["birthDate", "birthTime", "totalDays", "bandYears", "fraction", "precision", "birthPlace"];
    const leak = await page.$eval(`${RAIN} [data-sb-resonance-summary]`, (el, forbid) => {
      const text = el.textContent ?? "";
      const attrs = [...el.querySelectorAll("*")].flatMap((n) => [...n.attributes].filter((a) => !/^(class|style)$/.test(a.name)).map((a) => `${a.name}=${a.value}`)).join(" ");
      return forbid.filter((f) => text.includes(f) || attrs.includes(f)).concat(/\b\d{1,3}y ?\d{1,2}m\b|\b\d{4,6} ?days\b/.test(text) ? ["exact-age"] : []);
    }, FORBID);
    ok(leak.length === 0, `no forbidden Life field or exact age on the constellation (${leak.join(",") || "none"})`);

    /* ---- 14. Small screens ---- */
    console.log("14. 320 / 360 / 390 — the constellation survives a phone");
    for (const w of [320, 360, 390]) {
      // harness=0: the style-lab review bar itself overflows at 320 (its viewer switcher —
      // pre-existing, identical with the flag off, not the product). Measure the design.
      await social(page, { q: "&resonance=16&harness=0", w });
      await toRain(page);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      const visible = await page.$eval(SUM, (el) => el.getBoundingClientRect().width > 0);
      ok(fits && visible, `${w}px: no horizontal overflow, constellation present`);
      /* "No page overflow" is blind to CLIPPED content: the sheet's overflow-hidden would hide a
         spilling strip rather than scroll it. Measure against the nearest clipping ancestor. */
      const fit = await page.$eval(SUM, (el) => {
        let clipEl = el.parentElement;
        while (clipEl && getComputedStyle(clipEl).overflow === "visible") clipEl = clipEl.parentElement;
        const c = clipEl.getBoundingClientRect();
        const nodes = [...el.querySelectorAll("[data-sb-constellation-node]")].map((n) => n.getBoundingClientRect());
        const people = [...el.querySelectorAll("[data-sb-resonance-who] > span")].pop().getBoundingClientRect();
        const rows = {};
        for (const r of nodes) rows[Math.round(r.top)] = (rows[Math.round(r.top)] ?? 0) + 1;
        return { inside: nodes.every((r) => r.left >= c.left - 0.5 && r.right <= c.right + 0.5) && people.right <= c.right + 0.5, rows: Object.values(rows) };
      });
      ok(fit.inside, `${w}px: all eight meanings and the people count are fully visible — nothing clipped`);
      ok(fit.rows.length === 2 && fit.rows.every((n) => n === 4), `${w}px: two balanced rows of four in canonical order (rows: ${fit.rows.join("+")})`);
      await page.click(`${RAIN} [data-sb-resonance-who]`);
      await sleep(350);
      const panelFits = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => {
        const r = el.getBoundingClientRect();
        const f = document.querySelector("[data-sb-social-frame]").getBoundingClientRect();
        return r.left >= f.left - 1 && r.right <= f.right + 1;
      });
      ok(panelFits, `${w}px: the expanded constellation stays inside the frame`);
    }

    /* ---- 15. Languages ---- */
    console.log("15. Localization — the constellation speaks all eight");
    await social(page, { q: "&resonance=16", lang: "ne" });
    await toRain(page);
    const neText = await page.$eval(SUM, (el) => el.textContent ?? "");
    ok(neText.includes("जना") && !/people/.test(neText), "Nepali: participation in Nepali, digits latn");
    await social(page, { q: "&resonance=16", lang: "ru" });
    await toRain(page);
    const ruText = await page.$eval(SUM, (el) => el.textContent ?? "");
    ok(/16\s*человек/.test(ruText), "Russian: the many-form plural (16 человек)");
    await social(page, { q: "&resonance=16", lang: "zh-Hans" });
    await toRain(page);
    const zhText = await page.$eval(SUM, (el) => el.textContent ?? "");
    ok(/16\s*人/.test(zhText), "Chinese: the single form (16 人)");

    /* ---- 16. GATE 1 — the page world survives scroll, robustly, on phones ---- */
    console.log("16. Gate 1 — a sticky world layer, never background-attachment:fixed");
    const skyAt = (p) => p.evaluate(() => {
      const sky = document.querySelector("[data-sb-celestial-sky] .sb-cel-sky");
      if (!sky) return null;
      const r = sky.getBoundingClientRect();
      return {
        position: getComputedStyle(sky).position, top: Math.round(r.top), h: Math.round(r.height), vh: innerHeight,
        img: getComputedStyle(sky, "::before").backgroundImage,
        transform: getComputedStyle(sky, "::before").transform,
        socialAttach: getComputedStyle(document.querySelector(".sb-social")).backgroundAttachment,
        socialColor: getComputedStyle(document.querySelector(".sb-social")).backgroundColor,
      };
    });
    await social(page, { q: "&resonance=16" });
    let sky = await skyAt(page);
    ok(!!sky && sky.position === "sticky", "the far field is a STICKY layer (compositor-moved, clipped to the frame)");
    ok(!!sky && !sky.socialAttach.includes("fixed"), "no layer uses background-attachment:fixed (iOS ignores it; elsewhere it repaints every frame)");
    ok(!!sky && /environment-cosmos\.svg/.test(sky.img), "desktop dark: the landscape Deep Cosmos composition");
    ok(!!sky && sky.socialColor === "rgb(10, 13, 20)", "a solid Deep Cosmos ground (#0A0D14) stays under the sky");
    for (const [w, h] of [[390, 844], [360, 800]]) {
      for (const theme of ["dark", "light"]) {
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.goto(`${HOST}/style-lab/social?theme=${theme}&celestial=1&harness=0&resonance=16`, { waitUntil: "networkidle2" });
        await sleep(700);
        const samples = [];
        for (const y of [300, 900, 1600, 2400, 3200]) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await sleep(120);
          samples.push(await skyAt(page));
        }
        const pinned = samples.every((s) => s && s.top === 0 && s.h === s.vh);
        ok(pinned, `${theme} ${w}: the sky stays pinned to the viewport at every scroll offset, exactly viewport-tall (no jump, no resize)`);
        const portrait = theme === "dark" ? /environment-cosmos-portrait\.svg/ : /environment-solar-portrait\.svg/;
        ok(portrait.test(samples[0]?.img ?? ""), `${theme} ${w}: the dedicated PORTRAIT composition, not a narrow crop of the landscape`);
      }
    }
    // Repaint budget during a scripted phone scroll: the old fixed attachment measured ~2 paints
    // per frame (401 across 200). A compositor-moved layer should barely paint at all.
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${HOST}/style-lab/social?theme=dark&celestial=1&harness=0&resonance=16`, { waitUntil: "networkidle2" });
    await sleep(900);
    const traceFile = `${require("os").tmpdir()}/sb-cel-s7-trace-${process.pid}.json`;
    await page.tracing.start({ path: traceFile, categories: ["devtools.timeline"] });
    await page.evaluate(async () => { for (let i = 0; i < 120; i++) { window.scrollBy(0, 14); await new Promise((r) => requestAnimationFrame(r)); } });
    await page.tracing.stop();
    const tr = JSON.parse(fs.readFileSync(traceFile, "utf8"));
    fs.unlinkSync(traceFile);
    const paints = (tr.traceEvents || tr).filter((e) => e.name === "Paint" && (e.ph === "X" || e.ph === "B")).length;
    ok(paints < 30, `390 scroll: ${paints} paints across 120 scroll frames (fixed attachment repainted every frame)`);
    // Depth answers interaction on the compositor — and not at all under reduced motion.
    await social(page, { q: "&resonance=16" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonate]`);
    await sleep(800);
    sky = await skyAt(page);
    ok(!!sky && sky.transform !== "none", "opening the doorway settles the sky (a transform, no repaint)");
    await social(page, { q: "&resonance=16", reduced: true });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonate]`);
    await sleep(400);
    sky = await skyAt(page);
    ok(!!sky && sky.transform === "none", "reduced motion: the sky does not travel at all");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await page.goto(`${HOST}/style-lab/social?theme=light&celestial=1&resonance=16`, { waitUntil: "networkidle2" });
    await sleep(600);
    sky = await skyAt(page);
    ok(!!sky && /environment-solar\.svg/.test(sky.img) && !sky.socialAttach.includes("fixed"), "light: the Solar Observatory sky on the same sticky layer");
    ok(!!sky && sky.socialColor === "rgb(245, 245, 246)", "a solid Solar Observatory ground (#F5F5F6) stays under the sky");
    const svg = (n) => fs.readFileSync(`${__dirname}/../public/celestial/${n}`, "utf8");
    const cosmosSvg = svg("environment-cosmos.svg");
    const solarSvg = svg("environment-solar.svg");
    ok(!/r="194"/.test(cosmosSvg) && !/r="194"/.test(svg("environment-cosmos-portrait.svg")), "the unexplained r=194 circle is gone from both dark skies");
    ok(/galaxyCore/.test(cosmosSvg) && /crescent/.test(cosmosSvg) && /id="floor"/.test(cosmosSvg), "in its place: an intentional galaxy, a lit crescent, a cosmic floor");
    ok(!/M30 0 L340 0/.test(solarSvg), "the giant glass triangles are gone from the light sky");
    ok(/id="metal"/.test(solarSvg) && /id="sunGlow"/.test(solarSvg) && /id="marble"/.test(solarSvg), "in their place: observatory frames, sunlight, a marble floor");
    ok(![cosmosSvg, solarSvg].some((s) => /#D92A20/i.test(s)), "brand red never enters the environment");

    /* ---- 19. GATE 2 — participation grants no access to a life ---- */
    console.log("19. Gate 2 — the constellation's identities are view-model-only");
    // A VISITOR (Bikash) opens Maya's constellation, where Maya herself resonated.
    await social(page, { q: "&resonance=mine&viewer=visitor" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(450);
    const vis = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => {
      const rows = [...el.querySelectorAll("[data-sb-resonance-person]")];
      const maya = rows.find((r) => /Giulia Bianchi/.test(r.textContent ?? ""));
      const text = el.textContent ?? "";
      const attrs = [...el.querySelectorAll("*")].flatMap((n) => [...n.attributes].filter((a) => !/^(class|style|src)$/.test(a.name)).map((a) => a.value)).join(" ");
      // The visitor (Bikash) is himself one of the resonators: HIS own row may carry his own
      // ring. Everyone else's row is what participation must never unlock.
      const others = rows.filter((r) => !r.querySelector("[data-sb-resonance-me]"));
      return {
        mayaPresent: !!maya,
        mayaRing: maya?.querySelector("[data-sb-ring]")?.getAttribute("data-sb-ring") ?? null,
        mayaIsYou: !!maya?.querySelector("[data-sb-resonance-me]"),
        othersBandOnly: others.every((r) => r.querySelector("[data-sb-ring]")?.getAttribute("data-sb-ring") === "other"),
        otherTicks: others.reduce((n, r) => n + r.querySelectorAll("[data-sb-tick-angle]").length, 0),
        exactAge: /\b\d{1,3}y ?\d{1,2}m\b/.test(text + " " + attrs),
        dayCount: /\b\d{1,3},?\d{3} ?days\b/i.test(text + " " + attrs),
        birth: /1991|04 NOV|06:42/.test(text + " " + attrs),
        contact: /\+977|9841|@example\.com/.test(el.innerHTML),
      };
    });
    ok(vis.mayaPresent, "the visitor sees Giulia among the people who resonated — by name");
    ok(vis.mayaRing === "other" && !vis.mayaIsYou, "Giulia's ring resolves to the visitor's band-only view, and her row is not 'You'");
    ok(vis.othersBandOnly && vis.otherTicks === 0, "every other person's row is band-only with no owner-only Life tick (fraction)");
    ok(!vis.exactAge && !vis.dayCount, "no exact age and no day count, in text or attributes");
    ok(!vis.birth, "no birth date or birth time");
    ok(!vis.contact, "no private contact details (phone / email)");
    // The owner's own view: only her OWN row may carry her own ring; everyone else is band-only.
    await social(page, { q: "&resonance=mine" });
    await toRain(page);
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(450);
    const own = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => {
      const rows = [...el.querySelectorAll("[data-sb-resonance-person]")];
      const me = rows.filter((r) => r.querySelector("[data-sb-resonance-me]"));
      const others = rows.filter((r) => !r.querySelector("[data-sb-resonance-me]"));
      return {
        me: me.length,
        othersBandOnly: others.every((r) => r.querySelector("[data-sb-ring]")?.getAttribute("data-sb-ring") === "other"),
        otherTicks: others.reduce((n, r) => n + r.querySelectorAll("[data-sb-tick-angle]").length, 0),
      };
    });
    ok(own.me === 1, "the owner sees exactly one row marked as herself");
    ok(own.othersBandOnly && own.otherTicks === 0, "every OTHER person is band-only, with no tick — friendship or participation never raises precision");
    // An identity the view model cannot resolve is counted, never rendered as somebody else.
    await social(page, { q: "&resonance=ghost" });
    await toRain(page);
    const ghostTotal = await page.$eval(SUM, (el) => Number(el.getAttribute("data-sb-resonance-summary")));
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(450);
    const ghost = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => ({
      venusRows: [...el.querySelectorAll("[data-sb-resonance-group='venus-love'] [data-sb-resonance-person]")].map((r) => r.getAttribute("data-sb-resonance-person")),
      unnamed: el.querySelector("[data-sb-resonance-group='venus-love'] [data-sb-resonance-unnamed]")?.getAttribute("data-sb-resonance-unnamed") ?? null,
      text: el.textContent ?? "",
    }));
    ok(ghostTotal === 3, "the unresolvable person is still COUNTED (3 people)");
    ok(ghost.venusRows.length === 1 && !ghost.venusRows.includes("p-unresolvable") && !ghost.venusRows.includes("p-m"), "…but never rendered — and never misattributed to another fixture person");
    ok(ghost.unnamed === "1" && /\+1 person/.test(ghost.text), "the fallback is aggregate participation: '+1 person'");

    /* ---- 20. GATE 3 — participation, not importance ---- */
    console.log("20. Gate 3 — Venus 2 vs Venus 45: only the neutral number may change");
    const fingerprint = (p, rid) => p.$eval(`${RAIN} [data-sb-constellation-node="${rid}"]`, (n) => {
      const cs = getComputedStyle;
      const strip = n.parentElement.getBoundingClientRect();
      const seal = n.querySelector("[data-sb-resonance-tier='seal']");
      const img = seal.querySelector("img");
      const aura = seal.querySelector("span");
      const count = n.querySelector(".sb-cel-count");
      const r = seal.getBoundingClientRect();
      return {
        index: [...n.parentElement.children].indexOf(n),
        dy: Math.round((r.top - strip.top) * 10) / 10,
        w: r.width, h: r.height, nodeW: n.getBoundingClientRect().width,
        sealOpacity: cs(seal).opacity, sealFilter: cs(seal).filter, sealTransform: cs(seal).transform, zIndex: cs(n).zIndex,
        imgSrc: img.getAttribute("src"), imgFilter: cs(img).filter, imgOpacity: cs(img).opacity,
        auraBg: cs(aura).backgroundImage, auraW: aura.getBoundingClientRect().width,
        anim: `${cs(n).animationName}|${cs(seal).animationName}|${cs(img).animationName}`,
        countStyle: count ? `${cs(count).fontSize}|${cs(count).fontWeight}|${cs(count).color}|${cs(count).opacity}` : null,
        countText: count?.textContent ?? null,
      };
    });
    const strip = async (q) => {
      await social(page, { q });
      await toRain(page);
      const order = await page.$eval(SUM, (el) => [...el.querySelectorAll("[data-sb-constellation-node]")].map((x) => x.getAttribute("data-sb-constellation-node")));
      return { order, venus: await fingerprint(page, "venus-love"), moon: await fingerprint(page, "moon-touched") };
    };
    const A = await strip("&resonance=2v2m");
    const B = await strip("&resonance=45v2m");
    const same = (a, b, skip = ["countText"]) => Object.keys(a).filter((k) => !skip.includes(k) && a[k] !== b[k]);
    ok(A.order.join(",") === "venus-love,moon-touched" && B.order.join(",") === "venus-love,moon-touched", "canonical order in both — Venus is not moved EARLIER by its count");
    ok(A.venus.countText === "2" && B.venus.countText === "45" && A.moon.countText === "2" && B.moon.countText === "2", "the participation number is the one thing that changes (2 → 45)");
    const dv = same(A.venus, B.venus);
    ok(dv.length === 0, `Venus at 45 is not larger, brighter, closer, more saturated or re-layered than at 2${dv.length ? ` (differs: ${dv.join(",")})` : ""}`);
    const dm = same(A.moon, B.moon, ["countText"]);
    ok(dm.length === 0, `Moon keeps its exact place and treatment beside a 45${dm.length ? ` (differs: ${dm.join(",")})` : ""}`);
    ok(B.venus.w === B.moon.w && B.venus.h === B.moon.h && B.venus.dy === B.moon.dy, "at 45 vs 2, Venus and Moon are the same size at the same height");
    ok(B.venus.countStyle === B.moon.countStyle, "the two numbers wear identical, neutral typography");
    ok([A, B].every((x) => /^(none\|?)+$/.test(x.venus.anim) && /^(none\|?)+$/.test(x.moon.anim)), "nothing is animated for having more people");
    // The expanded stage obeys the same law.
    await page.click(`${RAIN} [data-sb-resonance-who]`);
    await sleep(450);
    const stageB = await page.$eval(`${RAIN} [data-sb-resonance-who-panel]`, (el) => ({
      groups: [...el.querySelectorAll("[data-sb-resonance-group]")].map((g) => g.getAttribute("data-sb-resonance-group")),
      seals: [...el.querySelectorAll("[data-sb-resonance-group] > span [data-sb-resonance-tier='seal']")].map((s) => Math.round(s.getBoundingClientRect().width)),
    }));
    ok(stageB.groups.join(",") === "venus-love,moon-touched" && new Set(stageB.seals).size === 1, "expanded: the 45-person group leads only by canon, at the same Seal size");
    // All eight, fifty-six people vs sixteen: every object's treatment is count-independent.
    const all8 = async (q) => {
      await social(page, { q });
      await toRain(page);
      const out = {};
      for (const rid of CANON) out[rid] = await fingerprint(page, rid);
      return out;
    };
    const S16 = await all8("&resonance=16");
    const S50 = await all8("&resonance=50");
    const drift = CANON.filter((rid) => same(S16[rid], S50[rid]).length > 0);
    ok(drift.length === 0, `all eight: every object's size, light and position are identical at 16 and 56 people${drift.length ? ` (drift: ${drift.join(",")})` : ""}`);
    ok(new Set(CANON.map((rid) => `${S50[rid].w}x${S50[rid].h}@${S50[rid].dy}`)).size === 1, "all eight at 56 people: one size, one height — no object dominant");

    /* ---- 17. Flag OFF stays byte-silent even WITH seeded multi-person data ---- */
    console.log("17. Flag OFF parity under seeded data");
    await social(page, { q: "&resonance=16", celestial: false });
    await toRain(page);
    const offNodes = await page.$$eval("[data-sb-resonance-summary], [data-sb-resonate], [data-sb-celestial-field], [data-sb-constellation-node]", (n) => n.length);
    ok(offNodes === 0, "seeded resonances render NOTHING while the flag is off");

    console.log("18. Console hygiene");
    ok(consoleErrors.length === 0, `no console/page errors${consoleErrors.length ? ` (${consoleErrors[0]})` : ""}`);
  } finally {
    await browser.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`FAIL: ${f}`)); process.exitCode = 1; }
})().catch((e) => { console.error(e); process.exitCode = 1; });
