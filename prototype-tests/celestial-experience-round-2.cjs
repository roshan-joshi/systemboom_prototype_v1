/* Runtime evidence for Celestial Resonance Experience Mastering Round 2. */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const root = path.resolve("prototype-evidence/celestial-mastering/experience-round-2");
const story = path.join(root, "storyboard");
const ids = ["venus-love", "sun-joy", "meteor-laugh", "comet-wow", "jupiter-celebrate", "saturn-support", "moon-touched", "mercury-curious"];
fs.mkdirSync(story, { recursive: true });
const url = (theme) => `http://localhost:3210/style-lab/social?theme=${theme}&celestial=1`;
async function moment(page) {
  const rootSel = "[data-sb-moment='m-rain']";
  await page.$eval(rootSel, (el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 150));
  return rootSel;
}
(async () => {
  const { browser, page } = await launch();
  try {
    for (const theme of ["dark", "light"]) {
      await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
      await page.goto(url(theme), { waitUntil: "networkidle2" }); const m = await moment(page);
      await page.screenshot({ path: path.join(root, `closed-${theme}.png`) });
      await page.hover(`${m} [data-sb-resonate]`); await sleep(180);
      await page.screenshot({ path: path.join(root, `doorway-${theme}.png`) });
      await page.click(`${m} [data-sb-resonate]`); await sleep(850);
      await page.screenshot({ path: path.join(root, `open-${theme}.png`) });
      await page.focus(`${m} [data-sb-resonance-item='venus-love']`); await sleep(260);
      await page.screenshot({ path: path.join(root, `focus-${theme}.png`) });
      await page.click(`${m} [data-sb-resonance-item='venus-love']`); await sleep(110);
      await page.screenshot({ path: path.join(root, `commit-${theme}.png`) });
    }
    for (const width of [390, 360]) for (const theme of ["dark", "light"]) {
      await page.setViewport({ width, height: 844, deviceScaleFactor: 1, hasTouch: true });
      await page.goto(url(theme), { waitUntil: "networkidle2" }); const m = await moment(page);
      await page.click(`${m} [data-sb-resonate]`); await sleep(850);
      await page.screenshot({ path: path.join(root, `open-${theme}-${width}.png`) });
    }
    for (const id of ids) {
      await page.setViewport({ width: 900, height: 780, deviceScaleFactor: 1 });
      await page.goto(url("dark"), { waitUntil: "networkidle2" }); const m = await moment(page);
      await page.click(`${m} [data-sb-resonate]`); await sleep(820);
      const field = `${m} [data-sb-celestial-field]`;
      await page.$(field).then((e) => e.screenshot({ path: path.join(story, `${id}-rest.png`) }));
      await page.focus(`${m} [data-sb-resonance-item='${id}']`); await sleep(200);
      await page.$(field).then((e) => e.screenshot({ path: path.join(story, `${id}-focus.png`) }));
      await page.click(`${m} [data-sb-resonance-item='${id}']`); await sleep(90);
      await page.$(field).then((e) => e.screenshot({ path: path.join(story, `${id}-commit.png`) }));
      await sleep(1050);
      await page.screenshot({ path: path.join(story, `${id}-settle.png`) });
    }
    const files = ["closed-dark.png", "doorway-dark.png", "open-dark.png", "focus-dark.png", "commit-dark.png", "closed-light.png", "doorway-light.png", "open-light.png", "focus-light.png", "commit-light.png"];
    const thumbs = await Promise.all(files.map(async (f) => ({ input: await sharp(path.join(root, f)).resize({ width: 480, height: 316, fit: "cover" }).toBuffer() })));
    await sharp({ create: { width: 2400, height: 632, channels: 3, background: "#0b1220" } }).composite(thumbs.map((t, i) => ({ ...t, left: (i % 5) * 480, top: Math.floor(i / 5) * 316 }))).png().toFile(path.join(root, "CELESTIAL-MOTION-AND-ENVIRONMENT-BOARD.png"));
    console.log("10 runtime states, 4 mobile states, 32 storyboard frames: PASS");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
