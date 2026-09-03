"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useTheme } from "@/lib/use-theme";
import type { QualitySettings } from "@/lib/cosmos/quality";

/** Deterministic PRNG so the sky is identical on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shellPositions(count: number, rMin: number, rMax: number, seed: number) {
  const rand = mulberry(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Uniform direction, biased slightly toward the galactic band (y compressed).
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const r = rMin + (rMax - rMin) * rand();
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(phi);
    positions[i * 3 + 1] = r * u * 0.82;
    positions[i * 3 + 2] = r * s * Math.sin(phi);
  }
  return positions;
}

interface LayerSpec {
  count: number;
  rMin: number;
  rMax: number;
  size: number;
  baseOpacity: number;
  color: string;
  seed: number;
  drift: number;
}

/** Soft round sprite so stars render as points of light, not squares. */
function makeStarSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function StarLayer({
  spec,
  sprite,
  reduced,
  lightFactor,
}: {
  spec: LayerSpec;
  sprite: THREE.Texture;
  reduced: boolean;
  /** 1 in dark mode, < 1 in Solar Observatory. */
  lightFactor: number;
}) {
  const positions = useMemo(
    () => shellPositions(spec.count, spec.rMin, spec.rMax, spec.seed),
    [spec],
  );
  const mat = useRef<THREE.PointsMaterial>(null);
  const pts = useRef<THREE.Points>(null);

  useFrame((_, dt) => {
    if (mat.current) {
      const target = spec.baseOpacity * lightFactor;
      mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 2.5, dt);
    }
    if (pts.current && !reduced) {
      pts.current.rotation.y += dt * spec.drift;
    }
  });

  return (
    <points ref={pts} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={spec.size}
        map={sprite}
        sizeAttenuation
        transparent
        opacity={spec.baseOpacity}
        color={spec.color}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export function StarField({
  quality,
  reduced,
}: {
  quality: QualitySettings;
  reduced: boolean;
}) {
  const theme = useTheme();
  const lightFactor = theme === "light" ? 0.38 : 1;

  const milky = useTexture(quality.milkyWayTexture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const milkyMat = useRef<THREE.MeshBasicMaterial>(null);
  const milkyMesh = useRef<THREE.Mesh>(null);

  const sprite = useMemo(() => makeStarSprite(), []);

  const layers: LayerSpec[] = useMemo(() => {
    const n = quality.starsPerLayer;
    return [
      // near, small & sharp
      { count: n, rMin: 95, rMax: 130, size: 0.55, baseOpacity: 0.9, color: "#dbe7f5", seed: 11, drift: 0.0022 },
      // mid
      { count: n, rMin: 140, rMax: 175, size: 0.8, baseOpacity: 0.7, color: "#c2d4ec", seed: 23, drift: 0.0014 },
      // far, dense faint dust-like
      { count: Math.round(n * 1.3), rMin: 185, rMax: 215, size: 1.05, baseOpacity: 0.5, color: "#aebfda", seed: 37, drift: 0.0008 },
      // occasional bright stars, slightly warm
      { count: 42, rMin: 100, rMax: 190, size: 2.1, baseOpacity: 0.95, color: "#f4e8d2", seed: 51, drift: 0.0011 },
    ];
  }, [quality.starsPerLayer]);

  useFrame((_, dt) => {
    if (milkyMat.current) {
      const target = theme === "light" ? 0.3 : 0.95;
      milkyMat.current.opacity = THREE.MathUtils.damp(milkyMat.current.opacity, target, 2.5, dt);
    }
    if (milkyMesh.current && !reduced) {
      milkyMesh.current.rotation.y += dt * 0.00045;
    }
  });

  return (
    <group>
      {/* Galactic atmosphere — a vast, slowly turning band */}
      <mesh ref={milkyMesh} rotation={[0, 0, -0.5]} scale={240}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          ref={milkyMat}
          map={milky}
          color={new THREE.Color(2.2, 2.2, 2.3)}
          side={THREE.BackSide}
          transparent
          opacity={0.95}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      {layers.map((l) => (
        <StarLayer
          key={l.seed}
          spec={l}
          sprite={sprite}
          reduced={reduced}
          lightFactor={lightFactor}
        />
      ))}
    </group>
  );
}
