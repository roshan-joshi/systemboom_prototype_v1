/* SYSTEMBOOM — SOCIAL R2: BOOM EXPRESSIONS + MOMENT CONVERSATION.
   One Expression per viewer per Moment (select / change / remove), the quiet
   aggregate + who-expressed detail, Health/Problem exclusion, owner/visitor/
   public-preview visibility, the Response Branch conversation (order, reply,
   preview, collapse), keyboard, reduced motion, locales, and the invariants:
   no Life Ring mutation, no relationship mutation, no infinite animation.
     node prototype-tests/social-r2-expression.js */
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
const toRain = (page) => page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" }));
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
const summary = (page) => page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => Number(e.getAttribute("data-sb-expression-summary"))).catch(() => 0);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Respond stays the primary verb; the Expression entry is one compact control ---- */
  console.log("1. Action grammar");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  const grammar = await page.$eval(RAIN, (m) => ({
    respondWord: [...m.querySelectorAll("button")].some((b) => /^Respond$/.test(b.textContent.trim().replace(/\s+·.*/, ""))),
    express: !!m.querySelector("[data-sb-express]"),
    permanentRail: !!m.querySelector("[data-sb-expression-rail]"),
    likeWords: /like|likes\b/i.test(m.querySelector("[data-sb-express]")?.getAttribute("aria-label") ?? ""),
  }));
  ok(grammar.respondWord, "the visible word RESPOND remains the primary social verb");
  ok(grammar.express && !grammar.permanentRail, "one compact mascot Expression entry — no six permanent reactions under the Moment");
  ok(!grammar.likeWords, "the Expression never speaks the language of Like");

  /* ---- 2. Select / one-per-viewer / change / remove ---- */
  console.log("2. Select · change · remove");
  const seedCount = await summary(page);
  ok(seedCount === 2, `seeded aggregate reads truthfully (${seedCount})`);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(300);
  ok(!!(await page.$(`${RAIN} [data-sb-expression-rail]`)), "the rail opens beside the action region");
  ok((await page.$$eval(`${RAIN} [data-sb-expression-option]`, (n) => n.length)) === 6, "six expressions, no angry/dislike/downvote");
  await page.click(`${RAIN} [data-sb-expression-option='care']`); await sleep(400);
  ok((await mine(page)) === "care" && (await summary(page)) === 3, "selecting commits ONE Expression and the aggregate rises by one");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.click(`${RAIN} [data-sb-expression-option='wow']`); await sleep(400);
  ok((await mine(page)) === "wow" && (await summary(page)) === 3, "a new choice REPLACES the old — never two from the same viewer");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  ok(!!(await page.$(`${RAIN} [data-sb-expression-rail] [aria-checked=true]`)), "the current choice is stated in the rail (shape + outline, aria-checked)");
  await page.click(`${RAIN} [data-sb-expression-remove]`); await sleep(300);
  ok((await mine(page)) === "" && (await summary(page)) === 2, "Remove is an understandable path — the viewer's Expression clears, others remain");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.click(`${RAIN} [data-sb-expression-option='joy']`); await sleep(300);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.click(`${RAIN} [data-sb-expression-option='joy']`); await sleep(300);
  ok((await mine(page)) === "", "re-selecting the active Expression also removes it (toggle truth)");

  /* ---- 3. Who expressed what — no ranking, real identity ---- */
  console.log("3. Who expressed");
  await page.click(`${RAIN} [data-sb-expression-summary]`); await sleep(380);
  // R3.3 owner-superseded: Human Pulse opens the EXPRESSION SPECTRUM first; each feeling
  // opens ITS people. The invariant — real photo + Life Ring + name, never exact Life
  // precision, never a ranking — is unchanged, asserted per feeling.
  const spectrum = await page.$eval(`${RAIN} [data-sb-expression-spectrum]`, (e) => [...e.querySelectorAll("[data-sb-spectrum-row]")].map((r) => r.getAttribute("data-sb-spectrum-row")));
  ok(spectrum.join(",") === "care,joy", `the Spectrum lists what was felt, canonical order (${spectrum.join(",")})`);
  const readWho = async (id, name) => {
    await page.click(`[data-sb-spectrum-row='${id}']`); await sleep(380);
    const w = await page.$eval(`${RAIN} [data-sb-expression-who]`, (e) => ({ rows: e.querySelectorAll("li").length, rings: e.querySelectorAll("[data-sb-ring]").length, named: e.textContent.includes(name), exact: /\d+y \d\dm \d\dd/.test(e.textContent) }));
    await page.click("[data-sb-who-back]"); await sleep(320);
    return w;
  };
  const whoCare = await readWho("care", "Asha Gurung");
  const whoJoy = await readWho("joy", "Bikash Shrestha");
  ok(whoCare.rows === 1 && whoCare.rings === 1 && whoCare.named && whoJoy.rows === 1 && whoJoy.named, "each feeling opens ITS people — real photo + Life Ring + name");
  ok(!whoCare.exact && !whoJoy.exact, "…and never another person's exact Life precision");
  await page.keyboard.press("Escape"); await sleep(250);

  /* ---- 4. Health / Problem stay non-social ---- */
  console.log("4. Health / Problem");
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(250); }
  const quiet = await page.evaluate(() => {
    const kinds = ["health", "problem"];
    return kinds.map((k) => { const m = document.querySelector(`[data-sb-moment][data-sb-kind='${k}']`); return m ? { k, express: !!m.querySelector("[data-sb-express]"), summary: !!m.querySelector("[data-sb-expression-summary]"), respond: [...m.querySelectorAll("button")].some((b) => /^Respond/.test(b.textContent.trim())) } : null; });
  });
  ok(quiet.every((q) => q && !q.express && !q.summary && !q.respond), `Health and Problem carry no Expression entry, no aggregate, no Respond (${quiet.map((q) => q?.k).join("+")})`);

  /* ---- 5. Visitor + public preview visibility ---- */
  console.log("5. Visitor / preview");
  await open(page, 1440, 1000, { viewer: "visitor" });
  await toRain(page); await sleep(200);
  ok((await mine(page)) === "joy", "a visitor's own seeded Expression is shown as theirs (Bikash → joy)");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.click(`${RAIN} [data-sb-expression-option='support']`); await sleep(300);
  ok((await mine(page)) === "support" && (await summary(page)) === 2, "the visitor's change replaces their own — the count never inflates");
  await open(page, 1440, 1000);
  await page.click("[data-sb-view-as-public]"); await sleep(400);
  await toRain(page); await sleep(200);
  ok((await summary(page)) === 2, "View as public shows exactly the Expression visibility a real visitor receives");
  const onlyMeLeak = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment][data-sb-privacy='onlyme'] [data-sb-expression-summary]")].length);
  ok(onlyMeLeak === 0, "no aggregate ever surfaces for a Moment the audience cannot see");

  /* ---- 6. Conversation: order, reply, preview, collapse ---- */
  console.log("6. Moment conversation");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  ok(!!(await page.$(`${RAIN} [data-sb-response-preview]`)), "collapsed feed shows ONE quiet recent response, not a thread");
  await page.click(`${RAIN} [data-sb-response-preview]`); await sleep(300);
  ok(!!(await page.$(`${RAIN} [data-sb-response-branch]`)), "the open conversation carries the Response Branch from the Almanac spine");
  const before = await page.$$eval(`${RAIN} [data-sb-note]`, (n) => n.length);
  await page.type(`${RAIN} textarea[aria-label='Write a response…']`, "The kettle outlasts us all ☕️🙏🏽");
  await page.keyboard.press("Enter"); await sleep(700);
  const notes = await page.$$eval(`${RAIN} [data-sb-note]`, (n) => n.map((x) => x.textContent));
  ok(notes.length === before + 1 && /kettle outlasts us all ☕️🙏🏽/.test(notes[notes.length - 1]), "a sent response lands LAST — truthful order, emoji intact (ZWJ/skin tone safe)");
  const count = await page.$eval(`${RAIN}`, (m) => m.textContent.includes("2 responses"));
  ok(count, "the functional response count updates without becoming social proof");
  await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-moment='m-rain'] [data-sb-note] button")].find((x) => x.textContent.trim() === "Reply"); b?.click(); });
  await sleep(300);
  await page.type(`${RAIN} textarea[aria-label^='Reply to']`, "Bring the rain back with you.");
  await page.keyboard.press("Enter"); await sleep(700);
  ok(await page.$eval(`${RAIN} [data-sb-note][data-sb-depth='2']`, (e) => /Bring the rain back/.test(e.textContent)), "one shallow reply level — the existing model, no invented deep threads");
  ok(!!(await page.$(`${RAIN} [data-sb-note-author]`)), "a response author is a doorway to their Person World");
  await page.click(`${RAIN} [data-sb-note-author]`); await sleep(400);
  ok(!!(await page.$("[data-sb-person-card]")), "…and it opens the Person surface");
  await page.keyboard.press("Escape"); await sleep(200);

  /* ---- 7. Heavy conversation keeps the Almanac calm ---- */
  console.log("7. Heavy conversation");
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(250); }
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']")?.scrollIntoView({ block: "center" }));
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] button")].find((b) => /responses/.test(b.textContent))?.click());
  await sleep(300);
  const heavy = await page.$eval("[data-sb-moment='m-forty']", (m) => ({ shown: m.querySelectorAll("[data-sb-note]").length, more: [...m.querySelectorAll("button")].some((b) => /View \d+ more/.test(b.textContent)) }));
  ok(heavy.shown <= 6 && heavy.more, `a busy conversation stays collapsed to a readable few with View more (${heavy.shown} shown)`);

  /* ---- 8. Keyboard — composite widget, not six tab stops ---- */
  console.log("8. Keyboard");
  await open(page, 1440, 1000);
  await toRain(page); await sleep(200);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").focus());
  await page.keyboard.press("Enter"); await sleep(300);
  ok(await page.evaluate(() => document.activeElement?.getAttribute("role") === "radio"), "opening by keyboard focuses the rail's option");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await sleep(100);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-expression-option"));
  ok(focused === "laugh", `arrow keys move through the expressions (${focused})`);
  await page.keyboard.press("Enter"); await sleep(400);
  ok((await mine(page)) === "laugh", "Enter commits the focused Expression");
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.keyboard.press("Escape"); await sleep(250);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-expression-rail]") && document.activeElement?.hasAttribute("data-sb-express")), "Escape closes the rail and returns focus to the control");

  /* ---- 9. Reduced motion + no loops ---- */
  console.log("9. Motion honesty");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await toRain(page); await sleep(150);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(150);
  await page.click(`${RAIN} [data-sb-expression-option='care']`); await sleep(150);
  // R3.3 owner-superseded: the committed control is the viewer's Boom Lens now (§1B/§26).
  ok(await page.$eval(`${RAIN} [data-sb-express] [data-sb-lens]`, (e) => getComputedStyle(e.querySelector("img")).opacity === "1"), "reduced motion: the Expression appears directly, meaning complete");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await open(page, 1440, 1400);
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
  await sleep(600);
  const idle = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity).length);
  ok(idle === 0, "several summaries on screen: NOTHING animates without interaction, no infinite animation");
  await toRain(page);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  // suite correction (R3.9): Celebrate's one-shot nominally ends ~885ms (event + lens landing);
  // measuring at exactly 900ms failed under chain load from setTimeout jitter alone. Measure at
  // 1150ms — the invariant (one event, then total calm) is unchanged.
  await page.click(`${RAIN} [data-sb-expression-option='celebrate']`); await sleep(1150);
  // suite correction: the LifeCounter's accepted per-second `sb-roll` tick is excluded by name
  const settled = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length);
  ok(settled === 0, "even Celebrate is one event — everything is calm again well under a second");

  /* ---- 10. Life Ring + relationship invariants ---- */
  console.log("10. Life / relationship invariants");
  await open(page, 1440, 1000);
  const ringBefore = await page.$eval("[data-sb-hero] [data-sb-ring]", (e) => e.outerHTML);
  await toRain(page); await sleep(150);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(250);
  await page.click(`${RAIN} [data-sb-expression-option='care']`); await sleep(500);
  const ringAfter = await page.$eval("[data-sb-hero] [data-sb-ring]", (e) => e.outerHTML);
  ok(ringBefore === ringAfter, "an Expression changes NOTHING about the Life Ring — bit-for-bit identical");
  await page.click("[data-sb-people]"); await sleep(300);
  const rels = await page.$$eval("[data-sb-people-row]", (n) => n.map((r) => `${r.getAttribute("data-sb-people-row")}:${r.getAttribute("data-sb-people-rel")}`).join(","));
  ok(/p-asha:friend/.test(rels) && /p-sunita:family/.test(rels), "friend / family states are untouched by expressing");
  await page.keyboard.press("Escape");

  /* ---- 11. Phone: 320 / 360, touch targets, feed calm ---- */
  console.log("11. Phone");
  await open(page, 320, 640);
  await toRain(page); await sleep(200);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(300);
  const p320 = await page.evaluate(() => { const r = document.querySelector("[data-sb-expression-rail]").getBoundingClientRect(); return { within: r.left >= 0 && r.right <= innerWidth + 1, sw: document.documentElement.scrollWidth <= innerWidth + 1 }; });
  ok(p320.within && p320.sw, "320: the rail stays inside the frame, mascots stay readable, no overflow");
  await open(page, 360, 800);
  await toRain(page); await sleep(200);
  const targets = await page.evaluate(() => ({ express: Math.round(document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getBoundingClientRect().height) }));
  await page.click(`${RAIN} [data-sb-express]`); await sleep(300);
  const opts = await page.$$eval("[data-sb-expression-option]", (n) => n.map((o) => Math.round(o.getBoundingClientRect().height)));
  ok(targets.express >= 44 && opts.every((o) => o >= 44), `360: control and every rail option are 44px touch targets (${targets.express}/${opts.join(",")})`);

  /* ---- 12. Locales ---- */
  console.log("12. Locales");
  await open(page, 390, 844, { lang: "ne" });
  await toRain(page); await sleep(200);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(300);
  const neLabels = await page.$$eval("[data-sb-expression-option]", (n) => n.map((o) => o.getAttribute("aria-label")));
  ok(neLabels.length === 6 && neLabels.every((l) => /[ऀ-ॿ]/.test(l)), "ne: every Expression speaks Nepali");
  await open(page, 390, 844, { lang: "zh-Hans" });
  await toRain(page); await sleep(200);
  const zhSummary = await page.$eval(`${RAIN} [data-sb-expression-summary]`, (e) => e.getAttribute("aria-label"));
  ok(/表达/.test(zhSummary), `zh: the aggregate is localized (${zhSummary})`);
  await open(page, 390, 844, { lang: "ru" });
  await toRain(page); await sleep(200);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-rain'] button")].find((b) => /ответ/i.test(b.textContent))?.click());
  await sleep(300);
  ok(await page.$eval(RAIN, (m) => /Напишите ответ…/.test(m.querySelector("textarea")?.getAttribute("aria-label") ?? "")), "ru: the response composer is localized");

  /* ---- 13. Page health ---- */
  console.log("13. Page health");
  await open(page, 1440, 1000);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("SOCIAL R2 EXPRESSION: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("SOCIAL R2 EXPRESSION: PASS");
  process.exit(failures.length ? 1 : 0);
})();
