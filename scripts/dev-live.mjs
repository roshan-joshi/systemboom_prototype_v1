#!/usr/bin/env node
/**
 * SYSTEMBOOM — the ONLY way to start a server that may call billed external providers (DeepSeek, USDA, Open Food Facts,
 * Nominatim). Every other server (`npm run dev`, the :3210 keep-alive, `next start`, tests, CI) runs in MOCK mode and
 * refuses all outbound provider requests, whatever API keys are configured.
 *
 *   npm run dev:live
 *
 * Deliberately on a DIFFERENT port (3211, localhost only) so the automated suites — which all target :3210 — can never
 * reach a live server by accident. Refuses to start under CI / NODE_ENV=test / SB_TEST_RUN, and asks for a typed
 * confirmation on an interactive terminal.
 */
import { spawn } from "node:child_process";
import readline from "node:readline/promises";

const PORT = "3211";
if (process.env.CI || process.env.NODE_ENV === "test" || process.env.SB_TEST_RUN) {
  console.error("dev:live refused: CI / NODE_ENV=test / SB_TEST_RUN is set. Live provider calls are never made from automated runs.");
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error("dev:live refused: it needs an interactive terminal (a typed confirmation), so it cannot be started by a script.");
  process.exit(1);
}
console.log("\n  ⚠  LIVE PROVIDER MODE — every analysis on this server is a REAL, BILLED DeepSeek request.");
console.log(`     Server: http://127.0.0.1:${PORT} (localhost only). Automated suites target :3210 and cannot reach it.\n`);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('  Type "live" to start: ')).trim();
rl.close();
if (answer !== "live") {
  console.log("  Not started.");
  process.exit(1);
}
const child = spawn("npx", ["next", "dev", "-p", PORT, "-H", "127.0.0.1"], {
  stdio: "inherit",
  env: { ...process.env, SB_PROVIDER_MODE: "live", SB_PROVIDER_LIVE_CONFIRM: "billed-provider-calls" },
});
child.on("exit", (code) => process.exit(code ?? 0));
