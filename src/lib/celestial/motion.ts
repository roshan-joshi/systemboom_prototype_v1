/**
 * CELESTIAL RESONANCE — motion runtime.
 *
 * Contract: 22-MOTION-RUNTIME.md. Reuses the shared SYSTEMBOOM tokens (src/lib/motion.ts)
 * and the `motion` package already in the repository — no new dependency.
 *
 * EIGHT PROFILES, NOT ONE ANIMATION EIGHT TIMES. Each object moves the way its feeling moves.
 * Every profile is ONE-SHOT and INTERRUPTIBLE; nothing loops in settled UI; there is no queue.
 *
 * REDUCED MOTION (22.1 closure §2): a 120–180ms STATIC CROSSFADE, ~150ms reference. Opacity
 * only — no spatial translation, orbit, scale travel, camera travel or particle traversal.
 * Removing motion must not mean removing feedback, so it is a crossfade, never an instant cut.
 */

import { easeOut, easeSpatial } from "@/lib/motion";
import type { MotionProfile } from "./types";

/** The reduced-motion crossfade. One number, used everywhere, asserted by the test suite. */
export const REDUCED_CROSSFADE_MS = 150;
export const REDUCED_CROSSFADE_S = REDUCED_CROSSFADE_MS / 1000;

/** A cubic-bezier tuple, the shape Motion for React accepts for `ease`. */
export type Bezier = readonly [number, number, number, number];

export interface Keyframes {
  /** Motion-for-React `animate` target (keyframe arrays allowed). */
  animate: Record<string, number | number[] | string | string[]>;
  duration: number;
  ease?: Bezier;
  times?: number[];
}

/**
 * PREVIEW — what the object does while the pointer/focus rests on it, before any commit.
 * Small, reversible, and already characterful: the preview is where a person learns the
 * difference between the eight without reading a word.
 */
export function previewMotion(profile: MotionProfile): Keyframes {
  switch (profile) {
    case "attraction": // VENUS — drawn toward you; closes distance, never bounces
      return { animate: { scale: [1, 1.075], y: [0, -2] }, duration: 0.34, ease: easeOut };
    case "radiate": // SUN — light pushes outward from the centre
      return { animate: { scale: [1, 1.06], filter: ["brightness(1)", "brightness(1.16)"] }, duration: 0.3, ease: easeOut };
    case "rhythmic-burst": // METEOR SHOWER — three quick impulses, a rhythm not a zoom
      return { animate: { scale: [1, 1.07, 1.01, 1.06], rotate: [0, -2.5, 0.5, -1.5] }, duration: 0.42, times: [0, 0.3, 0.6, 1], ease: easeOut };
    case "arrive": // COMET — enters from off-axis and decelerates hard into place
      return { animate: { x: [-7, 0], y: [5, 0], scale: [0.95, 1.05] }, duration: 0.36, ease: easeSpatial };
    case "expand-significance": // JUPITER — gains presence slowly and keeps it
      return { animate: { scale: [1, 1.11] }, duration: 0.46, ease: easeSpatial };
    case "surround-hold-stabilize-stay": // SATURN — comes around you, then simply stays
      return { animate: { scale: [1, 1.05, 1.035], rotate: [0, 2.5, 1.2] }, duration: 0.5, times: [0, 0.55, 1], ease: easeOut };
    case "reveal": // MOON — emerges out of shadow rather than moving
      return { animate: { filter: ["brightness(0.82)", "brightness(1.1)"], scale: [1, 1.035] }, duration: 0.44, ease: easeOut };
    case "approach-inspect-pause-return": // MERCURY — deliberate curiosity, NOT speed
      return { animate: { scale: [1, 1.08, 1.08, 1.04], x: [0, 2.5, -2.5, 0] }, duration: 0.56, times: [0, 0.32, 0.68, 1], ease: easeOut };
  }
}

/**
 * COMMIT → SETTLE — the one-shot that plays after persistence has already happened.
 * `hold` is how long the richer Event renderer stays mounted before it unmounts into the Seal.
 */
export function commitMotion(profile: MotionProfile): Keyframes & { hold: number } {
  switch (profile) {
    case "attraction":
      return { animate: { scale: [1.08, 1.26, 1], opacity: [1, 1, 1] }, duration: 0.62, times: [0, 0.45, 1], ease: easeOut, hold: 720 };
    case "radiate":
      return { animate: { scale: [1.06, 1.3, 1], filter: ["brightness(1.1)", "brightness(1.45)", "brightness(1)"] }, duration: 0.6, times: [0, 0.38, 1], ease: easeOut, hold: 700 };
    case "rhythmic-burst":
      return { animate: { scale: [1.05, 1.24, 1.06, 1.18, 1], rotate: [0, -4, 1, -2, 0] }, duration: 0.7, times: [0, 0.22, 0.44, 0.68, 1], ease: easeOut, hold: 780 };
    case "arrive":
      return { animate: { x: [-26, 0, 0], y: [18, 0, 0], scale: [0.86, 1.22, 1] }, duration: 0.66, times: [0, 0.5, 1], ease: easeSpatial, hold: 760 };
    case "expand-significance":
      // The only profile that ends LARGER than it started: significance is kept, not returned.
      return { animate: { scale: [1.08, 1.34, 1.12] }, duration: 0.8, times: [0, 0.55, 1], ease: easeSpatial, hold: 900 };
    case "surround-hold-stabilize-stay":
      // SURROUND → HOLD → STABILIZE → STAY. The longest settle, and it does not drift back.
      return { animate: { scale: [1.04, 1.2, 1.14, 1.12], rotate: [0, 8, 2, 0] }, duration: 0.95, times: [0, 0.3, 0.62, 1], ease: easeOut, hold: 1050 };
    case "reveal":
      return { animate: { filter: ["brightness(0.8)", "brightness(1.35)", "brightness(1)"], scale: [1, 1.16, 1.02] }, duration: 0.78, times: [0, 0.5, 1], ease: easeOut, hold: 860 };
    case "approach-inspect-pause-return":
      // APPROACH → INSPECT → PAUSE → RETURN. Reads as attention, never as velocity.
      return { animate: { scale: [1.05, 1.22, 1.22, 1.06], x: [0, 5, -5, 0] }, duration: 0.86, times: [0, 0.3, 0.66, 1], ease: easeOut, hold: 920 };
  }
}

/** Reduced-motion variant: the same visual endpoint, reached by a crossfade. */
export const reducedTransition = { duration: REDUCED_CROSSFADE_S, ease: "linear" as const };
