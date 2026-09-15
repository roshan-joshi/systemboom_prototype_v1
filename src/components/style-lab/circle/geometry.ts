/**
 * CIRCLE OF LIFE — arc geometry. Birth (or the ring's origin) at 12 o'clock,
 * clockwise. Angles are in degrees from 12 o'clock. The gap between segments is
 * a constant length in view units, so ten bands and thirty-one days read as the
 * same instrument at different resolutions.
 */

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
}

/** An open arc path from a0 to a1 (degrees clockwise from 12 o'clock). */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  if (a1 - a0 >= 359.999) {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [xm, ym] = polar(cx, cy, r, a0 + 180);
    return `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${xm} ${ym} A ${r} ${r} 0 1 1 ${x0} ${y0}`;
  }
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** Angular extent of a gap of `px` units at radius r. */
export function gapDegrees(px: number, r: number): number {
  return (px / (2 * Math.PI * r)) * 360;
}

export interface SegmentAngles {
  a0: number;
  a1: number;
  mid: number;
}

/** Angles for n equal segments with a constant-length gap. */
export function segmentAngles(n: number, r: number, gapPx: number): SegmentAngles[] {
  const step = 360 / n;
  const g = Math.min(gapDegrees(gapPx, r), step * 0.35);
  return Array.from({ length: n }, (_, i) => ({ a0: i * step + g / 2, a1: (i + 1) * step - g / 2, mid: i * step + step / 2 }));
}

/** Angle (degrees from 12 o'clock) of a point relative to a centre. */
export function angleOf(cx: number, cy: number, x: number, y: number): number {
  const a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90;
  return (a + 360) % 360;
}
