"use client";

/**
 * SYSTEMBOOM i18n — the one language state for the whole product (§16). One
 * preference applies to Cosmos, My World, Life, everything. Switching is React
 * state + the persisted cookie/localStorage + the <html lang/dir> attribute —
 * never a route change, never a reload, so context is preserved (§21, §22, §60–§62).
 */

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isSupported, localeMeta, type LocaleCode } from "./config";
import { translate, translatePlural } from "./messages";
import { regionSuggestion, type LocaleSource } from "./resolve";

interface LocaleCtx {
  locale: LocaleCode;
  source: LocaleSource;
  region?: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  tp: (key: string, count: number, params?: Record<string, string | number>) => string;
  setLocale: (code: LocaleCode, source?: LocaleSource) => void;
  /** A quiet region-language suggestion, or null. Offer Keep / Switch — never auto-switch. */
  suggestion: LocaleCode | null;
  acceptSuggestion: () => void;
  dismissSuggestion: () => void;
}

const Ctx = createContext<LocaleCtx | null>(null);
const HANDLED_REGION_KEY = "sb-locale-region-handled";

function persist(code: LocaleCode) {
  try {
    localStorage.setItem(LOCALE_COOKIE, code);
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* private mode / blocked storage — resolution still works per request */
  }
}

export function LocaleProvider({
  initialLocale,
  initialSource = "fallback",
  region,
  children,
}: {
  initialLocale: LocaleCode;
  initialSource?: LocaleSource;
  region?: string;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale);
  const [source, setSource] = useState<LocaleSource>(initialSource);
  const [dismissed, setDismissed] = useState(false);

  const setLocale = useCallback((code: LocaleCode, src: LocaleSource = "manual-device") => {
    if (!isSupported(code)) return;
    setLocaleState(code);
    setSource(src);
    persist(code);
    const meta = localeMeta(code);
    try {
      document.documentElement.lang = code;
      document.documentElement.dir = meta.dir;
    } catch {}
  }, []);

  // Review/testing convenience: honour ?lang= on the client (persists so a refresh is SSR-correct).
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("lang");
      // One-time review-tooling sync: honour ?lang= on mount. Real users never hit this branch
      // (their locale is resolved server-side from the cookie and seeded into initialLocale, so
      // the first client render already matches SSR). The setState here is intentional and runs
      // at most once, so the cascading-render caution does not apply.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isSupported(p) && p !== locale) setLocale(p, "manual-device");
      else {
        document.documentElement.lang = locale;
        document.documentElement.dir = localeMeta(locale).dir;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestion = useMemo(() => {
    if (dismissed) return null;
    let handled: string | null = null;
    try { handled = localStorage.getItem(HANDLED_REGION_KEY); } catch {}
    return regionSuggestion({ activeLocale: locale, activeSource: source, region, lastHandledRegion: handled });
  }, [locale, source, region, dismissed]);

  const markHandled = useCallback(() => {
    try { if (region) localStorage.setItem(HANDLED_REGION_KEY, region); } catch {}
    setDismissed(true);
  }, [region]);

  const value = useMemo<LocaleCtx>(() => ({
    locale,
    source,
    region,
    t: (key, params) => translate(locale, key, params),
    tp: (key, count, params) => translatePlural(locale, key, count, params),
    setLocale,
    suggestion,
    acceptSuggestion: () => { if (suggestion) setLocale(suggestion, "manual-device"); markHandled(); },
    dismissSuggestion: markHandled,
  }), [locale, source, region, setLocale, suggestion, markHandled]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLocale must be used within LocaleProvider");
  return c;
}
/** Non-throwing variant for components that may render outside a provider (dev harness). */
export function useLocaleMaybe(): LocaleCtx | null {
  return useContext(Ctx);
}

/**
 * `{ t, tp }` bound to the active locale, safe outside a provider (falls back to
 * English) — so a component works in the app and in an isolated harness alike.
 */
export function useT() {
  const c = useContext(Ctx);
  if (c) return { t: c.t, tp: c.tp, locale: c.locale };
  return {
    t: (key: string, params?: Record<string, string | number>) => translate(DEFAULT_LOCALE, key, params),
    tp: (key: string, count: number, params?: Record<string, string | number>) => translatePlural(DEFAULT_LOCALE, key, count, params),
    locale: DEFAULT_LOCALE,
  };
}
