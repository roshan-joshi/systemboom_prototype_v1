/** SYSTEMBOOM i18n — catalog registry. English is the source/fallback; the
 *  others are AI-drafted (status: draft — see docs/i18n/translation-status.md)
 *  and awaiting native review. Adding a locale is one import + one map entry. */
import type { LocaleCode } from "../config";
import en from "./en";
import es from "./es";
import it from "./it";
import nl from "./nl";
import ru from "./ru";
import hi from "./hi";
import ne from "./ne";
import zhHans from "./zh-Hans";

export const CATALOGS: Record<LocaleCode, Record<string, string>> = {
  en, es, it, nl, ru, hi, ne, "zh-Hans": zhHans,
};
