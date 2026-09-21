/**
 * CELESTIAL RESONANCE — types.
 *
 * Stage 23, Slice 0. Contract: references/celestial-resonance-bible/22-DATA-CONTRACT.md
 *
 * Celestial Resonance is a SEPARATE, ADDITIVE system. It never reuses, extends or reads the
 * Boom Expression vocabulary (`ExpressionId` in social/expressions.tsx). All eight Primary-8
 * meaning words also exist as Boom expression ids — that overlap is resolved by Celestial
 * identity (OBJECT · MEANING + PHRASE), never by sharing a type or a field.
 */

/** The frozen Primary 8. Stable semantic ids — never a display string, never translated. */
export type ResonanceId =
  | "venus-love"
  | "sun-joy"
  | "meteor-laugh"
  | "comet-wow"
  | "jupiter-celebrate"
  | "saturn-support"
  | "moon-touched"
  | "mercury-curious";

/** Asset stem for the runtime art (public/celestial/<objectKey>-<theme>-<tier>.webp). */
export type ObjectKey = "venus" | "sun" | "meteors" | "comet" | "jupiter" | "saturn" | "moon" | "mercury";

/** Optical tiers (Bible Ch. 08). Signal ≤24px · Seal 24–36px · Object in-Field · Event commit-only. */
export type ResonanceTier = "signal" | "seal" | "object" | "event";

/** Per-object emotional physics. One profile per object — never eight copies of one animation. */
export type MotionProfile =
  | "attraction"
  | "radiate"
  | "rhythmic-burst"
  | "arrive"
  | "expand-significance"
  | "surround-hold-stabilize-stay"
  | "reveal"
  | "approach-inspect-pause-return";

/** Visual weight inside the Field. */
export type VisualTier = "primary";

/** Which family a historical entry belongs to, where the two are ever listed together. */
export type ExpressionFamilyTag = "boom" | "celestial";

export interface ResonanceDefinition {
  /** Stable semantic id. Business logic depends on THIS, never on copy. */
  resonanceId: ResonanceId;
  /** Art/asset stem. */
  objectKey: ObjectKey;
  /** i18n key → the object's proper name ("Venus"). */
  objectNameKey: string;
  /** i18n key → the meaning word ("Love"). */
  meaningKey: string;
  /** i18n key → the canonical phrase ("Closer together."). */
  canonicalPhraseKey: string;
  visualTier: VisualTier;
  motionProfile: MotionProfile;
  /** Whether this object is appropriate in serious contexts (Bible Ch. 15). */
  seriousContextSafe: boolean;
  status: "frozen";
}

/**
 * A single committed Resonance. Meaning, visual edition, experience and entitlement are
 * SEPARATE fields — a premium edition is never a ninth meaning.
 */
export interface CelestialResonanceInstance {
  resonanceId: ResonanceId;
  /** Reserved. "default" until visual editions exist; never changes meaning. */
  visualEditionId?: string;
  /** Reserved. Never changes meaning. */
  experienceId?: string;
  /** Reserved. Never affects Human Pulse weight or ordering. */
  entitlement?: string;
  /** Reserved (Memory Capsule, out of Stage 23 scope). */
  memoryBundle?: string;
}

/** What a person committed on a Chat message. Actor-aware: the person is the key, not a field. */
export interface ChatResonanceEntry {
  resonanceId: ResonanceId;
  /** ISO timestamp. No Life data, no birth data, no age, no location — ever. */
  at: string;
}

/** Aggregate shape the Human Pulse surface consumes. People, not popularity. */
export interface ResonanceSummaryEntry {
  resonanceId: ResonanceId;
  count: number;
  viewerHasSelected: boolean;
  /** Person ids only. Identity is resolved through view-model.ts, never read raw. */
  personIds: string[];
}

/** Learning state (Bible Ch. 11). Caller-supplied local product progress — never profiling. */
export type LearningState = "new" | "learning" | "learned";

/** Field phases. CANCEL/RETURN reachable from OPEN or PREVIEW. */
export type FieldPhase =
  | "closed"
  | "opening"
  | "open"
  | "preview"
  | "selected"
  | "commit"
  | "settle"
  | "cancel"
  | "return";
