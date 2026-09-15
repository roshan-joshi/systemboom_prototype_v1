"use client";

/**
 * SYSTEMBOOM — a quiet region-language suggestion (§12–§14, §58–§59). Shown only
 * when a genuine region change maps to a supported language different from the
 * active one, and never repeated once handled. Two clear choices — Keep / Switch —
 * never a modal, never a notification event, never an auto-switch. One restrained
 * entry; reduced motion collapses it (the global rule).
 */

import { localeMeta } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function RegionSuggestion() {
  const { suggestion, locale, acceptSuggestion, dismissSuggestion, t } = useLocale();
  if (!suggestion) return null;
  const suggested = localeMeta(suggestion);
  const currentName = localeMeta(locale).nativeName;
  return (
    <div
      role="status"
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[65] mx-auto flex max-w-[420px] flex-col gap-2 rounded-[16px] border border-[var(--card-edge)] bg-[var(--card)] p-3 shadow-[0_18px_48px_-18px_rgba(0,0,0,.45)] [animation:sb-rel-resolve_200ms_ease-out_both] @2xl:right-4 @2xl:left-auto @2xl:mx-0"
      data-sb-region-suggestion={suggestion}
    >
      <p className="px-1 text-[13px] text-text">{t("region.suggest", { lang: suggested.nativeName })}</p>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={dismissSuggestion} className="sb-transition inline-flex min-h-9 items-center rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]" data-sb-region-keep>
          {t("region.keepCurrent", { lang: currentName })}
        </button>
        <button type="button" onClick={acceptSuggestion} className="sb-transition inline-flex min-h-9 items-center rounded-full bg-[var(--boom)] px-3 text-[13px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)]" data-sb-region-switch>
          <span lang={suggested.code}>{t("region.switchTo", { lang: suggested.nativeName })}</span>
        </button>
      </div>
    </div>
  );
}
