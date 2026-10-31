/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SYSTEMBOOM SIE P2-B2 — PERSISTENT OBSERVATION CACHE (CACHE-001…CACHE-030).
 *
 * Runs against the dev server on :3210 (MOCK mode — no live provider can be reached) and the local dev database
 * `systemboom_intelligence_dev`. Every analysis uses a deterministic `?mock=` fixture; the cache logic under test is the
 * real shipped code (routes + transpiled `observation-cache.ts` / `heim-store.ts`). CACHE-024…026/029 are proven by the
 * regression fleet (see the P2-B2 report); this suite marks them accordingly and never claims them by itself.
 *
 *   node prototype-tests/observation-cache.js
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.join(__dirname, "..");
const HOST = "http://localhost:3210";
const FIX = (n) => path.join(__dirname, "fixtures", n);
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const RUN = Date.now().toString(36);
let passed = 0;
const failures = [];
const results = {};
const ok = (id, c, m) => { results[id] = results[id] === "FAIL" ? "FAIL" : c ? "PASS" : "FAIL"; if (c) { passed += 1; console.log(`  ✓ ${id}. ${m}`); } else { failures.push(`${id}. ${m}`); console.log(`  ✗ ${id}. ${m}`); } };

function loadModules() {
  const dir = path.join(ROOT, "node_modules", ".sb-cache-test");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ["heim-store", "observation-cache"]) {
    const src = fs.readFileSync(path.join(ROOT, "src/lib/intelligence", `${f}.ts`), "utf8");
    fs.writeFileSync(path.join(dir, `${f}.js`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
  }
  return { dir, store: require(path.join(dir, "heim-store.js")), cache: require(path.join(dir, "observation-cache.js")) };
}

const files = { A: "no-exif.jpg", B: "exif-time-only.jpg", C: "exif-gps-pokhara.jpg", D: "exif-gps-unknown.jpg", E: "exif-gps-kathmandu-2.jpg" };
const bytes = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, fs.readFileSync(FIX(f))]));
const dataUrl = (k) => `data:image/jpeg;base64,${bytes[k].toString("base64")}`;
const hdr = (session, asset, extra = {}) => ({ "Content-Type": "application/json", "X-SB-Session": session, "X-SB-Asset": asset, "X-SB-Asset-Origin": "upload", ...extra });
async function analyze(k, scenario, session, asset, extra = {}) {
  const t0 = Date.now();
  const r = await fetch(`${HOST}/api/analyze-meal?mock=${encodeURIComponent(scenario)}`, { method: "POST", headers: hdr(session, asset, extra), body: JSON.stringify({ images: [{ dataUrl: dataUrl(k) }] }) });
  return { status: r.status, cache: r.headers.get("x-sb-observation-cache"), blocked: r.headers.get("x-sb-provider-blocked"), body: await r.json().catch(() => null), ms: Date.now() - t0 };
}
/** order-independent canonical form (JSONB normalises object key order; arrays keep theirs) */
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v));
const strip = (o) => { if (!o || !o.observation) return canon(o); const x = JSON.parse(JSON.stringify(o.observation)); delete x.analyzedAt; if (x.vision) delete x.vision.analyzedAt; return canon(x); };

(async () => {
  const { dir, store, cache } = loadModules();
  const db = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
  await db.connect();
  const q = (s, p) => db.query(s, p);
  const cleanup = () => q("delete from heim.media_assets where content_sha256 = any($1)", [Object.values(bytes).map(sha)]);
  const mediaOf = async (k) => (await q("select media_id from heim.media_assets where content_sha256=$1", [sha(bytes[k])])).rows[0]?.media_id;
  const invCount = async (mediaId) => (await q("select count(*)::int n from heim.ai_invocation_media where media_id=$1", [mediaId])).rows[0].n;
  const net = async () => (await (await fetch(`${HOST}/api/intelligence/status`)).json()).net;
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const S = `cache-${RUN}`;
  let browser;
  try {
    await cleanup();
    const net0 = await net();
    const live0 = (await q("select count(*)::int n from heim.ai_invocations where requested_provider_key <> 'mock'")).rows[0].n;

    /* ---------------- first analysis, repeat, provenance ---------------- */
    console.log("§1 miss → stored → hit");
    const first = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    const mA = await mediaOf("A");
    const rowA = (await q("select * from heim.vision_observations where media_id=$1", [mA])).rows;
    ok("CACHE-001", first.status === 200 && first.cache === "miss" && rowA.length === 1 && rowA[0].cacheable && /^[0-9a-f]{64}$/.test(rowA[0].cache_key) && rowA[0].payload.observation && !("suggestion" in rowA[0].payload.observation) && rowA[0].payload.categoryScores,
      "the first analysis is a MISS that stores a validated, reusable observation (decision removed, the model's category scores kept)");
    const invA = rowA[0]?.invocation_id;
    const ledger0 = (await q("select count(*)::int n from heim.ai_invocations")).rows[0].n;
    const second = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    const ledger1 = (await q("select count(*)::int n from heim.ai_invocations")).rows[0].n;
    ok("CACHE-002", second.status === 200 && second.cache === "hit" && strip(second.body) === strip(first.body), "repeating the analysis of identical authorized media returns a HIT with an identical observation (suggestion recomputed, same result)");
    ok("CACHE-003", ledger1 === ledger0 && (await invCount(mA)) === 1, "a hit makes ZERO provider calls (no new invocation row, still one producing invocation for this media)");
    const ev = (await q("select * from heim.observation_cache_events where media_id=$1 order by created_at", [mA])).rows;
    const hitEv = ev.find((e) => e.outcome === "hit");
    ok("CACHE-004", !!hitEv && hitEv.original_invocation_id === invA && hitEv.observation_id === rowA[0].observation_id, "the hit points at the ORIGINAL producing invocation and observation");
    ok("CACHE-005", !!hitEv && hitEv.provider_called === false && hitEv.provider_kind === "none" && ev.filter((e) => e.provider_called).length === 1, "the hit is recorded as 'no provider call' — never as a new or paid invocation");
    ok("CACHE-002b", second.body.observation.analyzedAt === first.body.observation.analyzedAt, "a hit reports when the observation was ORIGINALLY produced (no fabricated freshness)");

    /* ---------------- compatibility key ---------------- */
    console.log("§2 compatibility key (real computeCacheKey)");
    const base = { mediaId: "11111111-1111-1111-1111-111111111111", representationSha256: "a".repeat(64), preprocessing: "client-dataurl/1", provider: "deepseek", model: "deepseek-flash", promptId: "analyze-meal.pass1", promptDigest: "b".repeat(64), analysisConfigDigest: "c".repeat(64), schema: "category-pass1/1" };
    const k0 = cache.computeCacheKey(base).key;
    const differs = (patch) => cache.computeCacheKey({ ...base, ...patch }).key !== k0;
    ok("CACHE-006", differs({ schema: "category-pass1/2" }), "a changed observation schema produces a different key (miss)");
    ok("CACHE-007", differs({ promptDigest: "d".repeat(64) }) && differs({ promptId: "analyze-meal.pass1b" }), "a changed prompt digest or prompt id produces a different key (miss)");
    ok("CACHE-008", differs({ model: "deepseek-flash-2" }) && differs({ provider: "openai" }) && differs({ analysisConfigDigest: "e".repeat(64) }) && cache.computeCacheKey(base).fields.modelGeneration === cache.MODEL_GENERATION,
      "a changed model, provider or analysis configuration produces a different key; the opaque-alias generation is part of every live key");
    ok("CACHE-009", differs({ representationSha256: "f".repeat(64) }) && differs({ mediaId: "22222222-2222-2222-2222-222222222222" }), "changed bytes (or another media) produce a different key");
    const keyOrder = cache.computeCacheKey({ ...base }).key === cache.computeCacheKey(Object.fromEntries(Object.entries(base).reverse())).key;
    const fieldNames = Object.keys(cache.computeCacheKey(base).fields).sort().join(",");
    ok("CACHE-006b", keyOrder && fieldNames === "analysisConfigDigest,mediaId,model,modelGeneration,preprocessing,promptDigest,promptId,provider,representationSha256,schema,scope,v",
      `the key is order-independent and is made ONLY of identity/version fields (${fieldNames}) — no content, UI state, entry context or category`);
    const otherPrompt = await analyze("A", "vision-chair", S, "up-1-A");
    ok("CACHE-007b", otherPrompt.cache === "miss" && (await invCount(mA)) === 2, "route level: the same bytes under a different prompt/fixture identity are a MISS (new invocation)");
    const changedBytes = await analyze("B", "vision-birthdayparty", S, "up-2-B");
    ok("CACHE-009b", changedBytes.cache === "miss", "route level: different image bytes are a MISS");

    /* ---------------- invalid / failed / invalidated ---------------- */
    console.log("§3 never reuse invalid, failed or invalidated results");
    const failA = await analyze("D", "fail", S, "up-3-D");
    const failB = await analyze("D", "fail", S, "up-3-D");
    const mD = await mediaOf("D");
    const dObs = (await q("select count(*)::int n from heim.vision_observations where media_id=$1 and cacheable", [mD])).rows[0].n;
    ok("CACHE-011", failA.body?.observation === null && failB.cache === "miss" && dObs === 0, "a failed analysis is never stored as reusable — the repeat is another MISS");
    const nv1 = await analyze("D", "meal", S, "up-3-D");
    const nv2 = await analyze("D", "meal", S, "up-3-D");
    ok("CACHE-010", nv1.cache === "miss" && nv2.cache === "miss" && (await q("select count(*)::int n from heim.vision_observations where media_id=$1 and cacheable", [mD])).rows[0].n === 0,
      "an answer without a valid Pass 1 observation is not reusable (repeat is a MISS)");
    const before028 = (await q("select observation_id, invocation_id from heim.vision_observations where media_id=$1 and cache_key=$2", [mA, rowA[0].cache_key])).rows;
    const inv = await cache.invalidateObservations({ mediaId: mA }, "test: invalidate");
    const afterInv = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    ok("CACHE-010b", inv >= 1 && afterInv.cache === "miss", "an INVALIDATED observation is never reused (the next request re-analyses)");
    const hist = (await q("select observation_id, invocation_id, invalidated_at from heim.vision_observations where media_id=$1 and cache_key=$2 order by created_at", [mA, rowA[0].cache_key])).rows;
    const oldOne = hist.find((h) => h.observation_id === before028[0].observation_id);
    ok("CACHE-028", hist.length === 2 && !!oldOne && oldOne.invalidated_at && oldOne.invocation_id === before028[0].invocation_id && hist[1].invalidated_at === null,
      "after re-analysis the OLD observation stays traceable to its own invocation (kept, marked invalidated), beside the new one");
    const again = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    ok("CACHE-010c", again.cache === "hit", "the fresh re-analysis is reusable again");

    /* ---------------- concurrency ---------------- */
    console.log("§4 single-flight + recovery");
    const conc = await Promise.all([0, 1, 2, 3, 4].map(() => analyze("C", "vision-birthdayparty", S, "up-4-C", { "x-sb-mock-latency": "1500" })));
    const mC = await mediaOf("C");
    const cEv = (await q("select outcome, provider_called from heim.observation_cache_events where media_id=$1", [mC])).rows;
    ok("CACHE-012", (await invCount(mC)) === 1 && cEv.filter((e) => e.outcome === "miss" && e.provider_called).length === 1 && cEv.filter((e) => e.outcome === "waited_hit").length === 4 && new Set(conc.map((r) => strip(r.body))).size === 1,
      `5 concurrent identical requests → exactly ONE provider call; 4 waited for it (${conc.map((r) => r.cache).join(",")})`);
    ok("CACHE-012b", (await q("select count(*)::int n from heim.observation_cache_claims where media_id=$1", [mC])).rows[0].n === 0, "no claim is left behind");
    // stale claim (a crashed holder): an expired lease is taken over
    const regE = await (await fetch(`${HOST}/api/media/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionKey: S, assetId: "up-5-E", origin: "upload", sha256: sha(bytes.E), mime: "image/jpeg", size: bytes.E.length }) })).json();
    const keyE = cache.computeCacheKey({ mediaId: regE.mediaId, representationSha256: sha(bytes.E), preprocessing: cache.PASS1_PREPROCESSING, provider: "mock", model: "mock-fixture", promptId: "mock:vision-birthdayparty", promptDigest: sha("vision-birthdayparty"), analysisConfigDigest: "mock", schema: "category-pass1/1" }).key;
    await q("insert into heim.observation_cache_claims (cache_key, media_id, claimant, provider_kind, claimed_at, lease_expires_at) values ($1,$2,$3,'mock', now() - interval '2 minutes', now() - interval '1 minute')", [keyE, regE.mediaId, crypto.randomUUID()]);
    const take = await analyze("E", "vision-birthdayparty", S, "up-5-E");
    const tEv = (await q("select claim_takeover, outcome from heim.observation_cache_events where media_id=$1 order by created_at desc limit 1", [regE.mediaId])).rows[0];
    ok("CACHE-013", take.status === 200 && take.cache === "miss" && tEv?.claim_takeover === true && (await q("select count(*)::int n from heim.observation_cache_claims where cache_key=$1", [keyE])).rows[0].n === 0,
      "an expired claim left by a crashed holder is taken over; the analysis completes and the claim is released (key derived independently = the server's key)");
    // a live holder that gives up (releases without a result) → the waiter retries itself
    await cache.invalidateObservations({ mediaId: regE.mediaId }, "test: force miss");
    await q("insert into heim.observation_cache_claims (cache_key, media_id, claimant, provider_kind, lease_expires_at) values ($1,$2,$3,'mock', now() + interval '40 seconds')", [keyE, regE.mediaId, crypto.randomUUID()]);
    setTimeout(() => { q("delete from heim.observation_cache_claims where cache_key=$1", [keyE]).catch(() => {}); }, 1200);
    const retried = await analyze("E", "vision-birthdayparty", S, "up-5-E");
    ok("CACHE-013b", retried.status === 200 && retried.cache === "miss" && retried.ms < 6000 && retried.body?.observation, `when the holder releases without a result, the waiting request recovers by analysing itself (${retried.ms} ms)`);

    /* ---------------- provider unavailable ---------------- */
    console.log("§5 provider unavailable");
    const down1 = await analyze("A", "vision-birthdayparty", S, "up-1-A", { "x-sb-mock-provider-down": "1" });
    ok("CACHE-021", down1.status === 200 && down1.cache === "hit" && down1.body?.observation?.vision, "provider unavailable + a valid cached observation → the authorized cached observation is returned (lookup precedes the provider)");
    const down2 = await analyze("B", "vision-chair", S, "up-2-B", { "x-sb-mock-provider-down": "1" });
    ok("CACHE-022", down2.status === 200 && down2.body?.observation === null && down2.cache === "miss", "provider unavailable + no cache → the route's ordinary safe failure (observation null), nothing stored");
    const blocked = await fetch(`${HOST}/api/analyze-meal`, { method: "POST", headers: hdr(S, "up-1-A"), body: JSON.stringify({ images: [{ dataUrl: dataUrl("A") }] }) });
    ok("CACHE-022b", blocked.headers.get("x-sb-provider-blocked") === "deepseek" && (await blocked.json()).observation === null, "a mock-mode request with no fixture is still blocked (no live entry exists for this key) — the cache never fabricates a live result");

    /* ---------------- identity, scope, deletion ---------------- */
    console.log("§6 identity, scope, deletion");
    const dup = await analyze("A", "vision-birthdayparty", `${S}-other-session`, "up-9-renamed");
    const bridges = (await q("select count(*)::int n from heim.id_bridge where media_id=$1", [mA])).rows[0].n;
    ok("CACHE-027", dup.cache === "hit" && bridges >= 2, "a duplicate upload under a DIFFERENT temporary id (another page load) resolves to the same canonical media → HIT");
    // scope: an identical-key row in ANOTHER owner scope is never returned
    const foreignScope = "00000000-0000-0000-0000-0000000000f0";
    const liveA = (await q("select * from heim.vision_observations where media_id=$1 and cacheable and invalidated_at is null order by created_at desc limit 1", [mA])).rows[0];
    const fm = (await q("insert into heim.media_assets (owner_scope_id, content_sha256, hash_basis, origin) values ($1,$2,'original','upload') returning media_id", [foreignScope, sha(bytes.A)])).rows[0].media_id;
    await q(`insert into heim.vision_observations (owner_scope_id, media_id, invocation_id, schema_version, observation, cache_key, payload, cacheable)
             values ($1,$2,$3,1,'{"scene":{"label":"FOREIGN"}}'::jsonb,$4,'{"observation":{"isFood":false,"vision":{"scene":{"label":"FOREIGN"}}}}'::jsonb,true)`, [foreignScope, fm, liveA.invocation_id, liveA.cache_key]);
    await cache.invalidateObservations({ mediaId: mA }, "test: scope");
    const scoped = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    ok("CACHE-019", scoped.cache === "miss" && !JSON.stringify(scoped.body).includes("FOREIGN"), "identical content in another owner scope (even under the same key) is never returned — the request is a MISS in its own scope");
    await q("delete from heim.media_assets where media_id=$1", [fm]);
    const kf = (await q("select cache_key_fields f from heim.vision_observations where media_id=$1 and cache_key_fields is not null", [mA])).rows.map((r) => r.f);
    const kfOk = kf.length > 0 && kf.every((f) => Object.keys(f).sort().join(",") === "analysisConfigDigest,mediaId,model,modelGeneration,preprocessing,promptDigest,promptId,provider,representationSha256,schema,scope,v" && !/HAPPY BIRTHDAY|"lat|"lon|gps/i.test(JSON.stringify(f)));
    const evCols = (await q("select column_name from information_schema.columns where table_schema='heim' and table_name in ('observation_cache_events','observation_cache_claims')")).rows.map((r) => r.column_name);
    ok("CACHE-020", kfOk && !evCols.some((c) => /^(text|ocr|ocr_text|payload|observation|gps|lat|lon|latitude|longitude|content|caption|image)$/.test(c)), "cache keys hold only identity/version fields (no OCR text, no GPS) and cache telemetry has no content columns");
    const mPre = (await q("select sum(hits)::int hits, sum(misses)::int misses, sum(live_provider_calls)::int live, sum(mock_provider_calls)::int mock, sum(duplicate_calls_prevented)::int dup, sum(claim_takeovers)::int takeovers from heim.cache_metrics where task_type='category_pass1'")).rows[0];
    const preDel = await store.deleteMedia(mA);
    const postDel = (await q(`select (select count(*)::int from heim.vision_observations where media_id=$1) o,(select count(*)::int from heim.observation_cache_events where media_id=$1) e,
                                     (select count(*)::int from heim.observation_cache_claims where media_id=$1) c,(select count(*)::int from heim.id_bridge where media_id=$1) b`, [mA])).rows[0];
    const reAfterDel = await analyze("A", "vision-birthdayparty", S, "up-1-A");
    ok("CACHE-014", preDel.deleted && preDel.observations >= 3 && preDel.cacheEvents >= 3 && postDel.o + postDel.e + postDel.c + postDel.b === 0 && reAfterDel.cache === "miss",
      `deleting the media removes its cached observations (${preDel.observations}), cache events (${preDel.cacheEvents}), claims and bridges; the next request is a fresh MISS`);

    /* ---------------- metrics ---------------- */
    console.log("§7 metrics");
    const m = mPre; // measured BEFORE CACHE-014's deletion, which correctly removes that media's events
    ok("CACHE-023", m.hits >= 9 && m.misses >= 9 && m.mock >= 8 && m.dup >= 4 && m.takeovers >= 1 && typeof m.live === "number", `cache_metrics distinguishes hits (${m.hits}), misses (${m.misses}), live paid calls (${m.live}), mock calls (${m.mock}), duplicates prevented (${m.dup})`);
    const net1 = await net();
    const live1 = (await q("select count(*)::int n from heim.ai_invocations where requested_provider_key <> 'mock'")).rows[0].n;
    ok("CACHE-024a", sum(net1.allowed) === sum(net0.allowed) && live1 === live0, "this suite made ZERO allowed provider-network requests and wrote ZERO live ledger rows");

    /* ---------------- browser: DISCOVER, ENRICH, override, records, public output ---------------- */
    console.log("§8 browser — Social DISCOVER, Circle ENRICH, override, Human Record, public output");
    ({ browser } = await launch());
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
    const seen = [];
    page.on("response", (r) => { if (r.url().includes("/api/analyze-meal")) seen.push({ cache: r.headers()["x-sb-observation-cache"], entry: r.request().headers()["x-sb-entry"] }); });
    const PIN = "harness=0&mockfacts=miss&mockpackaged=miss&mockrecord=off&mockactivity=high&theme=light";
    const waitFor = async (fn, arg, tries = 40, gap = 200) => { for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); } return false; };
    const pill = () => page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
    const pick = async (names) => {
      await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
      await sleep(300);
      await page.click("[data-sb-media-source='mymedia']");
      await sleep(350);
      await page.evaluate((ns) => { const g = document.querySelector("[data-sb-mymedia-grid]"); for (const n of ns) [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, names);
      await sleep(200);
      await page.click("[data-sb-mymedia-add]");
      await sleep(350);
    };
    const mealDone = (n) => waitFor((k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n);
    const NYAT = "Nyatapola temple, Bhaktapur";
    const GARDEN = "A garden park in Kathmandu";
    const openSocial = async () => { await page.goto(`${HOST}/style-lab/social?${PIN}&mockai=vision-birthdayparty`, { waitUntil: "networkidle2" }); await sleep(700); await page.click("[data-sb-open-composer]"); await sleep(450); };
    // warm the cache for NYAT, then measure a fresh composition
    await openSocial(); await pick([NYAT]); await mealDone(1); await sleep(600);
    const momentsBefore = (await page.evaluate(() => window.__SB_SOCIAL_STATE?.moments?.length)) ?? -1;
    seen.length = 0;
    await openSocial(); await pick([NYAT]); await mealDone(1); await sleep(700);
    const p1 = await pill();
    ok("CACHE-016", seen[0]?.cache === "hit" && seen[0]?.entry === "social_composer" && p1 === "moment", `Social DISCOVER on a cached photo: the reading is a HIT and the classifier still organises it (pill ${p1})`);
    const draftState = await page.evaluate(() => ({ moments: window.__SB_SOCIAL_STATE?.moments?.length ?? -1 }));
    ok("CACHE-018", draftState.moments === momentsBefore, "a cached observation creates no Human Record by itself (nothing posted, no Moment added)");
    // manual override, then a second cached photo arrives in the same composition
    await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); });
    await sleep(350);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Project']")][0]?.click());
    await sleep(500);
    seen.length = 0;
    await pick([GARDEN]); await mealDone(2); await sleep(900);
    const p2 = await pill();
    ok("CACHE-015", p2 === "project", `a person's category choice stays authoritative while further (cached or fresh) readings arrive (pill ${p2}, readings ${seen.map((s) => s.cache).join(",")})`);
    // post and inspect the public projection
    await page.evaluate(() => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, "P2-B2 cache check"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()))?.click());
    await sleep(1600);
    const pub = await page.evaluate(() => { const st = JSON.stringify(window.__SB_SOCIAL_STATE ?? {}); const pp = window.__SB_PUBLIC_PAYLOAD; const m = (window.__SB_SOCIAL_STATE?.moments ?? []).find((x) => /P2-B2 cache check/.test(x.text ?? "")); return { posted: !!m, publicJson: m && pp ? JSON.stringify(pp(m)) : null, cacheLeak: /cache_key|cacheKey|observation_id|media_id|x-sb-/i.test(st) }; });
    ok("CACHE-030", pub.posted && !pub.cacheLeak, "posting after a cache hit puts no cache key, observation id or canonical media id into the Social post or state");
    ok("CACHE-020b", pub.publicJson !== null && !/visualObservation|mealAIObservation|HAPPY BIRTHDAY|primarySubject/.test(pub.publicJson), "the public projection of that post carries no AI observation or OCR (existing P1 boundary unchanged)");
    // Circle ENRICH
    seen.length = 0;
    await page.goto(`${HOST}/style-lab/circle?c=day:2019-07-14&w=desktop&theme=light&harness=0&mockai=vision-birthdayparty&mockrecord=off&mockactivity=high&mockfacts=miss&mockpackaged=miss`, { waitUntil: "networkidle2" });
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 15000 });
    await sleep(700);
    await page.click("[data-sb-record-here]");
    await page.waitForSelector("[data-sb-composer]");
    await sleep(500);
    const enrichBefore = await pill();
    await pick([NYAT]); await mealDone(1); await sleep(900);
    const enrichAfter = await pill();
    const visionCard = await page.evaluate(() => !!document.querySelector("[data-sb-vision-card]"));
    ok("CACHE-017", seen[0]?.cache === "hit" && seen[0]?.entry === "circle_of_life" && enrichAfter === enrichBefore && !visionCard,
      `Circle ENRICH on a cached photo: HIT recorded as circle_of_life, the chosen category is unchanged (${enrichBefore} → ${enrichAfter}) and no category suggestion is shown`);
    const appMetrics = (await q("select entry_context, sum(hits)::int hits from heim.cache_metrics where task_type='category_pass1' and entry_context in ('social_composer','circle_of_life') group by 1")).rows;
    ok("CACHE-023b", appMetrics.some((r) => r.entry_context === "social_composer" && r.hits > 0) && appMetrics.some((r) => r.entry_context === "circle_of_life" && r.hits > 0), "reuse is measured per application (Social Composer and Circle of Life)");
    const vb = await analyze("A", "vision-meal", `${S}-meal`, "up-6-A");
    const vb2 = await analyze("A", "vision-meal", `${S}-meal`, "up-6-A");
    ok("CACHE-029a", vb2.cache === "hit" && vb2.body.observation.isFood === vb.body.observation.isFood && canon(vb2.body.observation.meal ?? null) === canon(vb.body.observation.meal ?? null) && vb2.body.observation.suggestion?.primary?.kind === vb.body.observation.suggestion?.primary?.kind,
      "a cached Meal reading carries the same Meal identity, food flag and recomputed suggestion as the original");
  } catch (e) {
    failures.push(`suite crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`);
    console.log("  ✗ crashed:", e && e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
    await cleanup().catch(() => {});
    await db.end().catch(() => {});
    try { const p = store.heimPool(); if (p) await p.end(); } catch {}
    fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const id of ["CACHE-024", "CACHE-025", "CACHE-026", "CACHE-029"]) if (!results[id]) results[id] = "SEE FLEET";
  console.log(`\n${failures.length ? "FAIL" : "PASS"} — ${passed} checks passed, ${failures.length} failed`);
  failures.forEach((f) => console.log("  ✗", f));
  process.exit(failures.length ? 1 : 0);
})();
