"use client";

/**
 * The centre of the Circle answers one question at every resolution:
 * WHERE AM I IN THIS LIFE? Age first, calendar second, measurement third.
 * For a visitor the centre is band-safe by construction (the view carries
 * nothing else).
 */

import type { CircleView } from "./model";

export const CIRCLE_YEARS_LABEL = "One hundred and fifty years from birth, in ten bands of fifteen.";

export function Readout({ view, compact = false }: { view: CircleView; compact?: boolean }) {
  const { primary, secondary, tertiary } = view.readout;
  if (compact) {
    // Day level: the dial is small; the centre carries the day number and month only.
    const [day, mon] = primary.split(" ");
    return (
      <div className="leading-none tabular-nums" data-sb-readout-centre>
        <p className="text-[22px] font-semibold tracking-[-0.02em] text-text @2xl:text-[26px]">{day}</p>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{mon}</p>
      </div>
    );
  }
  const big = view.level === 0 || view.level === 2 ? primary.replace(/^Age /, "") : primary;
  const cap = view.level === 0 || view.level === 2 ? "age" : view.scope === "other" ? "band" : view.level === 1 ? "band" : view.level === 3 ? "month" : "";
  return (
    <div className="leading-none tabular-nums" data-sb-readout-centre>
      {view.scope === "other" || view.level === 0 || view.level === 2 ? (
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{view.scope === "other" ? "band" : cap}</p>
      ) : null}
      <p className={`mt-1 font-semibold tracking-[-0.02em] text-text ${big.length > 8 ? "text-[20px] @2xl:text-[26px]" : "text-[30px] @2xl:text-[40px]"}`} data-sb-readout-primary>
        {big}
      </p>
      {secondary && (
        <p className={`mt-1.5 text-[11px] tracking-[0.02em] text-muted @2xl:text-[12px] ${view.level === 0 && view.scope === "owner" ? "uppercase tracking-[0.14em]" : ""}`} data-sb-readout-secondary>
          {secondary}
        </p>
      )}
      {tertiary && (
        <p className="mt-1.5 text-[11px] text-muted tabular-nums @2xl:text-[12px]" data-sb-readout-tertiary>
          {view.level === 0 && view.scope === "owner" ? <span className="font-medium text-[var(--boom)]">{tertiary}</span> : tertiary}
        </p>
      )}
    </div>
  );
}
