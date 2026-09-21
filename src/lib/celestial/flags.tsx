"use client";

/**
 * CELESTIAL RESONANCE — feature flags.
 *
 * Contract: 22-FEATURE-FLAG-ROLLOUT.md (defaults §1.1, boomEnabled pinned §2, rollback §5).
 *
 * COMMITTED DEFAULTS: boomEnabled true; every Celestial flag false. Celestial ships dark and
 * is enabled deliberately for internal testing. Flag OFF must reproduce existing behaviour
 * exactly, and disabling never deletes data.
 *
 * `boomEnabled` is PINNED TRUE — the mascot is a preservation boundary. The field exists only
 * so a future visibility change needs no data migration. Nothing in Stage 23 sets it false and
 * there is no UI to do so.
 */

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export interface CelestialFlags {
  celestialEnabled: boolean;
  boomEnabled: boolean;
  momentIntegration: boolean;
  chatIntegration: boolean;
  notificationsIntegration: boolean;
  worldWallIntegration: boolean;
  premiumFuture: boolean;
  livingSkyFuture: boolean;
}

export const CELESTIAL_FLAG_DEFAULTS: Readonly<CelestialFlags> = Object.freeze({
  celestialEnabled: false,
  boomEnabled: true,
  momentIntegration: false,
  chatIntegration: false,
  notificationsIntegration: false,
  worldWallIntegration: false,
  premiumFuture: false,
  livingSkyFuture: false,
});

const FlagsContext = createContext<CelestialFlags>(CELESTIAL_FLAG_DEFAULTS);

/**
 * Owner/dev enable path (local only, never a shipped user control):
 *   ?celestial=1            → celestialEnabled + the three Stage 23 surface integrations
 *   ?celestial=field        → celestialEnabled only (isolated Field, no surface integration)
 *   localStorage sb-celestial = "1" | "field"
 * Absent → committed defaults, i.e. nothing Celestial renders anywhere.
 */
let cachedKey: string | null = null;
let cachedValue: Partial<CelestialFlags> = {};

function readLocalEnable(): Partial<CelestialFlags> {
  if (typeof window === "undefined") return {};
  let v: string | null = null;
  try {
    v = new URLSearchParams(window.location.search).get("celestial");
    if (v) window.localStorage.setItem("sb-celestial", v);
    else v = window.localStorage.getItem("sb-celestial");
  } catch {
    /* private mode / blocked storage — stay on the committed defaults */
  }
  if (v === "0" || v === "off") {
    try { window.localStorage.removeItem("sb-celestial"); } catch {}
    return {};
  }
  if (v === "field") return { celestialEnabled: true };
  if (v === "1" || v === "on") {
    return {
      celestialEnabled: true,
      momentIntegration: true,
      chatIntegration: true,
      notificationsIntegration: true,
    };
  }
  return {};
}

/**
 * Read via useSyncExternalStore, matching src/lib/use-theme.ts: the server snapshot is always
 * the committed defaults, so hydration can never mismatch, and the local enable path is
 * picked up on the client without a setState-in-effect cascade.
 */
const EMPTY: Partial<CelestialFlags> = {};
const subscribe = () => () => {};
function clientSnapshot(): Partial<CelestialFlags> {
  // Cache by the raw signal so the snapshot is referentially stable between renders.
  let raw = "";
  try {
    raw = new URLSearchParams(window.location.search).get("celestial") ?? window.localStorage.getItem("sb-celestial") ?? "";
  } catch { raw = ""; }
  if (raw !== cachedKey) { cachedKey = raw; cachedValue = readLocalEnable(); }
  return cachedValue;
}

export function CelestialFlagsProvider({ children, override }: { children: ReactNode; override?: Partial<CelestialFlags> }) {
  const local = useSyncExternalStore(subscribe, clientSnapshot, () => EMPTY);

  const value = useMemo<CelestialFlags>(
    () => ({ ...CELESTIAL_FLAG_DEFAULTS, ...local, ...override, boomEnabled: true }),
    [local, override],
  );
  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useCelestialFlags(): CelestialFlags {
  return useContext(FlagsContext);
}

/** True when a given Celestial surface should render at all. Master flag gates every surface. */
export function useCelestialSurface(surface: "moment" | "chat" | "notifications"): boolean {
  const f = useCelestialFlags();
  if (!f.celestialEnabled) return false;
  if (surface === "moment") return f.momentIntegration;
  if (surface === "chat") return f.chatIntegration;
  return f.notificationsIntegration;
}
