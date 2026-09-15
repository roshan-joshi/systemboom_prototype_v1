/**
 * SYSTEMBOOM i18n — the binding locale-resolution policy (§5).
 *
 * Priority, highest first:
 *   1. profile      the authenticated user's explicit profile language
 *   2. manual       an explicit pre-login / device language choice
 *   3. browser      the browser/device preferred languages (Accept-Language / navigator.languages)
 *   4. region       coarse country/region context (a SUGGESTION, never proof)
 *   5. fallback     English
 *
 * USER CHOICE ALWAYS WINS. LOCATION IS NEVER PROOF OF LANGUAGE. This module is
 * pure (no DOM, no network) so it is identical on server and client and fully
 * unit-testable (see prototype-tests/locale-resolution.js).
 */

import { DEFAULT_LOCALE, isSupported, REGION_LANGUAGE_HINT, SUPPORTED, type LocaleCode } from "./config";

export type LocaleSource = "profile" | "manual-device" | "browser" | "region" | "fallback";

export interface ResolveInput {
  /** Authenticated profile language, if the signed-in user has set one. */
  profile?: string | null;
  /** Explicit pre-login / device choice (persisted locally as a cookie/localStorage). */
  manual?: string | null;
  /** Ordered browser preferences — Accept-Language (server) or navigator.languages (client). */
  browser?: readonly string[] | null;
  /** Coarse ISO country/region code from a trusted edge/source, if any. */
  region?: string | null;
}

export interface Resolved {
  locale: LocaleCode;
  source: LocaleSource;
  region?: string;
}

/** First browser preference whose base language matches a supported locale (e.g. "en-GB" → "en"). */
function matchBrowser(prefs?: readonly string[] | null): LocaleCode | null {
  if (!prefs) return null;
  for (const raw of prefs) {
    if (!raw) continue;
    const tag = raw.trim();
    if (isSupported(tag)) return tag; // exact, e.g. "zh-Hans"
    const base = tag.toLowerCase().split("-")[0];
    // zh-* (zh, zh-CN, zh-SG…) → Simplified Chinese for the current supported set
    if (base === "zh") return "zh-Hans";
    const hit = SUPPORTED.find((s) => s.toLowerCase().split("-")[0] === base);
    if (hit) return hit;
  }
  return null;
}

export function resolveLocale(input: ResolveInput): Resolved {
  const region = input.region ? input.region.toUpperCase() : undefined;

  if (isSupported(input.profile)) return { locale: input.profile, source: "profile", region };
  if (isSupported(input.manual)) return { locale: input.manual, source: "manual-device", region };

  const browser = matchBrowser(input.browser);
  if (browser) return { locale: browser, source: "browser", region };

  if (region && REGION_LANGUAGE_HINT[region]) return { locale: REGION_LANGUAGE_HINT[region], source: "region", region };

  return { locale: DEFAULT_LOCALE, source: "fallback", region };
}

/**
 * Whether a region change should prompt a quiet suggestion (§12–§14): only when
 * the region maps to a supported language that differs from the active one, the
 * user hasn't already dismissed/accepted this region, and it isn't the region
 * that produced the current locale. Never auto-switches — returns the candidate,
 * the caller offers Keep / Switch.
 */
export function regionSuggestion(args: {
  activeLocale: LocaleCode;
  activeSource: LocaleSource;
  region?: string | null;
  lastHandledRegion?: string | null;
}): LocaleCode | null {
  const region = args.region ? args.region.toUpperCase() : null;
  if (!region) return null;
  if (region === (args.lastHandledRegion ?? "").toUpperCase()) return null;
  const hint = REGION_LANGUAGE_HINT[region];
  if (!hint || hint === args.activeLocale) return null;
  return hint;
}
