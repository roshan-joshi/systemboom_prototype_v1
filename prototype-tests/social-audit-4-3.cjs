#!/usr/bin/env node
/* PHASE 4.3 — SOCIAL COMPLETION AUDIT · runtime verification + evidence (audit tooling only).
     node prototype-tests/social-audit-4-3.cjs            (dev server on :3210)
   Verifies the §52 P0 questions in a real browser instead of assuming them, measures the §62
   worst-case Moment height, and captures the §57 evidence set + a contact sheet.
   Output: prototype-evidence/phase-4.3-social-audit/ (gitignored) — results.json + PNGs.
   It changes no product code and no data: every action runs against the client-side prototype
   store, which resets on each page load. */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");
const path = require("path");

const OUT = "prototype-evidence/phase-4.3-social-audit";
const HOST = "http://localhost:3210";
const results = [];
const record = (id, question, verdict, evidence) => { results.push({ id, question, verdict, evidence }); console.log(`${id} ${verdict} — ${question}\n    ${evidence}`); };

async function go(page, { theme = "dark", q = "", w = 1440, h = 950, mobile = false } = {}) {
  await page.setViewport(mobile ? { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`${HOST}/style-lab/social?theme=${theme}&celestial=1${q}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const clickText = (page, scope, re) => page.evaluate((s, src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll(`${s} button, ${s} [role=menuitem], ${s} [role=menuitemradio]`)].find((b) => rx.test((b.textContent || "").trim()) || rx.test(b.getAttribute("aria-label") || ""));
  if (el) { el.click(); return true; }
  return false;
}, scope, re.source);
const scrollTo = (page, sel, block = "center") => page.evaluate((s, b) => document.querySelector(s)?.scrollIntoView({ block: b }), sel, block);
/* A Moment beyond the first loaded window: press "Load more" until it exists. */
async function ensureMoment(page, id) {
  for (let i = 0; i < 6 && !(await page.$(`[data-sb-moment='${id}']`)); i++) {
    const more = await page.$("[data-sb-load-more]");
    if (!more) break;
    await more.click();
    await sleep(600);
  }
  return !!(await page.$(`[data-sb-moment='${id}']`));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { browser, page } = await launch();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    if (process.env.DENSITY_ONLY) { results.push(...JSON.parse(fs.readFileSync(`${OUT}/results-probe.json`, "utf8"))); } else {
    /* ── A. Create and manage a Moment ── */
    await go(page);
    let ok = false, ev = "";
    try {
      await page.click("[data-sb-open-composer]");
      await sleep(900);
      const typed = "Audit probe moment — first light on the ridge.";
      await page.evaluate(() => document.querySelector("[data-sb-composer] textarea")?.focus());
      await page.keyboard.type(typed);
      await sleep(200);
      const posted = await clickText(page, "[data-sb-composer]", /^post$/);
      await sleep(1200);
      const first = await page.evaluate((t) => [...document.querySelectorAll("[data-sb-moment]")].find((m) => (m.textContent || "").includes(t))?.getAttribute("data-sb-moment") ?? null, typed);
      let edited = false, deleted = false;
      if (first) {
        const sel = `[data-sb-moment='${first}']`;
        await scrollTo(page, sel);
        await clickText(page, sel, /^more$/);
        await sleep(300);
        await clickText(page, sel, /^edit$/);
        await sleep(900);
        await page.evaluate(() => { const ta = document.querySelector("[data-sb-composer] textarea"); if (ta) { ta.focus(); ta.select(); } });
        await page.keyboard.type("Audit probe moment — edited.");
        await clickText(page, "[data-sb-composer]", /^(save|post)$/);
        await sleep(1000);
        edited = await page.evaluate((s) => (document.querySelector(s)?.textContent || "").includes("edited."), sel);
        await clickText(page, sel, /^more$/);
        await sleep(300);
        await clickText(page, sel, /^delete$/);
        await sleep(300);
        await clickText(page, sel, /^delete$/);
        await sleep(700);
        deleted = !(await page.$(sel));
      }
      ok = !!(posted && first && edited && deleted);
      ev = `post=${posted} landed=${!!first} edit=${edited} delete=${deleted} (client store only — no persistence across reload)`;
    } catch (e) { ev = `error: ${e.message}`; }
    record("A", "Can users create and manage a Moment reliably?", ok ? "YES (prototype)" : "NO/PARTIAL", ev);

    /* ── B/C. Another person Responds; conversation continues ── */
    await go(page, { q: "&viewer=visitor" });
    ok = false; ev = "";
    try {
      const target = "[data-sb-moment='m-rain']";
      await scrollTo(page, target);
      await page.click(`${target} [data-sb-respond]`);
      await sleep(700);
      await page.keyboard.type("Visitor probe response.");
      await page.keyboard.press("Enter");
      await sleep(900);
      const r = await page.evaluate((s) => {
        const notes = [...document.querySelectorAll(`${s} [data-sb-note]`)];
        const mine = notes.find((n) => (n.textContent || "").includes("Visitor probe response."));
        return { count: notes.length, landed: !!mine, // your own response has no author doorway button (only other people's names are doorways),
        // so fall back to the row's leading text, which is the author's name + "(you)"
        author: mine ? (mine.querySelector("[data-sb-note-author]")?.textContent?.trim() ?? (mine.textContent || "").split("Visitor probe response.")[0].trim()) : null };
      }, target);
      // reply to the first response
      const replied = await page.evaluate((s) => {
        const btn = [...document.querySelectorAll(`${s} [data-sb-note] button`)].find((b) => /^reply$/i.test((b.textContent || "").trim()));
        if (btn) { btn.click(); return true; }
        return false;
      }, target);
      await sleep(500);
      let replyLanded = false;
      if (replied) {
        await page.keyboard.type("Probe reply.");
        await page.keyboard.press("Enter");
        await sleep(900);
        replyLanded = await page.evaluate((s) => [...document.querySelectorAll(`${s} [data-sb-note]`)].some((n) => (n.textContent || "").includes("Probe reply.")), target);
      }
      ok = r.landed;
      ev = `visitor response landed=${r.landed} as "${r.author}" · responses now ${r.count} · reply-to-response=${replied ? (replyLanded ? "works" : "button but no landing") : "no Reply control"}`;
      record("C", "Can conversation continue clearly (reply to a response)?", replyLanded ? "YES (one level)" : "NO/PARTIAL", ev);
    } catch (e) { ev = `error: ${e.message}`; }
    record("B", "Can another person Respond?", ok ? "YES (prototype)" : "NO", ev);

    /* ── D. Boom and Celestial independent ── */
    await go(page);
    try {
      const target = "[data-sb-moment='m-rain']";
      await scrollTo(page, target);
      const before = await page.evaluate((s) => ({ boom: document.querySelector(`${s} [data-sb-express]`)?.getAttribute("aria-label"), cel: document.querySelector(`${s} [data-sb-resonate]`)?.getAttribute("data-sb-resonate-mine") }), target);
      await page.click(`${target} [data-sb-resonate]`);
      await sleep(900);
      await page.click(`${target} [data-sb-resonance-item='moon-touched']`);
      await sleep(1500);
      const after = await page.evaluate((s) => ({ boom: document.querySelector(`${s} [data-sb-express]`)?.getAttribute("aria-label"), cel: document.querySelector(`${s} [data-sb-resonate]`)?.getAttribute("data-sb-resonate-mine"), labels: [...document.querySelectorAll(`${s} [data-sb-actions] button`)].map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 40)) }), target);
      record("D", "Are Boom and Celestial both understandable and independent?", before.boom === after.boom && after.cel === "moon-touched" ? "INDEPENDENT (data) · learnability: see audit" : "CHECK", `Boom control label unchanged ("${after.boom}") after resonating Moon; Resonate mine=${after.cel}; action-row labels: ${JSON.stringify(after.labels)}`);
    } catch (e) { record("D", "Boom/Celestial independence", "ERROR", e.message); }

    /* ── E. Find / open another person ── */
    await go(page);
    try {
      await page.click("[data-sb-topbar] input[type='search']").catch(() => {});
      await sleep(300);
      await page.keyboard.type("Asha");
      await sleep(700);
      const hasResult = await page.evaluate(() => !!document.querySelector("[data-sb-search-person]"));
      if (hasResult) { await page.click("[data-sb-search-person]"); await sleep(700); }
      const card = await page.evaluate(() => { const c = document.querySelector("[data-sb-person-card]"); return c ? { rel: c.querySelector("[data-sb-person-rel]")?.textContent?.trim(), actions: [...c.querySelectorAll("button")].map((b) => (b.textContent || b.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 6) } : null; });
      record("E", "Can people find/open another person?", card ? "YES (search → person card)" : "NO", `search result=${hasResult} · person card=${JSON.stringify(card)} · NOTE: no route to a person's own World page from the card is asserted here`);
      /* ── F. Move into Chat ── */
      const msg = await page.$("[data-sb-person-card] [data-sb-message]");
      let chat = false;
      if (msg) { await msg.click(); await sleep(900); chat = await page.evaluate(() => !!document.querySelector("[data-sb-mini-chat], [data-sb-conversation]")); }
      record("F", "Can people move into Chat?", chat ? "YES (person card → mini chat)" : "NO/PARTIAL", `Message control on card=${!!msg} · chat surface opened=${chat}`);
    } catch (e) { record("E", "Find/open person", "ERROR", e.message); }

    /* ── G. Moment → Life, Life → Moment ── */
    await go(page);
    try {
      const target = "[data-sb-moment='m-rain']";
      await scrollTo(page, target);
      const vil = await page.evaluate((s) => { const b = [...document.querySelectorAll(`${s} button`)].find((x) => /view in life/i.test(x.textContent || "")); return b ? { disabled: b.disabled, title: b.getAttribute("title") } : null; }, target);
      await page.goto(`${HOST}/style-lab/circle?theme=dark`, { waitUntil: "networkidle2" });
      await sleep(1200);
      const almanac = await page.evaluate(() => ({ almanac: !!document.querySelector("[data-sb-almanac]"), moments: document.querySelectorAll("[data-sb-almanac] [data-sb-moment]").length }));
      record("G", "Can a Moment connect to Life?", vil?.disabled ? "NO — Moment→Life disabled; Life→Moment exists" : "CHECK", `"View in Life" button disabled=${vil?.disabled} title="${vil?.title}" · Circle default view: almanac=${almanac.almanac} with ${almanac.moments} Moment(s) rendered via MomentEntry`);
    } catch (e) { record("G", "Moment ↔ Life", "ERROR", e.message); }

    /* ── H. Friends reconnected ── */
    await go(page);
    try {
      await page.click("[data-sb-people]");
      await sleep(700);
      const p = await page.evaluate(() => { const panel = document.querySelector("[data-sb-people-panel]"); return panel ? { yours: panel.querySelectorAll("[data-sb-people-yours] [data-sb-people-row], [data-sb-people-row]").length, requests: !!panel.querySelector("[data-sb-people-requests]"), accept: !!panel.querySelector("[data-sb-people-accept]"), text: (panel.textContent || "").slice(0, 160) } : null; });
      record("H", "Are Friends reconnected?", p ? "PARTIAL (People utility, fixture graph)" : "NO", `People panel=${JSON.stringify(p)}`);
    } catch (e) { record("H", "Friends", "ERROR", e.message); }

    /* ── I. Notifications carry Social actions ──
       A one-browser prototype has no second user to notify, so the honest runtime question is
       whether ANY social action creates a notification. Read the reducer: which actions write
       state.notifications? */
    try {
      const store = fs.readFileSync("src/components/style-lab/social/store.tsx", "utf8");
      const writers = [...store.matchAll(/case "([a-zA-Z-]+)":[\s\S]*?(?=case "|\n  }\n}\n)/g)].filter((m) => /notifications\s*:/.test(m[0])).map((m) => m[1]);
      await go(page);
      await page.click("[data-sb-bell]");
      await sleep(600);
      const rows = await page.evaluate(() => [...document.querySelectorAll("[data-sb-notification-request], [data-sb-notification-moment]")].map((n) => (n.textContent || "").trim().slice(0, 70)));
      record("I", "Do Notifications carry Social actions correctly?", writers.some((w) => ["note", "resonate", "express", "respond", "post"].includes(w)) ? "CHECK" : "NO — fixture-only; no Social action creates a notification", `reducer cases that write notifications: ${JSON.stringify(writers)} · bell shows ${rows.length} seeded rows, e.g. ${JSON.stringify(rows.slice(0, 3))}`);
    } catch (e) { record("I", "Notifications", "ERROR", e.message); }

    /* ── J. Privacy: visitor sees no exact Life precision ── */
    await go(page, { q: "&viewer=visitor&resonance=mine" });
    try {
      await scrollTo(page, "[data-sb-moment='m-rain']");
      const leak = await page.evaluate(() => {
        const txt = document.querySelector("[data-sb-social-inner]")?.innerText || "";
        const exact = txt.match(/\b\d{1,3}y ?\d{1,2}m ?\d{1,2}d\b/g) || [];
        const owners = [...document.querySelectorAll("[data-sb-moment]")].filter((m) => /\b\d{1,3}y ?\d{1,2}m ?\d{1,2}d\b/.test(m.innerText)).map((m) => m.querySelector("[data-sb-open-person], a, strong, span")?.textContent?.trim()).slice(0, 4);
        return { exactAges: exact.slice(0, 6), onMomentsBy: owners, dayCounts: (txt.match(/\b\d{1,3},\d{3} ?days\b/gi) || []).slice(0, 4), birth: /04 NOV 1991|06:42/.test(txt) };
      });
      record("J", "Are privacy rules safe (visitor = Bikash on Maya's World)?", leak.exactAges.length || leak.dayCounts.length || leak.birth ? "CHECK — see evidence" : "SAFE (no exact age/day count/birth)", `exact ages visible: ${JSON.stringify(leak.exactAges)} on Moments by ${JSON.stringify(leak.onMomentsBy)} · day counts: ${JSON.stringify(leak.dayCounts)} · Maya's birth date/time: ${leak.birth} (an exact age may legitimately be the VISITOR's own Moments)`);
    } catch (e) { record("J", "Privacy", "ERROR", e.message); }

    /* ── K. Mobile usable ── */
    for (const [w, h] of [[390, 844], [360, 800]]) {
      await go(page, { mobile: true, w, h, q: "&harness=0&resonance=16" });
      /* Document overflow alone is blind to a control clipped by an overflow-hidden ancestor, so
         also measure every action-row control against the Moment column and the viewport. */
      const m = await page.evaluate(() => {
        const mo = document.querySelector("[data-sb-moment='m-rain']");
        const row = mo?.querySelector("[data-sb-actions]");
        const col = mo?.getBoundingClientRect();
        const controls = row ? [...row.querySelectorAll(":scope button, :scope > * > button")].map((b) => {
          const r = b.getBoundingClientRect();
          return { name: (b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 24), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) };
        }) : [];
        const clipped = controls.filter((c) => c.w > 0 && (c.right > Math.min(innerWidth, col.right) + 1 || c.left < Math.max(0, col.left) - 1)).map((c) => c.name);
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, actionRowW: row ? Math.round(row.getBoundingClientRect().width) : null, momentCol: col ? [Math.round(col.left), Math.round(col.right)] : null, vw: innerWidth, controls, clipped };
      });
      record(`K${w}`, `Is mobile usable at ${w}?`, !m.overflow && !m.clipped.length ? "YES (no overflow, every action-row control inside the Moment column)" : `NO — ${m.overflow ? "document overflow" : ""}${m.clipped.length ? ` clipped: ${m.clipped.join(", ")}` : ""}`, JSON.stringify(m));
    }

    fs.writeFileSync(`${OUT}/results-probe.json`, JSON.stringify(results, null, 2));
    }
    /* ── §62 worst-case Moment height ── */
    const heights = {};
    for (const [label, opts] of [["desktop", { w: 1440, h: 950 }], ["390", { w: 390, h: 844, mobile: true }]]) {
      await go(page, { ...opts, q: "&harness=0&pulse=20&pulseMoment=m-forty&resonance=16&resonanceMoment=m-forty" });
      await ensureMoment(page, "m-forty");
      await scrollTo(page, "[data-sb-moment='m-forty']", "start");
      await sleep(500);
      const closed = await page.$eval("[data-sb-moment='m-forty']", (e) => Math.round(e.getBoundingClientRect().height));
      await page.click("[data-sb-moment='m-forty'] [data-sb-resonance-who]").catch(() => {});
      await sleep(500);
      const withStage = await page.$eval("[data-sb-moment='m-forty']", (e) => Math.round(e.getBoundingClientRect().height));
      heights[label] = { closed, withConstellationOpen: withStage, viewportH: opts.h, screens: Math.round((withStage / opts.h) * 100) / 100 };
      await page.screenshot({ path: `${OUT}/density-${label}-m-forty.png`, fullPage: false });
    }
    record("§62", "Worst-case Moment height (40 responses — 27 top-level + 13 replies — + Boom pulse 20 + 8-type constellation)", "MEASURED", JSON.stringify(heights));

    /* ── §57 evidence captures ── */
    const shots = [
      ["01-dark-desktop-owner-top", { theme: "dark", q: "&harness=0" }],
      ["02-light-desktop-owner-top", { theme: "light", q: "&harness=0" }],
      ["03-dark-390-owner", { theme: "dark", q: "&harness=0", w: 390, h: 844, mobile: true }],
      ["04-light-390-owner", { theme: "light", q: "&harness=0", w: 390, h: 844, mobile: true }],
      ["05-moment-no-responses", { theme: "dark", q: "&harness=0", moment: "m-one" }],
      ["06-moment-with-responses", { theme: "dark", q: "&harness=0", moment: "m-forty" }],
      ["07-moment-with-boom", { theme: "dark", q: "&harness=0&pulse=20", moment: "m-rain" }],
      ["08-moment-with-resonance", { theme: "dark", q: "&harness=0&resonance=1", moment: "m-rain" }],
      ["09-moment-multi-person-resonance", { theme: "dark", q: "&harness=0&resonance=16", moment: "m-rain" }],
      ["10-profile-owner", { theme: "dark", q: "" }],
      ["11-profile-visitor", { theme: "dark", q: "&viewer=visitor" }],
      ["12-light-moment-all-systems", { theme: "light", q: "&harness=0&pulse=20&resonance=16", moment: "m-rain" }],
    ];
    for (const [name, o] of shots) {
      await go(page, { theme: o.theme, q: o.q, w: o.w ?? 1440, h: o.h ?? 950, mobile: o.mobile });
      if (o.moment) {
        const exists = await ensureMoment(page, o.moment);
        if (exists) { await scrollTo(page, `[data-sb-moment='${o.moment}']`, "start"); await page.evaluate(() => window.scrollBy(0, -90)); await sleep(500); }
      }
      await page.screenshot({ path: `${OUT}/${name}.png` });
    }
    console.log(`page errors: ${errors.length}`);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));

  /* contact sheet */
  const sharp = require("sharp");
  const files = fs.readdirSync(OUT).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
  const W = 420, cells = [];
  for (const f of files) {
    const fitted = await sharp(path.join(OUT, f)).resize({ width: W }).png().toBuffer();
    const fm = await sharp(fitted).metadata();
    const img = await sharp(fitted).extract({ left: 0, top: 0, width: W, height: Math.min(560, fm.height) }).png().toBuffer();
    const cap = await sharp(Buffer.from(`<svg width="${W}" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="30" fill="#101318"/><text x="10" y="20" font-family="Helvetica, Arial" font-size="13" fill="#d7deeb">${f.replace(".png", "")}</text></svg>`)).png().toBuffer();
    cells.push(await sharp({ create: { width: W, height: 590, channels: 4, background: "#101318" } }).composite([{ input: cap, top: 0, left: 0 }, { input: img, top: 30, left: 0 }]).png().toBuffer());
  }
  const cols = 4, rows = Math.ceil(cells.length / cols);
  const comps = cells.map((c, i) => ({ input: c, left: (i % cols) * (W + 10), top: 56 + Math.floor(i / cols) * 600 }));
  comps.unshift({ input: await sharp(Buffer.from(`<svg width="${cols * (W + 10)}" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="50" fill="#101318"/><text x="12" y="33" font-family="Helvetica, Arial" font-size="20" fill="#f0f4fb">PHASE 4.3 — SOCIAL COMPLETION AUDIT · current runtime (style-lab harness, celestial=1)</text></svg>`)).png().toBuffer(), left: 0, top: 0 });
  await sharp({ create: { width: cols * (W + 10), height: 56 + rows * 600, channels: 4, background: "#101318" } }).composite(comps).png().toFile(`${OUT}/SOCIAL-4.3-CONTACT-SHEET.png`);
  console.log(`${OUT}/SOCIAL-4.3-CONTACT-SHEET.png`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
