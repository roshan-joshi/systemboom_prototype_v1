/**
 * UC-C4.4 — the Composer's server-side reverse-geocode boundary (§6 of the brief).
 *
 * Privacy: the browser sends ONLY `lat`/`lon` here — never the image, filename, asset id,
 * user id, caption, or any account information. This route is the one place that talks to
 * a public third-party provider on the Composer's behalf, so a person's photo GPS is never
 * sent directly from their browser to that provider.
 *
 * Deliberately independent of `src/lib/earth/locate.ts` (the Earth/globe feature's own
 * client-side geocoder, with its own cache/throttle tuned for map panning) — the brief
 * explicitly asks not to couple the Composer to Earth/globe UI code. The two share the
 * same underlying idea (Nominatim reverse geocoding) but nothing else; this route is a
 * separate, minimal implementation.
 *
 * `?mock=1` is a test-only determinism seam (never sent by the Composer's own UI unless
 * the page itself was loaded with `?mockgeo=1` — see `composer/geocode-client.ts`):
 * resolves a small, explicit coordinate table instead of making any real network request,
 * so automated tests never depend on, or hit, a live external service.
 */
import { NextRequest, NextResponse } from "next/server";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}
interface NominatimResult {
  address?: NominatimAddress;
}

/** Test-only deterministic table (§ "mock=1") — real coordinates from the UC-C4.4 test
 *  fixtures, rounded to 2 decimals; anything outside this table resolves to no result,
 *  simulating an honest geocode failure/no-match. Never a real network call. */
const MOCK_TABLE: Record<string, string> = {
  "27.66,85.29": "Kathmandu, Nepal",
  "27.67,85.42": "Kathmandu, Nepal", // a different real point that a real geocoder would
                                      // plausibly also resolve to the same city (§11 of the
                                      // brief: consistency is judged on the resolved place).
  "28.21,83.96": "Pokhara, Nepal",
};

function mockPlace(lat: number, lon: number): string | null {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  return MOCK_TABLE[key] ?? null;
}

function addressToPlace(address: NominatimAddress | undefined): string | null {
  if (!address) return null;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  if (city && address.country) return `${city}, ${address.country}`;
  return city ?? address.state ?? address.country ?? null;
}

async function realReverseGeocode(lat: number, lon: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1&accept-language=en`,
      { signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "SYSTEMBOOM-prototype/1.0 (composer reverse-geocode)" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult;
    return addressToPlace(data.address);
  } catch {
    return null; // network failure, timeout, or malformed response — a normal outcome
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ place: null }, { status: 400 });
  }
  const mock = req.nextUrl.searchParams.get("mock") === "1";
  const place = mock ? mockPlace(lat, lon) : await realReverseGeocode(lat, lon);
  return NextResponse.json({ place });
}
