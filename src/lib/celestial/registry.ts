/**
 * CELESTIAL RESONANCE — the Primary 8 registry.
 *
 * FROZEN (Bible Ch. 04, restated binding in 22-OWNER-DECISION-MASCOT-PRESERVED.md §1.4).
 * Order in this array is CANONICAL DISPLAY ORDER everywhere — Field, Human Pulse, history.
 * Never sorted by count, never ranked, never reordered by engagement.
 *
 * Core-18 and Cosmic Atlas candidates are deliberately NOT activated here (Stage 23 §24).
 */

import type { ResonanceDefinition, ResonanceId } from "./types";

export const RESONANCES: ResonanceDefinition[] = [
  {
    resonanceId: "venus-love",
    objectKey: "venus",
    objectNameKey: "celestial.object.venus",
    meaningKey: "celestial.meaning.love",
    canonicalPhraseKey: "celestial.phrase.venus-love",
    visualTier: "primary",
    motionProfile: "attraction",
    seriousContextSafe: true,
    status: "frozen",
  },
  {
    resonanceId: "sun-joy",
    objectKey: "sun",
    objectNameKey: "celestial.object.sun",
    meaningKey: "celestial.meaning.joy",
    canonicalPhraseKey: "celestial.phrase.sun-joy",
    visualTier: "primary",
    motionProfile: "radiate",
    seriousContextSafe: true,
    status: "frozen",
  },
  {
    resonanceId: "meteor-laugh",
    objectKey: "meteors",
    objectNameKey: "celestial.object.meteors",
    meaningKey: "celestial.meaning.laugh",
    canonicalPhraseKey: "celestial.phrase.meteor-laugh",
    visualTier: "primary",
    motionProfile: "rhythmic-burst",
    // Laughter is not appropriate on a Health/Problem Moment.
    seriousContextSafe: false,
    status: "frozen",
  },
  {
    resonanceId: "comet-wow",
    objectKey: "comet",
    objectNameKey: "celestial.object.comet",
    meaningKey: "celestial.meaning.wow",
    canonicalPhraseKey: "celestial.phrase.comet-wow",
    visualTier: "primary",
    motionProfile: "arrive",
    seriousContextSafe: true,
    status: "frozen",
  },
  {
    resonanceId: "jupiter-celebrate",
    objectKey: "jupiter",
    objectNameKey: "celestial.object.jupiter",
    meaningKey: "celestial.meaning.celebrate",
    canonicalPhraseKey: "celestial.phrase.jupiter-celebrate",
    visualTier: "primary",
    motionProfile: "expand-significance",
    seriousContextSafe: false,
    status: "frozen",
  },
  {
    resonanceId: "saturn-support",
    objectKey: "saturn",
    objectNameKey: "celestial.object.saturn",
    meaningKey: "celestial.meaning.support",
    canonicalPhraseKey: "celestial.phrase.saturn-support",
    visualTier: "primary",
    motionProfile: "surround-hold-stabilize-stay",
    seriousContextSafe: true,
    status: "frozen",
  },
  {
    resonanceId: "moon-touched",
    objectKey: "moon",
    objectNameKey: "celestial.object.moon",
    meaningKey: "celestial.meaning.touched",
    canonicalPhraseKey: "celestial.phrase.moon-touched",
    visualTier: "primary",
    motionProfile: "reveal",
    seriousContextSafe: true,
    status: "frozen",
  },
  {
    resonanceId: "mercury-curious",
    objectKey: "mercury",
    objectNameKey: "celestial.object.mercury",
    meaningKey: "celestial.meaning.curious",
    canonicalPhraseKey: "celestial.phrase.mercury-curious",
    visualTier: "primary",
    motionProfile: "approach-inspect-pause-return",
    seriousContextSafe: true,
    status: "frozen",
  },
];

/** Canonical order as plain ids. The one ordering the product ever uses. */
export const RESONANCE_ORDER: ResonanceId[] = RESONANCES.map((r) => r.resonanceId);

/**
 * The accessible name is ONE parameterised template, not eight strings: it composes
 * object + meaning + phrase so the system name always leads and no locale can drift into a
 * bare emotion word (which would collide with Boom's own "Curious"/"Touched").
 * Resolves to e.g. "Celestial Resonance: Mercury, Curious. Tell me more."
 */
export const CELESTIAL_A11Y_KEY = "celestial.a11y.full";

const BY_ID = new Map<string, ResonanceDefinition>(RESONANCES.map((r) => [r.resonanceId, r]));

/** Lookup by stable id. Returns undefined for anything not in the frozen Primary 8. */
export const resonanceById = (id: string): ResonanceDefinition | undefined => BY_ID.get(id);

/** Type guard — a stored string is only a Resonance if the registry knows it. */
export const isResonanceId = (id: string): id is ResonanceId => BY_ID.has(id);

/** Canonical-order comparator. Unknown ids sort last, never first. */
export function byCanonicalOrder(a: string, b: string): number {
  const ia = RESONANCE_ORDER.indexOf(a as ResonanceId);
  const ib = RESONANCE_ORDER.indexOf(b as ResonanceId);
  return (ia < 0 ? Number.MAX_SAFE_INTEGER : ia) - (ib < 0 ? Number.MAX_SAFE_INTEGER : ib);
}

/** Runtime art path. Theme maps: dark → Deep Cosmos, light → Solar Observatory. */
export function resonanceAsset(
  objectKey: ResonanceDefinition["objectKey"],
  theme: "dark" | "light",
  tier: "signal" | "seal" | "object" | "event",
): string {
  return `/celestial/${objectKey}-${theme === "light" ? "solar" : "cosmos"}-${tier}.webp`;
}
