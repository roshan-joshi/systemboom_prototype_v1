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

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale } from "@/lib/i18n/format";
import { useTheme } from "@/lib/use-theme";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { RESONANCES, resonanceById } from "@/lib/celestial/registry";
import type { ResonanceId, ResonanceSummaryEntry } from "@/lib/celestial/types";
import { useCelestialSurface } from "@/lib/celestial/flags";
import { summarizeResonances, resonatorTotal } from "@/lib/celestial/resonance-summary";
import type { Moment } from "@/components/style-lab/social/data";
import { useSocial } from "@/components/style-lab/social/store";
import { personViewFor } from "@/components/style-lab/social/view-model";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
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
  const [attending, setAttending] = useState(false);
  const [pressing, setPressing] = useState(false);
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
        data-sb-resonate-attending={attending ? "1" : "0"}
        data-sb-resonate-pressing={pressing ? "1" : "0"}
        aria-expanded={open}
        aria-label={mine ? name(mine) : t("celestial.action.resonate")}
        onClick={openField}
        onPointerEnter={() => setAttending(true)}
        onPointerLeave={() => { setAttending(false); setPressing(false); }}
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onFocus={() => setAttending(true)}
        onBlur={() => setAttending(false)}
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
/* CELESTIAL HUMAN PULSE — THE SHARED RESONANCE CONSTELLATION          */
/* ------------------------------------------------------------------ */

/**
 * PEOPLE, NOT POPULARITY.
 *
 * Canonical registry order, always. Never sorted by count, never a winner, never a "top",
 * never sized by count — a 312 and a 3 are the same Seal. An entitlement or a visual edition
 * can never change what is shown here. The count is a fact about people, not a score.
 *
 * One person = one celestial signal; together they form the Moment's shared constellation.
 * Aggregation is the ONE pure rule in src/lib/celestial/resonance-summary.ts, so this strip,
 * the expanded stage and any future surface can never drift apart.
 */

/** How many people each expanded group shows before its quiet "Show more" (then +48 — Bible Ch. 14). */
const WHO_FIRST = 24;
const WHO_STEP = 48;

export function ResonanceSummary({ moment }: { moment: Moment }) {
  const enabled = useCelestialSurface("moment");
  const { t, tp, locale } = useT();
  const { me, personOf } = useSocial();
  const name = useResonanceName();
  const [openWho, setOpenWho] = useState(false);
  const [whoShown, setWhoShown] = useState<Record<string, number>>({});
  const whoRef = useRef<HTMLButtonElement>(null);

  /* Quiet count/arrival motion (brief §42, §53–§55): a NEW meaning settles in at its canonical
     position and a changed count crossfades — one-shot, localized, never fireworks, and never
     on first mount. The previous committed shape lives in a ref and the diff is applied AFTER
     render (never read during it); count spans are keyed by their value, so a live change
     mounts a fresh element for the one-shot class. Reduced motion collapses both to the
     shared 150ms rule via the environment stylesheet. */
  const prevShape = useRef<Map<string, number> | null>(null);
  const stripRef = useRef<HTMLSpanElement>(null);

  const entries = summarizeResonances(moment.resonances, me.id);
  useEffect(() => {
    const prev = prevShape.current;
    const root = stripRef.current;
    /* Only a LIVE change by one person is an arrival: someone joins (+1), leaves (−1), or moves
       their one signal (±0). A larger jump is data arriving — a first load, a page of history —
       and it lands still. Never sixteen arrivals at once. */
    const prevTotal = prev ? [...prev.values()].reduce((a, b) => a + b, 0) : 0;
    const oneLiveChange = prev !== null && Math.abs(resonatorTotal(entries) - prevTotal) <= 1;
    if (prev && root && oneLiveChange) {
      for (const e of entries) {
        const node = root.querySelector(`[data-sb-constellation-node="${e.resonanceId}"]`);
        if (!node) continue;
        if (!prev.has(e.resonanceId)) node.classList.add("sb-cel-node-new");
        else if (prev.get(e.resonanceId) !== e.count) node.querySelector(".sb-cel-count")?.classList.add("sb-cel-count-in");
      }
    }
    prevShape.current = new Map(entries.map((x) => [x.resonanceId, x.count]));
  });

  if (!enabled || entries.length === 0) return null;

  const total = resonatorTotal(entries);
  const fmt = (n: number) => formatNumberLocale(locale, n);
  const mine = moment.resonances?.[me.id];

  const typeLine = (e: ResonanceSummaryEntry) => {
    const d = resonanceById(e.resonanceId);
    return d
      ? tp("celestial.summary.typeCount", e.count, { meaning: t(d.meaningKey), object: t(d.objectNameKey), n: fmt(e.count) })
      : "";
  };

  const closeWho = () => {
    setOpenWho(false);
    requestAnimationFrame(() => whoRef.current?.focus({ preventScroll: true }));
  };

  return (
    <div data-sb-resonance-summary={total} className="sb-cel-constellation mt-1 flex w-full min-w-0 flex-wrap items-center gap-2">
      <button
        ref={whoRef}
        type="button"
        data-sb-resonance-who
        aria-expanded={openWho}
        aria-label={t("celestial.summary.who")}
        onClick={() => setOpenWho((v) => !v)}
        className="inline-flex min-h-9 min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full px-1.5 text-muted hover:text-text focus-visible:outline-[var(--focus)]"
      >
        {/* THE CONSTELLATION STRIP — present meanings as fixed points on one fine shared
            horizon. Equal Seals, canonical order, quiet participation numbers. */}
        <span ref={stripRef} className="sb-cel-strip">
          {entries.map((e) => (
            <span
              key={e.resonanceId}
              data-sb-constellation-node={e.resonanceId}
              data-sb-resonance-count={e.count}
              className="sb-cel-node"
            >
              {/* The viewer's own signal: a fine personal orbit, never a bigger object. */}
              {e.viewerHasSelected && <span data-sb-resonance-yours aria-hidden className="sb-cel-your-ring" />}
              {/* Every present resonance is shown at the SAME size. Size never encodes count. */}
              <ResonanceSeal id={e.resonanceId} size={22} decorative />
              {total > 1 && (
                <span key={`${e.resonanceId}-${e.count}`} className="sb-cel-count tabular-nums" aria-hidden>
                  {fmt(e.count)}
                </span>
              )}
            </span>
          ))}
        </span>
        <span className="text-[12.5px]">{tp("celestial.summary.peopleN", total, { n: fmt(total) })}</span>
      </button>

      {/* Screen readers get the whole constellation without opening it: "Love, Venus: 4 people." */}
      <span className="sr-only">{entries.map(typeLine).join(" ")}</span>

      {openWho && (
        <div
          data-sb-resonance-who-panel
          className="sb-cel-stage w-full rounded-xl border border-[var(--hair)] p-3"
          role="group"
          aria-label={t("celestial.summary.aria")}
          onKeyDown={(ev) => {
            if (ev.key === "Escape") {
              ev.stopPropagation();
              closeWho();
            }
          }}
        >
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">{t("celestial.constellation.title")}</span>
            <span className="text-[11px] text-muted">{tp("celestial.summary.peopleN", total, { n: fmt(total) })}</span>
            <button
              type="button"
              aria-label={t("celestial.constellation.close")}
              onClick={closeWho}
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-text focus-visible:outline-[var(--focus)]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
          {entries.map((e) => {
            const shown = whoShown[e.resonanceId] ?? WHO_FIRST;
            /* PRIVACY: a person appears here only through the view model, and only when the
               view model resolves THAT person. Participation grants no access: the row reads
               `personViewFor` (never a raw Person field) and hands the subject to PersonIdentity,
               the one identity component, which reduces it the same way. Anyone the view model
               cannot resolve — or resolves to a different person — is counted, never shown. */
            const named: { pid: string; person: ReturnType<typeof personOf>; view: ReturnType<typeof personViewFor> }[] = [];
            for (const pid of e.personIds) {
              const person = personOf(pid);
              if (person.id !== pid) continue;
              const view = personViewFor(me, person);
              if (view.name) named.push({ pid, person, view });
            }
            const unnamed = e.count - named.length;
            const people = named.slice(0, shown);
            const remaining = named.length - people.length;
            const d = resonanceById(e.resonanceId);
            return (
              <div key={e.resonanceId} data-sb-resonance-group={e.resonanceId} className="sb-cel-group flex items-start gap-2.5 px-1 py-2">
                <span className="relative mt-0.5 shrink-0">
                  {e.viewerHasSelected && <span aria-hidden className="sb-cel-your-ring sb-cel-your-ring-stage" />}
                  <ResonanceSeal id={e.resonanceId} size={24} decorative />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-text">
                      {d ? `${t(d.objectNameKey)} · ${t(d.meaningKey)}` : ""}
                    </span>
                    {/* The participation number: a fact about people, equal typography for every meaning. */}
                    <span className="text-[11.5px] text-muted tabular-nums">{fmt(e.count)}</span>
                    <span className="sr-only">{name(e.resonanceId)} — {typeLine(e)}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    {people.map(({ pid, person, view }) => (
                      <span key={pid} data-sb-resonance-person={pid} className="inline-flex min-w-0 items-center gap-1.5">
                        <PersonIdentity viewer={me} subject={person} size={20} label="" />
                        <span className="max-w-[16ch] truncate text-[12px] text-muted">{view.name}</span>
                        {pid === me.id && <span data-sb-resonance-me className="text-[10.5px] font-medium" style={{ color: "var(--sb-cel-you, #C9A25E)" }}>{t("celestial.summary.justYou")}</span>}
                      </span>
                    ))}
                    {unnamed > 0 && (
                      /* The aggregate fallback: these people are counted in the constellation
                         but carry no identity the viewer may see. */
                      <span data-sb-resonance-unnamed={unnamed} className="text-[12px] text-muted">
                        +{tp("celestial.summary.peopleN", unnamed, { n: fmt(unnamed) })}
                      </span>
                    )}
                    {remaining > 0 && (
                      <button
                        type="button"
                        data-sb-resonance-more={e.resonanceId}
                        onClick={() => setWhoShown((s) => ({ ...s, [e.resonanceId]: shown + WHO_STEP }))}
                        className="rounded-full border border-[var(--hair)] px-2 py-0.5 text-[11px] text-muted hover:text-text focus-visible:outline-[var(--focus)]"
                      >
                        {t("celestial.constellation.more")} · {fmt(remaining)}
                      </button>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {mine && (
        <span data-sb-resonance-mine={mine} className="sr-only">
          {t("celestial.field.selected")}: {name(mine as ResonanceId)} — {t("celestial.summary.youResonated", {
            object: t(resonanceById(mine)?.objectNameKey ?? ""),
            meaning: t(resonanceById(mine)?.meaningKey ?? ""),
          })}
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
