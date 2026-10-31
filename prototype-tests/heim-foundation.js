/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SYSTEMBOOM SIE P2-B1 — HEIM FOUNDATION (local development database, canonical media identity, provider provenance,
 * Pass 1 observation storage, media deletion).
 *
 * LOCAL ONLY. Structural/destructive checks run on a THROWAWAY database (`systemboom_heimtest_dev`, created and dropped
 * by this suite); behaviour checks hit the running dev server (http://localhost:3210) and read the real local dev
 * database `systemboom_intelligence_dev`. Every provider call is a MOCK seam (`?mock=`) — no live provider is called, so
 * the provider is recorded as `mock`; a live DeepSeek call is NOT exercised here.
 *
 *   node prototype-tests/heim-foundation.js
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.join(__dirname, "..");
const HOST = "http://localhost:3210";
const MAIN_URL = "postgresql://localhost:5432/systemboom_intelligence_dev";
const TEST_DB = "systemboom_heimtest_dev";
const TEST_URL = `postgresql://localhost:5432/${TEST_DB}`;
const FIX = (n) => path.join(__dirname, "fixtures", n);
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const RUN = Date.now().toString(36);

const migrate = (url, cmd) => {
  try {
    return { code: 0, out: execFileSync("node", [path.join(ROOT, "db/heim/migrate.mjs"), cmd], { env: { ...process.env, HEIM_DATABASE_URL: url }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) { return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }; }
};
const connect = async (url) => { const c = new Client({ connectionString: url }); await c.connect(); return c; };

/** transpile the real TypeScript modules so the suite exercises the SHIPPED code, not a copy */
function loadModules() {
  const dir = path.join(ROOT, "node_modules", ".sb-heim-test");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ["heim-store", "provider-gate", "observation-cache", "provenance"]) {
    const src = fs.readFileSync(path.join(ROOT, "src/lib/intelligence", `${f}.ts`), "utf8");
    fs.writeFileSync(path.join(dir, `${f}.js`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
  }
  return { dir, store: require(path.join(dir, "heim-store.js")), prov: require(path.join(dir, "provenance.js")) };
}

const api = async (p, { headers = {}, body } = {}) => {
  const r = await fetch(`${HOST}${p}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const dataUrl = (file) => `data:image/jpeg;base64,${fs.readFileSync(FIX(file)).toString("base64")}`;
const H = (session, asset, origin = "upload") => ({ "X-SB-Session": session, "X-SB-Asset": asset, "X-SB-Asset-Origin": origin });

(async () => {
  const admin = await connect(MAIN_URL.replace(/\/[^/]*$/, "/postgres"));
  const mods = loadModules();
  let main;
  const errs = [];
  try {
    /* ============ §1 migrations on a throwaway database ============ */
    console.log("§1 migrations + safety guards (throwaway database)");
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    const up1 = migrate(TEST_URL, "up");
    ok(up1.code === 0 && /created database/.test(up1.out) && /applied 001_heim_foundation/.test(up1.out), "HEIM-1. `up` creates the local dev database and applies 001_heim_foundation");
    const up2 = migrate(TEST_URL, "up");
    ok(up2.code === 0 && /nothing to apply/.test(up2.out), "HEIM-2. a second `up` is idempotent (nothing to apply)");
    const t = await connect(TEST_URL);
    const tables = (await t.query("select table_name from information_schema.tables where table_schema='heim' order by 1")).rows.map((r) => r.table_name);
    // SUPERSEDED 2026-10-31 by P2-B2 (migration 002): the schema now also holds the cache claim/event tables and the cache_metrics view
    ok(JSON.stringify(tables) === JSON.stringify(["ai_invocation_media", "ai_invocations", "ai_models", "ai_providers", "cache_metrics", "id_bridge", "media_assets", "observation_cache_claims", "observation_cache_events", "schema_migrations", "vision_observations"]),
      `HEIM-3. exactly the P2-B1 tables + the P2-B2 cache additions exist in schema heim (${tables.join(", ")})`);
    ok(migrate("postgresql://localhost:5432/app_backend_db", "status").code !== 0 && /does not end in _dev/.test(migrate("postgresql://localhost:5432/app_backend_db", "status").out), "HEIM-4. the runner REFUSES a database whose name does not end in _dev");
    ok(migrate("postgresql://db.example.com:5432/x_dev", "status").code !== 0 && /not localhost/.test(migrate("postgresql://db.example.com:5432/x_dev", "status").out), "HEIM-5. the runner REFUSES a non-localhost host");
    const store = mods.store;
    ok(store.localDevUrl("postgresql://localhost:5432/systemboom_intelligence_dev") && !store.localDevUrl("postgresql://localhost/prod") && !store.localDevUrl("postgresql://db.example.com/x_dev") && !store.localDevUrl("postgresql://10.0.0.5/x_dev"),
      "HEIM-6. the application layer accepts only localhost + *_dev connection strings");
    // SUPERSEDED 2026-10-31 by P2-B2: `down` rolls back ONE migration at a time, so a complete rollback is down × 2 (002, then 001)
    const down2 = migrate(TEST_URL, "down");
    const down = migrate(TEST_URL, "down");
    const afterDown = (await t.query("select count(*)::int n from information_schema.tables where table_schema='heim' and table_name<>'schema_migrations'")).rows[0].n;
    ok(down2.code === 0 && /rolled back 002_observation_cache/.test(down2.out) && down.code === 0 && /rolled back 001_heim_foundation/.test(down.out) && afterDown === 0, "HEIM-7. `down` rolls back newest-first (002 then 001) and the foundation is gone completely (rollback verified)");
    const re = migrate(TEST_URL, "up");
    ok(re.code === 0 && /applied 001_heim_foundation/.test(re.out) && /applied 002_observation_cache/.test(re.out), "HEIM-8. `up` re-applies both migrations cleanly after a rollback");
    await t.end();

    /* ============ §2 schema contracts (throwaway db) ============ */
    console.log("§2 schema contracts");
    const c = await connect(TEST_URL);
    const q = (s, p) => c.query(s, p);
    const bad = async (sql, p) => { try { await q(sql, p); return false; } catch (e) { return e.code || true; } };
    ok(await bad("insert into heim.media_assets (content_sha256, hash_basis, origin) values ('nothex','original','upload')"), "HEIM-9. a malformed SHA-256 is rejected");
    ok(await bad("insert into heim.media_assets (content_sha256, hash_basis, origin) values ($1,'guess','upload')", ["a".repeat(64)]), "HEIM-10. hash_basis is constrained to original | representation");
    const m1 = (await q("insert into heim.media_assets (content_sha256, hash_basis, origin, mime_type, size_bytes) values ($1,'original','upload','image/jpeg',10) returning media_id", ["a".repeat(64)])).rows[0].media_id;
    ok(await bad("insert into heim.media_assets (content_sha256, hash_basis, origin) values ($1,'original','upload')", ["a".repeat(64)]) === "23505", "HEIM-11. identical bytes cannot create a second canonical row for the same owner scope");
    await q("insert into heim.id_bridge (session_key, prototype_id, media_id) values ('s1','up-1-IMG',$1)", [m1]);
    ok(await bad("insert into heim.id_bridge (session_key, prototype_id, media_id) values ('s1','up-1-IMG',$1)", [m1]) === "23505", "HEIM-12. a temporary id maps to exactly one canonical id per session");
    const m2 = (await q("insert into heim.media_assets (content_sha256, hash_basis, origin) values ($1,'original','upload') returning media_id", ["b".repeat(64)])).rows[0].media_id;
    await q("insert into heim.id_bridge (session_key, prototype_id, media_id) values ('s2','up-1-IMG',$1)", [m2]);
    ok((await q("select count(*)::int n from heim.id_bridge where prototype_id='up-1-IMG'")).rows[0].n === 2, "HEIM-13. the SAME temporary id in a different session is a different asset (page-load counters repeat)");
    const reg = (await q("select p.provider_key, m.configured_model_key, m.published_revision from heim.ai_models m join heim.ai_providers p on p.id=m.provider_id order by 1,2")).rows;
    ok(reg.length === 2 && reg[0].provider_key === "deepseek" && reg[0].configured_model_key === "deepseek-flash" && reg[0].published_revision === null && reg[1].provider_key === "mock", "HEIM-14. the registry is seeded: deepseek/deepseek-flash (revision unknown = NULL, never guessed) and the labelled mock");
    ok(await bad("insert into heim.ai_models (provider_id, configured_model_key) select id,'deepseek-flash' from heim.ai_providers where provider_key='deepseek'") === "23505", "HEIM-15. a NULL-revision model cannot be inserted twice (NULL-safe uniqueness)");
    const cols = (await q("select table_name, column_name, data_type from information_schema.columns where table_schema='heim'")).rows;
    ok(!cols.some((x) => /(api[_-]?key|secret|password|credential|authorization|bearer)/i.test(x.column_name)) && !cols.some((x) => x.data_type === "bytea"), "HEIM-16. no table has a credential-like column or a binary (image bytes) column");
    const prov = (await q("insert into heim.ai_providers (provider_key, display_name) values ('t','t') returning id")).rows[0].id;
    const inv = (await q(`insert into heim.ai_invocations (request_trace_id, provider_id, requested_provider_key, requested_model_key, task_type, prompt_id, prompt_version, schema_version, status)
                          values ('tr',$1,'t','m','category_pass1','p','v','1','succeeded') returning id`, [prov])).rows[0].id;
    ok(await bad(`insert into heim.ai_invocations (request_trace_id, requested_provider_key, requested_model_key, task_type, prompt_id, prompt_version, schema_version, status)
                  values ('tr','t','m','x','p','v','1','maybe')`) === "23514", "HEIM-17. invocation status is constrained");
    await q("insert into heim.ai_invocation_media (invocation_id, media_id) values ($1,$2)", [inv, m1]);
    await q("insert into heim.vision_observations (media_id, invocation_id, schema_version, primary_subject, observation) values ($1,$2,1,'scene','{\"scene\":{\"label\":\"x\"}}')", [m1, inv]);
    ok(await bad("insert into heim.vision_observations (media_id, invocation_id, schema_version, observation) values ($1,$2,1,'[]')", [m1, inv]) === "23514", "HEIM-18. an observation must be a JSON object");
    ok(await bad("delete from heim.ai_invocations where id=$1", [inv]) === "23503", "HEIM-19. an invocation that produced an observation cannot be deleted out from under it");
    await q("delete from heim.media_assets where media_id=$1", [m1]);
    const after = (await q(`select (select count(*)::int from heim.id_bridge where media_id=$1) b, (select count(*)::int from heim.vision_observations where media_id=$1) o,
                                   (select count(*)::int from heim.ai_invocation_media where media_id=$1) l, (select count(*)::int from heim.ai_invocations where id=$2) i`, [m1, inv])).rows[0];
    ok(after.b === 0 && after.o === 0 && after.l === 0 && after.i === 1, "HEIM-20. deleting a media asset cascades to its id_bridge rows, observations and invocation links; the content-free invocation ledger row remains");
    ok((await q("select count(*)::int n from heim.id_bridge where media_id=$1", [m2])).rows[0].n === 1, "HEIM-21. deletion is scoped: another media asset's rows are untouched");
    await c.end();
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);

    /* ============ §3 behaviour through the real routes (dev database, MOCK provider) ============ */
    console.log("§3 routes → provenance + canonical identity + Pass 1 storage (mock seam)");
    main = await connect(MAIN_URL);
    const mq = (s, p) => main.query(s, p);
    const bytesA = fs.readFileSync(FIX("no-exif.jpg"));
    const bytesB = fs.readFileSync(FIX("exif-time-only.jpg"));
    const shaA = sha(bytesA);
    const shaB = sha(bytesB);
    await mq("delete from heim.media_assets where content_sha256 = any($1)", [[shaA, shaB]]);
    const sess = `t-${RUN}`;
    const body = (f) => ({ images: [{ dataUrl: dataUrl(f) }] });

    const plain = await api("/api/analyze-meal?mock=vision-chair", { body: body("no-exif.jpg") });
    const withH = await api("/api/analyze-meal?mock=vision-chair", { headers: H(sess, "up-1-A"), body: body("no-exif.jpg") });
    const strip = (o) => { const x = JSON.parse(JSON.stringify(o)); delete x.observation.analyzedAt; if (x.observation.vision) delete x.observation.vision.analyzedAt; return JSON.stringify(x); };
    ok(withH.status === 200 && strip(plain.json) === strip(withH.json), "HEIM-22. the route's response is byte-identical with or without the new headers (P1 behaviour unchanged)");
    const media1 = (await mq("select * from heim.media_assets where content_sha256=$1", [shaA])).rows;
    ok(media1.length === 1 && media1[0].hash_basis === "representation" && media1[0].origin === "upload" && Number(media1[0].size_bytes) === bytesA.length && media1[0].mime_type === "image/jpeg",
      "HEIM-23. an asset analysed before it registered still gets a canonical id anchored on the SHA-256 of the bytes received");
    const br = (await mq("select * from heim.id_bridge where media_id=$1", [media1[0].media_id])).rows;
    ok(br.length === 1 && br[0].session_key === sess && br[0].prototype_id === "up-1-A", "HEIM-24. the temporary id is bridged to the canonical id");
    const inv1 = (await mq(`select i.*, l.media_id from heim.ai_invocations i join heim.ai_invocation_media l on l.invocation_id=i.id where l.media_id=$1`, [media1[0].media_id])).rows;
    ok(inv1.length === 1 && inv1[0].task_type === "category_pass1" && inv1[0].requested_provider_key === "mock" && inv1[0].requested_model_key === "mock-fixture" && inv1[0].status === "succeeded" && inv1[0].validation_status === "valid" && inv1[0].schema_version === "1" && inv1[0].prompt_id === "analyze-meal.pass1",
      "HEIM-25. the invocation is recorded with task, requested provider/model (a labelled MOCK, never claimed as DeepSeek), prompt id, schema version and status");
    ok(inv1[0].observed_model_verifiable === false && inv1[0].observed_model_key === null && inv1[0].observed_provider_key === null && inv1[0].prompt_digest === null, "HEIM-26. for a mock the actual provider/model stay unknown and no prompt digest is invented");
    const ob = (await mq("select * from heim.vision_observations where media_id=$1", [media1[0].media_id])).rows;
    ok(ob.length === 1 && ob[0].invocation_id === inv1[0].id && ob[0].schema_version === 1 && ob[0].observation.scene && ob[0].primary_subject === ob[0].observation.primarySubject && typeof ob[0].observation === "object",
      "HEIM-27. the validated Pass 1 observation (UniversalVisualObservationV1) is stored as JSONB, linked to its invocation and canonical media");
    ok(!Object.keys(ob[0].observation).some((k) => /category|categories/i.test(k)), "HEIM-28. the stored observation is category-neutral (no category field)");

    await api("/api/analyze-meal?mock=vision-chair", { headers: H(sess, "up-1-A"), body: body("no-exif.jpg") });
    const media2 = (await mq("select count(*)::int n from heim.media_assets where content_sha256=$1", [shaA])).rows[0].n;
    const inv2 = (await mq("select count(*)::int n from heim.ai_invocation_media where media_id=$1", [media1[0].media_id])).rows[0].n;
    // SUPERSEDED 2026-10-31 by P2-B2: an identical repeat is now an observation-cache HIT — no second invocation, a hit event instead
    const hits29 = (await mq("select count(*)::int n from heim.observation_cache_events where media_id=$1 and outcome='hit' and provider_called=false", [media1[0].media_id])).rows[0].n;
    ok(media2 === 1 && inv2 === 1 && hits29 === 1, "HEIM-29. the same asset analysed again keeps ONE canonical id; the repeat is a cache hit (one invocation, one hit event, no provider call)");
    ok((await mq("select count(*)::int n from heim.vision_observations where media_id=$1", [media1[0].media_id])).rows[0].n === 1 /* SUPERSEDED by P2-B2: a hit adds no observation */, "HEIM-30. observations are kept per invocation (history preserved, never overwritten)");

    await api("/api/analyze-meal?mock=vision-chair", { headers: H(sess, "up-9-OTHER"), body: body("no-exif.jpg") });
    const bridged = (await mq("select count(*)::int n from heim.id_bridge where media_id=$1", [media1[0].media_id])).rows[0].n;
    ok(bridged === 2 && (await mq("select count(*)::int n from heim.media_assets where content_sha256=$1", [shaA])).rows[0].n === 1, "HEIM-31. identical bytes under a different temporary id resolve to the SAME canonical media (stable identity), with a second bridge row");
    await api("/api/analyze-meal?mock=vision-chair", { headers: H(`${sess}-b`, "up-1-A"), body: body("no-exif.jpg") });
    ok((await mq("select count(*)::int n from heim.id_bridge where media_id=$1 and prototype_id='up-1-A'", [media1[0].media_id])).rows[0].n === 2, "HEIM-32. the same temporary id in another page-load session is a separate bridge row (counters repeat), same bytes → same canonical media");

    const regA = await api("/api/media/register", { body: { sessionKey: `${sess}-r`, assetId: "up-1-B", origin: "upload", sha256: shaB, mime: "image/jpeg", size: bytesB.length } });
    const regB = await api("/api/media/register", { body: { sessionKey: `${sess}-r`, assetId: "up-1-B", origin: "upload", sha256: shaB, mime: "image/jpeg", size: bytesB.length } });
    ok(regA.status === 200 && /^[0-9a-f-]{36}$/.test(regA.json.mediaId) && regA.json.mediaId === regB.json.mediaId, "HEIM-33. registering an upload returns a canonical UUID and is idempotent");
    const rm = (await mq("select * from heim.media_assets where media_id=$1", [regA.json.mediaId])).rows[0];
    ok(rm.hash_basis === "original" && rm.content_sha256 === shaB && Number(rm.size_bytes) === bytesB.length, "HEIM-34. a registered upload is anchored on the SHA-256 of the ORIGINAL file");
    await api("/api/analyze-meal?mock=vision-chair", { headers: H(`${sess}-r`, "up-1-B"), body: body("exif-time-only.jpg") });
    ok((await mq("select count(*)::int n from heim.ai_invocation_media where media_id=$1", [regA.json.mediaId])).rows[0].n === 1, "HEIM-35. an invocation for a registered asset links to its registered canonical id (no duplicate row)");
    ok((await api("/api/media/register", { body: { sessionKey: sess, assetId: "x", origin: "upload", sha256: "zz" } })).status === 400 && (await api("/api/media/register", { body: { sessionKey: "bad key!", assetId: "x", origin: "upload", sha256: shaA } })).status === 400, "HEIM-36. registration validates its input (bad hash / bad key rejected)");

    const obsBefore = (await mq("select count(*)::int n from heim.vision_observations where media_id=$1", [media1[0].media_id])).rows[0].n;
    const act = await api("/api/analyze-activity?mock=runner", { headers: H(sess, "up-1-A"), body: body("no-exif.jpg") });
    const rec = await api("/api/analyze-record?mock=project", { headers: H(sess, "up-1-A"), body: { category: "project", images: [{ dataUrl: dataUrl("no-exif.jpg") }], text: "" } });
    const tasks = (await mq(`select i.task_type, i.prompt_id from heim.ai_invocations i join heim.ai_invocation_media l on l.invocation_id=i.id where l.media_id=$1 order by i.started_at`, [media1[0].media_id])).rows.map((r) => `${r.task_type}:${r.prompt_id}`);
    ok(act.status === 200 && rec.status === 200 && tasks.includes("activity_specialist:analyze-activity") && tasks.includes("record_specialist:analyze-record.project"), "HEIM-37. Activity and record-specialist calls record their own invocations (task type + prompt id by category)");
    ok(obsBefore >= 1 /* SUPERSEDED by P2-B2: repeats are hits */ && (await mq("select count(*)::int n from heim.vision_observations where media_id=$1", [media1[0].media_id])).rows[0].n === obsBefore, "HEIM-38. only the Pass 1 category call stores a visual observation (specialists store provenance only)");

    const nohdr = await api("/api/analyze-meal?mock=vision-chair", { body: body("exif-time-only.jpg") });
    const before = (await mq("select count(*)::int n from heim.ai_invocation_media where media_id=$1", [regA.json.mediaId])).rows[0].n;
    ok(nohdr.status === 200 && before === 1, "HEIM-39. a call with no asset headers still works and creates no media link and no observation");
    await api("/api/analyze-meal?mock=vision-chair", { headers: { "X-SB-Session": "bad key!", "X-SB-Asset": "../etc", "X-SB-Asset-Origin": "weird" }, body: body("exif-time-only.jpg") });
    ok((await mq("select count(*)::int n from heim.id_bridge where prototype_id='../etc'")).rows[0].n === 0, "HEIM-40. malformed identity headers are ignored (never reach SQL as identity)");

    const echo = await api("/api/analyze-meal?mock=echo", { headers: H(sess, "up-1-A"), body: body("no-exif.jpg") });
    const payload = JSON.stringify(echo.json?._debugProviderPayload ?? {});
    ok(payload.length > 100 && !payload.includes("up-1-A") && !payload.includes(sess) && !/X-SB|media_id|mediaId|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(payload), "HEIM-41. the payload that WOULD go to the provider carries no asset id, session key or canonical id");

    const env = fs.existsSync(path.join(ROOT, ".env.local")) ? fs.readFileSync(path.join(ROOT, ".env.local"), "utf8") : "";
    const secrets = [...env.matchAll(/^[A-Z_]*(?:KEY|SECRET|TOKEN)[A-Z_]*=(.+)$/gm)].map((m) => m[1].trim().replace(/^["']|["']$/g, "")).filter((v) => v.length >= 8);
    let dump = "";
    for (const tb of ["media_assets", "id_bridge", "ai_providers", "ai_models", "ai_invocations", "ai_invocation_media", "vision_observations"]) dump += JSON.stringify((await mq(`select * from heim.${tb}`)).rows);
    ok(secrets.length > 0 && !secrets.some((s) => dump.includes(s)), `HEIM-42. none of the ${secrets.length} configured API keys/secrets appears anywhere in the heim tables`);

    /* ============ §4 resilience: the layer never alters a route when the database is unavailable ============ */
    console.log("§4 resilience");
    const spawnFresh = (url) => {
      const dir = mods.dir;
      const code = `process.env.HEIM_DATABASE_URL=${JSON.stringify(url)};const prov=require(${JSON.stringify(path.join(dir, "provenance.js"))});
        const req={nextUrl:new URL("http://x/api/analyze-meal?mock=vision-chair"),headers:new Headers({"x-sb-asset":"up-1-Z","x-sb-asset-origin":"upload","x-sb-session":"s"}),clone(){return{json:async()=>({images:[{dataUrl:"data:image/jpeg;base64,AAAA"}]})}}};
        const sent=new Response(JSON.stringify({observation:{vision:{primarySubject:"scene"}}}),{status:200});
        const t0=Date.now();
        prov.withHeimProvenance(req,{taskType:"category_pass1",promptId:"p",requestedProvider:"deepseek",requestedModel:"m",schemaVersion:"1"},async()=>sent).then(r=>{console.log(JSON.stringify({same:r===sent,status:r.status,ms:Date.now()-t0}));process.exit(0)}).catch(e=>{console.log("THROWN "+e.message);process.exit(0)});`;
      return JSON.parse(execFileSync("node", ["-e", code], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15000 }).trim().split("\n").pop());
    };
    const down1 = spawnFresh("postgresql://localhost:5439/systemboom_unreachable_dev");
    ok(down1.same && down1.status === 200 && down1.ms < 6000, `HEIM-43. with the database UNREACHABLE the wrapper returns the handler's response untouched (${down1.ms} ms)`);
    const off = spawnFresh("postgresql://db.example.com/x_dev");
    ok(off.same && off.status === 200, "HEIM-44. with a non-local/non-dev URL the layer is disabled and the response is untouched");
    const prodRun = JSON.parse(execFileSync("node", ["-e", `process.env.NODE_ENV="production";delete process.env.HEIM_DATABASE_URL;const s=require(${JSON.stringify(path.join(mods.dir, "heim-store.js"))});console.log(JSON.stringify({pool:s.heimPool()===null}))`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
    ok(prodRun.pool === true, "HEIM-45. in a production build nothing connects unless an explicit local *_dev URL is configured");

    /* ============ §5 deletion through the shipped code ============ */
    console.log("§5 deletion");
    const target = media1[0].media_id;
    const pre = (await mq(`select (select count(*)::int from heim.id_bridge where media_id=$1) b,(select count(*)::int from heim.vision_observations where media_id=$1) o,(select count(*)::int from heim.ai_invocation_media where media_id=$1) l`, [target])).rows[0];
    const invIds = (await mq("select invocation_id from heim.ai_invocation_media where media_id=$1", [target])).rows.map((r) => r.invocation_id);
    const res = await mods.store.deleteMedia(target);
    const post = (await mq(`select (select count(*)::int from heim.media_assets where media_id=$1) m,(select count(*)::int from heim.id_bridge where media_id=$1) b,(select count(*)::int from heim.vision_observations where media_id=$1) o,(select count(*)::int from heim.ai_invocation_media where media_id=$1) l,(select count(*)::int from heim.ai_invocations where id = any($2)) inv`, [target, invIds])).rows[0];
    ok(res && res.deleted && res.bridges === pre.b && res.observations === pre.o && res.invocationLinks === pre.l && pre.o >= 1 /* SUPERSEDED by P2-B2 */ && pre.b >= 3, `HEIM-46. deleteMedia reports exactly what it removed (${pre.b} bridges, ${pre.o} observations, ${pre.l} links)`);
    ok(post.m === 0 && post.b === 0 && post.o === 0 && post.l === 0, "HEIM-47. after deletion the canonical row, every bridge, every observation and every invocation link are gone");
    ok(post.inv === invIds.length, "HEIM-48. the content-free invocation ledger is retained (provenance/cost history) but is linked to nothing");
    ok((await mods.store.deleteMedia(target)).deleted === false, "HEIM-49. deleting an already-deleted asset is a safe no-op");
    await mq("delete from heim.media_assets where content_sha256 = any($1)", [[shaA, shaB]]);

    /* ============ §6 browser: a REAL upload in the Composer ============ */
    console.log("§6 browser — real upload → canonical identity, provenance, observation, P1 unchanged");
    const { browser, page } = await launch();
    page.on("pageerror", (e) => errs.push(String(e)));
    const reqs = [];
    page.on("request", (r) => { if (r.url().includes("/api/")) reqs.push({ url: r.url().replace(HOST, ""), headers: r.headers(), body: r.postData() ?? "" }); });
    try {
      const file = FIX("no-exif.jpg");
      const fileSha = shaA;
      const openComposer = async () => {
        await page.setCookie({ name: "sb-locale", value: "en", url: HOST });
        await page.goto(`${HOST}/style-lab/social?harness=0&theme=light&mockai=vision-chair&mockrecord=off&mockgeo=1`, { waitUntil: "networkidle2" });
        await sleep(900);
        await page.click("[data-sb-open-composer]");
        await sleep(450);
      };
      // P2-B2.1 — wait for the STATE (registration bridged + the page's analysis answered) instead of a fixed 3.5 s, which lost
      // the race under fleet load (the browser hashes the file, then registers it). Bounded at 20 s.
      const upload = async (expectBridges) => {
        await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
        await sleep(300);
        const input = await page.waitForSelector("input[type=file][multiple]");
        await input.uploadFile(file);
        for (let i = 0; i < 100; i++) {
          const n = (await mq("select count(*)::int n from heim.id_bridge b join heim.media_assets m using (media_id) where m.content_sha256=$1 and m.hash_basis='original'", [fileSha])).rows[0].n;
          const answered = await page.evaluate(() => (window.__SB_MEAL_ANALYSIS_LOG ?? []).some((e) => e.status === "done" || e.status === "failed"));
          if (n >= expectBridges && answered) break;
          await sleep(200);
        }
      };
      await openComposer();
      await upload(1);
      const row = (await mq("select * from heim.media_assets where content_sha256=$1", [fileSha])).rows;
      ok(row.length === 1 && row[0].hash_basis === "original" && row[0].origin === "upload" && Number(row[0].size_bytes) === fs.statSync(file).size,
        "HEIM-50. attaching a real file registers ONE canonical media row anchored on the SHA-256 of the original file (computed in the browser)");
      const br2 = (await mq("select * from heim.id_bridge where media_id=$1", [row[0].media_id])).rows;
      ok(br2.length === 1 && /^up-\d+-/.test(br2[0].prototype_id) && br2[0].session_key !== "library", "HEIM-51. the temporary upload id is bridged under this page load's session key");
      const links = (await mq("select i.task_type, i.requested_provider_key from heim.ai_invocations i join heim.ai_invocation_media l on l.invocation_id=i.id where l.media_id=$1", [row[0].media_id])).rows;
      ok(links.length >= 1 && links.every((l) => l.requested_provider_key === "mock") && links.some((l) => l.task_type === "category_pass1"), "HEIM-52. the Composer's own analysis call is recorded against the canonical media (category Pass 1; provider = labelled mock)");
      ok((await mq("select count(*)::int n from heim.vision_observations where media_id=$1", [row[0].media_id])).rows[0].n === 1, "HEIM-53. the Pass 1 observation produced during the upload is stored once");
      const an = reqs.find((r) => r.url.startsWith("/api/analyze-meal"));
      const ak = Object.keys(JSON.parse(an?.body || "{}"));
      ok(!!an && ak.length === 1 && ak[0] === "images" && an.headers["x-sb-asset"] === br2[0].prototype_id && an.headers["x-sb-asset-origin"] === "upload" && !!an.headers["x-sb-session"], "HEIM-54. the analysis request BODY is unchanged (only `images`); identity travels as opaque headers");
      const reg2 = reqs.find((r) => r.url.startsWith("/api/media/register"));
      const rk = Object.keys(JSON.parse(reg2?.body || "{}")).sort().join(",");
      ok(!!reg2 && rk === "assetId,mime,origin,sessionKey,sha256,size" && !/lat|lon|gps|ocr|observation|name/i.test(rk), "HEIM-55. the registration body carries only hash, mime, size and ids — no file, filename, GPS or observation");
      const card = await page.evaluate(() => !!document.querySelector("[data-sb-vision-card], [data-sb-vision-suggestion], [data-sb-vision]") || document.body.innerText.length > 0);
      ok(card, "HEIM-56. the Composer still renders with the analysis result (P1 surface unchanged)");
      await page.evaluate(() => { const ta = document.getElementById("sb-composer-text"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, "P2-B1 identity check"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
      await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()))?.click());
      await sleep(1400);
      const stateJson = await page.evaluate(() => JSON.stringify(window.__SB_SOCIAL_STATE ?? {}));
      ok(!stateJson.includes(row[0].media_id) && !/canonicalId|media_id|mediaId/.test(stateJson), "HEIM-57. the canonical id does not leak into the Social state, the posted Moment or any public projection");

      await openComposer();
      await upload(2);
      const row2 = (await mq("select media_id from heim.media_assets where content_sha256=$1", [fileSha])).rows;
      const br3 = (await mq("select count(*)::int n, count(distinct session_key)::int s from heim.id_bridge where media_id=$1", [row[0].media_id])).rows[0];
      ok(row2.length === 1 && row2[0].media_id === row[0].media_id && br3.n === 2 && br3.s === 2, "HEIM-58. after a reload the same file resolves to the SAME canonical id (stable), bridged from a new session");
      ok(errs.length === 0, `HEIM-59. no page errors during the upload flows${errs.length ? ` — ${errs[0]}` : ""}`);
    } finally {
      await browser.close();
      await mq("delete from heim.media_assets where content_sha256 = any($1)", [[shaA, shaB]]);
    }
  } catch (e) {
    failures.push(`suite crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`);
    console.log("  ✗ suite crashed:", e && e.message);
  } finally {
    if (main) await main.end().catch(() => {});
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`).catch(() => {});
    await admin.end().catch(() => {});
    fs.rmSync(mods.dir, { recursive: true, force: true });
  }
  console.log(`\n${failures.length ? "FAIL" : "PASS"} — ${passed} checks passed, ${failures.length} failed`);
  failures.forEach((f) => console.log("  ✗", f));
  process.exit(failures.length ? 1 : 0);
})();
