/**
 * UC-C4.4 — the Composer's ONLY reverse-geocode caller. Privacy boundary (§6 of the
 * brief): the browser sends ONLY the minimum coordinates to SYSTEMBOOM's own server route
 * (`/api/geocode`), which performs the actual third-party lookup server-side — a photo's
 * GPS never travels directly from the browser to a public geocoder, and nothing about the
 * image/account/user ever leaves with the request.
 *
 * Deliberately its own small module rather than reusing `src/lib/earth/locate.ts`: that
 * file is client-only, purpose-built for the Earth/globe map (its own cache/throttle
 * tuned for map panning), and the brief explicitly asks not to couple the Composer to
 * Earth/globe UI code.
 */

/**
 * UC-C4.4 test-only determinism seam: a page loaded with `?mockgeo=1` asks the server
 * route to resolve a small, explicit coordinate table instead of calling the real
 * provider — read directly from the URL, never wired through app state/store, so no file
 * outside this module needs to know it exists.
 */
function mockRequested(): boolean {
  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mockgeo") === "1";
  } catch {
    return false;
  }
}

const TIMEOUT_MS = 4000;

/**
 * Resolves a human-readable place for real GPS coordinates, or `undefined` if the lookup
 * fails/times out/finds nothing — a normal, quiet outcome (§8), never a thrown error.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
    if (mockRequested()) params.set("mock", "1");
    const res = await fetch(`/api/geocode?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) return undefined;
    const data: { place?: string | null } = await res.json();
    return data.place ?? undefined;
  } catch {
    return undefined; // network failure, timeout, or malformed response — a normal outcome
  } finally {
    clearTimeout(timer);
  }
}
