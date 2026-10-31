#!/usr/bin/env node
/**
 * SYSTEMBOOM SIE P2-B1 — local `heim` migration runner (LOCAL DEVELOPMENT ONLY).
 *
 *   node db/heim/migrate.mjs up        create the dev database if missing, apply pending migrations
 *   node db/heim/migrate.mjs down      roll back the most recently applied migration
 *   node db/heim/migrate.mjs status    list applied / pending migrations
 *
 * Connection: HEIM_DATABASE_URL, default postgresql://localhost:5432/systemboom_intelligence_dev (no password
 * is ever stored). SAFETY: refuses any host other than localhost/127.0.0.1/::1 and any database whose name
 * does not end in `_dev`, so it cannot be pointed at a shared or production database by accident.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DEFAULT_URL = "postgresql://localhost:5432/systemboom_intelligence_dev";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export function assertLocalDevUrl(raw) {
  const u = new URL(raw);
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error(`refused: host "${host}" is not localhost`);
  if (!/_dev$/.test(db)) throw new Error(`refused: database "${db}" does not end in _dev`);
  return { url: raw, db, host };
}

const files = () =>
  fs.readdirSync(dir).filter((f) => f.endsWith(".up.sql")).sort().map((f) => ({
    version: f.split("_")[0],
    name: f.replace(/\.up\.sql$/, ""),
    up: fs.readFileSync(path.join(dir, f), "utf8"),
    down: fs.readFileSync(path.join(dir, f.replace(".up.sql", ".down.sql")), "utf8"),
  }));
const sum = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function main() {
  const cmd = process.argv[2] ?? "status";
  const { url, db } = assertLocalDevUrl(process.env.HEIM_DATABASE_URL || DEFAULT_URL);
  if (cmd === "up") {
    const admin = new pg.Client({ connectionString: url.replace(/\/[^/]*$/, "/postgres") });
    await admin.connect();
    const has = await admin.query("select 1 from pg_database where datname=$1", [db]);
    if (has.rowCount === 0) { await admin.query(`CREATE DATABASE "${db}"`); console.log(`created database ${db}`); }
    await admin.end();
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query("CREATE SCHEMA IF NOT EXISTS heim");
    await c.query("CREATE TABLE IF NOT EXISTS heim.schema_migrations (version text PRIMARY KEY, name text NOT NULL, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const applied = new Map((await c.query("select version, name, checksum from heim.schema_migrations order by version")).rows.map((r) => [r.version, r]));
    if (cmd === "status") {
      for (const m of files()) console.log(`${applied.has(m.version) ? "applied " : "pending "} ${m.name}${applied.has(m.version) && applied.get(m.version).checksum !== sum(m.up) ? "  (CHECKSUM CHANGED)" : ""}`);
    } else if (cmd === "up") {
      let n = 0;
      for (const m of files()) {
        if (applied.has(m.version)) continue;
        await c.query("BEGIN");
        try {
          await c.query(m.up);
          await c.query("insert into heim.schema_migrations(version,name,checksum) values($1,$2,$3)", [m.version, m.name, sum(m.up)]);
          await c.query("COMMIT");
        } catch (e) { await c.query("ROLLBACK"); throw e; }
        console.log(`applied ${m.name}`); n++;
      }
      if (!n) console.log("nothing to apply");
    } else if (cmd === "down") {
      const last = [...applied.keys()].sort().pop();
      const m = files().find((f) => f.version === last);
      if (!m) { console.log("nothing to roll back"); return; }
      await c.query("BEGIN");
      try {
        await c.query(m.down);
        // the bookkeeping row goes with the migration (001's rollback drops the whole schema, table included)
        if ((await c.query("select to_regclass('heim.schema_migrations') as t")).rows[0].t) await c.query("delete from heim.schema_migrations where version=$1", [m.version]);
        await c.query("COMMIT");
      } catch (e) { await c.query("ROLLBACK"); throw e; }
      console.log(`rolled back ${m.name}`);
    } else throw new Error(`unknown command ${cmd}`);
  } finally { await c.end(); }
}

main().catch((e) => { console.error("migrate failed:", e.code ?? "", e.message.split("\n")[0]); process.exit(1); });
