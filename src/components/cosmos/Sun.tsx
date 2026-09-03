"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useTheme } from "@/lib/use-theme";

export const SUN_RADIUS = 4;

/** Soft radial corona texture, generated once on the client. */
function coronaTexture(inner: string, outer: string) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner);
  g.addColorStop(0.55, outer);
  g.addColorStop(1, "rgba(255,150,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Sun({ reduced }: { reduced: boolean }) {
  const theme = useTheme();
  const surface = useTexture("/cosmos/2k_sun.jpg", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const glowNear = useRef<THREE.Sprite>(null);
  const glowFar = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);

  const nearTex = useMemo(
    () => coronaTexture("rgba(255,214,140,0.85)", "rgba(255,150,60,0.22)"),
    [],
  );
  const farTex = useMemo(
    () => coronaTexture("rgba(255,190,120,0.5)", "rgba(255,140,70,0.10)"),
    [],
  );

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (!reduced) {
      if (core.current) core.current.rotation.y += dt * 0.018;
      if (shell.current) shell.current.rotation.y -= dt * 0.011;
    }
    // Breathing corona — imperceptible unless you watch for it.
    const pulse = reduced ? 1 : 1 + Math.sin(t * 0.35) * 0.02;
    if (glowNear.current) glowNear.current.scale.setScalar(SUN_RADIUS * 4.8 * pulse);
    if (glowFar.current) glowFar.current.scale.setScalar(SUN_RADIUS * 7.6 * (2 - pulse));
    if (light.current) {
      const target = theme === "light" ? 3.1 : 2.4;
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, target, 2.5, dt);
    }
  });

  return (
    <group>
      {/* Living surface: two counter-rotating layers of the same solar texture */}
      <mesh ref={core}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={surface} />
      </mesh>
      <mesh ref={shell} scale={1.012}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial
          map={surface}
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Corona impression — layered soft light, not a flat glow circle */}
      <sprite ref={glowNear} scale={SUN_RADIUS * 5.4}>
        <spriteMaterial
          map={nearTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.85}
        />
      </sprite>
      <sprite ref={glowFar} scale={SUN_RADIUS * 7.6}>
        <spriteMaterial
          map={farTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.34}
        />
      </sprite>
      {/* The Sun illuminates the system */}
      <pointLight ref={light} color="#ffe2b8" intensity={2.4} decay={0} />
    </group>
  );
}
