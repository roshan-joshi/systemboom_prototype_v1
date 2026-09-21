"use client";

/**
 * CELESTIAL FIELD — isolated dev preview (Stage 23, Slice 2).
 *
 * The Field is built and validated HERE, with no Moment, Chat or Notification anywhere near
 * it, so the risky work (measured geometry, eight motion profiles, the state machine,
 * keyboard, reduced motion, eight languages) proves out before a single real product surface
 * is touched. Dev-only reference route — not linked from the product.
 */

import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setTheme, useTheme } from "@/lib/use-theme";
import { RESONANCES } from "@/lib/celestial/registry";
import type { LearningState, ResonanceId } from "@/lib/celestial/types";
import { CelestialField } from "./CelestialField";
import { ResonanceSeal, ResonanceSignal, useResonanceName } from "./ResonanceMark";

export function CelestialPreview() {
  const { t } = useT();
  const theme = useTheme();
  const name = useResonanceName();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ResonanceId | null>(null);
  const [learning, setLearning] = useState<LearningState>("new");
  const [serious, setSerious] = useState(false);
  const [commits, setCommits] = useState<string[]>([]);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-8 @container" data-sb-celestial-preview>
      <header className="mb-6">
        <h1 className="text-[19px] font-medium text-text">Celestial Resonance — Field</h1>
        <p className="mt-1 text-[13px] text-muted">Slice 2, isolated. No Moment, Chat or Notification is mounted on this route.</p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[12px]">
        <button type="button" data-sb-preview-open onClick={() => setOpen((v) => !v)}
          className="min-h-9 rounded-full border border-[var(--hair)] px-3 font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">
          {open ? "Close field" : t("celestial.action.resonate")}
        </button>
        <button type="button" data-sb-preview-theme onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="min-h-9 rounded-full border border-[var(--hair)] px-3 text-muted hover:text-text focus-visible:outline-[var(--focus)]">
          {theme === "dark" ? "Deep Cosmos" : "Solar Observatory"}
        </button>
        {(["new", "learning", "learned"] as LearningState[]).map((s) => (
          <button key={s} type="button" data-sb-preview-learning={s} onClick={() => setLearning(s)}
            className={`min-h-9 rounded-full border px-3 focus-visible:outline-[var(--focus)] ${learning === s ? "border-steel text-text" : "border-[var(--hair)] text-muted"}`}>
            {s}
          </button>
        ))}
        <button type="button" data-sb-preview-serious onClick={() => setSerious((v) => !v)}
          className={`min-h-9 rounded-full border px-3 focus-visible:outline-[var(--focus)] ${serious ? "border-steel text-text" : "border-[var(--hair)] text-muted"}`}>
          serious context {serious ? "on" : "off"}
        </button>
        <span data-sb-preview-selected={selected ?? ""} className="text-muted">
          selected: {selected ? name(selected) : "—"}
        </span>
        <span data-sb-preview-commits={commits.length} className="text-muted">commits: {commits.length}</span>
      </div>

      <section className="rounded-2xl border border-[var(--hair)] p-4">
        <CelestialField
          open={open}
          selected={selected}
          learningState={learning}
          seriousContext={serious}
          onCommit={(id) => { setSelected(id); setCommits((c) => [...c, id]); }}
          onRemove={() => setSelected(null)}
          onCancel={() => setOpen(false)}
        />
        {!open && <p className="py-6 text-center text-[13px] text-muted">The field is closed.</p>}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium text-text">Signal (20px) · Seal (30px) — settled tiers, both themes</h2>
        <div className="flex flex-wrap items-center gap-4" data-sb-preview-marks>
          {RESONANCES.map((r) => (
            <span key={r.resonanceId} className="flex items-center gap-1.5">
              <ResonanceSignal id={r.resonanceId} />
              <ResonanceSeal id={r.resonanceId} />
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
