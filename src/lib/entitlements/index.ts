/**
 * SYSTEMBOOM — MONETIZATION FOUNDATION (Social Wall S8).
 *
 * Entitlement-ready ARCHITECTURE only: types, the capability check, and the free-core default.
 * There is NO billing in this repository — no checkout, no subscriptions, no payment state, and
 * nothing here may ever pretend one exists. When a billing provider lands, it supplies an
 * `EntitlementSource` and everything below is already wired to ask it.
 *
 * Product law this file enforces by construction (S8 §12):
 *  - THE FREE CORE IS COMPLETE. Human connection — Social, Friends, Respond, Chat, Moments,
 *    basic Life, privacy — never sits behind an entitlement. Those capabilities do not appear
 *    in this enum at all, so no future code can accidentally gate them.
 *  - Monetization is VALUE-BASED PREMIUM SERVICE (storage, resolution, archive depth, recall,
 *    legacy preservation, presentation) — never popularity, reach, ranking or attention.
 *  - Basic data portability is a right, not a tier: only ADVANCED export forms appear here.
 */

/** Premium capabilities the product may someday sell. Deliberately NOT here: posting, responding,
 *  friends, chat, search, notifications, privacy controls, basic themes, basic export. */
export type Entitlement =
  /** Larger media storage quota for Moments (photos/video). */
  | "storage.expanded"
  /** Keep and serve full-resolution originals alongside display sizes. */
  | "storage.originals"
  /** Longer video Moments. */
  | "storage.longVideo"
  /** Archive depth beyond the standard retention window (a lifetime is long). */
  | "archive.expanded"
  /** Additional redundant backup capacity. */
  | "archive.backup"
  /** Personal memory intelligence: natural-language recall over one's OWN Moments
   *  ("the dinner with Giulia in Bologna"). Private by construction — a person's own data only. */
  | "memory.intelligence"
  /** Private family memory spaces + advanced Ancestor-Tree storage. */
  | "legacy.familyArchive"
  /** Trusted inheritance / continuity controls. */
  | "legacy.continuity"
  /** Advanced World themes and archive presentation. */
  | "personalization.advanced"
  /** Full-archive export with media originals and structure (basic export stays free). */
  | "export.advanced";

export interface Plan {
  id: "free" | string;
  /** Display name comes from the i18n catalog at render time, never hardcoded here. */
  nameKey: string;
  entitlements: ReadonlySet<Entitlement>;
}

/** What a billing provider must implement, the day one exists. Nothing else in the app may
 *  know HOW an entitlement was granted. */
export interface EntitlementSource {
  planFor(personId: string): Plan;
}

/** The complete free core: every entitlement ABSENT, every core capability untouched (they are
 *  not entitlements at all). This is the only source the prototype ships. */
export const FREE_PLAN: Plan = Object.freeze({
  id: "free",
  nameKey: "plan.free",
  entitlements: new Set<Entitlement>(),
});

const PROTOTYPE_SOURCE: EntitlementSource = { planFor: () => FREE_PLAN };

/** The one capability check. Callers ask about a capability, never about a plan name, so a
 *  future plan matrix reshuffles freely. */
export function can(entitlement: Entitlement, personId: string, source: EntitlementSource = PROTOTYPE_SOURCE): boolean {
  return source.planFor(personId).entitlements.has(entitlement);
}
