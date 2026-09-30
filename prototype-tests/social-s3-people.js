/**
 * SOCIAL WALL S3 — PEOPLE + FRIENDS COMPLETION (focused regression suite).
 *
 *   node prototype-tests/social-s3-people.js        (dev server on :3210)
 *
 * §1 the full friend lifecycle on the person surface — none → Requested → Cancel → none;
 *    request-in → Decline → none; friend → Remove → none. Every state truthful, no dead end.
 * §2 cross-surface agreement — a request sent on the card is the same request in the People
 *    panel and on that person's own World hero.
 * §3 separation of concepts — people present in a Moment and people who felt something are
 *    IDENTITY-ONLY lists (doorways, never relationship actions); the card carries the truth.
 * §4 empty states + localisation.
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&theme=light`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };

async function open(page, q = "", locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(DESKTOP);
  await page.goto(`${B}${q}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const card = (page) => page.evaluate(() => {
  const c = document.querySelector("[data-sb-person-card]");
  if (!c) return null;
  const q = (s) => !!c.querySelector(s);
  return {
    rel: c.getAttribute("data-sb-person-rel"),
    state: c.querySelector("[data-sb-person-state]")?.textContent.trim() ?? null,
    add: q("[data-sb-add-friend]"), cancel: q("[data-sb-cancel-request]"),
    accept: q("[data-sb-accept]"), decline: q("[data-sb-decline]"),
    message: q("[data-sb-message]"), remove: q("[data-sb-remove-friend]"), world: q("[data-sb-open-world]"),
  };
});
const clickIn = (page, sel) => page.evaluate((s) => document.querySelector(`[data-sb-person-card] ${s}`)?.click(), sel);
async function openFromPeople(page, name) {
  // opening a person leaves the panel open (return context) — only toggle when it is closed
  await page.evaluate(() => { if (!document.querySelector("[data-sb-people-panel]")) document.querySelector("[data-sb-people]")?.click(); });
  await sleep(350);
  await page.evaluate((v) => { const f = document.querySelector("[data-sb-people-find]"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(f, v); f.dispatchEvent(new Event("input", { bubbles: true })); }, name);
  await sleep(350);
  await page.evaluate(() => document.querySelector("[data-sb-people-row] button")?.click());
  await sleep(400);
}

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ---- §1 lifecycle ---- */
    console.log("§1 the full lifecycle, truthfully");
    await open(page);
    await openFromPeople(page, "beatrice");
    let c = await card(page);
    ok(c && c.rel === "none" && c.add && !c.message && !c.remove && c.world, "a stranger: Add friend + Open World, never Message/Remove");
    await clickIn(page, "[data-sb-add-friend]");
    await sleep(400);
    c = await card(page);
    ok(c.rel === "request-out" && c.cancel && !c.add && !c.message, "Add friend truthfully becomes a REQUEST — cancellable, not a friendship");
    await clickIn(page, "[data-sb-cancel-request]");
    await sleep(400);
    c = await card(page);
    ok(c.rel === "none" && c.add, "Cancel returns honestly to stranger — the loop has no dead end");
    await page.keyboard.press("Escape");
    await sleep(250);

    await openFromPeople(page, "francesca");
    c = await card(page);
    ok(c.rel === "request-in" && c.accept && c.decline && !c.message, "an incoming request: Accept / Decline, no premature Message");
    await clickIn(page, "[data-sb-decline]");
    await sleep(400);
    c = await card(page);
    ok(c.rel === "none" && c.add && !c.accept, "Decline resolves to stranger — stated, not hidden");
    await page.keyboard.press("Escape");
    await sleep(250);

    await openFromPeople(page, "luca");
    c = await card(page);
    ok(c.rel === "friend" && c.message && c.remove, "a friend: Message + a quiet Remove");
    await clickIn(page, "[data-sb-remove-friend]");
    await sleep(400);
    c = await card(page);
    ok(c.rel === "none" && c.add && !c.message, "Remove ends the friendship truthfully — back to Add friend, Message gone");
    await page.keyboard.press("Escape");
    await sleep(250);

    /* ---- §2 cross-surface agreement ---- */
    console.log("§2 one relationship, every surface");
    await open(page);
    await openFromPeople(page, "beatrice");
    await clickIn(page, "[data-sb-add-friend]");
    await sleep(400);
    await page.keyboard.press("Escape");
    await sleep(250);
    await page.evaluate(() => { if (!document.querySelector("[data-sb-people-panel]")) document.querySelector("[data-sb-people]")?.click(); const f = document.querySelector("[data-sb-people-find]"); if (f) { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(f, ""); f.dispatchEvent(new Event("input", { bubbles: true })); } });
    await sleep(400);
    const panel = await page.evaluate(() => {
      const row = document.querySelector("[data-sb-people-row='p-walt']");
      return row ? { rel: row.getAttribute("data-sb-people-rel"), cancel: !!row.querySelector("[data-sb-people-cancel]") } : null;
    });
    ok(panel?.rel === "request-out" && panel.cancel, "the People panel agrees: waiting on Beatrice, cancellable there too");
    await page.keyboard.press("Escape");
    // her own World's hero agrees (same session, same store)
    await openFromPeople(page, "beatrice");
    await clickIn(page, "[data-sb-open-world]");
    await sleep(700);
    const hero = await page.evaluate(() => document.querySelector("[data-sb-hero]")?.textContent ?? "");
    ok(/Requested|Cancel/.test(hero), "…and her World's hero states the same pending request");

    /* ---- §3 separation ---- */
    console.log("§3 present ≠ friends ≠ felt-this");
    await open(page);
    await page.evaluate(async () => { for (let i = 0; i < 8 && document.querySelector("[data-sb-load-more]"); i++) { document.querySelector("[data-sb-load-more]").click(); await new Promise((r) => setTimeout(r, 250)); } });
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-meeting'] [data-sb-moment-with]")?.click());
    await sleep(400);
    const withList = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment-with-people] [role^=menuitem]")].map((b) => b.textContent.trim()));
    ok(withList.length > 0 && !withList.some((x) => /Add friend|Requested|Friends/.test(x)), `people PRESENT are doorways, never relationship actions (${withList.join(" · ")})`);
    await page.keyboard.press("Escape");
    await sleep(200);
    const pulse = await page.evaluate(() => {
      const s = document.querySelector("[data-sb-moment='m-panorama'] [data-sb-expression-summary]");
      return s ? s.textContent : null;
    });
    ok(pulse !== null && !/Add friend|Friends|Requested/.test(pulse), "people who FELT something are identity-only — no relationship state in the pulse");

    /* ---- §4 empty state + ne ---- */
    console.log("§4 empty states + ne");
    await page.evaluate(() => { if (!document.querySelector("[data-sb-people-panel]")) document.querySelector("[data-sb-people]")?.click(); });
    await sleep(350);
    await page.type("[data-sb-people-find]", "zzzz", { delay: 20 });
    await sleep(350);
    const empty = await page.evaluate(() => document.querySelector("[data-sb-people-empty-search]")?.textContent.trim() ?? null);
    ok(!!empty, `an empty search says so plainly (“${empty}”)`);
    await open(page, "", "ne");
    await page.evaluate(() => { if (!document.querySelector("[data-sb-people-panel]")) document.querySelector("[data-sb-people]")?.click(); });
    await sleep(400);
    const ne = await page.evaluate(() => document.querySelector("[data-sb-people-panel]")?.textContent ?? "");
    ok(/[ऀ-ॿ]/.test(ne), "the People surface speaks the catalog language (ne)");

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s3-people: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
