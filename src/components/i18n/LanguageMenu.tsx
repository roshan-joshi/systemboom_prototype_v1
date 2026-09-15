"use client";

/**
 * SYSTEMBOOM — the one language control (§17–§20, §55–§57, §66). Native names
 * only, never a flag (a language is not a nationality). One red current-position
 * indicator. Desktop: an anchored surface. Mobile: a touch-first bottom sheet
 * (full-width rows, real targets, no Submit — tap = select). Same design pre-login
 * (Cosmos) and in Settings; only the trigger differs.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LanguageMenu({ tone = "surface" }: { tone?: "surface" | "immersive" }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const immersive = tone === "immersive";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative" data-sb-language>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("lang.triggerAria", { lang: current.nativeName })}
        className={`sb-transition inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium focus-visible:outline-[var(--focus)] ${
          immersive
            ? "border-[rgba(238,242,248,.22)] bg-[rgba(10,13,20,.55)] text-[#EEF2F8] backdrop-blur-md hover:bg-[rgba(10,13,20,.72)]"
            : "border-[var(--hair)] text-text hover:border-steel/60"
        }`}
        data-sb-language-trigger
      >
        <Globe size={14} strokeWidth={1.75} aria-hidden />
        <span lang={current.code} className="whitespace-nowrap">{current.nativeName}</span>
      </button>

      {open && (
        <>
          {/* Mobile: a bottom sheet. Desktop (@2xl+): an anchored surface. */}
          <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-[70] bg-[var(--scrim,rgba(0,0,0,.4))] @2xl:hidden" />
          <div
            role="menu"
            aria-label={t("lang.title")}
            className="fixed inset-x-0 bottom-0 z-[71] max-h-[80vh] overflow-y-auto rounded-t-[22px] border-t border-[var(--card-edge)] bg-[var(--card)] p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_-18px_rgba(0,0,0,.5)] @2xl:absolute @2xl:inset-x-auto @2xl:top-full @2xl:right-0 @2xl:bottom-auto @2xl:mt-1 @2xl:w-[240px] @2xl:max-h-none @2xl:rounded-[16px] @2xl:border @2xl:p-1.5 @2xl:pb-1.5"
            data-sb-language-surface
          >
            <p className="px-2 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase @2xl:hidden">{t("lang.title")}</p>
            {LOCALES.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  lang={l.code}
                  onClick={() => { setLocale(l.code, "manual-device"); setOpen(false); }}
                  className={`sb-transition flex min-h-11 w-full items-center gap-2 rounded-[12px] px-3 text-left text-[15px] hover:bg-steel/12 focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:text-[14px] ${active ? "font-semibold text-text" : "text-text/90"}`}
                  data-sb-language-option={l.code}
                >
                  <span className="min-w-0 flex-1 truncate">{l.nativeName}</span>
                  {active
                    ? <Check size={16} strokeWidth={2.5} className="shrink-0 text-[var(--boom)]" data-sb-language-current aria-hidden />
                    : <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
