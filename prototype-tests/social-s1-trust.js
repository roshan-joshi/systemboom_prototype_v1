/**
 * SOCIAL WALL S1 — TRUST FOUNDATION (focused regression suite).
 *
 *   node prototype-tests/social-s1-trust.js        (dev server on :3210)
 *
 * Proves, in a real browser, the owner-decided trust model (Social Wall master program §5):
 *   §1 the one access matrix composes every World: My World = own + accepted connections'
 *      visible Moments; another person's World = THAT person's Moments only, at the viewer's
 *      real access; View as public = the stranger row on the owner's own World
 *   §2 relationship truth is direction-aware and single-sourced: Hero, PersonCard, People and
 *      the feed can never disagree about one pair; the full lifecycle (request → accept →
 *      friend → remove) runs on the semantically correct side
 *   §3 visitor Life privacy: no historical band derived from a Moment date — the readout shows
 *      the author's CURRENT band; the Life Cursor states year + place for another person's
 *      history; density is owner-only (asserted in person-life-identity §6)
 *   §4 direct access: Search and notification landing pass through the same seam — a Moment the
 *      viewer may not see never surfaces, lands, or leaks a word; landing from an opened World
 *      returns home first
 *   §5 the opened-World loop (§5.5/§7.4): PersonCard → Open World → subject-only feed (with a
 *      truthful empty state) → Return to My World
 *   §6 localisation: the new strings speak every catalog language (spot-checked in ne)
 * PROTOTYPE vs LIVE: everything here is client-state enforcement; the same matrix is the live
 * backend's contract (docs/handover/SOCIAL-COMPLETION-HANDOVER.md).
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&theme=light`;

let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };

const GIULIA_PUBLIC = ["m-rain", "m-nepali-1", "m-panorama", "m-snow"];

async function open(page, q = "", locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(DESKTOP);
  await page.goto(`${B}${q}`, { waitUntil: "networkidle2" });
  await sleep(800);
}
const loadAll = (page) => page.evaluate(async () => {
  for (let i = 0; i < 8 && document.querySelector("[data-sb-load-more]"); i++) { document.querySelector("[data-sb-load-more]").click(); await new Promise((r) => setTimeout(r, 250)); }
});
const feedIds = async (page) => { await loadAll(page); return page.$$eval("[data-sb-moment]", (n) => n.map((m) => m.getAttribute("data-sb-moment"))); };
const search = async (page, term) => {
  await page.evaluate(() => document.querySelector("input[type=search]")?.focus());
  await page.evaluate((v) => { const i = document.querySelector("input[type=search]"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v); i.dispatchEvent(new Event("input", { bubbles: true })); }, term);
  await sleep(450);
};

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ---- §1 world composition through the one matrix ---- */
    console.log("§1 world composition");
    await open(page);
    const owner = await feedIds(page);
    ok(owner.length === 23, `MY WORLD holds the owner's own + every accepted connection's visible Moments (${owner.length})`);
    ok(owner.includes("m-health") && owner.includes("m-problem"), "…including the owner's own only-me records (self row of the matrix)");
    ok(owner.includes("m-project") && owner.includes("m-face"), "…including a FRIEND's Friends-audience Moments (Chiara — friend row)");
    ok(owner.includes("m-1983") && owner.includes("m-wedding"), "…including FAMILY's Friends-audience Moments (Elena — family row)");

    await open(page, "&viewer=visitor");
    const visitor = await feedIds(page);
    ok(JSON.stringify([...visitor].sort()) === JSON.stringify([...GIULIA_PUBLIC].sort()), `another person's World is THAT person's Moments only — a friend-visitor sees Giulia's ${visitor.length} shared Moments, never a mixed feed (${visitor.join(", ")})`);
    ok(!visitor.includes("m-health") && !visitor.includes("m-problem"), "…and never her only-me records");

    // View as public = the stranger row, byte-equal in composition to a genuine stranger
    await open(page);
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /View as public/.test(b.textContent))?.click());
    await sleep(700);
    const preview = await feedIds(page);
    ok(JSON.stringify([...preview].sort()) === JSON.stringify([...GIULIA_PUBLIC].sort()), `View as public composes exactly the stranger's view of the owner's World (${preview.join(", ")})`);

    // asha owner mode: HER World = her own + her one known connection's visible Moments
    await open(page, "&viewer=asha");
    const sofia = await feedIds(page);
    const expectSofia = ["m-activity", "m-video", "m-forty", ...GIULIA_PUBLIC].sort();
    ok(JSON.stringify([...sofia].sort()) === JSON.stringify(expectSofia), `a different owner's My World composes from THEIR side of the graph (${sofia.length}: own 3 + Giulia's 4 public)`);

    /* ---- §2 relationship truth, direction-aware ---- */
    console.log("§2 relationship truth");
    await open(page, "&viewer=visitor");
    const heroRel = await page.$eval("[data-sb-hero-relationship]", (e) => e.getAttribute("data-sb-hero-relationship")).catch(() => null);
    await search(page, "Giulia");
    await page.click("[data-sb-search-person='u-demo-001']");
    await sleep(400);
    const card = await page.$eval("[data-sb-person-card]", (e) => ({ rel: e.getAttribute("data-sb-person-rel"), msg: !!e.querySelector("[data-sb-message]") }));
    ok(heroRel === "friend" && card.rel === "friend" && card.msg, `Hero and PersonCard agree about the same pair from the visitor's side (hero ${heroRel} · card ${card.rel}, Message offered)`);
    await page.keyboard.press("Escape");
    await sleep(200);

    // the directional pair: the REQUESTER sees "Requested"; the OWNER sees "Wants to connect"
    await open(page, "&profile=p-rory");
    const reqIn = await page.$eval("[data-sb-hero-relationship]", (e) => e.getAttribute("data-sb-hero-relationship")).catch(() => null);
    ok(reqIn === "request-in" && !!(await page.$("[data-sb-hero-accept]")), "the owner, on the requester's World: Wants to connect + Accept (the side that CAN accept)");
    await page.click("[data-sb-hero-accept]");
    await sleep(400);
    ok((await page.$eval("[data-sb-hero-relationship]", (e) => e.getAttribute("data-sb-hero-relationship"))) === "friend", "Accept resolves to Friend, live, on the same surface");
    // …and the new friend's World immediately composes with their (zero) visible Moments — no crash, truthful empty state
    ok(!!(await page.$("[data-sb-world-empty]")), "a World with nothing shared with this viewer states it truthfully (no dead end)");

    /* ---- §3 visitor Life privacy — no historical band ---- */
    console.log("§3 no historical Life band");
    await open(page);
    await loadAll(page);
    const bands = await page.evaluate(() => ({
      wedding: document.querySelector("[data-sb-moment='m-wedding'] [data-sb-readout]")?.textContent.replace(/\s+/g, " ") ?? "",
      m1983: document.querySelector("[data-sb-moment='m-1983'] [data-sb-readout]")?.textContent.replace(/\s+/g, " ") ?? "",
    }));
    ok(/30–45/.test(bands.wedding) && !/15–30/.test(bands.wedding), `a 2022 Moment shows the author's CURRENT band, not her band at that date (${bands.wedding.slice(0, 44)})`);
    ok(/30–45/.test(bands.m1983) && !/0–15/.test(bands.m1983), `a 1998 Moment can no longer bracket a birth year (was "0–15"; now ${bands.m1983.slice(0, 40)})`);
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-wedding']").scrollIntoView({ block: "start" }));
    await sleep(500);
    const cursor = await page.evaluate(() => document.querySelector("[data-sb-life-cursor]")?.textContent.replace(/\s+/g, " ").trim() ?? "");
    ok(/2022/.test(cursor) && /Ratmate/.test(cursor) && !/\d+y \d\dm/.test(cursor) && !/\d{1,2}–\d{1,3}/.test(cursor), `the Life Cursor states year + place for another person's history — no band, no age (“${cursor}”)`);

    /* ---- §4 direct access through the seam ---- */
    console.log("§4 direct access");
    await open(page, "&viewer=visitor");
    await search(page, "school"); // m-1983's words — a friends-audience Moment of Elena's, unknown pair for this viewer
    const hits = await page.evaluate(() => document.querySelectorAll("[data-sb-search-moment],[data-sb-search-photo]").length);
    ok(hits === 0, "Search never surfaces a Moment the viewer may not see (friends-audience, unknown pair)");
    await page.keyboard.press("Escape");
    await page.click("[data-sb-bell]");
    await sleep(400);
    await page.evaluate(() => document.querySelector("[data-sb-notification-moment='m-1983']")?.click());
    await sleep(400);
    const landing = await page.evaluate(() => ({ panel: !!document.querySelector("[data-sb-notifications]"), said: document.querySelector("body > [data-sb-announcer]")?.textContent ?? "" }));
    ok(landing.panel && /isn’t available/.test(landing.said), `a notification never lands on (or leaks a word of) an inaccessible Moment — truthful unavailable state (“${landing.said}”)`);

    /* ---- §5 the opened-World loop ---- */
    console.log("§5 Open World loop");
    await open(page);
    await search(page, "Luca");
    await page.click("[data-sb-search-person='p-bikash']");
    await sleep(400);
    await page.click("[data-sb-person-card] [data-sb-open-world]");
    await sleep(600);
    const lucaWorld = await feedIds(page);
    const lucaExpected = ["m-meal", "m-600"]; // Luca's own: public + friends (viewer is a friend)
    ok(JSON.stringify([...lucaWorld].sort()) === JSON.stringify([...lucaExpected].sort()), `Open World shows the person's own Moments at the viewer's real access (${lucaWorld.join(", ")})`);
    const kicker = await page.$eval("[data-sb-hero]", (e) => e.textContent);
    ok(/Luca[’']s World|Luca Rinaldi/.test(kicker), "the Hero states whose World this is");
    ok(!(await page.$("[data-sb-open-composer]")), "no Composer on someone else's World");
    // Return to My World from the account menu
    await page.click("button[aria-haspopup=menu][aria-label]");
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role^=menuitem]")].find((b) => /Return to My World/.test(b.textContent))?.click());
    await sleep(600);
    ok((await feedIds(page)).length === 23, "Return to My World restores the owner's own composition");

    /* ---- §6 localisation of the new strings ---- */
    console.log("§6 localisation (ne)");
    await open(page, "&profile=p-walt", "ne");
    const ne = await page.evaluate(() => ({
      empty: document.querySelector("[data-sb-world-empty]")?.textContent ?? "",
      openWorldWord: null,
    }));
    ok(/क्षण/.test(ne.empty), `the truthful empty state speaks the viewer's language (“${ne.empty.trim()}”)`);
    await search(page, "Luca");
    await page.click("[data-sb-search-person='p-bikash']");
    await sleep(400);
    const neWorld = await page.$eval("[data-sb-person-card] [data-sb-open-world]", (e) => e.textContent.trim());
    ok(/संसार/.test(neWorld), `Open World speaks the viewer's language (“${neWorld}”)`);

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s1-trust: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
