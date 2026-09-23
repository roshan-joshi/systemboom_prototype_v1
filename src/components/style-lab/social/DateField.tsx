"use client";

/**
 * DATE FIELD — the SYSTEMBOOM date grammar (DD MON YYYY) as the visible
 * layer over a native date input. The native control keeps its picker and
 * its accessibility; only the display is ours. Never shows locale-numeric
 * dates (10/09/2026).
 */

import { CalendarDays } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sbDate } from "@/lib/i18n/format";

export function DateField({ id, value, onChange, min, max, label, className = "", compact = false, quiet = false }: { id?: string; value: string; onChange: (v: string) => void; /** Phase 4.4-A — the earliest selectable date (the owner's birth date in the Composer). */ min?: string; max?: string; label: string; className?: string; compact?: boolean; /** S6 — the date as a word in a sentence (the Composer's coordinate line): no chip border/fill, an underline on focus. Text and behaviour identical. */ quiet?: boolean }) {
  const { t, locale } = useT();
  // en is byte-identical to the product's "DD MON YYYY" grammar (accepted by circle/social-final);
  // other locales get the localized month via the S3 deterministic month tables.
  const text = value ? sbDate(locale, `${value}T00:00:00`) : t("composer.dateFormatHint");
  const shell = quiet
    ? "min-h-8 rounded-[6px] border-b border-transparent px-0.5 focus-within:border-[var(--hair)]"
    : "min-h-9 rounded-[10px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-2.5 focus-within:outline-2 focus-within:outline-[var(--focus)]";
  return (
    <span className={`relative inline-flex items-center gap-2 text-[13px] text-text tabular-nums ${shell} ${className}`}>
      {!compact && <CalendarDays size={14} strokeWidth={1.75} aria-hidden className="text-muted" />}
      <span aria-hidden data-sb-date-display className={value ? "" : "text-muted"}>{text}</span>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}
