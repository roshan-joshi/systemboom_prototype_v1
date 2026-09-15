/**
 * CIRCLE OF LIFE — the temporal model.
 *
 * One person's life as 150 years from birth, resolved at five resolutions:
 *   0 LIFE   ten 15-year bands
 *   1 BAND   fifteen life-years (birthday → birthday)
 *   2 YEAR   the twelve calendar months of one life-year, starting at the birth month
 *   3 MONTH  the real days of one calendar month (28 / 29 / 30 / 31)
 *   4 DAY    the Almanac — the Moments recorded at that coordinate
 *
 * Birth is the origin at 12 o'clock; time runs clockwise. Every segment knows
 * how much of it has been lived at `now`, to the precision SYSTEMBOOM honestly
 * holds. Nothing here counts down: unwritten time is simply unwritten.
 *
 * Privacy is structural: everything a VISITOR's Circle can show is produced by
 * `circleViewFor(viewer, subject, …)`, and for another person that is band
 * resolution only — no lived fraction, no tick, no per-segment counts (counts
 * of dated Moments per age band would narrow the birth date), no drilling.
 * Documentation density is derived from the VIEWER-SAFE Moment set, never from
 * the owner's full set with private Moments hidden afterwards.
 */

import { birthInstant } from "@/lib/identity/birth";
import { CIRCLE_BANDS, CIRCLE_YEARS, computeLifeTime, currentBandIndex } from "@/lib/life-time";
import type { Moment, Person } from "../social/data";

export const BANDS = CIRCLE_BANDS.length; // 10
export const BAND_YEARS = CIRCLE_YEARS / BANDS; // 15
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export type Level = 0 | 1 | 2 | 3 | 4;
export const LEVEL_NAME: Record<Level, string> = { 0: "Life", 1: "Band", 2: "Year", 3: "Month", 4: "Day" };

/** A temporal coordinate. Deeper fields imply the shallower ones. */
export interface Coord {
  level: Level;
  band?: number; // 0–9
  age?: number; // 0–149 (the life-year)
  ym?: string; // "YYYY-MM"
  date?: string; // "YYYY-MM-DD"
}

export type SegmentState = "lived" | "partial" | "unwritten" | "band"; // "band" = visitor resolution, no lived split

export interface Segment {
  key: string;
  index: number;
  /** Primary label (age first). */
  label: string;
  /** Secondary calendar reference, owner only. */
  secondary?: string;
  /** Accessible name. */
  name: string;
  start: Date;
  end: Date;
  state: SegmentState;
  /** 0–1 of the segment lived at `now`. */
  lived: number;
  /** Moments recorded inside this segment (viewer-safe). Undefined for a visitor. */
  count?: number;
  /** Can the person look closer here? */
  enterable: boolean;
  /** The coordinate entering this segment resolves to. */
  target?: Coord;
  isNow: boolean;
}

export interface CircleView {
  scope: "owner" | "other";
  subject: { id: string; name: string; home: string };
  coord: Coord;
  level: Level;
  segments: Segment[];
  /** Angle 0–360 of the present instant on this ring, owner only, only when this ring contains now. */
  nowAngle?: number;
  /** The centre readout: primary, secondary, tertiary lines. */
  readout: { primary: string; secondary?: string; tertiary?: string };
  /** Breadcrumb from LIFE down to this level. */
  crumbs: { label: string; coord: Coord }[];
  /** Day level: the Moments at this coordinate (viewer-safe, chronological). */
  moments?: Moment[];
  /** Day level: the exact age on that day (owner). */
  dayAge?: string;
  /** Max sibling count, for density scaling. */
  maxCount: number;
  precision: "minute" | "day";
  /** Whether the whole ring is in the past, present or future. */
  ringState: "lived" | "partial" | "unwritten";
}

/* ---------- calendar helpers ---------- */

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();
export const ymKey = (y: number, m0: number) => `${y}-${pad2(m0 + 1)}`;
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const parseYM = (ym: string) => ({ y: Number(ym.slice(0, 4)), m0: Number(ym.slice(5, 7)) - 1 });
export const parseDate = (s: string) => new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
export const formatDate = (d: Date) => `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** Add whole years to a birth instant, clamping 29 FEB to 28 FEB in non-leap years. */
export function addYears(d: Date, years: number): Date {
  const y = d.getFullYear() + years;
  const dim = daysInMonth(y, d.getMonth());
  return new Date(y, d.getMonth(), Math.min(d.getDate(), dim), d.getHours(), d.getMinutes(), d.getSeconds());
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const frac = (start: Date, end: Date, now: Date) => clamp01((now.getTime() - start.getTime()) / (end.getTime() - start.getTime()));
const stateOf = (f: number): SegmentState => (f >= 1 ? "lived" : f <= 0 ? "unwritten" : "partial");

/* ---------- the viewer-safe Moment set (structural privacy) ---------- */

/**
 * The Moments a viewer may know about for a subject. Private (only-me) Moments of
 * another person are not "filtered later" — they never enter any Circle computation.
 */
export function visibleMoments(viewer: Person, subject: Person, moments: Moment[], hidden: string[] = []): Moment[] {
  const own = viewer.id === subject.id;
  return moments.filter((m) => m.authorId === subject.id && !hidden.includes(m.id) && (own || m.privacy !== "onlyme"));
}

const countIn = (moments: Moment[], start: Date, end: Date) => {
  let n = 0;
  for (const m of moments) {
    const t = new Date(m.at).getTime();
    if (t >= start.getTime() && t < end.getTime()) n += 1;
  }
  return n;
};

/* ---------- coordinate derivation ---------- */

/** The life-year (age) that a calendar month belongs to: life-years begin at the birth month. */
export function ageOfMonth(birth: Date, y: number, m0: number): number {
  return Math.floor(((y - birth.getFullYear()) * 12 + (m0 - birth.getMonth())) / 12);
}

/** Complete a coordinate so every shallower field is present and consistent. */
export function normalizeCoord(c: Coord, birth: Date): Coord {
  const out: Coord = { level: c.level };
  if (c.level >= 4 && c.date) {
    out.date = c.date;
    out.ym = c.date.slice(0, 7);
  } else if (c.level >= 3 && c.ym) out.ym = c.ym;
  if (out.ym) {
    const { y, m0 } = parseYM(out.ym);
    out.age = ageOfMonth(birth, y, m0);
  } else if (c.level >= 2 && c.age !== undefined) out.age = c.age;
  if (out.age !== undefined) out.band = Math.min(BANDS - 1, Math.floor(out.age / BAND_YEARS));
  else if (c.level >= 1 && c.band !== undefined) out.band = c.band;
  // Coordinates cannot be shallower than their fields allow.
  if (out.level >= 1 && out.band === undefined) out.level = 0;
  if (out.level >= 2 && out.age === undefined) out.level = 1;
  if (out.level >= 3 && out.ym === undefined) out.level = 2;
  if (out.level >= 4 && out.date === undefined) out.level = 3;
  return out;
}

/** URL grammar: c=life | c=band:2 | c=age:34 | c=month:2026-09 | c=day:2026-09-10 */
export function encodeCoord(c: Coord): string {
  switch (c.level) {
    case 0:
      return "life";
    case 1:
      return `band:${c.band}`;
    case 2:
      return `age:${c.age}`;
    case 3:
      return `month:${c.ym}`;
    case 4:
      return `day:${c.date}`;
  }
}

export function decodeCoord(s: string | null | undefined): Coord {
  if (!s || s === "life") return { level: 0 };
  const [kind, v] = s.split(":");
  if (kind === "band" && /^\d$/.test(v ?? "")) return { level: 1, band: Number(v) };
  if (kind === "age" && /^\d{1,3}$/.test(v ?? "") && Number(v) < CIRCLE_YEARS) return { level: 2, age: Number(v) };
  if (kind === "month" && /^\d{4}-\d{2}$/.test(v ?? "")) return { level: 3, ym: v };
  if (kind === "day" && /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") && !Number.isNaN(parseDate(v).getTime())) return { level: 4, date: v };
  return { level: 0 };
}

/** The coordinate a calendar date resolves to at day resolution (Jump to date, future View in Life). */
export function coordForDate(date: string): Coord {
  return { level: 4, date };
}

/* ---------- the Circle view ---------- */

export function circleViewFor(viewer: Person, subject: Person, coordIn: Coord, now: Date, allMoments: Moment[], hidden: string[] = []): CircleView {
  const own = viewer.id === subject.id;
  const { at: birth, precision } = birthInstant(subject);
  const ageNow = computeLifeTime(birth, now).years;
  const bandNow = currentBandIndex(ageNow);
  const subj = { id: subject.id, name: subject.name, home: subject.home };

  /* ---- VISITOR: band resolution only. Nothing below is derived from another person's birth instant except the band. ---- */
  if (!own) {
    const segments: Segment[] = CIRCLE_BANDS.map((label, i) => ({
      key: `band-${i}`,
      index: i,
      label,
      name: `Band ${label} years${i < bandNow ? ", lived" : i === bandNow ? ", their current band" : ", unwritten"}`,
      start: new Date(0),
      end: new Date(0),
      state: i <= bandNow ? "band" : "unwritten",
      lived: i <= bandNow ? 1 : 0,
      enterable: false,
      isNow: i === bandNow,
    }));
    return {
      scope: "other",
      subject: subj,
      coord: { level: 0 },
      level: 0,
      segments,
      readout: { primary: CIRCLE_BANDS[bandNow], tertiary: `${subject.name.split(" ")[0]}'s exact position is theirs` },
      crumbs: [{ label: "Life", coord: { level: 0 } }],
      maxCount: 0,
      precision: "day",
      ringState: "partial",
    };
  }

  /* ---- OWNER ---- */
  const coord = normalizeCoord(coordIn, birth);
  const moments = visibleMoments(viewer, subject, allMoments, hidden);
  const crumbs: { label: string; coord: Coord }[] = [{ label: "Life", coord: { level: 0 } }];
  if (coord.band !== undefined) crumbs.push({ label: CIRCLE_BANDS[coord.band], coord: { level: 1, band: coord.band } });
  if (coord.age !== undefined && coord.level >= 2) crumbs.push({ label: `Age ${coord.age}`, coord: { level: 2, age: coord.age } });
  if (coord.ym && coord.level >= 3) crumbs.push({ label: MONTHS[parseYM(coord.ym).m0], coord: { level: 3, ym: coord.ym } });
  if (coord.date && coord.level >= 4) crumbs.push({ label: pad2(parseDate(coord.date).getDate()), coord: { level: 4, date: coord.date } });

  let segments: Segment[] = [];
  let readout: CircleView["readout"];
  let ringStart: Date;
  let ringEnd: Date;
  let dayMoments: Moment[] | undefined;
  let dayAge: string | undefined;

  const seg = (key: string, index: number, label: string, secondary: string | undefined, start: Date, end: Date, target: Coord | undefined, describe: (s: SegmentState, n: number) => string): Segment => {
    const f = frac(start, end, now);
    const state = stateOf(f);
    const count = countIn(moments, start, end);
    return {
      key,
      index,
      label,
      secondary,
      name: describe(state, count),
      start,
      end,
      state,
      lived: f,
      count,
      enterable: f > 0 && !!target,
      target,
      isNow: state === "partial",
    };
  };
  const recorded = (n: number) => (n === 0 ? "no Moments recorded" : n === 1 ? "1 Moment recorded" : `${n} Moments recorded`);
  const livedWord = (s: SegmentState) => (s === "lived" ? "lived" : s === "partial" ? "partly lived" : "unwritten");

  const lifeNow = computeLifeTime(birth, now);
  const exactNow = `${lifeNow.years}y ${pad2(lifeNow.months)}m ${pad2(lifeNow.days)}d`;

  switch (coord.level) {
    case 0: {
      ringStart = birth;
      ringEnd = addYears(birth, CIRCLE_YEARS);
      segments = CIRCLE_BANDS.map((label, i) => {
        const start = addYears(birth, i * BAND_YEARS);
        const end = addYears(birth, (i + 1) * BAND_YEARS);
        return seg(`band-${i}`, i, label, `${start.getFullYear()}–${end.getFullYear()}`, start, end, { level: 1, band: i }, (s, n) => `Band ${label} years, ${start.getFullYear()} to ${end.getFullYear()}, ${livedWord(s)}, ${recorded(n)}`);
      });
      readout = { primary: `Age ${ageNow}`, secondary: "your life", tertiary: exactNow };
      break;
    }
    case 1: {
      const b = coord.band!;
      ringStart = addYears(birth, b * BAND_YEARS);
      ringEnd = addYears(birth, (b + 1) * BAND_YEARS);
      segments = Array.from({ length: BAND_YEARS }, (_, k) => {
        const age = b * BAND_YEARS + k;
        const start = addYears(birth, age);
        const end = addYears(birth, age + 1);
        return seg(`age-${age}`, k, `${age}`, `${start.getFullYear()}`, start, end, { level: 2, age }, (s, n) => `Age ${age}, ${start.getFullYear()} to ${end.getFullYear()}, ${livedWord(s)}, ${recorded(n)}`);
      });
      readout = { primary: CIRCLE_BANDS[b], secondary: `${ringStart.getFullYear()}–${ringEnd.getFullYear()}`, tertiary: b === bandNow ? `age ${ageNow} now` : undefined };
      break;
    }
    case 2: {
      const age = coord.age!;
      const first = addYears(birth, age);
      ringStart = new Date(first.getFullYear(), first.getMonth(), 1);
      ringEnd = new Date(first.getFullYear(), first.getMonth() + 12, 1);
      segments = Array.from({ length: 12 }, (_, k) => {
        const start = new Date(first.getFullYear(), first.getMonth() + k, 1);
        const end = new Date(first.getFullYear(), first.getMonth() + k + 1, 1);
        const ym = ymKey(start.getFullYear(), start.getMonth());
        return seg(`month-${ym}`, k, MONTHS[start.getMonth()], `${start.getFullYear()}`, start, end, { level: 3, ym }, (s, n) => `${MONTHS[start.getMonth()]} ${start.getFullYear()}, ${livedWord(s)}, ${recorded(n)}`);
      });
      const last = new Date(ringEnd.getTime() - 1);
      readout = { primary: `Age ${age}`, secondary: `${MONTHS[ringStart.getMonth()]} ${ringStart.getFullYear()} – ${MONTHS[last.getMonth()]} ${last.getFullYear()}`, tertiary: age === ageNow ? exactNow : undefined };
      break;
    }
    case 3:
    case 4: {
      const { y, m0 } = parseYM(coord.ym!);
      ringStart = new Date(y, m0, 1);
      ringEnd = new Date(y, m0 + 1, 1);
      const n = daysInMonth(y, m0);
      segments = Array.from({ length: n }, (_, k) => {
        const start = new Date(y, m0, k + 1);
        const end = new Date(y, m0, k + 2);
        const date = dateKey(start);
        return seg(`day-${date}`, k, `${k + 1}`, undefined, start, end, { level: 4, date }, (s, c) => `${formatDate(start)}, ${s === "partial" ? "today" : livedWord(s)}, ${recorded(c)}`);
      });
      const age = coord.age!;
      if (coord.level === 3) {
        readout = { primary: `${MONTHS[m0]} ${y}`, secondary: `age ${age}`, tertiary: ymKey(now.getFullYear(), now.getMonth()) === coord.ym ? `${now.getDate()} ${MONTHS[m0]} today` : undefined };
      } else {
        const day = parseDate(coord.date!);
        const dayEnd = new Date(y, m0, day.getDate() + 1);
        dayMoments = moments.filter((m) => new Date(m.at).getTime() >= day.getTime() && new Date(m.at).getTime() < dayEnd.getTime()).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        const t = computeLifeTime(birth, new Date(y, m0, day.getDate(), 12));
        dayAge = `${t.years}y ${pad2(t.months)}m ${pad2(t.days)}d`;
        readout = { primary: formatDate(day), secondary: dayAge, tertiary: subject.home || undefined };
      }
      break;
    }
  }

  const ringLived = frac(ringStart, ringEnd, now);
  const nowSeg = segments.find((s) => s.isNow);
  let nowAngle: number | undefined;
  if (nowSeg) {
    const step = 360 / segments.length;
    nowAngle = nowSeg.index * step + nowSeg.lived * step;
  }
  const maxCount = segments.reduce((m, s) => Math.max(m, s.count ?? 0), 0);

  return {
    scope: "owner",
    subject: subj,
    coord,
    level: coord.level,
    segments,
    nowAngle,
    readout,
    crumbs,
    moments: dayMoments,
    dayAge,
    maxCount,
    precision,
    ringState: stateOf(ringLived) as "lived" | "partial" | "unwritten",
  };
}

/** The coordinate one level out. */
export function parentCoord(c: Coord): Coord {
  switch (c.level) {
    case 0:
      return c;
    case 1:
      return { level: 0 };
    case 2:
      return { level: 1, band: c.band };
    case 3:
      return { level: 2, age: c.age, band: c.band };
    case 4:
      return { level: 3, ym: c.ym, age: c.age, band: c.band };
  }
}

/** Where `now` sits at a given level — the segment index that contains the present. */
export function nowIndex(view: CircleView): number {
  const i = view.segments.findIndex((s) => s.isNow);
  return i >= 0 ? i : -1;
}
