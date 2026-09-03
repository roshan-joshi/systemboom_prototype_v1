"use client";

/** Performance tiers for the Cosmos renderer. */
export type QualityTier = "low" | "medium" | "high";

export interface QualitySettings {
  dprMax: number;
  /** Stars per depth layer (3 layers). */
  starsPerLayer: number;
  beltCount: number;
  earthClouds: boolean;
  milkyWayTexture: string;
  anisotropy: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: {
    dprMax: 1.25,
    starsPerLayer: 550,
    beltCount: 500,
    earthClouds: false,
    milkyWayTexture: "/cosmos/2k_stars_milky_way.jpg",
    anisotropy: 2,
  },
  medium: {
    dprMax: 1.75,
    starsPerLayer: 1200,
    beltCount: 1400,
    earthClouds: true,
    milkyWayTexture: "/cosmos/2k_stars_milky_way.jpg",
    anisotropy: 4,
  },
  high: {
    dprMax: 2,
    starsPerLayer: 2000,
    beltCount: 2400,
    earthClouds: true,
    milkyWayTexture: "/cosmos/8k_stars_milky_way.jpg",
    anisotropy: 8,
  },
};

export function detectTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (smallScreen || memory <= 4 || cores <= 4) return "low";
  if (memory >= 8 && cores >= 8) return "high";
  return "medium";
}
