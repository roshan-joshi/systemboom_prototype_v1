/**
 * SYSTEMBOOM SIE P2-B2 — provider-gate status (LOCAL DEVELOPMENT ONLY; 404 in a production build).
 * Reports the execution mode and the per-provider counters of ALLOWED vs BLOCKED outbound requests, so a test run can
 * prove it reached no live provider. Counters only — never a URL, prompt, payload, key or user data.
 */
import { NextResponse } from "next/server";
import { providerMode, providerNetStats } from "@/lib/intelligence/provider-gate";

export async function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "not available" }, { status: 404 });
  return NextResponse.json({ ...providerMode(), net: providerNetStats() }, { headers: { "Cache-Control": "no-store" } });
}
