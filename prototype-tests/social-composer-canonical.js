/**
 * UNIVERSAL SOCIAL POST COMPOSER — CANONICAL WORKBOOK ACCEPTANCE.
 *
 * Tests are derived from references/social-composer/CANONICAL-COMPOSER-FIELD-CONTRACT.md
 * (built from ALL 50 sheets of `references/8 Task details.xlsx`), NOT from prior suites
 * (master prompt §100). Every CURRENT contract row is either asserted here / in
 * social-composer.js, or explicitly classified OUT-OF-COMPOSER / FUTURE-SEAM in the
 * contract — no silent omissions. UC-C3 re-pointed the WIRING to the new interaction
 * layer (sheets, pickers, "+ Field" chips); every stored truth is asserted unchanged.
 *
 *   node prototype-tests/social-composer-canonical.js        (dev server on :3210)
 *
 * C1 COMMON — cover selection; place precision; the canonical depth labels
 * C2 TIME (§18) — month/year/approximate grammar; unknown ⇒ UNPLACED; no fabricated
 *    clock/exact-age under a coarse claim
 * C3 LIFE MOMENT — Story + Chapter capture at record depth, never rendered socially
 * C4 MEAL — canonical 8 contexts; custom occasion; structured food items; record depth
 * C5 ACTIVITY — per-subtype adaptive More fields; values survive subtype switches
 * C6 HEALTH — 17 canonical types; type-adaptive measurement/medication capture;
 *    the §22 shared-vs-private grouping; record depth never rendered
 * C7 PROBLEM — urgency ≠ impact; attempt ≠ next action; Status=Open internal
 * C8 PROJECT — Status default active (never asked); Target captured
 * C9 MEETING — Social Basic holds: no mode list, no workspace
 * C10 RECLASSIFICATION (§74) — kind change preserves media/time/place/audience
 * C11 LOCALIZATION — the canonical surfaces speak the locale (ne)
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };

async function open(page, vp = DESKTOP, theme = "light", locale = "en", extra = "") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  // PHASE C mock-safety (same owner-approved Option A as social-composer.js): composer
  // flows here attach photos; `mockai=nonfood` keeps the broadened photo trigger off the
  // real provider and guarantees zero category side effects. Nothing else reads `mockai`.
  await page.goto(`${B}&theme=${theme}&mockai=nonfood${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const setField = (page, hook, v) => page.evaluate((h, x) => { const el = document.querySelector(`[data-sb-ufield='${h}']`); const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, x); el.dispatchEvent(new Event("input", { bubbles: true })); }, hook, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1300); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(350); };
const more = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-more-toggle]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(300); };
const chip = async (page, group, text) => { await page.evaluate((g, t2) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button`)].find((b) => b.textContent.trim() === t2)?.click(), group, text); await sleep(250); };
const addField = async (page, key) => { await page.evaluate((k) => document.querySelector(`[data-sb-add-field='${k}']`)?.click(), key); await sleep(200); };
const actType = async (page, text) => { await page.evaluate(() => (document.querySelector("[data-sb-activity-more-types]") ?? document.querySelector("[data-sb-activity-change]"))?.click()); await sleep(300); await chip(page, "activityType", text); };
// UC-C3 §42 — the When control collapses to its truth; Change opens the editor.
const whenOpen = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-when-change]")?.click()); await sleep(250); };
const setWhen = async (page, v) => { await whenOpen(page); await page.evaluate((x) => { const i = document.querySelector("[data-sb-when] input[type=date]"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, x); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }, v); await sleep(250); };
const pickMedia = async (page, alts) => {
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
  await sleep(300);
  await page.click("[data-sb-media-source='mymedia']");
  await sleep(350);
  await page.evaluate((names) => {
    const grid = document.querySelector("[data-sb-mymedia-grid]");
    for (const n of names) [...grid.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click();
  }, alts);
  await sleep(200);
  await page.click("[data-sb-mymedia-add]");
  await sleep(350);
};
const settleMeta = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click()); await sleep(200); };
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
const momentEl = (page, text) => page.evaluate((t2) => { const el = [...document.querySelectorAll("[data-sb-moment]")].find((m) => m.textContent.includes(t2)); if (!el) return null; return { text: el.textContent.replace(/\s+/g, " "), rule: el.querySelector("[data-sb-date-rule] h3")?.textContent.trim() ?? null, readout: el.querySelector("[data-sb-readout]")?.textContent.replace(/\s+/g, " ") ?? null }; }, text);
const discard = async (page) => { await page.keyboard.press("Escape"); await sleep(250); await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Discard")?.click()); await sleep(400); };

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ================= C1 COMMON ================= */
    console.log("C1 common — cover · place precision · depth labels");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await pickMedia(page, ["Nyatapola temple, Bhaktapur", "A rain-wet hiti courtyard in Kathmandu"]);
    const thumbsBefore = await page.$$eval("[data-sb-media-collage] [data-sb-thumb]", (n) => n.map((x) => x.getAttribute("data-sb-thumb")));
    ok(thumbsBefore.length === 2, `two assets attached (${thumbsBefore.length})`);
    // §12/§16 — cover lives in the organizer
    await page.click("[data-sb-media-edit]");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-make-cover='1']")?.click());
    await sleep(250);
    const thumbsAfter = await page.$$eval("[data-sb-organizer-list] [data-sb-thumb]", (n) => n.map((x) => x.getAttribute("data-sb-thumb")));
    ok(thumbsAfter[0] === thumbsBefore[1] && thumbsAfter[1] === thumbsBefore[0], "Make cover moves the chosen asset to the lead position (§12 — the lead IS the cover)");
    await page.click("[data-sb-sheet-panel='organizer'] [data-sb-sheet-back]");
    await sleep(250);
    // place + precision (the Place picker)
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(300);
    await page.evaluate(() => { const i = document.getElementById("sb-place-common"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "Bologna"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(250);
    ok(await page.$("[data-sb-chipselect='placePrecision']") !== null, "a stated place offers its precision (§17)");
    await chip(page, "placePrecision", "City or region");
    await page.click("[data-sb-place-done]");
    await sleep(250);
    await settleMeta(page);
    await setText(page, "Cover and place precision proof");
    await post(page);
    const c1m = await newest(page);
    ok(c1m?.placePrecision === "cityRegion", `place precision stored on the record (${c1m?.placePrecision})`);
    ok(c1m?.media?.kind === "photos" && c1m.media.items.length === 2, "both assets posted in the chosen order");
    // depth labels (§21 — never LEVEL 1/2/3; UC-C3 §67 — per-domain depth, no universal Advanced)
    await openComposer(page);
    await kind(page, "Meal");
    const moreLabel = await page.evaluate(() => document.querySelector("[data-sb-more-toggle]")?.textContent.trim());
    ok(moreLabel === "› More details", `the second depth is called "More details" (“${moreLabel}”)`);
    await more(page);
    // UC-C3 supersession (recorded): the universal "Advanced details" accordion is retired —
    // deeper capture is a DELIBERATE per-domain editor (§67); the structured food items
    // wait behind their own "+ Foods & drinks".
    ok(await page.evaluate(() => !document.querySelector("[data-sb-advanced-toggle]") && !!document.querySelector("[data-sb-add-field='foodItems']")), "no universal Advanced drawer — deeper capture is deliberate, per domain (§3/§67)");
    ok(await page.evaluate(() => !document.body.textContent.match(/LEVEL [123]|\d+% complete/)), "no LEVEL numbers, no completion percentages (§21)");
    await discard(page);

    /* ================= C2 TIME (§18) ================= */
    console.log("C2 time — coarse precision grammar + UNPLACED");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Life Moment");
    await more(page);
    await setWhen(page, "2019-07-14");
    const precChips = await page.$$eval("[data-sb-chipselect='timePrecision'] button", (n) => n.map((x) => x.textContent.trim()).join("|"));
    ok(precChips === "Exact date|Month|Year|Approximate", `the §18 precisions are offered (${precChips})`);
    await chip(page, "timePrecision", "Month");
    await setText(page, "Month-known memory canonical");
    await post(page);
    const mMonth = await newest(page);
    ok(mMonth?.timePrecision === "month" && mMonth.at === "2019-07-14T12:00:00" && mMonth.atPrecision === "day", "month claim stored: anchor kept, precision truthful");
    const elMonth = await momentEl(page, "Month-known memory canonical");
    ok(elMonth?.rule === "JUL 2019", `a month claim never prints a day (“${elMonth?.rule}”)`);
    ok(!/\d{1,2}y \d{1,2}m \d{1,2}d/.test(elMonth?.readout ?? ""), "no exact-age claim under a coarse date");
    // year
    await openComposer(page); await kind(page, "Life Moment"); await more(page);
    await setWhen(page, "2015-03-10"); await chip(page, "timePrecision", "Year");
    await setText(page, "Year-known memory canonical"); await post(page);
    const elYear = await momentEl(page, "Year-known memory canonical");
    ok(elYear?.rule === "2015", `a year claim prints the year only (“${elYear?.rule}”)`);
    // approximate
    await openComposer(page); await kind(page, "Life Moment"); await more(page);
    await setWhen(page, "2012-05-20"); await chip(page, "timePrecision", "Approximate");
    await setText(page, "Approximate memory canonical"); await post(page);
    const elApprox = await momentEl(page, "Approximate memory canonical");
    ok(elApprox?.rule === "around 20 MAY 2012", `an approximate claim says so (“${elApprox?.rule}”)`);
    // unknown ⇒ UNPLACED
    const monthCount = () => page.evaluate(() => { const t2 = document.querySelector("[data-sb-circle]")?.textContent ?? ""; const m = t2.match(/(\d+) moments? recorded this month/); return m ? m[1] : /No moments recorded this month/.test(t2) ? "0" : null; });
    const monthLineBefore = await monthCount();
    await openComposer(page); await kind(page, "Life Moment"); await more(page);
    await whenOpen(page);
    await page.evaluate(() => document.querySelector("[data-sb-time-unknown]")?.click());
    await sleep(250);
    ok(await page.evaluate(() => document.querySelector("[data-sb-time-unknown]")?.getAttribute("aria-pressed") === "true" && !document.querySelector("[data-sb-when] input[type=date]")), "“I don't know” is a stated claim — the date field yields to it (§42)");
    ok((await page.evaluate(() => document.querySelector("[data-sb-when-value]")?.textContent.trim())) === "Date unknown", "the When control states Date unknown");
    await setText(page, "Unplaced memory canonical"); await post(page);
    const mUnknown = await newest(page);
    ok(mUnknown?.timePrecision === "unknown", "the unknown claim is stored");
    const elUnknown = await momentEl(page, "Unplaced memory canonical");
    ok(elUnknown?.rule === "Date unknown", `the heading says the truth (“${elUnknown?.rule}”)`);
    ok(!/\d{2}:\d{2}/.test(elUnknown?.readout ?? ""), "no recording clock is claimed as the event time");
    ok(!/\d{1,2}y \d{1,2}m/.test(elUnknown?.readout ?? "") && !/15–30|30–45/.test(elUnknown?.readout ?? ""), "no life position at all for an unknown date");
    const monthLineAfter = await monthCount();
    ok(monthLineBefore !== null && monthLineBefore === monthLineAfter, `UNPLACED: the unknown record never lands at a fabricated Circle coordinate (this month ${monthLineBefore} → ${monthLineAfter})`);

    /* ================= C3 LIFE MOMENT ================= */
    console.log("C3 life moment — story + chapter at record depth");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Life Moment");
    await more(page);
    await addField(page, "story");
    await setField(page, "story", "The longer account of that afternoon, kept for the record.");
    await addField(page, "chapter");
    await setField(page, "chapter", "Bologna years");
    await setText(page, "Story chapter proof");
    await post(page);
    const c3m = await newest(page);
    ok(c3m?.fields?.story?.includes("longer account") && c3m?.fields?.chapter === "Bologna years", "Story and Chapter are stored on the Human Record");
    const c3el = await momentEl(page, "Story chapter proof");
    ok(!!c3el && !c3el.text.includes("longer account") && !c3el.text.includes("Bologna years"), "record depth never renders in the Social projection (MOMENT-007)");

    /* ================= C4 MEAL ================= */
    console.log("C4 meal — canonical contexts · custom occasion · structured items");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Meal");
    const ctxNone = await page.$("[data-sb-ufield='occasionCustom']");
    ok(ctxNone === null, "no custom-occasion field until Other is chosen");
    await chip(page, "occasion", "Other");
    ok(await page.$("[data-sb-ufield='occasionCustom']") !== null, "Occasion = Other opens the person's own wording (no forced taxonomy)");
    await setField(page, "occasionCustom", "Iftar");
    await more(page);
    const ctxChips = await page.$$eval("[data-sb-chipselect='context'] button", (n) => n.map((x) => x.textContent.trim()).join("|"));
    ok(ctxChips === "Home cooked|Restaurant · Café|Takeaway · Delivery|Packaged|Work · School|Event · Party|Travel|Other", `the canonical eight contexts (${ctxChips})`);
    await chip(page, "context", "Packaged");
    await addField(page, "preparation");
    await setField(page, "preparation", "grilled");
    await addField(page, "cost");
    await setField(page, "cost", "12 EUR");
    // UC-C3 §46 — the structured items are a deliberate editor behind "+ Foods & drinks"
    await addField(page, "foodItems");
    ok(await page.$("[data-sb-fooditems]") !== null, "“+ Foods & drinks” opens the structured item editor (13_MEAL_FIELDS / §46)");
    await page.evaluate(() => document.querySelector("[data-sb-add-item]")?.click());
    await sleep(150);
    await page.evaluate(() => document.querySelector("[data-sb-add-item]")?.click());
    await sleep(150);
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-sb-fooditem]")];
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      const fill = (el, v) => { set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
      fill(rows[0].querySelectorAll("input")[0], "Dal bhat");
      fill(rows[0].querySelectorAll("input")[1], "1 plate");
      fill(rows[1].querySelectorAll("input")[0], "Lassi");
    });
    await sleep(250);
    await setText(page, "Structured meal proof");
    await post(page);
    const c4m = await newest(page);
    ok(Array.isArray(c4m?.fields?.foodItems) && c4m.fields.foodItems.length === 2 && c4m.fields.foodItems[0].name === "Dal bhat" && c4m.fields.foodItems[0].quantity === "1 plate", "the item list is structured, never flattened into one string");
    ok(c4m?.fields?.occasionCustom === "Iftar" && c4m?.fields?.preparation === "grilled" && c4m?.fields?.cost === "12 EUR" && c4m?.fields?.context === "packaged", "custom occasion + preparation + cost + canonical context stored");
    const c4el = await momentEl(page, "Structured meal proof");
    ok(!!c4el && !c4el.text.includes("12 EUR") && !c4el.text.includes("grilled"), "cost and preparation stay at record depth (sensitive, never auto-published)");

    /* ================= C5 ACTIVITY ================= */
    console.log("C5 activity — per-subtype adaptive fields");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Activity");
    await actType(page, "Gym");
    await more(page);
    ok(await page.$("[data-sb-add-field='exercises']") !== null, "Gym offers Exercises (04)");
    await addField(page, "exercises");
    await setField(page, "exercises", "squat, bench, row");
    await actType(page, "Swimming");
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-chipselect='water']") && !!document.querySelector("[data-sb-add-field='laps']") && !!document.querySelector("[data-sb-add-field='stroke']")), "Swimming offers pool/open water · laps · stroke");
    await actType(page, "Travel");
    ok(await page.$("[data-sb-add-field='transport']") !== null, "Travel offers Transport");
    await actType(page, "Gym");
    const kept = await page.$eval("[data-sb-ufield='exercises']", (el) => el.value);
    ok(kept === "squat, bench, row", "subtype switching never loses entered work (§26)");
    await addField(page, "purpose");
    await setField(page, "purpose", "strength block");
    await addField(page, "felt");
    await setField(page, "felt", "strong");
    await setText(page, "Gym session proof");
    await post(page);
    const c5m = await newest(page);
    ok(c5m?.fields?.exercises === "squat, bench, row" && c5m?.fields?.purpose === "strength block" && c5m?.fields?.felt === "strong", "exercises + purpose + feeling stored on the record");
    const c5el = await momentEl(page, "Gym session proof");
    ok(!!c5el && !c5el.text.includes("squat, bench"), "training detail is record depth, not the Social card");

    /* ================= C6 HEALTH ================= */
    console.log("C6 health — 17 types · adaptive capture · §22 grouping");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Health");
    // UC-C3 §47 — the canonical types live in the focused picker, common six first
    await page.evaluate(() => document.querySelector("[data-sb-health-choose]")?.click());
    await sleep(300);
    ok((await page.$$eval("[data-sb-chipselect='healthType'] button", (n) => n.length)) === 6, "the picker leads with the common six (§47)");
    await page.evaluate(() => document.querySelector("[data-sb-healthtype-more]")?.click());
    await sleep(200);
    const htChips = await page.$$eval("[data-sb-chipselect='healthType'] button", (n) => n.map((x) => x.textContent.trim()));
    ok(htChips.length === 17, `the canonical Health record types are all offered (${htChips.length})`);
    ok(["Symptom", "Condition", "Diagnosis", "Medication", "Measurement", "Imaging", "Vaccination", "Mental wellbeing"].every((x) => htChips.includes(x)), "including the clinical set (38_HEALTH_FIELDS)");
    ok(!htChips.includes("Episode") && !htChips.includes("Health Episode"), "Health Episode stays a grouping layer, never a quick-capture type (HEALTH-010)");
    await chip(page, "healthType", "Measurement");
    await more(page);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-shared-group]") && !!document.querySelector("[data-sb-private-group]")), "the §22 boundary is stated in place: Shared in this post vs Private health details");
    ok(await page.$("[data-sb-health-adaptive='measurement']") !== null, "Measurement adapts: value + unit");
    await setField(page, "measureValue", "72");
    await setField(page, "measureUnit", "kg");
    await setText(page, "Measurement record proof");
    await post(page);
    const c6m = await newest(page);
    ok(c6m?.fields?.measureValue === "72" && c6m?.fields?.measureUnit === "kg" && c6m?.recordPrivacy === "private", "value + original unit stored; the record is owner-private (§28)");
    const c6el = await momentEl(page, "Measurement record proof");
    ok(!!c6el && !c6el.text.includes("72") && !c6el.text.includes("kg"), "clinical depth never renders in the Social projection");
    // medication adapts too
    await openComposer(page); await kind(page, "Health");
    await page.evaluate(() => document.querySelector("[data-sb-health-choose]")?.click());
    await sleep(300);
    await chip(page, "healthType", "Medication");
    await more(page);
    ok(await page.$("[data-sb-health-adaptive='medication']") !== null, "Medication adapts: identity only (prescription/plan/intake are live layers)");
    await discard(page);

    /* ================= C7 PROBLEM ================= */
    console.log("C7 problem — urgency ≠ impact · attempt ≠ next action");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await kind(page, "Problem");
    await more(page);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-add-field='impact']") && !!document.querySelector("[data-sb-add-field='urgency']")), "impact and urgency are separate optional dimensions");
    await addField(page, "urgency");
    await setField(page, "urgency", "this week");
    await addField(page, "attempt");
    await setField(page, "attempt", "restarted the router twice");
    await addField(page, "nextAction");
    await setField(page, "nextAction", "call the provider");
    await setText(page, "Internet keeps dropping canonical");
    await post(page);
    const c7m = await newest(page);
    ok(c7m?.fields?.status === "open" && c7m?.fields?.urgency === "this week", "Status=Open internal; urgency stored");
    ok(c7m?.fields?.attempt === "restarted the router twice" && c7m?.fields?.nextAction === "call the provider", "attempt (tried) and next action (intent) stored as distinct facts");

    /* ================= C8 PROJECT ================= */
    console.log("C8 project — status default · target · human More");
    await openComposer(page); await kind(page, "Project");
    await setField(page, "projectTitle", "Garden shed rebuild");
    await more(page);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-add-field='focus']") && !!document.querySelector("[data-sb-add-field='relatedProblem']")), "Project More stays human: Current focus · Related problem wait as choices (§52)");
    await addField(page, "target");
    await setField(page, "target", "before winter");
    await post(page);
    const c8m = await newest(page);
    ok(c8m?.fields?.status === "active" && c8m?.fields?.target === "before winter", "Project status defaults active internally (never asked); target captured");
    ok(await page.evaluate(() => !document.querySelector("[data-sb-composer]")), "posted and closed — no lifecycle questions at creation");

    /* ================= C9 MEETING ================= */
    console.log("C9 meeting — Social Basic holds (MEET-004)");
    await openComposer(page); await kind(page, "Meeting");
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-domain-quick='meeting'] [data-sb-when]")), "Meeting keeps When at quick level");
    await more(page);
    const meetingText = await page.evaluate(() => document.querySelector("[data-sb-domain-more='meeting']")?.textContent ?? "");
    ok(!/Agenda|Transcript|Recording|Minutes|Attendance/i.test(meetingText), "no Complete-Meeting workspace leaks into Social Basic");
    ok(!/Hybrid|In person|Phone/.test(meetingText), "no mode list in Social Basic (29: mode is Simple-tier)");
    await discard(page);

    /* ================= C10 RECLASSIFICATION (§74) ================= */
    console.log("C10 reclassification — the same event, a truer category");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    await settleMeta(page);
    await kind(page, "Meal");
    await chip(page, "occasion", "Dinner");
    await more(page);
    await setWhen(page, "2026-09-20");
    await setText(page, "Reclassification proof dinner");
    await post(page);
    const before = await newest(page);
    ok(before?.kind === "meal" && before?.media?.kind === "photos" && before?.at.startsWith("2026-09-20"), "the meal exists with its media and its own date");
    // edit → reclassify to Activity
    await page.evaluate(() => { const el = [...document.querySelectorAll("[data-sb-moment]")].find((m) => m.textContent.includes("Reclassification proof dinner")); el?.querySelector("[data-sb-actions-more] button[aria-label='More'], button[aria-label='More']")?.click(); });
    await sleep(350);
    await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].find((b) => b.textContent.trim() === "Edit")?.click());
    await sleep(500);
    await kind(page, "Activity");
    await actType(page, "Hiking");
    await post(page);
    const after = (await state(page)).moments.find((m) => m.id === before.id);
    ok(after?.kind === "activity" && after?.fields?.activityType === "hiking", "the record reclassifies to Activity");
    ok(after?.media?.kind === "photos" && JSON.stringify(after.media.items) === JSON.stringify(before.media.items), "media preserved through reclassification");
    ok(after?.at === before.at && after?.privacy === before.privacy, "time and audience preserved through reclassification");
    ok(!after?.fields?.occasion && !after?.fields?.context, "the old category's fields do not leak onto the new record");

    /* ================= C11 LOCALIZATION ================= */
    console.log("C11 localization — the canonical surfaces speak the locale (ne)");
    await open(page, DESKTOP, "light", "ne", "&composer=1&lang=ne");
    await kind(page, "जीवन क्षण");
    await more(page);
    const neWhen = await page.evaluate(() => document.querySelector("[data-sb-domain-more='moment']")?.textContent ?? "");
    ok(!/(Story|Chapter|More details|Exact date|Month|Year|Approximate|Date unknown|Today|Change)/.test(neWhen), "ne: no English leaks in the new Life-Moment depth");
    await setWhen(page, "2019-07-14");
    const nePrec = await page.$$eval("[data-sb-chipselect='timePrecision'] button", (n) => n.map((x) => x.textContent.trim()).join("|"));
    ok(nePrec === "सटीक मिति|महिना|वर्ष|अनुमानित", `ne: the precisions speak Nepali (${nePrec})`);

    /* ================= page health ================= */
    console.log("page health");
    ok(errs.length === 0, `zero page errors (${errs.length})${errs[0] ? " — " + errs[0].slice(0, 100) : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("SOCIAL COMPOSER CANONICAL: FAIL"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
  console.log("SOCIAL COMPOSER CANONICAL: PASS");
  process.exit(0);
})();
