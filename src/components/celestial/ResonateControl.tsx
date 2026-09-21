"use client";

/**
 * RESONATE — the Moment adapter (Stage 23, Slice 3) and the Celestial Human Pulse (Slice 4).
 *
 * Contract: 22-COMPONENT-ARCHITECTURE.md §3, §6 · 22-DATA-CONTRACT.md §4, §9.
 *
 * The mascot is a PRESERVATION BOUNDARY. Nothing here imports, reads, wraps or restyles the
 * Boom Expression components, and nothing here touches `Moment.expressions`. The Resonate
 * affordance is an independent sibling that happens to share an action row — not half of a
 * paired control, and the mascot keeps its own approved wording.
 */

import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/use-theme";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { RESONANCES, byCanonicalOrder, resonanceById } from "@/lib/celestial/registry";
import type { ResonanceId } from "@/lib/celestial/types";
import { useCelestialSurface } from "@/lib/celestial/flags";
import type { Moment } from "@/components/style-lab/social/data";
import { useSocial } from "@/components/style-lab/social/store";
import { personViewFor } from "@/components/style-lab/social/view-model";
import { CelestialField } from "./CelestialField";
import { resonateGold, resonateGoldHi } from "./visual";
import { ResonanceSeal, ResonanceSignal, useResonanceName } from "./ResonanceMark";

/** Moment kinds where a Celestial Resonance is offered but laughter/celebration are not. */
const SERIOUS_KINDS = new Set(["health", "problem"]);

export function ResonateControl({ moment }: { moment: Moment }) {
  const enabled = useCelestialSurface("moment");
  const { t } = useT();
  const { me, dispatch } = useSocial();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const name = useResonanceName();
  const theme = useTheme();
  const reduced = useReducedMotionPref();

  /* The Field mounts through an anchor BELOW the action row. That row is `flex` with no wrap,
     so a full-width child placed inside it is shrunk to zero width — measured, not assumed.
     Portalling keeps the accepted row structurally untouched and gives the Field real width.
     Resolved on open (an event, not an effect) so there is no setState cascade. */
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const openField = useCallback(() => {
    setAnchor(document.querySelector<HTMLElement>(`[data-sb-resonate-anchor="${CSS.escape(moment.id)}"]`));
    setOpen((v) => !v);
  }, [moment.id]);

  const mine = (moment.resonances?.[me.id] ?? null) as ResonanceId | null;

  /* Fires at COMMIT START. Persist immediately — never wait for the settle animation. */
  const commit = useCallback((id: ResonanceId) => {
    dispatch({ type: "resonate", id: moment.id, resonance: id });
  }, [dispatch, moment.id]);

  const remove = useCallback(() => {
    dispatch({ type: "resonate", id: moment.id, resonance: null });
  }, [dispatch, moment.id]);

  /* Focus returns to the affordance that opened the field. */
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  if (!enabled) return null;

  /* Resonate is ONE doorway, so it always burns the same gold; the viewer's own object shows
     inside it as the seal. A button tinted by the last choice reads as a state, not a place. */
  const accent = resonateGold(theme);
  const accentHi = resonateGoldHi(theme);

  return (
    <>
      {/* THE ENTRANCE. Not another outlined pill: a luminous aperture into the celestial
          layer. It carries its own light — the viewer's committed object if they have one,
          otherwise the system's own cool starlight — so it reads as special without shouting
          over the mascot beside it. */}
      <button
        ref={triggerRef}
        type="button"
        data-sb-resonate
        data-sb-resonate-mine={mine ?? ""}
        data-sb-resonate-open={open ? "1" : "0"}
        aria-expanded={open}
        aria-label={mine ? name(mine) : t("celestial.action.resonate")}
        onClick={openField}
        className="sb-press sb-resonate group relative inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-medium focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-3.5"
        style={{
          color: accentHi,
          border: `1px solid color-mix(in srgb, ${accent} ${open ? 95 : 78}%, transparent)`,
          background: `linear-gradient(180deg, color-mix(in srgb, ${accent} ${open ? 20 : 13}%, transparent) 0%, transparent 80%)`,
          boxShadow: open
            ? `0 0 0 1px color-mix(in srgb, ${accent} 34%, transparent), 0 0 26px -2px color-mix(in srgb, ${accent} 46%, transparent), inset 0 0 18px -6px color-mix(in srgb, ${accent} 52%, transparent)`
            : `0 0 18px -6px color-mix(in srgb, ${accent} 40%, transparent), inset 0 0 14px -8px color-mix(in srgb, ${accent} 40%, transparent)`,
          transition: reduced ? "none" : "color 320ms ease-out, border-color 320ms ease-out, background 320ms ease-out, box-shadow 320ms ease-out",
        }}
      >
        {/* One fine orbit contained by the doorway; never crosses the neighbouring action. */}
        <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-full" style={{borderTop:`1px solid color-mix(in srgb, ${accentHi} 55%, transparent)`,borderBottom:`1px solid color-mix(in srgb, ${accent} 30%, transparent)`,transform:"rotate(-4deg)"}} />
        {/* the warm halo the control sits in, lifting on hover/focus */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ background: `radial-gradient(60% 120% at 50% 50%, color-mix(in srgb, ${accent} 22%, transparent) 0%, transparent 72%)`, opacity: open ? 1 : undefined }}
        />
        <span className="relative">
          {mine ? <ResonanceSeal id={mine} size={22} decorative /> : <ResonateMark accent={open ? accentHi : accent} />}
        </span>
        <span className="relative">{t("celestial.action.resonate")}</span>
      </button>
      {open && anchor && createPortal(
        <div data-sb-resonate-field className="relative mt-7 w-full pb-2">
          <CelestialField
            open
            selected={mine}
            seriousContext={SERIOUS_KINDS.has(moment.kind)}
            onCommit={commit}
            onRemove={remove}
            onCancel={close}
            objectSize={78}
          />
        </div>,
        anchor,
      )}
    </>
  );
}

/**
 * THE MARK — a body on an orbit. The system's own glyph: never a mascot, never an emoji, and
 * not a generic arc. The planet is a filled disc with its own light; the orbit passes behind
 * it, which is what makes it read as celestial rather than as an icon of a circle.
 */
function ResonateMark({ accent }: { accent: string }) {
  const id = useId();
  return (
    <svg width="19" height="19" viewBox="0 0 22 22" aria-hidden className="overflow-visible">
      <defs>
        <radialGradient id={id} cx="36%" cy="30%">
          <stop offset="0%" stopColor="#FFF3DF" stopOpacity="1" />
          <stop offset="48%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.5" />
        </radialGradient>
      </defs>
      {/* the ring, passing BEHIND the body */}
      <ellipse cx="10.4" cy="11" rx="9.2" ry="3.4" transform="rotate(-18 10.4 11)" fill="none"
        stroke={accent} strokeOpacity="0.45" strokeWidth="1.1" />
      <circle cx="10.4" cy="11" r="5.9" fill={accent} opacity="0.14" />
      <circle cx="10.4" cy="11" r="3.7" fill={`url(#${id})`} />
      {/* the ring's near arc, IN FRONT — the pass-behind/pass-in-front is the depth cue */}
      <path d="M2.1 13.9c2.9 2.1 13.6 0.6 16.6-2.6" fill="none" stroke={accent} strokeOpacity="0.95"
        strokeWidth="1.15" strokeLinecap="round" />
      {/* the spark */}
      <path d="M18.4 4.2l.62 1.66 1.66.62-1.66.62-.62 1.66-.62-1.66-1.66-.62 1.66-.62z" fill={accent} opacity="0.95" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* CELESTIAL HUMAN PULSE                                               */
/* ------------------------------------------------------------------ */

/**
 * PEOPLE, NOT POPULARITY.
 *
 * Canonical registry order, always. Never sorted by count, never a winner, never a "top",
 * never sized by count. An entitlement or a visual edition can never change what is shown
 * here. The count is a fact about people, not a score.
 */
export function ResonanceSummary({ moment }: { moment: Moment }) {
  const enabled = useCelestialSurface("moment");
  const { t, tp } = useT();
  const { me, personOf } = useSocial();
  const name = useResonanceName();
  const [openWho, setOpenWho] = useState(false);

  const entries = Object.entries(moment.resonances ?? {});
  if (!enabled || entries.length === 0) return null;

  const byId = new Map<string, string[]>();
  for (const [personId, rid] of entries) {
    if (!resonanceById(rid)) continue; // unknown ids are ignored, never rendered
    byId.set(rid, [...(byId.get(rid) ?? []), personId]);
  }
  // CANONICAL ORDER. Deliberately the registry's order — NOT the count.
  const present = [...byId.keys()].sort(byCanonicalOrder);
  const total = entries.length;
  const mine = moment.resonances?.[me.id];

  return (
    <div data-sb-resonance-summary={total} className="mt-1 flex flex-wrap items-center gap-2">
      <button
        type="button"
        data-sb-resonance-who
        aria-expanded={openWho}
        aria-label={t("celestial.summary.who")}
        onClick={() => setOpenWho((v) => !v)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1.5 text-muted hover:text-text focus-visible:outline-[var(--focus)]"
      >
        <span className="flex items-center gap-1">
          {present.map((rid) => (
            /* Every present resonance is shown at the SAME size. Size never encodes count. */
            <ResonanceSeal key={rid} id={rid as ResonanceId} size={22} decorative />
          ))}
        </span>
        <span className="text-[12.5px]">{tp("celestial.summary.peopleN", total, { n: total })}</span>
      </button>

      {openWho && (
        <div
          data-sb-resonance-who-panel
          className="w-full rounded-xl border border-[var(--hair)] p-2"
          role="group"
          aria-label={t("celestial.summary.aria")}
        >
          {present.map((rid) => {
            const people = byId.get(rid) ?? [];
            return (
              <div key={rid} data-sb-resonance-group={rid} className="flex items-start gap-2 px-1 py-1.5">
                <ResonanceSeal id={rid as ResonanceId} size={24} decorative />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-text">{name(rid as ResonanceId)}</span>
                  <span className="block text-[12px] text-muted">
                    {people
                      /* Identity resolves through the view-model boundary — never a raw
                         fixture read, so no birth-derived field can reach a visitor. */
                      .map((pid) => personViewFor(me, personOf(pid)).name)
                      .join(", ")}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {mine && (
        <span data-sb-resonance-mine={mine} className="sr-only">
          {t("celestial.field.selected")}: {name(mine as ResonanceId)}
        </span>
      )}
    </div>
  );
}

/** Notification row content — Signal tier only, never the Event renderer. */
export function ResonanceNotificationMark({ resonanceId }: { resonanceId: string }) {
  if (!resonanceById(resonanceId)) return null;
  return <ResonanceSignal id={resonanceId as ResonanceId} size={20} decorative />;
}

export { RESONANCES };
