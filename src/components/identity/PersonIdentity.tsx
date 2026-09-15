"use client";

/**
 * PERSON IDENTITY — the one component every identity surface renders from.
 *
 * A SYSTEMBOOM person is a real photo surrounded by their Life Ring: THIS
 * PERSON + WHERE THEY ARE IN LIFE + WHAT PART OF THAT LIFE IS DOCUMENTED,
 * resolved for the (viewer, subject) pair by the privacy view model. Profile,
 * Moment, Search, Friend, Notification, Chat and Composer all render from
 * here — there is no second avatar system anywhere in the product.
 *
 * The ring is drawn by `LifeRing` (unchanged, single instrument at every
 * scale); this component only resolves WHAT it draws — the privacy-bound
 * person + ring view for this pair — so every context reads it the same way.
 *
 * Relationship (friend / family / request / none) is never encoded in the
 * ring's geometry — it renders outside, in the caller's own text or action
 * (a word, a chip, an Accept button). `connected` here does exactly one
 * thing: it unlocks the DOCUMENTED-MEMORY density a friend/family viewer may
 * see (Moments visible to them) — it never raises life precision. Omit
 * `moments` at small/dense sizes (chat rows, search, notifications) so the
 * ring stays legible there; pass it at larger sizes (a person card, the
 * profile hero) where the extra nuance can actually be read.
 */

import { now } from "@/lib/clock";
import type { Moment, Person } from "@/components/style-lab/social/data";
import { LifeRing } from "@/components/style-lab/social/LifeRing";
import { momentLifeFor, personViewFor, ringViewFor } from "@/components/style-lab/social/view-model";

export function PersonIdentity({
  viewer,
  subject,
  at,
  size,
  connected = false,
  moments,
  label,
  interactive,
  onBand,
  className,
  animateEntry,
}: {
  viewer: Person;
  subject: Person;
  /** Defaults to the shared prototype clock — pass the content's own instant where the position is historical (a Moment, a notification). */
  at?: Date;
  size: number;
  /** Friend/family unlocks documented-memory density from Moments visible to this viewer — never more life precision. */
  connected?: boolean;
  /** Only where the density nuance is legible at this size (person card, profile hero) — omit at chat/search/notification scale. */
  moments?: Moment[];
  /** Accessible position label override. Defaults to the exact age (owner) or "Circle band …" (anyone else); pass "" where the surrounding text already names the person and the ring is decorative. */
  label?: string;
  interactive?: boolean;
  onBand?: (i: number | null) => void;
  className?: string;
  /** The ONE profile-entry event (My World 2030 Visual Leap §8) — pass only from the Profile Hero. */
  animateEntry?: boolean;
}) {
  const t = at ?? now();
  const person = personViewFor(viewer, subject);
  const ring = ringViewFor(viewer, subject, t, moments, connected);
  const pos = momentLifeFor(viewer, subject, t);
  const positionLabel = label ?? pos.exact ?? `Circle band ${pos.band}`;
  return <LifeRing person={person} ring={ring} size={size} positionLabel={positionLabel} interactive={interactive} onBand={onBand} className={className} animateEntry={animateEntry} />;
}
