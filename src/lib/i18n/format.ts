/**
 * SYSTEMBOOM i18n — locale-aware formatting (§38–§44).
 *
 * Localization changes PRESENTATION only, never temporal truth (§39): a
 * date-only Moment stays date-only, an unknown birth time stays unknown — no
 * fabricated midnight/noon to satisfy an API. Calendar stays Gregorian for the
 * current product model (§40). Calculation is never changed here — these wrap
 * Intl for display of values computed elsewhere.
 */

import { localeMeta, type LocaleCode } from "./config";

const intlOf = (locale: LocaleCode) => localeMeta(locale).intl;

/**
 * §23 (no hydration mismatch) — a hard determinism requirement. `Intl` output must be
 * byte-identical between the SSR runtime (Node, full ICU) and the browser (its own ICU),
 * or React's hydration reconciler fails on the mismatched text. The one place they
 * legitimately diverge for our locales is the NUMBERING SYSTEM: Node renders Devanagari
 * digits for `ne`/`hi` (१२,७३२) while many browsers render Latin (12,732). We therefore
 * pin every Intl formatter to the Latin numbering system: locale-aware GROUPING (ru's
 * thin space, en/ne/hi comma), month names, and field order are preserved — only the
 * digit glyphs are made deterministic. (Native numerals are a future enhancement, viable
 * once SSR/client ICU numeral parity can be guaranteed — see docs/i18n/architecture.md.)
 */
const NUM = { numberingSystem: "latn" } as const;

/** DD MON YYYY equivalent in the locale (e.g. "06 फेब्रुअरी 1983", "6 feb 1983"). */
export function formatDateLocale(locale: LocaleCode, iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlOf(locale), { ...NUM, ...(opts ?? { day: "2-digit", month: "short", year: "numeric" }) }).format(d);
}

export function formatTimeLocale(locale: LocaleCode, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(intlOf(locale), { ...NUM, hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatNumberLocale(locale: LocaleCode, n: number): string {
  return new Intl.NumberFormat(intlOf(locale), NUM).format(n);
}

/** Cardinal plural category for a count in this locale — Russian etc. get one/few/many/other. */
export function pluralCategory(locale: LocaleCode, n: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(intlOf(locale)).select(n);
}

/**
 * SYSTEMBOOM date/time display (§38, §44, §23).
 *
 * Month NAMES ship in the product, they are NOT read from `Intl` — because
 * `Intl.DateTimeFormat`'s month names are ICU-data-dependent and diverge between
 * the SSR runtime and the browser (e.g. Chromium's default ICU has no Nepali
 * month data and silently renders English, while Node's full-ICU renders Nepali).
 * That divergence is a §23 hydration mismatch — a hard fail — so date NAMES come
 * from these tables (one authoritative form per locale) and only the numeric day
 * and year vary, giving byte-identical SSR/client output everywhere. English stays
 * the canonical "DD MON YYYY" (uppercase 3-letter month) the accepted suites assert;
 * other Latin locales follow the same caps convention; Cyrillic / Devanagari use
 * their natural long form (no uppercasing — §49); CJK uses its Y年M月D日 order.
 */
const EN_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
// Short 3-letter month names for the Latin locales (uppercased at use).
const SHORT_MONTHS: Partial<Record<LocaleCode, string[]>> = {
  en: EN_MONTHS,
  es: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"],
  it: ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"],
  nl: ["JAN", "FEB", "MRT", "APR", "MEI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"],
};
// Long month names for the non-Latin locales (natural case; ru in the genitive
// form a "D MMMM" date takes — "10 сентября"). status: draft, awaiting native review.
const LONG_MONTHS: Partial<Record<LocaleCode, string[]>> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्तूबर", "नवंबर", "दिसंबर"],
  ne: ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"],
};
const LATIN = new Set<LocaleCode>(["en", "es", "it", "nl"]);
const pad2 = (n: number) => String(n).padStart(2, "0");

export function sbDate(locale: LocaleCode, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const m = d.getMonth();
  const year = d.getFullYear();
  if (locale === "zh-Hans") return `${year}年${m + 1}月${day}日`;
  if (LATIN.has(locale)) {
    const mon = (SHORT_MONTHS[locale] ?? EN_MONTHS)[m];
    return `${pad2(day)} ${mon} ${year}`;
  }
  const mon = (LONG_MONTHS[locale] ?? EN_MONTHS)[m];
  return `${day} ${mon} ${year}`;
}

/** 24-hour HH:MM — deterministic across runtimes (no locale am/pm ICU divergence, §23). */
export function sbTime(locale: LocaleCode, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
