"use client";

/**
 * THE LIFE RING — one instrument at every scale.
 *
 * Ten 15-year bands (150 years), birth at 12 o'clock, clockwise. Lived time
 * is ice — its opacity deepens with the moments recorded in that band —
 * unwritten time is faint steel. It renders from a RingView produced by the
 * privacy view model: the OWNER's ring carries `fraction` and therefore the
 * red tick and a split current band; anyone else's ring has no fraction, so
 * the current band is drawn whole and there is no tick. Nothing here reads a
 * person's birth data.
 *
 * My World 2030 Visual Leap: at INSTRUMENT scale (size ≥ 140, currently only
 * the Profile Hero) the same geometry above gains physical read — a thicker
 * machined stroke with a radial sheen, the current band raised a touch in
 * radius with its own soft shadow (geometry carries the band FIRST, the text
 * beside it is confirmation, not the primary signal), and — owner only, from
 * the exact `momentsByBand` data already gated by the privacy view model, no
 * new surface — fine engraved marks across a lived band whose density scales
 * with documented Moments there. Every other size (People/Search/Notification/
 * Chat/Composer, still 20–96px everywhere) renders exactly as before this
 * pass — this is additive at large scale only, never a HUD/glow/hologram.
 */

import { useId, useState } from "react";
import { initialsFor } from "@/components/ui/Avatar";
import { CIRCLE_BANDS } from "@/lib/life-time";
import { BAND_COUNT } from "./life";
import type { PersonView, RingView } from "./view-model";

const GAP_DEG = 4;
const INSTRUMENT_MIN = 140;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export interface LifeRingProps {
  person: PersonView;
  ring: RingView;
  /** Outer diameter in px. */
  size: number;
  stroke?: number;
  /** Accessible description of the position ("34y 10m 06d" for the owner, the band otherwise). */
  positionLabel: string;
  /** Module mode: arcs are focusable and announce themselves. */
  interactive?: boolean;
  /** Owner only: calendar years per band for the arc labels. */
  bandYears?: (i: number) => [number, number];
  children?: React.ReactNode;
  className?: string;
  onBand?: (i: number | null) => void;
  /** The ONE profile-entry event (My World 2030 Visual Leap §8) — the Profile Hero only, once. */
  animateEntry?: boolean;
}

export function LifeRing({ person, ring, size, stroke, positionLabel, interactive = false, bandYears, children, className = "", onBand, animateEntry = false }: LifeRingProps) {
  const own = ring.fraction !== undefined;
  const instrument = size >= INSTRUMENT_MIN;
  const sw = stroke ?? (instrument ? Math.round(size * 0.095) : size >= 60 ? 3 : 2);
  const c = size / 2;
  const r = c - sw / 2 - (own ? 2 : 0.5);
  const raisedR = r + 3;
  const step = 360 / BAND_COUNT;
  const livedEnd = own ? ring.fraction! * 360 : (ring.bandIndex + 1) * step;
  const maxMoments = Math.max(1, ...(ring.momentsByBand ?? [1]));
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  // Phase 4.4-A (A22): an empty position label means the ring is decorative — the person's name
  // already sits beside it (PersonIdentity's documented contract). It used to announce
  // "Name — " a second time.
  const decorative = !interactive && positionLabel === "";
  const label = `${person.name} — ${positionLabel}`;

  const setBand = (i: number | null) => {
    setHover(i);
    onBand?.(i);
  };

  // My World 2030 Visual Leap §7: fine engraved marks across a LIVED band, density-scaled from
  // the same `momentsByBand` count the opacity depth already reads — meaning ONLY, never a score:
  // "Moments documented here." Owner-gated exactly as the existing depth mechanic; instrument-only.
  const engrave = (a0: number, a1: number, rr: number, opacity: number) => {
    if (!instrument || opacity <= 0.28) return null;
    const span = a1 - a0;
    const n = Math.max(2, Math.round((span / 6) * Math.min(1, (opacity - 0.28) / 0.72)));
    const marks: React.ReactNode[] = [];
    for (let k = 1; k < n; k++) {
      const deg = a0 + (span * k) / n;
      const [x0, y0] = polar(c, c, rr - sw * 0.3, deg);
      const [x1, y1] = polar(c, c, rr + sw * 0.3, deg);
      marks.push(<line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--engrave, rgba(10,14,22,.65))" strokeWidth={1.1} strokeOpacity={0.42} />);
    }
    return marks;
  };

  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} role={interactive || decorative ? undefined : "img"} aria-label={interactive || decorative ? undefined : label} aria-hidden={decorative || undefined} data-sb-ring={own ? "own" : "other"} data-sb-ring-instrument={instrument ? "" : undefined}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={`absolute inset-0 ${instrument ? "drop-shadow-[0_8px_20px_rgba(10,14,22,.32)]" : ""} ${animateEntry ? "[animation:sb-instrument-resolve_460ms_60ms_ease-out_both]" : ""}`}
        aria-hidden={!interactive}
        role={interactive ? "list" : undefined}
        aria-label={interactive ? `Circle of Life, ${CIRCLE_BANDS.length} bands` : undefined}
      >
        {instrument && (
          <defs>
            <radialGradient id={`${uid}-ice`} cx="32%" cy="28%" r="85%">
              <stop offset="0%" stopColor="var(--ice-hi, #EAF2FC)" />
              <stop offset="100%" stopColor="var(--ice)" />
            </radialGradient>
            <radialGradient id={`${uid}-steel`} cx="32%" cy="28%" r="85%">
              <stop offset="0%" stopColor="var(--steel-hi, var(--steel))" />
              <stop offset="100%" stopColor="var(--steel)" />
            </radialGradient>
            <clipPath id={`${uid}-clip`}>
              <circle cx={c} cy={c} r={r - sw / 2 - 2} />
            </clipPath>
          </defs>
        )}
        {Array.from({ length: BAND_COUNT }, (_, i) => {
          const a0 = i * step + GAP_DEG / 2;
          const a1 = (i + 1) * step - GAP_DEG / 2;
          const count = ring.momentsByBand?.[i] ?? 0;
          // A slightly wider swing than the original 0.35–1.0 (self-critique correction, Person +
          // Life Identity pass): the documented-memory nuance was barely perceptible at a person
          // card's 56–80px. Position (lived/unwritten, the current-band treatment) is untouched —
          // this only makes a genuinely dense band read more clearly next to a sparse one.
          const depth = 0.28 + 0.72 * Math.min(1, count / maxMoments);
          const current = i === ring.bandIndex;
          // My World 2030 Visual Leap §6: geometry carries the current band FIRST — at instrument
          // scale it rises slightly in radius and stroke, with its own soft shadow, so it reads
          // before any text does. Band-level only for a visitor (no exact position, whole band).
          const rr = current && instrument ? raisedR : r;
          const sww = current && instrument ? sw + 3 : sw;
          const ice = instrument ? `url(#${uid}-ice)` : "var(--ice)";
          const steel = instrument ? `url(#${uid}-steel)` : "var(--steel)";
          // Self-critique correction: the shared ice gradient reads as "current" clearly against a
          // dark ground, but was too close in value to read against a light one — geometry alone
          // must carry the band in BOTH themes. The raised band gets its own accent (`--navy`,
          // already the instrument's cool precision colour elsewhere) instead of the ambient ice.
          const liveStroke = current && instrument ? "var(--navy)" : ice;
          const parts: React.ReactNode[] = [];
          if (!own && current) {
            // Band-level only: the current band is drawn whole, a little lighter.
            parts.push(<path key="c" d={arc(c, c, rr, a0, a1)} fill="none" stroke={liveStroke} strokeOpacity={instrument ? 0.9 : depth * 0.85} strokeWidth={sww} />);
            parts.push(...(engrave(a0, a1, rr, depth) ?? []));
          } else if (a1 <= livedEnd) {
            parts.push(<path key="l" d={arc(c, c, rr, a0, a1)} fill="none" stroke={liveStroke} strokeOpacity={current && instrument ? 0.95 : depth} strokeWidth={sww} />);
            parts.push(...(engrave(a0, a1, rr, depth) ?? []));
          } else if (a0 >= livedEnd) {
            parts.push(<path key="u" d={arc(c, c, rr, a0, a1)} fill="none" stroke={steel} strokeOpacity={0.18} strokeWidth={sww} />);
          } else {
            parts.push(<path key="l" d={arc(c, c, rr, a0, livedEnd)} fill="none" stroke={liveStroke} strokeOpacity={current && instrument ? 0.95 : depth} strokeWidth={sww} />);
            parts.push(...(engrave(a0, livedEnd, rr, depth) ?? []));
            parts.push(<path key="u" d={arc(c, c, rr, livedEnd, a1)} fill="none" stroke={steel} strokeOpacity={0.18} strokeWidth={sww} />);
          }
          const raised = current && instrument;
          const body = (
            <g
              key={i}
              className={raised ? "drop-shadow-[0_3px_7px_rgba(10,14,22,.4)]" : undefined}
              style={raised && animateEntry ? { animation: "sb-band-settle 320ms 160ms ease-out both" } : undefined}
              data-sb-band-current={raised ? "" : undefined}
              data-sb-band-engraved={instrument && depth > 0.28 ? "" : undefined}
            >
              {parts}
              {raised && <path d={arc(c, c, rr + sww / 2 + 1.5, a0, a1)} fill="none" stroke="var(--navy)" strokeOpacity={0.9} strokeWidth={1.5} />}
            </g>
          );
          if (!interactive) return body;
          const active = hover === i;
          const years = bandYears ? bandYears(i) : null;
          const state = count ? `, ${count} moments recorded` : i > ring.bandIndex ? ", unwritten" : "";
          return (
            <g
              key={i}
              role="listitem"
              tabIndex={0}
              aria-label={`Band ${CIRCLE_BANDS[i]} years${years ? `, ${years[0]}–${years[1]}` : ""}${state}`}
              onMouseEnter={() => setBand(i)}
              onMouseLeave={() => setBand(null)}
              onFocus={() => setBand(i)}
              onBlur={() => setBand(null)}
              className="outline-none"
            >
              <path d={arc(c, c, r, a0, a1)} fill="none" stroke="transparent" strokeWidth={sw + 14} />
              {body}
              {active && <path d={arc(c, c, r + sw / 2 + 3, a0, a1)} fill="none" stroke="var(--text)" strokeOpacity={0.5} strokeWidth={1} />}
            </g>
          );
        })}
        {own && (
          <g
            transform={`rotate(${livedEnd} ${c} ${c})`}
            style={animateEntry ? { animation: "sb-band-settle 260ms 380ms ease-out both", transformOrigin: `${c}px ${c}px` } : undefined}
          >
            <rect x={c - (sw >= 6 ? 1.5 : 1)} y={c - raisedR - sw / 2 - 2} width={sw >= 6 ? 3 : 2} height={sw + 4 + (instrument ? 3 : 0)} rx={sw >= 6 ? 1 : 0.5} fill="var(--boom)" data-sb-tick-angle={livedEnd.toFixed(2)} />
          </g>
        )}
      </svg>
      <span
        className="absolute flex items-center justify-center overflow-hidden rounded-full"
        style={{ inset: sw + (own ? 4 : 2.5), animation: animateEntry ? "sb-instrument-resolve 420ms ease-out both" : undefined }}
      >
        {children ?? <RingAvatar person={person} size={size - 2 * (sw + (own ? 4 : 2.5))} />}
      </span>
    </span>
  );
}

/**
 * THE PERSON, inside the ring. A real photo where one exists (fallback
 * hierarchy: real photo → initials — there is no illustrated/generated
 * avatar tier in this system, per the Person + Life Identity pass). A photo
 * that fails to load degrades to the same initials tile, never a broken-image
 * icon and never a collapsed ring — the ring's geometry is unaffected either
 * way, so identity failure never reads as a missing person.
 */
export function RingAvatar({ person, size }: { person: PersonView; size: number }) {
  const [failed, setFailed] = useState(false);
  if (person.avatar && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={person.avatar} alt="" width={size} height={size} className="h-full w-full rounded-full object-cover" onError={() => setFailed(true)} data-sb-identity-photo />
    );
  }
  return (
    <span aria-hidden className="flex h-full w-full items-center justify-center rounded-full bg-[var(--sheet-raised)] font-semibold tracking-wide text-text select-none" style={{ fontSize: Math.max(9, Math.round(size * 0.4)) }} data-sb-identity-initials>
      {initialsFor(person.name)}
    </span>
  );
}
