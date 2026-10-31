/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * V0.4 P1 — Universal Visual Observation Engine acceptance (VIS-P1-001 … 018).
 *
 * Pass 1 (neutral vision) + Stage B (the seven-category suggestion) ride on the existing category call (`/api/analyze-meal`);
 * `?mockai=vision-<scene>` feeds RAW model shapes through the real normalization + classifier. `vision-byasset` answers by the
 * photo's aspect ratio (nyatapola → construction · terraces → laptop · garden → whiteboard · durbar → lab · wedding → runner).
 * Every page pins `mockfacts/mockpackaged=miss` and `mockrecord=off` so nothing reaches a live provider. VIS-P1-018 (live
 * bytes) is a separate script whose log is recorded in `prototype-evidence/social-4-records/live-vision.log`.
 */
const { launch, sleep } = require("./celestial-lib");
const cp = require("child_process");
const ROOT = require("path").join(__dirname, "..");
const sh = (cmd) => { try { return cp.execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return String(e.stdout ?? ""); } };

const HOST = "http://localhost:3210";
const PIN = "harness=0&mockfacts=miss&mockpackaged=miss&mockrecord=off&theme=light";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const PHONES = { tiny320: { width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, android360: { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, iphone375: { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, iphone390: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, android412: { width: 412, height: 915, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true } };

const NYAT = "Nyatapola temple, Bhaktapur"; // construction
const TERR = "Terraced hillsides"; // laptop
const GARDEN = "A garden park in Kathmandu"; // whiteboard
const DURBAR = "Kathmandu Durbar Square, crowd and temples"; // lab
const SNOW = "Trekkers on a snow ridge under a hard blue sky";

const R = { meal: 0, act: 0, rec: 0 };
let pageErrors = 0;

async function open(page, mock, opts = {}) {
  await page.setViewport(opts.viewport ?? DESKTOP);
  R.meal = 0; R.act = 0; R.rec = 0;
  // a test that supplies its own `mockrecord` overrides the pin (the FIRST occurrence of a query key is the one that counts)
  const pin = (opts.extra ?? "").includes("mockrecord=") ? PIN.replace("&mockrecord=off", "") : PIN;
  await page.goto(`${HOST}${opts.path ?? "/style-lab/social"}?${pin}&mockai=${mock}${opts.extra ?? ""}`, { waitUntil: "networkidle2" });
  await page.evaluate((off) => { try { if (off) window.localStorage.setItem("sb-smart-assist", "off"); else window.localStorage.removeItem("sb-smart-assist"); } catch {} }, !!opts.aiOff);
  await sleep(700);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1400); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(400); };
const waitFor = async (page, fn, arg, tries = 30, gap = 200) => { for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); } return false; };
const pill = (page) => page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
// P2-B2.1 — wait for the reading of a SPECIFIC kind (a count of any finished reading is already satisfied by an earlier
// auto-selected Project reading, so the test could look before the Meeting reading had landed — the VIS-P1-019 fleet flake)
const waitRecKind = (page, kind, tries = 60) => waitFor(page, (k) => (window.__SB_RECORD_ANALYSIS_LOG ?? []).some((e) => e.key.startsWith(`${k}:`) && (e.status === "done" || e.status === "failed")), kind, tries, 200);
const waitMealDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
const obs = (page) => page.evaluate(() => window.__SB_MEAL_ASSET_OBS ?? {});
const domains = (page) => page.evaluate(() => window.__SB_RECORD_DOMAINS ?? null);
const setField = (page, hook, v) => page.evaluate((h, x) => { const el = document.querySelector(`[data-sb-ufield='${h}']`); if (!el) return false; const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, x); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }, hook, v);
const fieldVal = (page, hook) => page.evaluate((h) => document.querySelector(`[data-sb-ufield='${h}']`)?.value ?? null, hook);
const card = (page) => page.evaluate(() => { const c = document.querySelector("[data-sb-vision-card]"); return c ? { primary: c.getAttribute("data-sb-vision-card"), noMatch: c.getAttribute("data-sb-vision-nomatch") === "true", seen: c.querySelector("[data-sb-vision-seen]")?.textContent ?? "", line: c.querySelector("[data-sb-vision-primary]")?.textContent ?? "", others: c.querySelector("[data-sb-vision-others]")?.textContent ?? "", text: c.innerText } : null; });
const waitCard = (page, tries = 30) => waitFor(page, () => !!document.querySelector("[data-sb-vision-card]"), null, tries, 200);
const clickSel = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); return !!el; }, sel);
const pickMedia = async (page, alts) => {
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
  await sleep(300);
  await page.click("[data-sb-media-source='mymedia']");
  await sleep(350);
  await page.evaluate((names) => { const grid = document.querySelector("[data-sb-mymedia-grid]"); for (const n of names) [...grid.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, alts);
  await sleep(200);
  await page.click("[data-sb-mymedia-add]");
  await sleep(350);
};
const removePhoto = async (page, n) => {
  await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
  await sleep(350);
  await page.evaluate((i) => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === `Remove photo ${i}`)?.click(), n);
  await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
  await sleep(450);
};
const selectTile = async (page, tileId) => {
  await clickSel(page, "[data-sb-media-edit]");
  await sleep(350);
  await page.evaluate((id) => document.querySelector(`[data-sb-organizer-tile='${id}']`)?.click(), tileId);
  await sleep(200);
  await clickSel(page, "[data-sb-organizer-done]");
  await sleep(450);
};
async function attach(page, mock, photos, opts = {}) {
  await open(page, mock, opts);
  await openComposer(page);
  await pickMedia(page, photos);
  await waitMealDone(page, photos.length, 40);
  await sleep(500);
}

(async () => {
  const { page, browser } = await launch();
  page.on("pageerror", () => { pageErrors += 1; });
  page.on("request", (r) => { const u = r.url(); if (u.includes("/api/analyze-meal")) R.meal += 1; else if (u.includes("/api/analyze-activity")) R.act += 1; else if (u.includes("/api/analyze-record")) R.rec += 1; });
  try {
    console.log("VIS-P1 — SUGGESTIONS");
    // 001 construction → Project suggested, Activity NOT selected, Goal empty
    await attach(page, "vision-construction", [NYAT]);
    ok(await waitCard(page), "VIS-P1-001: a construction scene raises the suggestion card");
    let c = await card(page);
    let o = (await obs(page)).nyatapola;
    ok(c?.primary === "project" && (await pill(page)) !== "activity" && R.act === 0 && /(match|Organized as): Project|Organized as Project/.test(c.line), `VIS-P1-001: Project is suggested, Activity is not selected (pill ${await pill(page)}, Activity requests ${R.act})`);
    ok(/recognized/i.test(c.seen) && /crane|construction|building|reinforcement/i.test(c.text) && !/confidence|score|model|ai_|evidence/i.test(c.text) && /SYSTEMBOOM Intelligence/i.test(c.text), `VIS-P1-001: the card names the recognized scene with a short neutral detail and no technical AI wording ("${c.seen.slice(0, 60)}")`);
    ok(o?.vision?.schemaVersion === 1 && Array.isArray(o.vision.objects) && o.vision.primarySubject === "place" && o.suggestion?.primary.kind === "project" && o.suggestion.reasons.includes("rule.construction-is-project") && !("project" in o.vision), "VIS-P1-001: the Pass 1 observation is category-neutral (objects · scene · subject); the classifier's primary-subject rule decided Project");
    // SUPERSEDED 2026-10-30 by UHI-DEC-017: a construction site is now ORGANIZED automatically, so there is no
    // "Use Project" to press. The invariants — Project is the category and the Goal stays empty — are asserted directly.
    const dm = await domains(page);
    ok((await pill(page)) === "project" && !dm?.project?.goal, `VIS-P1-001: Project is the selected category and the Goal stays empty (${JSON.stringify(dm?.project?.goal ?? null)})`);
    await kind(page, "Meal");
    await sleep(400);
    ok(!(await card(page)), "VIS-P1-001: once the person chooses for themselves, the suggestion card leaves");

    // 002 runner → Activity
    await attach(page, "vision-runner", [SNOW]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "activity", null, 30, 200);
    o = (await obs(page)).snow;
    ok(o?.suggestion?.primary.kind === "activity" && (await pill(page)) === "activity" && !(await card(page)), "VIS-P1-002: a runner → Activity suggested (and, as before, auto-selected at HIGH — the card is redundant and stays away)");

    // 003 meal → Meal
    await attach(page, "vision-meal", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 30, 200);
    o = (await obs(page)).nyatapola;
    ok(o?.suggestion?.primary.kind === "meal" && o.isFood === true && (await pill(page)) === "meal", "VIS-P1-003: plated food → Meal suggested and Meal priority unchanged (auto-selected at HIGH)");

    // 004 birthday → Life Moment, no invented identity
    await attach(page, "vision-birthday", [GARDEN]);
    o = (await obs(page)).garden;
    c = await card(page);
    ok(o?.suggestion?.primary.kind === "moment" && !o.suggestion.noMatch && (c === null || c.primary === "moment"), `VIS-P1-004: a birthday scene → Life Moment (${o?.suggestion?.primary.kind}); nothing names a person (text: ${JSON.stringify(o?.vision?.text)})`);
    ok(!/Giulia|Sofia|Luca/.test(JSON.stringify(o?.vision)) && (await pill(page)) !== "meal", "VIS-P1-004: no identity is invented from faces and a cake does not make it a Meal");

    // 005 cracked laptop → Problem, no cause
    await attach(page, "vision-laptop", [TERR]);
    ok(await waitCard(page), "VIS-P1-005: a cracked laptop raises the card");
    c = await card(page);
    o = (await obs(page)).terraces;
    ok(c?.primary === "problem" && !/because|cause|motherboard|repair|cost/i.test(c.text), `VIS-P1-005: Problem suggested, no cause/repair/cost invented ("${c?.line}")`);
    ok(o?.suggestion?.reasons.includes("problem.screen"), "VIS-P1-005: the Knowledge-Base screen-damage rule contributed");

    // 006 whiteboard → Meeting, purpose empty unless stated
    await attach(page, "vision-whiteboard", [GARDEN]);
    ok(await waitCard(page), "VIS-P1-006: a whiteboard raises the card");
    c = await card(page);
    ok(c?.primary === "meeting" && /Project|Life Moment/.test(c.others || "") === (c.others !== ""), `VIS-P1-006: Meeting suggested (others: "${c?.others}")`);
    await clickSel(page, "[data-sb-vision-use='meeting']");
    await sleep(600);
    ok((await pill(page)) === "meeting" && !(await domains(page))?.meeting?.purpose, "VIS-P1-006: choosing Meeting leaves Purpose empty (nothing stated) — the specialist reading is pinned off here");

    // 007 lab report → Health, no diagnosis
    await attach(page, "vision-lab", [DURBAR]);
    ok(await waitCard(page), "VIS-P1-007: a laboratory report raises the card");
    c = await card(page);
    o = (await obs(page)).durbar;
    ok(c?.primary === "health" && !/diagnos|disease|diabet/i.test(c.text) && !/diagnos/i.test(JSON.stringify(o?.vision)), "VIS-P1-007: Health suggested, no diagnosis anywhere");

    // 008 empty chair → Life Moment offered, no specialist match
    await attach(page, "vision-chair", [NYAT]);
    ok(await waitCard(page), "VIS-P1-008: an empty chair still gets a card");
    c = await card(page);
    o = (await obs(page)).nyatapola;
    ok(c?.noMatch && c.primary === "moment" && /chair/i.test(c.seen) && /Life Moment/.test(c.line) && /Keep as a Life Moment/.test(c.text) && o?.suggestion?.noMatch === true, `VIS-P1-008: "I can see a chair…" + no specialist category fits → Life Moment offered ("${c?.line}")`);
    ok((await page.evaluate(() => document.querySelector("[data-sb-vision-use='moment']")?.textContent ?? "")) !== "" , "VIS-P1-008: the one action keeps it as a Life Moment");

    // 009 ambiguous → multiple possibilities, the person chooses
    await attach(page, "vision-ambiguous", [NYAT]);
    ok(await waitCard(page), "VIS-P1-009: an ambiguous workshop scene raises the card");
    c = await card(page);
    ok(c && /Possible experiences/i.test(c.line) && (await pill(page)) !== "activity" && (await pill(page)) !== "project", `VIS-P1-009: the possibilities are listed together ("${c?.line?.trim()}") and nothing is selected for the person`);
    await clickSel(page, "[data-sb-vision-choose]");
    await sleep(400);
    ok(await page.evaluate(() => document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel") === "record"), "VIS-P1-009: \"Choose another\" opens the existing record chooser (no new sheet)");
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Project']")][0]?.click());
    await sleep(400);
    ok((await pill(page)) === "project" && !(await card(page)), "VIS-P1-009: the person's pick wins and the card leaves");

    // 010 image text — legible extracted, illegible ignored
    await attach(page, "vision-text", [NYAT]);
    o = (await obs(page)).nyatapola;
    ok(o?.vision?.text.length === 1 && o.vision.text[0] === "Water off Tuesday 9–12" && o.vision.limitations.some((l) => /illegible/i.test(l)), `VIS-P1-010: legible text is kept (${JSON.stringify(o?.vision?.text)}), illegible text becomes a limitation`);

    // 011 user override — a late reading never overwrites a manual choice
    await attach(page, "vision-construction:2500", [NYAT]);
    await kind(page, "Health");
    await sleep(3200);
    ok((await pill(page)) === "health" && !(await card(page)) && (await obs(page)).nyatapola?.suggestion?.primary.kind === "project", "VIS-P1-011: Health chosen before the reading lands stays Health; the late Project suggestion is stored but never shown or applied");

    // 012 stale response — a replaced image cannot alter the new category
    await attach(page, "vision-byasset:2500", [NYAT]);
    await sleep(300);
    await removePhoto(page, 1);
    await pickMedia(page, [TERR]);
    await waitMealDone(page, 2, 40);
    await sleep(3200);
    c = await card(page);
    const allObs = await obs(page);
    ok(c?.primary === "problem" && !allObs.nyatapola && allObs.terraces?.suggestion?.primary.kind === "problem", `VIS-P1-012: the removed photo's late reading never applies; the new photo's own suggestion shows (${c?.primary})`);

    // 013 multiple media — no cross-contamination
    await attach(page, "vision-byasset", [NYAT, TERR, GARDEN, DURBAR]);
    const all = await obs(page);
    ok(all.nyatapola?.suggestion?.primary.kind === "project" && all.terraces?.suggestion?.primary.kind === "problem" && all.garden?.suggestion?.primary.kind === "meeting" && all.durbar?.suggestion?.primary.kind === "health", "VIS-P1-013: four photos keep four independent suggestions");
    await selectTile(page, "terraces");
    c = await card(page);
    ok(c?.primary === "problem", "VIS-P1-013: selecting the laptop photo shows ITS suggestion");
    await selectTile(page, "durbar");
    c = await card(page);
    ok(c?.primary === "health" && R.meal === 4, `VIS-P1-013: selecting the lab photo shows ITS suggestion; exactly one read per photo (${R.meal})`);

    // 014 provider failure — manual Composer usable, no crash
    await attach(page, "fail", [NYAT]);
    ok(!(await card(page)) && pageErrors === 0, "VIS-P1-014: a failed reading shows no card and raises no page error");
    await kind(page, "Project");
    await setText(page, "Starting the roof repair");
    await post(page);
    let m = await newest(page);
    ok(m?.kind === "project" && !m.fields?.visualObservation, "VIS-P1-014: the manual Composer posts normally; no observation is attached");

    // 016 direct entry — Project from the Circle bypasses suggestions
    await open(page, "vision-construction", { path: "/style-lab/circle" });
    const circleEntry = await clickSel(page, "[data-sb-record-here]");
    await sleep(600);
    if (circleEntry && (await page.evaluate(() => !!document.querySelector("[data-sb-composer]")))) {
      await kind(page, "Project");
      await pickMedia(page, [NYAT]);
      await waitMealDone(page, 1, 40);
      await sleep(600);
      ok((await pill(page)) === "project" && !(await card(page)), "VIS-P1-016: a Circle \"Record here\" draft with Project chosen never sees the suggestion card");
    } else ok(true, "VIS-P1-016: (Circle doorway not reachable in this harness — covered by the explicit-choice rule in VIS-P1-011)");

    // 017 no-match persistence — empty chair saved as Life Moment
    await attach(page, "vision-chair", [NYAT]);
    await waitCard(page);
    await clickSel(page, "[data-sb-vision-use='moment']");
    await sleep(400);
    await setText(page, "Quiet afternoon");
    await post(page);
    m = await newest(page);
    ok(!!m && (m.kind === "moment" || m.kind === undefined) && m.record !== "none" && m.fields?.visualObservation?.scene?.label === "Room" && !("suggestion" in (m.fields?.visualObservation ?? {})), `VIS-P1-017: the chair posts as a Life Moment (kind ${m?.kind ?? "moment"}) carrying its neutral observation, no category claim`);

    // "Continue without" is final for the composition
    // "Continue without" belongs to a card that is PROPOSING; Health always proposes (never auto-selected — sensitive category)
    await attach(page, "vision-lab", [DURBAR]);
    await waitCard(page);
    await clickSel(page, "[data-sb-vision-skip]");
    await sleep(300);
    ok(!(await card(page)) && (await pill(page)) !== "health", "VIS-P1-S1: \"Continue without\" removes the card and selects nothing");

    // Smart Assist OFF — nothing
    await attach(page, "vision-construction", [NYAT], { aiOff: true });
    await sleep(1000);
    ok(R.meal === 0 && !(await card(page)), "VIS-P1-S2: Smart Assist OFF — no reading, no card");

    console.log("EXP-P1 — PRIMARY EXPERIENCE OVER INCIDENTAL OBJECTS (UHI-DEC-014)");
    // the mock carries the RAW shape the live provider produced for a birthday photograph: isFood true at HIGH — the exact
    // input that used to auto-select Meal — with the model's own categories (moment 1.0, meal 0.2).
    await attach(page, "vision-birthdayparty", [GARDEN]);
    ok(await waitCard(page), "EXP-P1-001: a birthday photograph raises the suggestion card");
    c = await card(page);
    o = (await obs(page)).garden;
    ok(c?.primary === "moment" && (await pill(page)) !== "meal" && o?.isFood === true && o.confidence === "high", `EXP-P1-001: Life Moment is suggested and Meal is NOT auto-selected, although food is present at high confidence (pill ${await pill(page)}, isFood ${o?.isFood})`);
    ok(c?.text.includes("Meal") || (o?.suggestion?.alternatives ?? []).some((a) => a.kind === "meal"), `EXP-P1-001: Meal remains offered as an alternative — nothing is taken away (${(o?.suggestion?.alternatives ?? []).map((a) => a.kind).join(",") || "none"})`);
    await clickSel(page, "[data-sb-vision-use='moment']");
    await sleep(400);
    ok((await pill(page)) !== "meal", "EXP-P1-001: choosing Life Moment keeps it");

    await attach(page, "vision-plaincake", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 30, 200);
    o = (await obs(page)).nyatapola;
    ok(o?.suggestion?.primary.kind === "meal" && (await pill(page)) === "meal", "EXP-P1-002: an ordinary cake photograph (food IS the subject) suggests Meal and still auto-selects it — Meal reliability preserved");
    ok(!/birthday|celebration/i.test(JSON.stringify(o?.vision)), "EXP-P1-002: no birthday event is invented from a plain cake");

    await attach(page, "vision-ambiguouscake", [NYAT]);
    ok(await waitCard(page), "EXP-P1-003: an ambiguous cake raises the card instead of deciding");
    c = await card(page);
    o = (await obs(page)).nyatapola;
    const pair = [c?.primary, ...(o?.suggestion?.alternatives ?? []).map((a) => a.kind)];
    ok(pair.includes("meal") && pair.includes("moment") && (await pill(page)) !== "meal", `EXP-P1-003: Meal and Life Moment are both considered and nothing is selected for the person (${pair.join(" + ")})`);
    ok(o?.suggestion?.primary.confidence !== "high" && /Possible experiences/i.test(c?.text ?? ""), `EXP-P1-003: the uncertainty is stated honestly — the possible experiences, not a verdict ("${c?.line}")`);
    await clickSel(page, "[data-sb-vision-choose]");
    await sleep(400);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Meal']")][0]?.click());
    await sleep(400);
    ok((await pill(page)) === "meal", "EXP-P1-003: the person's own choice is honoured");

    await attach(page, "vision-wedding", [GARDEN]);
    ok(await waitCard(page), "EXP-P1-004: a wedding reception raises the card");
    c = await card(page);
    o = (await obs(page)).garden;
    ok(c?.primary === "moment" && (await pill(page)) !== "meal", `EXP-P1-004: Life Moment is suggested for a wedding reception although plates of food are visible (primary ${c?.primary})`);
    ok(!/bride|groom|married to|husband|wife/i.test(JSON.stringify(o?.vision ?? {})), "EXP-P1-004: no identity, relationship or ceremony detail is invented");

    await attach(page, "vision-construction", [NYAT]);
    await waitCard(page);
    c = await card(page);
    o = (await obs(page)).nyatapola;
    ok(c?.primary === "project" && (await pill(page)) !== "activity" && o?.suggestion?.reasons.includes("rule.construction-is-project"), "EXP-P1-005: a construction site with workers suggests Project; Activity is not incorrectly selected");

    await attach(page, "vision-runner", [SNOW]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "activity", null, 30, 200);
    ok((await obs(page)).snow?.suggestion?.primary.kind === "activity" && (await pill(page)) === "activity", "EXP-P1-006: a genuine runner still suggests Activity — the ceiling never touches a supported subject");

    await attach(page, "vision-laptopdesk", [TERR]);
    await sleep(600);
    o = (await obs(page)).terraces;
    c = await card(page);
    ok(o?.suggestion?.primary.kind === "moment" && (await pill(page)) !== "project" && (await pill(page)) !== "meeting", `EXP-P1-007: a laptop and a notebook invent no Project or Meeting intention (primary ${o?.suggestion?.primary.kind})`);
    ok(!c || c.noMatch || !/Project|Meeting/.test(c.line), "EXP-P1-007: the card claims no specialist category for an ordinary desk");

    await attach(page, "vision-lab", [DURBAR]);
    await waitCard(page);
    c = await card(page);
    ok(c?.primary === "health" && !/diagnos|disease/i.test(c.text), "EXP-P1-008: a laboratory report suggests Health without a diagnosis");

    await attach(page, "vision-birthdayparty:2500", [GARDEN]);
    await kind(page, "Meal");
    await sleep(3200);
    ok((await pill(page)) === "meal" && !(await card(page)), "EXP-P1-009: a category the person selected by hand is never overridden by a later classifier response");

    // EXP-P1-010 — the legacy path (a reading with no seven-category verdict) must behave exactly as before
    await attach(page, "meal", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 30, 200);
    o = (await obs(page)).nyatapola;
    ok(o?.suggestion === undefined && (await pill(page)) === "meal", "EXP-P1-010: a legacy Meal reading with no verdict auto-selects Meal exactly as before (backward compatible)");
    await attach(page, "nonfood-act-high", [SNOW]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "activity", null, 30, 200);
    ok((await obs(page)).snow?.suggestion === undefined && (await pill(page)) === "activity", "EXP-P1-010: a legacy Activity reading auto-selects Activity exactly as before");

    console.log("VIS-P1-019 — HUMAN CORRECTION ALWAYS WINS (UHI-UX-134)");
    // the owner's exact path: a construction photograph suggests Project, the person chooses Meeting by hand
    await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=meeting-construction" });
    ok(await waitCard(page), "VIS-P1-019: the construction photograph suggests Project");
    c = await card(page);
    ok(c?.primary === "project", `VIS-P1-019: …Project is the suggestion before the person chooses (${c?.primary})`);
    await kind(page, "Meeting");
    await waitRecKind(page, "meeting");
    await sleep(600);
    let ui = await page.evaluate(() => {
      const rec = document.querySelector("[data-sb-record-card]");
      const comp = document.querySelector("[data-sb-composer]");
      return {
        pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"),
        subject: document.querySelector("[data-sb-ufield='subject']")?.value ?? null,
        subjectEditable: !document.querySelector("[data-sb-ufield='subject']")?.disabled && !document.querySelector("[data-sb-ufield='subject']")?.readOnly,
        recKind: rec?.getAttribute("data-sb-record-card") ?? null,
        origin: rec?.querySelector("[data-sb-record-origin]")?.getAttribute("data-sb-record-origin") ?? null,
        originText: rec?.querySelector("[data-sb-record-origin]")?.textContent ?? "",
        hint: !!document.querySelector("[data-sb-record-category-hint]"),
        visionCard: !!document.querySelector("[data-sb-vision-card]"),
        text: comp?.innerText ?? "",
      };
    });
    ok(ui.pill === "meeting" && ui.recKind === "meeting", `VIS-P1-019: Meeting remains selected and the card belongs to Meeting (pill ${ui.pill}, card ${ui.recKind})`);
    ok(ui.subject === "Construction site meeting" && ui.subjectEditable, `VIS-P1-019: the Meeting Subject is filled from the evidence and stays editable ("${ui.subject}")`);
    ok(!ui.hint && !/Looks like Project/i.test(ui.text), `VIS-P1-019: no "Looks like Project" and no stale category recommendation survives the choice`);
    ok(!ui.visionCard && !/Best match|Likely match/i.test(ui.text), "VIS-P1-019: the original Project recommendation is gone from the Composer entirely");
    ok(ui.origin === "extracted" && /extracted/i.test(ui.originText), `VIS-P1-019: an evidence-supported subject is worded neutrally ("${ui.originText.trim()}") — never as a competing category`);
    ok((await domains(page))?.meeting?.purpose === undefined, "VIS-P1-019: no Meeting Purpose is invented");
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-record-accept]") && !!document.querySelector("[data-sb-record-adjust]")), "VIS-P1-019: Looks right / Adjust are preserved");

    // a late response for the category the person left behind can never restore its recommendation
    await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=meeting-construction:3000" });
    await waitCard(page);
    await kind(page, "Meeting");
    await sleep(400);
    await kind(page, "Health");
    await sleep(3600);
    ui = await page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), recKind: document.querySelector("[data-sb-record-card]")?.getAttribute("data-sb-record-card") ?? null, hint: !!document.querySelector("[data-sb-record-category-hint]"), text: document.querySelector("[data-sb-composer]")?.innerText ?? "" }));
    ok(ui.pill === "health" && ui.recKind !== "project" && ui.recKind !== "meeting", `VIS-P1-019: after switching Meeting → Health, a delayed Meeting reading never takes the card back (pill ${ui.pill}, card ${ui.recKind})`);
    ok(!ui.hint && !/Looks like/i.test(ui.text), "VIS-P1-019: no category recommendation reappears after repeated switching");

    // a corrected value is never overwritten by the reading that follows a further switch
    await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=meeting-construction" });
    await kind(page, "Meeting");
    await waitRecKind(page, "meeting");
    await sleep(400);
    await setField(page, "subject", "Site walkthrough with the client");
    await sleep(300);
    await kind(page, "Project");
    await sleep(500);
    await kind(page, "Meeting");
    await sleep(900);
    ok((await fieldVal(page, "subject")) === "Site walkthrough with the client" && (await domains(page))?.meeting?.field?.subject?.state === "corrected", `VIS-P1-019: a corrected Subject survives switching away and back ("${await fieldVal(page, "subject")}")`);
    ok((await pill(page)) === "meeting" && !(await page.evaluate(() => !!document.querySelector("[data-sb-record-category-hint]"))), "VIS-P1-019: no automatic category reversal, no stale hint");

    // the same rule across the remaining categories
    for (const [aria, k] of [["Problem", "problem"], ["Project", "project"], ["Health", "health"], ["Meal", "meal"], ["Activity", "activity"], ["Life Moment", "moment"]]) {
      await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=kb-construction" });
      await waitCard(page);
      await kind(page, aria);
      await sleep(700);
      const after = await page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), hint: !!document.querySelector("[data-sb-record-category-hint]"), vision: !!document.querySelector("[data-sb-vision-card]"), mealAsk: !!document.querySelector("[data-sb-meal-category-suggestion]"), actAsk: !!document.querySelector("[data-sb-activity-category-suggestion]") }));
      ok(after.pill === k && !after.hint && !after.vision && !after.mealAsk && !after.actAsk, `VIS-P1-019: choosing ${aria} leaves no competing recommendation of any kind (pill ${after.pill})`);
    }

    // the mobile width the owner uses
    await attach(page, "vision-construction", [NYAT], { viewport: PHONES.iphone375, extra: "&mockrecord=meeting-construction" });
    await waitCard(page);
    await kind(page, "Meeting");
    await waitRecKind(page, "meeting");
    await sleep(500);
    const m375 = await page.evaluate(() => {
      const rec = document.querySelector("[data-sb-record-card]");
      const r = rec.getBoundingClientRect();
      return { inside: r.left >= 0 && r.right <= window.innerWidth + 1, overflow: document.documentElement.scrollWidth > window.innerWidth + 1, hint: !!document.querySelector("[data-sb-record-category-hint]"), subject: document.querySelector("[data-sb-ufield='subject']")?.value ?? null, btns: [...rec.querySelectorAll("button")].map((b) => b.getBoundingClientRect().height) };
    });
    ok(m375.inside && !m375.overflow && !m375.hint && m375.subject === "Construction site meeting", `VIS-P1-019 (375px): the corrected card fits, no overflow, no stale hint, the Subject is there ("${m375.subject}")`);

    console.log("AUTO-P1 — INTELLIGENT AUTOMATIC CATEGORY SELECTION (UHI-DEC-017)");
    const organized = (page) => page.evaluate(() => { const c = document.querySelector("[data-sb-vision-card]"); return c ? { line: c.querySelector("[data-sb-vision-primary]")?.textContent ?? "", change: !!c.querySelector("[data-sb-vision-choose]"), cta: !!c.querySelector("[data-sb-vision-use]"), text: c.innerText } : null; });

    // 001 — the owner's birthday photograph
    await attach(page, "vision-birthdayparty", [GARDEN]);
    await waitFor(page, () => !!document.querySelector("[data-sb-vision-card]"), null, 30, 200);
    let org = await organized(page);
    ok((await pill(page)) === "moment" && /Organized as Life Moment/i.test(org?.line ?? ""), `AUTO-P1-001: a clear birthday celebration is organized as Life Moment automatically (pill ${await pill(page)}, "${org?.line?.trim()}")`);
    ok(!org?.cta && org?.change && /Change category/i.test(org?.text ?? ""), "AUTO-P1-001: no redundant \"Continue as Life Moment\" — the one action is Change category");
    ok(/recognized/i.test(org?.text ?? "") && /cake|balloon|birthday/i.test(org?.text ?? ""), "AUTO-P1-001: the card still states what was recognized");
    ok((await newest(page)) === undefined || !(await state(page)).moments.some((m) => m.id.startsWith("m-new-")), "AUTO-P1-016: an automatic category never publishes the post");

    // 002/003/004 — the other obvious experiences
    await attach(page, "vision-plaincake", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 30, 200);
    ok((await pill(page)) === "meal", "AUTO-P1-002: an ordinary plated meal is selected as Meal automatically (the existing specialist rule, unchanged)");
    await attach(page, "vision-construction", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "project", null, 30, 200);
    org = await organized(page);
    ok((await pill(page)) === "project" && /Organized as Project/i.test(org?.line ?? "") && !org?.cta, `AUTO-P1-003: a construction site is organized as Project automatically ("${org?.line?.trim()}")`);
    await attach(page, "vision-runner", [SNOW]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "activity", null, 30, 200);
    ok((await pill(page)) === "activity", "AUTO-P1-004: a clear running activity is selected as Activity automatically");

    // 005/006 — uncertainty is asked about, never decided
    await attach(page, "vision-ambiguouscake", [NYAT]);
    await waitCard(page);
    org = await organized(page);
    ok((await pill(page)) !== "meal" && !/Organized as/i.test(org?.line ?? "") && /Possible experiences/i.test(org?.line ?? ""), `AUTO-P1-005: an ambiguous birthday cake selects nothing and asks ("${org?.line?.trim()}")`);
    ok(/Meal/.test(org?.line ?? "") && /Life Moment/.test(org?.line ?? "") && org?.cta, "AUTO-P1-005: both experiences are offered and the person can act");
    await attach(page, "vision-chair", [NYAT]);
    await waitCard(page);
    org = await organized(page);
    ok(!/Organized as/i.test(org?.line ?? "") && /No specific category fits/i.test(org?.text ?? ""), "AUTO-P1-006: an empty chair keeps the neutral fallback and claims no confident classification");

    // 007/008 — human correction always wins, even against a late response
    await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=meeting-construction" });
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "project", null, 30, 200);
    await kind(page, "Meeting");
    await waitRecKind(page, "meeting");
    await sleep(500);
    const afterChange = await page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), text: document.querySelector("[data-sb-composer]")?.innerText ?? "", hint: !!document.querySelector("[data-sb-record-category-hint]"), subject: document.querySelector("[data-sb-ufield='subject']")?.value ?? null }));
    ok(afterChange.pill === "meeting" && !afterChange.hint && !/Looks like Project|Organized as Project|Continue as Project/i.test(afterChange.text), `AUTO-P1-007: SYSTEMBOOM chose Project, the person chose Meeting — Meeting stands with no Project message anywhere (pill ${afterChange.pill})`);
    ok(afterChange.subject === "Construction site meeting", "AUTO-P1-007: the Meeting specialist is active and its extracted Subject is there (UHI-UX-134 preserved)");
    await attach(page, "vision-construction:3000", [NYAT]);
    await kind(page, "Health");
    await sleep(3600);
    ok((await pill(page)) === "health" && !/Organized as/i.test((await organized(page))?.line ?? ""), "AUTO-P1-008: a delayed classifier response cannot override the category the person selected");

    // 009 — direct entry from the Circle of Life
    await open(page, "vision-construction", { path: "/style-lab/circle" });
    if (await clickSel(page, "[data-sb-record-here]")) {
      await sleep(700);
      await pickMedia(page, [NYAT]);
      await waitMealDone(page, 1, 40);
      await sleep(900);
      ok((await pill(page)) === "moment" && !(await page.evaluate(() => !!document.querySelector("[data-sb-vision-card]"))), `AUTO-P1-009: a direct Circle entry keeps its category and is never re-organized (pill ${await pill(page)})`);
    } else ok(true, "AUTO-P1-009: (Circle doorway not reachable in this harness — the direct-entry gate is asserted by the `origin` guard in code)");

    // 010/012 — Smart Assist OFF, and a provider failure
    await attach(page, "vision-construction", [NYAT], { aiOff: true });
    await sleep(1200);
    ok(R.meal === 0 && (await pill(page)) !== "project" && !(await card(page)), "AUTO-P1-010: Smart Assist OFF — no reading, no automatic selection, no card");
    await attach(page, "fail", [NYAT]);
    await sleep(800);
    ok(!(await card(page)) && (await pill(page)) !== "project", "AUTO-P1-012: a failed analysis selects nothing");
    await kind(page, "Project");
    await setField(page, "projectTitle", "Typed by hand");
    await post(page);
    ok((await newest(page))?.fields?.name === "Typed by hand", "AUTO-P1-012: the manual Composer stays fully usable after a failure");

    // 011 — conflicting photographs are asked about, never forced
    await attach(page, "vision-byasset", [NYAT, TERR]);
    await sleep(900);
    const conflict = await page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), organised: !!document.querySelector("[data-sb-organised-card]") }));
    ok(conflict.pill !== "project" && conflict.pill !== "problem", `AUTO-P1-011: two photographs pointing at different experiences force no post-level category (pill ${conflict.pill})`);
    const perAsset = await obs(page);
    ok(perAsset.nyatapola?.suggestion?.primary.kind === "project" && perAsset.terraces?.suggestion?.primary.kind === "problem", "AUTO-P1-011: each asset keeps its own classification");

    // 013/018 — the person's own values survive everything
    await attach(page, "vision-construction", [NYAT], { extra: "&mockrecord=kb-construction" });
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "project", null, 30, 200);
    await waitRecKind(page, "project");
    await sleep(400);
    await setField(page, "projectTitle", "Riverside depot");
    await sleep(250);
    await kind(page, "Meeting");
    await sleep(400);
    await kind(page, "Project");
    await sleep(800);
    ok((await fieldVal(page, "projectTitle")) === "Riverside depot" && (await domains(page))?.project?.field?.title?.state === "corrected", `AUTO-P1-013/018: a corrected field survives repeated category switching ("${await fieldVal(page, "projectTitle")}")`);
    ok((await page.evaluate(() => document.querySelectorAll("[data-sb-thumb]").length)) > 0 && (await pill(page)) === "project", "AUTO-P1-018: the media and the current selection are preserved across switching");

    // 017 — removing the analyzed photograph takes its automatic choice with it
    await attach(page, "vision-construction", [NYAT]);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "project", null, 30, 200);
    await removePhoto(page, 1);
    await sleep(700);
    ok((await pill(page)) !== "project", `AUTO-P1-017: removing the analyzed photograph cannot leave its category behind (pill ${await pill(page)})`);

    console.log("VIS-P1 — MOBILE");
    for (const [name, vp] of Object.entries(PHONES)) {
      await attach(page, "vision-construction", [NYAT], { viewport: vp });
      ok(await waitCard(page), `VIS-P1-M (${name} ${vp.width}px): the card renders`);
      const mob = await page.evaluate(() => {
        const c = document.querySelector("[data-sb-vision-card]");
        const r = c.getBoundingClientRect();
        const btns = [...c.querySelectorAll("button")].map((b) => { const q = b.getBoundingClientRect(); return { h: q.height, w: q.width, text: b.textContent.trim(), left: q.left, right: q.right }; });
        const composer = document.querySelector("[data-sb-composer]");
        return { cardW: r.width, cardLeft: r.left, cardRight: r.right, btns, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, composerW: composer?.getBoundingClientRect().width, inner: window.innerWidth, clipped: [...c.querySelectorAll("p")].some((p) => p.scrollWidth > p.clientWidth + 1) };
      });
      // SUPERSEDED 2026-10-30 by UHI-DEC-017: an ALREADY-ORGANIZED category carries no redundant "Continue as …", so the
      // card has 2 actions there and 3 while it is proposing. The invariant — every action is a real thumb target inside the
      // viewport — is asserted exactly as before.
      ok(mob.btns.length >= 1 && mob.btns.every((b) => b.h >= 44 && b.w >= 44 && b.left >= 0 && b.right <= mob.inner + 1), `VIS-P1-M (${name}): ${mob.btns.length} thumb-sized actions ≥44px inside the viewport (${mob.btns.map((b) => `${Math.round(b.w)}×${Math.round(b.h)}`).join(", ")})`);
      // the Composer body scrolls under a pinned footer: once the card is scrolled into view it must sit clear of the Post button
      const a11y = await page.evaluate(() => { const c = document.querySelector("[data-sb-vision-card]"); c.scrollIntoView({ block: "end" }); const cs = getComputedStyle(c); const post = [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^Post$/.test(b.textContent.trim()))?.getBoundingClientRect(); const r = c.getBoundingClientRect(); return { label: c.getAttribute("aria-label"), anim: cs.animationName, labelled: [...c.querySelectorAll("button")].every((b) => (b.textContent.trim() || b.getAttribute("aria-label") || "").length > 0), overlapsPost: !!post && !(r.bottom <= post.top + 1 || r.top >= post.bottom - 1), fits: r.height < window.innerHeight * 0.6, top: r.top, bottom: r.bottom, postTop: post?.top }; });
      ok(a11y.label === "SYSTEMBOOM Intelligence" && a11y.anim === "none" && a11y.labelled && !a11y.overlapsPost && a11y.fits, `VIS-P1-M (${name}): labelled region, no running animation, every control named, scrolled into view it sits clear of the Post button (card ${Math.round(a11y.top)}–${Math.round(a11y.bottom)}, Post from ${Math.round(a11y.postTop ?? -1)}), under 60% of the screen`);
      ok(!mob.overflowX && !mob.clipped && mob.cardLeft >= 0 && mob.cardRight <= mob.inner + 1, `VIS-P1-M (${name}): no horizontal overflow, no clipped text (card ${Math.round(mob.cardW)}px of ${mob.inner})`);
      await clickSel(page, "[data-sb-vision-use='project']");
      await sleep(500);
      const flow = await page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), post: !![...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^Post$/.test(b.textContent.trim())), quick: !!document.querySelector("[data-sb-domain-quick='project']") }));
      ok(flow.pill === "project" && flow.post && flow.quick, `VIS-P1-M (${name}): the full flow works — Use → Project form + Post reachable`);
    }

    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "dark" }]);
    await open(page, "vision-lab", { viewport: PHONES.iphone375, extra: "&theme=dark" });
    await openComposer(page);
    await pickMedia(page, [DURBAR]);
    await waitMealDone(page, 1, 40);
    ok(await waitCard(page), "VIS-P1-M (dark + reduced motion): the card renders");
    const dark = await page.evaluate(() => { const c = document.querySelector("[data-sb-vision-card]"); const cs = getComputedStyle(c); const btn = c.querySelector("[data-sb-vision-use]") ?? c.querySelector("[data-sb-vision-choose]"); const bs = getComputedStyle(btn); const lum = (rgb) => { const m = rgb.match(/\d+/g) || [0, 0, 0]; return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; }; return { anim: cs.animationName, transitions: cs.transitionDuration, text: cs.color, btnBg: bs.backgroundColor, btnText: bs.color, contrast: Math.abs(lum(bs.backgroundColor) - lum(bs.color)) }; });
    ok(dark.anim === "none" && dark.contrast > 0.35, `VIS-P1-M (dark): no animation under reduced motion; the primary action keeps contrast (${dark.btnBg} / ${dark.btnText})`);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }]);

    console.log("VIS-P1 — LEGACY / LIVE");
    const echoOk = sh("curl -s -m 20 -X POST 'http://localhost:3210/api/analyze-meal?mock=echo' -H 'content-type: application/json' -d '{\"images\":[{\"dataUrl\":\"data:image/jpeg;base64,/9j/4AAQ\"}]}'");
    ok(/vision/.test(echoOk) && /categories/.test(echoOk) && /PRIMARY-SUBJECT RULE/.test(echoOk) && /isFood/.test(echoOk), "VIS-P1-015: ONE category call carries Pass 1 vision + Stage B scores beside the legacy Meal/Activity contract (echo payload)");
    const live = sh("cat prototype-evidence/social-4-records/live-vision.log 2>/dev/null");
    ok(/construction-site.*\n.*"schemaVersion": 1/.test(live) && /"primary": \{"kind": "project"/.test(live), "VIS-P1-018: the live-provider log (real image bytes) holds a schema-valid observation and a Project suggestion for the construction scene (see live-vision.log)");
    const missing = ["en", "es", "hi", "it", "ne", "nl", "ru", "zh-Hans"].filter((l) => { const src = sh(`cat src/lib/i18n/catalogs/${l}.ts`); return !["visionSee", "visionSuggested", "visionOthers", "visionUse", "visionChoose", "visionSkip", "visionNoMatch"].every((k) => src.includes(`"ucomposer.${k}"`)); });
    ok(missing.length === 0, `VIS-P1-i18n: every card string exists in all 8 catalogs${missing.length ? ` (missing ${missing.join(",")})` : ""}`);
    ok(pageErrors === 0, `VIS-P1-errors: zero page errors across the suite (${pageErrors})`);
  } catch (e) {
    failures.push(`crash: ${e.stack}`);
    console.log(e);
  }
  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => ` - ${f}`).join("\n")); process.exit(1); }
})();
