/** PHASE 4 FINAL — Social: every state, both modes, three widths. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-04-final";
const fs = require("fs");
const { launch, sleep } = require("./lib");
const EV = process.env.SB_EV;
const BASE = "http://localhost:3210/style-lab/social";
fs.mkdirSync(EV, { recursive: true });

let passed = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${msg}`);
  } else {
    failures.push(msg);
    console.log(`  ✗ ${msg}`);
  }
}
const VW = { "360": 420, "768": 900, desktop: 1440 };

async function go(page, params, { theme = "light", w = "desktop" } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5 });
  const qs = new URLSearchParams({ w, theme, ...params }).toString();
  await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
  await sleep(700);
}
async function loadAll(page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await sleep(500);
}
async function shot(page, name, full = false) {
  await page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });
}
async function noEscape(page) {
  return page.evaluate(() => {
    const frame = document.querySelector("[data-sb-social-frame]");
    const fr = frame.getBoundingClientRect();
    return [...frame.querySelectorAll("*")]
      .filter((e) => !(e instanceof SVGElement) || e.tagName === "svg")
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > fr.right + 1 || r.left < fr.left - 1); })
      .map((e) => `${e.tagName}.${String(e.className).slice(0, 50)}`)
      .slice(0, 4);
  });
}
const click = async (page, sel) => {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.click(sel);
  await sleep(250);
};
const clickText = async (page, text, within = "body") => {
  const done = await page.evaluate((t, w) => {
    const root = document.querySelector(w) || document.body;
    const b = [...root.querySelectorAll("button,a,[role=option],[role=menuitem],[role=menuitemradio]")].find((x) => (x.textContent || "").replace(/\s+/g, " ").trim().includes(t));
    if (!b) return false;
    b.click();
    return true;
  }, text, within);
  if (!done) throw new Error(`no control with text: ${text}`);
  await sleep(300);
};
async function setValue(page, sel, v) {
  await page.evaluate((s, val) => {
    const el = document.querySelector(s);
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, sel, v);
  await sleep(120);
}
/* UC-C3 (§6/§72) — "Add details" / the record pill opens the focused Record chooser sheet;
   a choice closes it again (one pill, never seven persistent categories). */
async function openChooser(page) {
  await page.evaluate(() => { const b = document.querySelector("[data-sb-composer] [data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); });
  await sleep(300);
}
async function chooseKind(page, label) {
  await openChooser(page);
  await click(page, `[data-sb-kind-row] button[aria-label='${label}']`);
}
async function justPost(page) {
  await openChooser(page);
  await click(page, "[data-sb-record-social-only]");
}
/* UC-C3 (§10/§12) — media arrives through its SOURCES: Media → My Media (the account's own
   assets, multi-select), then "Add n". */
async function myMedia(page, alts) {
  await click(page, "[data-sb-composer] button[aria-label='Media']");
  await click(page, "[data-sb-media-source='mymedia']");
  await page.evaluate((names) => { const g = document.querySelector("[data-sb-mymedia-grid]"); for (const n of names) [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, alts);
  await sleep(200);
}

/* ---------- contrast ---------- */
function lum(rgb) {
  const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function parse(c) { const m = c.match(/[\d.]+/g).map(Number); return m.length >= 3 ? m.slice(0, 3) : null; }
function blend(fg, a, bg) { return fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a))); }

async function contrastTable(page, theme) {
  return page.evaluate((theme) => {
    const bgOf = (el) => {
      let e = el;
      while (e) {
        const c = getComputedStyle(e).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
        e = e.parentElement;
      }
      return "rgb(255,255,255)";
    };
    const pick = (label, sel, sizeHint) => {
      const el = document.querySelector(sel);
      if (!el) return { label, missing: true };
      const cs = getComputedStyle(el);
      return { label, fg: cs.color, bg: bgOf(el), size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400, hint: sizeHint };
    };
    return [
      pick("Moment body text on sheet", "[data-sb-moment] p.max-w-\\[66ch\\]"),
      pick("Readout name (500) on sheet", "[data-sb-readout] span.font-medium"),
      pick("Readout place / secondary on sheet", "[data-sb-readout] span.truncate"),
      pick("Kind label (11px caps) on sheet", "[data-sb-kind='meal'] p span.uppercase"),
      pick("Date rule label on sheet", "[data-sb-moment] h3"),
      pick("Foot facts (responses) on sheet", "[data-sb-moment] .tabular-nums button.text-muted"),
      pick("Counter years (red) on card", "aside [data-sb-counter] span[style*='--boom']"),
      pick("Counter months (navy) on card", "aside [data-sb-counter] span[style*='--navy']"),
      pick("Counter days (grey) on card", "aside [data-sb-counter] span[style*='--unit-grey']"),
      pick("Counter unit control on card", "aside [data-sb-counter] .tracking-\\[0\\.02em\\]"),
      pick("Circle module band readout", "[data-sb-band-readout]"),
      pick("Hero name", "[data-sb-hero] h1 span"),
      pick("Hero Born value", "[data-sb-hero] dd"),
      pick("Contact label (only you see this)", "[data-sb-contact] span.uppercase"),
      pick("Brand context (My World)", "[data-sb-context]"),
      pick("Search placeholder", "input[type=search]"),
      pick("Search placeholder", "input[type=search]"),
      pick("Composer entry bar", "[data-sb-open-composer] span"),
      pick("Load more", "[data-sb-load-more]"),
      pick("End of feed", "[data-sb-end]"),
    ].map((r) => ({ ...r, theme }));
  }, theme);
}

(async () => {
  const { browser, page, errors } = await launch();
  const rejections = [];
  await page.evaluateOnNewDocument(() => {
    window.__SB_REJ = 0;
    window.addEventListener("unhandledrejection", () => { window.__SB_REJ += 1; });
  });
  const contrast = [];

  /* ---- 1. feed: both modes × three widths, no escape, captures ---- */
  console.log("1. feed renders");
  for (const theme of ["light", "dark"]) {
    for (const w of ["360", "768", "desktop"]) {
      await go(page, {}, { theme, w });
      await loadAll(page);
      const bad = await noEscape(page);
      ok(bad.length === 0, `${theme} ${w}: nothing escapes the frame${bad.length ? " — " + bad.join(" | ") : ""}`);
      await shot(page, `feed-${theme}-${w}`, true);
      if (w === "desktop") {
        const rows = await contrastTable(page, theme);
        contrast.push(...rows);
      }
    }
  }

  /* ---- 2. C1 privacy: visitor payload/DOM, Asha visiting, reverse coverage; hero variants ---- */
  console.log("2. privacy (C1) + hero views + identity switch");
  const FORBIDDEN = ["04 NOV 1991", "06:42", "12,729", "1991-11-04", "12729"];
  const domHas = (page) => page.evaluate((needles) => { const html = document.documentElement.outerHTML; return needles.filter((n) => html.includes(n)); }, FORBIDDEN);
  for (const viewer of ["visitor", "ashaVisitor"]) {
    for (const [theme, w] of [["light", "desktop"], ["dark", "desktop"], ["light", "360"], ["dark", "360"]]) {
      await go(page, { viewer }, { theme, w });
      await loadAll(page);
      const leaked = await domHas(page);
      ok(leaked.length === 0, `${viewer} ${theme} ${w}: Giulia's birth-derived strings absent from the entire DOM${leaked.length ? " — FOUND " + leaked.join(", ") : ""}`);
      ok(!(await page.$("[data-sb-contact]")), `${viewer} ${theme} ${w}: no contact pill`);
      ok(!(await page.$("[data-sb-hero] dt")), `${viewer} ${theme} ${w}: no Born row (no definition list in the hero)`);
      const heroRings = await page.$$eval("[data-sb-hero] [data-sb-ring]", (n) => n.map((x) => x.getAttribute("data-sb-ring")));
      ok(heroRings.length > 0 && heroRings.every((r) => r === "other"), `${viewer} ${theme} ${w}: hero ring is band-level (no tick): ${heroRings.join(",")}`);
      ok(!(await page.$("[data-sb-hero] [data-sb-tick-angle]")), `${viewer} ${theme} ${w}: no red now-tick on Giulia's ring`);
      const circle = await page.$eval("[data-sb-circle]", (e) => ({ kind: e.getAttribute("data-sb-circle"), text: e.textContent, tick: !!e.querySelector("[data-sb-tick-angle]") }));
      ok(circle.kind === "visitor" && !circle.tick && /band\s*30–45|30–45\s*band/.test(circle.text.replace(/\s+/g, " ")) && !/\d{1,3},\d{3}\s*days/i.test(circle.text), `${viewer} ${theme} ${w}: Circle module reads the band, no day count, no tick`);
      const exactOnGiulia = await page.evaluate(() => [...document.querySelectorAll("[data-sb-readout]")].some((p) => p.textContent.includes("Giulia Bianchi") && /\d+y \d+m \d+d/.test(p.textContent)));
      ok(!exactOnGiulia, `${viewer} ${theme} ${w}: no exact age on any of Giulia's moments`);
      if (viewer === "visitor" && (w === "desktop" || w === "360")) await shot(page, `corrections/visitor-hero-${theme}-${w}`);
      if (viewer === "visitor" && theme === "light" && w === "desktop") { await page.$eval("[data-sb-circle]", (e) => e.scrollIntoView({ block: "center" })); await sleep(300); await shot(page, "corrections/visitor-circle-module"); }
    }
  }
  // the presentation objects themselves: nothing birth-derived exists on a non-owner view model
  const vm = await page.evaluate(() => window.__SB_VM_OTHER_KEYS || null);
  if (vm) ok(["birth", "birthDate", "birthTime", "precision", "exact", "years", "months", "days", "totalDays", "fraction", "bandYears"].every((k) => !vm.includes(k)), `non-owner LifeView carries only ${vm.join(", ")}`);
  // reverse coverage: Maya viewing Bikash's moments → band only
  await go(page, {}, { theme: "light", w: "desktop" });
  const luca = await page.evaluate(() => [...document.querySelectorAll("[data-sb-readout]")].filter((p) => p.textContent.includes("Luca Rinaldi")).map((p) => p.textContent.replace(/\s+/g, " ")));
  ok(luca.length > 0 && luca.every((t) => t.includes("30–45") && !/\d+y \d+m \d+d/.test(t)), `Giulia sees Luca's moments with band only (${luca[0]?.slice(0, 60)})`);
  const giuliaOwn = await page.evaluate(() => [...document.querySelectorAll("[data-sb-readout]")].filter((p) => p.textContent.includes("Giulia Bianchi")).every((p) => /\d+y \d+m \d+d/.test(p.textContent)));
  ok(giuliaOwn, "Giulia sees her own moments with the exact age");
  for (const theme of ["light", "dark"]) {
    await go(page, { viewer: "asha" }, { theme, w: "desktop" });
    const units = await page.$eval("aside [data-sb-counter][data-sb-counter-units]", (e) => e.getAttribute("data-sb-counter-units"));
    ok(units === "years,months,weeks,days", `${theme}: unknown birth time → counter stops at days (${units})`);
    const bornLine = await page.$eval("[data-sb-hero] dd", (e) => e.textContent);
    ok(bornLine.includes("birth time unknown"), `${theme}: owner hero states birth time unknown`);
    await shot(page, `hero-asha-${theme}`);
  }
  await go(page, {}, { theme: "light", w: "desktop" });
  const mayaUnits = await page.$eval("aside [data-sb-counter][data-sb-counter-units]", (e) => e.getAttribute("data-sb-counter-units"));
  ok(mayaUnits === "years,months,weeks,days,hours,minutes,seconds", `known birth time → seven stops, ending at seconds (${mayaUnits})`);

  /* ---- 3. counter cycles + ticks ---- */
  console.log("3. counter");
  const face0 = await page.$eval("aside [data-sb-counter]", (e) => e.getAttribute("data-sb-counter-face"));
  const secsA = await page.evaluate(() => document.querySelector("aside [data-sb-counter] > button")?.textContent);
  await sleep(1300);
  const secsB = await page.evaluate(() => document.querySelector("aside [data-sb-counter] > button")?.textContent);
  ok(face0 === "composite" && secsA !== secsB, `composite face ticks (${secsA} → ${secsB})`);
  const unitBtn = "aside [data-sb-counter] button[aria-label^='Unit']";
  const seen = [];
  for (let i = 0; i < 8; i++) {
    await click(page, unitBtn);
    seen.push(await page.$eval("aside [data-sb-counter]", (e) => e.getAttribute("data-sb-counter-face")));
    if (i === 3) await shot(page, "counter-days");
    if (i === 6) await shot(page, "counter-seconds");
  }
  ok(seen.join(",") === "years,months,weeks,days,hours,minutes,seconds,composite", `unit control cycles all stops and returns (${seen.join(" → ")})`);
  await page.focus(unitBtn);
  await page.keyboard.press("ArrowLeft");
  await sleep(200);
  ok((await page.$eval("aside [data-sb-counter]", (e) => e.getAttribute("data-sb-counter-face"))) === "seconds", "ArrowLeft cycles backwards (composite → seconds)");
  await page.keyboard.press("ArrowRight");

  /* ---- 4. ring tick angle for two identities ---- */
  console.log("4. ring geometry");
  for (const viewer of ["maya", "asha"]) {
    await go(page, { viewer }, { theme: "light", w: "desktop" });
    const { angle, birth } = await page.evaluate(() => ({
      angle: parseFloat(document.querySelector("[data-sb-hero] [data-sb-tick-angle]")?.getAttribute("data-sb-tick-angle")),
      birth: document.querySelector("[data-sb-hero] dd")?.textContent,
    }));
    const dob = viewer === "maya" ? new Date(1991, 10, 4, 6, 42) : new Date(1994, 2, 12);
    const days = Math.floor((Date.now() - dob.getTime()) / 86400000);
    const expected = (days / (150 * 365.25)) * 360;
    ok(Math.abs(angle - expected) < 0.05, `${viewer}: tick at ${angle.toFixed(2)}° (expected ${expected.toFixed(2)}° from ${days} days; ${birth?.trim().slice(0, 24)})`);
  }
  // ten bands in the module ring; hover reveals calendar years
  const bandCount = await page.$$eval("[data-sb-band-readout]", () => document.querySelectorAll("svg[role=list] g[role=listitem]").length);
  ok(bandCount === 10, `module ring has ten bands (${bandCount})`);
  await page.hover("svg[role=list] g[role=listitem]:nth-of-type(2)");
  await sleep(200);
  const bandText = await page.$eval("[data-sb-band-readout]", (e) => e.textContent);
  ok(/15–30 · \d{4}–\d{4}/.test(bandText), `hovering a band shows its years (${bandText.trim()})`);
  await shot(page, "ring-hover-band");

  /* ---- 5. respond, who list, notes, replies, edit/delete note ---- */
  console.log("5. respond + notes");
  await go(page, {}, { theme: "light", w: "desktop" });
  const first = "[data-sb-moment='m-sameage']";
  // R3 owner-superseded (recorded in AGENTS.md): the anonymous Respond TAP is retired — feeling
  // now has a home in the Expression language, and RESPOND is the verb that writes. The
  // invariant is unchanged in spirit: Respond is a real action that reaches a real conversation.
  await click(page, `${first} [data-sb-respond]`);
  await sleep(350);
  const wrote = await page.$eval(first, (m) => ({ composer: !!m.querySelector("[data-sb-response-composer] textarea"), focused: !!document.activeElement?.closest("[data-sb-response-composer]") }));
  ok(wrote.composer && wrote.focused, "Respond opens this Moment's conversation with the cursor in the composer");
  ok(await page.$eval(first, (m) => /response/i.test(m.querySelector("[data-sb-responses]")?.textContent ?? "")), "the presence line states the conversation truthfully");
  await shot(page, "respond-who-list");
  await page.keyboard.press("Escape");
  await sleep(200);
  // notes on the forty-thread
  const forty = "[data-sb-moment='m-forty']";
  for (let i = 0; i < 4 && !(await page.$(forty)); i++) { await page.evaluate(() => document.querySelector("[data-sb-load-more]")?.click()); await sleep(300); }
  await page.$eval(forty, (e) => e.scrollIntoView({ block: "center" }));
  await clickText(page, "responses", forty);
  await sleep(300);
  const shownTop = await page.$$eval(`${forty} [data-sb-note][data-sb-depth='1']`, (n) => n.length);
  ok(shownTop === 3, `thread collapsed to three top-level notes (${shownTop})`);
  await clickText(page, "more responses", forty);
  const allTop = await page.$$eval(`${forty} [data-sb-note][data-sb-depth='1']`, (n) => n.length);
  const replies = await page.$$eval(`${forty} [data-sb-note][data-sb-depth='2']`, (n) => n.length);
  ok(allTop >= 27 && replies >= 12 && allTop + replies === 40, `forty-note thread expands: ${allTop} notes + ${replies} nested replies`);
  await shot(page, "notes-forty-expanded", true);
  // write a note, reply, edit, delete
  await setValue(page, `${forty} textarea[aria-label='Write a response…']`, "Counting it as forty-one.");
  await page.focus(`${forty} textarea[aria-label='Write a response…']`);
  await page.keyboard.press("Enter");
  await sleep(600);
  const mine = await page.$$eval(`${forty} [data-sb-note]`, (n) => n.filter((x) => x.textContent.includes("Counting it as forty-one.")).length);
  ok(mine === 1, "Enter sends a note and it appears");
  await clickText(page, "Reply", forty);
  await setValue(page, `${forty} textarea[aria-label^='Reply to']`, "Nested reply.");
  await page.focus(`${forty} textarea[aria-label^='Reply to']`);
  await page.keyboard.press("Enter");
  await sleep(600);
  ok((await page.$$eval(`${forty} [data-sb-note][data-sb-depth='2']`, (n) => n.filter((x) => x.textContent.includes("Nested reply.")).length)) === 1, "reply nests under its parent (depth 2)");
  // edit own note
  await page.evaluate(() => {
    const note = [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].find((x) => x.textContent.includes("Counting it as forty-one."));
    note.querySelector("button[aria-label=More]").click();
  });
  await sleep(200);
  await clickText(page, "Edit", forty);
  // Phase 4.4-A owner-superseded (recorded in AGENTS.md): the edit field is a TEXTAREA so a
  // response keeps its line breaks (A16). Enter still saves; the invariant is unchanged.
  await setValue(page, `${forty} textarea[aria-label='Edit response']`, "Counting it as forty-two.");
  await page.focus(`${forty} textarea[aria-label='Edit response']`);
  await page.keyboard.press("Enter");
  await sleep(300);
  ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].some((x) => x.textContent.includes("forty-two") && x.textContent.includes("edited"))), "own note edits and shows 'edited'");
  await page.evaluate(() => {
    const note = [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].find((x) => x.textContent.includes("forty-two"));
    note.querySelector("button[aria-label=More]").click();
  });
  await sleep(200);
  await clickText(page, "Delete", forty);
  ok(!(await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-forty'] [data-sb-note]")].some((x) => x.textContent.includes("forty-two")))), "own note deletes");
  // failed send
  await page.evaluate(() => document.querySelector("input[type=checkbox]")?.click());
  await sleep(100);
  await setValue(page, `${forty} textarea[aria-label='Write a response…']`, "This will fail.");
  await page.focus(`${forty} textarea[aria-label='Write a response…']`);
  await page.keyboard.press("Enter");
  await sleep(700);
  ok(await page.evaluate(() => document.body.innerText.includes("Couldn't send. Kept here.")), "failed note send keeps the text and offers Retry");
  await shot(page, "note-failed");
  await page.evaluate(() => document.querySelector("input[type=checkbox]")?.click());

  /* ---- 6. ⋯ menus: own + others ---- */
  console.log("6. menus");
  await go(page, {}, { theme: "light", w: "desktop" });
  const own = "[data-sb-moment='m-rain']";
  await click(page, `${own} button[aria-label=More]`);
  const ownItems = await page.$$eval(`${own} [role=menu] [role^=menuitem]`, (n) => n.map((x) => x.textContent.trim()));
  ok(ownItems.join("|").includes("Edit") && ownItems.join("|").includes("Delete") && ownItems.join("|").includes("Change privacy") && ownItems.join("|").includes("View in Life"), `own menu: ${ownItems.join(" · ")}`);
  await clickText(page, "Change privacy", own);
  await clickText(page, "Only me", own);
  const priv = await page.$eval(own, (e) => e.getAttribute("data-sb-privacy"));
  ok(priv === "onlyme" && (await page.$eval(own, (e) => e.textContent.includes("only you"))), "privacy change updates the indicator (only you)");
  await shot(page, "menu-own-privacy");
  await click(page, `${own} button[aria-label=More]`);
  await clickText(page, "Delete", own);
  ok(await page.evaluate(() => document.body.innerText.includes("Delete this moment?")), "delete asks a quiet inline confirm");
  await shot(page, "menu-delete-confirm");
  await clickText(page, "Delete", `${own} [role=menu]`);
  await sleep(300);
  ok(!(await page.$(own)), "confirmed delete removes the moment");
  const other = "[data-sb-moment='m-meal']";
  await click(page, `${other} button[aria-label=More]`);
  const otherItems = await page.$$eval(`${other} [role=menu] [role^=menuitem]`, (n) => n.map((x) => x.textContent.trim()));
  // S5 (Social Wall completion): a private Save (bookmark) leads every Moment menu, and
  // Share… appears exactly when the platform itself has navigator.share (no dead item, no
  // repost engine). Recorded supersession — the invariant (the same accepted items in the
  // same order) is unchanged and asserted capability-aware.
  const hasNativeShare = await page.evaluate(() => "share" in navigator);
  const expectedOthers = hasNativeShare ? "Save|Report|Hide|Share…|Copy link|View in Life — later" : "Save|Report|Hide|Copy link|View in Life — later";
  ok(otherItems.join("|") === expectedOthers, `others' menu: ${otherItems.join(" · ")}`);
  await clickText(page, "Hide", other);
  ok(!(await page.$(other)), "Hide removes the moment from the feed");

  /* ---- 7. load more → end ---- */
  console.log("7. load more");
  let clicks = 0;
  while ((await page.$("[data-sb-load-more]")) && clicks < 5) { await click(page, "[data-sb-load-more]"); clicks += 1; }
  ok(!!(await page.$("[data-sb-end]")), `load more appends and reaches the end after ${clicks} clicks`);
  const countAll = await page.$$eval("[data-sb-moment]", (n) => n.length);
  ok(countAll >= 20, `feed holds ${countAll} moments on the rule`);
  await loadAll(page);
  await shot(page, "feed-end-light-desktop", true);

  /* ---- 8. notifications ---- */
  console.log("8. notifications");
  for (const mode of ["seed", "many", "empty"]) {
    await go(page, { bell: "1", notifications: mode }, { theme: "light", w: "desktop" });
    ok(!!(await page.$("[data-sb-notifications]")), `notifications panel opens (${mode})`);
    await shot(page, `notifications-${mode}`);
  }
  await go(page, { bell: "1" }, { theme: "dark", w: "360" });
  await shot(page, "notifications-dark-360");
  await go(page, { bell: "1" }, { theme: "light", w: "desktop" });
  ok(!!(await page.$("[data-sb-unread-dot]")), "unread dot shown with unread notifications");
  await clickText(page, "Mark all read", "[data-sb-notifications]");
  ok(!(await page.$("[data-sb-unread-dot]")), "Mark all read clears the unread dot");

  /* ---- 9. search + avatar menu ---- */
  console.log("9. search + avatar menu");
  await go(page, {}, { theme: "light", w: "desktop" });
  await page.focus("input[type=search]");
  await sleep(200);
  ok(await page.evaluate(() => !!document.querySelector("[role=region][aria-label='Search results']") && document.body.innerText.toUpperCase().includes("RECENT")), "focused empty search shows recent searches");
  await shot(page, "search-recent");
  await page.keyboard.type("Boudha");
  await sleep(300);
  const groups = await page.evaluate(() => [...document.querySelectorAll("[role=region][aria-label='Search results'] p.uppercase")].map((p) => p.textContent.trim()));
  ok(groups.includes("Photos") && groups.includes("Places"), `results grouped (${groups.join(", ")})`);
  await shot(page, "search-results");
  await setValue(page, "input[type=search]", "zzqx");
  await sleep(200);
  ok(await page.evaluate(() => document.body.innerText.includes("Nothing for")), "empty result sentence");
  await shot(page, "search-empty");
  await page.keyboard.press("Escape");
  await click(page, "button[aria-haspopup=menu]");
  const menuItems = await page.$$eval("[role=menu][aria-label=Account] [role=menuitem]", (n) => n.map((x) => x.textContent.replace(/later/, "").trim()));
  // Complete-My-World pass: the menu gains Appearance (the phone home of the
  // theme) and Logout is real. The "later" items are unchanged.
  // S5 recorded supersession: the account menu gains the real Saved surface, first —
  // the "later" placeholders, Appearance, Language and Logout are unchanged.
  ok(menuItems.map((t) => t.replace(/(Appearance).*/, "$1")).join("|") === "Saved|Statistics|Weather|Exchange|Settings|Appearance|Logout", `avatar menu: ${menuItems.join(" · ")}`);
  await shot(page, "avatar-menu");
  await page.keyboard.press("Escape");

  /* ---- 10. composer: every state ---- */
  console.log("10. composer");
  for (const [theme, w] of [["light", "desktop"], ["dark", "360"]]) {
    await go(page, {}, { theme, w });
    await click(page, "[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await sleep(400);
    const focused = await page.evaluate(() => document.activeElement?.id === "sb-composer-text");
    ok(focused, `${theme} ${w}: composer opens with focus in the text`);
    // GREENFIELD (§44): never a mystery-disabled POST — it carries aria-disabled and, when
    // pressed empty, states the reason and publishes nothing.
    const emptyPost = await page.evaluate(async () => {
      const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => x.textContent.trim() === "Post");
      const n0 = document.querySelectorAll("[data-sb-moment]").length;
      b.click();
      await new Promise((r) => setTimeout(r, 1200));
      return { ariaOff: b.getAttribute("aria-disabled") === "true", said: !!document.querySelector("[data-sb-composer-issue]"), posted: document.querySelectorAll("[data-sb-moment]").length !== n0 };
    });
    ok(emptyPost.ariaOff && emptyPost.said && !emptyPost.posted, `${theme} ${w}: an empty POST states its reason and publishes nothing`);
    // The shell is viewport-fixed: a phone sheet fills the viewport height at the frame's width; a modal is ≤560 wide.
    const shell = await page.evaluate(() => { const c = document.querySelector("[data-sb-composer]").getBoundingClientRect(); const f = document.querySelector("[data-sb-social-frame]").getBoundingClientRect(); return { w: Math.round(c.width), fw: Math.round(f.width), top: Math.round(c.top), h: Math.round(c.height), vh: window.innerHeight }; });
    ok(w === "360" ? shell.w === shell.fw && shell.top === 0 && shell.h === shell.vh : shell.w <= 560 && shell.w >= 400, `${theme} ${w}: shell is ${w === "360" ? "a viewport-height sheet" : "a centred modal"} (${shell.w}px of ${shell.fw}px, top ${shell.top}, ${shell.h}/${shell.vh}px)`);
    await shot(page, `composer-empty-${theme}-${w}`);
    // kinds — UC-C3 (§6/§72): Add details opens the focused Record chooser (Just post apart
    // from the seven records); every choice collapses it to one pill, and each adapter shows
    // only its approved Quick fields. Superseded shapes (recorded in AGENTS.md "UC-C3"):
    // Activity leads with its common four (the full list is a focused picker, §39) and Health
    // with a Choose control (the 17 types are a focused picker, §47).
    await click(page, "[data-sb-composer] [data-sb-record-details]");
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-record-social-only]") && document.querySelectorAll("[data-sb-kind-row] [role=radio]").length === 7), `${theme} ${w}: Just post apart; exactly seven records`);
    await click(page, "[data-sb-sheet-panel='record'] [data-sb-sheet-back]");
    const QUICK = {
      meal: () => document.querySelectorAll("[data-sb-chipselect='occasion'] button").length === 6 && !!document.querySelector("[data-sb-ufield='items']"),
      activity: () => document.querySelectorAll("[data-sb-activity-common] button").length === 5 && !document.querySelector("[data-sb-chipselect='activityType']"),
      problem: () => !document.querySelector("[data-sb-domain-quick]") && document.getElementById("sb-composer-text").placeholder === "What's the problem?",
      health: () => !!document.querySelector("[data-sb-ufield='bodyArea']") && !!document.querySelector("[data-sb-health-choose]") && document.querySelectorAll("[data-sb-chipselect='healthType'] button").length === 0 && !!document.querySelector("[data-sb-health-sharing]"),
      project: () => !!document.querySelector("[data-sb-ufield='projectTitle']") && !!document.querySelector("[data-sb-ufield='goal']"),
      meeting: () => !!document.querySelector("[data-sb-ufield='subject']") && !!document.querySelector("[data-sb-domain-quick='meeting'] [data-sb-when]"),
    };
    for (const k of ["meal", "activity", "problem", "health", "project", "meeting"]) {
      await chooseKind(page, k === "meal" ? "Meal" : k === "activity" ? "Activity" : k === "problem" ? "Problem" : k === "health" ? "Health" : k === "project" ? "Project" : "Meeting");
      await sleep(250);
      const okQuick = await page.evaluate((kk, fnSrc) => new Function(`return (${fnSrc})()`)(), k, QUICK[k].toString());
      ok(okQuick, `${theme} ${w}: ${k} reveals its approved quick fields`);
      const aud = await page.$eval("[data-sb-audience]", (b) => b.textContent.trim());
      ok(aud === "Public", `${theme} ${w}: ${k} never rewrites the one audience (§7/§28) (${aud})`);
      if (theme === "light") await shot(page, `composer-kind-${k}`);
    }
    await justPost(page);
    // photos + detection — through My Media (UC-C3 §10/§12)
    await myMedia(page, ["Nyatapola temple, Bhaktapur"]);
    await click(page, "[data-sb-mymedia-add]");
    await sleep(300);
    // GREENFIELD (§23/§24): the photo's own date/place wait for the person's review — with the
    // date and place stated plainly, and NEVER a Life age anywhere in creation (§22).
    const review = await page.$eval("[data-sb-metadata-review]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(review.includes("03 AUG 2026") && review.includes("Bhaktapur"), `${theme} ${w}: the review states the photo's own date and place ("${review.slice(0, 70)}")`);
    ok(await page.evaluate(() => !/\d+y \d+m \d+d/.test(document.querySelector("[data-sb-composer]").textContent)), `${theme} ${w}: no Life age appears in the composer (§22)`);
    if (theme === "light") await shot(page, "composer-detected");
    await myMedia(page, ["A rain-wet hiti courtyard in Kathmandu", "Annapurna range panorama from Mustang"]);
    await click(page, "[data-sb-mymedia-add]");
    const thumbs = await page.$$eval("[data-sb-media-collage] [data-sb-thumb]", (n) => n.map((x) => x.getAttribute("data-sb-thumb")));
    ok(thumbs.join(",") === "nyatapola,rain,panorama", `three thumbs in order (${thumbs.join(",")})`);
    // reorder + remove live in the Media organizer over the same draft (UC-C3 §16)
    await click(page, "[data-sb-media-edit]");
    await click(page, "[data-sb-composer] button[aria-label='Move photo 3 earlier']");
    const thumbs2 = await page.$$eval("[data-sb-organizer-list] [data-sb-thumb]", (n) => n.map((x) => x.getAttribute("data-sb-thumb")));
    ok(thumbs2.join(",") === "nyatapola,panorama,rain", `reorder works (${thumbs2.join(",")})`);
    await click(page, "[data-sb-composer] button[aria-label='Remove photo 3']");
    ok((await page.$$eval("[data-sb-organizer-list] [data-sb-thumb]", (n) => n.length)) === 2, "remove works");
    if (theme === "light") await shot(page, "composer-thumbs");
    // limit — the ONE configurable media limit, stated where the choosing happens
    await click(page, "[data-sb-organizer-add]");
    await click(page, "[data-sb-media-source='mymedia']");
    for (let i = 1; i <= 10; i++) await page.evaluate((i) => [...document.querySelectorAll("[data-sb-mymedia-grid] button")].find((b) => b.getAttribute("aria-label") === `Bisket Jatra, Bhaktapur — frame ${i}`)?.click(), i);
    await sleep(200);
    ok(await page.evaluate(() => document.body.innerText.includes("10 of 10 — remove one to add another")), "the media limit states what happens");
    if (theme === "light") await shot(page, "composer-limit");
    await click(page, "[data-sb-mymedia-add]");
    await sleep(300);
    await clickText(page, "Use", "[data-sb-metadata-review]");
    await setValue(page, "#sb-composer-text", "Ten that survived, plus the temple.");
    // posting → posted lands on the rule
    await clickText(page, "Post", "[data-sb-composer] footer");
    const phase = await page.$eval("[data-sb-composer]", (e) => e.getAttribute("data-sb-composer-phase"));
    ok(phase === "posting", `${theme} ${w}: Post shows progress on the button (${phase})`);
    await sleep(1400);
    const landed = await page.evaluate(() => { const m = document.querySelector("[data-sb-moment^='m-new-']"); return m ? { date: m.querySelector("h3")?.textContent, shared: m.textContent.includes("shared today"), photos: m.querySelectorAll("img").length, focus: document.activeElement?.hasAttribute("data-sb-readout") } : null; });
    ok(!!landed && landed.date?.includes("03 AUG 2026") && landed.shared && landed.photos >= 4, `${theme} ${w}: posted moment lands on the rule at its own date with "shared today" (${JSON.stringify(landed)})`);
    ok(!!landed?.focus, `${theme} ${w}: focus lands on the new readout`);
    if (theme === "light") await shot(page, "composer-posted-landed");
  }
  // validation + video + link + feeling + privacy + failure + discard + edit (light desktop)
  await go(page, {}, { theme: "light", w: "desktop" });
  await click(page, "[data-sb-open-composer]");
  await page.waitForSelector("[data-sb-composer]");
  await setValue(page, "#sb-composer-text", "x".repeat(2010));
  ok(await page.evaluate(() => document.body.innerText.includes("2,010 / 2,000")) && (await page.$eval("[data-sb-composer] footer button:last-of-type", (b) => b.getAttribute("aria-disabled") === "true" || [...document.querySelectorAll("[data-sb-composer] footer button")].some((x) => x.getAttribute("aria-disabled") === "true"))), "over-limit counter turns danger and blocks Post");
  await shot(page, "composer-overlimit");
  // GREENFIELD (§21) + UC-C3 (§42): the event's own time lives behind the When control —
  // "Today · Change" — and the future/past truths hold there.
  await setValue(page, "#sb-composer-text", "Future test");
  await chooseKind(page, "Life Moment");
  await page.evaluate(() => document.querySelector("[data-sb-more-toggle]").click());
  await sleep(250);
  await click(page, "[data-sb-when-change]");
  await setValue(page, "[data-sb-composer] [data-sb-when] input[type=date]", "2031-01-01");
  ok(await page.evaluate(() => document.body.innerText.includes("hasn't happened yet")), "future date is refused inline");
  await shot(page, "composer-future");
  await setValue(page, "[data-sb-composer] [data-sb-when] input[type=date]", "2019-05-04");
  ok(await page.evaluate(() => document.body.innerText.includes("Placed in your past")), "backdating shows the past-placement notice");
  await shot(page, "composer-backdated");
  // §20/§44 — a Meal with nothing meaningful refuses with a plain sentence, never a dead button
  await setValue(page, "#sb-composer-text", "");
  await chooseKind(page, "Meal");
  await clickText(page, "Post", "[data-sb-composer] footer").catch(() => {});
  await sleep(1200);
  ok(await page.evaluate(() => document.body.innerText.includes("Say something or add a photo first.") && !document.querySelector("[data-sb-moment^='m-new-']")), "an empty Meal states what it needs and publishes nothing");
  await justPost(page);
  // a video from My Media — one video alone keeps the accepted caption-in-place (UC-C3 §9)
  await myMedia(page, ["Evening kora around Boudhanath, video"]);
  await click(page, "[data-sb-mymedia-add]");
  await sleep(200);
  ok(await page.evaluate(() => !!document.querySelector("[data-sb-composer] input[aria-label='Caption']")), "an attached video offers its caption in place");
  await shot(page, "composer-video");
  // remove it from THIS post (never from My Media) so a link can take its place
  await click(page, "[data-sb-media-edit]");
  await click(page, "[data-sb-organizer-list] button[aria-label='Remove video 1']");
  await click(page, "[data-sb-sheet-panel='organizer'] [data-sb-sheet-back]");
  // a link is its own reference row in Add media, not a media source (UC-C3 §10)
  await click(page, "[data-sb-composer] button[aria-label='Media']");
  await click(page, "[data-sb-media-source='link']");
  await setValue(page, "[data-sb-composer] input[placeholder='Paste a link']", "https://example.org/watch?v=kora");
  await sleep(200);
  ok(!!(await page.$(".sb-resolving")), "link paste shows resolving progress");
  await sleep(800);
  ok(await page.evaluate(() => !!document.querySelector("[data-sb-composer] input[aria-label='Link title']")), "link resolves to an editable preview card");
  await shot(page, "composer-link");
  await setValue(page, "[data-sb-composer] input[placeholder='Paste a link']", "");
  await sleep(200);
  await click(page, "[data-sb-sheet-panel='media'] [data-sb-sheet-back]");
  // feeling lives in the Life Moment's More details, added deliberately (UC-C3 §43)
  await chooseKind(page, "Life Moment");
  await page.evaluate(() => { if (!document.querySelector("[data-sb-more]")) document.querySelector("[data-sb-more-toggle]").click(); });
  await sleep(250);
  await click(page, "[data-sb-add-field='feeling']");
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-chipselect='feeling'] button")].find((b) => b.textContent.trim() === "nostalgic")?.click());
  await sleep(200);
  ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-chipselect='feeling'] button")].find((b) => b.textContent.trim() === "nostalgic")?.getAttribute("aria-checked") === "true"), "feeling chosen holds its chip");
  await shot(page, "composer-feeling");
  await click(page, "[data-sb-composer] button[aria-haspopup=listbox]");
  await shot(page, "composer-privacy");
  await clickText(page, "Friends", "[data-sb-composer] [role=listbox]");
  // failure
  await page.evaluate(() => document.querySelector("input[type=checkbox]")?.click()); // harness simulate failure (first checkbox on page is the harness one)
  await sleep(100);
  await setValue(page, "#sb-composer-text", "This one fails.");
  await clickText(page, "Post", "[data-sb-composer] footer");
  await sleep(1300);
  ok(await page.evaluate(() => document.body.innerText.includes("Couldn't post. Your draft is kept.")), "failed post keeps the draft and offers Retry");
  await shot(page, "composer-failed");
  await page.evaluate(() => document.querySelector("input[type=checkbox]")?.click());
  // discard confirm + keep draft — UC-C3 §55 supersession: the ask reads "Keep this draft?"
  // (Keep draft · Discard · Continue editing); the invariant is unchanged.
  await clickText(page, "Cancel", "[data-sb-composer] footer");
  ok(await page.evaluate(() => document.body.innerText.includes("Keep this draft?")), "closing with content asks Keep draft / Discard / Continue editing");
  await shot(page, "composer-discard");
  await clickText(page, "Keep draft", "[data-sb-composer] footer");
  await sleep(300);
  ok(await page.$eval("[data-sb-open-composer]", (e) => e.textContent.includes("Draft kept")), "kept draft is announced on the bar");
  // edit (the moment sits deeper in the feed)
  for (let i = 0; i < 4 && !(await page.$("[data-sb-moment='m-nepali-1']")); i++) { await page.evaluate(() => document.querySelector("[data-sb-load-more]")?.click()); await sleep(300); }
  await page.$eval("[data-sb-moment='m-nepali-1']", (e) => e.scrollIntoView({ block: "center" }));
  await click(page, "[data-sb-moment='m-nepali-1'] button[aria-label=More]");
  await clickText(page, "Edit", "[data-sb-moment='m-nepali-1']");
  await page.waitForSelector("[data-sb-composer]");
  ok(await page.evaluate(() => document.querySelector("#sb-ucomposer-title")?.textContent === "Edit post" && document.querySelector("#sb-composer-text").value.includes("स्वयम्भू")), "edit reopens the same composer, prefilled (Devanagari intact)");
  await shot(page, "composer-edit");
  await setValue(page, "#sb-composer-text", "बिहानै स्वयम्भू — edited.");
  await clickText(page, "Save", "[data-sb-composer] footer");
  await sleep(1300);
  ok(await page.$eval("[data-sb-moment='m-nepali-1']", (e) => e.textContent.includes("edited")), "saved edit shows the edited marker");

  /* ---- 11. keyboard + escape + reduced motion ---- */
  console.log("11. keyboard, escape, reduced motion");
  await go(page, {}, { theme: "light", w: "desktop" });
  await page.focus("[data-sb-open-composer]");
  await page.keyboard.press("Enter");
  await page.waitForSelector("[data-sb-composer]");
  await sleep(300);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const inDialog = await page.evaluate(() => !!document.activeElement?.closest("[data-sb-composer]"));
  ok(inDialog, "Tab stays inside the composer");
  await page.keyboard.press("Escape");
  await sleep(400);
  const back = await page.evaluate(() => !document.querySelector("[data-sb-composer]") && document.activeElement?.hasAttribute("data-sb-open-composer"));
  ok(back, "Escape closes the composer and returns focus to the bar");
  await click(page, "[data-sb-moment='m-meal'] button[aria-label=More]");
  await page.keyboard.press("Escape");
  await sleep(200);
  ok(!(await page.$("[data-sb-moment='m-meal'] [role=menu]")), "Escape closes menus");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await go(page, {}, { theme: "light", w: "desktop" });
  const HERO = "aside [data-sb-counter]"; // C5.3: the hero counter no longer renders at desktop
  for (let i = 0; i < 7; i++) await click(page, `${HERO} button[aria-label^='Unit']`); // → seconds
  const face = await page.$eval(HERO, (e) => e.getAttribute("data-sb-counter-face"));
  await sleep(1100);
  const rolling = await page.$$eval(`${HERO} .sb-roll`, (n) => n.length);
  const reducedFlag = await page.$eval(HERO, (e) => e.getAttribute("data-sb-reduced"));
  ok(face === "seconds" && rolling === 0 && reducedFlag === "true", `reduced motion: seconds update without the roll animation (${face}, ${rolling} rolling, reduced=${reducedFlag})`);
  await shot(page, "reduced-motion-seconds");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 12. theme toggle live mid-scroll ---- */
  console.log("12. theme toggle");
  await go(page, {}, { theme: "light", w: "desktop" });
  await page.evaluate(() => window.scrollTo(0, 1600));
  await sleep(200);
  await page.evaluate(() => document.querySelector("[data-sb-social-frame] button[aria-label^='Switch to']")?.click());
  await sleep(300);
  const t = await page.evaluate(() => document.documentElement.dataset.theme);
  ok(t === "dark", `theme toggles live to ${t} mid-scroll`);
  await shot(page, "theme-toggled-midscroll");


  /* ---- 14. C3 chronology, C2 date grammar, C4 kind words, C5 World ---- */
  console.log("14. corrections: chronology, date grammar, kind words, World");
  await go(page, {}, { theme: "light", w: "desktop" });
  let clicksAll = 0;
  while ((await page.$("[data-sb-load-more]")) && clicksAll < 6) { await click(page, "[data-sb-load-more]"); clicksAll += 1; }
  const order = await page.$$eval("[data-sb-moment]", (n) => n.map((x) => x.getAttribute("data-sb-moment")));
  const dates = await page.$$eval("[data-sb-moment] [data-sb-date-rule]", (n) => n.map((h) => h.textContent.replace(/\s+/g, " ").trim()));
  const atOrder = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment]")].map((m) => m.getAttribute("data-sb-at") || ""));
  ok(order[order.length - 1] === "m-1983", `the oldest moment (m-1983, re-dated 1998) sits at the bottom of the fully loaded ledger (last: ${order[order.length - 1]})`);
  const uniqueDays = new Set(dates.map((d) => d.replace(/^TODAY\s*/, "").replace(/shared.*$/, "").trim()));
  ok(uniqueDays.size === dates.length, `one date rule per calendar day, never repeated (${dates.length} rules, ${uniqueDays.size} days)`);
  ok(atOrder.every((v, i, a) => i === 0 || a[i - 1] >= v), "entries are in strictly descending order of the moment's own date/time");
  const shared1983 = dates.find((d) => d.includes("14 SEP 1998"));
  ok(!!shared1983 && /shared/.test(shared1983), `backdated 1998 rule keeps 'shared' provenance: "${shared1983}"`);
  // World
  // Final My World model (owner decision): the personal Home is MY WORLD; the
  // stream is MOMENTS; "Social" is capability vocabulary, never a user-facing
  // destination. The one global control is the brand: the mark goes Home and
  // one quiet word states the context.
  const b = await page.$eval("[data-sb-brand]", (e) => ({ at: e.getAttribute("data-sb-brand-at"), href: e.getAttribute("href"), context: e.querySelector("[data-sb-context]")?.textContent.trim() }));
  ok(b.at === "world" && b.href === "/" && b.context === "My World", `the brand states MY WORLD and goes Home (${b.context} → ${b.href})`);
  ok(!(await page.evaluate(() => document.body.innerText.includes("Dashboard"))), "no user-facing 'Dashboard' anywhere");
  // date grammar in the Circle module date field
  const circleDate = await page.$eval("[data-sb-circle] [data-sb-date-display]", (e) => e.textContent.trim());
  ok(/^\d{2} [A-Z]{3} \d{4}$/.test(circleDate), `Circle date field displays SYSTEMBOOM grammar (${circleDate})`);
  await page.$eval("[data-sb-circle]", (e) => e.scrollIntoView({ block: "center" }));
  // composer: date grammar, kind words at 360, backdated landing
  for (const [theme, w] of [["light", "360"], ["dark", "360"]]) {
    await go(page, {}, { theme, w });
    await click(page, "[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await sleep(400);
    // Universal Composer recorded supersession (§6): the opening state is SOCIAL — media,
    // People and Record details only; the classification row is NOT presented until asked.
    ok(await page.evaluate(() => !document.querySelector("[data-sb-kind-row]")), `${theme} 360: no classification row at open — the Composer opens social (§6)`);
    // UC-C3 §5 supersession: the action words are human — Media · People · Place · Add details
    const actionWords = await page.$$eval("[data-sb-composer-actions] span.text-\\[11px\\]", (n) => n.map((x) => x.textContent.trim()));
    ok(actionWords.join(",") === "Media,People,Place,Add details", `${theme} 360: the four context actions carry their words (${actionWords.join(", ")})`);
    await click(page, "[data-sb-composer] [data-sb-record-details]");
    const labels = await page.$$eval("[data-sb-kind-row] [data-sb-kind-label]", (n) => n.map((x) => x.textContent.trim()));
    ok(labels.join("|") === "Life Moment|Meal|Activity|Health|Problem|Project|Meeting", `${theme} 360: the chooser names exactly the seven records (${labels.join(" · ")})`);
    // UC-C3 §6/§72 supersession: record names were 11px quiet chips in a persistent row; they
    // are now READABLE rows (14px/500, 44px targets) inside a focused chooser sheet.
    const kindStyle = await page.$eval("[data-sb-kind-row] [data-sb-kind-label]", (e) => ({ size: getComputedStyle(e).fontSize, weight: getComputedStyle(e).fontWeight, rowH: Math.round(e.closest("button").getBoundingClientRect().height) }));
    ok(kindStyle.size === "14px" && (kindStyle.weight === "500" || kindStyle.weight === "medium") && kindStyle.rowH >= 44, `${theme} 360: record rows read 14px/500 at ≥44px (${kindStyle.size}/${kindStyle.weight}/${kindStyle.rowH}px)`);
    await shot(page, `corrections/composer-kind-row-360-${theme}`);
    // GREENFIELD (§21) + UC-C3 (§42): the date instrument lives behind the When control and
    // keeps the SYSTEMBOOM grammar
    await click(page, "[data-sb-composer] button[aria-label='Life Moment']");
    await page.evaluate(() => document.querySelector("[data-sb-more-toggle]").click());
    await sleep(250);
    await click(page, "[data-sb-when-change]");
    await setValue(page, "[data-sb-composer] [data-sb-when] input[type=date]", "2019-07-14");
    await sleep(250);
    const composerDate = await page.$eval("[data-sb-composer] [data-sb-date-display]", (e) => e.textContent.trim());
    ok(composerDate === "14 JUL 2019", `${theme} 360: the When speaks SYSTEMBOOM grammar (${composerDate})`);
    if (theme === "light") await shot(page, "corrections/composer-date-closed");
    await page.keyboard.press("Escape");
    await sleep(300);
  }
  // backdated flow: before and after
  await go(page, {}, { theme: "light", w: "desktop" });
  await click(page, "[data-sb-open-composer]");
  await page.waitForSelector("[data-sb-composer]");
  await setValue(page, "#sb-composer-text", "Backdated to the 2019 monsoon.");
  await chooseKind(page, "Life Moment");
  await page.evaluate(() => document.querySelector("[data-sb-more-toggle]").click());
  await sleep(250);
  await click(page, "[data-sb-when-change]");
  await setValue(page, "[data-sb-composer] [data-sb-when] input[type=date]", "2019-07-14");
  await sleep(300);
  ok((await page.$eval("[data-sb-composer] [data-sb-date-display]", (e) => e.textContent.trim())) === "14 JUL 2019", "backdated composer date reads 14 JUL 2019");
  await shot(page, "corrections/backdated-before-post");
  await clickText(page, "Post", "[data-sb-composer] footer");
  await sleep(1500);
  const landed = await page.evaluate(() => {
    const all = [...document.querySelectorAll("[data-sb-moment]")];
    const i = all.findIndex((m) => m.id === "" && m.getAttribute("data-sb-moment").startsWith("m-new-"));
    const m = all[i];
    const prev = all[i - 1];
    const next = all[i + 1];
    return m ? { index: i, total: all.length, date: m.querySelector("[data-sb-date-rule]")?.textContent.replace(/\s+/g, " ").trim(), prevAt: prev?.getAttribute("data-sb-at"), nextAt: next?.getAttribute("data-sb-at") ?? null, at: m.getAttribute("data-sb-at"), loadMore: document.querySelector("[data-sb-load-more]")?.textContent.trim() ?? null, focused: document.activeElement?.hasAttribute("data-sb-readout"), visible: (() => { const r = m.getBoundingClientRect(); return r.top >= 0 && r.top < window.innerHeight; })() } : null;
  });
  // Historical position: strictly between its neighbours by the moment's own date. The 1983 entry may legitimately
  // remain behind "Load more · 1 earlier" — the ledger loads far enough to include the landed moment, not everything.
  const inPlace = !!landed && landed.index > 0 && landed.prevAt > landed.at && (landed.nextAt === null ? /1 earlier/.test(landed.loadMore ?? "") : landed.nextAt < landed.at);
  ok(inPlace && landed.date?.startsWith("14 JUL 2019") && /shared today/.test(landed.date ?? ""), `backdated moment lands at its historical position (index ${landed?.index} of ${landed?.total}, after ${landed?.prevAt?.slice(0, 10)}, before ${landed?.nextAt?.slice(0, 10) ?? landed?.loadMore}) with its own date leading: "${landed?.date}"`);
  ok(!!landed?.focused && !!landed?.visible, "the page settles on the landed moment (focus + in view)");
  await shot(page, "corrections/backdated-after-post");

  /* ---- contrast table ---- */
  console.log("13. contrast");
  const rows = contrast.filter((r) => !r.missing).map((r) => {
    const fg = parse(r.fg), bg = parse(r.bg);
    const a = (r.fg.match(/rgba?\([^)]*,\s*([\d.]+)\)/) || [])[1];
    const fgEff = a && Number(a) < 1 ? blend(fg, Number(a), bg) : fg;
    const rt = ratio(fgEff, bg);
    const large = r.size >= 24 || (r.size >= 18.66 && r.weight >= 700) || (r.size >= 18.66 && r.weight >= 600);
    const need = large ? 3 : 4.5;
    return { theme: r.theme, label: r.label, fg: r.fg, bg: r.bg, size: r.size, weight: r.weight, ratio: +rt.toFixed(2), need, pass: rt >= need };
  });
  fs.writeFileSync(`${EV}/contrast.json`, JSON.stringify(rows, null, 2));
  const fails = rows.filter((r) => !r.pass);
  ok(fails.length === 0, `contrast: ${rows.length} pairings measured, ${fails.length} below AA${fails.length ? " — " + fails.map((f) => `${f.theme}:${f.label}=${f.ratio}`).join("; ") : ""}`);
  const missing = contrast.filter((r) => r.missing).map((r) => r.label);
  if (missing.length) console.log("  (not found for contrast:", missing.join(", "), ")");

  const rej = await page.evaluate(() => window.__SB_REJ);
  ok(errors.length === 0, `zero page errors (${errors.length})${errors.length ? ": " + errors[0].slice(0, 200) : ""}`);
  ok(rej === 0, `zero unhandled rejections (${rej})`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => " - " + f).join("\n")); process.exit(1); }
  console.log("SOCIAL FINAL: PASS");
  await browser.close();
})().catch((e) => { console.error("SOCIAL FINAL: CRASH", e); process.exit(1); });
