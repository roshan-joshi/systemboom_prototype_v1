#!/usr/bin/env node
/* PHASE 4.3 — SOCIAL COMPLETION AUDIT · second-pass verification (audit tooling only).
     node prototype-tests/social-audit-4-3-verify.cjs      (dev server on :3210)
   Re-checks, in a real browser, the claims the code reading could not settle:
     K  — phone action row: is every control inside the Moment column? (Document overflow is
          blind to a control clipped by an overflow-hidden ancestor — the first probe missed it.)
     V1 — phone deep thread: does Respond put the cursor in the composer?
     V2 — phone focused conversation: does Reply open a reply composer?
     V3 — phone focused conversation: is a Person surface opened from a response visible?
     V4 — Composer: does Discard during Posting cancel the Moment?
   Writes 13-action-row-360-celestial-{on,off}.png and 14-phone-conversation-personcard-stacking.png
   into prototype-evidence/phase-4.3-social-audit/ and prints JSON. Changes no product code or data. */
const { launch, sleep } = require("./celestial-lib");

const OUT = "prototype-evidence/phase-4.3-social-audit";
const HOST = "http://localhost:3210";
const phone = (w, h) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function open(page, q, flagOff) {
  await page.goto(`${HOST}/style-lab/social?theme=dark&harness=0${q}`, { waitUntil: "networkidle2" });
  if (flagOff) { await page.evaluate(() => { try { localStorage.removeItem("sb-celestial"); } catch {} }); await page.reload({ waitUntil: "networkidle2" }); }
  await sleep(900);
}

(async () => {
  const { browser, page } = await launch();
  const out = { K: {} };
  try {
    /* K — action row fit, Celestial on vs off, 390 / 360 / 320 */
    for (const [label, q, off] of [["on", "&celestial=1&resonance=16", false], ["off", "&celestial=0", true]]) {
      for (const [w, h] of [[390, 844], [360, 800], [320, 700]]) {
        await page.setViewport(phone(w, h));
        await open(page, q, off);
        out.K[`${label}-${w}`] = await page.evaluate(() => {
          const mo = document.querySelector("[data-sb-moment='m-rain']");
          const row = mo?.querySelector("[data-sb-actions]");
          const col = mo.getBoundingClientRect();
          const controls = [...row.querySelectorAll("button")].filter((b) => !b.closest("[role=menu],[role=radiogroup]")).map((b) => {
            const r = b.getBoundingClientRect();
            return { name: (b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 20), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) };
          });
          return { column: [Math.round(col.left), Math.round(col.right)], controls, clipped: controls.filter((c) => c.w > 0 && c.right > Math.min(innerWidth, col.right) + 1).map((c) => c.name), docOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        if (w === 360) {
          await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-actions]")?.scrollIntoView({ block: "center" }));
          await sleep(400);
          const y = await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain'] [data-sb-actions]").getBoundingClientRect().top + scrollY);
          await page.screenshot({ path: `${OUT}/13-action-row-360-celestial-${label}.png`, clip: { x: 0, y: Math.max(0, y - 150), width: 360, height: 260 } });
        }
      }
    }

    /* V1–V3 — the phone focused conversation on the 40-response Moment */
    await page.setViewport(phone(390, 844));
    await open(page, "&celestial=0", true);
    for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-forty']")); i++) { const m = await page.$("[data-sb-load-more]"); if (!m) break; await m.click(); await sleep(600); }
    await page.evaluate(() => { const b = document.querySelector("[data-sb-moment='m-forty'] [data-sb-respond]"); b?.scrollIntoView({ block: "center" }); b?.click(); });
    await sleep(900);
    out.V1 = await page.evaluate(() => ({ surfaceOpen: !!document.querySelector("[data-sb-conversation-surface='m-forty']"), activeTag: document.activeElement?.tagName, activeRole: document.activeElement?.getAttribute("role"), cursorInComposer: document.activeElement?.tagName === "TEXTAREA" }));
    out.V2 = await page.evaluate(() => {
      const s = document.querySelector("[data-sb-conversation-surface='m-forty']");
      const replies = [...s.querySelectorAll("button")].filter((x) => /^reply$/i.test(x.textContent.trim()));
      const before = s.querySelectorAll("textarea").length;
      replies[0]?.click();
      return { replyButtons: replies.length, textareasBefore: before };
    });
    await sleep(400);
    out.V2.textareasAfter = await page.evaluate(() => document.querySelector("[data-sb-conversation-surface='m-forty']").querySelectorAll("textarea").length);
    out.V2.works = out.V2.textareasAfter > out.V2.textareasBefore;
    await page.evaluate(() => document.querySelector("[data-sb-conversation-surface='m-forty'] [data-sb-note-author]:not([data-sb-note-author='u-demo-001'])")?.click());
    await sleep(700);
    out.V3 = await page.evaluate(() => {
      const card = document.querySelector("[data-sb-person-card]");
      if (!card) return { cardMounted: false };
      const r = (card.firstElementChild?.nextElementSibling || card).getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 40));
      return { cardMounted: true, visibleOnTop: !!hit?.closest("[data-sb-person-card]"), hitIsConversation: !!hit?.closest("[data-sb-conversation-surface]"), focusInCard: !!document.activeElement?.closest("[data-sb-person-card]") };
    });
    await page.screenshot({ path: `${OUT}/14-phone-conversation-personcard-stacking.png` });

    /* V4 — Discard inside the 900 ms posting window */
    await open(page, "&celestial=0", false);
    await page.click("[data-sb-open-composer]");
    await sleep(800);
    await page.evaluate(() => document.querySelector("[data-sb-composer] textarea")?.focus());
    await page.keyboard.type("Discard probe — should never post.");
    const press = (src) => page.evaluate((s) => { const rx = new RegExp(s, "i"); const b = [...document.querySelectorAll("[data-sb-composer] button")].find((x) => rx.test(x.textContent.trim()) || rx.test(x.getAttribute("aria-label") || "")); b?.click(); return !!b; }, src);
    out.V4 = { post: await press("^post$") };
    await sleep(120);
    out.V4.close = await press("^(cancel|close)$");
    await sleep(150);
    out.V4.discard = await press("^discard$");
    await sleep(1500);
    out.V4.postedAnyway = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment]")].some((m) => m.textContent.includes("Discard probe")));
  } finally {
    console.log(JSON.stringify(out, null, 1));
    await browser.close();
  }
})();
