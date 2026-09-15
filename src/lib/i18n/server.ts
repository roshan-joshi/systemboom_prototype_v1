/**
 * SYSTEMBOOM i18n — server-side locale resolution (§6, §23, §83). Reading the
 * persisted cookie + `Accept-Language` (+ a coarse region seam) on the server
 * lets the layout render the resolved locale in the FIRST paint — no
 * wrong-language flash, no hydration mismatch, and no `/[lang]` route (§4).
 */

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, REGION_COOKIE } from "./config";
import { resolveLocale, type Resolved } from "./resolve";

/** Parse an Accept-Language header into an ordered, q-sorted list of tags. */
function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim(), q: q ? parseFloat(q) : 1 };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);
}

export async function resolveRequestLocale(): Promise<Resolved> {
  const cookieStore = await cookies();
  const h = await headers();
  // The prototype persists the explicit choice in one cookie; the live contract
  // (docs/handover/i18n-live-contract.md) splits this into profile vs device.
  const manual = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const region = cookieStore.get(REGION_COOKIE)?.value ?? h.get("x-sb-region") ?? null;
  const browser = parseAcceptLanguage(h.get("accept-language"));
  return resolveLocale({ manual, browser, region });
}
