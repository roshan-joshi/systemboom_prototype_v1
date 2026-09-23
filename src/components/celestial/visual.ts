/**
 * CELESTIAL RESONANCE — the visual layer.
 *
 * VISUAL ONLY. Nothing here carries meaning: the registry stays purely semantic, and an accent
 * colour can never change what a Resonance means (22-DATA-CONTRACT.md §3). This module holds
 * the light each object casts, and the atmosphere the field is staged in.
 *
 * The reference-led family uses transparent silhouettes and distinct optical exports.
 * Contact light and emission differ by physical cause; reflected bodies remain quieter
 * than Venus, the Sun, or the travelling phenomena. Legacy feather helpers remain available
 * for the older composed assets, but are not applied to this transparent family.
 */

import { resonanceAsset } from "@/lib/celestial/registry";
import type { ObjectKey } from "@/lib/celestial/types";

export interface ObjectLight {
  /** The colour this object casts into the field. Taken from its own master art. */
  accent: string;
  /** Aura strength multiplier — a comet burns brighter than a moon. */
  intensity: number;
  /** How far the feather reaches before the art dissolves (percentage of the box). */
  feather: number;
  /**
   * True for the light-emitting travellers. A bright streak cannot be seen against a bright
   * sky — on Solar Observatory these two need a patch of real night behind them, which is
   * also how you actually see a comet or a meteor. The discs, planets and the Sun do not.
   */
  needsNightSky?: boolean;
}

export const OBJECT_LIGHT: Record<ObjectKey, ObjectLight> = {
  venus:   { accent: "#E8899B", intensity: 1.00, feather: 62 },
  sun:     { accent: "#F2A93B", intensity: 1.25, feather: 58 },
  // Streaks travel to the corners: they need a wider feather so the trail survives.
  meteors: { accent: "#EF9A46", intensity: 1.15, feather: 72 },
  comet:   { accent: "#6FC4E8", intensity: 1.20, feather: 74 },
  jupiter: { accent: "#D98E52", intensity: 0.55, feather: 60 },
  saturn:  { accent: "#E8CE95", intensity: 1.00, feather: 70 },
  moon:    { accent: "#AFC3DE", intensity: 0.28, feather: 60 },
  mercury: { accent: "#D6B183", intensity: 0.40, feather: 58 },
};

/**
 * The radial mask that dissolves an object's baked square into the sky behind it.
 *
 * `closest-side` is load-bearing: the default `farthest-corner` sizing puts 100% out at the
 * corner, so at the edge MIDPOINTS the mask is still partly opaque and the tile's straight
 * edges stay visible — which is exactly how the objects still read as app icons. With
 * closest-side, 100% is the edge midpoint, so the square is fully gone before it can be seen.
 */
export function featherMask(feather: number): string {
  return `radial-gradient(circle closest-side at 50% 50%, #000 0%, #000 ${feather}%, rgba(0,0,0,0.62) ${Math.min(feather + 16, 88)}%, transparent 99%)`;
}

/** The aura an object casts: its own colour, falling off into nothing. */
export function auraGradient(accent: string, strength: number): string {
  const a = (x: number) => `color-mix(in srgb, ${accent} ${Math.round(x * 100)}%, transparent)`;
  return `radial-gradient(circle at 50% 50%, ${a(0.42 * strength)} 0%, ${a(0.16 * strength)} 34%, ${a(0.05 * strength)} 56%, transparent 72%)`;
}

/** Physical light footprints: attraction, heat, trails, atmosphere, rings and reflection. */
export function artifactAura(object: ObjectKey, strength: number): string {
  const light = OBJECT_LIGHT[object];
  const tint = (value: number) => `color-mix(in srgb, ${light.accent} ${Math.round(value * strength * 100)}%, transparent)`;
  switch (object) {
    case "venus": return `radial-gradient(ellipse at 32% 48%, ${tint(.24)}, transparent 50%), radial-gradient(ellipse at 68% 52%, ${tint(.24)}, transparent 50%)`;
    case "sun": return `radial-gradient(circle, ${tint(.40)} 10%, ${tint(.13)} 35%, transparent 66%)`;
    case "meteors": return `linear-gradient(135deg, transparent 36%, ${tint(.17)} 44%, transparent 48%, ${tint(.14)} 53%, transparent 59%, ${tint(.10)} 63%, transparent 68%)`;
    case "comet": return `linear-gradient(135deg, transparent 35%, ${tint(.22)} 48%, ${tint(.06)} 57%, transparent 70%)`;
    case "jupiter": return `radial-gradient(ellipse 64% 30% at 50% 64%, ${tint(.23)}, transparent 90%)`;
    case "saturn": return `radial-gradient(ellipse 48% 22% at 50% 55%, transparent 38%, ${tint(.20)} 65%, transparent 98%)`;
    case "moon": return `radial-gradient(ellipse 32% 42% at 66% 40%, ${tint(.20)}, transparent 85%)`;
    case "mercury": return `radial-gradient(ellipse 32% 30% at 38% 35%, ${tint(.25)}, transparent 90%)`;
  }
}

/**
 * A deterministic star field. Seeded so the sky is stable across renders and screenshots —
 * stars that reshuffle on every keystroke would read as noise, not depth.
 */
/**
 * The patch of night a traveller is seen against on a light ground. Only the comet and the
 * meteor shower get one: a bright streak is invisible against a bright sky, which is also
 * why you only ever see them at night.
 */
export function nightSkyTheme(theme: "dark" | "light", needsNightSky?: boolean): "dark" | "light" {
  // A traveller keeps its NIGHT master even on Solar Observatory: the solar master paints the
  // streak on white, where it simply cannot be seen. Showing it against real night is both the
  // readable choice and the honest one — that is when you see a comet.
  return theme === "light" && needsNightSky ? "dark" : theme;
}

export function nightSky(): string {
  return "radial-gradient(circle closest-side at 50% 50%, rgba(18,24,48,0.92) 0%, rgba(20,27,54,0.86) 52%, rgba(24,32,62,0.45) 76%, transparent 96%)";
}

export function starField(seed: number, count: number, w: number, h: number) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: count }, () => {
    const r = rnd();
    return {
      x: +(rnd() * w).toFixed(1),
      y: +(rnd() * h).toFixed(1),
      // A few bright stars, many faint ones — an even spread looks like static.
      r: +(r > 0.94 ? 1.35 : r > 0.8 ? 0.95 : 0.6).toFixed(2),
      o: +(r > 0.94 ? 0.75 : r > 0.8 ? 0.42 : 0.22).toFixed(2),
    };
  });
}

/**
 * RESONATE GOLD — the system's signature for the entrance itself.
 *
 * The button is not tinted by whichever object the viewer happened to choose: Resonate is one
 * doorway, and it always burns the same warm gold. The viewer's own committed object shows
 * INSIDE it, as the seal. That is what makes the control read as a place rather than a state.
 */
export const RESONATE_GOLD = "#F2B457";
export const RESONATE_GOLD_HI = "#FFD79A";
/* Solar Observatory is a LIGHT ground: the same gold that glows on deep cosmos becomes
   unreadable on white, so the light theme gets its own darker gold. Not an inversion — a
   remaster, which is the rule for this theme everywhere else too. */
export const RESONATE_GOLD_SOLAR = "#B4761C";
export const RESONATE_GOLD_SOLAR_HI = "#8A5807";
export const resonateGold = (theme: "dark" | "light") => (theme === "light" ? RESONATE_GOLD_SOLAR : RESONATE_GOLD);
export const resonateGoldHi = (theme: "dark" | "light") => (theme === "light" ? RESONATE_GOLD_SOLAR_HI : RESONATE_GOLD_HI);

/**
 * How an object is lit, per theme. On deep cosmos a coloured glow reads as light; on a light
 * ground the same glow reads as haze and eats the streak objects, so Solar Observatory lifts
 * its objects with contrast and a soft neutral shadow instead.
 */
export function objectFilter(theme: "dark" | "light", accent: string, size: number, lit: boolean, emission = 1): string {
  if (theme === "light") {
    return lit
      ? `saturate(1.16) contrast(1.1) drop-shadow(0 ${Math.max(2, size * 0.05)}px ${Math.max(4, size * 0.12)}px rgba(40,50,80,0.30))`
      : `saturate(1.05) contrast(1.04) drop-shadow(0 ${Math.max(1, size * 0.035)}px ${Math.max(3, size * 0.09)}px rgba(40,50,80,0.22))`;
  }
  return lit
    ? `saturate(1.12) contrast(1.05) drop-shadow(0 0 ${size * 0.22}px color-mix(in srgb, ${accent} ${Math.round(50 * emission)}%, transparent))`
    : `saturate(1.02) drop-shadow(0 0 ${size * 0.1}px color-mix(in srgb, ${accent} ${Math.round(24 * emission)}%, transparent))`;
}

/** Deep Cosmos / Solar Observatory atmosphere tokens. Solar is remastered, not inverted. */
export function atmosphere(theme: "dark" | "light") {
  return theme === "light"
    ? {
        basin: "radial-gradient(120% 78% at 50% 108%, rgba(147,185,211,0.19) 0%, rgba(255,255,255,0.65) 42%, transparent 74%)",
        haze: "radial-gradient(70% 120% at 22% 8%, rgba(247,210,142,0.19) 0%, transparent 62%), radial-gradient(64% 110% at 84% 16%, rgba(132,187,225,0.24) 0%, transparent 60%)",
        wash: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(246,247,251,0.52) 58%, rgba(240,243,249,0.62) 100%)",
        star: "#9C7B46",
        orbit: "rgba(147,112,54,0.30)",
        rim: "rgba(120,140,190,0.34)",
        core: "rgba(235,200,150,0.55)",
        nebula: "radial-gradient(90% 60% at 50% 118%, rgba(196,215,226,0.32) 0%, rgba(255,255,255,0.7) 45%, transparent 76%)",
      }
    : {
        basin: "radial-gradient(120% 78% at 50% 108%, rgba(96,124,205,0.20) 0%, rgba(58,78,150,0.10) 42%, transparent 74%)",
        haze: "radial-gradient(70% 120% at 22% 8%, rgba(126,92,200,0.17) 0%, transparent 62%), radial-gradient(64% 110% at 84% 16%, rgba(64,132,190,0.15) 0%, transparent 60%)",
        wash: "linear-gradient(180deg, rgba(6,8,17,0.55) 0%, rgba(7,10,21,0.72) 58%, rgba(8,11,24,0.82) 100%)",
        star: "#C9D6F2",
        orbit: "rgba(158,186,242,0.26)",
        rim: "rgba(150,180,240,0.30)",
        core: "rgba(255,226,178,0.75)",
        nebula: "radial-gradient(95% 62% at 50% 120%, rgba(150,110,210,0.26) 0%, rgba(90,120,210,0.15) 42%, transparent 74%)",
      };
}

/** Transparent reference-led family. Registry semantics and legacy fallback assets stay frozen. */
export const masteredAsset: typeof resonanceAsset = (object, theme, tier) =>
  `/celestial/family/${object}-${theme === "light" ? "solar" : "cosmos"}-${tier}.webp`;
