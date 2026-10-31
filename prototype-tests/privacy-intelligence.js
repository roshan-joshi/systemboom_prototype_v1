/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * V0.4 P1 CORRECTION 1 — PRIVACY of AI intelligence (PRI-P1-001 … 009).
 *
 * This prototype has NO post-serving HTTP API: a post exists in the in-memory store and leaves its owner through ONE
 * composition, `composeFeed` (the feed another person receives, and the "View as public" preview). The deny-list in
 * `src/lib/privacy/record-intelligence.ts` is applied there and in `publicPostPayload` (the serializer any future API must
 * use). These checks drive the real Composer, post a real construction post and a Health post with extracted document text,
 * then read: the owner's raw store (must keep everything), the public composition (must carry nothing private), the rendered
 * public DOM, the serializer under a "hidden property" request, SSR bootstrap HTML, storage, console and outbound requests.
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const PIN = "harness=0&mockfacts=miss&mockpackaged=miss&theme=light";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const NYAT = "Nyatapola temple, Bhaktapur";
const DURBAR = "Kathmandu Durbar Square, crowd and temples";
const PRIVATE_KEYS = ["visualObservation", "mealAIObservation", "activityAIObservation", "recordAIObservation", "recordProvenance", "activityProvenance", "mealAssets", "mixedAssets", "mealNutrition", "foodItems", "recordPlace"];
const PRIVATE_WORDS = ["evidenceStrength", "requiresConfirmation", "primarySubject", "categories", "\"confidence\"", "\"evidence\""];
const LAB_TEXT = "CITY CLINICAL LABORATORY"; // the extracted document text the Health mock carries

const console_ = [];
const bodies = [];

async function open(page, extra = "") {
  await page.setViewport(DESKTOP);
  await page.goto(`${HOST}/style-lab/social?${PIN}${extra}`, { waitUntil: "networkidle2" });
  await page.evaluate(() => { try { window.localStorage.removeItem("sb-smart-assist"); } catch {} });
  await sleep(700);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1400); };
const waitFor = async (page, fn, arg, tries = 30, gap = 200) => { for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); } return false; };
const waitMealDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const waitRecDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_RECORD_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
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
const leaks = (value) => { const s = JSON.stringify(value) ?? ""; return [...PRIVATE_KEYS.filter((k) => s.includes(`"${k}"`)), ...PRIVATE_WORDS.filter((w) => s.includes(w))]; };
const enterPreview = async (page) => { await clickSel(page, "[data-sb-view-as-public]"); await sleep(900); };
const previewFeed = (page) => page.evaluate(() => window.__SB_PREVIEW_FEED ?? null);

(async () => {
  const { page, browser } = await launch();
  page.on("console", (m) => console_.push(m.text()));
  page.on("request", (r) => { const u = r.url(); if (u.includes("/api/")) bodies.push({ url: u.replace(HOST, ""), body: r.postData() ?? "" }); });
  try {
    console.log("PRI-P1 — PUBLIC CONSTRUCTION POST");
    await open(page, "&mockai=vision-construction&mockrecord=kb-construction");
    const ssr = await page.evaluate(() => document.documentElement.outerHTML);
    await openComposer(page);
    await pickMedia(page, [NYAT]);
    await waitMealDone(page, 1, 40);
    await waitFor(page, () => !!document.querySelector("[data-sb-vision-use='project']"), null, 30, 200);
    await clickSel(page, "[data-sb-vision-use='project']");
    await waitRecDone(page, 1, 40);
    await sleep(500);
    await setText(page, "Site visit — the frame is going up fast");
    await post(page);
    const m1 = await newest(page);
    ok(!!m1 && m1.kind === "project" && m1.privacy === "public" && !!m1.fields?.visualObservation && !!m1.fields?.recordAIObservation && !!m1.fields?.recordProvenance, "PRI-P1-005: the OWNER's record keeps its private intelligence (observation, reading, provenance) for authorized private processing");
    ok(m1.fields?.name === "Construction Project" && m1.fields?.visualObservation?.scene?.label, `PRI-P1-005: the person-approved values and the private observation coexist on the record (name "${m1.fields?.name}", scene "${m1.fields?.visualObservation?.scene?.label}")`);

    await enterPreview(page);
    const feed = await previewFeed(page);
    const pub1 = (feed ?? []).find((m) => m.id === m1.id);
    ok(Array.isArray(feed) && !!pub1, "PRI-P1-001: the public composition (what anyone else receives) contains the public construction post");
    ok(pub1 && leaks(pub1).length === 0 && pub1.fields?.name === "Construction Project" && !!pub1.media, `PRI-P1-001: …without any internal observation — approved name, caption and photo stay (leaks: ${JSON.stringify(leaks(pub1))})`);
    ok((feed ?? []).every((m) => leaks(m).length === 0), "PRI-P1-004: no post in the public composition carries scores, evidence, confidence or provenance");
    const dom = await page.evaluate((id) => document.querySelector(`[data-sb-moment='${id}']`)?.outerHTML ?? "", m1.id);
    ok(dom.length > 0 && !/visualObservation|tower crane|reinforcement|primarySubject|evidence/i.test(dom) && /Construction Project/.test(dom), "PRI-P1-002: the rendered public post shows the approved content only — no observation words reach the markup");
    const raw = await state(page);
    ok(!!raw.moments.find((m) => m.id === m1.id)?.fields?.visualObservation, "PRI-P1-005: entering the public view never destroys the owner's private data (the store is untouched)");
    const bypass = await page.evaluate((id) => { const m = window.__SB_SOCIAL_STATE.moments.find((x) => x.id === id); const out = window.__SB_PUBLIC_PAYLOAD(m, { include: ["visualObservation", "recordAIObservation", "recordProvenance", "recordPlace"] }); return { keys: Object.keys(out.fields ?? {}), hasPlace: "recordPlace" in out, json: JSON.stringify(out) }; }, m1.id);
    ok(!bypass.keys.some((k) => PRIVATE_KEYS.includes(k)) && !bypass.hasPlace && leaks(JSON.parse(bypass.json)).length === 0, `PRI-P1-008: asking the serializer for hidden properties returns none of them (public keys: ${bypass.keys.join(",")})`);
    await clickSel(page, "[data-sb-preview-exit], button[data-sb-return-my-world]");
    await sleep(500);

    console.log("PRI-P1 — HEALTH POST WITH EXTRACTED DOCUMENT TEXT");
    await open(page, "&mockai=vision-lab&mockrecord=health-lab");
    await openComposer(page);
    await pickMedia(page, [DURBAR]);
    await waitMealDone(page, 1, 40);
    await waitFor(page, () => !!document.querySelector("[data-sb-vision-use='health']"), null, 30, 200);
    await clickSel(page, "[data-sb-vision-use='health']");
    await waitRecDone(page, 1, 40);
    await sleep(400);
    await setText(page, "Results came back today");
    await post(page);
    const m2 = await newest(page);
    const rawHasText = JSON.stringify(m2?.fields?.visualObservation ?? {}).includes("Laboratory Report");
    ok(!!m2 && m2.kind === "health" && m2.recordPrivacy === "private" && rawHasText, "PRI-P1-003: the owner's Health record holds the document's extracted text privately");
    await enterPreview(page);
    const feed2 = await previewFeed(page);
    const anyLab = JSON.stringify(feed2 ?? []).includes("Laboratory Report") || JSON.stringify(feed2 ?? []).includes(LAB_TEXT);
    const pageText = await page.evaluate(() => document.body.innerText);
    ok(!anyLab && !/Laboratory Report|CITY CLINICAL/.test(pageText) && !(feed2 ?? []).some((m) => m.id === m2.id && m.kind === "health" && m.privacy !== "public"), "PRI-P1-003: extracted laboratory text never reaches the public composition or the public page");
    await clickSel(page, "[data-sb-preview-exit], button[data-sb-return-my-world]");
    await sleep(400);

    console.log("PRI-P1 — ORGANIZER · EDIT · BOOTSTRAP · STORAGE · LOGS · REQUESTS");
    await open(page, "&mockai=vision-byasset&mockrecord=off");
    await openComposer(page);
    await pickMedia(page, [NYAT, DURBAR]);
    await waitMealDone(page, 2, 40);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(400);
    const org = await page.evaluate(() => ({ sheet: document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel"), tiles: document.querySelectorAll("[data-sb-organizer-tile]").length, modes: document.querySelectorAll("[role='tablist'] [role='tab']").length }));
    ok(org.sheet === "organizer" && org.tiles === 2 && org.modes === 2, `PRI-P1-006: the Media Organizer opens unchanged (${org.tiles} tiles, ${org.modes} modes)`);
    await clickSel(page, "[data-sb-organizer-done]");
    await sleep(300);
    await setText(page, "Two photos");
    await post(page);
    const m3 = await newest(page);
    ok(!!m3 && (m3.media?.items?.length === 2 || m3.media?.kind === "photos"), "PRI-P1-007: posting with several photos still works");
    await page.evaluate((id) => { const mm = document.querySelector(`[data-sb-moment='${id}'] button[aria-label='More']`); mm?.click(); }, m3.id);
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role='menuitem']")].find((b) => /^Edit/.test(b.textContent.trim()))?.click());
    await sleep(900);
    const editing = await page.evaluate(() => !!document.querySelector("[data-sb-composer]") && (document.getElementById("sb-composer-text")?.value ?? ""));
    ok(editing === "Two photos", `PRI-P1-007: editing an existing post opens with its words ("${editing}")`);
    await setText(page, "Two photos, edited");
    await post(page);
    const m3b = (await state(page)).moments.find((m) => m.id === m3.id);
    ok(m3b?.text === "Two photos, edited" && !!m3b?.fields?.visualObservation, "PRI-P1-007: the edit lands and the owner's private observation survives the edit");

    ok(!/visualObservation|primarySubject|evidenceStrength/.test(ssr), "PRI-P1-009: the SSR bootstrap HTML carries no observation");
    const storage = await page.evaluate(() => { const out = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[`local:${k}`] = localStorage.getItem(k); } for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); out[`session:${k}`] = sessionStorage.getItem(k); } } catch {} return out; });
    ok(leaks(storage).length === 0, `PRI-P1-009: browser storage holds no observation (${Object.keys(storage).join(",") || "empty"})`);
    const logLeak = console_.filter((l) => /visualObservation|primarySubject|evidenceStrength|Laboratory Report/.test(l));
    ok(logLeak.length === 0, `PRI-P1-009: console output carries no observation (${console_.length} messages)`);
    const reqLeak = bodies.filter((b) => /visualObservation|recordAIObservation|primarySubject|evidenceStrength/.test(b.body));
    const onlyImages = bodies.filter((b) => b.url.includes("/api/analyze-meal")).every((b) => { try { const j = JSON.parse(b.body); return Object.keys(j).join() === "images"; } catch { return false; } });
    ok(reqLeak.length === 0 && onlyImages, `PRI-P1-009: outbound requests carry images/words only — never a stored observation (${bodies.length} API requests)`);
    ok(!JSON.stringify(bodies).includes("analytics") && console_.every((l) => !/track|analytics/i.test(l)), "PRI-P1-009: no analytics event exists in this prototype to carry an observation");
  } catch (e) {
    failures.push(`crash: ${e.stack}`);
    console.log(e);
  }
  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => ` - ${f}`).join("\n")); process.exit(1); }
})();
