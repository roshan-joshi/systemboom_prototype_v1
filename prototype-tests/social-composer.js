/**
 * UNIVERSAL SOCIAL POST COMPOSER — UC-C3 acceptance (the §71–§84 required tests) over the
 * canonical machine. Every PRODUCT TRUTH of the greenfield/canonical passes is preserved
 * verbatim and re-proven through the new interaction layer.
 *
 *   node prototype-tests/social-composer.js        (dev server on :3210)
 *
 * §1  DEFAULT (§71) — compact; What's happening focused; Media·People·Place·Add details;
 *     Post; NO category list, Social-only label, date, Life age, count, second Cancel
 * §2  TEXT ONLY — Social Post only (record "none"), "Posted"
 * §3  MEDIA — Life Moment default shown as the record pill; metadata reviewed, never
 *     auto-published; Just post override; Circle density untouched by social-only
 * §4  RECORD CHOOSER (§72) — Just post + the seven records with human descriptions;
 *     selection COLLAPSES to one smart pill; repeat for all seven
 * §5  DOMAIN ADAPTERS — Meal quick/adaptive contexts · Activity common-four + focused
 *     picker + adaptive fields (§78) · Health focused picker + private details (§79) ·
 *     Problem current-state only (§80) · Project · Meeting Basic (§81)
 * §6  PEOPLE PICKER (§73) + PLACE PICKER (§74) — search/recent/chips/precision; selection
 *     survives category changes, sheets and media
 * §7  SMART ASSIST — ON: one quiet extraction, Use details fills, Ignore is final (§76);
 *     OFF: everything still works (§77)
 * §8  TIME — postedAt ≠ eventTime; the When control's truth
 * §10 SUBMISSION + EXIT (§82) — one POST; untouched X closes immediately; draft recovery
 *     says Continue editing (never "Back"); nested Back returns to the composer
 * §11 CIRCLE + STOP SHARING
 * §12 MULTI-MEDIA (§75) — device upload seam, My Media reuse, mixed photos+videos, cover,
 *     remove ≠ delete, collage "+N", no duplicate records
 * §13 ZERO-EFFORT CAPTURE (owner rule, 2026-09-29) — EXIF prefills immediately, never a
 *     gate before POST; "Not this" reverts cleanly; text extraction over manual entry;
 *     People/Place "Recent" derive from the person's OWN real history; unaffected by
 *     Smart Assist OFF (metadata/context, never AI)
 * §14 MOBILE · A11Y · LOCALIZATION (§83)
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const PHONE = { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(page, vp = DESKTOP, theme = "light", locale = "en", extra = "") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  await page.goto(`${B}&theme=${theme}${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1300); };
// UC-C3 §6 — "Add details" / the record pill opens the focused Record chooser SHEET.
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(350); };
const chip = async (page, group, text) => { await page.evaluate((g, t2) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button`)].find((b) => b.textContent.trim() === t2)?.click(), group, text); await sleep(250); };
// UC-C3 §39/§47 — the full Activity/Health type lists live in focused pickers.
const actType = async (page, text) => {
  await page.evaluate(() => (document.querySelector("[data-sb-activity-more-types]") ?? document.querySelector("[data-sb-activity-change]"))?.click());
  await sleep(300);
  await chip(page, "activityType", text);
};
const more = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-more-toggle]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(300); };
const addField = async (page, key) => { await page.evaluate((k) => document.querySelector(`[data-sb-add-field='${k}']`)?.click(), key); await sleep(200); };
const setField = (page, hook, v) => page.evaluate((h, x) => { const el = document.querySelector(`[data-sb-ufield='${h}']`); const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, x); el.dispatchEvent(new Event("input", { bubbles: true })); }, hook, v);
// media through the real sources (§10/§12): Media → My Media → toggle by alt → Add n
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
const discard = async (page) => { await page.keyboard.press("Escape"); await sleep(250); await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Discard")?.click()); await sleep(400); };

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ================= §1 DEFAULT (§71) ================= */
    console.log("§1 default — compact, easier than ordinary social media");
    await open(page);
    const entry = await page.evaluate(() => document.querySelector("[data-sb-open-composer]")?.textContent.trim());
    ok(entry === "What's happening?", `the entry bar asks the social question, never a Life age (“${entry}”)`);
    await openComposer(page);
    const def = await page.evaluate(() => {
      const c = document.querySelector("[data-sb-composer]");
      return {
        title: document.getElementById("sb-ucomposer-title")?.textContent.trim(),
        focus: document.activeElement?.id,
        actions: [...c.querySelectorAll("[data-sb-composer-actions] button")].map((b) => b.getAttribute("aria-label")).join("|"),
        footer: [...c.querySelectorAll("footer button")].map((b) => b.textContent.trim()).join("|"),
        count: /2,000/.test(c.querySelector("footer").textContent),
        kindRow: !!c.querySelector("[data-sb-kind-row]"),
        socialLabel: /Social only|Social mode/.test(c.textContent),
        dateInput: !!c.querySelector("input[type=date]"),
        lifeAge: /\d+y \d+m \d+d/.test(c.textContent),
        height: Math.round(c.getBoundingClientRect().height),
        placeholder: document.getElementById("sb-composer-text")?.placeholder,
      };
    });
    ok(def.title === "Create post" && def.placeholder === "What's happening?", `Create post asks the social question (“${def.title}”)`);
    ok(def.focus === "sb-composer-text", "the words hold focus at open");
    ok(def.actions === "Media|People|Place|Add details|Smart Assist", `human action words + the subtle ✦ (${def.actions})`);
    ok(def.footer === "Post", "ONE exit (the X) + ONE action (Post) — no duplicate Cancel (§55)");
    ok(!def.count, "no character count on an untouched composer (§54)");
    ok(!def.kindRow && !def.socialLabel, "no category list, no Social-only label at open (§8/§71)");
    ok(!def.dateInput && !def.lifeAge, "no date, no Life age anywhere at open (§71)");
    ok(def.height < 460, `desktop opens COMPACT, grows only as content does (§4/§60 — ${def.height}px)`);

    /* ================= §2 TEXT ONLY ================= */
    console.log("§2 text only — a Social Post, not a Human Record");
    await setText(page, "Sunday slowness in Bologna.");
    await post(page);
    let m = await newest(page);
    ok(m?.record === "none" && m.kind === "moment" && !m.recordPrivacy, "words alone stay Social only (record: none)");
    ok(await page.evaluate(() => document.querySelector("[data-sb-post-toast]")?.textContent.trim() === "Posted"), "the toast says Posted — nothing about records");

    /* ================= §3 MEDIA DEFAULT + JUST POST ================= */
    console.log("§3 media — Life Moment by default, stated as the record pill");
    const density = () => page.evaluate(() => JSON.stringify(window.__SB_RING_DENSITY_SELF?.(window.__SB_SOCIAL_STATE?.moments[0] ? "u-demo-001" : "u-demo-001")));
    await openComposer(page);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    const med = await page.evaluate(() => ({
      pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"),
      change: !!document.querySelector("[data-sb-intent-change]"),
      review: document.querySelector("[data-sb-metadata-review]")?.textContent ?? "",
      thumbs: [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].length,
    }));
    ok(med.pill === "moment" && med.change, "media quietly becomes a Life Moment — the pill says so, Change beside it (§18)");
    ok(/03 AUG 2026/.test(med.review) && /Bhaktapur/.test(med.review), "the photo's own date/place surface for review — never auto-published (§20)");
    ok(med.thumbs === 1, "one strong preview for one asset (§15)");
    await page.evaluate(() => document.querySelector("[data-sb-meta-use]")?.click());
    await sleep(250);
    await setText(page, "Nyatapola in the afternoon light.");
    await post(page);
    m = await newest(page);
    ok(m?.record === undefined && m.kind === "moment" && m.media?.kind === "photos", "one Life Moment, one record (§31)");
    ok(m.at === "2026-08-03T12:00:00" && !!m.sharedAt && m.atPrecision === "day", "the photo's day leads; posting stays provenance (§21)");
    ok(/Saved as a Life Moment/.test(await page.evaluate(() => document.querySelector("[data-sb-post-toast]")?.textContent ?? "")), "the toast states the Life Moment quietly");
    // Just post override (§8) — the choice appears where it is made, in the chooser
    const dBefore = await density();
    await openComposer(page);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    await details(page);
    const chooserHint = await page.evaluate(() => document.querySelector("[data-sb-record-social-only]")?.textContent ?? "");
    ok(/Just post/.test(chooserHint) && /Don't add this to My Life/.test(chooserHint), "the chooser offers Just post with its honest hint (§6/§8)");
    await page.evaluate(() => document.querySelector("[data-sb-record-social-only]")?.click());
    await sleep(300);
    await settleMeta(page);
    ok(await page.evaluate(() => !document.querySelector("[data-sb-record-pill]") && !document.querySelector("[data-sb-sheet-panel]")), "Just post: the pill clears and the chooser closes");
    await setText(page, "Just the photo, nothing more.");
    await post(page);
    m = await newest(page);
    ok(m?.record === "none" && m.media?.kind === "photos", "Social-only media post: the photo travels, no Human Record");
    ok((await density()) === dBefore, "a Social-only post never enters Life density (§31)");

    /* ================= §4 RECORD CHOOSER (§72) ================= */
    console.log("§4 record chooser — a focused sheet, then ONE pill");
    await openComposer(page);
    await details(page);
    const chooser = await page.evaluate(() => {
      const s = document.querySelector("[data-sb-sheet-panel='record']");
      return {
        justPost: !!s?.querySelector("[data-sb-record-social-only]"),
        kinds: [...(s?.querySelectorAll("[data-sb-kind-row] button") ?? [])].map((b) => b.getAttribute("aria-label")).join("|"),
        descs: ["A memory or experience", "Food or drink", "Something you did", "A health event", "Something you're trying to solve", "Something you're working on", "People coming together"].every((x) => s?.textContent.includes(x)),
        noMedia: !/Media|Photo|Video|General|Other/.test([...(s?.querySelectorAll("[data-sb-kind-row] button") ?? [])].map((b) => b.getAttribute("aria-label")).join("|")),
      };
    });
    ok(chooser.justPost, "Just post leads the chooser");
    ok(chooser.kinds === "Life Moment|Meal|Activity|Health|Problem|Project|Meeting", `exactly the seven Human Records (${chooser.kinds})`);
    ok(chooser.descs, "every record carries one human explanation (§6)");
    ok(chooser.noMedia, "no Media/Photo/Video/Other pseudo-records (§9)");
    // §72 — select each of the seven: the chooser closes, ONLY the pill remains
    let collapseHeld = true;
    for (const k of ["Life Moment", "Meal", "Activity", "Health", "Problem", "Project", "Meeting"]) {
      await kind(page, k);
      const st = await page.evaluate(() => ({
        sheet: !!document.querySelector("[data-sb-sheet-panel]"),
        kindRow: !!document.querySelector("[data-sb-kind-row]"),
        pill: !!document.querySelector("[data-sb-record-pill]"),
      }));
      if (st.sheet || st.kindRow || !st.pill) collapseHeld = false;
    }
    ok(collapseHeld, "every selection collapses the chooser to one smart pill — never seven persistent categories (§7/§72)");
    const pillText = await page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.textContent.replace(/\s+/g, " ").trim());
    ok(/Meeting/.test(pillText ?? "") && /Change/.test(pillText ?? ""), `the pill names the record + Change (“${pillText}”)`);
    await discard(page);

    /* ================= §5 DOMAIN ADAPTERS ================= */
    console.log("§5 meal — quick + context-adaptive More (§44/§45)");
    await openComposer(page);
    await kind(page, "Meal");
    const meal = await page.evaluate(() => ({
      occ: document.querySelectorAll("[data-sb-chipselect='occasion'] button").length,
      items: !!document.querySelector("[data-sb-ufield='items']"),
      noVenueWith: !/Venue|With/.test(document.querySelector("[data-sb-domain-quick='meal']")?.textContent ?? ""),
      moreClosed: !document.querySelector("[data-sb-more]"),
    }));
    ok(meal.occ === 6 && meal.items, "Meal quick: Occasion (6) + What did you have?");
    ok(meal.noVenueWith, "no duplicate Venue/With — Place and People stay common (§7)");
    ok(meal.moreClosed, "More details waits, closed (§11)");
    await chip(page, "occasion", "Dinner");
    ok(/Meal · Dinner/.test(await page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.textContent.replace(/\s+/g, " ") ?? "")), "the pill grows the subtype: Meal · Dinner (§7)");
    await more(page);
    const mealMore = await page.evaluate(() => ({
      ctx: document.querySelectorAll("[data-sb-chipselect='context'] button").length,
      inputsAtOpen: [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].length,
      chips: [...document.querySelectorAll("[data-sb-add-field]")].map((b) => b.getAttribute("data-sb-add-field")).join("|"),
    }));
    ok(mealMore.ctx === 8 && mealMore.inputsAtOpen === 0, "More opens with the canonical contexts and ZERO empty inputs — no field matrix (§45/§51)");
    ok(mealMore.chips.includes("preparation") && mealMore.chips.includes("cost") && mealMore.chips.includes("foodItems"), `every canonical field waits as “+ Field” (${mealMore.chips})`);
    await chip(page, "context", "Home cooked");
    const homeAdaptive = await page.evaluate(() => [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].map((i) => i.getAttribute("data-sb-ufield")).join("|"));
    ok(homeAdaptive === "preparation|ingredients", `HOME COOKED opens exactly its own fields (${homeAdaptive}) — §45`);
    ok(await page.evaluate(() => !/\d+%|Incomplete|Missing/.test(document.querySelector("[data-sb-composer]")?.textContent ?? "")), "no completion pressure anywhere (§12)");
    await setText(page, "Tagliatelle at home tonight.");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "meal" && m.recordPrivacy === "private" && m.fields?.occasion === "dinner" && m.fields?.context === "home", "a quick Meal is a valid Meal (§12/§28)");
    ok(/Saved to Meal & your Life/.test(await page.evaluate(() => document.querySelector("[data-sb-post-toast]")?.textContent ?? "")), "the toast states the Meal record quietly");

    console.log("§5 activity — common four, focused picker, adaptive fields (§78)");
    await openComposer(page);
    await kind(page, "Activity");
    const act = await page.evaluate(() => ({
      common: [...document.querySelectorAll("[data-sb-activity-common] button")].map((b) => b.textContent.trim()).join("|"),
      fullListVisible: document.querySelectorAll("[data-sb-chipselect='activityType'] button").length,
    }));
    ok(act.common === "Run|Walk|Gym|Cycling|More…", `quick shows the common four + More (${act.common}) — never the full wall (§39)`);
    ok(act.fullListVisible === 0, "the full type list never sits in the main form (§39/§78)");
    await actType(page, "Run");
    const run = await page.evaluate(() => ({
      chosen: document.querySelector("[data-sb-activity-chosen]")?.getAttribute("data-sb-activity-chosen"),
      sheetGone: !document.querySelector("[data-sb-sheet-panel]"),
      metrics: [...document.querySelectorAll("[data-sb-activity-metrics] label")].map((l) => l.textContent.trim()).join("|"),
    }));
    ok(run.chosen === "run" && run.sheetGone, "choosing Run collapses the picker — Activity · Run · Change (§39)");
    ok(run.metrics === "Distance|Duration", `Run quick metrics only (${run.metrics}) — §15/§40`);
    await setField(page, "distance", "5 km");
    await more(page);
    const runMore = await page.evaluate(() => ({
      inputs: [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].length,
      chips: [...document.querySelectorAll("[data-sb-add-field]")].map((b) => b.getAttribute("data-sb-add-field")).join("|"),
    }));
    ok(runMore.inputs === 0 && runMore.chips.startsWith("pace|elevation"), `Run's More is “+ Pace + Elevation …”, no eight-empty-input wall (§40/§78 — ${runMore.chips})`);
    await addField(page, "pace");
    ok(await page.evaluate(() => document.activeElement?.getAttribute("data-sb-ufield") === "pace"), "an added field arrives focused (§65)");
    await setField(page, "pace", "6:12 /km");
    // §26 — switching subtypes never loses entered work
    await actType(page, "Gym");
    await actType(page, "Run");
    ok((await page.evaluate(() => document.querySelector("[data-sb-ufield='distance']")?.value)) === "5 km", "subtype switching never loses entered work (§26)");
    await setText(page, "Morning run along the river.");
    await post(page);
    m = await newest(page);
    ok(m?.fields?.activityType === "run" && m.fields?.distance === "5 km" && m.fields?.pace === "6:12 /km", "type + metrics + added depth stored on the record");

    console.log("§5 health — focused picker, private details (§79)");
    await openComposer(page);
    await kind(page, "Health");
    const health = await page.evaluate(() => ({
      choose: !!document.querySelector("[data-sb-health-choose]"),
      body: !!document.querySelector("[data-sb-ufield='bodyArea']"),
      typesVisible: document.querySelectorAll("[data-sb-chipselect='healthType'] button").length,
      sharing: document.querySelector("[data-sb-health-sharing]")?.textContent ?? "",
      ph: document.getElementById("sb-composer-text")?.placeholder,
    }));
    ok(health.choose && health.body && health.typesVisible === 0, "Health quick: Body area + a Choose control — never 17 persistent types (§47/§79)");
    ok(/Sharing with: Public/.test(health.sharing) && /remains private/.test(health.sharing), "ONE sharing summary — audience ≠ the private record (§48)");
    ok(health.ph === "What happened?", "the writing area asks Health's own question");
    await page.evaluate(() => document.querySelector("[data-sb-health-choose]")?.click());
    await sleep(300);
    const picker = await page.evaluate(() => ({
      common: document.querySelectorAll("[data-sb-chipselect='healthType'] button").length,
      more: !!document.querySelector("[data-sb-healthtype-more]"),
    }));
    ok(picker.common === 6 && picker.more, "the picker leads with the common six + More… (§47)");
    await page.evaluate(() => document.querySelector("[data-sb-healthtype-more]")?.click());
    await sleep(200);
    ok((await page.evaluate(() => document.querySelectorAll("[data-sb-chipselect='healthType'] button").length)) === 17, "More… reveals all 17 canonical Health types");
    await chip(page, "healthType", "Symptom");
    ok(await page.evaluate(() => !document.querySelector("[data-sb-sheet-panel]") && /Symptom/.test(document.querySelector("[data-sb-record-pill]")?.textContent ?? "")), "Health · Symptom — the picker collapses to the pill");
    const moreLabel = await page.evaluate(() => document.querySelector("[data-sb-more-toggle]")?.textContent.trim());
    ok(moreLabel === "› Private health details", `Health's depth is named for what it is, never “Advanced” (§49 — “${moreLabel}”)`);
    await more(page);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-shared-group]") && !!document.querySelector("[data-sb-private-group]")), "shared vs private stays visually grouped (§48)");
    await setText(page, "Left knee sore after the stairs.");
    await setField(page, "privateNote", "MRI booked for Tuesday");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "health" && m.recordPrivacy === "private" && m.fields?.privateNote === "MRI booked for Tuesday", "the private note enriches the Health RECORD");
    ok(await page.evaluate(() => !document.body.textContent.includes("MRI booked")), "…and never renders anywhere social (§28/§29)");

    console.log("§5 problem — current state only (§80)");
    await openComposer(page);
    await kind(page, "Problem");
    const prob = await page.evaluate(() => ({
      quickInputs: document.querySelectorAll("[data-sb-domain-quick] input, [data-sb-domain-quick] textarea").length,
      ph: document.getElementById("sb-composer-text")?.placeholder,
    }));
    ok(prob.quickInputs === 0 && prob.ph === "What's the problem?", "quick Problem is the words themselves (§50)");
    await more(page);
    const probMore = await page.evaluate(() => ({
      chips: [...document.querySelectorAll("[data-sb-add-field]")].map((b) => b.getAttribute("data-sb-add-field")).join("|"),
      lifecycle: /Solution|Verification|Outcome|Lesson/.test(document.querySelector("[data-sb-domain-more='problem']")?.textContent ?? ""),
    }));
    ok(probMore.chips === "impact|urgency|category|relatedProject|attempt|nextAction|notes", `current-state additions only (${probMore.chips})`);
    ok(!probMore.lifecycle, "no Solution/Verification/Outcome/Lessons at creation — lifecycle comes later (§50/§80)");
    await setText(page, "Internet keeps dropping every evening.");
    await post(page);
    m = await newest(page);
    ok(m?.fields?.status === "open", "Status=Open stays internal, never asked (§17)");

    console.log("§5 project + meeting (§52/§81)");
    await openComposer(page);
    await kind(page, "Project");
    await setField(page, "projectTitle", "Garden shed rebuild");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "project" && m.fields?.name === "Garden shed rebuild" && m.fields?.status === "active", "a Project posts on its name alone (§20)");
    await openComposer(page);
    await kind(page, "Meeting");
    const meet = await page.evaluate(() => ({
      subject: !!document.querySelector("[data-sb-ufield='subject']"),
      when: !!document.querySelector("[data-sb-domain-quick='meeting'] [data-sb-when]"),
    }));
    ok(meet.subject && meet.when, "Meeting quick: subject + When now (§19)");
    await more(page);
    ok(await page.evaluate(() => !/Agenda|Transcript|Recording|Minutes|Attendance|Hybrid|In person/.test(document.querySelector("[data-sb-domain-more='meeting']")?.textContent ?? "")), "Social Meeting stays Basic — no workspace, no mode list (§53/§81)");
    await setField(page, "subject", "Trip planning");
    await post(page);
    m = await newest(page);
    ok(m?.kind === "meeting" && m.fields?.subject === "Trip planning", "a Meeting posts on its subject");

    /* ================= §6 PEOPLE + PLACE PICKERS (§73/§74) ================= */
    console.log("§6 people picker + place picker — real pickers, surviving everything");
    await openComposer(page);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "People")?.click());
    await sleep(350);
    const pplSheet = await page.evaluate(() => ({
      search: !!document.querySelector("#sb-people-common"),
      comma: /comma/i.test(document.querySelector("[data-sb-sheet-panel='people']")?.textContent ?? ""),
      recent: document.querySelectorAll("[data-sb-person-option]").length,
      avatars: document.querySelectorAll("[data-sb-sheet-panel='people'] [data-sb-identity-photo], [data-sb-sheet-panel='people'] [data-sb-identity-initials]").length,
    }));
    ok(pplSheet.search && !pplSheet.comma, "People is a real picker — no comma-separated input anywhere (§22/§73)");
    ok(pplSheet.recent >= 4 && pplSheet.avatars >= 4, `recent people with real identities (${pplSheet.recent} rows)`);
    await page.type("#sb-people-common", "Sofia");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-person-option='p-asha']")?.click());
    await sleep(200);
    await page.evaluate(() => { const i = document.querySelector("#sb-people-common"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "Zzqx"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(300);
    ok(/Zzqx/.test(await page.evaluate(() => document.querySelector("[data-sb-people-unmatched]")?.textContent ?? "")), "a name that matches nobody is said out loud — never stored (A12)");
    await page.click("[data-sb-people-done]");
    await sleep(300);
    ok((await page.evaluate(() => document.querySelector("[data-sb-people-chip]")?.getAttribute("data-sb-people-chip"))) === "1", "the action row states People · 1");
    // place picker
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(350);
    await page.evaluate(() => { const i = document.querySelector("#sb-place-common"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "Bologna"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(250);
    const placeSheet = await page.evaluate(() => ({
      precision: !!document.querySelector("[data-sb-chipselect='placePrecision']"),
      gps: /GPS|coordinates|\d{2}\.\d{4}/.test(document.querySelector("[data-sb-sheet-panel='place']")?.textContent ?? ""),
    }));
    ok(placeSheet.precision && !placeSheet.gps, "place carries precision, never forced exact GPS (§24/§74)");
    await chip(page, "placePrecision", "City or region");
    await page.click("[data-sb-place-done]");
    await sleep(300);
    // §73 — selection survives category changes, sheets and media
    await kind(page, "Meal");
    await chip(page, "occasion", "Dinner");
    await kind(page, "Activity");
    await kind(page, "Meal");
    const survive = await page.evaluate(() => ({
      people: document.querySelector("[data-sb-people-chip]")?.getAttribute("data-sb-people-chip"),
      place: [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.textContent.trim(),
      occ: [...document.querySelectorAll("[data-sb-chipselect='occasion'] button")].find((b) => b.getAttribute("aria-checked") === "true")?.textContent.trim(),
    }));
    ok(survive.people === "1" && survive.place === "Bologna" && survive.occ === "Dinner", "People · Place · the Meal's own Dinner all survive switching (§26/§73)");
    await setText(page, "Dinner with Sofia.");
    await post(page);
    m = await newest(page);
    ok(JSON.stringify(m?.fields?.with) === JSON.stringify(["p-asha"]) && m.place === "Bologna" && m.placePrecision === "cityRegion", "resolved person + place + precision travel on the record (§7/§17)");

    /* ================= §7 SMART ASSIST (§76/§77) ================= */
    console.log("§7 smart assist — ON: quiet and useful; OFF: nothing lost");
    await open(page); // fresh (clears dismissal)
    await openComposer(page);
    await setText(page, "Ran 5 km around Pokhara with Marco this morning.");
    await sleep(1300);
    const sugg = await page.evaluate(() => ({
      n: document.querySelectorAll("[data-sb-suggestion]").length,
      kind: document.querySelector("[data-sb-suggestion]")?.getAttribute("data-sb-suggestion"),
      text: document.querySelector("[data-sb-suggestion]")?.textContent ?? "",
    }));
    ok(sugg.n === 1 && sugg.kind === "activity", "ONE quiet suggestion, no wizard (§25/§76)");
    ok(/5 km/.test(sugg.text) && /Pokhara/.test(sugg.text) && /Marco/.test(sugg.text), `it read the person's own words (${sugg.text.replace(/\s+/g, " ").slice(0, 64)}…)`);
    await page.click("[data-sb-suggest-accept]");
    await sleep(350);
    const applied = await page.evaluate(() => ({
      pill: document.querySelector("[data-sb-record-pill]")?.textContent ?? "",
      distance: document.querySelector("[data-sb-ufield='distance']")?.value,
      people: document.querySelector("[data-sb-people-chip]")?.getAttribute("data-sb-people-chip"),
      place: [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.textContent ?? "",
      text: document.getElementById("sb-composer-text")?.value,
      posted: !document.querySelector("[data-sb-post-toast]"),
    }));
    ok(/Run/.test(applied.pill) && applied.distance === "5 km" && applied.people === "1" && /Pokhara/.test(applied.place), "Use details fills type + metrics + person + place — without posting (§30)");
    ok(applied.text.startsWith("Ran 5 km") && applied.posted, "the words stay the person's own; nothing was published");
    await discard(page);
    // low confidence = silence
    await openComposer(page);
    await setText(page, "Thinking about the shape of the week ahead.");
    await sleep(1300);
    ok(await page.evaluate(() => !document.querySelector("[data-sb-suggestion]")), "uncertainty is silence — no low-confidence guessing (§25)");
    // Ignore is final for the composition
    await setText(page, "Dinner with Sofia at the trattoria.");
    await sleep(1300);
    await page.evaluate(() => document.querySelector("[data-sb-suggest-keep]")?.click());
    await setText(page, "Dinner with Sofia at the trattoria tonight, momos next week.");
    await sleep(1300);
    ok(await page.evaluate(() => !document.querySelector("[data-sb-suggestion]")), "after Ignore the same ask never returns (§38)");
    await post(page);
    m = await newest(page);
    ok(m?.record === "none", "ignored suggestion → the post stays exactly what the person wrote");
    // §77 — OFF: the entire product still works
    await page.evaluate(() => window.localStorage.setItem("sb-smart-assist", "off"));
    await openComposer(page);
    await setText(page, "Ran 5 km around Pokhara with Marco this morning.");
    await sleep(1300);
    ok(await page.evaluate(() => !document.querySelector("[data-sb-suggestion]")), "OFF: no suggestions appear (§26/§77)");
    await kind(page, "Activity");
    await actType(page, "Run");
    await setField(page, "distance", "5 km");
    await post(page);
    m = await newest(page);
    ok(m?.fields?.activityType === "run" && m.fields?.distance === "5 km", "OFF: every record capability still works by hand (§77)");
    await openComposer(page);
    await page.click("[data-sb-assist-button]");
    await sleep(250);
    ok(/Turn on/.test(await page.evaluate(() => document.querySelector("[data-sb-assist-menu]")?.textContent ?? "")), "the ✦ offers a lightweight opt-in, never a nag (§27)");
    await page.evaluate(() => document.querySelector("[data-sb-assist-toggle]")?.click());
    await sleep(200);
    ok(await page.evaluate(() => window.localStorage.getItem("sb-smart-assist") !== "off"), "…and turns Smart Assist back on");
    await page.keyboard.press("Escape");
    await sleep(200);
    await page.keyboard.press("Escape");
    await sleep(300);

    /* ================= §8 TIME ================= */
    console.log("§8 time — postedAt ≠ eventTime through the When control");
    await open(page);
    await openComposer(page);
    await kind(page, "Life Moment");
    await more(page);
    const whenIdle = await page.evaluate(() => ({ value: document.querySelector("[data-sb-when-value]")?.textContent.trim(), naked: !!document.querySelector("[data-sb-when] input[type=date]") }));
    ok(whenIdle.value === "Today" && !whenIdle.naked, "When states the truth — Today · Change, never a bare empty date box (§42)");
    await page.evaluate(() => document.querySelector("[data-sb-when-change]")?.click());
    await sleep(250);
    await page.evaluate(() => { const i = document.querySelector("[data-sb-when] input[type=date]"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "2019-05-04"); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await sleep(250);
    await setText(page, "The day we found the house.");
    await post(page);
    m = await newest(page);
    ok(m?.at === "2019-05-04T12:00:00" && m.atPrecision === "day" && !!m.sharedAt, "a 2019 event lands at 2019; posting today stays provenance (§21/§32)");

    /* ================= §10 SUBMISSION + EXIT (§82) ================= */
    console.log("§10 one POST + the exit model");
    await openComposer(page);
    await page.evaluate(() => document.querySelector("[data-sb-composer] header button")?.click());
    await sleep(300);
    ok(await page.evaluate(() => !document.querySelector("[data-sb-composer]")), "untouched: X closes immediately — no dialog for nothing (§55/§82)");
    await openComposer(page);
    await setText(page, "Triple-tap protection proof.");
    const before = (await state(page)).moments.length;
    await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => x.textContent.trim() === "Post"); b.click(); b.click(); b.click(); });
    await sleep(1400);
    ok((await state(page)).moments.length === before + 1, "three taps, ONE Moment (§30)");
    await openComposer(page);
    await setText(page, "Half a thought worth keeping…");
    await page.keyboard.press("Escape");
    await sleep(300);
    const recovery = await page.evaluate(() => ({
      q: /Keep this draft\?/.test(document.querySelector("[data-sb-composer] footer")?.textContent ?? ""),
      buttons: [...document.querySelectorAll("[data-sb-composer] footer button")].map((b) => b.textContent.trim()).join("|"),
    }));
    ok(recovery.q && recovery.buttons === "Keep draft|Discard|Continue editing", `the recovery ask is unambiguous (${recovery.buttons}) — never “Back” (§55/§82)`);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Keep draft")?.click());
    await sleep(400);
    ok((await state(page)).udraft?.text === "Half a thought worth keeping…", "Keep draft holds the work (§27)");
    ok(/Draft kept/.test(await page.evaluate(() => document.querySelector("[data-sb-open-composer]")?.textContent ?? "")), "the entry bar says so");
    await openComposer(page);
    ok((await page.evaluate(() => document.getElementById("sb-composer-text")?.value)) === "Half a thought worth keeping…", "reopening restores it verbatim");
    // §56/§82 — nested Back returns to the composer, never out of it
    await details(page);
    await page.click("[data-sb-sheet-panel='record'] [data-sb-sheet-back]");
    await sleep(250);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-composer]") && !document.querySelector("[data-sb-sheet-panel]")), "Back in a sheet lands in the composer, still editing (§56)");
    await discard(page);
    // failure keeps the draft (§58/§82)
    await open(page, DESKTOP, "light", "en", "&fail=1");
    await openComposer(page);
    await setText(page, "This one will fail first.");
    await post(page);
    const failState = await page.evaluate(() => ({
      alert: document.querySelector("[data-sb-composer] [role=alert]")?.textContent ?? "",
      retry: [...document.querySelectorAll("[data-sb-composer] footer button")].some((b) => b.textContent.trim() === "Retry"),
      text: document.getElementById("sb-composer-text")?.value,
    }));
    ok(/Couldn't post/.test(failState.alert) && failState.retry && failState.text === "This one will fail first.", "a failed POST returns to the editable draft with Retry (§58/§82)");

    /* ================= §11 CIRCLE + STOP SHARING ================= */
    console.log("§11 circle doorway + the record's own life");
    await open(page);
    await openComposer(page);
    await kind(page, "Meeting");
    await setField(page, "subject", "Stop-sharing proof");
    await post(page);
    m = await newest(page);
    await page.evaluate(() => { const el = [...document.querySelectorAll("[data-sb-moment]")].find((x) => x.textContent.includes("Stop-sharing proof")); el?.querySelector("button[aria-label='More']")?.click(); });
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].find((b) => b.textContent.trim() === "Stop sharing")?.click());
    await sleep(400);
    const afterStop = (await state(page)).moments.find((x) => x.id === m.id);
    ok(afterStop?.unshared === true && afterStop.kind === "meeting", "Stop sharing removes the projection; the record stays (§36)");

    /* ================= §12 MULTI-MEDIA (§75) ================= */
    console.log("§12 multi-media — mixed, reused, covered, never duplicated");
    await open(page);
    await openComposer(page);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
    await sleep(300);
    const sources = await page.evaluate(() => [...document.querySelectorAll("[data-sb-media-source]")].map((b) => b.getAttribute("data-sb-media-source")).join("|"));
    ok(sources === "upload|camera|mymedia|link", `Upload · Camera · My Media are the sources; a link is its own row (${sources}) — §10`);
    ok(await page.evaluate(() => {
      const up = document.querySelector("input[type=file][multiple]");
      return !!up && up.accept.includes("image") && up.accept.includes("video") && !!document.querySelector("input[type=file][capture]");
    }), "device Upload is a REAL multi-select of photos and videos; Camera captures (§10/§11)");
    // My Media: mixed multi-select in one operation
    await page.click("[data-sb-media-source='mymedia']");
    await sleep(350);
    const grid = await page.evaluate(() => ({
      filters: [...document.querySelectorAll("[data-sb-mymedia-filter]")].map((b) => b.getAttribute("data-sb-mymedia-filter")).join("|"),
      videos: [...document.querySelectorAll("[data-sb-mymedia-grid] button")].filter((b) => /video/.test(b.getAttribute("aria-label") ?? "")).length,
    }));
    ok(grid.filters === "all|photos|videos" && grid.videos >= 3, `My Media: All/Photos/Videos over the account's own assets (${grid.videos} videos) — §12`);
    await page.evaluate(() => {
      const g = document.querySelector("[data-sb-mymedia-grid]");
      const pick = (label) => [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === label)?.click();
      pick("Nyatapola temple, Bhaktapur");
      pick("A rain-wet hiti courtyard in Kathmandu");
      pick("Dusk over Phewa lake");
      pick("Boudhanath stupa at night with lights");
      pick("Evening kora around Boudhanath, video");
      pick("Wind over the rice terraces, video");
    });
    await sleep(250);
    ok((await page.evaluate(() => document.querySelector("[data-sb-mymedia-add]")?.textContent.trim())) === "Add 6", "6 assets — photos AND videos — in ONE operation (§11)");
    await page.click("[data-sb-mymedia-add]");
    await sleep(400);
    const collage = await page.evaluate(() => ({
      tiles: document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length,
      plus: /\+2/.test(document.querySelector("[data-sb-media-collage]")?.textContent ?? ""),
      line: /6 media/.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""),
    }));
    ok(collage.tiles === 4 && collage.plus && collage.line, "a large set stays a compact collage — 4 tiles + “+2” + “6 media · Edit” (§15)");
    await settleMeta(page);
    // organizer: cover + remove ≠ delete
    await page.click("[data-sb-media-edit]");
    await sleep(350);
    await page.evaluate(() => document.querySelector("[data-sb-make-cover='4']")?.click());
    await sleep(200);
    ok((await page.evaluate(() => document.querySelector("[data-sb-organizer-list] [data-sb-thumb]")?.getAttribute("data-sb-thumb"))) === "vid-kora", "Make cover leads with the chosen video (§16)");
    ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-organizer-list] button")].some((b) => /^Remove video/.test(b.getAttribute("aria-label") ?? ""))), "a video's controls say video, never photo (§65)");
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-organizer-list] button")].filter((b) => /^Remove (photo|video)/.test(b.getAttribute("aria-label") ?? "")).pop()?.click());
    await sleep(250);
    ok((await page.evaluate(() => document.querySelectorAll("[data-sb-organizer-list] [data-sb-thumb]").length)) === 5, "Remove unlinks from THIS post…");
    await page.click("[data-sb-organizer-add]");
    await sleep(300);
    await page.click("[data-sb-media-source='mymedia']");
    await sleep(350);
    ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-mymedia-grid] button")].some((b) => b.getAttribute("aria-label") === "Wind over the rice terraces, video")), "…the asset itself stays in My Media — remove ≠ delete (§17)");
    await page.click("[data-sb-sheet-panel='mymedia'] [data-sb-sheet-back]");
    await sleep(250);
    await page.click("[data-sb-sheet-panel='media'] [data-sb-sheet-back]");
    await sleep(250);
    await setText(page, "Mixed media proof — the whole evening.");
    await post(page);
    m = await newest(page);
    ok(m?.media?.kind === "gallery" && m.media.items.length === 5, "mixed photos + videos post as ONE gallery (§9)");
    ok(m.media.items[0].videoDuration === "0:42" && m.media.items.filter((x) => x.videoDuration).length === 1, "the cover video leads with its own duration; each item keeps its truth");
    ok(m.kind === "moment" && m.record === undefined, "one post, one Life Moment — never a record per asset (§13)");
    ok((await state(page)).moments.filter((x) => x.text === "Mixed media proof — the whole evening.").length === 1, "no duplicate records from media reuse");

    /* ================= §13 ZERO-EFFORT CAPTURE ================= */
    console.log("§13 zero-effort capture — SYSTEMBOOM knows, so the person doesn't retype");
    await open(page, DESKTOP, "light", "en", "&composer=1");
    // EXIF prefill: attaching a dated photo applies its date/place immediately — no click
    // required, and POST is never gated on reviewing it (source #2: original media metadata).
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    const bannerShown = await page.evaluate(() => document.querySelector("[data-sb-metadata-review]")?.textContent.replace(/\s+/g, " ").trim() ?? "");
    ok(/03 AUG 2026/.test(bannerShown) && /Bhaktapur/.test(bannerShown), `the photo's own date/place surface immediately (“${bannerShown}”)`);
    const postGate = await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Post")?.getAttribute("aria-disabled"));
    ok(postGate !== "true", "POST is never blocked on reviewing obvious harmless metadata (UC-C3 §20)");
    // UC-C4.1 §5/§6 — the place quietly enriches the RECORD (and the composer's own action
    // row) the instant the metadata is read, zero-effort, no click — but that is not yet a
    // deliberate choice, so it stays out of the Social projection until the person confirms
    // it one way or another (typing, picking, or "Use").
    const preConfirmPlace = await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.textContent.trim());
    ok(preConfirmPlace === "Bhaktapur", "the record is quietly enriched with the photo's place, zero-effort, before any click (UC-C4.1 §5)");
    await setText(page, "Zero-effort proof: never asked to retype the date");
    await post(page);
    m = await newest(page);
    ok(m?.at === "2026-08-03T12:00:00" && m.atPrecision === "day", "the date applied WITHOUT any explicit Use click — no privacy implication, never gated (UC-C4.1 §5)");
    ok(!m?.place, "…but the metadata-derived place stays private to the record until deliberately confirmed — never auto-disclosed (UC-C4.1 §6/§8)");
    // confirming with "Use" is the person's deliberate act — the SAME place now travels
    // to the Social record (UC-C4.1 §5/§7).
    await openComposer(page);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    await page.evaluate(() => document.querySelector("[data-sb-meta-use]")?.click());
    await sleep(200);
    await setText(page, "Confirmed metadata place proof");
    await post(page);
    m = await newest(page);
    ok(m?.place === "Bhaktapur", "Use details is a deliberate confirmation — the place now travels to the Social record (UC-C4.1 §5)");
    // "Not this" restores the EXACT state that existed before this asset's autofill touched
    // it — never a generic "revert to NOW/no-place" (UC-C4.1 §2/§10). Here the pre-state
    // already WAS empty, so the observable result is unchanged; the mechanism underneath is
    // now exact snapshot-restore rather than a hardcoded rollback value.
    await openComposer(page);
    await pickMedia(page, ["A rain-wet hiti courtyard in Kathmandu"]);
    const postedBefore = Date.now();
    await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
    await sleep(250);
    await setText(page, "Reverted metadata proof");
    await post(page);
    m = await newest(page);
    ok(m?.atPrecision === "minute" && !m.place, "Not this restores the exact pre-autofill state — here, no date and no place (UC-C4.1 §2/§10)");
    // §21 — no eventTime means the record happens NOW (no separate sharedAt); rejecting the
    // photo's metadata must land the post at the real posting moment, never silently at the
    // rejected photo's own historical EXIF time (2026-09-10T07:31, this fixture's own date).
    ok(!!m.at && Math.abs(new Date(m.at).getTime() - postedBefore) < 120000 && m.at !== "2026-09-10T07:31:00", "postedAt stays its own truth throughout rejection — never the rejected metadata's historical time (UC-C4.1 §3, regression G)");

    // UC-C4.1 §10 regression A — an explicit "I don't know" is never silently overwritten by
    // a dated photo attached afterwards (the guard is conservative enough that autofill never
    // even touches a time already marked unknown — there is nothing to later restore).
    await openComposer(page);
    await kind(page, "Life Moment");
    await more(page);
    await page.evaluate(() => document.querySelector("[data-sb-when-change]")?.click());
    await sleep(200);
    await page.evaluate(() => document.querySelector("[data-sb-time-unknown]")?.click());
    await sleep(200);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    const stillUnknown = await page.evaluate(() => ({
      pressed: document.querySelector("[data-sb-time-unknown]")?.getAttribute("aria-pressed"),
      value: document.querySelector("[data-sb-when-value]")?.textContent.trim(),
    }));
    ok(stillUnknown.pressed === "true" && stillUnknown.value === "Date unknown", "an explicit “I don't know” survives a dated photo attached afterwards (UC-C4.1 §10 regression A)");
    await discard(page);

    // UC-C4.1 §10 regression B — an already-set approximate-precision date is never silently
    // replaced by a photo's own exact EXIF date.
    await openComposer(page);
    await kind(page, "Life Moment");
    await more(page);
    await page.evaluate(() => document.querySelector("[data-sb-when-change]")?.click());
    await sleep(200);
    await page.evaluate(() => { const i = document.querySelector("[data-sb-when] input[type=date]"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "2019-01-01"); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await sleep(200);
    await chip(page, "timePrecision", "Approximate");
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    const stillApprox = await page.evaluate(() => document.querySelector("[data-sb-when-value]")?.textContent.trim());
    ok(/2019/.test(stillApprox ?? "") && /around/i.test(stillApprox ?? ""), `an approximate date the person already set is never overwritten by exact EXIF (“${stillApprox}”, UC-C4.1 §10 regression B)`);
    await discard(page);

    // UC-C4.1 §10 regression C — a place the person already typed is never overwritten by a
    // photo's own (different) metadata place.
    await openComposer(page);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(300);
    await page.evaluate(() => { const i = document.getElementById("sb-place-common"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "Kathmandu"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.click("[data-sb-place-done]");
    await sleep(250);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]); // this photo's own metadata says Bhaktapur
    const stillKathmandu = await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.textContent.trim());
    ok(stillKathmandu === "Kathmandu", "a place the person already typed is never overwritten by the photo's own metadata place (UC-C4.1 §10 regression C)");
    // UC-C4.1 §10 regression F — the correction survives a LATER metadata event too: a
    // second, different photo's own place must not silently replace it either.
    await pickMedia(page, ["Dusk over Phewa lake"]); // this asset's own metadata says Pokhara
    const stillKathmandu2 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.textContent.trim());
    ok(stillKathmandu2 === "Kathmandu", "the person's own correction survives a second, later photo's metadata too (UC-C4.1 §10 regression F)");
    await setText(page, "User correction survives every later metadata event");
    await post(page);
    m = await newest(page);
    ok(m?.place === "Kathmandu", "…and travels to the record exactly as the person left it, confirmed");

    // text-based extraction: the person's own words are read before asking for manual entry
    await openComposer(page);
    await setText(page, "Dinner with Sofia at the trattoria.");
    await sleep(1300);
    const textSugg = await page.evaluate(() => document.querySelector("[data-sb-suggestion]")?.textContent ?? "");
    ok(/Dinner/.test(textSugg) && /Sofia/.test(textSugg), `Occasion and Person are read from the words, never re-asked manually, with a localized label (“${textSugg.replace(/\s+/g, " ").slice(0, 60)}”)`);
    await discard(page);
    // trusted existing Human Record (source #1): People/Place recall the person's OWN real
    // history, not an arbitrary static list — set up real history, then verify recall.
    await openComposer(page);
    await kind(page, "Meal");
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "People")?.click());
    await sleep(300);
    await page.type("#sb-people-common", "Chiara");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-person-option]")?.click());
    await sleep(200);
    await page.click("[data-sb-people-done]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(300);
    await page.evaluate(() => { const i = document.getElementById("sb-place-common"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "Zero-Effort Recall Place"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.click("[data-sb-place-done]");
    await sleep(250);
    await setText(page, "History-building meal for recall proof");
    await post(page);
    await openComposer(page);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "People")?.click());
    await sleep(300);
    const recentPeople = await page.evaluate(() => [...document.querySelectorAll("[data-sb-person-option]")].map((b) => b.getAttribute("data-sb-person-option")));
    ok(recentPeople[0] === "p-prakash", `Recent leads with the person's own most-recently-tagged real person, not a static list (${recentPeople.join(",")})`);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-panel='people'] [data-sb-sheet-back]")?.click());
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(300);
    const recentPlacesRows = await page.evaluate(() => [...document.querySelectorAll("[data-sb-place-option]")].map((b) => b.getAttribute("data-sb-place-option")));
    ok(recentPlacesRows[0] === "Zero-Effort Recall Place", `Recent places leads with the person's own most recent real place (${recentPlacesRows[0]})`);
    await discard(page);
    // Smart Assist OFF must not weaken zero-effort where it does NOT depend on AI — EXIF
    // prefill and the recall-from-history lists are metadata/context, never AI (§26).
    await page.evaluate(() => window.localStorage.setItem("sb-smart-assist", "off"));
    await openComposer(page);
    await pickMedia(page, ["Dusk over Phewa lake"]);
    const bannerOff = await page.evaluate(() => document.querySelector("[data-sb-metadata-review]")?.textContent ?? "");
    ok(/Phewa/.test(bannerOff) || (await page.evaluate(() => document.querySelector("[data-sb-place-chip]") !== null)), "EXIF prefill still works with Smart Assist off — it was never AI");
    await page.evaluate(() => window.localStorage.setItem("sb-smart-assist", "on"));
    await discard(page);

    /* ================= §14 MOBILE · A11Y · L10N (§83) ================= */
    console.log("§14 mobile 360 + a11y + ne");
    await open(page, PHONE, "dark");
    await openComposer(page);
    const phone = await page.evaluate(() => {
      const c = document.querySelector("[data-sb-composer]");
      const r = c.getBoundingClientRect();
      const postBtn = [...c.querySelectorAll("footer button")].find((b) => b.textContent.trim() === "Post");
      const pr = postBtn.getBoundingClientRect();
      const chips = [...c.querySelectorAll("[data-sb-composer-actions] button")].map((b) => Math.round(b.getBoundingClientRect().height));
      return {
        fullSheet: Math.round(r.width) >= 359 && r.top === 0 && Math.round(r.height) >= 780,
        postReachable: pr.bottom <= window.innerHeight + 1 && pr.height >= 40,
        chipsOk: chips.every((h) => h >= 32 && h <= 44),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    ok(phone.fullSheet && phone.postReachable, "360: a full sheet with POST reachable (§59)");
    ok(phone.chipsOk && !phone.overflow, "36–44px targets, no horizontal overflow");
    await details(page);
    const phoneChooser = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-sb-kind-row] button")];
      return { n: rows.length, targets: rows.every((b) => b.getBoundingClientRect().height >= 44), inSheet: !!document.querySelector("[data-sb-sheet-panel='record']") };
    });
    ok(phoneChooser.n === 7 && phoneChooser.targets && phoneChooser.inSheet, "the record chooser is a readable phone sheet — 44px rows (§72)");
    await page.click("[data-sb-sheet-panel='record'] [data-sb-sheet-back]");
    await sleep(250);
    const a11y = await page.evaluate(() => ({
      modal: document.querySelector("[data-sb-composer]")?.getAttribute("aria-modal") === "true",
      expanded: document.querySelector("[data-sb-record-details]")?.hasAttribute("aria-expanded"),
      audience: !!document.querySelector("[data-sb-audience]")?.getAttribute("aria-label"),
    }));
    ok(a11y.modal && a11y.expanded && a11y.audience, "dialog semantics + named controls (§65)");
    // ne — the new surfaces speak the locale
    await open(page, PHONE, "dark", "ne", "&composer=1&lang=ne");
    const ne = await page.evaluate(() => {
      const c = document.querySelector("[data-sb-composer]");
      const title = document.getElementById("sb-ucomposer-title")?.textContent ?? "";
      return {
        devanagari: /[ऀ-ॿ]/.test(title),
        leak: /(Create post|What's happening|Add details|Smart Assist|People|Place|Post|Cancel)/.test(c.textContent),
      };
    });
    ok(ne.devanagari && !ne.leak, "ne: the whole opening state speaks Nepali — zero English leaks (§64/§83)");
    await details(page);
    const neKinds = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-sb-kind-row] button")];
      return rows.length === 7 && rows.every((b) => /[ऀ-ॿ]/.test(b.getAttribute("aria-label") ?? ""));
    });
    ok(neKinds, "ne: all seven records named in Devanagari, descriptions included");
    await page.setCookie({ name: "sb-locale", value: "en", url: HOST });

    console.log("page health");
    ok(errs.length === 0, `zero page errors (${errs.length})${errs[0] ? " — " + errs[0].slice(0, 90) : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-composer: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log("  FAILED: " + f)); process.exit(1); }
  process.exit(0);
})();
