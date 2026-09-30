/**
 * SMART ASSIST (UC-C3 §25–§38, §68–§70) — SYSTEMBOOM's native intelligence layer for the
 * composer.
 *
 * STATUS: PROTOTYPE HEURISTIC throughout — deterministic word/number extraction over the
 * fixture vocabulary, honestly labeled, NEVER presented as model certainty. The whole layer
 * sits behind ONE service boundary (this file): the live system swaps `extractAssist` for
 * real inference behind the same signature and the composer changes nothing (§28).
 *
 * Product rules encoded here:
 *  - a GLOBAL user-controllable switch (§26): everything in the composer works with Smart
 *    Assist OFF — nothing is gated on AI. Deterministic file metadata (EXIF review) is NOT
 *    AI inference and stays available either way (§26).
 *  - capability FLAGS with cost tiers (§28/§70): CORE ships; ENHANCED/PREMIUM are named
 *    seams so future entitlements can switch tools on without a composer redesign. Nothing
 *    unimplemented is promised as live.
 *  - one quiet suggestion, always dismissible (§38): Use / Ignore, no wizard, never blocks
 *    POST, never re-shown after Ignore within the composition.
 *  - suggestions only SUGGEST (§30): accepting fills draft fields as AI_SUGGESTED work the
 *    person can edit; nothing posts, nothing silently becomes fact.
 */
import { PEOPLE, PLACES } from "../data";
import { CONFIDENCE_FLOOR, suggestRecordType } from "../suggest-record";
import type { ActivityType, RecordIntent } from "./types";

/* ------------------------------------------------------------------ global switch (§26/§68) */

const KEY = "sb-smart-assist";

export function smartAssistEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSmartAssist(on: boolean) {
  try {
    if (on) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, "off");
  } catch {
    /* storage unavailable — the in-session default (on) stands */
  }
}

/* ------------------------------------------------------------- capability flags (§28/§68/§70) */

export type AssistTier = "core" | "enhanced" | "premium-future";
/** The seam future plan entitlements switch — the composer only ever asks `assistCan()`. */
export const ASSIST_CAPABILITIES: Record<string, { tier: AssistTier; implemented: boolean }> = {
  categorySuggestion: { tier: "core", implemented: true },
  naturalLanguageExtraction: { tier: "core", implemented: true },
  metadataSuggestion: { tier: "core", implemented: true }, // deterministic EXIF review — not AI
  captionAssist: { tier: "enhanced", implemented: false },
  mediaUnderstanding: { tier: "enhanced", implemented: false },
  ocrExtraction: { tier: "enhanced", implemented: false },
  eventGrouping: { tier: "enhanced", implemented: false },
  advancedDomainAssist: { tier: "premium-future", implemented: false },
};

export function assistCan(cap: keyof typeof ASSIST_CAPABILITIES): boolean {
  const c = ASSIST_CAPABILITIES[cap];
  return !!c && c.implemented;
}

/* --------------------------------------------------------------- extraction (§29–§36) */

export interface AssistSuggestion {
  /** A record classification when the words carry one (≥ the confidence floor). */
  kind?: Exclude<RecordIntent, "social" | "moment">;
  /** Activity subtype / meal occasion read from the words. */
  activityType?: ActivityType;
  occasion?: "breakfast" | "lunch" | "dinner" | "snack" | "drink";
  distance?: string;
  duration?: string;
  place?: string;
  /** Resolved person ids only (A12 — a name that matches nobody is never a suggestion). */
  people: string[];
  /** "today" | "yesterday" — a soft temporal cue; exact clocks are never invented. */
  when?: "today" | "yesterday";
  /** What the quiet row prints beside the classification. */
  parts: string[];
  source: "heuristic";
}

const ACT_WORDS: [RegExp, ActivityType][] = [
  [/\b(ran|running|run|jog(ged|ging)?|corsa)\b/i, "run"],
  [/\b(walk(ed|ing)?|stroll(ed)?)\b/i, "walk"],
  [/\b(cycl(ed|ing)|rode|bike[dr]?|biking)\b/i, "cycling"],
  [/\b(gym|workout|lifted|palestra)\b/i, "gym"],
  [/\b(hike[dr]?|hiking|trek(ked|king)?)\b/i, "hiking"],
  [/\b(swam|swim(ming)?)\b/i, "swimming"],
];
const OCC_WORDS: [RegExp, AssistSuggestion["occasion"]][] = [
  [/\b(breakfast|colazione)\b/i, "breakfast"],
  [/\b(lunch|pranzo)\b/i, "lunch"],
  [/\b(dinner|cena)\b/i, "dinner"],
  [/\b(snack)\b/i, "snack"],
  [/\b(tea|coffee|lassi|drink)\b/i, "drink"],
];

/**
 * §29/§30 — deterministic natural-language extraction over the person's own words.
 * Nothing here estimates: a value is either written in the text or absent.
 */
export function extractAssist(text: string, hasMedia: boolean, excludeId?: string): AssistSuggestion | null {
  if (!assistCan("naturalLanguageExtraction")) return null;
  const base = suggestRecordType(text, hasMedia);
  if (!base || base.confidence < CONFIDENCE_FLOOR) return null; // uncertainty is silence (§25)

  const out: AssistSuggestion = { kind: base.kind, people: [], parts: [], source: "heuristic" };

  if (base.kind === "activity") {
    for (const [re, kind] of ACT_WORDS) if (re.test(text)) { out.activityType = kind; break; }
    const dist = text.match(/(\d+(?:[.,]\d+)?)\s?(km|kilometres?|kilometers?|mi|miles?)\b/i);
    if (dist) { out.distance = `${dist[1]} ${dist[2].toLowerCase().startsWith("k") ? "km" : "mi"}`; out.parts.push(out.distance); }
    const dur = text.match(/(\d+)\s?(min(?:ute)?s?|hours?|hrs?|h)\b/i);
    if (dur) { out.duration = `${dur[1]} ${dur[2].toLowerCase().startsWith("h") ? "h" : "min"}`; out.parts.push(out.duration); }
  }
  if (base.kind === "meal") {
    // the raw enum is NOT pushed into `parts` — occasion needs a localized label, which
    // only the component (with `useT`) can supply; see `occasionKey` at the render site.
    for (const [re, occ] of OCC_WORDS) if (re.test(text)) { out.occasion = occ; break; }
  }

  // a known place, matched by any of its own name segments ("Pokhara" in "Phewa Tal, Pokhara")
  outer: for (const p of PLACES) {
    for (const seg of p.split(/[,·]/)) {
      const name = seg.trim();
      if (name.length >= 4 && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
        out.place = p;
        out.parts.push(name);
        break outer;
      }
    }
  }

  // real people only — first names from the fixture cast, resolved to ids (A12)
  for (const person of Object.values(PEOPLE)) {
    if (person.id === excludeId) continue;
    const first = person.name.split(" ")[0];
    if (first.length >= 3 && new RegExp(`\\b${first}\\b`, "i").test(text)) {
      out.people.push(person.id);
      out.parts.push(first);
    }
  }

  if (/\b(yesterday|last night)\b/i.test(text)) { out.when = "yesterday"; out.parts.push("yesterday"); }
  else if (/\b(this morning|today|tonight|this evening)\b/i.test(text)) { out.when = "today"; }

  return out;
}
