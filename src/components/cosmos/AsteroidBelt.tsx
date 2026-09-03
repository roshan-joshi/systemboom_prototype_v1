"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTheme } from "@/lib/use-theme";
import type { SpeedRef } from "./types";

/** Granular ring between Mars and Jupiter — texture of the system, not noise. */
export function AsteroidBelt({
  count,
  reduced,
  speedRef,
}: {
  count: number;
  reduced: boolean;
  speedRef: React.MutableRefObject<SpeedRef>;
}) {
  const theme = useTheme();
  const group = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    let seed = 90210;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      // Cluster density toward the middle of the band.
      const r = 20.2 + (rand() + rand()) * 1.4;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (rand() - 0.5) * 0.7;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (group.current && !reduced) {
      group.current.rotation.y += dt * 0.0065 * speedRef.current.current;
    }
    if (mat.current) {
      const target = theme === "light" ? 0.4 : 0.55;
      mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 2.5, dt);
    }
  });

  return (
    <points ref={group} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        size={0.09}
        sizeAttenuation
        color="#b9a690"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}
