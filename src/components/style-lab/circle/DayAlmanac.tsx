"use client";

/**
 * DAY — the end of the radial drill. The Circle answered WHEN; the Almanac
 * answers WHAT HAPPENED THERE with the accepted Phase 4 Moment components,
 * unchanged. Kinds may filter (WHAT), never become radial sectors.
 */

import { useMemo, useState } from "react";
import { PenLine } from "lucide-react";
import type { Moment } from "../social/data";
import { Composer, draftFromMoment } from "../social/Composer";
import { MomentEntry } from "../social/Moment";
import type { Draft } from "../social/store";

const KIND_WORD: Record<string, string> = { moment: "Plain", meal: "Meal", activity: "Activity", problem: "Problem", health: "Health", project: "Project", meeting: "Meeting" };

export function DayAlmanac({ date, moments, kindFilter, onKindFilter, own, onRecord }: { date: string; moments: Moment[]; kindFilter: string | null; onKindFilter: (k: string | null) => void; own: boolean; onRecord?: () => void }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of moments) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
    return [...counts.entries()];
  }, [moments]);
  const shown = kindFilter ? moments.filter((m) => m.kind === kindFilter) : moments;

  return (
    <section aria-label={`Moments on ${date}`} className="sb-social rounded-[var(--sheet-radius)] bg-[var(--sheet)] shadow-[var(--sheet-shadow)]" data-sb-almanac data-sb-almanac-date={date}>
      <div data-sb-social-inner className="@2xl:[--gutter:40px] @2xl:[--rule-x:19px] @2xl:[--bleed:0px]">
        <div className="relative px-4 pt-4 pb-6 @2xl:px-6">
          {/* kind filters — only when there is something to filter */}
          {kinds.length > 1 && (
            <div role="group" aria-label="Filter by kind" className="mb-4 flex flex-wrap gap-1.5 pl-[var(--gutter)] text-[12px]" data-sb-kind-filters>
              <button type="button" aria-pressed={kindFilter === null} onClick={() => onKindFilter(null)} className={`min-h-8 rounded-full border px-2.5 font-medium focus-visible:outline-[var(--focus)] ${kindFilter === null ? "border-transparent bg-[var(--boom-soft)] text-text" : "border-[var(--hair)] text-muted hover:text-text"}`}>
                All · {moments.length}
              </button>
              {kinds.map(([k, n]) => (
                <button key={k} type="button" aria-pressed={kindFilter === k} onClick={() => onKindFilter(kindFilter === k ? null : k)} className={`min-h-8 rounded-full border px-2.5 font-medium focus-visible:outline-[var(--focus)] ${kindFilter === k ? "border-transparent bg-[var(--boom-soft)] text-text" : "border-[var(--hair)] text-muted hover:text-text"}`}>
                  {KIND_WORD[k]} · {n}
                </button>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <div className="pl-[var(--gutter)] text-[14px] text-muted" data-sb-almanac-empty>
              <p>No Moments recorded here.</p>
              {own && onRecord && (
                <button type="button" onClick={onRecord} className="sb-transition mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]" data-sb-record-here>
                  <PenLine size={14} strokeWidth={1.75} aria-hidden /> Record a moment on this day
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <span aria-hidden className="absolute top-0 bottom-0 w-px bg-[var(--rule)]" style={{ left: "var(--rule-x)" }} />
              <div className="flex flex-col gap-8">
                {shown.map((m, i) => (
                  <div key={m.id} className={i > 0 ? "border-t border-[var(--hair)] pt-6" : ""}>
                    <MomentEntry moment={m} showDate={false} onEdit={(mm) => setEditing(draftFromMoment(mm))} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {editing && <Composer open initial={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
