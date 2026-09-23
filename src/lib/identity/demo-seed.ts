/**
 * Demo-seed adapter — maps the fictional Giulia Bianchi mock content onto the one
 * runtime PrototypeIdentity shape, so "Enter as Giulia Bianchi (demo identity)"
 * and "Create your identity" are indistinguishable to every consumer.
 */

import { GEO_BY_ID } from "../earth/globe-geo";
import { demoUser } from "../mock/demo-user";
import { normalizeIdentity } from "./store";
import type { PrototypeIdentity, PrototypePlace } from "./types";

/** Phase 0 — the day the demo identity was authored. Deterministic on purpose. */
const DEMO_SEED_CREATED_AT = "2026-09-01T00:00:00.000Z";

/** A place anchored on curated globe geography (centroid, never a precise fix). */
export function placeFromGeo(
  geoId: string,
  label: string,
  countryCode?: string,
): PrototypePlace | undefined {
  const geo = GEO_BY_ID[geoId];
  if (!geo) return undefined;
  const place: PrototypePlace = { label, geoId, lat: geo.lat, lon: geo.lon };
  if (countryCode) place.countryCode = countryCode;
  return place;
}

export function identityFromDemoSeed(): PrototypeIdentity {
  return normalizeIdentity({
    id: demoUser.id,
    name: demoUser.name,
    avatar: demoUser.avatar,
    birthDate: demoUser.dateOfBirth,
    birthTime: demoUser.birthTime,
    birthTimeKnown: demoUser.birthTimeKnown,
    // Phase 4.4-A owner fixture add-on: the curated geography (frozen Phase 1) has no Italian
    // city, so Bologna anchors on the curated Italy centroid — never a precise fix, by design.
    currentPlace: placeFromGeo("cn-italy", demoUser.location, "IT"),
    createdAt: DEMO_SEED_CREATED_AT,
    source: "demo-seed",
  });
}
