/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SIE P2-B2 — deterministic OFFLINE observation-cache benchmark (MOCK provider only; no paid call can occur — the dev
 * server is in mock mode). Measures what this machine actually does: miss vs hit latency, server lookup latency, hit
 * ratio over a repeat workload and duplicate-call prevention under concurrency. It does NOT measure provider latency or
 * cost: the mock provider answers in milliseconds, so the provider time a real hit avoids is reported separately from the
 * live rows the ledger already holds (never invented).
 *
 *   node prototype-tests/_cache-benchmark.js     → prints JSON, writes prototype-evidence/p2b2-observation-cache/benchmark.json
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const HOST = "http://localhost:3210";
const dir = path.join(__dirname, "fixtures");
const imgs = [...fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).map((f) => path.join(dir, f)),
  ...(fs.existsSync(path.join(dir, "scenes")) ? fs.readdirSync(path.join(dir, "scenes")).filter((f) => f.endsWith(".jpg")).map((f) => path.join(dir, "scenes", f)) : [])];
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
(async () => {
  const db = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
  await db.connect();
  const bufs = imgs.map((f) => fs.readFileSync(f));
  await db.query("delete from heim.media_assets where content_sha256 = any($1)", [bufs.map(sha)]);
  const S = `bench-${Date.now().toString(36)}`;
  const call = async (i, extra = {}) => {
    const t0 = performance.now();
    const r = await fetch(`${HOST}/api/analyze-meal?mock=vision-chair`, { method: "POST", headers: { "Content-Type": "application/json", "X-SB-Session": S, "X-SB-Asset": `up-${i}-bench`, "X-SB-Asset-Origin": "upload", "X-SB-Entry": "social_composer", ...extra }, body: JSON.stringify({ images: [{ dataUrl: `data:image/jpeg;base64,${bufs[i].toString("base64")}` }] }) });
    await r.json();
    return { cache: r.headers.get("x-sb-observation-cache"), ms: performance.now() - t0 };
  };
  const miss = [], hit = [];
  for (let i = 0; i < bufs.length; i++) { const a = await call(i); (a.cache === "miss" ? miss : hit).push(a.ms); }
  for (let round = 0; round < 3; round++) for (let i = 0; i < bufs.length; i++) { const a = await call(i); (a.cache === "hit" ? hit : miss).push(a.ms); }
  const conc = await Promise.all(Array.from({ length: 10 }, () => call(0, { "x-sb-mock-latency": "800" })));
  const media = (await db.query("select media_id from heim.media_assets where content_sha256 = any($1)", [bufs.map(sha)])).rows.map((r) => r.media_id);
  const ev = (await db.query("select outcome, provider_called, lookup_ms from heim.observation_cache_events where media_id = any($1)", [media])).rows;
  const invocations = (await db.query("select count(distinct invocation_id)::int n from heim.ai_invocation_media where media_id = any($1)", [media])).rows[0].n;
  const live = (await db.query("select count(*)::int n, round(avg(latency_ms))::int avg_ms, min(latency_ms) min_ms, max(latency_ms) max_ms, round(avg(input_tokens + output_tokens))::int avg_tokens from heim.ai_invocations where requested_provider_key='deepseek' and task_type='category_pass1' and status='succeeded'")).rows[0];
  const lookups = ev.filter((e) => e.lookup_ms !== null).map((e) => e.lookup_ms);
  const out = {
    note: "mock provider only — provider latency/cost are NOT measured here",
    images: bufs.length,
    workload: `${bufs.length} distinct images, analysed once then 3 more times each, then 10 concurrent requests for one image`,
    requests: miss.length + hit.length + conc.length,
    misses: miss.length,
    hits: hit.length,
    hitRatioRepeatWorkload: +(hit.length / (miss.length + hit.length)).toFixed(4),
    providerInvocations: invocations,
    providerCallsAvoided: miss.length + hit.length + conc.length - invocations,
    concurrent: { requests: conc.length, outcomes: conc.reduce((m, c) => ((m[c.cache] = (m[c.cache] || 0) + 1), m), {}), providerCalls: ev.filter((e) => e.provider_called).length - miss.length },
    latencyMs: {
      missTotal: { p50: +pct(miss, 50).toFixed(1), p95: +pct(miss, 95).toFixed(1) },
      hitTotal: { p50: +pct(hit, 50).toFixed(1), p95: +pct(hit, 95).toFixed(1) },
      serverLookup: { p50: pct(lookups, 50), p95: pct(lookups, 95) },
    },
    realProviderReference: { source: "existing live category_pass1 rows in heim.ai_invocations (recorded, not re-run)", ...live },
  };
  await db.query("delete from heim.media_assets where content_sha256 = any($1)", [bufs.map(sha)]);
  await db.end();
  const ev2 = path.join(__dirname, "..", "prototype-evidence", "p2b2-observation-cache");
  fs.mkdirSync(ev2, { recursive: true });
  fs.writeFileSync(path.join(ev2, "benchmark.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
