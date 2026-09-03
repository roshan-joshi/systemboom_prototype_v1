"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PLANETS, type PlanetId } from "@/lib/cosmos/planets";
import { QUALITY, type QualityTier } from "@/lib/cosmos/quality";
import { useTheme } from "@/lib/use-theme";
import { StarField } from "./StarField";
import { Sun } from "./Sun";
import { Planet } from "./Planet";
import { Earth, type SurfaceTarget } from "./Earth";
import { OrbitPath } from "./OrbitPath";
import { AsteroidBelt } from "./AsteroidBelt";
import { CameraRig, type CameraHandle, type EarthJourney } from "./CameraRig";
import type { CosmosMode, PlanetRefs, SpeedRef } from "./types";

const BG_DARK = new THREE.Color("#04070e");
const BG_LIGHT = new THREE.Color("#0f2038");

/** Damped theme interpolation — no renderer reinitialization on toggle. */
function ThemeRig({
  ambient,
  hemi,
}: {
  ambient: React.RefObject<THREE.AmbientLight | null>;
  hemi: React.RefObject<THREE.HemisphereLight | null>;
}) {
  const theme = useTheme();
  const { gl, scene } = useThree();
  const bg = useRef(new THREE.Color("#04070e"));

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-2.5 * dt);
    gl.toneMappingExposure = THREE.MathUtils.damp(
      gl.toneMappingExposure,
      theme === "light" ? 1.3 : 1.0,
      2.5,
      dt,
    );
    bg.current.lerp(theme === "light" ? BG_LIGHT : BG_DARK, k);
    scene.background = bg.current;
    if (ambient.current) {
      ambient.current.intensity = THREE.MathUtils.damp(
        ambient.current.intensity,
        theme === "light" ? 0.55 : 0.14,
        2.5,
        dt,
      );
    }
    if (hemi.current) {
      hemi.current.intensity = THREE.MathUtils.damp(
        hemi.current.intensity,
        theme === "light" ? 0.5 : 0.2,
        2.5,
        dt,
      );
    }
  });
  return null;
}

/**
 * Tracks which Earth hemisphere faces the camera — consumed by the
 * Earth-Explorer handoff so the geospatial globe opens on the same view.
 */
function FacingTracker({
  earthBodyRef,
  facingRef,
  mode,
}: {
  earthBodyRef: React.MutableRefObject<THREE.Mesh | null>;
  facingRef: React.MutableRefObject<{ lat: number; lon: number }>;
  mode: CosmosMode;
}) {
  const q = useRef(new THREE.Quaternion());
  const p = useRef(new THREE.Vector3());
  const d = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    const body = earthBodyRef.current;
    if (!body || (mode !== "focus" && mode !== "explorer")) return;
    body.getWorldQuaternion(q.current);
    body.getWorldPosition(p.current);
    d.current.copy(camera.position).sub(p.current).applyQuaternion(q.current.invert()).normalize();
    const phi = Math.acos(THREE.MathUtils.clamp(d.current.y, -1, 1));
    const lat = 90 - THREE.MathUtils.radToDeg(phi);
    const theta = Math.atan2(d.current.z, -d.current.x);
    let lon = THREE.MathUtils.radToDeg(theta) - 180;
    if (lon < -180) lon += 360;
    facingRef.current = { lat, lon };
  });
  return null;
}

/**
 * Faint fill that travels with the camera so planets between the viewer
 * and the Sun never collapse into black silhouettes.
 */
function CameraFill() {
  const light = useRef<THREE.DirectionalLight | null>(null);
  useFrame(({ camera }) => {
    light.current?.position.copy(camera.position);
  });
  return <directionalLight ref={light} intensity={0.42} color="#cfe0f5" />;
}

export function Scene({
  mode,
  selected,
  onSelect,
  tier,
  reduced,
  isMobile,
  planetRefs,
  earthBodyRef,
  facingRef,
  surfaceTargetRef,
  onApproachEarth,
  journey,
  onJourneyDone,
  onJourneyHandoff,
  onUserGrab,
  onOfficeSelect,
  onSurfaceFocus,
  cameraHandleRef,
  selectedOfficeId,
  earthDistRef,
  onGeoNavigate,
  selectedGeoId,
  focusedGeoId,
}: {
  mode: CosmosMode;
  selected: PlanetId | null;
  onSelect: (id: PlanetId) => void;
  tier: QualityTier;
  reduced: boolean;
  isMobile: boolean;
  planetRefs: PlanetRefs;
  earthBodyRef: React.MutableRefObject<THREE.Mesh | null>;
  facingRef: React.MutableRefObject<{ lat: number; lon: number }>;
  surfaceTargetRef: React.MutableRefObject<SurfaceTarget | null>;
  onApproachEarth?: () => void;
  journey: EarthJourney | null;
  onJourneyDone?: () => void;
  onJourneyHandoff?: (officeId?: string) => void;
  onUserGrab?: () => void;
  onOfficeSelect: (officeId: string) => void;
  onSurfaceFocus: (target: { lat: number; lon: number }) => void;
  cameraHandleRef: React.MutableRefObject<CameraHandle | null>;
  selectedOfficeId: string | null;
  earthDistRef: React.MutableRefObject<number>;
  onGeoNavigate: (label: import("@/lib/earth/globe-geo").GlobeGeoLabel) => void;
  selectedGeoId: string | null;
  focusedGeoId: string | null;
}) {
  const q = QUALITY[tier];
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const speedRef = useRef<SpeedRef>({ current: reduced ? 0 : 1, target: 1 });
  const ambient = useRef<THREE.AmbientLight | null>(null);
  const hemi = useRef<THREE.HemisphereLight | null>(null);

  return (
    <>
      <ThemeRig ambient={ambient} hemi={hemi} />
      <CameraFill />
      <ambientLight ref={ambient} intensity={0.14} color="#b8cce8" />
      <hemisphereLight
        ref={hemi}
        args={["#33507e", "#0a0e18", 0.2]}
      />

      <StarField quality={q} reduced={reduced} />
      <Sun reduced={reduced} />

      {/* Mobile gets its own composition: the whole system yaws so the
          key planets line up along the portrait camera's depth axis. */}
      <group rotation={[0, isMobile ? -0.9 : 0, 0]}>
      {PLANETS.map((spec) =>
        spec.id === "earth" ? (
          <Earth
            key="earth"
            speedRef={speedRef}
            reduced={reduced}
            planetRefs={planetRefs}
            onSelect={onSelect}
            selected={selected}
            mode={mode}
            clouds={q.earthClouds}
            anisotropy={q.anisotropy}
            bodyRef={earthBodyRef}
            onOfficeSelect={onOfficeSelect}
            onSurfaceFocus={onSurfaceFocus}
            surfaceTargetRef={surfaceTargetRef}
            selectedOfficeId={selectedOfficeId}
            onGeoNavigate={onGeoNavigate}
            selectedGeoId={selectedGeoId}
            focusedGeoId={focusedGeoId}
          />
        ) : (
          <group key={spec.id} visible={!(mode === "explorer")}>
            <Planet
              spec={spec}
              speedRef={speedRef}
              reduced={reduced}
              planetRefs={planetRefs}
              onSelect={mode === "explorer" ? () => {} : onSelect}
              selected={selected}
              anisotropy={q.anisotropy}
            />
          </group>
        ),
      )}

      </group>

      {PLANETS.map((spec) => (
        <OrbitPath key={`orbit-${spec.id}`} spec={spec} mode={mode} selected={selected} />
      ))}

      <group visible={mode !== "explorer"}>
        <AsteroidBelt count={q.beltCount} reduced={reduced} speedRef={speedRef} />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={14}
        maxDistance={78}
      />
      <CameraRig
        mode={mode}
        selected={selected}
        planetRefs={planetRefs}
        earthBodyRef={earthBodyRef}
        controlsRef={controlsRef}
        reduced={reduced}
        isMobile={isMobile}
        speedRef={speedRef}
        journey={journey}
        onJourneyDone={onJourneyDone}
        onJourneyHandoff={onJourneyHandoff}
        onUserGrab={onUserGrab}
        onApproachEarth={onApproachEarth}
        handleRef={cameraHandleRef}
        earthDistRef={earthDistRef}
        surfaceTargetRef={surfaceTargetRef}
      />
      <FacingTracker earthBodyRef={earthBodyRef} facingRef={facingRef} mode={mode} />
    </>
  );
}
