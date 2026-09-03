"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useCursor, useTexture } from "@react-three/drei";
import {
  orbitAngularSpeed,
  spinAngularSpeed,
  type PlanetId,
  type PlanetSpec,
} from "@/lib/cosmos/planets";
import type { PlanetRefs, SpeedRef } from "./types";

/** RingGeometry with UVs remapped radially so ring-strip textures work. */
function useRingGeometry(inner: number, outer: number) {
  return useMemo(() => {
    const geo = new THREE.RingGeometry(inner, outer, 128, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const d = (v.length() - inner) / (outer - inner);
      uv.setXY(i, d, 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }, [inner, outer]);
}

function SaturnRings({ spec, texturePath }: { spec: PlanetSpec; texturePath: string }) {
  const tex = useTexture(texturePath, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const geometry = useRingGeometry(spec.radius * 1.35, spec.radius * 2.35);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
      <meshStandardMaterial
        map={tex}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={0.85}
        metalness={0}
        opacity={0.96}
      />
    </mesh>
  );
}

export interface PlanetCommonProps {
  spec: PlanetSpec;
  speedRef: React.MutableRefObject<SpeedRef>;
  reduced: boolean;
  planetRefs: PlanetRefs;
  onSelect: (id: PlanetId) => void;
  selected: PlanetId | null;
  anisotropy: number;
  children?: React.ReactNode;
}

/**
 * Generic planet: orbital pivot + tilted, spinning textured sphere.
 * Earth extends this with its own richer component.
 */
export function Planet({
  spec,
  speedRef,
  reduced,
  planetRefs,
  onSelect,
  selected,
  anisotropy,
  children,
}: PlanetCommonProps) {
  const map = useTexture(spec.texture, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
  });

  const pivot = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const angle = useRef((spec.initialAngleDeg * Math.PI) / 180);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const orbitSpeed = useMemo(() => orbitAngularSpeed(spec.periodYears), [spec]);
  const spin = useMemo(() => spinAngularSpeed(spec.spinHours), [spec]);
  const isSelected = selected === spec.id;

  useFrame((_, dt) => {
    const g = pivot.current;
    if (!g) return;
    const speed = speedRef.current.current;
    if (!reduced) {
      angle.current += dt * orbitSpeed * speed;
      // Rotation stays alive during focus so the planet visibly turns.
      const spinFactor = reduced ? 0 : Math.max(speed, isSelected ? 0.4 : speed);
      if (body.current) body.current.rotation.y += dt * spin * spinFactor;
    }
    g.position.set(
      Math.cos(angle.current) * spec.orbitRadius,
      0,
      Math.sin(angle.current) * spec.orbitRadius,
    );
  });

  return (
    <group
      ref={(node) => {
        pivot.current = node;
        if (node) planetRefs.current[spec.id] = node;
        else delete planetRefs.current[spec.id];
      }}
      position={[
        Math.cos(angle.current) * spec.orbitRadius,
        0,
        Math.sin(angle.current) * spec.orbitRadius,
      ]}
    >
      <group rotation={[0, 0, (spec.tiltDeg * Math.PI) / 180]}>
        <mesh ref={body}>
          <sphereGeometry args={[spec.radius, 48, 48]} />
          <meshStandardMaterial
            map={map}
            roughness={0.92}
            metalness={0}
            emissive={hovered && !isSelected ? "#3a4d6b" : "#000000"}
            emissiveIntensity={hovered && !isSelected ? 0.55 : 0}
          />
        </mesh>
        {spec.ringTexture && <SaturnRings spec={spec} texturePath={spec.ringTexture} />}
        {children}
      </group>
      {/* Generous invisible hit target so small planets stay tappable */}
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(spec.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[Math.max(spec.radius * 1.7, 1.1), 12, 12]} />
      </mesh>
    </group>
  );
}
