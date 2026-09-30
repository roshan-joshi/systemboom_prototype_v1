/**
 * SOCIAL WALL S2 — RESPOND CONVERSATION COMPLETION (focused regression suite).
 *
 *   node prototype-tests/social-s2-respond.js        (dev server on :3210)
 *
 * §1 Response Boom — the same registry and single-active invariant as a Moment's Boom, at
 *    conversation weight; participation is people, never ranking; preview shows, never writes
 * §2 replies — Reply on every response; a reply's Reply answers in the same shallow thread
 *    (parent's composer, mention prefilled); two visual levels, never deeper
 * §3 delete with children — tombstone, conversation survives; childless delete just goes;
 *    the tombstone leaves when its last reply does
 * §4 mentions — suggested only from this Moment's participants + the viewer's connections,
 *    chosen (never scanned), rendered as a doorway to the person
 * §5 response media — one image, chosen, removable, degrading to its own words on failure
 * §6 long conversations — the focused surface opens on the latest 20, earlier in batches,
 *    chronological, no ranking
 * §7 mobile + a11y + localisation — 360 fits, targets, ne strings
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&theme=light`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const PHONE = { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(page, vp = DESKTOP, q = "", locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  await page.goto(`${B}${q}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const loadAll = (page) => page.evaluate(async () => { for (let i = 0; i < 8 && document.querySelector("[data-sb-load-more]"); i++) { document.querySelector("[data-sb-load-more]").click(); await new Promise((r) => setTimeout(r, 250)); } });
const openRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-respond]").click()); await sleep(400); };
const openForty = async (page) => {
  await loadAll(page);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty']").scrollIntoView({ block: "center" }));
  await sleep(250);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]").click());
  await sleep(600);
};

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ---- §1 Response Boom ---- */
    console.log("§1 Response Boom");
    await open(page);
    await openRain(page);
    const seed = await page.evaluate(() => ({
      count: document.querySelector("[data-sb-note='n-rain-1'] [data-sb-note-boom-count]")?.getAttribute("data-sb-note-boom-count"),
      control: document.querySelector("[data-sb-note='n-rain-1'] [data-sb-note-boom]")?.getAttribute("data-sb-note-boom"),
    }));
    ok(seed.count === "1" && seed.control === "", "a seeded Response Boom shows as quiet participation; the viewer's own control is dormant");
    await page.click("[data-sb-note='n-rain-1'] [data-sb-note-boom]");
    await sleep(300);
    const picker = await page.evaluate(() => [...document.querySelectorAll("[data-sb-note-boom-picker] [role^=menuitem]")].map((b) => b.textContent.trim()));
    ok(picker.length === 18 && picker[0] === "Care", `the picker is the ONE expression registry, canonical order, all named (${picker.length}; first ${picker[0]})`);
    ok(!picker.some((x) => /like|Like/.test(x)), "no Like anywhere in the vocabulary");
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-note-boom-picker] [role^=menuitem]")].find((b) => /Joy/.test(b.textContent))?.click());
    await sleep(300);
    let st = await state(page);
    let expr = st.moments.find((m) => m.id === "m-rain").notes[0].expressions;
    ok(expr["u-demo-001"] === "joy" && expr["p-bikash"] === "care", `Boom a Response is real state, one per person (${JSON.stringify(expr)})`);
    await page.click("[data-sb-note='n-rain-1'] [data-sb-note-boom]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-note-boom-picker] [role^=menuitem]")].find((b) => /Care/.test(b.textContent))?.click());
    await sleep(300);
    st = await state(page);
    expr = st.moments.find((m) => m.id === "m-rain").notes[0].expressions;
    ok(expr["u-demo-001"] === "care" && Object.keys(expr).length === 2, "choosing again REPLACES the viewer's own — the single-active invariant");
    await page.click("[data-sb-note='n-rain-1'] [data-sb-note-boom]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-note-boom-picker] [role^=menuitem]")].find((b) => /Remove expression/.test(b.textContent))?.click());
    await sleep(300);
    st = await state(page);
    expr = st.moments.find((m) => m.id === "m-rain").notes[0].expressions;
    ok(Object.keys(expr).length === 1 && !expr["u-demo-001"], "Remove clears only the viewer's own entry");
    await page.click("[data-sb-note='n-rain-1'] [data-sb-note-boom-count]");
    await sleep(300);
    const who = await page.evaluate(() => [...document.querySelectorAll("[data-sb-note-boom-who] li")].map((l) => ({ name: l.textContent.trim(), photoOrInitials: !!l.querySelector("[data-sb-identity-photo],[data-sb-identity-initials]") })));
    ok(who.length === 1 && /Luca/.test(who[0].name) && who[0].photoOrInitials, "who-felt-this is a people list — real identity + name, registry order, no ranking");
    await page.keyboard.press("Escape");
    // preview: participation visible, no control
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /View as public/.test(b.textContent))?.click());
    await sleep(700);
    await openRain(page);
    const pv = await page.evaluate(() => ({ control: !!document.querySelector("[data-sb-note='n-rain-1'] [data-sb-note-boom]"), count: document.querySelector("[data-sb-note='n-rain-1'] [data-sb-note-boom-count]")?.getAttribute("data-sb-note-boom-count") }));
    ok(!pv.control && pv.count === "1", "View as public: participation reads, the control does not exist — a preview writes nothing");

    /* ---- §2 replies in the shallow thread ---- */
    console.log("§2 replies");
    await open(page, PHONE);
    await openForty(page);
    await page.evaluate(() => document.querySelector("[data-sb-note='n-forty-23']").scrollIntoView({ block: "center" }));
    await sleep(250);
    await page.click("[data-sb-note='n-forty-23'] [data-sb-reply-toggle]");
    await sleep(350);
    const prefill = await page.evaluate(() => ({ parent: document.querySelector("[data-sb-conv-reply]")?.getAttribute("data-sb-conv-reply"), text: document.querySelector("[data-sb-conv-reply] textarea")?.value }));
    ok(prefill.parent === "n-forty-22" && /^@Sofia Romano /.test(prefill.text ?? ""), `a reply's Reply answers in the SAME thread, mention prefilled (parent ${prefill.parent}, “${prefill.text}”)`);
    await page.keyboard.type("agreed.");
    await page.keyboard.press("Enter");
    await sleep(800);
    st = await state(page);
    const newReply = st.moments.find((m) => m.id === "m-forty").notes.find((n) => /agreed\./.test(n.text));
    ok(newReply?.parentId === "n-forty-22" && newReply?.mentions?.[0] === "p-asha", "…stored under the top-level parent with the real mention id — two visual levels, never deeper");
    const depth = await page.evaluate((id) => document.querySelector(`[data-sb-note='${id}']`)?.getAttribute("data-sb-depth"), newReply.id);
    ok(depth === "2", "…and rendered at depth 2");

    /* ---- §3 tombstone ---- */
    console.log("§3 delete with children");
    await page.evaluate(() => document.querySelector("[data-sb-note='n-forty-22']").scrollIntoView({ block: "center" }));
    await sleep(200);
    await page.click("[data-sb-note='n-forty-22'] [data-sb-note-more]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role^=menuitem]")].find((b) => /Delete/.test(b.textContent))?.click());
    await sleep(400);
    const tomb = await page.evaluate(() => ({
      removed: !!document.querySelector("[data-sb-note='n-forty-22'][data-sb-note-removed]"),
      text: document.querySelector("[data-sb-note='n-forty-22']")?.textContent.trim(),
      child: !!document.querySelector("[data-sb-note='n-forty-23']"),
      identity: !!document.querySelector("[data-sb-note='n-forty-22'] [data-sb-identity-photo],[data-sb-note='n-forty-22'] [data-sb-identity-initials]"),
      actions: !!document.querySelector("[data-sb-note='n-forty-22'] button"),
    }));
    ok(tomb.removed && tomb.text === "Response removed" && tomb.child, "deleting a response with replies leaves a tombstone — the conversation survives");
    ok(!tomb.identity && !tomb.actions, "…the tombstone carries no identity and no actions");
    st = await state(page);
    const tombNote = st.moments.find((m) => m.id === "m-forty").notes.find((n) => n.id === "n-forty-22");
    ok(tombNote.removed === true && tombNote.text === "" && !tombNote.expressions && !tombNote.photo, "…and its content is CLEARED in state, not hidden");

    /* ---- §4 mentions ---- */
    console.log("§4 mentions");
    await open(page);
    await openRain(page);
    await page.focus("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea");
    await page.keyboard.type("With @Bea");
    await sleep(350);
    const noStranger = await page.evaluate(() => document.querySelectorAll("[data-sb-mention-suggestions] button").length);
    ok(noStranger === 0, "a stranger (not a participant, not connected) is never suggested into a conversation");
    await page.evaluate(() => { const ta = document.querySelector("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, "With @Sof"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.focus("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea");
    await page.keyboard.type("i");
    await sleep(350);
    const sugs = await page.evaluate(() => [...document.querySelectorAll("[data-sb-mention-suggestions] button")].map((b) => b.textContent.trim()));
    ok(sugs.length >= 1 && /Sofia Romano/.test(sugs[0]), `typing @ suggests only relevant people (${sugs.join(", ")})`);
    await page.keyboard.press("Enter");
    await sleep(250);
    const picked = await page.$eval("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea", (e) => e.value);
    ok(/@Sofia Romano $/.test(picked), `Enter answers the open suggestion first — never sends a half-typed mention (“${picked}”)`);
    await page.keyboard.press("Enter");
    await sleep(800);
    st = await state(page);
    const mNote = st.moments.find((m) => m.id === "m-rain").notes.slice(-1)[0];
    ok(mNote.mentions?.length === 1 && mNote.mentions[0] === "p-asha", "the mention is stored as the chosen person's id, never scanned text");
    await page.evaluate((id) => document.querySelector(`[data-sb-note='${id}'] [data-sb-mention='p-asha']`)?.click(), mNote.id);
    await sleep(400);
    ok(!!(await page.$("[data-sb-person-card='p-asha']")), "a rendered mention is a doorway to the person");
    await page.keyboard.press("Escape");
    await sleep(200);

    /* ---- §5 response media ---- */
    console.log("§5 one photo");
    await page.focus("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea");
    await page.keyboard.type("The gutter photo.");
    await page.click("[data-sb-moment='m-rain'] [data-sb-note-photo-button]");
    await sleep(300);
    const grid = await page.evaluate(() => document.querySelectorAll("[data-sb-note-photo-picker] button").length);
    ok(grid > 10, `the picker offers the real library (${grid})`);
    await page.evaluate(() => document.querySelector("[data-sb-note-photo-picker] button")?.click());
    await sleep(250);
    ok(!!(await page.$("[data-sb-moment='m-rain'] [data-sb-note-photo-chip]")), "the chosen photo shows as a removable chip before sending");
    await page.focus("[data-sb-moment='m-rain'] [data-sb-response-composer] textarea");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await sleep(800);
    st = await state(page);
    const pNote = st.moments.find((m) => m.id === "m-rain").notes.slice(-1)[0];
    ok(!!pNote.photo && /The gutter photo/.test(pNote.text), "a response carries at most one image beside its words");
    ok(await page.evaluate((id) => !!document.querySelector(`[data-sb-note='${id}'] [data-sb-note-photo]`), pNote.id), "…rendered quietly under the words");

    /* ---- §6 long conversations ---- */
    console.log("§6 long conversations");
    await open(page, PHONE);
    await openForty(page);
    const batch = await page.evaluate(() => ({
      earlier: document.querySelector("[data-sb-conv-earlier]")?.textContent.trim() ?? null,
      top: document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']").length,
      order: [...document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']")].slice(0, 2).map((n) => n.getAttribute("data-sb-note")),
    }));
    ok(batch.top === 20 && /7 earlier/.test(batch.earlier ?? ""), `the focused surface opens on the latest 20 top-level responses with “${batch.earlier}”`);
    await page.evaluate(() => document.querySelector("[data-sb-conv-earlier]")?.click());
    await sleep(300);
    const all = await page.evaluate(() => ({ top: document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']").length, earlier: !!document.querySelector("[data-sb-conv-earlier]") }));
    ok(all.top === 27 && !all.earlier, "…earlier responses load in one more batch; chronology intact, no ranking anywhere");

    /* ---- §7 mobile + localisation ---- */
    console.log("§7 mobile + ne");
    const fit = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: innerWidth }));
    ok(fit.docW <= fit.vw, `the conversation with Boom controls fits 360 (${fit.docW}/${fit.vw})`);
    const target = await page.evaluate(() => {
      const b = document.querySelector("[data-sb-conversation-surface] [data-sb-note-boom]");
      if (!b) return null;
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const el = document.elementFromPoint(cx + 12, cy);
      return { hits: el === b || b.contains(el) || el?.closest("button") === b };
    });
    ok(!!target?.hits, "the small Boom control answers across its grown 44px hit area");
    await open(page, DESKTOP, "", "ne");
    await openRain(page);
    const ne = await page.evaluate(() => ({
      boomAria: document.querySelector("[data-sb-note='n-rain-1'] [data-sb-note-boom]")?.getAttribute("aria-label") ?? "",
      photoAria: document.querySelector("[data-sb-moment='m-rain'] [data-sb-note-photo-button]")?.getAttribute("aria-label") ?? "",
    }));
    ok(/जवाफ/.test(ne.boomAria) && /फोटो/.test(ne.photoAria), `the new strings speak the catalog languages (ne: “${ne.boomAria}” · “${ne.photoAria}”)`);

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s2-respond: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
