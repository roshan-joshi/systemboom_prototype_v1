/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SYSTEMBOOM SIE P2-B2 · GATE 1 — ZERO-BILLING PROVIDER ISOLATION (ISO-001…ISO-012).
 *
 * Proves that no automated run can reach a billed provider: the dev server is in MOCK mode by default, every outbound
 * provider request without an approved fixture fails closed BEFORE the network, an API key never enables live calls,
 * live mode cannot be switched on by accident, and the public `?mock=` seam is closed on production/live/non-local
 * servers. This suite makes NO live provider call: transport checks run against the real gate code with the network
 * path refused, and the dev server's own counters prove zero allowed requests.
 *
 *   node prototype-tests/provider-isolation.js          (dev server on :3210, mock mode)
 *
 * ISO-001 and ISO-012 (whole-suite reruns) are measured by `_provider-net-snapshot.js` before/after the fleet.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawnSync } = require("child_process");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));

const ROOT = path.join(__dirname, "..");
const HOST = "http://localhost:3210";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const IMG = `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, "fixtures", "no-exif.jpg")).toString("base64")}`;

function transpileGate() {
  const dir = path.join(ROOT, "node_modules", ".sb-gate-test");
  fs.mkdirSync(dir, { recursive: true });
  const src = fs.readFileSync(path.join(ROOT, "src/lib/intelligence/provider-gate.ts"), "utf8");
  fs.writeFileSync(path.join(dir, "provider-gate.js"), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
  return dir;
}
/** run a snippet against the REAL gate in a fresh process with exactly the given environment (no inherited keys/mode) */
function inProc(dir, env, code) {
  const base = { PATH: process.env.PATH, HOME: process.env.HOME };
  const r = spawnSync("node", ["-e", `const G=require(${JSON.stringify(path.join(dir, "provider-gate.js"))});(async()=>{${code}})().catch(e=>{console.log(JSON.stringify({thrown:e.name,code:e.code,msg:String(e.message).slice(0,200)}))})`], { env: { ...base, ...env }, encoding: "utf8", timeout: 30000 });
  const line = (r.stdout || "").trim().split("\n").pop();
  try { return JSON.parse(line); } catch { return { raw: r.stdout, err: r.stderr }; }
}
const status = async () => (await fetch(`${HOST}/api/intelligence/status`)).json();
async function post(route, body, q = "") {
  const r = await fetch(`${HOST}${route}${q}`, { method: "POST", headers: { "Content-Type": "application/json", Referer: `${HOST}/style-lab/social?suite=provider-isolation` }, body: JSON.stringify(body) });
  return { status: r.status, blocked: r.headers.get("x-sb-provider-blocked"), json: await r.json().catch(() => null) };
}
function rawGet(pathname, hostHeader) {
  return new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port: 3210, path: pathname, method: "GET", headers: { Host: hostHeader } }, (res) => {
      let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => resolve({ status: res.statusCode, blocked: res.headers["x-sb-provider-blocked"], body: b }));
    });
    req.on("error", () => resolve({ status: 0 }));
    req.end();
  });
}

(async () => {
  const dir = transpileGate();
  const db = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
  await db.connect();
  const liveRows = async () => (await db.query("select count(*)::int n from heim.ai_invocations where requested_provider_key <> 'mock'")).rows[0].n;
  try {
    const live0 = await liveRows();
    const s0 = await status();
    console.log("§0 the running dev server");
    ok(s0.mode === "mock", `the :3210 dev server is in MOCK mode (${s0.reason}) although .env.local holds real provider keys`);

    /* ---------- ISO-002 / 003 / 010 — the real gate, isolated processes ---------- */
    console.log("§1 gate semantics (real provider-gate.ts, fresh processes, network refused before any socket)");
    const key = { DEEPSEEK_API_KEY: "sk-test-not-a-real-key-000000", USDA_FDC_API_KEY: "usda-test-key" };
    const direct = inProc(dir, key, `const c=G.deepseekClient("sk-test","iso-002");console.log(JSON.stringify({constructed:true}))`);
    ok(direct.thrown === "LiveProviderBlockedError" && direct.code === "LIVE_PROVIDER_BLOCKED", "ISO-002. a direct DeepSeek adapter call is rejected in mock mode (LiveProviderBlockedError before any request)");
    const viaFetch = inProc(dir, key, `let n=0;const real=globalThis.fetch;globalThis.fetch=(...a)=>{n++;return real(...a)};try{await G.gatedFetch("deepseek","iso-002")("https://api.deepseek.com/chat/completions",{method:"POST"})}catch(e){console.log(JSON.stringify({thrown:e.name,network:n,stats:G.providerNetStats()}));return}console.log(JSON.stringify({sent:true,network:n}))`);
    ok(viaFetch.thrown === "LiveProviderBlockedError" && viaFetch.network === 0 && viaFetch.stats.blocked.deepseek === 1 && !viaFetch.stats.allowed.deepseek, "ISO-002b. the gated transport refuses before the network (0 fetches reached), counted as blocked");
    const sdk = inProc(dir, { ...key, SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls" },
      `const c=G.deepseekClient("sk-test","iso-008");process.env.SB_PROVIDER_MODE="";let n=0;const real=globalThis.fetch;globalThis.fetch=(...a)=>{n++;return real(...a)};try{await c.chat.completions.create({model:"deepseek-flash",messages:[{role:"user",content:"x"}]},{maxRetries:0})}catch(e){console.log(JSON.stringify({thrown:e.name,cause:e.cause&&e.cause.name,network:n,stats:G.providerNetStats()}));return}console.log(JSON.stringify({sent:true}))`);
    ok(sdk.network === 0 && (sdk.cause === "LiveProviderBlockedError" || sdk.thrown === "LiveProviderBlockedError") && sdk.stats.blocked.deepseek >= 1 && !sdk.stats.allowed.deepseek,
      "ISO-008. a client built while live cannot send once the server is no longer live: the SDK's own request fails closed at the transport (0 network)");
    const keyOnly = inProc(dir, key, `console.log(JSON.stringify(G.decideMode(process.env)))`);
    ok(keyOnly.mode === "mock", "ISO-003. configured API keys alone never enable live calls");
    const matrix = [
      [{ SB_PROVIDER_MODE: "live" }, "mock", "live requested without confirmation"],
      [{ SB_PROVIDER_MODE: "LIVE", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls" }, "mock", "wrong case"],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "yes" }, "mock", "wrong confirmation"],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls", NODE_ENV: "test" }, "mock", "NODE_ENV=test"],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls", CI: "1" }, "mock", "CI"],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls", SB_TEST_RUN: "1" }, "mock", "SB_TEST_RUN"],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls" }, "live", "explicit live (both variables)"],
    ];
    const results = matrix.map(([env]) => inProc(dir, { ...key, ...env }, `console.log(JSON.stringify(G.decideMode(process.env)))`).mode);
    ok(results.every((m, i) => m === matrix[i][1]), `ISO-010. live mode activates ONLY with both explicit variables, never under test/CI (${matrix.map((m, i) => `${m[2]}→${results[i]}`).join("; ")})`);
    const devLiveCI = spawnSync("node", [path.join(ROOT, "scripts/dev-live.mjs")], { env: { ...process.env, CI: "1" }, encoding: "utf8", input: "live\n" });
    const devLiveNoTTY = spawnSync("node", [path.join(ROOT, "scripts/dev-live.mjs")], { env: { PATH: process.env.PATH, HOME: process.env.HOME }, encoding: "utf8", input: "live\n" });
    ok(devLiveCI.status === 1 && devLiveNoTTY.status === 1 && /refused/.test(devLiveNoTTY.stderr), "ISO-010b. `npm run dev:live` refuses under CI and refuses a non-interactive start (cannot be launched by a script or suite)");
    const verify = spawnSync("node", [path.join(__dirname, "_verify-deepseek-live.js")], { env: { PATH: process.env.PATH, HOME: process.env.HOME, DEEPSEEK_API_KEY: "sk-test" }, encoding: "utf8" });
    ok(verify.status === 2 && /refused/.test(verify.stderr), "ISO-010c. the manual live-verification script refuses without explicit live intent, even with a key present");
    const seam = [
      [{}, "localhost:3210", true], [{ NODE_ENV: "production" }, "localhost:3210", false],
      [{ SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls" }, "localhost:3210", false],
      [{}, "example.com", false], [{}, "192.168.1.20:3210", false], [{}, "127.0.0.1:3210", true],
    ].map(([env, host, want]) => inProc(dir, env, `console.log(JSON.stringify({v:G.mockSeamAllowedFor(process.env,${JSON.stringify(host)})}))`).v === want);
    ok(seam.every(Boolean), "ISO-011. the `?mock=` seam is honoured only on a local, non-production, non-live server");

    /* ---------- ISO-008 / 011 against the running server ---------- */
    console.log("§2 every provider route fails closed without a fixture (running dev server)");
    const s1 = await status();
    const routes = [
      ["/api/analyze-meal", { images: [{ dataUrl: IMG }] }, "deepseek", (j) => j.observation === null],
      ["/api/analyze-activity", { images: [{ dataUrl: IMG }] }, "deepseek", (j) => j.observation === null],
      ["/api/analyze-record", { category: "project", images: [{ dataUrl: IMG }], text: "" }, "deepseek", (j) => j.observation && j.observation.category === "project"],
      ["/api/food-facts", { canonicalName: "banana" }, "usda", (j) => j.facts === null],
      ["/api/food-facts-packaged", { canonicalName: "chocolate spread", brand: "Nutella" }, "openfoodfacts", (j) => j.facts === null],
    ];
    for (const [route, body, prov, shape] of routes) {
      const r = await post(route, body);
      ok(r.status === 200 && r.blocked === prov && r.json && r.json.aiBlocked === "LIVE_PROVIDER_BLOCKED" && shape(r.json), `ISO-008. ${route} without a fixture → blocked before the network (${prov}), answered with its ordinary "unavailable" shape + an explicit marker`);
    }
    const geo = await rawGet("/api/geocode?lat=27.7&lon=85.3", "localhost:3210");
    ok(geo.status === 200 && geo.blocked === "nominatim" && /LIVE_PROVIDER_BLOCKED/.test(geo.body), "ISO-008. /api/geocode without a fixture → blocked (nominatim)");
    const s2 = await status();
    const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
    ok(sum(s2.net.allowed) === sum(s1.net.allowed) && sum(s2.net.blocked) - sum(s1.net.blocked) === 6, `ISO-008. the server counted 6 blocked and 0 allowed provider requests (allowed total ${sum(s2.net.allowed)})`);
    const spoof = await rawGet("/api/geocode?lat=27.658875&lon=85.29344166666667&mock=1", "public.example.com");
    const local = await rawGet("/api/geocode?lat=27.658875&lon=85.29344166666667&mock=1", "localhost:3210");
    ok(spoof.blocked === "nominatim" && /LIVE_PROVIDER_BLOCKED/.test(spoof.body) && local.status === 200 && !local.blocked && /Kathmandu/.test(local.body), "ISO-011. a request addressed to a non-local host cannot select a fixture (seam closed → still no network), while a local request can");

    /* ---------- ISO-004…007, 009 — each domain's tests run on fixtures ---------- */
    console.log("§3 domain fixtures + mock provenance");
    const doms = [
      ["ISO-004", "/api/analyze-meal?mock=vision-birthdayparty", { images: [{ dataUrl: IMG }] }, "category_pass1", (j) => j.observation && j.observation.suggestion],
      ["ISO-005", "/api/analyze-meal?mock=meal", { images: [{ dataUrl: IMG }] }, "category_pass1", (j) => j.observation && j.observation.isFood === true],
      ["ISO-006", "/api/analyze-activity?mock=high", { images: [{ dataUrl: IMG }] }, "activity_specialist", (j) => j.observation],
      ["ISO-007", "/api/analyze-record?mock=project", { category: "project", images: [{ dataUrl: IMG }], text: "" }, "record_specialist", (j) => j.observation && j.observation.status],
    ];
    for (const [id, url, body, task, shape] of doms) {
      const before = (await db.query("select count(*)::int n from heim.ai_invocations where task_type=$1 and requested_provider_key='mock'", [task])).rows[0].n;
      // no asset headers on purpose: without an authorized media identity the observation cache is bypassed, so every run
      // exercises the fixture itself (with headers a rerun would be a P2-B2 cache hit and record no invocation)
      const r = await fetch(`${HOST}${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      const after = (await db.query("select count(*)::int n from heim.ai_invocations where task_type=$1 and requested_provider_key='mock'", [task])).rows[0].n;
      ok(r.status === 200 && !r.headers.get("x-sb-provider-blocked") && shape(j) && after === before + 1, `${id}. ${task} runs on a deterministic fixture and is recorded as a MOCK invocation`);
    }
    const mockRow = (await db.query("select requested_provider_key, requested_model_key, observed_provider_key, observed_model_key, observed_model_verifiable, input_tokens from heim.ai_invocations where requested_provider_key='mock' order by started_at desc limit 1")).rows[0];
    ok(mockRow && mockRow.requested_model_key === "mock-fixture" && mockRow.observed_provider_key === null && mockRow.observed_model_key === null && mockRow.observed_model_verifiable === false && mockRow.input_tokens === null, "ISO-009. mock provenance says MOCK: model mock-fixture, no observed provider/model, no tokens");
    const blockedRows = (await db.query("select count(*)::int n from heim.ai_invocations where started_at > now() - interval '5 minutes' and requested_provider_key <> 'mock'")).rows[0].n;
    ok(blockedRows === 0, "ISO-009b. a blocked request is never written as an invocation (nothing reached a provider)");

    /* ---------- ledger + counters over this suite ---------- */
    const s3 = await status();
    ok(sum(s3.net.allowed) === sum(s0.net.allowed) && (await liveRows()) === live0, `ISO-001 (this suite). zero allowed provider-network requests and zero new non-mock ledger rows during the whole suite (allowed ${sum(s3.net.allowed)}; non-mock rows ${live0})`);
  } catch (e) {
    failures.push(`suite crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`);
  } finally {
    await db.end().catch(() => {});
    fs.rmSync(path.join(ROOT, "node_modules", ".sb-gate-test"), { recursive: true, force: true });
  }
  console.log(`\n${failures.length ? "FAIL" : "PASS"} — ${passed} checks passed, ${failures.length} failed`);
  failures.forEach((f) => console.log("  ✗", f));
  process.exit(failures.length ? 1 : 0);
})();
