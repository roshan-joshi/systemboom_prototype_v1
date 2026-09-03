import type { MutableRefObject } from "react";
import type { Group } from "three";
import type { PlanetId } from "@/lib/cosmos/planets";

export type CosmosMode = "system" | "focus" | "explorer";

/** Live registry of planet pivot groups, keyed by planet id. */
export type PlanetRefs = MutableRefObject<Partial<Record<PlanetId, Group>>>;

/** Shared, frame-damped global speed factor for orbital motion. */
export interface SpeedRef {
  current: number;
  target: number;
}
