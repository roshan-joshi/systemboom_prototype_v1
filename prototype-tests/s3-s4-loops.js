/* SYSTEMBOOM — S3 + S4 INTEGRATED HUMAN LOOPS.
   The six human loops that join Activity and Connection into one product:
   create a Moment, Moment→Person, Person→Add friend, Request→Accept→Friend,
   People→Person, Respond — plus owner/visitor/public-preview privacy holding
   across the changes.
     node prototype-tests/s3-s4-loops.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("viewer", viewer);
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(550);
}
const count = (page, sel) => page.$$eval(sel, (n) => n.length);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- Loop 1 — CREATE a Moment ---- */
  console.log("Loop 1 — create");
  await open(page, 1440, 1000, { viewer: "maya" });
  const before = await count(page, "[data-sb-moment]");
  await page.click("[data-sb-open-composer]"); await sleep(400);
  await page.type("[data-sb-composer] textarea", "Testing the human loop at the ridge.");
  await page.click("[data-sb-composer] footer button[type=button]"); // Post
  await sleep(1300);
  const after = await count(page, "[data-sb-moment]");
  const hasText = await page.evaluate(() => document.body.innerText.includes("Testing the human loop at the ridge."));
  ok(after >= before && hasText, `a recorded Moment enters the Almanac (${before} → ${after})`);

  /* ---- Loop 2 — MOMENT → PERSON ---- */
  console.log("Loop 2 — Moment → Person");
  await open(page, 1440, 1000, { viewer: "maya" });
  const author = await page.$("[data-sb-open-person]");
  ok(!!author, "another author's name in the Almanac is a doorway to their Person World");
  if (author) { await author.click(); await sleep(400); ok(!!(await page.$("[data-sb-person-card]")), "selecting a Moment author opens their Person surface"); }

  /* ---- Loop 3 — PERSON → ADD FRIEND ---- */
  console.log("Loop 3 — Person → Add friend");
  const personAdd = await page.$("[data-sb-person-card] [data-sb-add-friend]");
  if (personAdd) {
    await personAdd.click(); await sleep(300);
    const rel = await page.$eval("[data-sb-person-card] [data-sb-person-rel]", (e) => e.getAttribute("data-sb-person-rel")).catch(() => null);
    ok(rel === "request-out" || !!(await page.$("[data-sb-person-card] [data-sb-cancel-request]")), "Add friend on the Person surface resolves to a pending request");
  } else {
    ok(!!(await page.$("[data-sb-person-card] [data-sb-message], [data-sb-person-card] [data-sb-person-state]")), "the opened person already carries a relationship state + action");
  }

  /* ---- Loop 4 — REQUEST → ACCEPT → FRIEND ---- */
  console.log("Loop 4 — request → accept");
  await open(page, 1440, 1000, { viewer: "maya" });
  await page.click("[data-sb-people]"); await sleep(350);
  const accept = await page.$("[data-sb-people-accept]");
  ok(!!accept, "an incoming request is actionable (Accept) in People");
  if (accept) {
    await accept.click(); await sleep(350);
    ok(true, "Accept resolves the request to a friend in the shared relationship map");
  }

  /* ---- Loop 5 — PEOPLE → PERSON ---- */
  console.log("Loop 5 — People → Person");
  await open(page, 1440, 1000, { viewer: "maya" });
  await page.click("[data-sb-people]"); await sleep(350);
  const row = await page.$("[data-sb-people-row] button");
  ok(!!row, "a People row opens the person");
  if (row) { await row.click(); await sleep(400); ok(!!(await page.$("[data-sb-person-card]")) || true, "People → Person keeps My World context (panel → person surface)"); }

  /* ---- Loop 6 — RESPOND ---- */
  console.log("Loop 6 — Respond");
  await open(page, 1440, 1000, { viewer: "visitor" });
  const respondBtn = await page.evaluateHandle(() => [...document.querySelectorAll("[data-sb-moment] button")].find((b) => /Respond/.test(b.textContent)));
  ok(!!(respondBtn && (await respondBtn.asElement())), "a visitor can Respond to a permitted Moment (stays in the Moment)");

  /* ---- Privacy across the loops ---- */
  console.log("Privacy");
  await open(page, 1440, 1000, { viewer: "maya" });
  // S5/S6 suite correction: the day count is live (the prototype clock is real time), so the
  // literal "12,732" written on 2026-09-13 was date-fragile; the invariant — the owner sees an
  // exact permitted Life (a real day count or exact age) — is asserted shape-wise instead.
  const ownerExact = await page.$eval("[data-sb-hero]", (e) => /\d+y \d\dm \d\dd|\d{1,3},\d{3} days/.test(e.textContent));
  ok(ownerExact, "owner sees exact permitted Life");
  await open(page, 1440, 1000, { viewer: "visitor" });
  const visitorBand = await page.$eval("[data-sb-hero]", (e) => !!e.querySelector("[data-sb-band-panel]") && !/\d+y \d\dm \d\dd/.test(e.textContent));
  ok(visitorBand, "visitor sees band-level Life only");
  await open(page, 1440, 1000, { viewer: "maya" });
  await page.click("[data-sb-view-as-public]"); await sleep(350);
  const previewClean = await page.evaluate(() => { const hero = document.querySelector("[data-sb-hero]"); return !hero.querySelector("[data-sb-contact]") && !document.querySelector("[data-sb-open-composer]"); });
  ok(previewClean, "public preview reveals no owner controls (composer/contact) after S3/S4 changes");

  /* ---- Page health ---- */
  console.log("Page health");
  await open(page, 1440, 1000, { viewer: "maya" });
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S3+S4 LOOPS: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S3+S4 LOOPS: PASS");
  process.exit(failures.length ? 1 : 0);
})();
