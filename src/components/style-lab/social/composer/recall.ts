/**
 * ZERO-EFFORT CAPTURE (owner rule, 2026-09-29) — priority source #1 of the rule's ordered
 * list: "trusted existing Human Record/context", read BEFORE any AI suggestion or manual
 * entry. These derive People/Place/Activity-type defaults from the person's OWN past
 * records, so nobody is asked to search a picker from scratch for something they have
 * already told SYSTEMBOOM before — the same way a phone offers recent contacts first.
 *
 * Health and Problem records (QUIET_KINDS, matching Moment.tsx's own convention) are
 * excluded: a private record must never leak into a casual "recent" convenience list,
 * even as an innocuous place name. Everything here reads only the ACTING PERSON's own
 * Moments and is rendered only inside their own composer — never shown to anyone else.
 *
 * Each function falls back to nothing (an empty array) when there is no usable history —
 * callers combine that with the existing static default, so first use is unaffected and
 * every accepted test assertion for a fresh/no-history viewer holds unchanged.
 */
import type { Moment } from "../data";
import type { ActivityType } from "./types";

const QUIET_KINDS = new Set(["health", "problem"]);

function ownVisibleMoments(moments: Moment[], authorId: string): Moment[] {
  return moments
    .filter((m) => m.authorId === authorId && !QUIET_KINDS.has(m.kind))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** The person's own most-recently-tagged real people, deduped, most-recent first. */
export function recentPeopleIds(moments: Moment[], authorId: string, limit = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of ownVisibleMoments(moments, authorId)) {
    for (const id of m.fields?.with ?? []) {
      if (id === authorId || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/** The person's own most-recently-used real places, deduped, most-recent first. */
export function recentPlaces(moments: Moment[], authorId: string, limit = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of ownVisibleMoments(moments, authorId)) {
    if (!m.place || seen.has(m.place)) continue;
    seen.add(m.place);
    out.push(m.place);
    if (out.length >= limit) return out;
  }
  return out;
}

/** The person's own most-frequently-used Activity types, most-used first. */
export function commonActivityTypes(moments: Moment[], authorId: string, limit = 4): ActivityType[] {
  const counts = new Map<ActivityType, number>();
  for (const m of ownVisibleMoments(moments, authorId)) {
    const t = m.fields?.activityType as ActivityType | undefined;
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, limit);
}
