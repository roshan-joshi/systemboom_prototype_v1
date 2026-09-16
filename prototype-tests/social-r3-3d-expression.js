/* SYSTEMBOOM — R3: THE EXPRESSION LANGUAGE + MOMENT CONVERSATION.
   Twelve expressions in two groups (quick six one tap away, extended six behind
   More, all twelve named in the panel), the single-active invariant across the
   whole set, the calm action bar, the one conversation vocabulary (RESPOND ·
   RESPONSES · REPLY, no "note"), adaptive conversation depth, and the
   invariants: no passive animation, no Life mutation, no relationship mutation,
   Health/Problem non-social, visibility inherited.
     node prototype-tests/social-r3-3d-expression.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya", lang = "en", extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang); u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(500);
}
const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
/* R3.1 §10 — the registry grew 12 → 18 and the library now orders by emotional group
   (quick six · energy · warmth · thought). Owner-superseded, recorded in AGENTS.md. */
const EXTENDED = ["proud", "speechless", "love", "thanks", "touched", "withyou", "respect", "inspired", "curious", "agree", "thinking", "nostalgia"];
const ALL = 18;
const toRain = (page) => page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" }));
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
const openRail = async (page) => { await page.click(`${RAIN} [data-sb-express]`); await sleep(350); };
const loadAll = async (page) => { for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); } };
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Twelve expressions, two groups ---- */
  console.log("1. The language");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  await openRail(page);
  const quick = await page.$$eval("[data-sb-expression-rail] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("data-sb-expression-option")));
  ok(quick.join(",") === QUICK.join(","), `the quick six are one tap away, in order (${quick.join(", ")})`);
  ok(!!(await page.$("[data-sb-expression-more]")), "a clear More affordance reveals the rest — eighteen are never dumped into one deck");
  await page.click("[data-sb-expression-more]"); await sleep(350);
  const all = await page.$$eval("[data-sb-expression-panel] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("data-sb-expression-option")));
  // Owner-superseded (R3.7 §10): the field is grouped by FAMILY (warmth · energy · wonder ·
  // connection) rather than quick-first-then-group. Still all eighteen, still one stable order.
  const FIELD = ["care", "love", "thanks", "touched", "nostalgia", "joy", "laugh", "celebrate", "proud", "wow", "speechless", "inspired", "curious", "thinking", "support", "withyou", "respect", "agree"];
  ok(all.join(",") === FIELD.join(",") && all.length === QUICK.length + EXTENDED.length, `the field carries all eighteen, grouped by family (${all.length})`);
  const labelled = await page.$$eval("[data-sb-expression-panel] [data-sb-expression-option]", (n) => n.every((o) => (o.textContent ?? "").trim().length > 0));
  ok(labelled, "every expression in the panel is NAMED — this is how the language is learned");
  const negatives = await page.$$eval("[data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("aria-label") ?? "").join(" "));
  ok(!/angry|dislike|downvote|mock|sarcas|hate/i.test(negatives), "no angry / dislike / downvote / mocking in the set");

  /* ---- 2. The mascot carries the emotion — distinct pose per expression ---- */
  console.log("2. Mascot-borne emotion");
  // Owner-superseded (R3.8 §13): the Atlas has ONE preview vessel — attend a core and the vessel
  // takes that expression's body language. Sampled across quick + extended.
  const poses = [];
  for (const id of [...QUICK, "love", "proud", "speechless", "respect", "thinking", "nostalgia"]) {
    const c = await page.evaluate((i) => { const b = document.querySelector(`[data-sb-expression-option='${i}']`).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, id);
    await page.mouse.move(c.x, c.y, { steps: 2 });
    await sleep(150);
    poses.push(await page.$eval("[data-sb-horizon-stage] [data-sb-expression]", (e) => ({ id: e.getAttribute("data-sb-expression"), t: getComputedStyle(e.querySelector("[data-sb-pose]")).transform, energy: e.getAttribute("data-sb-expression-energy") })));
  }
  ok(poses.length === 12 && new Set(poses.map((p) => p.t)).size >= 10, `each expression carries its own body language on the vessel (${new Set(poses.map((p) => p.t)).size} distinct poses of 12 sampled)`);
  ok(poses.every((p) => p.t !== "none"), "no expression falls back to an untransformed mascot");
  const energies = [...new Set(poses.map((p) => p.energy))];
  ok(energies.length === 3, `three energy families drive timing (${energies.sort().join(", ")})`);
  await page.mouse.move(4, 4);
  await sleep(150);

  /* ---- 3. One active per viewer, across the whole set ---- */
  console.log("3. Single-active invariant");
  await page.click("[data-sb-expression-option='touched']"); await sleep(400);
  ok((await mine(page)) === "touched" && (await page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => Number(e.getAttribute("data-sb-expression-summary")))) === 3, "an extended expression commits like any other, and the aggregate rises by one");
  await openRail(page);
  await page.click(`${RAIN} [data-sb-expression-option='laugh']`); await sleep(400);
  ok((await mine(page)) === "laugh" && (await page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => Number(e.getAttribute("data-sb-expression-summary")))) === 3, "switching quick ⇄ extended REPLACES — never two from one viewer");
  await openRail(page);
  await page.click(`${RAIN} [data-sb-expression-remove]`); await sleep(350);
  ok((await mine(page)) === "", "Remove clears the viewer's own expression, leaving everyone else's");

  /* ---- 4. The calm action bar ---- */
  console.log("4. Action bar");
  await open(page, 360, 800);
  await toRain(page); await sleep(200);
  const bar = await page.$eval(RAIN, (m) => {
    // wrapping is measured honestly: a row that fits is no taller than its tallest child
    // (children of different heights legitimately report different `top` when centred).
    const wrapped = (el) => {
      if (!el) return 99;
      const kids = [...el.children].filter((c) => c.getClientRects().length);
      const tallest = Math.max(...kids.map((c) => c.getBoundingClientRect().height));
      return el.getBoundingClientRect().height > tallest + 2 ? 2 : 1;
    };
    const actions = m.querySelector("[data-sb-actions]");
    const rows = { size: wrapped(actions) };
    const presence = m.querySelector("[data-sb-presence]");
    return {
      respondWord: /^Respond$/.test(m.querySelector("[data-sb-respond]")?.textContent?.trim() ?? ""),
      express: !!m.querySelector("[data-sb-express]"),
      presence: !!presence,
      permanentRail: !!m.querySelector("[data-sb-expression-rail]"),
      rows: rows.size,
      presenceRows: wrapped(presence),
      counts: presence ? presence.querySelectorAll("button").length : 0,
    };
  });
  ok(bar.respondWord, "RESPOND remains the visible primary verb");
  ok(bar.express && bar.presence && !bar.permanentRail, "one expression control + one human-presence line, never eighteen permanent reactions");
  ok(bar.rows === 1 && bar.presenceRows === 1 && bar.counts <= 2, `360: one clean action row and one quiet presence line, no wall of numeric actions (${bar.rows}/${bar.presenceRows} rows, ${bar.counts} counts)`);
  ok(await noHScroll(page), "360: no horizontal overflow");

  /* ---- 5. Conversation vocabulary: RESPOND · RESPONSES · REPLY, no "note" ---- */
  console.log("5. Vocabulary");
  await open(page, 1440, 1000);
  await loadAll(page);
  const words = await page.evaluate(() => {
    const t = document.body.innerText;
    return { note: /\bnotes?\b/i.test(t), responses: /responses?/i.test(t), respond: /Respond/.test(t) };
  });
  ok(!words.note, "the word NOTE is gone from the social conversation");
  ok(words.respond && words.responses, "RESPOND (verb) and RESPONSES (the conversation) both read naturally");
  await toRain(page); await sleep(200);
  await page.click(`${RAIN} [data-sb-respond]`); await sleep(400);
  const composer = await page.$eval(RAIN, (m) => ({ box: !!m.querySelector("[data-sb-response-composer] textarea"), focused: !!document.activeElement?.closest("[data-sb-response-composer]"), ph: m.querySelector("[data-sb-response-composer] textarea")?.getAttribute("aria-label") }));
  ok(composer.box && composer.focused && /response/i.test(composer.ph ?? ""), `Respond writes: it opens the conversation with the cursor in the composer (${composer.ph})`);
  const replyWord = await page.$$eval(`${RAIN} [data-sb-note] button`, (n) => n.map((b) => b.textContent.trim()));
  ok(replyWord.includes("Reply"), "REPLY exists only on an existing response — the model supports that relationship");
  ok(!(await page.$(`${RAIN} [data-sb-note] button[aria-pressed]`)), "no reaction under every response — expressions stay attached to the Moment (§57)");

  /* ---- 6. Adaptive conversation depth ---- */
  console.log("6. Conversation depth");
  await open(page, 390, 844);
  await toRain(page); await sleep(200);
  await page.click(`${RAIN} [data-sb-responses]`); await sleep(400);
  ok(!!(await page.$(`${RAIN} [data-sb-note]`)) && !(await page.$("[data-sb-conversation-surface]")), "a short conversation stays inline in the Almanac");
  await open(page, 390, 844);
  await loadAll(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']")?.scrollIntoView({ block: "center" })); await sleep(250);
  await page.click("[data-sb-moment='m-forty'] [data-sb-responses]"); await sleep(500);
  const deep = await page.evaluate(() => {
    const s = document.querySelector("[data-sb-conversation-surface]");
    if (!s) return null;
    const r = s.querySelector("[role=dialog]").getBoundingClientRect();
    return { notes: s.querySelectorAll("[data-sb-note]").length, composer: !!s.querySelector("[data-sb-response-composer]"), header: /Asha|Sunita|Maya|Bikash/.test(s.querySelector("header")?.textContent ?? ""), coord: /\d{2} [A-Z]{3} \d{4}/.test(s.querySelector("header")?.textContent ?? ""), inView: r.bottom <= window.innerHeight + 1 };
  });
  ok(deep && deep.notes >= 20, `a deep conversation opens its own focused surface (${deep?.notes} responses)`);
  ok(deep && deep.header && deep.coord, "…carrying the memory it belongs to: person + date coordinate");
  ok(deep && deep.composer && deep.inView, "…with the composer present and the surface inside the viewport");
  await page.click("[data-sb-conversation-back]"); await sleep(350);
  ok(!(await page.$("[data-sb-conversation-surface]")), "Back returns to the Almanac");
  await open(page, 1440, 1000);
  await loadAll(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']")?.scrollIntoView({ block: "center" })); await sleep(250);
  await page.click("[data-sb-moment='m-forty'] [data-sb-responses]"); await sleep(400);
  ok(!(await page.$("[data-sb-conversation-surface]")) && !!(await page.$("[data-sb-moment='m-forty'] [data-sb-note]")), "desktop keeps a deep conversation inline — the Moment stays visible");

  /* ---- 7. Health / Problem stay non-social ---- */
  console.log("7. Health / Problem");
  await open(page, 1440, 1000);
  await loadAll(page);
  const quiet = await page.evaluate(() => ["health", "problem"].map((k) => {
    const m = document.querySelector(`[data-sb-moment][data-sb-kind='${k}']`);
    return m ? { k, express: !!m.querySelector("[data-sb-express]"), summary: !!m.querySelector("[data-sb-expression-summary]"), respond: !!m.querySelector("[data-sb-respond]") } : null;
  }));
  ok(quiet.every((q) => q && !q.express && !q.summary && !q.respond), `Health and Problem carry no Expression, no aggregate, no Respond (${quiet.map((q) => q?.k).join("+")})`);

  /* ---- 8. Privacy + visibility ---- */
  console.log("8. Privacy");
  await open(page, 1440, 1000, { viewer: "visitor" });
  await toRain(page); await sleep(200);
  ok((await page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => Number(e.getAttribute("data-sb-expression-summary")))) === 2, "a visitor sees only the expressions the Moment's visibility allows");
  await open(page, 1440, 1000);
  await page.click("[data-sb-view-as-public]"); await sleep(400);
  await toRain(page); await sleep(200);
  ok((await page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => Number(e.getAttribute("data-sb-expression-summary")))) === 2, "public preview shows exactly what a real visitor receives");
  ok((await page.$$eval("[data-sb-moment][data-sb-privacy='onlyme'] [data-sb-expression-summary]", (n) => n.length)) === 0, "no aggregate leaks for a Moment the audience cannot see");

  /* ---- 9. Human presence, never popularity ---- */
  console.log("9. Presence");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  // R3.3 owner-superseded: the presence miniatures are Boom Lenses now, never whole mascots.
  const presence = await page.$eval(`${RAIN} [data-sb-presence]`, (e) => ({ heads: e.querySelectorAll("[data-sb-lens] img").length, text: e.textContent.replace(/\s+/g, " ").trim() }));
  ok(presence.heads > 0 && presence.heads <= 3, `the summary shows at most three Boom Lenses (${presence.heads})`);
  ok(!/popular|top|trending|score|%/i.test(presence.text), `presence answers "are people here?", never "how popular is this?" (${presence.text})`);
  await page.click(`${RAIN} [data-sb-expression-summary]`); await sleep(380);
  // R3.3 owner-superseded: the tap opens the Expression Spectrum (truthful per-feeling
  // counts, canonical order); a feeling opens its people. Invariants unchanged.
  const spec = await page.$$eval("[data-sb-spectrum-row]", (n) => n.map((r) => `${r.getAttribute("data-sb-spectrum-row")}:${r.getAttribute("data-sb-spectrum-count")}`));
  ok(spec.join(",") === "care:1,joy:1", `the Spectrum shows each feeling with its truthful count (${spec.join(",")})`);
  await page.click("[data-sb-spectrum-row='care']"); await sleep(380);
  const who = await page.$eval("[data-sb-expression-who]", (e) => ({ rows: e.querySelectorAll("li").length, rings: e.querySelectorAll("[data-sb-ring]").length, lenses: e.querySelectorAll("[data-sb-lens]").length, exact: /\d+y \d\dm \d\dd/.test(e.textContent) }));
  ok(who.rows === 1 && who.rings === 1 && who.lenses === 1, "who expressed: real photo + Life Ring + name + that person's Boom Lens");
  ok(!who.exact, "…and never another person's exact Life precision");
  await page.keyboard.press("Escape"); await sleep(250);
  await page.keyboard.press("Escape"); await sleep(250);

  /* ---- 10. No passive animation anywhere ---- */
  console.log("10. Stillness");
  await open(page, 1440, 1400);
  await loadAll(page);
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
  await sleep(600);
  const idle = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  ok(idle === 0, `scrolling a feed full of expression summaries animates NOTHING (${idle} running)`);
  await toRain(page);
  await openRail(page);
  await page.click(`${RAIN} [data-sb-expression-option='celebrate']`); await sleep(1000);
  // suite correction: the LifeCounter's accepted per-second `sb-roll` tick is excluded by name
  ok((await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length)) === 0, "even the most energetic expression is one event — calm again inside a second");
  ok((await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming?.().iterations === Infinity).length)) === 0, "no infinite animation exists at all");

  /* ---- 11. Life + relationship invariants ---- */
  console.log("11. Invariants");
  await open(page, 1440, 1000);
  const ringBefore = await page.$eval("[data-sb-hero] [data-sb-ring]", (e) => e.outerHTML);
  await toRain(page); await sleep(150);
  await openRail(page);
  await page.click(`${RAIN} [data-sb-expression-option='respect']`).catch(async () => { await page.click("[data-sb-expression-more]"); await sleep(300); await page.click("[data-sb-expression-option='respect']"); });
  await sleep(500);
  ok((await page.$eval("[data-sb-hero] [data-sb-ring]", (e) => e.outerHTML)) === ringBefore, "expressing changes NOTHING about the Life Ring — bit-for-bit identical");
  ok((await page.$$eval("[data-sb-moment] [data-sb-ring] [data-sb-expression]", (n) => n.length)) === 0, "no expression is ever drawn onto a Life Ring");
  await page.click("[data-sb-people]"); await sleep(300);
  const rels = await page.$$eval("[data-sb-people-row]", (n) => n.map((r) => `${r.getAttribute("data-sb-people-row")}:${r.getAttribute("data-sb-people-rel")}`).join(","));
  ok(/p-asha:friend/.test(rels) && /p-sunita:family/.test(rels), "friend / family states are untouched by expressing");
  await page.keyboard.press("Escape");

  /* ---- 12. Phone: 320 and 360 ---- */
  console.log("12. Phone");
  for (const [w, h] of [[320, 640], [360, 800]]) {
    await open(page, w, h);
    await toRain(page); await sleep(200);
    await openRail(page);
    const r = await page.evaluate(() => {
      const b = document.querySelector("[data-sb-expression-rail]").getBoundingClientRect();
      const more = document.querySelector("[data-sb-expression-more]").getBoundingClientRect();
      const opts = [...document.querySelectorAll("[data-sb-expression-option]")].map((o) => Math.round(o.getBoundingClientRect().width));
      return { within: b.left >= 0 && b.right <= innerWidth + 1, min: Math.min(...opts), n: opts.length, moreReachable: more.width > 0 && more.left >= b.left - 1 && more.right <= b.right + 1 };
    });
    ok(r.within && (await noHScroll(page)), `${w}: the quick rail stays inside the frame, no overflow`);
    ok(r.min >= 44 && r.n === 6, `${w}: six expressions at a real touch size, never shrunk to dots (${r.min}px)`);
    ok(r.moreReachable, `${w}: More never scrolls out of reach — the six may scroll, the affordance may not`);
    await page.click("[data-sb-expression-more]"); await sleep(350);
    ok(await noHScroll(page), `${w}: the eighteen-expression library fits too`);
  }

  /* ---- 13. Keyboard + reduced motion + contrast ---- */
  console.log("13. Accessibility");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter"); await sleep(350);
  ok(await page.evaluate(() => document.activeElement?.getAttribute("role") === "radio"), "keyboard opens the rail onto an option");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await sleep(120);
  const f = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-expression-option"));
  await page.keyboard.press("Enter"); await sleep(400);
  ok((await mine(page)) === f, `arrows move and Enter commits (${f})`);
  await openRail(page);
  // R3.1 §24 — the flat accent outline is superseded by an OWNED SEAT (a deeper recess the
  // character has settled into) plus one small Boom notch on the rim. Still shape, not colour.
  const sel = await page.$eval("[data-sb-expression-option][aria-checked=true]", (e) => ({ checked: e.getAttribute("aria-checked"), seat: e.className.includes("sb-seat-own") || e.className.includes("sb-lib-cell-own"), notch: !!e.querySelector("[data-sb-own-mark]") }));
  ok(sel.checked === "true" && sel.seat && sel.notch, "the selected expression is announced AND shown by an owned seat + Boom notch, not colour alone");
  await page.keyboard.press("Escape"); await sleep(250);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-expression-rail]") && document.activeElement?.hasAttribute("data-sb-express")), "Escape closes the rail and returns focus to the control");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await toRain(page); await sleep(150);
  await openRail(page);
  // Owner-superseded (R3.8): the pose is read on the ONE vessel while attending the core
  await page.hover("[data-sb-expression-option='laugh']"); await sleep(150);
  const rmPose = await page.$eval("[data-sb-horizon-stage] [data-sb-pose]", (e) => getComputedStyle(e).transform);
  ok(rmPose !== "none", "reduced motion keeps the POSE — the emotion survives with no animation at all");
  await page.click("[data-sb-expression-option='laugh']"); await sleep(200);
  ok((await mine(page)) === "laugh", "reduced motion: the expression commits directly, meaning complete");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 14. All eight locales name all twelve ---- */
  console.log("14. Languages");
  for (const lang of ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"]) {
    await open(page, 1440, 1000, { lang });
    await toRain(page); await sleep(150);
    await openRail(page);
    await page.click("[data-sb-expression-more]"); await sleep(300);
    const labels = await page.$$eval("[data-sb-expression-panel] [data-sb-expression-option]", (n) => n.map((o) => (o.textContent ?? "").trim()));
    const aria = await page.$$eval("[data-sb-expression-panel] [data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("aria-label") ?? ""));
    const unique = new Set(labels).size;
    ok(labels.length === ALL && unique === ALL && labels.every(Boolean), `${lang}: eighteen distinct names (${unique}/${ALL})`);
    ok(aria.every((a) => a.length > 0), `${lang}: every expression carries an accessible name`);
    if (lang !== "en") ok(!labels.some((l) => ["Care", "Joy", "Laugh", "Wow", "Celebrate", "Support"].includes(l)), `${lang}: no English leaked into the language`);
  }

  /* ---- 15. Page health ---- */
  console.log("15. Page health");
  await open(page, 1440, 1000);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("SOCIAL R3 EXPRESSION: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("SOCIAL R3 EXPRESSION: PASS");
  process.exit(failures.length ? 1 : 0);
})();
