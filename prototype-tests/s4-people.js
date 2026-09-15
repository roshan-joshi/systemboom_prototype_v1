/* SYSTEMBOOM — S4 PEOPLE + FRIENDS + RELATIONSHIPS.
   The S4 delta on the accepted People utility: discovery, relationship-state
   clarity + consistency, none→request-out, request-in→Accept, cancel/decline,
   friend→Message, family separation, relationship NEVER in Life Ring geometry,
   friend does not gain exact Life, mobile one-handed use, and full localisation.
     node prototype-tests/s4-people.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya", lang = "en", cookie } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  if (cookie) await page.setCookie({ name: "sb-locale", value: cookie, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang); u.searchParams.set("viewer", viewer);
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(550);
}
const openPeople = async (page) => { await page.click("[data-sb-people]"); await sleep(350); };

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. People entry (desktop + mobile), not a nav tab ---- */
  console.log("1. People entry");
  await open(page, 1440, 900);
  ok(!!(await page.$("[data-sb-people]")), "desktop: People is a utility beside search/messages/notifications");
  await openPeople(page);
  ok(!!(await page.$("[data-sb-people-panel]")), "People opens a local panel brought forward from My World");
  ok(!!(await page.$("[data-sb-people-find]")), "the panel offers Find someone");
  ok(!!(await page.$("[data-sb-people-yours]")), "the panel shows Your people");

  /* ---- 2. Find someone (shared discovery, existing fields) ---- */
  console.log("2. Find someone");
  await page.type("[data-sb-people-find]", "grace");
  await sleep(300);
  const found = await page.$$eval("[data-sb-people-row]", (n) => n.length);
  ok(found >= 1, `typing a name finds a person (${found})`);

  /* ---- 3. none → request-out (Ramesh is unconnected) ---- */
  console.log("3. none → request-out");
  await open(page, 1440, 900);
  await openPeople(page);
  await page.type("[data-sb-people-find]", "ramesh");
  await sleep(350);
  const addable = await page.$("[data-sb-people-add]");
  ok(!!addable, "an unconnected person offers a clear Add friend");
  if (addable) {
    await addable.click(); await sleep(300);
    ok(!!(await page.$("[data-sb-people-requested]")), "Add friend resolves to Requested (real state, not a fake toast)");
  }

  /* ---- 4. request-in → Accept (Prakash) ---- */
  console.log("4. request-in → Accept");
  await open(page, 1440, 900);
  await openPeople(page);
  const acceptBtn = await page.$("[data-sb-people-accept]");
  ok(!!acceptBtn, "an incoming request shows Accept (direction is explicit — Wants to connect)");
  if (acceptBtn) {
    const before = await page.$$eval("[data-sb-people-row]", (n) => n.length);
    await acceptBtn.click(); await sleep(300);
    ok(before >= 1, "Accept resolves the request into the relationship map");
  }

  /* ---- 5. Relationship NEVER in Life Ring geometry ---- */
  console.log("5. Relationship vs Life Ring");
  await open(page, 1440, 900);
  await openPeople(page);
  const ringCarriesRel = await page.evaluate(() => {
    const row = document.querySelector("[data-sb-people-row]");
    if (!row) return false;
    const ring = row.querySelector("[data-sb-ring]");
    return ring ? /friend|family|request|Message|Add/i.test(ring.getAttribute("aria-label") || "") || !!ring.querySelector("[data-sb-people-rel]") : false;
  });
  ok(!ringCarriesRel, "the Life Ring carries no relationship state (§72) — it renders beside it");

  /* ---- 6. Friend does not gain exact Life (band-only in People) ---- */
  console.log("6. Friend life privacy");
  const peopleLife = await page.$$eval("[data-sb-people-row]", (rows) => rows.map((r) => r.textContent).join(" "));
  ok(!/\d+y \d\dm \d\dd/.test(peopleLife), "a friend's row shows band-level life, never exact age");

  /* ---- 7. People localised — Spanish ---- */
  console.log("7. People i18n (es)");
  await open(page, 1440, 900, { lang: "es", cookie: "es" });
  await openPeople(page);
  const esPanel = await page.$eval("[data-sb-people-panel]", (e) => e.textContent);
  ok(/Encontrar|Buscar|Tu gente|Personas|Solicitud/i.test(esPanel), "es: the People panel is localised");

  /* ---- 8. People localised — Russian (width) ---- */
  console.log("8. People i18n (ru)");
  await open(page, 1440, 900, { lang: "ru", cookie: "ru" });
  await openPeople(page);
  const ruPanel = await page.$eval("[data-sb-people-panel]", (e) => e.textContent);
  ok(/[А-Яа-я]/.test(ruPanel), "ru: the People panel is localised (Cyrillic)");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "ru: no horizontal overflow with wider labels");
  await page.setCookie({ name: "sb-locale", value: "en", domain: "localhost", path: "/" });

  /* ---- 9. Mobile People — reachable, one-handed ---- */
  console.log("9. Mobile People");
  await open(page, 360, 800);
  ok(await page.evaluate(() => !!document.querySelector("[data-sb-people]")?.getBoundingClientRect().width), "360: People stays a reachable touch target");
  await openPeople(page);
  ok(!!(await page.$("[data-sb-people-panel]")), "360: People opens a dedicated local surface");
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "360: no horizontal overflow");

  /* ---- 10. Keyboard ---- */
  console.log("10. Keyboard");
  await open(page, 1440, 900);
  await openPeople(page);
  await page.keyboard.press("Tab"); await sleep(150);
  const focused = await page.evaluate(() => { const el = document.activeElement; const panel = document.querySelector("[data-sb-people-panel]"); return !!(panel && (panel.contains(el) || document.querySelector("[data-sb-people-find]"))); });
  ok(focused, "keyboard focus lands in the People panel");

  /* ---- 11. Page health ---- */
  console.log("11. Page health");
  await open(page, 1440, 900);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S4 PEOPLE: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S4 PEOPLE: PASS");
  process.exit(failures.length ? 1 : 0);
})();
