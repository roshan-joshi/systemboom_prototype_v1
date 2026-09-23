/**
 * SYSTEMBOOM prototype identity — the ONE runtime identity contract.
 *
 * Both entry paths (the Giulia Bianchi demo seed and a freshly created identity)
 * produce this exact shape, and every later phase (Life Counter, Circle of
 * Life, Social) reads only this. `DemoUser` in ../mock/types stays mock
 * CONTENT for the style lab; it is a seed, never a second runtime model.
 *
 * Birth truth: `birthDate` is always the real date. `birthTime` is ABSENT
 * when unknown — never "00:00" or any other invented sentinel — and
 * `birthTimeKnown` states that fact explicitly so no consumer has to infer
 * intent from a missing key. See ./birth.ts for the precision-aware clock.
 *
 * Location truth: places are city-or-coarser curated anchors (globe-geo
 * ids), never a device fix. No geolocation, no IP, no timezone inference.
 */

export type BirthPrecision = "day" | "minute";

export interface PrototypePlace {
  /** Display truth exactly as the person stated it — "Kathmandu, Nepal". */
  label: string;
  /** Curated globe-geo anchor ("cy-kathmandu", "cn-nepal") when one matches. */
  geoId?: string;
  /** ISO 3166-1 alpha-2 when known. */
  countryCode?: string;
  /** Curated centroid of the anchor — orientation only, never a precise location. */
  lat?: number;
  lon?: number;
}

export type IdentitySource = "demo-seed" | "created";

export interface PrototypeIdentity {
  id: string;
  name: string;
  /** Curated avatar asset path; absent → initials fallback. */
  avatar?: string;
  /** "YYYY-MM-DD" — always the real date. */
  birthDate: string;
  /** "HH:mm" — present ONLY when birthTimeKnown is true. */
  birthTime?: string;
  birthTimeKnown: boolean;
  /** Reserved for Phase 5 (Circle / ancestry) — stored when offered, never required. */
  birthplace?: PrototypePlace;
  /** Where in the world the person is now — the entry journey's geography. */
  currentPlace?: PrototypePlace;
  /** ISO date-time of creation (prototype clock). */
  createdAt: string;
  source: IdentitySource;
}

/** What the Create Identity surface collects. Everything else is derived. */
export interface IdentityInput {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthTimeKnown: boolean;
  currentPlace?: PrototypePlace;
  avatar?: string;
}

/**
 * The local-only prototype session. Independent lifetime from the identity:
 * logout clears the session and keeps the identity.
 */
export interface PrototypeSession {
  identityId: string;
  /** The first-entry cinematic has completed (or been skipped / interrupted). */
  firstEntrySeen: boolean;
  /**
   * Set when the first-entry journey begins. A reload that finds this without
   * firstEntrySeen lands in the shell and promotes firstEntrySeen — the
   * cinematic plays at most once per identity, interruptions included.
   */
  firstEntryStartedAt?: string;
  signedInAt: string;
}
