/** REGRESSION — offices keep their two-stage behavior EXACTLY. */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-10b-final";
const { launch, sleep, waitFor, getSlots, shot, ready, clickButton } = require("./lib");

async function clickBeacon(page, id, expect, timeout = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const s = (await getSlots(page))[id];
    if (!s || !s.on) { await sleep(400); continue; }
    await page.mouse.click(s.x, s.y);
    const ok = await page.waitForFunction(expect, { timeout: 3500 }).then(() => true).catch(() => false);
    if (ok) return;
    await sleep(400);
  }
  throw new Error("TIMEOUT beacon " + id);
}

(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);

  /* STAGE ONE — first office click inspects on 3D, NO map */
  await clickBeacon(page, "head-office", () => {
    const st = window.__SB_STATE;
    return st && st.selectedOfficeId === "head-office" && st.journey && st.journey.kind === "inspect";
  });
  await waitFor(page, () => {
    const st = window.__SB_STATE, cam = window.__SB_CAM;
    return st && !st.journey && st.stage === "off" && cam && cam.dist < 2.05 && !cam.travelling;
  }, 45000, "office inspection on 3D");
  const noMap = await page.evaluate(() => window.__SB_STATE.stage === "off");
  if (!noMap) throw new Error("first office click opened the map!");
  await sleep(1100);
  await shot(page, "21-office-stage-one-3d");
  console.log("PASS OFFICE stage one — 3D inspection, no map");

  /* STAGE TWO — second click descends to the office map with mascot + card */
  await clickBeacon(page, "head-office", () => {
    const st = window.__SB_STATE;
    return (st && st.journey && st.journey.kind === "descend") || st.stage !== "off";
  }, 30000);
  await waitFor(page, () => {
    const a = document.querySelector("aside");
    return !!a && a.innerText.includes("Unit 20-21 Vittoria Worth") && a.innerText.includes("E3 2NT");
  }, 40000, "exact address panel");
  const mast = await page.evaluate(() =>
    [...document.querySelectorAll(".sb-origin")].some((el) => {
      const r = el.getBoundingClientRect();
      const img = el.querySelector("img");
      return r.top > 0 && r.top < innerHeight && img && img.getBoundingClientRect().width >= 24;
    }),
  );
  if (!mast) throw new Error("mascot marker missing at office map");
  // Offices are the ONLY geography that shows the mascot — no geo territory here
  const t = await page.evaluate(() => window.__SB_TERRITORY ?? null);
  if (t) throw new Error(`office arrival drew a country territory: ${t}`);
  await sleep(900);
  await shot(page, "22-office-stage-two-map");
  console.log("PASS OFFICE stage two — map + mascot + exact address, no territory");

  console.log("PAGE ERRORS:", errors.length ? errors : "none");
  if (errors.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
