/* SYSTEMBOOM — S5 DISCOVERY + SIGNAL.
   Search is object-aware (a PERSON, a MOMENT and a PLACE look different and go
   to different things), Notifications are meaningful changes that take the
   reader straight to the object, and every loop returns to where it started.
     node prototype-tests/s5-discovery.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya", lang = "en", extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang); u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(550);
}
const typeInto = (page, sel, v) => page.evaluate((s, val) => { const i = document.querySelector(s); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); }, sel, v);
const search = async (page, v) => { await typeInto(page, "input[type=search]", v); await sleep(350); };
const REGION = "[role=region][aria-label='Search results']";
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Search opens / closes, calm zero state ---- */
  console.log("1. Search open / zero / close");
  await open(page, 1440, 900);
  await page.focus("input[type=search]"); await sleep(300);
  ok(!!(await page.$(REGION)), "focusing the field opens the anchored results surface");
  ok(!!(await page.$("[data-sb-search-zero]")) && /People, Moments and places/.test(await text(page, "[data-sb-search-zero]")), "zero state says what can be found — no trending, no suggested people");
  ok(!/trending|suggested|popular|recommended/i.test(await text(page, REGION)), "no recommendation vocabulary anywhere in the zero state");
  ok(!!(await page.$("[data-sb-scrim]")), "My World becomes quieter under the surface (one scrim, the same family as People/Notifications)");
  await page.keyboard.press("Escape"); await sleep(250);
  ok(!(await page.$(REGION)) && !(await page.$("[data-sb-scrim]")), "Escape closes the results and the scrim");

  /* ---- 2. Three objects, three shapes ---- */
  console.log("2. People / Moments / Places are distinct");
  await search(page, "Federico");
  const person = await page.$eval("[data-sb-search-person]", (e) => ({ ring: !!e.querySelector("[data-sb-ring]"), life: e.querySelector("[data-sb-search-life]")?.textContent ?? "", date: /\d{2} [A-Z]{3} \d{4}/.test(e.textContent) }));
  ok(person.ring && /Family/.test(person.life) && !person.date, `a person result: photo + Life Ring, name, safe band, relationship — no date (${person.life})`);
  await search(page, "Boudha");
  const moment = await page.$eval("[data-sb-search-moment]", (e) => ({ ring: !!e.querySelector("[data-sb-ring]"), date: /\d{2} [A-Z]{3} \d{4}/.test(e.textContent), place: /Kathmandu|Boudhanath/.test(e.textContent) }));
  ok(moment.ring && moment.date && moment.place, "a Moment result: the words lead, then the person and the date · place coordinate");
  const place = await page.$eval("[data-sb-search-place]", (e) => ({ ring: !!e.querySelector("[data-sb-ring]"), pin: !!e.querySelector("svg"), tally: /\d+ Moments?|no Moments recorded/.test(e.textContent) }));
  ok(!place.ring && place.pin && place.tally, "a place result leads with the place and its recorded-life tally — no person avatar, no map UI");
  const photoText = await page.$$eval("[data-sb-search-photo]", (n) => n.map((b) => b.textContent.trim()));
  ok(photoText.length > 0 && photoText.every((d) => /^\d{2} [A-Z]{3} \d{4}$/.test(d)), `media-led Moments keep the accepted date-only grammar (${photoText.join(" | ")})`);
  const groups = await page.$$eval(`${REGION} p.uppercase`, (n) => n.map((p) => p.textContent.trim()));
  ok(groups.length >= 3 && new Set(groups).size === groups.length, `mixed results are grouped by object type (${groups.join(", ")})`);

  /* ---- 3. Honest no-results ---- */
  console.log("3. No results");
  await search(page, "zzqx");
  ok(!!(await page.$("[data-sb-search-empty]")) && /Nothing for/.test(await text(page, "[data-sb-search-empty]")), "no results is stated honestly");
  ok(!/suggest|try also|you may/i.test(await text(page, REGION)), "no fake suggestions");
  await page.$eval("[data-sb-search-empty] button", (b) => b.click()); await sleep(250);
  ok(!!(await page.$("[data-sb-search-zero]")), "the one next step (Clear) returns to the calm zero state");

  /* ---- 4. Search keeps privacy ---- */
  console.log("4. Privacy");
  await open(page, 1440, 900, { viewer: "visitor" });
  await search(page, "Giulia");
  const vis = await text(page, REGION);
  ok(/30–45/.test(vis) && !/\d+y \d\dm/.test(vis), "a visitor's search keeps another person band-only");

  /* ---- 5. Search → Person, and back with the query intact ---- */
  console.log("5. Search → Person → back");
  await open(page, 1440, 900);
  await search(page, "Marco");
  await page.click("[data-sb-search-person]"); await sleep(400);
  ok(!!(await page.$("[data-sb-person-card='p-ramesh']")), "selecting a person opens their Person surface");
  ok(!(await page.$(REGION)), "…the results step aside for it (one layer at a time)");
  await page.keyboard.press("Escape"); await sleep(400);
  // Return context without a trap: focus lands back in the field with the query intact, but the
  // results (and their scrim) do NOT re-open on their own — My World stays fully clickable
  // (the accepted complete-my-world flow clicks a Moment author right after this). One click on
  // the field brings the same results straight back.
  const back = await page.evaluate(() => ({ field: document.activeElement?.matches("input[type=search]"), q: document.querySelector("input[type=search]")?.value, region: !!document.querySelector("[role=region][aria-label='Search results']"), scrim: !!document.querySelector("[data-sb-scrim]") }));
  ok(back.field && back.q === "Marco" && !back.region && !back.scrim, `closing the person returns focus to Search with the query kept, nothing re-opened over My World (${JSON.stringify(back)})`);
  await page.click("input[type=search]"); await sleep(300);
  ok(!!(await page.$("[data-sb-search-person='p-ramesh']")), "…and one touch on the field restores the same results");
  await page.keyboard.press("Escape");

  /* ---- 6. Search → Moment (loaded, and one that had to be revealed) ---- */
  console.log("6. Search → Moment");
  await search(page, "Boudha");
  const target = await page.$eval("[data-sb-search-moment]", (e) => e.getAttribute("data-sb-search-moment"));
  await page.click("[data-sb-search-moment]"); await sleep(900);
  const landed = await page.evaluate((id) => { const a = document.activeElement; const m = a?.closest("[data-sb-moment]"); return { readout: a?.hasAttribute("data-sb-readout"), same: m?.getAttribute("data-sb-moment") === id, region: !!document.querySelector("[role=region][aria-label='Search results']") }; }, target);
  ok(landed.readout && landed.same && !landed.region, `a Moment result goes straight to that Moment in the Almanac — focus on its readout, results closed (${target})`);
  // A media-led historical Moment — a Photos result, well beyond the first eight. (Phase 4.4-A owner
  // fixture add-on: m-1983 is re-dated and carries no photo, so the wedding prints of 2022 are the
  // deep media-led Moment now.)
  await search(page, "wedding day");
  const deep = "m-wedding";
  const wasLoaded = await page.$(`[data-sb-moment='${deep}']`);
  ok(!!(await page.$("[data-sb-search-photo]")), "a media-led Moment surfaces as a Photos result");
  await page.click("[data-sb-search-photo]"); await sleep(1000);
  const revealed = await page.evaluate((id) => { const el = document.querySelector(`[data-sb-moment='${id}']`); const r = el?.getBoundingClientRect(); return { present: !!el, focused: document.activeElement?.closest("[data-sb-moment]")?.getAttribute("data-sb-moment") === id, inView: !!r && r.top < window.innerHeight && r.bottom > 0 }; }, deep);
  ok(!wasLoaded && revealed.present && revealed.focused && revealed.inView, `a Moment beyond the loaded window is revealed and landed on, not routed through another page (${deep})`);

  /* ---- 7. Notifications: human event grammar ---- */
  console.log("7. Notifications");
  await open(page, 1440, 900, { extra: { bell: "1" } });
  ok(!!(await page.$("[data-sb-notifications]")) && !!(await page.$("[data-sb-scrim]")), "Notifications is a transient surface over a quiet My World");
  const req = await page.$eval("[data-sb-notification-request]", (e) => ({ ring: !!e.querySelector("[data-sb-ring]"), accept: !!e.querySelector("[data-sb-notif-accept]"), decline: !!e.querySelector("[data-sb-notif-decline]"), band: /band \d+–\d+/.test(e.textContent) }));
  ok(req.ring && req.accept && req.decline && !req.band, "a request: the person (photo + Life Ring) leads, Accept / Decline beside, no band label");
  const rows = await page.$$eval("[data-sb-notification-moment]", (n) => n.map((b) => ({ coord: /\d{2} [A-Z]{3} \d{4}/.test(b.querySelector("[data-sb-notification-coord]")?.textContent ?? ""), thumb: !!b.querySelector("img"), ring: !!b.querySelector("[data-sb-ring]") })));
  ok(rows.length >= 3 && rows.every((r) => r.coord && r.ring) && rows.some((r) => r.thumb), `a Moment event names the Moment by its own date · place and shows its image where it has one (${rows.filter((r) => r.thumb).length}/${rows.length} with media)`);
  const unreadBefore = await text(page, "[data-sb-notifications] span.tabular-nums");
  ok(/4 unread/.test(unreadBefore), `unread state is restrained: a count and a small mark, no bright rows (${unreadBefore})`);
  const dotAnim = await page.$$eval("[data-sb-notifications] .bg-\\[var\\(--boom\\)\\]", (n) => n.map((e) => getComputedStyle(e).animationName));
  ok(dotAnim.length > 0 && dotAnim.every((a) => a === "none"), "no pulse on any unread mark");

  /* ---- 8. Request resolves in place ---- */
  console.log("8. Request → Accept in place");
  const firstBefore = await page.$eval("[data-sb-notifications] li", (li) => !!li.querySelector("[data-sb-notification-request]"));
  await page.click("[data-sb-notif-accept]"); await sleep(400);
  const firstAfter = await page.$eval("[data-sb-notifications] li", (li) => ({ still: !!li.querySelector("[data-sb-notification-request]"), outcome: li.querySelector("[data-sb-notif-outcome]")?.textContent ?? "" }));
  ok(firstBefore && firstAfter.still && /Now friends/.test(firstAfter.outcome), "Accept resolves truthfully in the same row — the list does not jump");

  /* ---- 9. Notification → Person, and back to the same row ---- */
  console.log("9. Notification → Person → back");
  await page.$eval("[data-sb-notification-request] button", (b) => b.click()); await sleep(400);
  ok(!!(await page.$("[data-sb-person-card='p-prakash']")) && !!(await page.$("[data-sb-notifications]")), "a person event opens the Person surface over the still-open Notifications");
  await page.keyboard.press("Escape"); await sleep(400);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-person-card]") && !!document.activeElement?.closest("[data-sb-notifications]")), "closing the person returns focus into Notifications, where the reader was");

  /* ---- 10. Notification → Moment ---- */
  console.log("10. Notification → Moment");
  await page.click("[data-sb-notification-moment='m-panorama']"); await sleep(900);
  const nm = await page.evaluate(() => ({ panel: !!document.querySelector("[data-sb-notifications]"), focused: document.activeElement?.closest("[data-sb-moment]")?.getAttribute("data-sb-moment"), settled: document.querySelector("[data-sb-moment='m-panorama']")?.hasAttribute("data-sb-focused") || true }));
  ok(!nm.panel && nm.focused === "m-panorama", `a Moment event takes the reader straight to that exact Moment (${nm.focused})`);
  await page.click("[data-sb-bell]"); await sleep(350);
  const unreadAfter = await text(page, "[data-sb-notifications] span.tabular-nums");
  ok(/2 unread/.test(unreadAfter), `opening it marks it read — the count is the truth (${unreadAfter})`);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-notifications] button")].find((b) => /Mark all read/.test(b.textContent))?.click()); await sleep(200);
  ok(!(await page.$("[data-sb-unread-dot]")), "Mark all read clears the bell's mark");

  /* ---- 11. Empty ---- */
  console.log("11. Empty");
  await open(page, 1440, 900, { extra: { bell: "1", notifications: "empty" } });
  ok(/Nothing new\./.test(await text(page, "[data-sb-notifications]")) && !/invite|share|follow/i.test(await text(page, "[data-sb-notifications]")), "empty notifications stay calm — no engagement prompt");

  /* ---- 12. People → Person → back to the row ---- */
  console.log("12. People → Person → back");
  await open(page, 1440, 900);
  await page.click("[data-sb-people]"); await sleep(350);
  await page.click("[data-sb-people-yours] [data-sb-people-row] button"); await sleep(400);
  ok(!!(await page.$("[data-sb-person-card]")) && !!(await page.$("[data-sb-people-panel]")), "a People row opens the person over the still-open People");
  await page.keyboard.press("Escape"); await sleep(400);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-person-card]") && !!document.activeElement?.closest("[data-sb-people-panel]")), "closing the person returns focus to the row in People");

  /* ---- 13. One surface at a time ---- */
  console.log("13. Exclusivity");
  await page.click("[data-sb-bell]"); await sleep(300);
  ok(!!(await page.$("[data-sb-notifications]")) && !(await page.$("[data-sb-people-panel]")), "opening Notifications closes People");
  await page.focus("input[type=search]"); await sleep(300);
  ok(!!(await page.$(REGION)) && !(await page.$("[data-sb-notifications]")), "opening Search closes Notifications");
  ok((await page.$$eval("[data-sb-scrim]", (n) => n.length)) === 1, "exactly one scrim");
  await page.keyboard.press("Escape");

  /* ---- 14. Mobile search + notifications ---- */
  console.log("14. Mobile");
  await open(page, 360, 800);
  await page.click("[data-sb-search-toggle]"); await sleep(400);
  ok(await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-search-input")), "360: Search opens a local surface with the keyboard ready (field focused)");
  await typeInto(page, "[data-sb-search-input]", "Boudha"); await sleep(350);
  ok(!!(await page.$("[data-sb-search-moment]")) && !!(await page.$("[data-sb-search-clear]")) && (await noHScroll(page)), "360: results, a Clear control, no horizontal overflow");
  await page.click("[data-sb-search-back]"); await sleep(300);
  ok(await page.evaluate(() => !document.querySelector("[role=region][aria-label='Search results']") && document.activeElement?.hasAttribute("data-sb-search-toggle")), "360: Back closes the surface and returns focus to the Search control");
  await open(page, 360, 800, { extra: { bell: "1" } });
  const mob = await page.evaluate(() => { const a = document.querySelector("[data-sb-notif-accept]"); const r = a?.getBoundingClientRect(); const s = document.querySelector("[data-sb-notifications]")?.getBoundingClientRect(); return { h: r ? Math.round(r.height) : 0, inView: !!s && s.top >= 0 && s.bottom <= window.innerHeight + 1 }; });
  ok(mob.h >= 36 && mob.inView && (await noHScroll(page)), `360: Notifications fits under the bar, Accept is a thumb target (${mob.h}px), no overflow`);

  /* ---- 15. Localised — Spanish, Russian, Nepali ---- */
  console.log("15. Languages");
  await open(page, 1440, 900, { lang: "es" });
  await page.focus("input[type=search]"); await sleep(300);
  ok(/Personas, Momentos/.test(await text(page, "[data-sb-search-zero]")), "es: the search zero state is localised");
  await open(page, 1440, 900, { lang: "ru", extra: { bell: "1" } });
  ok(/[А-Яа-я]/.test(await text(page, "[data-sb-notifications] p.uppercase")) && /[А-Яа-я]/.test(await text(page, "[data-sb-notif-accept]")), "ru: Notifications chrome and actions are localised");
  await open(page, 1440, 900, { lang: "ne" });
  await page.click("[data-sb-people]"); await sleep(350);
  await page.click("[data-sb-people-yours] [data-sb-people-row] button"); await sleep(400);
  const card = await text(page, "[data-sb-person-card]");
  ok(card.length > 0 && !/Add Friend|Friends|Family|Message|Remove|Circle band|Not connected|theirs to share/.test(card), `ne: the Person surface — the destination of every loop — carries no English (${card.slice(0, 60)}…)`);
  ok(/Giulia|Luca|Sofia|Elena|Federico|Marco|Chiara|Matteo|Aurora|Andrea|Camilla|Francesca|Martina|Beatrice|Alice/.test(card), "ne: the person's own name stays original");
  await page.keyboard.press("Escape");

  /* ---- 16. Page health ---- */
  console.log("16. Page health");
  await open(page, 1440, 900);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S5 DISCOVERY: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S5 DISCOVERY: PASS");
  process.exit(failures.length ? 1 : 0);
})();
