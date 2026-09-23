/**
 * PHASE 4.4-A — MOMENT + RESPOND TRUTH (regression suite).
 *
 *   node prototype-tests/social-4-4a-truth.js        (dev server on :3210)
 *
 * Proves, in a real browser, the Phase 4.4-A fixes to the prototype:
 *   §1 Edit keeps temporal truth and real media · §2 Discard during Posting never publishes ·
 *   §3 View as public — part 1 (and that part 2, D-2/D-4, is NOT settled) · §4 the phone
 *   conversation at 390 and 360 · §5 Composer data hygiene · §6 Respond truth · §7 action honesty
 *   and accessibility · §8 localisation · §9 boundaries.
 * Everything runs against the client-side prototype store (reset on every load); nothing here is
 * a server. Evidence (a few frames) goes to prototype-evidence/phase-4.4a-truth/.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.resolve(__dirname, "..");
const EV = path.join(ROOT, "prototype-evidence/phase-4.4a-truth");
fs.mkdirSync(EV, { recursive: true });
const BASE = "http://localhost:3210/style-lab/social";

let passed = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) { passed += 1; console.log(`  ✓ ${msg}`); } else { failures.push(msg); console.log(`  ✗ ${msg}`); }
}

const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function open(page, vp, q = "") {
  await page.setViewport(vp);
  await page.goto(`${BASE}?theme=light&harness=0${q}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const momentOf = async (page, id) => (await state(page)).moments.find((m) => m.id === id);
async function setValue(page, sel, v) {
  await page.evaluate((s, val) => {
    const el = document.querySelector(s);
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, sel, v);
  await sleep(120);
}
/** Click a button / menu item whose text (trimmed) matches exactly, inside `within`. */
async function press(page, text, within = "body") {
  const done = await page.evaluate((t, w) => {
    const root = document.querySelector(w) || document.body;
    const b = [...root.querySelectorAll("button,[role^=menuitem],[role=option]")].find((x) => (x.textContent || "").replace(/\s+/g, " ").trim() === t);
    if (!b) return false;
    b.click();
    return true;
  }, text, within);
  if (!done) throw new Error(`no control "${text}" in ${within}`);
  await sleep(250);
}
async function menuOf(page, momentId) {
  await page.evaluate((id) => document.querySelector(`[data-sb-moment='${id}'] button[aria-label=More]`).click(), momentId);
  await sleep(250);
}
async function ensureMoment(page, id) {
  for (let i = 0; i < 6 && !(await page.$(`[data-sb-moment='${id}']`)); i++) {
    const more = await page.$("[data-sb-load-more]");
    if (!more) break;
    await page.evaluate(() => document.querySelector("[data-sb-load-more]").click());
    await sleep(450);
  }
  return !!(await page.$(`[data-sb-moment='${id}']`));
}
const announcer = (page) => page.evaluate(() => document.querySelector("body > [data-sb-announcer]")?.textContent ?? "");
const shot = (page, name) => page.screenshot({ path: path.join(EV, `${name}.png`) });

/* A tiny TypeScript loader — for the pure-module unit checks (§5, §8, §9). */
function tsLoad(file) {
  const ts = require(path.join(ROOT, "node_modules/typescript"));
  const cache = {};
  const load = (f) => {
    if (cache[f]) return cache[f].exports;
    const out = ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
    const m = { exports: {} };
    cache[f] = m;
    const req = (p) => {
      const base = p.startsWith("@/") ? path.join(ROOT, "src", p.slice(2)) : p.startsWith(".") ? path.resolve(path.dirname(f), p) : null;
      if (!base) return require(p);
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return load(base + ext);
      throw new Error(`cannot resolve ${p}`);
    };
    new Function("require", "module", "exports", out)(req, m, m.exports);
    return m.exports;
  };
  return load(path.join(ROOT, file));
}

(async () => {
  const { browser, page } = await launch();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|_next\/hmr/.test(m.text())) pageErrors.push(m.text().slice(0, 200)); });
  const requests = [];
  page.on("request", (r) => requests.push({ url: r.url(), body: r.postData() || "" }));
  const ctx = browser.defaultBrowserContext();

  try {
    /* ---------------- §1 EDIT — temporal truth and real media ---------------- */
    console.log("§1 edit");
    await open(page, DESKTOP);
    const rain0 = await momentOf(page, "m-rain");
    await menuOf(page, "m-rain");
    await press(page, "Edit", "[data-sb-moment='m-rain']");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", rain0.text + " Still raining.");
    await press(page, "Save", "[data-sb-composer] footer");
    await sleep(1300);
    let rain = await momentOf(page, "m-rain");
    ok(rain.at === rain0.at && rain.at === "2026-09-10T07:40:00", `same-date edit keeps the exact original time (${rain.at})`);
    ok(rain.atPrecision === rain0.atPrecision, `same-date edit keeps the original precision (${rain.atPrecision ?? "minute"})`);
    ok(await page.$eval("[data-sb-moment='m-rain'] [data-sb-readout]", (e) => /07:40/.test(e.textContent) && !/12:00/.test(e.textContent)), "the readout still says 07:40 — no fabricated 12:00");
    ok(JSON.stringify(rain.media) === JSON.stringify(rain0.media), "photo media survives an edit byte for byte");
    ok(rain.edited === true, "the edited marker is set");
    await shot(page, "01-edit-same-date-keeps-0740");

    // date moved → day precision, no clock, provenance kept
    await menuOf(page, "m-rain");
    await press(page, "Edit", "[data-sb-moment='m-rain']");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "[data-sb-composer] input[type=date]", "2026-09-05");
    await press(page, "Save", "[data-sb-composer] footer");
    await sleep(1300);
    rain = await momentOf(page, "m-rain");
    ok(rain.at === "2026-09-05T12:00:00" && rain.atPrecision === "day", `a moved date becomes DATE precision (${rain.at} · ${rain.atPrecision})`);
    ok(rain.sharedAt === "2026-09-10T07:40:00", `…and keeps when it was shared (${rain.sharedAt})`);
    await ensureMoment(page, "m-rain"); // it moved to its new place in the chronology
    await page.$eval("[data-sb-moment='m-rain']", (e) => e.scrollIntoView({ block: "center" }));
    ok(await page.$eval("[data-sb-moment='m-rain'] [data-sb-readout]", (e) => !/\d\d:\d\d/.test(e.textContent)), "a day-precision Moment shows no clock at all");
    await shot(page, "02-edit-moved-date-day-precision");

    // link: real title / description / image survive (Prakash owns m-link)
    await open(page, DESKTOP, "&viewer=prakashVisitor");
    await ensureMoment(page, "m-link");
    const link0 = await momentOf(page, "m-link");
    await menuOf(page, "m-link");
    await press(page, "Edit", "[data-sb-moment='m-link']");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "Edited words only.");
    await press(page, "Save", "[data-sb-composer] footer");
    await sleep(1300);
    const link = await momentOf(page, "m-link");
    ok(JSON.stringify(link.media) === JSON.stringify(link0.media), `link media survives an edit (title "${link.media.title}", description kept: ${link.media.description === link0.media.description})`);

    // video: real poster / duration / caption survive (Asha owns m-video)
    await open(page, DESKTOP, "&viewer=asha");
    const video0 = await momentOf(page, "m-video");
    await ensureMoment(page, "m-video");
    await menuOf(page, "m-video");
    await press(page, "Edit", "[data-sb-moment='m-video']");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "Edited words only, again.");
    await press(page, "Save", "[data-sb-composer] footer");
    await sleep(1300);
    const video = await momentOf(page, "m-video");
    ok(JSON.stringify(video.media) === JSON.stringify(video0.media), `video media survives an edit (poster ${video.media.poster.src.split("/").pop()}, ${video.media.duration})`);

    // closing an edit with changes asks
    await open(page, DESKTOP);
    await menuOf(page, "m-rain");
    await press(page, "Edit", "[data-sb-moment='m-rain']");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "An unsaved thought.");
    await press(page, "Cancel", "[data-sb-composer] footer");
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-discard-edit]") && document.body.innerText.includes("Discard your changes?")), "closing an edit with changes asks before letting go");
    await shot(page, "03-edit-close-asks");
    await press(page, "Keep editing", "[data-sb-composer] footer");
    ok(await page.$eval("#sb-composer-text", (e) => e.value === "An unsaved thought."), "Keep editing returns to the words as they were");
    await press(page, "Cancel", "[data-sb-composer] footer");
    await press(page, "Discard changes", "[data-sb-composer] footer");
    await sleep(400);
    ok(!(await page.$("[data-sb-composer]")) && (await momentOf(page, "m-rain")).text === rain0.text, "Discard changes closes and saves nothing");

    /* ---------------- §2 DISCARD DURING POSTING ---------------- */
    console.log("§2 discard during posting");
    for (const [label, how] of [["Cancel → Discard", "cancel"], ["Escape → Discard", "escape"], ["Cancel → Keep draft", "keep"]]) {
      await open(page, DESKTOP);
      const marker = `DISCARD-${how}-${Date.now()}`;
      await page.click("[data-sb-open-composer]");
      await page.waitForSelector("[data-sb-composer]");
      await setValue(page, "#sb-composer-text", marker);
      await press(page, "Post", "[data-sb-composer] footer");
      const phase = await page.$eval("[data-sb-composer]", (e) => e.getAttribute("data-sb-composer-phase"));
      const inert = await page.evaluate(() => !!document.querySelector("#sb-composer-text")?.closest("[inert]"));
      if (how === "escape") await page.keyboard.press("Escape"); else await press(page, "Cancel", "[data-sb-composer] footer");
      await sleep(150);
      await press(page, how === "keep" ? "Keep draft" : "Discard", "[data-sb-composer] footer");
      await sleep(1600); // well past the 900 ms posting delay
      const s = await state(page);
      const posted = s.moments.some((m) => (m.text || "").includes(marker));
      ok(phase === "posting" && !posted && !(await page.evaluate((mk) => document.body.innerText.includes(mk), marker)), `${label} inside the posting window: the Moment never appears (phase was ${phase})`);
      if (how === "cancel") ok(inert, "while Posting, the Composer body is inert (no edit can race the pending post)");
      if (how === "keep") ok(s.draft?.text === marker, "Keep draft keeps the words as a draft instead");
    }
    // an open privacy menu cannot race the pending post
    await open(page, DESKTOP);
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "Privacy race probe.");
    await page.click("[data-sb-composer] button[aria-haspopup=listbox]");
    await sleep(150);
    await press(page, "Post", "[data-sb-composer] footer");
    const race = await page.evaluate(() => ({ listbox: !!document.querySelector("[data-sb-composer] [role=listbox]"), focus: document.activeElement?.closest("[data-sb-composer] footer") ? "footer" : document.activeElement?.tagName }));
    await sleep(1500);
    const raced = (await state(page)).moments.find((m) => m.text === "Privacy race probe.");
    ok(!race.listbox && race.focus === "footer" && raced?.privacy === "public", `Post closes the privacy menu (nothing chosen during Posting can silently miss the post) and keeps focus on the busy Post button (${race.focus})`);
    // control: an uninterrupted Post still posts
    await open(page, DESKTOP);
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "An uninterrupted post.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    ok((await state(page)).moments.some((m) => m.text === "An uninterrupted post."), "control: an uninterrupted Post still publishes");

    /* ---------------- §3 VIEW AS PUBLIC — PART 1 ---------------- */
    console.log("§3 view as public (part 1)");
    await ctx.overridePermissions("http://localhost:3210", []);
    await open(page, DESKTOP);
    // Part-2 probe set-up: make one of the owner's Moments Friends-only BEFORE previewing.
    await menuOf(page, "m-snow").catch(() => {});
    if (!(await page.$("[data-sb-moment='m-snow'] [role=menu]"))) { await ensureMoment(page, "m-snow"); await menuOf(page, "m-snow"); }
    await press(page, "Change privacy", "[data-sb-moment='m-snow']");
    await press(page, "Friends", "[data-sb-moment='m-snow']");
    await sleep(300);
    const ownerBefore = await page.evaluate(() => ({ exact: (document.querySelector("[data-sb-sheet]").innerText.match(/\d+y \d\dm \d\dd/g) || []).length, onlyme: document.querySelectorAll("[data-sb-sheet] [data-sb-privacy=onlyme]").length }));
    ok(ownerBefore.exact > 0 && ownerBefore.onlyme > 0, `owner view (control): exact ages ${ownerBefore.exact}, only-me Moments ${ownerBefore.onlyme}`);
    const reqBefore = requests.length;
    await press(page, "View as public");
    await sleep(600);
    for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.evaluate(() => document.querySelector("[data-sb-load-more]").click()); await sleep(350); }
    const pv = await page.evaluate(() => {
      const sh = document.querySelector("[data-sb-sheet]");
      return {
        viewer: sh.getAttribute("data-sb-render-viewer"),
        exact: (sh.innerText.match(/\d+y \d\dm \d\dd/g) || []).length,
        onlyme: sh.querySelectorAll("[data-sb-privacy=onlyme]").length,
        health: !!sh.querySelector("[data-sb-moment='m-health']") || !!sh.querySelector("[data-sb-moment='m-problem']"),
        ownRings: sh.querySelectorAll("[data-sb-ring=own]").length,
        tick: sh.querySelectorAll("[data-sb-tick-angle]").length,
        composerBar: !!sh.querySelector("[data-sb-open-composer]"),
        composers: sh.querySelectorAll("[data-sb-response-composer]").length,
        note: sh.querySelector("[data-sb-preview-note]")?.textContent ?? "",
        yours: [...sh.querySelectorAll("button[aria-label]")].filter((b) => /your expression/.test(b.getAttribute("aria-label"))).length,
        friendsOwn: !!sh.querySelector("[data-sb-moment='m-snow'][data-sb-privacy=friends]"),
        friendsOthers: sh.querySelectorAll("[data-sb-privacy=friends]").length,
        otherAuthors: [...sh.querySelectorAll("[data-sb-moment]")].length,
      };
    });
    ok(pv.viewer === "public", "the Moments sheet renders for the public stand-in (data-sb-render-viewer=public)");
    ok(pv.exact === 0, `no exact age anywhere in the stream while previewing (${pv.exact})`);
    ok(pv.onlyme === 0 && !pv.health, "no only-me Moment (Health / Problem included) while previewing");
    ok(pv.ownRings === 0 && pv.tick === 0, "every ring in the stream is the visitor ring — no owner ring, no owner tick");
    ok(!pv.composerBar && pv.composers === 0, "no composer bar and no response composer: a preview writes nothing");
    ok(/actions are paused/.test(pv.note), `the pause is stated once (“${pv.note}”)`);
    ok(pv.yours === 0, "the owner's own Expression is not shown as “your expression” to the public");
    await menuOf(page, "m-rain");
    const pmenu = await page.$$eval("[data-sb-moment='m-rain'] [role=menu] [role^=menuitem]", (n) => n.map((x) => ({ t: x.textContent.trim(), off: x.disabled })));
    ok(pmenu.map((x) => x.t).join("|") === "Report|Hide|Copy link|View in Life — later" && pmenu.every((x) => x.off), `the owner's own Moment shows a stranger's menu, paused (${pmenu.map((x) => x.t).join(" · ")})`);
    await page.keyboard.press("Escape");
    await sleep(200);
    const exprBefore = JSON.stringify((await momentOf(page, "m-rain")).expressions);
    const boomInert = await page.evaluate(() => !!document.querySelector("[data-sb-moment='m-rain'] [data-sb-actions] [data-sb-preview-inert]"));
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-preview-inert] button")?.click());
    await sleep(500);
    ok(boomInert && JSON.stringify((await momentOf(page, "m-rain")).expressions) === exprBefore, "Boom (and Resonate) are inert while previewing — nothing is expressed");
    // Respond while previewing opens the conversation read-only
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-respond]").click());
    await sleep(400);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-moment='m-rain'] [data-sb-note]") && !document.querySelector("[data-sb-moment='m-rain'] [data-sb-response-composer]") && !document.querySelector("[data-sb-moment='m-rain'] [data-sb-note-author]")), "a conversation opened while previewing reads, without a composer or person doorways");
    // Life Cursor through the stand-in
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-wedding']")?.scrollIntoView({ block: "start" }));
    await sleep(500);
    const cursor = await page.evaluate(() => document.querySelector("[data-sb-life-cursor]")?.textContent ?? "");
    ok(!/\d+y \d\dm \d\dd/.test(cursor), `the Life Cursor shows no exact age while previewing (“${cursor.trim()}”)`);
    await shot(page, "04-view-as-public-desktop");
    // contamination — the stand-in never became anyone
    const s3 = await state(page);
    const store = JSON.stringify(s3);
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    const wire = requests.slice(reqBefore).some((r) => r.url.includes("sb-public-viewer") || r.body.includes("sb-public-viewer"));
    ok(!store.includes("sb-public-viewer"), "the public stand-in is never an author, a response author, an Expression/Resonance key or stored state");
    ok(!storage.includes("sb-public-viewer") && !wire, "…never persisted to storage and never sent over the network");
    // PART 2 IS NOT SETTLED HERE (D-2 / D-4 are the owner's):
    ok(pv.friendsOwn, "part 2 not settled: the owner's own Friends-only Moment is still shown in the preview (D-2 decides)");
    ok(pv.friendsOthers > 1, `part 2 not settled: other people's Friends-only Moments are still shown (${pv.friendsOthers}; D-2 decides)`);
    ok(s3.moments.filter((m) => m.authorId !== "u-demo-001").length > 0 && (await page.$$eval("[data-sb-sheet] [data-sb-moment]", (n) => n.some((e) => e.querySelector("[data-sb-readout]") && !e.querySelector("[data-sb-ring=own]")))), "part 2 not settled: other authors' Moments are still in the stream (D-4 decides)");
    await page.evaluate(() => window.scrollTo(0, 0));
    await press(page, "Return to My World");
    await sleep(500);
    ok(await page.evaluate(() => document.querySelector("[data-sb-sheet]").getAttribute("data-sb-render-viewer") === "own" && /\d+y \d\dm \d\dd/.test(document.querySelector("[data-sb-sheet]").innerText)), "returning to My World restores the owner's own view");

    /* ---------------- §4 THE PHONE CONVERSATION (390 and 360) ---------------- */
    for (const [w, h] of [[390, 844], [360, 800]]) {
      console.log(`§4 phone conversation @${w}`);
      await open(page, phone(w, h), "&theme=dark");
      await ensureMoment(page, "m-forty");
      await page.evaluate(() => { const b = document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]"); b.scrollIntoView({ block: "center" }); b.focus(); b.click(); });
      await sleep(800);
      const f1 = await page.evaluate(() => ({ surface: !!document.querySelector("[data-sb-conversation-surface='m-forty']"), ta: document.activeElement?.tagName === "TEXTAREA" && !!document.activeElement.closest("[data-sb-conv-composer]") }));
      ok(f1.surface && f1.ta, `${w}: Respond opens the focused conversation with the cursor in the composer`);
      // Reply → correct parent, beneath it, visible
      const parent = await page.evaluate(() => { const row = document.querySelector("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']"); [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply").click(); return row.getAttribute("data-sb-note"); });
      await sleep(400);
      const rf = await page.evaluate(() => document.activeElement?.closest("[data-sb-conv-reply]")?.getAttribute("data-sb-conv-reply"));
      ok(rf === parent, `${w}: Reply opens a reply composer under ${parent}, cursor in it`);
      const replyText = `Phone reply ${w}.`;
      await page.keyboard.type(replyText);
      await page.keyboard.press("Enter");
      await sleep(900);
      const stored = (await momentOf(page, "m-forty")).notes.find((n) => n.text === replyText);
      const placed = await page.evaluate((t, p) => {
        const li = document.querySelector(`[data-sb-conversation-surface] [data-sb-note='${p}']`)?.closest("li");
        const row = [...(li?.querySelectorAll("[data-sb-note][data-sb-depth='2']") ?? [])].find((r) => r.textContent.includes(t));
        const list = document.querySelector("[data-sb-conv-scroll]").getBoundingClientRect();
        const r = row?.getBoundingClientRect();
        return { nested: !!row, visible: !!r && r.top >= list.top - 1 && r.bottom <= list.bottom + 1 };
      }, replyText, parent);
      ok(stored?.parentId === parent && placed.nested, `${w}: the reply is stored with parentId ${parent} and renders beneath its parent`);
      ok(placed.visible, `${w}: the just-sent reply is revealed in the list`);
      // a new response from the bottom composer is revealed too
      await page.evaluate(() => document.querySelector("[data-sb-conv-composer] textarea").focus());
      const newText = `Phone response ${w}.`;
      await page.keyboard.type(newText);
      await page.keyboard.press("Enter");
      await sleep(900);
      ok(await page.evaluate((t) => { const row = [...document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note]")].find((r) => r.textContent.includes(t)); const l = document.querySelector("[data-sb-conv-scroll]").getBoundingClientRect(); const r = row?.getBoundingClientRect(); return !!r && r.top >= l.top - 1 && r.bottom <= l.bottom + 1; }, newText), `${w}: a new response from the bottom composer is revealed`);
      if (w === 390) await shot(page, "05-phone-390-conversation-reply");
      if (w === 360) await shot(page, "09-phone-360-conversation-reply");
      // conversation state survives a Person card: open a reply draft, open a person, close it
      await page.evaluate(() => { const row = document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']")[1]; [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply").click(); });
      await sleep(300);
      await page.keyboard.type("Half-written");
      await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] [data-sb-note-author]").click());
      await sleep(600);
      const card = await page.evaluate(() => { const c = document.querySelector("[data-sb-person-card] .sb-surface-in"); if (!c) return null; const r = c.getBoundingClientRect(); const hits = [[0.5, 0.2], [0.5, 0.5], [0.2, 0.8]].map(([x, y]) => document.elementFromPoint(r.left + r.width * x, r.top + r.height * y)); return { top: hits.every((hh) => !!hh?.closest("[data-sb-person-card]")), focus: !!document.activeElement?.closest("[data-sb-person-card]") }; });
      ok(!!card && card.top, `${w}: the Person card is visibly and interactively on top of the thread (hit-test at 3 points)`);
      ok(!!card && card.focus, `${w}: focus moves into the Person card`);
      if (w === 390) await shot(page, "06-phone-390-personcard-above-thread");
      if (w === 360) await shot(page, "10-phone-360-personcard-above-thread");
      // Tab stays in the card
      let tabOut = false;
      for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); if (!(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-person-card]")))) tabOut = true; }
      ok(!tabOut, `${w}: Tab stays inside the Person card`);
      await page.keyboard.press("Escape");
      await sleep(350);
      const l1 = await page.evaluate(() => ({ card: !!document.querySelector("[data-sb-person-card]"), conv: !!document.querySelector("[data-sb-conversation-surface]"), focus: !!document.activeElement?.hasAttribute("data-sb-note-author"), draft: [...document.querySelectorAll("[data-sb-conv-reply] textarea")].some((t) => t.value === "Half-written") }));
      ok(!l1.card && l1.conv, `${w}: Escape closes only the top layer (the card); the thread stays`);
      ok(l1.focus, `${w}: focus returns to the author who was opened`);
      ok(l1.draft, `${w}: the half-written reply survived opening and closing the person`);
      // a response ⋯ menu: Escape closes the menu only
      await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] [data-sb-note-more]").click());
      await sleep(250);
      await page.keyboard.press("Escape");
      await sleep(250);
      ok(await page.evaluate(() => !document.querySelector("[data-sb-conversation-surface] [role=menu]") && !!document.querySelector("[data-sb-conversation-surface]")), `${w}: Escape on a response menu closes the menu, not the thread`);
      // Tab stays in the thread
      tabOut = false;
      for (let i = 0; i < 70; i++) { await page.keyboard.press("Tab"); if (!(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-conversation-surface] [role=dialog]")))) tabOut = true; }
      ok(!tabOut, `${w}: Tab stays inside the conversation dialog`);
      // the page behind never scrolls
      const y0 = await page.evaluate(() => window.scrollY);
      const hdr = await page.evaluate(() => { const r = document.querySelector("[data-sb-conversation-surface] header").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(hdr.x, hdr.y); await page.mouse.wheel({ deltaY: 600 }); await sleep(300);
      await page.mouse.move(Math.round(w / 2), 30); await page.mouse.wheel({ deltaY: 600 }); await sleep(300);
      await page.touchscreen.touchStart(hdr.x, hdr.y);
      for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(hdr.x, hdr.y - k * 40); await sleep(30); }
      await page.touchscreen.touchEnd(); await sleep(300);
      const list0 = await page.$eval("[data-sb-conv-scroll]", (e) => e.scrollTop);
      const lr = await page.evaluate(() => { const r = document.querySelector("[data-sb-conv-scroll]").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(lr.x, lr.y); await page.mouse.wheel({ deltaY: -500 }); await sleep(400);
      const list1 = await page.$eval("[data-sb-conv-scroll]", (e) => e.scrollTop);
      ok((await page.evaluate(() => window.scrollY)) === y0, `${w}: wheel and touch on the thread's header and scrim never scroll the page behind`);
      ok(list1 !== list0, `${w}: …while the responses list itself still scrolls (${list0} → ${list1})`);
      // 44px targets (hit area) for Reply and the response ⋯
      const hit = await page.evaluate(() => {
        const row = document.querySelector("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']");
        row.scrollIntoView({ block: "center" });
        const probe = (b) => { const r = b.getBoundingClientRect(); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2; return [cy - 20, cy + 20].every((y) => document.elementFromPoint(cx, y) === b) && [cx - 20, cx + 20].every((x) => document.elementFromPoint(x, cy)?.closest("button") === b || r.width >= 44); };
        const reply = [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply");
        return { reply: probe(reply), more: probe(row.querySelector("[data-sb-note-more]")) };
      });
      ok(hit.reply && hit.more, `${w}: Reply and the response ⋯ answer across a 44px target (reply ${hit.reply}, ⋯ ${hit.more})`);
      // a reply sent from the thread hands focus back to that response's Reply
      await page.evaluate(() => { const row = document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']")[2]; row.scrollIntoView({ block: "center" }); [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply").click(); });
      await sleep(300);
      const parent3 = await page.evaluate(() => document.activeElement?.closest("[data-sb-conv-reply]")?.getAttribute("data-sb-conv-reply"));
      await page.keyboard.type("Focus back probe.");
      await page.keyboard.press("Enter");
      await sleep(800);
      ok(await page.evaluate((p) => !!document.activeElement?.hasAttribute("data-sb-reply-toggle") && document.activeElement.closest("[data-sb-note]")?.getAttribute("data-sb-note") === p, parent3), `${w}: after sending a reply, focus returns to that response's Reply (never <body>)`);
      // editing your own response inside the thread: Tab stays trapped, Escape on Cancel cancels the edit only
      const mineRow = await page.evaluate((t) => { const r = [...document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note]")].find((x) => x.textContent.includes(t)); r.scrollIntoView({ block: "center" }); r.querySelector("[data-sb-note-more]").click(); return r.getAttribute("data-sb-note"); }, `Phone response ${w}.`);
      await sleep(250);
      await press(page, "Edit", "[data-sb-conversation-surface] [role=menu]");
      tabOut = false;
      for (let i = 0; i < 50; i++) { await page.keyboard.press("Tab"); if (!(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-conversation-surface] [role=dialog]")))) tabOut = true; }
      ok(!tabOut, `${w}: Tab stays inside the thread while a response is being edited`);
      await page.evaluate((id) => document.querySelector(`[data-sb-conversation-surface] [data-sb-note='${id}'] [data-sb-note-editing] button[type=button]`).focus(), mineRow);
      await page.keyboard.press("Escape");
      await sleep(300);
      ok(await page.evaluate(() => !document.querySelector("[data-sb-conversation-surface] [data-sb-note-editing]") && !!document.querySelector("[data-sb-conversation-surface]")), `${w}: Escape on the edit's Cancel cancels the edit, the thread stays`);
      // Escape closes the thread; focus returns to Respond
      await page.keyboard.press("Escape");
      await sleep(400);
      ok(await page.evaluate(() => !document.querySelector("[data-sb-conversation-surface]") && !!document.activeElement?.closest("[data-sb-moment='m-forty']") && document.activeElement.hasAttribute("data-sb-respond")), `${w}: closing the thread returns focus to Respond`);
      // opened to READ (the responses count), focus is on the list itself: keys scroll it, not the page
      await page.evaluate(() => { const b = document.querySelector("[data-sb-moment='m-forty'] [data-sb-responses]"); b.scrollIntoView({ block: "center" }); b.click(); });
      await sleep(700);
      const rm = await page.evaluate(() => ({ list: !!document.activeElement?.hasAttribute("data-sb-conv-scroll"), y: window.scrollY, st: document.querySelector("[data-sb-conv-scroll]").scrollTop }));
      await page.keyboard.press("PageDown");
      await sleep(400);
      const rm2 = await page.evaluate(() => ({ y: window.scrollY, st: document.querySelector("[data-sb-conv-scroll]").scrollTop }));
      ok(rm.list && rm2.st > rm.st && rm2.y === rm.y, `${w}: opened to read, focus is on the responses list and PageDown scrolls the list, not the page`);
      await page.keyboard.press("Escape");
      await sleep(300);
      if (w === 390) {
        // the Moment itself + a reply composer frame for evidence
        await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']").scrollIntoView({ block: "start" }));
        await sleep(300);
        await shot(page, "07-phone-390-moment");
        await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]").click());
        await sleep(700);
        await page.evaluate(() => { const row = document.querySelector("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']"); [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Reply").click(); });
        await sleep(400);
        await shot(page, "08-phone-390-reply-composer");
      }
    }

    /* ---------------- §5 COMPOSER DATA HYGIENE ---------------- */
    console.log("§5 composer hygiene");
    await open(page, DESKTOP);
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "A memory from before I was born?");
    await setValue(page, "[data-sb-composer] input[type=date]", "1985-06-01");
    const pb = await page.evaluate(() => ({ refused: document.body.innerText.includes("That date is before this life began."), state: document.querySelector("[data-sb-readout-state]").getAttribute("data-sb-readout-state"), neg: /-\d+y/.test(document.querySelector("[data-sb-readout-state]").textContent), postOff: [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Post").disabled, min: document.querySelector("[data-sb-composer] input[type=date]").getAttribute("min") }));
    ok(pb.refused && pb.state === "before-life" && pb.postOff, "a date before the owner's birth is refused with the Life rule's own sentence, and Post stays disabled");
    ok(!pb.neg && pb.min === "1991-11-04", `no negative age is shown; the date field starts at the birth date (min=${pb.min})`);
    await shot(page, "11-composer-pre-birth-refusal");
    await setValue(page, "[data-sb-composer] input[type=date]", "");
    const empty = await page.evaluate(() => ({ nan: /NaN/.test(document.querySelector("[data-sb-composer]").textContent), postOff: [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Post").disabled }));
    ok(!empty.nan && empty.postOff, "a cleared date blocks Post and is never computed from (no NaN age)");
    await press(page, "Cancel", "[data-sb-composer] footer");
    await press(page, "Discard", "[data-sb-composer] footer").catch(() => {});

    // people present: unmatched names never become ids
    await open(page, DESKTOP);
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.click("[data-sb-composer] button[aria-label='Meal']");
    await setValue(page, "#sb-kf-what", "Dal bhat");
    await page.focus("#sb-kf-with");
    await page.keyboard.type("Zzqx, Sofia");
    await page.focus("#sb-kf-what");
    await sleep(250);
    const pp = await page.evaluate(() => ({ note: document.querySelector("[data-sb-people-unmatched]")?.textContent ?? "", field: document.querySelector("#sb-kf-with").value }));
    ok(/Zzqx/.test(pp.note) && pp.field === "Sofia Romano", `an unmatched name is said out loud and not recorded (“${pp.note}”; field now “${pp.field}”)`);
    await setValue(page, "#sb-composer-text", "Meal with a stranger's name.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    const meal = (await state(page)).moments.find((m) => m.text === "Meal with a stranger's name.");
    ok(JSON.stringify(meal?.fields?.with) === JSON.stringify(["p-asha"]), `only the real person is stored (${JSON.stringify(meal?.fields?.with)})`);
    ok(await page.evaluate((id) => { const el = document.querySelector(`[data-sb-moment='${id}']`); return !!el && !/\bwith M\b/.test(el.textContent); }, meal?.id), "no fixture person (\"M\") ever stands in for a name that matched nobody");

    // an ordinary Moment carries no kind fields; a kind carries only its own
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.click("[data-sb-composer] button[aria-label='Meal']");
    await setValue(page, "#sb-kf-what", "Tea");
    await page.focus("#sb-kf-with"); await page.keyboard.type("Sofia"); await page.focus("#sb-kf-what"); await sleep(150);
    await page.click("[data-sb-composer] button[aria-label='Meal']"); // back to an ordinary Moment
    await setValue(page, "#sb-composer-text", "Ordinary after a meal draft.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    const ord = (await state(page)).moments.find((m) => m.text === "Ordinary after a meal draft.");
    ok(ord && ord.kind === "moment" && ord.fields === undefined, "an ordinary Moment carries no specialised kind fields");
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.click("[data-sb-composer] button[aria-label='Meal']");
    await setValue(page, "#sb-kf-what", "Tea");
    await page.focus("#sb-kf-with"); await page.keyboard.type("Sofia"); await page.focus("#sb-kf-what"); await sleep(150);
    await page.click("[data-sb-composer] button[aria-label='Activity']");
    await setValue(page, "#sb-kf-what", "Walk");
    await setValue(page, "#sb-composer-text", "Activity after a meal draft.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    const act = (await state(page)).moments.find((m) => m.text === "Activity after a meal draft.");
    ok(act && act.kind === "activity" && act.fields && !("with" in act.fields), `a kind posts only its own fields (${JSON.stringify(act?.fields)})`);

    // one kind of media: no silent overwrite
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.click("[data-sb-composer] button[aria-label='Photos & video']");
    await page.click("[data-sb-composer] button[aria-label='A rain-wet hiti courtyard in Kathmandu']");
    await press(page, "Confirm", "[data-sb-composer]"); // the photo's file date is detected — confirm it
    await press(page, "Video", "[data-sb-composer] [role=tablist]");
    const vid = await page.evaluate(() => ({ off: document.querySelector("[data-sb-composer] input[aria-label='Video']").disabled, hint: !!document.querySelector("[data-sb-one-media]") }));
    await press(page, "Link", "[data-sb-composer] [role=tablist]");
    const lnk = await page.evaluate(() => ({ off: document.querySelector("[data-sb-composer] input[placeholder='Paste a link']").disabled, hint: !!document.querySelector("[data-sb-one-media]") }));
    ok(vid.off && vid.hint && lnk.off && lnk.hint, "with a photo attached, video and link are closed off — with the reason stated — instead of silently overwritten later");
    await shot(page, "12-composer-one-media-kind");
    await setValue(page, "#sb-composer-text", "One kind of media.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    const one = (await state(page)).moments.find((m) => m.text === "One kind of media.");
    ok(one?.media?.kind === "photos" && one.media.items.length === 1, "the post keeps exactly what was attached");

    // the video caption no longer rides on the Problem title
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.click("[data-sb-composer] button[aria-label='Problem']");
    await setValue(page, "#sb-kf-title", "Roof leak");
    await page.click("[data-sb-composer] button[aria-label='Photos & video']");
    await press(page, "Video", "[data-sb-composer] [role=tablist]");
    await page.click("[data-sb-composer] input[aria-label='Video']");
    await sleep(200);
    await page.evaluate(() => { const boxes = [...document.querySelectorAll("[data-sb-composer] input[type=checkbox]")]; boxes[boxes.length - 1].click(); });
    await sleep(150);
    await setValue(page, "#sb-composer-text", "Problem with a video.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1500);
    const prob = (await state(page)).moments.find((m) => m.text === "Problem with a video.");
    ok(prob?.fields?.title === "Roof leak" && prob?.media?.kind === "video" && prob.media.caption && prob.media.caption !== "Roof leak", `the Problem title and the video caption stay separate (“${prob?.fields?.title}” / “${prob?.media?.caption}”)`);

    // unit: an unknown id is neutral and band-less, never a fixture person
    const dataMod = tsLoad("src/components/style-lab/social/data.ts");
    const vm = tsLoad("src/components/style-lab/social/view-model.ts");
    const u = dataMod.unavailablePerson("p-nobody");
    const lv = vm.lifeViewFor(dataMod.PEOPLE.maya, u, new Date());
    ok(u.unavailable && u.name === "—" && !Object.values(dataMod.PEOPLE).some((p) => p.id === u.id) && lv.scope === "other" && lv.bandIndex === -1, `an unknown id is the neutral unavailable person — band-less, not a fixture (${JSON.stringify(lv)})`);
    ok(/unavailablePerson\(id\)/.test(fs.readFileSync(path.join(ROOT, "src/components/style-lab/social/store.tsx"), "utf8")) && !/:\s*PEOPLE\.m\)/.test(fs.readFileSync(path.join(ROOT, "src/components/style-lab/social/store.tsx"), "utf8")), "the store resolves unknown ids to the unavailable person, never to PEOPLE.m");

    /* ---------------- §6 RESPOND TRUTH ---------------- */
    console.log("§6 respond truth");
    await open(page, DESKTOP);
    const forty = await momentOf(page, "m-forty");
    ok(forty.notes[0].at > forty.at, `the fixture clock is local: the first response (${forty.notes[0].at.slice(11, 16)}) comes after the Moment (${forty.at.slice(11, 16)})`);
    await ensureMoment(page, "m-forty");
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-responses]")][0].click());
    await sleep(400);
    const tm = await page.$eval("[data-sb-moment='m-forty'] [data-sb-note] time", (e) => ({ text: e.textContent, dt: e.getAttribute("datetime") }));
    ok(/^\d{2} [A-Z]{3} 2026 · \d{2}:\d{2}$/.test(tm.text) && /^2026-09-01T/.test(tm.dt), `a response from another day states its date (“${tm.text}”, datetime ${tm.dt})`);
    // Shift+Enter keeps line breaks; today's response states only the clock
    await page.focus("[data-sb-moment='m-forty'] [data-sb-response-composer] textarea");
    await page.keyboard.type("line one");
    await page.keyboard.down("Shift"); await page.keyboard.press("Enter"); await page.keyboard.up("Shift");
    await page.keyboard.type("line two");
    await page.keyboard.press("Enter");
    await sleep(700);
    const lb = await page.evaluate(() => { const row = [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].find((r) => r.textContent.includes("line two")); const span = [...row.querySelectorAll("p span")].find((s) => s.textContent.includes("line one")); return { ws: getComputedStyle(span).whiteSpace, text: span.innerText, time: row.querySelector("time").textContent }; });
    ok(lb.ws === "pre-line" && /line one\nline two/.test(lb.text), "a response keeps its own line breaks (Shift+Enter)");
    ok(/^\d{2}:\d{2}$/.test(lb.time), `a response from today states only its clock (“${lb.time}”)`);
    // IME: Enter while composing never sends
    const before = (await momentOf(page, "m-forty")).notes.length;
    await page.focus("[data-sb-moment='m-forty'] [data-sb-response-composer] textarea");
    await page.keyboard.type("候选");
    await page.evaluate(() => { const ta = document.querySelector("[data-sb-moment='m-forty'] [data-sb-response-composer] textarea"); ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, isComposing: true })); });
    await sleep(600);
    ok((await momentOf(page, "m-forty")).notes.length === before, "Enter while an input method is composing never sends");
    await page.keyboard.press("Enter");
    await sleep(700);
    ok((await momentOf(page, "m-forty")).notes.length === before + 1, "…and a plain Enter afterwards sends");
    // "Write a response" at zero responses writes
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-sameage'] [data-sb-responses]").click());
    await sleep(400);
    ok(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-moment='m-sameage'] [data-sb-response-composer]")), "“Write a response” on a Moment with none puts the cursor in the composer");
    // edit a response keeps line breaks (a textarea, Enter saves)
    await page.evaluate(() => { const row = [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].find((r) => r.textContent.includes("line two")); row.querySelector("[data-sb-note-more]").click(); });
    await sleep(250);
    await press(page, "Edit", "[data-sb-moment='m-forty'] [role=menu]");
    const edTag = await page.evaluate(() => document.activeElement?.tagName);
    await page.keyboard.press("End");
    await page.keyboard.down("Shift"); await page.keyboard.press("Enter"); await page.keyboard.up("Shift");
    await page.keyboard.type("line three");
    await page.keyboard.press("Enter");
    await sleep(400);
    ok(edTag === "TEXTAREA" && (await momentOf(page, "m-forty")).notes.some((n) => /line two\nline three$/.test(n.text) && n.edited), "editing a response is multi-line (textarea; Enter saves, Shift+Enter breaks)");

    /* ---------------- §7 ACTION HONESTY + ACCESSIBILITY ---------------- */
    console.log("§7 honesty + a11y");
    await ctx.overridePermissions("http://localhost:3210", ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
    await open(page, DESKTOP);
    await menuOf(page, "m-meal");
    await press(page, "Copy link", "[data-sb-moment='m-meal']");
    await sleep(300);
    const copied = await page.evaluate(async () => ({ toast: document.querySelector("[data-sb-moment='m-meal'] > p[role=status]")?.textContent ?? "", clip: await navigator.clipboard.readText().catch(() => "") }));
    ok(copied.toast === "Link copied." && copied.clip.endsWith("/m/m-meal"), `Copy link confirms only a copy that happened (“${copied.toast}”)`);
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); });
    await menuOf(page, "m-meal");
    await press(page, "Copy link", "[data-sb-moment='m-meal']");
    await sleep(300);
    const failedCopy = await page.$eval("[data-sb-moment='m-meal'] > p[role=status]", (e) => e.textContent);
    ok(failedCopy === "Couldn’t copy the link.", `a failed copy says so (“${failedCopy}”)`);
    // menu keyboard: opens on the first item, arrows move, Escape returns to the trigger
    await page.focus("[data-sb-moment='m-meal'] button[aria-label=More]");
    await page.keyboard.press("Enter");
    await sleep(250);
    const k0 = await page.evaluate(() => document.activeElement?.textContent.trim());
    await page.keyboard.press("ArrowDown");
    const k1 = await page.evaluate(() => document.activeElement?.textContent.trim());
    await page.keyboard.press("End");
    const k2 = await page.evaluate(() => document.activeElement?.textContent.trim());
    await page.keyboard.press("Escape");
    await sleep(250);
    const k3 = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    ok(k0 === "Report" && k1 === "Hide" && k2 === "Copy link" && k3 === "More", `menu keys: open → ${k0}, ↓ → ${k1}, End → ${k2}, Escape → back to ⋯ (${k3})`);
    // the delete confirmation takes focus (the safe choice) — keyboard never falls to <body>
    await page.focus("[data-sb-moment='m-rain'] button[aria-label=More]");
    await page.keyboard.press("Enter");
    await sleep(250);
    for (let i = 0; i < 6 && (await page.evaluate(() => document.activeElement?.textContent.trim())) !== "Delete"; i++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await sleep(300);
    const dc = await page.evaluate(() => ({ focus: document.activeElement?.textContent.trim(), group: !!document.activeElement?.closest("[role=group][aria-labelledby]") }));
    ok(dc.focus === "Keep" && dc.group, `Delete asks, and focus lands on “${dc.focus}” inside the labelled confirmation`);
    await page.keyboard.press("Escape");
    await sleep(250);
    // Hide: focus lands on the neighbour and the outcome is announced
    await menuOf(page, "m-meal");
    await press(page, "Hide", "[data-sb-moment='m-meal']");
    await sleep(500);
    const hid = await page.evaluate(() => ({ gone: !document.querySelector("[data-sb-moment='m-meal']"), focus: document.activeElement?.hasAttribute("data-sb-readout") ? document.activeElement.closest("[data-sb-moment]").getAttribute("data-sb-moment") : document.activeElement?.tagName }));
    ok(hid.gone && hid.focus !== "BODY" && typeof hid.focus === "string" && hid.focus.startsWith("m-"), `Hide leaves focus on the next Moment's readout (${hid.focus})`);
    ok((await announcer(page)) === "Moment hidden.", "…and announces it");
    // Delete own: same
    await menuOf(page, "m-rain");
    await press(page, "Delete", "[data-sb-moment='m-rain'] [role=menu]");
    await press(page, "Delete", "[data-sb-moment='m-rain'] [role=menu]");
    await sleep(500);
    const del = await page.evaluate(() => ({ gone: !document.querySelector("[data-sb-moment='m-rain']"), focus: document.activeElement?.closest("[data-sb-moment]")?.getAttribute("data-sb-moment") ?? document.activeElement?.tagName }));
    ok(del.gone && del.focus?.startsWith("m-") && (await announcer(page)) === "Moment deleted.", `Delete leaves focus on a neighbour (${del.focus}) and announces “Moment deleted.”`);
    // stale landing: a notification whose Moment is gone says so
    await menuOf(page, "m-panorama").catch(async () => { await ensureMoment(page, "m-panorama"); await menuOf(page, "m-panorama"); });
    await press(page, "Delete", "[data-sb-moment='m-panorama'] [role=menu]");
    await press(page, "Delete", "[data-sb-moment='m-panorama'] [role=menu]");
    await sleep(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click("[data-sb-bell]");
    await sleep(400);
    await page.click("[data-sb-notification-moment='m-panorama']").catch(() => {});
    await sleep(500);
    ok((await announcer(page)) === "That Moment is no longer available." && !!(await page.$("[data-sb-notifications]")), "a notification whose Moment is gone says so — the panel stays, nothing closes onto nothing");
    await page.keyboard.press("Escape");
    // own response delete: focus stays in the conversation, announced
    await open(page, DESKTOP);
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-respond]").click());
    await sleep(300);
    await page.keyboard.type("To be deleted.");
    await page.keyboard.press("Enter");
    await sleep(700);
    await page.evaluate(() => { const row = [...document.querySelectorAll("[data-sb-moment='m-rain'] [data-sb-note]")].find((r) => r.textContent.includes("To be deleted.")); row.querySelector("[data-sb-note-more]").click(); });
    await sleep(250);
    await press(page, "Delete", "[data-sb-moment='m-rain'] [role=menu]");
    await sleep(500);
    ok(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-moment='m-rain'] [data-sb-response-composer]")), "deleting your response leaves focus in the conversation's composer");
    ok((await announcer(page)) === "Response deleted.", "…and announces “Response deleted.”");
    // media: only the "+N" tile is a control; the play control is honestly disabled
    await ensureMoment(page, "m-tenphotos");
    const media = await page.evaluate(() => { const m = document.querySelector("[data-sb-moment='m-tenphotos'] .grid"); return { buttons: m.querySelectorAll("button").length, tiles: m.querySelectorAll("[data-sb-media-tile]").length }; });
    ok(media.buttons === 1 && media.tiles === 3, `a photo grid has one control — “show more” — and three plain photo tiles (${media.buttons} / ${media.tiles})`);
    await page.focus("[data-sb-moment='m-tenphotos'] [data-sb-show-more]");
    await page.keyboard.press("Enter");
    await sleep(300);
    const fewer = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-show-fewer"));
    await page.keyboard.press("Enter");
    await sleep(300);
    const moreAgain = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-show-more"));
    ok(fewer && moreAgain, "“Show N more” hands focus to “Show fewer”, and back — never to <body>");
    await ensureMoment(page, "m-video");
    ok(await page.$eval("[data-sb-moment='m-video'] [data-sb-video-play]", (b) => b.disabled && b.getAttribute("aria-label").startsWith("Play video")), "the video play control is disabled until playback exists");
    // a decorative ring beside a name is silent for a screen reader
    await page.evaluate(() => { const b = document.querySelector("[data-sb-moment='m-rain'] [data-sb-responses]"); if (b.getAttribute("aria-expanded") !== "true") b.click(); });
    await sleep(300);
    ok(await page.$eval("[data-sb-moment='m-rain'] [data-sb-note] [data-sb-ring]", (r) => r.getAttribute("aria-hidden") === "true" && !r.getAttribute("role")), "a response author's ring is decorative (the name is announced once)");
    // meeting names its people once
    await ensureMoment(page, "m-meeting");
    const meet = await page.$eval("[data-sb-moment='m-meeting']", (e) => ({ withs: (e.textContent.match(/\bwith\b/g) || []).length, button: e.querySelector("[data-sb-moment-with]")?.textContent.trim() }));
    ok(meet.withs === 1 && /^with Giulia, Luca$/.test(meet.button ?? ""), `a Meeting names its people once (“${meet.button}”)`);
    // failure announcement (Composer)
    await open(page, DESKTOP, "&fail=1");
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await setValue(page, "#sb-composer-text", "This one fails.");
    await press(page, "Post", "[data-sb-composer] footer");
    await sleep(1300);
    ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] [role=alert]")].some((p) => p.textContent.includes("Couldn't post."))), "a failed post is announced (role=alert), not only shown");
    // reduced motion: the conversation still works
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(page, phone(390, 844));
    await ensureMoment(page, "m-forty");
    await page.evaluate(() => { const b = document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]"); b.scrollIntoView({ block: "center" }); b.click(); });
    await sleep(600);
    ok(await page.evaluate(() => document.activeElement?.tagName === "TEXTAREA" && !!document.querySelector("[data-sb-conversation-surface]")), "with reduced motion the phone conversation opens and focuses the same way");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---------------- §8 LOCALISATION ---------------- */
    console.log("§8 localisation");
    const cats = {};
    for (const l of ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"]) cats[l] = tsLoad(`src/lib/i18n/catalogs/${l}.ts`).default;
    const enKeys = Object.keys(cats.en).sort().join("|");
    ok(Object.values(cats).every((c) => Object.keys(c).sort().join("|") === enKeys), `8 catalogs key-complete (${Object.keys(cats.en).length} keys each)`);
    const NEW = ["moments.readMore", "moments.readLess", "moments.ageTitle", "moments.bandTitle", "moments.linkCopyFailed", "moments.hiddenAnnounce", "moments.deletedAnnounce", "moments.previewPaused", "moments.sectionAria", "conv.you", "conv.deletedAnnounce", "media.showFewer", "life.cursorBand", "life.instrumentsAria", "composer.beforeLife", "composer.oneMediaKind", "composer.peopleNotFound", "composer.discardChangesQ", "composer.discardChanges", "composer.keepEditing", "notif.momentGone"];
    ok(NEW.every((k) => ["es", "it", "nl", "ru", "hi", "ne", "zh-Hans"].every((l) => cats[l][k] && cats[l][k] !== cats.en[k])), "every new Phase 4.4-A string is translated in all seven non-English languages");
    await page.setCookie({ name: "sb-locale", value: "ne", domain: "localhost", path: "/" });
    await open(page, DESKTOP);
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']") || null);
    await ensureMoment(page, "m-video");
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-video'] [data-sb-responses]").click());
    await sleep(300);
    const ne = await page.evaluate(() => ({ you: [...document.querySelectorAll("[data-sb-moment='m-video'] [data-sb-note]")].some((r) => r.textContent.includes("(तपाईं)")), aria: document.querySelector("[data-sb-sheet]").getAttribute("aria-label") }));
    ok(ne.you && ne.aria === "क्षणहरू", `ne: new strings render in Nepali (“(तपाईं)”, sheet “${ne.aria}”)`);
    await ensureMoment(page, "m-nepali-1");
    ok(await page.evaluate(() => document.fonts.check("500 16px 'SB Devanagari'")), "ne: the Devanagari face is loaded (no layout regression source)");
    await page.deleteCookie({ name: "sb-locale", domain: "localhost" });

    /* ---------------- §9 BOUNDARIES ---------------- */
    console.log("§9 boundaries");
    const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex");
    ok(sha("src/components/style-lab/social/expressions.tsx") === "dd78c36970dfa8c766cb196348c8db0293cf80ad5dea2cd31e19de3068a0194e", "Boom: expressions.tsx is byte-identical");
    const vmSrc = fs.readFileSync(path.join(ROOT, "src/components/style-lab/social/view-model.ts"), "utf8");
    ok(/momentLifeFor\(viewer: Person, author: Person, at: Date\)/.test(vmSrc) && /ring\.momentsByBand = bandCounts\(subject, visible\)/.test(vmSrc), "Life policy untouched: the band-at-Moment rule and visitor density are unchanged (D-1 is 4.4-B)");
    ok(pageErrors.length === 0, `no page errors (${pageErrors.slice(0, 3).join(" | ")})`);
  } catch (e) {
    failures.push(`suite error: ${e.message}`);
    console.log("SUITE ERROR", e);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-4-4a-truth: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => `  - ${f}`).join("\n")); process.exit(1); }
})();
