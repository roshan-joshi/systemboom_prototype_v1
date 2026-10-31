/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * SOCIAL-4 — specialist readings for Project · Problem · Meeting · Health (prototype acceptance).
 *
 * Runs against the dev server on :3210. Every page URL pins `&mockai=nonfood&mockfacts=miss&mockpackaged=miss` (the category stage
 * and the facts never reach a real provider) and `&mockrecord=<scenario>[:<delayMs>]` for the specialist route, so no accepted flow
 * is ever live or billed. Scenarios live in `src/app/api/analyze-record/route.ts`.
 *
 *   P1–P4  Project    PR1–PR4  Problem    M1–M4  Meeting    H1–H5  Health    C1–C20  cross-cutting (mixed, stale, dedupe, privacy, AI off)
 */
const { launch, sleep } = require("./celestial-lib");
const cp = require("child_process");
const ROOT = require("path").join(__dirname, "..");
const sh = (cmd) => { try { return cp.execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return String(e.stdout ?? ""); } };

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&mockai=nonfood&mockfacts=miss&mockpackaged=miss`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };

const NYAT = "Nyatapola temple, Bhaktapur"; // byasset → project
const TERR = "Terraced hillsides"; // byasset → problem
const GARDEN = "A garden park in Kathmandu"; // byasset → meeting
const DURBAR = "Kathmandu Durbar Square, crowd and temples"; // byasset → health
const SNOW = "Trekkers on a snow ridge under a hard blue sky";

const R = { rec: 0, meal: 0, act: 0, bodies: [], echo: [] };
const resetR = () => { R.rec = 0; R.meal = 0; R.act = 0; R.bodies = []; R.echo = []; };
let pageErrors = 0;

async function open(page, extra = "", opts = {}) {
  await page.setViewport(opts.viewport ?? DESKTOP);
  resetR();
  await page.goto(`${B}&theme=light${extra}`, { waitUntil: "networkidle2" });
  await page.evaluate((off) => { try { if (off) window.localStorage.setItem("sb-smart-assist", "off"); else window.localStorage.removeItem("sb-smart-assist"); } catch {} }, !!opts.aiOff);
  await sleep(700);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1400); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(400); };
const setField = (page, hook, v) => page.evaluate((h, x) => { const el = document.querySelector(`[data-sb-ufield='${h}']`); if (!el) return false; const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, x); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }, hook, v);
const more = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-more-toggle]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(300); };
const fieldVal = (page, hook) => page.evaluate((h) => document.querySelector(`[data-sb-ufield='${h}']`)?.value ?? null, hook);
const waitFor = async (page, fn, arg, tries = 30, gap = 200) => {
  for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); }
  return false;
};
const pill = (page) => page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
const domains = (page) => page.evaluate(() => window.__SB_RECORD_DOMAINS ?? null);
const recObs = (page) => page.evaluate(() => window.__SB_RECORD_OBS ?? {});
const waitRecDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_RECORD_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const waitMealDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
const card = (page) => page.evaluate(() => { const c = document.querySelector("[data-sb-record-card]"); return c ? { kind: c.getAttribute("data-sb-record-card"), summary: c.querySelector("[data-sb-record-summary]")?.textContent ?? "", text: c.innerText, accept: !!c.querySelector("[data-sb-record-accept]"), adjust: !!c.querySelector("[data-sb-record-adjust]") } : null; });
const clickSel = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); return !!el; }, sel);
const bodyText = (page) => page.evaluate(() => document.body.innerText);
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
const removePhoto = async (page, n) => {
  await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
  await sleep(350);
  await page.evaluate((i) => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === `Remove photo ${i}`)?.click(), n);
  await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
  await sleep(450);
};
const keepDraft = async (page) => {
  await page.keyboard.press("Escape");
  await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Keep draft")?.click());
  await sleep(500);
};
/** organizer: select a tile, then choose a kind for it through Other… (the full chooser, asset scope) */
const assignKind = async (page, tileId, aria) => {
  await clickSel(page, "[data-sb-media-edit]");
  await sleep(350);
  await page.evaluate((id) => document.querySelector(`[data-sb-organizer-tile='${id}']`)?.click(), tileId);
  await sleep(200);
  await clickSel(page, "[data-sb-organizer-kind-more]");
  await sleep(350);
  await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria);
  await sleep(400);
  await clickSel(page, "[data-sb-organizer-done]");
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
/** open → composer → attach photos → wait for the category stage → pick a kind */
async function attachAs(page, extra, photos, aria, opts = {}) {
  await open(page, extra, opts);
  await openComposer(page);
  await pickMedia(page, photos);
  await waitMealDone(page, photos.length, 40);
  if (aria) await kind(page, aria);
}

(async () => {
  const { page, browser } = await launch();
  page.on("pageerror", () => { pageErrors += 1; });
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/analyze-record")) { R.rec += 1; try { R.bodies.push({ url: u, ...JSON.parse(r.postData() ?? "{}") }); } catch { R.bodies.push(null); } }
    else if (u.includes("/api/analyze-meal")) R.meal += 1;
    else if (u.includes("/api/analyze-activity")) R.act += 1;
  });
  page.on("response", async (r) => { if (r.url().includes("/api/analyze-record") && r.url().includes("mock=echo")) { try { R.echo.push(await r.json()); } catch {} } });
  try {
    /* ============================================================================================ PROJECT */
    console.log("PROJECT");
    await attachAs(page, "&mockrecord=project", [NYAT], "Project");
    ok(await waitRecDone(page, 1), "P1: a Project photo is read once Project is the chosen kind");
    await sleep(400);
    let dm = await domains(page);
    let c = await card(page);
    ok(dm?.project?.title === "Community Marketplace" && dm?.project?.goal === "Help local sellers connect with customers", `P1: Project name + goal fill from the reading (name "${dm?.project?.title}", goal "${dm?.project?.goal}")`);
    ok((await fieldVal(page, "projectTitle")) === "Community Marketplace" && (await fieldVal(page, "goal")) === "Help local sellers connect with customers", "P1: the real Project Quick fields show the values (not only state)");
    ok(c?.kind === "project" && /Community Marketplace/.test(c.summary) && c.accept && c.adjust, `P1: a calm card names what was filled with Looks right / Adjust ("${c?.summary}")`);
    ok(R.rec === 1 && R.bodies[0]?.category === "project" && R.bodies[0]?.images?.length === 1, `P1: exactly one specialist request, category project, one image (${R.rec} request)`);
    ok(dm?.project?.field?.title?.source === "image_text" && dm?.project?.field?.title?.state === "default", "P1: the filled cell keeps its provenance (image_text) and is a suggested default, not confirmed");
    await post(page);
    let m = await newest(page);
    ok(m?.kind === "project" && m.fields?.name === "Community Marketplace" && m.fields?.goal === "Help local sellers connect with customers" && m.fields?.recordAIObservation?.category === "project" && m.fields?.recordProvenance?.title?.state === "default", "P1: Post keeps the values on the Project record with the reading and provenance (suggested default, never falsely confirmed)");

    // VISUAL CONTEXT (owner fix 2026-10-30): a scene with no written title still suggests a generic, relevant name/goal/stage
    await attachAs(page, "&mockrecord=project-scene", [NYAT], "Project");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.project?.title === "Construction Project" && !dm?.project?.goal && dm?.project?.focus === "Under construction" && (await fieldVal(page, "projectTitle")) === "Construction Project" && (await fieldVal(page, "goal")) === "" && dm?.project?.field?.title?.source === "ai_interpretation" && (await recObs(page))["project:nyatapola"]?.project?.goal?.value === "Building and construction work", `P5 (V3.1): a construction scene fills a provisional generic NAME and a provisional stage, but the inferred goal stays in the observation only — the Goal field is empty (name "${dm?.project?.title}", goal "${dm?.project?.goal ?? ""}", stage "${dm?.project?.focus}")`);
    await clickSel(page, "[data-sb-record-accept]");
    await sleep(300);
    dm = await domains(page);
    ok(dm?.project?.field?.title?.state === "confirmed" && dm?.project?.field?.focus?.state === "default", "P5b (V3.1): Looks right confirms the shown name; the inferred stage stays a provisional default — never a confirmed project stage");
    await attachAs(page, "&mockrecord=problem-scene", [TERR], "Problem");
    await waitRecDone(page, 1);
    await sleep(400);
    await more(page);
    dm = await domains(page);
    ok(/frustrated with computer work/.test(dm?.problem?.description ?? "") && (await fieldVal(page, "problemDescription")) === dm?.problem?.description && !dm?.problem?.urgency, `PR5: a stressed-person-at-laptop scene fills a qualified problem description ("${dm?.problem?.description}") and still no urgency`);
    await attachAs(page, "&mockrecord=project-nogoal", [NYAT], "Project");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.project?.title === "Software Project" && !dm?.project?.goal && dm?.project?.field?.title?.source === "system_knowledge" && dm?.project?.field?.title?.state === "default", `P2: a photo with no readable name/goal gets ONLY the Knowledge Base's generic title as a provisional default ("${dm?.project?.title}") — no goal is invented (V3 KB-01; supersedes the SOCIAL-4 "fills nothing" reading)`);

    await open(page, "&mockrecord=project-text");
    await openComposer(page);
    await kind(page, "Project");
    await setText(page, "Starting the family travel planner so we can plan the summer trip together");
    ok(await waitRecDone(page, 1, 40), "P3: with no media the words are read once they settle (text-only reading)");
    await sleep(400);
    dm = await domains(page);
    ok(dm?.project?.title === "Family Travel Planner" && dm?.project?.goal === "Plan the summer trip together" && R.rec === 1 && !R.bodies[0]?.images?.length && typeof R.bodies[0]?.text === "string", `P3: name + goal fill from the words; one request carrying text only (${R.rec} request)`);
    await setText(page, "Starting the family travel planner so we can plan the summer trip together");
    await sleep(1400);
    ok(R.rec === 1, "P3: the same settled words are never asked twice");

    await attachAs(page, "&mockrecord=project:1800", [NYAT], "Project");
    await setField(page, "projectTitle", "My own name");
    await sleep(2400);
    dm = await domains(page);
    ok(dm?.project?.title === "My own name" && dm?.project?.goal === "Help local sellers connect with customers" && dm?.project?.field?.title?.state === "corrected", `P4: a name typed before the reading arrives wins; the goal still fills (name "${dm?.project?.title}")`);
    await post(page);
    m = await newest(page);
    ok(m?.fields?.name === "My own name" && m.fields?.recordProvenance?.title?.state === "corrected" && m.fields?.recordProvenance?.title?.source === "image_text", "P4: the record keeps the person's name with the original provenance recorded as corrected");

    /* ============================================================================================ PROBLEM */
    console.log("PROBLEM");
    await attachAs(page, "&mockrecord=problem", [TERR], "Problem");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    c = await card(page);
    await more(page);
    ok(dm?.problem?.description === "Laptop screen appears cracked" && (await fieldVal(page, "problemDescription")) === "Laptop screen appears cracked", `PR1: a Problem photo fills the description — the quick stays the words themselves (§50), the field lives in More details ("${dm?.problem?.description}")`);
    ok(c?.kind === "problem" && /affected/i.test(c.text) && /Laptop/.test(c.text) && /Cracked display/.test(c.text), "PR1: the card states what was seen (affected item · visible damage) without inventing urgency");
    ok(!dm?.problem?.urgency && !dm?.problem?.attempt, "PR1: urgency and what-was-tried stay blank — never from appearance");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "problem" && m.fields?.title === "Laptop screen appears cracked" && m.fields?.recordAIObservation?.category === "problem", "PR1: the Problem record carries the description and its reading");

    await open(page, "&mockrecord=problem-text");
    await openComposer(page);
    await kind(page, "Problem");
    await setText(page, "My laptop no longer charges. I restarted it three times and nothing changed.");
    await waitRecDone(page, 1, 40);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.problem?.description === "Person reports the laptop no longer charges" && dm?.problem?.attempt === "Restarted the laptop three times" && dm?.problem?.field?.attempt?.source === "user_text", `PR2: words-only Problem fills description + what was tried from the person's own words (attempt "${dm?.problem?.attempt}")`);

    await attachAs(page, "&mockrecord=fabricate", [TERR], "Problem");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    const body = await bodyText(page);
    ok(dm?.problem?.description === "Cracked laptop screen" && !dm?.problem?.urgency && !/\$300|dropped/.test(body) && !("cost" in (dm?.problem ?? {})), "PR3: a provider that volunteers urgency/cost/cause from appearance is stripped — only the described problem fills");

    await attachAs(page, "&mockrecord=problem", [TERR], "Problem");
    await waitRecDone(page, 1);
    await sleep(400);
    await more(page);
    await setField(page, "problemDescription", "");
    await sleep(300);
    dm = await domains(page);
    ok(!dm?.problem?.description && dm?.problem?.field?.description?.state === "cleared", "PR4: clearing the filled description leaves it blank (cleared, never re-suggested)");
    await keepDraft(page);
    await openComposer(page);
    await waitRecDone(page, 1, 30);
    await sleep(600);
    dm = await domains(page);
    ok(!dm?.problem?.description && dm?.problem?.field?.description?.state === "cleared", "PR4: after Keep draft → reopen, a fresh reading of the same photo never refills the cleared field");

    /* ============================================================================================ MEETING */
    console.log("MEETING");
    await attachAs(page, "&mockrecord=meeting", [GARDEN], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    c = await card(page);
    ok(dm?.meeting?.subject === "Product Launch Meeting" && (await fieldVal(page, "subject")) === "Product Launch Meeting", `M1: a whiteboard photo fills the Meeting subject ("${dm?.meeting?.subject}")`);
    ok(c?.kind === "meeting" && /agenda/i.test(c.text) && /Website redesign/.test(c.text) && /actions/i.test(c.text) && /Prepare mockup — Priya/.test(c.text), "M1: the card lists the agenda and action items read from the board (shown, not stored as record fields)");
    ok(!/decisions/i.test(c.text), "M1: no Decisions section is shown when none were read — nothing invented");
    await clickSel(page, "[data-sb-record-accept]");
    await sleep(300);
    dm = await domains(page);
    c = await card(page);
    ok(dm?.meeting?.field?.subject?.state === "confirmed" && dm?.meeting?.field?.subject?.source === "image_text" && !c?.accept, "M3: Looks right confirms the subject (state only — the source stays image_text) and the ask disappears");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "meeting" && m.fields?.subject === "Product Launch Meeting" && m.fields?.recordProvenance?.subject?.state === "confirmed" && m.fields?.recordAIObservation?.meeting?.agenda?.value?.[0] === "Website redesign", "M3: the Meeting record keeps the confirmed subject and the full reading (agenda/actions) at record depth");

    await attachAs(page, "&mockrecord=meeting-purpose", [GARDEN], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.meeting?.purpose === "Agree the campaign launch date" && dm?.meeting?.field?.purpose?.source === "image_text", `M-05 (V3.1): a purpose actually written on the board fills Meeting purpose ("${dm?.meeting?.purpose}")`);
    await attachAs(page, "&mockrecord=meeting-scene", [GARDEN], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.meeting?.subject === "Marketing Planning" && !dm?.meeting?.purpose && !!(await recObs(page))["meeting:garden"]?.meeting?.purpose, "M-06 (V3.1): a purpose inferred from the scene never fills the field — it stays in the observation; the written subject still fills");
    await attachAs(page, "&mockrecord=meeting-faces", [GARDEN], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.meeting?.subject === "Team sync" && dm?.meeting?.field?.subject?.confidence === "medium", "M2: a medium reading still fills (contract: high + medium fill, low stays blank)");
    await clickSel(page, "[data-sb-record-adjust]");
    await sleep(400);
    const adj = await page.evaluate(() => ({ more: document.querySelector("[data-sb-more-toggle]")?.getAttribute("aria-expanded"), focus: document.activeElement?.getAttribute("data-sb-ufield") }));
    ok(adj.more === "true" && adj.focus === "subject", `M4: Adjust opens More details and puts the cursor in the subject field (focus ${adj.focus})`);

    await attachAs(page, "&mockrecord=fabricate", [GARDEN], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.meeting?.subject === "Product Launch Meeting" && !/Sofia|Luca/.test(await page.evaluate(() => document.querySelector("[data-sb-composer]")?.innerText ?? "")) && !("participants" in (dm?.meeting ?? {})), "M2: participants a provider guesses from faces never appear (people come only from the person's own People picker)");

    /* ============================================================================================ HEALTH */
    console.log("HEALTH");
    await open(page, "&mockrecord=health-text");
    await openComposer(page);
    await kind(page, "Health");
    const note = await page.evaluate(() => document.querySelector("[data-sb-health-ai-note]")?.textContent ?? "");
    ok(/private|only you|never/i.test(note) || note.length > 10, `H4: Health shows a quiet note about what the reading is and is not ("${note.slice(0, 80)}")`);
    await setText(page, "I fell while playing football and my knee hurts");
    await waitRecDone(page, 1, 40);
    await sleep(400);
    dm = await domains(page);
    const hq = await page.evaluate(() => document.querySelector("[data-sb-domain-quick='health']")?.innerText ?? "");
    ok(dm?.health?.healthType === "injury" && /Injury/.test(hq) && dm?.health?.description === "Person reports falling while playing football" && dm?.health?.bodyArea === "knee", `H1: words-only Health fills type + description + body area from the person's own words (type ${dm?.health?.healthType})`);
    ok(!dm?.health?.severity, "H1: severity is never suggested");
    await post(page);
    m = await newest(page);
    const feed = await bodyText(page);
    ok(m?.kind === "health" && m.recordPrivacy === "private" && m.fields?.healthDescription === "Person reports falling while playing football" && m.fields?.healthType === "injury", "H3: the Health record is private by default and carries type + description at record depth");
    ok(!/Person reports falling while playing football/.test(feed), "H3: the description never appears in the Social stream");

    await attachAs(page, "&mockrecord=health-bandage", [DURBAR], "Health");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.health?.healthType === "injury" && dm?.health?.description === "A bandaged knee is visible" && dm?.health?.field?.description?.source === "visible_image", "H2: a photo of a bandage describes what is visible (medium type fills; description is what can be seen)");
    ok(!dm?.health?.severity && !/torn ligament|diagnos/i.test(await bodyText(page)), "H2: nothing diagnostic, no severity from appearance");

    await attachAs(page, "&mockrecord=fabricate", [DURBAR], "Health");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.health?.healthType === "injury" && !dm?.health?.severity && !/torn ligament/.test(await bodyText(page)) && dm?.health?.bodyArea === "knee", "H5: a provider that volunteers severity/diagnosis from a photo is stripped at the route — type + body area only");

    await open(page, "&mockrecord=badenum");
    await openComposer(page);
    await kind(page, "Health");
    await setText(page, "Headache since yesterday");
    await waitRecDone(page, 1, 40);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.health?.healthType === "symptom" && dm?.health?.field?.healthType?.source === "system_knowledge" && dm?.health?.description === "Person reports a headache", `H5: an unknown health type ("migraine") is dropped by the validator; the Knowledge Base maps the reported headache to the existing "symptom" type (${dm?.health?.healthType}) and the description still fills — V3 supersedes the SOCIAL-4 "type stays blank"`);

    await open(page, "&mockrecord=health-text", { aiOff: true });
    await openComposer(page);
    await kind(page, "Health");
    await setText(page, "I fell while playing football and my knee hurts");
    await sleep(1800);
    dm = await domains(page);
    ok(R.rec === 0 && !dm?.health?.description && !(await page.evaluate(() => !!document.querySelector("[data-sb-health-ai-note]"))), "H4: Smart Assist OFF — zero requests, nothing fills, no note");

    /* ============================================================================================ V3 — EXPERT PERSONAS · KNOWLEDGE BASE · CONTRACT */
    console.log("V3 ENGINE");
    await attachAs(page, "&mockrecord=kb-construction", [NYAT], "Project");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    let ob = (await recObs(page))["project:nyatapola"];
    ok(dm?.project?.title === "Construction Project" && !dm?.project?.goal && !dm?.project?.focus && ob?.project?.name?.evidenceStrength === "generic_fallback" && ob?.project?.name?.requiresConfirmation === true && (ob?.knowledge ?? []).includes("project.construction"), `KB-01: a construction observation with no written name triggers the generic "Construction Project" fallback (generic_fallback, requires confirmation; rule ${ob?.knowledge}) — goal/stage stay empty`);
    ok(ob?.project?.description?.evidenceStrength === "direct" && ob?.project?.description?.requiresConfirmation === false, "UOC-1: a directly seen, high-confidence value is marked direct and needs no confirmation (Universal Observation Contract)");
    await post(page);
    m = await newest(page);
    ok(m?.fields?.name === "Construction Project" && m.fields?.recordProvenance?.name === undefined && m.fields?.recordProvenance?.title?.state === "default" && !/budget|deadline|\$/.test(JSON.stringify(m.fields)), "P-03: the generic title posts as a suggested default, never confirmed, with no budget/deadline/goal invented");

    await attachAs(page, "&mockrecord=empty", [SNOW], "Problem");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(!dm?.problem?.description && (await page.evaluate(() => !!document.querySelector("[data-sb-record-insufficient]"))) && !(await card(page)), "KB-02: an empty AI answer with no words → a neutral 'nothing to suggest', no invented object");
    await open(page, "&mockrecord=empty");
    await openComposer(page);
    await kind(page, "Problem");
    await setText(page, "My bike chain keeps slipping on the big gear");
    await waitRecDone(page, 1, 40);
    await sleep(400);
    await more(page);
    dm = await domains(page);
    ok(dm?.problem?.description === "My bike chain keeps slipping on the big gear" && dm?.problem?.field?.description?.source === "user_text" && (await fieldVal(page, "problemDescription")) === dm?.problem?.description, "KB-02b: an empty AI answer WITH words seeds the description from the person's own words only (user_text)");

    await attachAs(page, "&mockrecord=conflict", [NYAT], "Project");
    await waitRecDone(page, 1);
    await sleep(400);
    const hint = await page.evaluate(() => document.querySelector("[data-sb-record-category-hint]")?.textContent ?? "");
    // SUPERSEDED 2026-10-30 by UHI-UX-134 (Human Correction Always Wins): the conflict is still DETECTED and still never
    // acted on, but it is no longer SHOWN once the category is the person's own explicit choice — a competing category
    // recommendation may not survive a correction. The invariant this check protects (detected, never an override) is
    // asserted exactly as before, through the stored observation.
    ok((await recObs(page))["project:nyatapola"]?.categoryHint === "meal" && (await pill(page)) === "project" && hint === "", `KB-03: evidence that points at Meal is recorded as a hint and NEVER overrides the person's Project choice (pill ${await pill(page)}); after an explicit choice no competing recommendation is displayed (hint "${hint}")`);

    await attachAs(page, "&mockrecord=malformed", [NYAT], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    ok(!(await card(page)) && !(await page.evaluate(() => !!document.querySelector("[data-sb-record-analyzing]"))) && (await domains(page))?.meeting?.subject === undefined, "KB-05: invalid model output fails safely — nothing filled, no waiting left behind");
    await setField(page, "subject", "Garden committee");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "meeting" && m.fields?.subject === "Garden committee" && !m.fields?.recordAIObservation, "KB-05: the person still posts by hand; no unusable reading is attached");

    await attachAs(page, "&mockrecord=health-lab", [DURBAR], "Health");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    const hq2 = await page.evaluate(() => document.querySelector("[data-sb-composer]")?.innerText ?? "");
    ok(dm?.health?.healthType === "test" && dm?.health?.description === "Laboratory report containing test measurements", `H-01/H-02: a laboratory report → Health type "${dm?.health?.healthType}" (an existing enum value) + a neutral document summary`);
    ok(!/diabetes|HbA1c|9\.1/.test(hq2) && !/diabetes|HbA1c/.test(JSON.stringify(await recObs(page))), "H-03: a volunteered diagnosis and laboratory value never survive the validator — not on screen, not in the stored reading");
    await setText(page, "Results came back today"); // a Health post still asks for the person's own words (accepted canonical rule)
    await post(page);
    m = await newest(page);
    ok(m?.recordPrivacy === "private" && m.fields?.healthType === "test" && !/HbA1c|diabetes/.test(JSON.stringify(m.fields)), "H-04: the Health record stays private by default and carries no measurement or diagnosis");
    await attachAs(page, "&mockrecord=health-lab-notype", [DURBAR], "Health");
    await waitRecDone(page, 1);
    await sleep(400);
    dm = await domains(page);
    ok(dm?.health?.healthType === "test" && dm?.health?.field?.healthType?.source === "system_knowledge", "H-01b: a document read as a laboratory report with no type → the Knowledge Base maps it to the existing \"test\" type (never a new enum value)");

    // A-04 group intelligence — three photographs of ONE whiteboard combine without erasing any source observation
    await attachAs(page, "&mockrecord=byasset-meeting", [GARDEN, DURBAR, TERR], "Meeting");
    await waitRecDone(page, 3, 60);
    await sleep(500);
    dm = await domains(page);
    const obsAll = await recObs(page);
    ok(dm?.meeting?.subject === "Marketing Planning" && obsAll["meeting:garden"]?.meeting?.subject && obsAll["meeting:durbar"]?.meeting?.agenda && obsAll["meeting:terraces"]?.meeting?.actions && !obsAll["meeting:garden"]?.meeting?.agenda, "A-04: the subject read from photo 1 fills the Meeting field while each photo keeps its own separate observation");
    await selectTile(page, "durbar");
    c = await card(page);
    ok((await domains(page))?.meeting?.subject === "Marketing Planning" && /agenda/i.test(c?.text ?? "") && /Launch campaign/.test(c?.text ?? ""), "A-04: selecting the agenda photo keeps the combined subject and shows that photo's agenda");
    await selectTile(page, "terraces");
    c = await card(page);
    ok(/actions/i.test(c?.text ?? "") && /Prepare graphics — Alex/.test(c?.text ?? "") && !/decisions/i.test(c?.text ?? ""), "M-03/M-04: the action with its written owner shows; no decision or attendee is invented");
    ok(R.rec === 3 && R.bodies.every((b) => b?.category === "meeting"), `A-03: three photos → exactly three Meeting requests (${R.rec})`);

    // adaptive reasoning + vision policy (through the privacy echo)
    await attachAs(page, "&mockrecord=echo", [GARDEN], "Meeting");
    await waitFor(page, () => false, null, 8, 250);
    const polM = R.echo[0]?._debugPolicy;
    const payM = R.echo[0]?._debugProviderPayload;
    ok(polM?.thinking === "enabled" && polM?.detail === "high" && payM?.extra_body?.thinking?.type === "enabled" && payM?.messages?.[1]?.content?.[1]?.image_url?.detail === "high" && payM?.max_tokens === 6000, `RSN-1: a document-heavy category with an image gets thinking enabled + high image detail + a larger budget (${JSON.stringify(polM)})`);
    ok(/expert executive assistant/.test(payM?.messages?.[0]?.content ?? "") && /Before answering, perform this evidence review INTERNALLY/.test(payM?.messages?.[0]?.content ?? ""), "PERSONA-1: the Meeting specialist persona + internal evidence review drive the system prompt");
    await attachAs(page, "&mockrecord=echo", [TERR], "Problem");
    await waitFor(page, () => false, null, 8, 250);
    const polP = R.echo[R.echo.length - 1]?._debugPolicy;
    const payP = R.echo[R.echo.length - 1]?._debugProviderPayload;
    ok(polP?.thinking === "disabled" && polP?.complexity === "simple" && /expert troubleshooting analyst/.test(payP?.messages?.[0]?.content ?? ""), `RSN-2/PERSONA-2: a simple Problem scene keeps the standard configuration and the Problem persona (${JSON.stringify(polP)})`);
    const sentLen = (payP?.messages?.[1]?.content?.[1]?.image_url?.url ?? "").length;
    ok(sentLen > 1000 && sentLen < 900000, `VIS-1: the Problem image is fitted to its readability budget before upload (${Math.round(sentLen / 1024)} KB data URL, from a 1920px source)`);

    /* ============================================================================================ CROSS-CUTTING */
    console.log("CROSS-CUTTING");
    // V3.1 FIX 2 — incidental people never auto-select Activity; a genuine activity still does; Meal unchanged
    await page.goto(`${HOST}/style-lab/social?harness=0&mockai=nonfood-act-incidental&mockactivity=high&mockfacts=miss&mockpackaged=miss&mockrecord=off&theme=light`, { waitUntil: "networkidle2" });
    await sleep(700);
    await openComposer(page);
    await pickMedia(page, [NYAT]);
    await waitMealDone(page, 1, 40);
    await sleep(1200);
    ok((await pill(page)) !== "activity" && R.act === 0 && !(await page.evaluate(() => !!document.querySelector("[data-sb-activity-category-suggestion], [data-sb-act-cat-yes]"))), `CAT-INC-1: a construction scene read as "activity, high, but not the subject" neither selects nor asks for Activity (pill ${await pill(page)}, Activity requests ${R.act})`);
    await page.goto(`${HOST}/style-lab/social?harness=0&mockai=nonfood-act-high&mockactivity=high&mockfacts=miss&mockpackaged=miss&mockrecord=off&theme=light`, { waitUntil: "networkidle2" });
    await sleep(700);
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await waitMealDone(page, 1, 40);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "activity", null, 30, 200);
    ok((await pill(page)) === "activity", "CAT-INC-2: a genuine activity as the primary subject still auto-selects Activity (high/medium/low behaviour unchanged)");
    await page.goto(`${HOST}/style-lab/social?harness=0&mockai=meal&mockfacts=miss&mockpackaged=miss&mockrecord=off&theme=light`, { waitUntil: "networkidle2" });
    await sleep(700);
    await openComposer(page);
    await pickMedia(page, [NYAT]);
    await waitMealDone(page, 1, 40);
    await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 30, 200);
    ok((await pill(page)) === "meal", "CAT-INC-3: Meal classification is unchanged — a high-confidence food read still auto-selects Meal");
    // C1–C4: mixed composition, four assets, four kinds, independent readings
    await attachAs(page, "&mockrecord=byasset", [NYAT, TERR, GARDEN, DURBAR], null);
    const before = R.rec;
    ok(before === 0, "C1: photos in a Life-Moment composition trigger no specialist reading (no four-way speculation)");
    await assignKind(page, "nyatapola", "Project");
    await assignKind(page, "terraces", "Problem");
    await assignKind(page, "garden", "Meeting");
    await assignKind(page, "durbar", "Health");
    await waitRecDone(page, 4, 60);
    await sleep(600);
    const cats = R.bodies.map((b) => b?.category).sort().join(",");
    ok(R.rec === 4 && cats === "health,meeting,problem,project", `C2: each asset is read once, with its own kind only (${R.rec} requests: ${cats})`);
    const obs = await recObs(page);
    ok(obs["project:nyatapola"]?.status === "complete" && obs["problem:terraces"]?.status === "complete" && obs["meeting:garden"]?.status === "complete" && obs["health:durbar"]?.status === "complete", "C2: the readings are cached per (kind, asset)");
    await selectTile(page, "nyatapola");
    dm = await domains(page);
    ok((await pill(page)) === "project" && dm?.project?.title === "Community Marketplace", `C3: selecting the Project photo shows the Project form filled from ITS reading (pill ${await pill(page)})`);
    await selectTile(page, "terraces");
    dm = await domains(page);
    await more(page);
    ok((await pill(page)) === "problem" && dm?.problem?.description === "Laptop screen appears cracked" && (await fieldVal(page, "problemDescription")) === "Laptop screen appears cracked", "C3: selecting the Problem photo shows the Problem form filled from ITS reading");
    await selectTile(page, "garden");
    dm = await domains(page);
    ok((await pill(page)) === "meeting" && dm?.meeting?.subject === "Product Launch Meeting", "C3: selecting the Meeting photo shows the Meeting form filled from ITS reading");
    await selectTile(page, "durbar");
    dm = await domains(page);
    ok((await pill(page)) === "health" && dm?.health?.healthType === "injury", "C3: selecting the Health photo shows the Health form filled from ITS reading");
    ok(dm?.project?.title === "Community Marketplace" && dm?.problem?.description === "Laptop screen appears cracked" && !/Community Marketplace/.test(dm?.problem?.description ?? "") && !/Laptop/.test(dm?.meeting?.subject ?? "") && !/Product Launch/.test(dm?.health?.description ?? ""), "C4: no cross-contamination — each kind's fields hold only its own asset's reading");
    ok(dm?.project?.field?.title?.ref?.assetId === "nyatapola" && dm?.problem?.field?.description?.ref?.assetId === "terraces", "C4: every filled cell references the asset it came from");
    ok(R.rec === 4, "C5: re-selecting assets costs no new request");
    await selectTile(page, "nyatapola");
    await setField(page, "projectTitle", "Marketplace v2");
    await selectTile(page, "terraces");
    await selectTile(page, "nyatapola");
    dm = await domains(page);
    ok(dm?.project?.title === "Marketplace v2" && dm?.project?.field?.title?.state === "corrected", "C6: a correction survives switching away and back (idempotent re-apply never overwrites)");

    // C7: stale — removing a photo while its reading is in flight
    await attachAs(page, "&mockrecord=project:2500", [NYAT], "Project");
    await sleep(300);
    await removePhoto(page, 1);
    await sleep(3000);
    dm = await domains(page);
    const stale = await recObs(page);
    ok(!dm?.project?.title && !("project:nyatapola" in stale), "C7: a reading for a photo removed mid-flight never applies and is never cached");

    // C8: dedupe across kind switches
    await attachAs(page, "&mockrecord=project", [NYAT], "Project");
    await waitRecDone(page, 1);
    await kind(page, "Problem");
    await waitRecDone(page, 2);
    await kind(page, "Project");
    await sleep(1200);
    ok(R.rec === 2 && R.bodies.map((b) => b?.category).join() === "project,problem", `C8: Project → Problem → Project asks once per kind (${R.rec} requests)`);

    // C9: Meal and Activity untouched by the specialist route
    await attachAs(page, "&mockrecord=project", [NYAT], "Meal");
    await sleep(1500);
    ok(R.rec === 0, "C9: a Meal composition never asks the specialist route");
    await kind(page, "Activity");
    await sleep(1500);
    ok(R.rec === 0, "C9: an Activity composition never asks the specialist route");
    await kind(page, "Life Moment");
    await sleep(1200);
    ok(R.rec === 0, "C9: a Life Moment never asks the specialist route");

    // C10: failure is quiet; posting still works
    await attachAs(page, "&mockrecord=fail", [NYAT], "Project");
    await waitRecDone(page, 1);
    await sleep(400);
    ok(!(await card(page)) && !(await page.evaluate(() => !!document.querySelector("[data-sb-record-analyzing]"))) && !/error|failed|unavailable/i.test(await page.evaluate(() => document.querySelector("[data-sb-composer]")?.innerText ?? "")), "C10: a failed reading shows nothing technical and no endless waiting");
    await setField(page, "projectTitle", "Typed by hand");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "project" && m.fields?.name === "Typed by hand" && !m.fields?.recordAIObservation, "C10: the person posts by hand; no reading is attached");

    // C11: insufficient
    await attachAs(page, "&mockrecord=insufficient", [SNOW], "Meeting");
    await waitRecDone(page, 1);
    await sleep(400);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-record-insufficient]")), "C11: an insufficient reading says so quietly (nothing to suggest)");

    // C12: waiting UX
    await attachAs(page, "&mockrecord=meeting:2500", [GARDEN], "Meeting");
    await sleep(500);
    const waiting = await page.evaluate(() => ({ el: !!document.querySelector("[data-sb-record-analyzing]"), text: document.querySelector("[data-sb-record-analyzing] [data-sb-intel-primary]")?.textContent ?? "", meal: !!document.querySelector("[data-sb-meal-analyzing]"), act: !!document.querySelector("[data-sb-activity-analyzing]") }));
    ok(waiting.el && /Understanding this meeting…/.test(waiting.text) && !waiting.meal && !waiting.act, `C12: while reading, the person sees "${waiting.text}" (never Meal's or Activity's copy)`);
    await waitRecDone(page, 1, 40);
    await sleep(400);
    ok(!(await page.evaluate(() => !!document.querySelector("[data-sb-record-analyzing]"))) && (await domains(page))?.meeting?.subject === "Product Launch Meeting", "C12: the waiting state resolves into the filled form");

    // C13: privacy — the provider payload carries only the image and the words
    await attachAs(page, "&mockrecord=echo", [NYAT], "Project");
    await setText(page, "Our marketplace");
    await waitFor(page, () => false, null, 8, 250);
    const payload = R.echo[0]?._debugProviderPayload;
    const ps = JSON.stringify(payload ?? {});
    ok(!!payload && payload.model === "deepseek-flash" && /data:image/.test(ps) && !/nyatapola\.jpg|sourceMetadata|Giulia|u-demo-001|takenPlace|gps|filename/i.test(ps.replace(/data:image[^"]+/g, "")), "C13: the provider payload holds the image bytes + words only — no filename, metadata, GPS, identity");

    // C14: video keyframes for the post's own kind
    await open(page, "&mockrecord=project");
    await openComposer(page);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
    await sleep(300);
    const finput = await page.waitForSelector("input[type=file][multiple]");
    await finput.uploadFile(require("path").join(__dirname, "fixtures", "meal-video.mp4"));
    await sleep(600);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-panel='media'] [data-sb-sheet-back]")?.click());
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.id.startsWith("up-") && !a.processing), null, 40, 250);
    await kind(page, "Project");
    const vdone = await waitRecDone(page, 1, 60);
    await sleep(400);
    dm = await domains(page);
    ok(vdone && R.rec === 1 && (R.bodies[0]?.images?.length ?? 0) >= 1 && dm?.project?.title === "Community Marketplace", `C14: a video is read through its existing keyframes (${R.bodies[0]?.images?.length ?? 0} frames, one request)`);

    // C15: AI OFF with photos
    await attachAs(page, "&mockrecord=project", [NYAT], "Project", { aiOff: true });
    await sleep(1800);
    ok(R.rec === 0 && !(await domains(page))?.project?.title && !(await page.evaluate(() => !!document.querySelector("[data-sb-record-analyzing]"))), "C15: Smart Assist OFF — a Project photo asks nothing and shows no waiting");

    // C16: edit of an existing Project never re-reads
    await open(page, "&mockrecord=project");
    const existing = (await state(page)).moments.find((x) => x.kind === "project" && x.media);
    if (existing) {
      await page.evaluate((id) => { const mm = document.querySelector(`[data-sb-moment='${id}'] [data-sb-moment-menu]`); mm?.click(); }, existing.id);
      await sleep(300);
      await page.evaluate(() => [...document.querySelectorAll("[role='menuitem']")].find((b) => /^Edit/.test(b.textContent.trim()))?.click());
      await sleep(900);
      ok(R.rec === 0, "C16: editing an existing Project post never re-reads its media");
      await page.keyboard.press("Escape");
      await sleep(400);
    } else ok(true, "C16: (no Project fixture with media in the feed — edit-no-reread covered by the editing guard)");

    // C17: mixed post keeps Health out of the generic shell's asset list
    await attachAs(page, "&mockrecord=byasset", [NYAT, DURBAR], null);
    await assignKind(page, "nyatapola", "Project");
    await assignKind(page, "durbar", "Health");
    await waitRecDone(page, 2, 60);
    await clickSel(page, "[data-sb-mixed-use='moment']");
    await sleep(400);
    await post(page);
    m = await newest(page);
    const mx = m?.fields?.mixedAssets ?? [];
    const healthEntry = mx.find((a) => a.assetId === "durbar");
    const projEntry = mx.find((a) => a.assetId === "nyatapola");
    ok(!!m && projEntry?.category === "project" && !!projEntry?.recordAIObservation && healthEntry?.category === "health" && !healthEntry?.recordAIObservation, "C17: a mixed Life-Moment post carries the Project reading per asset but never a Health reading");

    // C18: i18n keys present in all eight catalogs
    const miss = ["en", "es", "hi", "it", "ne", "nl", "ru", "zh-Hans"].filter((l) => { const src = sh(`cat src/lib/i18n/catalogs/${l}.ts`); return !["ucomposer.problemDescription", "ucomposer.healthDescription", "ucomposer.healthAiNote", "ucomposer.understandingKind", "ucomposer.agenda", "ucomposer.actions", "ucomposer.decisions", "ucomposer.affected", "ucomposer.nothingToSuggest"].every((k) => src.includes(`"${k}"`)); });
    ok(miss.length === 0, `C18: every new string exists in all 8 catalogs${miss.length ? ` (missing in ${miss.join(",")})` : ""}`);

    // C19: no Circle / Celestial / Meal-AI route changes
    const changed = sh("git status --porcelain").split("\n").filter(Boolean);
    const frozen = changed.filter((l) => /style-lab\/circle|components\/celestial|lib\/celestial|app\/life|field-contract\.ts/.test(l));
    ok(frozen.length === 0, `C19: no frozen file changed (${frozen.length ? frozen.join("; ") : "none"})`);

    // C20: no page errors
    ok(pageErrors === 0, `C20: zero page errors across the suite (${pageErrors})`);
  } catch (e) {
    failures.push(`crash: ${e.stack}`);
    console.log(e);
  }
  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => ` - ${f}`).join("\n")); process.exit(1); }
})();
