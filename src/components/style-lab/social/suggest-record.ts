/**
 * UNIVERSAL COMPOSER — one quiet record-type suggestion.
 *
 * STATUS: PROTOTYPE HEURISTIC (keyword signals), not production AI. This repository has no
 * inference infrastructure (audited: no vision/caption/EXIF pipeline exists here — the live
 * product owns those). The adapter is deliberately REPLACEABLE: the live system swaps
 * `suggestRecordType` for a real classifier behind the same signature and the Composer
 * changes nothing.
 *
 * Product rules it encodes (Universal Composer brief §25):
 *  - at most ONE suggestion, only above a confidence floor — uncertainty shows NOTHING;
 *  - it never interrupts typing (the Composer debounces and renders it passively);
 *  - it never classifies silently — accepting is always the person's own tap.
 */
import type { Kind } from "./data";

export type SuggestableKind = Exclude<Kind, "moment">;
export interface RecordSuggestion {
  kind: SuggestableKind;
  /** 0..1 — the Composer shows the suggestion only when ≥ CONFIDENCE_FLOOR. */
  confidence: number;
  /** Which implementation produced this — surfaced in the handover, never in the UI. */
  source: "heuristic";
}

export const CONFIDENCE_FLOOR = 0.75;

/** Strong words decide alone; weak words need company. Word-boundary matched, lowercased. */
const SIGNALS: Record<SuggestableKind, { strong: string[]; weak: string[] }> = {
  meal: {
    strong: ["dinner", "lunch", "breakfast", "brunch", "momo", "momos", "restaurant", "cooked", "cena", "pranzo", "colazione"],
    weak: ["meal", "pizza", "pasta", "tea", "coffee", "cafe", "café", "ate", "eating", "food", "kitchen", "recipe", "dal", "bhat"],
  },
  activity: {
    strong: ["run", "ran", "running", "hike", "hiked", "hiking", "trek", "trekked", "gym", "workout", "cycled", "cycling", "swim", "swam", "swimming", "corsa", "palestra"],
    weak: ["walk", "walked", "km", "kilometres", "kilometers", "miles", "training", "yoga", "match", "climb"],
  },
  health: {
    strong: ["hurt", "injury", "injured", "fever", "headache", "doctor", "dentist", "pharmacy", "sprained"],
    weak: ["pain", "sick", "ill", "knee", "back", "sore", "medicine", "sleep", "tired", "checkup", "blood pressure"],
  },
  problem: {
    strong: ["broken", "broke down", "keeps dropping", "stopped working", "leaking", "outage"],
    weak: ["problem", "issue", "internet", "wifi", "router", "failed", "error", "stuck", "repair", "fix"],
  },
  project: {
    strong: ["launching", "launched", "prototype", "shipped", "deadline", "milestone"],
    weak: ["project", "building", "working on", "app", "website", "design", "sprint", "release", "garden"],
  },
  meeting: {
    strong: ["meeting", "stand-up", "standup", "planning session", "riunione"],
    weak: ["agenda", "call", "sync", "presentation", "workshop", "interview", "discussed"],
  },
};

const wordHit = (text: string, phrase: string): boolean =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(text);

/**
 * The one entry point. `text` is the person's words so far; `hasMedia` may sharpen a
 * borderline read a little (a photo of food is more likely a Meal), never create one.
 */
export function suggestRecordType(text: string, hasMedia: boolean): RecordSuggestion | null {
  const t = text.toLowerCase();
  if (t.trim().length < 8) return null; // too little signal — say nothing
  let best: RecordSuggestion | null = null;
  for (const kind of Object.keys(SIGNALS) as SuggestableKind[]) {
    const { strong, weak } = SIGNALS[kind];
    const s = strong.filter((w) => wordHit(t, w)).length;
    const w = weak.filter((x) => wordHit(t, x)).length;
    // one strong word, or two weak ones, carries the floor; more raises confidence a little
    let confidence = 0;
    if (s >= 1) confidence = Math.min(0.95, 0.8 + 0.05 * (s - 1) + 0.03 * w);
    else if (w >= 2) confidence = Math.min(0.85, 0.72 + 0.05 * (w - 2) + (hasMedia ? 0.04 : 0));
    if (confidence >= CONFIDENCE_FLOOR && (!best || confidence > best.confidence)) {
      best = { kind, confidence, source: "heuristic" };
    }
  }
  return best;
}
