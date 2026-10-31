/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SIE P2-B2 · ISO-001 / ISO-012 evidence — snapshot of the dev server's provider counters, the non-mock ledger count and
 * the dev-server log length. Run BEFORE and AFTER a fleet: `node prototype-tests/_provider-net-snapshot.js > before.json`.
 * Pass a previous snapshot file to print the delta and the gate's BLOCKED lines since then.
 */
const path = require("path");
const fs = require("fs");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const LOG = path.join(__dirname, "..", ".claude", "dev-server.log");
(async () => {
  const st = await (await fetch("http://localhost:3210/api/intelligence/status")).json();
  const c = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
  await c.connect();
  const live = (await c.query("select count(*)::int n from heim.ai_invocations where requested_provider_key <> 'mock'")).rows[0].n;
  const mock = (await c.query("select count(*)::int n from heim.ai_invocations where requested_provider_key = 'mock'")).rows[0].n;
  await c.end();
  const logBytes = fs.existsSync(LOG) ? fs.statSync(LOG).size : 0;
  const snap = { at: new Date().toISOString(), mode: st.mode, allowed: st.net.allowed, blocked: st.net.blocked, ledgerNonMock: live, ledgerMock: mock, logBytes };
  const prevFile = process.argv[2];
  if (!prevFile) { console.log(JSON.stringify(snap)); return; }
  const prev = JSON.parse(fs.readFileSync(prevFile, "utf8"));
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const tail = fs.readFileSync(LOG).subarray(prev.logBytes).toString("utf8");
  const blockedLines = tail.split("\n").filter((l) => l.includes("[provider-gate] BLOCKED"));
  const unmocked = tail.split("\n").filter((l) => /^ (POST \/api\/(analyze-(meal|activity|record)|food-facts(-packaged)?) |GET \/api\/geocode\?)/.test(l) && !/[?&]mock=/.test(l));
  console.log(JSON.stringify({
    mode: snap.mode,
    allowedProviderRequests: sum(snap.allowed) - sum(prev.allowed),
    blockedProviderRequests: sum(snap.blocked) - sum(prev.blocked),
    newNonMockLedgerRows: snap.ledgerNonMock - prev.ledgerNonMock,
    newMockLedgerRows: snap.ledgerMock - prev.ledgerMock,
    unmockedProviderRouteRequests: unmocked.length,
    blockedBy: blockedLines.reduce((m, l) => { const k = (/from (\S+)/.exec(l) || [])[1] + " " + ((/page=\/[^?]*\?([^ ]*)/.exec(l) || [])[1] || "").replace(/&?(harness|theme|w)=[^&]*/g, "").slice(0, 120); m[k] = (m[k] || 0) + 1; return m; }, {}),
  }, null, 2));
})();
