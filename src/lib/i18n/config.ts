/**
 * SYSTEMBOOM i18n — supported locales (S1 Global Language Foundation).
 *
 * A language is not a nationality: the selector shows each language in its own
 * writing system, never a flag. Routes never change with language (§4); locale
 * is product preference/context resolved by `resolve.ts`. The architecture
 * carries `dir` and `script` so a future RTL language (Arabic, Hebrew) can be
 * added without redesign (§3, §24) — every initial locale is LTR.
 */

export type LocaleCode = "en" | "es" | "it" | "nl" | "ru" | "hi" | "ne" | "zh-Hans";
export type ScriptClass = "latin" | "cyrillic" | "devanagari" | "cjk";
export type Direction = "ltr" | "rtl";

export interface LocaleMeta {
  code: LocaleCode;
  /** The language written in its own language — the only label shown in the selector. */
  nativeName: string;
  /** BCP-47 tag for Intl date/number/plural formatting. */
  intl: string;
  script: ScriptClass;
  dir: Direction;
}

/** Stable display order — never reordered by region (§67). */
export const LOCALES: LocaleMeta[] = [
  { code: "en", nativeName: "English", intl: "en", script: "latin", dir: "ltr" },
  { code: "es", nativeName: "Español", intl: "es", script: "latin", dir: "ltr" },
  { code: "it", nativeName: "Italiano", intl: "it", script: "latin", dir: "ltr" },
  { code: "nl", nativeName: "Nederlands", intl: "nl", script: "latin", dir: "ltr" },
  { code: "ru", nativeName: "Русский", intl: "ru", script: "cyrillic", dir: "ltr" },
  { code: "hi", nativeName: "हिन्दी", intl: "hi", script: "devanagari", dir: "ltr" },
  { code: "ne", nativeName: "नेपाली", intl: "ne", script: "devanagari", dir: "ltr" },
  { code: "zh-Hans", nativeName: "简体中文", intl: "zh-Hans", script: "cjk", dir: "ltr" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const SUPPORTED: LocaleCode[] = LOCALES.map((l) => l.code);
export const LOCALE_COOKIE = "sb-locale";
export const REGION_COOKIE = "sb-region";

export const localeMeta = (code: string): LocaleMeta =>
  LOCALES.find((l) => l.code === code) ?? LOCALES[0];

export const isSupported = (code?: string | null): code is LocaleCode =>
  !!code && SUPPORTED.includes(code as LocaleCode);

/**
 * Coarse region → a reasonable *fallback* language, used ONLY as priority 4 in
 * resolution — never as proof of language (§5, §7, §8). A country maps to at
 * most one supported hint; absence means "no region hint", not English.
 */
export const REGION_LANGUAGE_HINT: Record<string, LocaleCode> = {
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  IT: "it",
  NL: "nl", BE: "nl",
  RU: "ru", BY: "ru", KZ: "ru",
  IN: "hi",
  NP: "ne",
  CN: "zh-Hans", SG: "zh-Hans",
  US: "en", GB: "en", AU: "en", CA: "en", IE: "en", NZ: "en",
};
