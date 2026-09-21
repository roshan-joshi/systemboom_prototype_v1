/**
 * CELESTIAL RESONANCE — localization-aware horizon layout.
 *
 * Contract: 22-LOCALIZATION-ACCESSIBILITY-CONTRACT.md §1. Ported from the Batch C.1 verified
 * behaviour: measure what the browser actually rendered in the active language, then choose a
 * geometry that fits it. Never assume English width. Devanagari and Cyrillic run 20–40% longer
 * and are NOT shortened to make the geometry easier — the geometry adapts to the language.
 *
 * Three modes, chosen by measurement, in order of preference:
 *   arc    — ONE horizon: the intended silhouette
 *   arc-2  — TWO horizons stacked, when one row cannot give every label clear air
 *   stack  — a vertical list, the honest fallback at narrow widths with long labels
 *
 * The curve is a shallow parabola (peak at centre), not a circle segment: at these spreads it
 * reads as a horizon you look across, and it keeps the rise bounded so nothing is ever clipped.
 */

export interface ItemBox {
  /** Measured label width in CSS px, as rendered in the active language. */
  w: number;
  /** Measured label height in CSS px (a wrapped label is taller). */
  h: number;
  /**
   * The label's MIN-CONTENT width — the longest unbreakable token in this language. This is
   * the real constraint: Dutch "Meteorenregen" and Russian "Любопытство" cannot be wrapped,
   * so a slot narrower than this clips the word no matter how the rest is laid out. Measured,
   * never guessed, and never solved by shortening the translation.
   */
  minW: number;
}

export interface Placed {
  x: number;
  y: number;
  /** How far the arc lifted this item above its row's baseline. Labels subtract it so they
   *  share one baseline per row while the objects keep their curve. */
  lift: number;
}

export interface ArcLayout {
  mode: "arc" | "arc-2" | "stack";
  /** Objects per horizon, chosen from the measured min-content widths. */
  perRow: number;
  positions: Placed[];
  /** Total height the caller must reserve. */
  height: number;
  /** Sample points of each row's horizon curve (the objects' contact line). */
  horizons: Placed[][];
}

const GAP_X = 12;
const GAP_Y = 30;
const LABEL_GAP = 12;

/** Candidate horizon densities, widest first. */
const CANDIDATES = [8, 4, 2, 1];

/** The starting density for a width, before measurement narrows it. */
export function perRowFor(width: number): number {
  if (width >= 1180) return 8;
  if (width >= 300) return 4;
  return 2;
}

/**
 * How many objects share one horizon, given what the labels actually need. Steps DOWN from the
 * width's natural density until every label's longest unbreakable word fits its slot.
 */
export function perRowFrom(width: number, n: number, minW: number, objectSize: number): number {
  const start = perRowFor(width);
  for (const c of CANDIDATES) {
    if (c > start || c > n) continue;
    const slot = width / c;
    if (slot >= minW + GAP_X && slot >= objectSize + 4) return c;
  }
  return 1;
}

/** The max width a label may occupy in a row of `perRow`, with clear air either side. */
export function labelCapFor(width: number, perRow: number, objectSize = 52): number {
  const pad = Math.min(objectSize * 0.55, width * 0.06);
  return Math.max(48, Math.floor(Math.max(1, width - pad * 2) / perRow) - GAP_X);
}

/** Objects shrink on narrow viewports so four still share a horizon comfortably. */
export function objectSizeFor(width: number, base: number): number {
  return width < 560 ? Math.min(base, 60) : base;
}

/** Shallow parabolic rise, capped so the arc never grows into a dome. */
const riseFor = (width: number) => Math.min(22, Math.max(8, width * 0.035));

/**
 * One horizon row. Items sit centred in equal slots; the parabola lifts the centre so the row
 * reads as a curve you look across rather than a toolbar.
 */
function row(boxes: ItemBox[], width: number, objectSize: number, yTop: number) {
  const n = boxes.length;
  const rise = riseFor(width);
  /* Inset the whole row so the outermost object never sits flush against the field's rim —
     a wide-feathered object (the comet's tail, the meteor trails) reads as clipped there. */
  const pad = Math.min(objectSize * 0.55, width * 0.06);
  const span = Math.max(1, width - pad * 2);
  const slot = span / n;
  const positions: Placed[] = [];
  for (let i = 0; i < n; i += 1) {
    const u = n === 1 ? 0 : ((i + 0.5) / n) * 2 - 1; // -1 … +1
    const lift = rise * u * u;
    positions.push({ x: pad + slot * (i + 0.5), y: yTop + lift, lift });
  }
  const labelH = Math.max(...boxes.map((b) => b.h));
  const height = rise + objectSize + LABEL_GAP + labelH;
  // The horizon follows the same curve the objects stand on, sampled at their bases.
  const horizon = positions.map((q) => ({ x: q.x, y: q.y + objectSize * 0.98, lift: 0 }));
  return { positions, height, horizon };
}

/** Measured check: every label's unbreakable minimum must fit inside its own slot. */
function rowFits(boxes: ItemBox[], width: number, objectSize: number): boolean {
  const n = boxes.length;
  if (n <= 1) return true;
  const pad = Math.min(objectSize * 0.55, width * 0.06);
  const slot = Math.max(1, width - pad * 2) / n;
  return boxes.every((b) => Math.max(b.minW, objectSize) <= slot - 2);
}

export function layoutArc(boxes: ItemBox[], width: number, objectSize: number): ArcLayout {
  const n = boxes.length;
  if (!n || width <= 0) return { mode: "arc", perRow: n || 1, positions: [], height: objectSize, horizons: [] };
  const minW = Math.max(...boxes.map((b) => b.minW));
  const perRow = perRowFrom(width, n, minW, objectSize);

  // 1 — one horizon, when every object fits on it.
  if (perRow >= n && rowFits(boxes, width, objectSize)) {
    const r = row(boxes, width, objectSize, 0);
    return { mode: "arc", perRow, positions: r.positions, height: r.height, horizons: [r.horizon] };
  }

  // 2 — stacked horizons of `perRow`, canonical order reading left→right, row by row.
  if (perRow > 1) {
    const rows: ItemBox[][] = [];
    for (let i = 0; i < n; i += perRow) rows.push(boxes.slice(i, i + perRow));
    if (rows.every((r) => rowFits(r, width, objectSize))) {
      const positions: Placed[] = [];
      const horizons: Placed[][] = [];
      let y = 0;
      for (const rb of rows) {
        const r = row(rb, width, objectSize, y);
        positions.push(...r.positions);
        horizons.push(r.horizon);
        y += r.height + GAP_Y;
      }
      return { mode: "arc-2", perRow, positions, height: Math.max(0, y - GAP_Y), horizons };
    }
  }

  // 3 — vertical stack. At narrow widths with long labels the horizon silhouette is not
  // achievable, and clipping or truncating a language is never the trade we make.
  const step = objectSize + LABEL_GAP + Math.max(...boxes.map((b) => b.h)) + GAP_Y;
  return {
    mode: "stack",
    perRow: 1,
    positions: boxes.map((_, i) => ({ x: width / 2, y: i * step, lift: 0 })),
    height: n * step,
    horizons: [],
  };
}
