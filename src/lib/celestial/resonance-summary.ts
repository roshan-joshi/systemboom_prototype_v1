/**
 * CELESTIAL RESONANCE — the shared multi-person aggregation rule (one place, both readers).
 *
 * Contract: 22-DATA-CONTRACT.md §7–§8 · COUNT-TRANSITION-RULES.md §1 · Bible Ch. 14.
 *
 * PEOPLE, NOT POPULARITY. The output is always in CANONICAL REGISTRY ORDER — never count
 * order, never ranked, never a winner. Unknown ids are filtered here (the registry is the
 * gate), person ids are preserved in the map's own insertion order (chronology of commits in
 * this prototype), and `viewerHasSelected` marks the viewer's own single entry. This is a
 * pure function so the rule can never drift between the Moment strip, the expanded
 * constellation and any future surface (the matchPeople precedent).
 */

import { RESONANCE_ORDER, resonanceById } from "./registry";
import type { ResonanceId, ResonanceSummaryEntry } from "./types";

export function summarizeResonances(
  resonances: Record<string, string> | undefined,
  viewerId: string,
): ResonanceSummaryEntry[] {
  if (!resonances) return [];
  const byId = new Map<ResonanceId, string[]>();
  for (const [personId, rid] of Object.entries(resonances)) {
    if (!resonanceById(rid)) continue; // unknown ids are ignored, never rendered
    const id = rid as ResonanceId;
    byId.set(id, [...(byId.get(id) ?? []), personId]);
  }
  // CANONICAL ORDER. Deliberately the registry's order — NOT the count.
  return RESONANCE_ORDER.filter((id) => byId.has(id)).map((resonanceId) => {
    const personIds = byId.get(resonanceId) ?? [];
    return {
      resonanceId,
      count: personIds.length,
      viewerHasSelected: resonances[viewerId] === resonanceId,
      personIds,
    };
  });
}

/** Total humans, not a score: the number of PEOPLE who resonated (one entry each). */
export function resonatorTotal(entries: ResonanceSummaryEntry[]): number {
  return entries.reduce((n, e) => n + e.count, 0);
}
