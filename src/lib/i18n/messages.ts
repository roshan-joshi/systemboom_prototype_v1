/**
 * SYSTEMBOOM i18n — message runtime (§26–§30). Dependency-free: dotted-key
 * lookup with English fallback (§5.5), `{param}` interpolation, and locale-aware
 * pluralisation via `Intl.PluralRules`. Never build sentences from fragments —
 * every user-facing sentence is a parameterised key (§29).
 */

import { DEFAULT_LOCALE, type LocaleCode } from "./config";
import { pluralCategory } from "./format";
import { CATALOGS } from "./catalogs";

export type Catalog = Record<string, string>;

function interpolate(tpl: string, params?: Record<string, string | number>): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (params[k] === undefined ? `{${k}}` : String(params[k])));
}

/** Look a key up in `locale`, falling back to English, then the raw key (never a blank). */
export function translate(locale: LocaleCode, key: string, params?: Record<string, string | number>): string {
  const cat = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  const raw = cat[key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? key;
  return interpolate(raw, params);
}

/**
 * Pluralised message. The base key holds pipe-separated forms in CLDR order
 * for that locale's categories, e.g. en `"{n} request|{n} requests"` (one|other),
 * ru `"{n} запрос|{n} запроса|{n} запросов"` (one|few|many). `{n}` interpolates.
 */
export function translatePlural(locale: LocaleCode, key: string, count: number, params?: Record<string, string | number>): string {
  const cat = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  const raw = cat[key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? key;
  const forms = raw.split("|");
  const cat3 = pluralCategory(locale, count);
  // Map the selected CLDR category to a form by the locale's declared order.
  const order = PLURAL_ORDER[locale] ?? ["one", "other"];
  let idx = order.indexOf(cat3);
  if (idx < 0 || idx >= forms.length) idx = forms.length - 1; // fall to the last (other)
  return interpolate(forms[idx] ?? forms[forms.length - 1], { n: count, ...params });
}

/** CLDR plural categories each locale actually uses, in the order its catalog lists forms. */
export const PLURAL_ORDER: Record<LocaleCode, Intl.LDMLPluralRule[]> = {
  en: ["one", "other"],
  es: ["one", "other"],
  it: ["one", "other"],
  nl: ["one", "other"],
  ru: ["one", "few", "many"],
  hi: ["one", "other"],
  ne: ["one", "other"],
  "zh-Hans": ["other"],
};
