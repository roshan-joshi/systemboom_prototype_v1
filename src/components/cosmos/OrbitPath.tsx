"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useTheme } from "@/lib/use-theme";
import type { PlanetId, PlanetSpec } from "@/lib/cosmos/planets";
import type { CosmosMode } from "./types";

/** Thin, low-opacity, perspective-aware orbit ellipse. */
export function OrbitPath({
  spec,
  mode,
  selected,
}: {
  spec: PlanetSpec;
  mode: CosmosMode;
  selected: PlanetId | null;
}) {
  const theme = useTheme();
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push([Math.cos(a) * spec.orbitRadius, 0, Math.sin(a) * spec.orbitRadius]);
    }
    return pts;
  }, [spec.orbitRadius]);

  if (mode === "explorer") return null;

  const isSelected = selected === spec.id;
  const base = theme === "light" ? 0.34 : 0.32;
  const opacity =
    mode === "focus" ? (isSelected ? base * 1.5 : base * 0.35) : base;
  const color = theme === "light" ? "#bcd4ee" : "#7e93ae";

  return (
    <Line
      points={points}
      color={isSelected ? "#c9d8ea" : color}
      transparent
      opacity={opacity}
      lineWidth={1}
      depthWrite={false}
    />
  );
}
