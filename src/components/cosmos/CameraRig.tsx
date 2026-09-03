"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PLANET_BY_ID, type PlanetId } from "@/lib/cosmos/planets";
import type { CosmosMode, PlanetRefs, SpeedRef } from "./types";

const ORIGIN = new THREE.Vector3(0, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);
const DESKTOP_POS = new THREE.Vector3(18, 14, 37);
const MOBILE_POS = new THREE.Vector3(10, 14, 39);

/**
 * Per-planet closest inspection distance (× planet radius).
 * Saturn stays outside its ring span so rings never clip the camera.
 * Earth's floor is QUALITY-based: the deepest distance at which the 2K
 * imagery still reads as Earth rather than an enlarged texture —
 * judged visually (~3,950 km desktop). QUALITY > ZOOM DISTANCE.
 */
const MIN_VIEW_FACTOR: Record<PlanetId, number> = {
  mercury: 1.35,
  venus: 1.35,
  earth: 1.62,
  mars: 1.35,
  jupiter: 1.42,
  saturn: 2.55,
  uranus: 1.45,
  neptune: 1.45,
};

/** Mobile viewports show fewer texture pixels — a slightly deeper floor holds up. */
const EARTH_FLOOR_MOBILE = 1.55;

/** Earth handoff zone for GUIDED office descents (× Earth radius). */
const HANDOFF_ZONE_FACTOR = 1.62;

/** Stage-one arrival distance (× Earth radius): close 3D inspection. */
const INSPECT_FACTOR = 1.85;

/** A guided journey toward a geographic point on Earth. */
export interface EarthJourney {
  lat: number;
  lon: number;
  /**
   * focus   — rotate toward the point, keep the current distance
   * inspect — stage one: rotate + settle into close 3D inspection (no map)
   * descend — stage two: full descent into the geographic handoff
   */
  kind: "focus" | "inspect" | "descend";
  /** Inspect arrival distance in Earth radii (semantic ladder scales). */
  dist?: number;
  officeId?: string;
}

/** Imperative handle for accessible zoom/reset controls. */
export interface CameraHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  /** Keyboard orbit: rotate the view by azimuth/polar deltas (radians). */
  rotate: (dAzimuth: number, dPolar: number) => void;
}

function latLonToUnit(lat: number, lon: number, out: THREE.Vector3) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return out.set(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  );
}

function damp3(v: THREE.Vector3, t: THREE.Vector3, lambda: number, dt: number) {
  v.x = THREE.MathUtils.damp(v.x, t.x, lambda, dt);
  v.y = THREE.MathUtils.damp(v.y, t.y, lambda, dt);
  v.z = THREE.MathUtils.damp(v.z, t.z, lambda, dt);
}

export function CameraRig({
  mode,
  selected,
  planetRefs,
  earthBodyRef,
  controlsRef,
  reduced,
  isMobile,
  speedRef,
  journey,
  onJourneyDone,
  onJourneyHandoff,
  onUserGrab,
  onApproachEarth,
  handleRef,
  earthDistRef,
  surfaceTargetRef,
}: {
  mode: CosmosMode;
  selected: PlanetId | null;
  planetRefs: PlanetRefs;
  earthBodyRef: React.MutableRefObject<THREE.Mesh | null>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  reduced: boolean;
  isMobile: boolean;
  speedRef: React.MutableRefObject<SpeedRef>;
  /** Active guided journey (office click / double-tap focus). */
  journey: EarthJourney | null;
  onJourneyDone?: () => void;
  onJourneyHandoff?: (officeId?: string) => void;
  /** Manual input began — cancel guided motion upstream. */
  onUserGrab?: () => void;
  /** Deep-zoom intent on Earth crossed the handoff threshold. */
  onApproachEarth?: () => void;
  handleRef?: React.MutableRefObject<CameraHandle | null>;
  /** Live camera distance to Earth in Earth radii — drives two-stage office clicks. */
  earthDistRef?: React.MutableRefObject<number>;
  /** Surface point under the pointer — drives pointer-targeted zoom. */
  surfaceTargetRef?: React.MutableRefObject<{ lat: number; lon: number; at: number } | null>;
}) {
  const { camera, gl } = useThree();
  const travelling = useRef(false);
  const interacting = useRef(false);
  const idleSince = useRef(0);
  const prevPlanetPos = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const side = useRef(new THREE.Vector3());
  const delta = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());
  const journeyDir = useRef(new THREE.Vector3());
  const bodyQuat = useRef(new THREE.Quaternion());
  const tmp = useRef(new THREE.Vector3());
  /** Session-only focus memory: camera offset per planet. */
  const focusMemory = useRef<Partial<Record<PlanetId, THREE.Vector3>>>({});
  const inwardIntent = useRef(0);
  const lastInwardAt = useRef(0);
  const lastPinch = useRef(0);
  const pinchIntent = useRef(0);
  /** Persistent journey descent distance — avoids chasing a self-referencing target. */
  const journeyDist = useRef(-1);
  /** Pointer-targeted zoom state. */
  const lastEarthDist = useRef(-1);
  const zoomCamDir = useRef(new THREE.Vector3());
  const zoomTargetDir = useRef(new THREE.Vector3());
  const zoomAxis = useRef(new THREE.Vector3());

  useEffect(() => {
    journeyDist.current = -1;
    lastEarthDist.current = -1;
  }, [journey]);

  // Cinematic entrance: begin slightly further out and settle in.
  useEffect(() => {
    const start = (isMobile ? MOBILE_POS : DESKTOP_POS).clone();
    if (reduced) {
      camera.position.copy(start);
    } else {
      camera.position.copy(start.multiplyScalar(1.45));
      travelling.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual input always wins: cancel travel, idle drift and journeys.
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onStart = () => {
      interacting.current = true;
      if (mode === "system") travelling.current = false;
      if (journey) onUserGrab?.();
    };
    const onEnd = () => {
      interacting.current = false;
      idleSince.current = Date.now();
    };
    c.addEventListener("start", onStart);
    c.addEventListener("end", onEnd);
    return () => {
      c.removeEventListener("start", onStart);
      c.removeEventListener("end", onEnd);
    };
  }, [controlsRef, mode, journey, onUserGrab]);

  // Mode / selection changes launch a new cinematic travel — except into
  // the explorer: the camera is already aimed at the surface target, and
  // swinging away mid-atmosphere-crossing would break target continuity.
  useEffect(() => {
    travelling.current = mode !== "explorer";
    if (selected) {
      const obj = planetRefs.current[selected];
      if (obj) obj.getWorldPosition(prevPlanetPos.current);
    }
  }, [mode, selected, planetRefs]);

  // Save focus memory when leaving a focused planet (session only).
  const prevFocus = useRef<PlanetId | null>(null);
  useEffect(() => {
    const before = prevFocus.current;
    if (before && before !== selected) {
      const obj = planetRefs.current[before];
      if (obj) {
        obj.getWorldPosition(worldPos.current);
        focusMemory.current[before] = camera.position.clone().sub(worldPos.current);
      }
    }
    prevFocus.current = mode === "focus" || mode === "explorer" ? selected : null;
  }, [selected, mode, planetRefs, camera]);

  /* ---------- Earth handoff intent: continued inward input at the deep limit ---------- */
  useEffect(() => {
    const el = gl.domElement;
    const nearLimit = () => {
      if (mode !== "focus" || selected !== "earth") return false;
      const obj = planetRefs.current.earth;
      if (!obj) return false;
      const spec = PLANET_BY_ID.earth;
      const d = camera.position.distanceTo(obj.getWorldPosition(tmp.current));
      // Intent counts only when the camera is pinned against the deepest
      // useful view — approaching the floor is exploration, not intent.
      const floor = isMobile ? EARTH_FLOOR_MOBILE : MIN_VIEW_FACTOR.earth;
      return d < spec.radius * floor * 1.035;
    };
    const fire = () => {
      inwardIntent.current = 0;
      pinchIntent.current = 0;
      onApproachEarth?.();
    };
    const onWheel = (e: WheelEvent) => {
      // A scroll burst keeps the pointed surface target alive so the
      // pointer-targeted zoom doesn't lose its anchor mid-gesture.
      if (e.deltaY < 0 && mode === "focus" && selected === "earth") {
        const st = surfaceTargetRef?.current;
        if (st && performance.now() - st.at < 3000) st.at = performance.now();
      }
      if (!nearLimit()) {
        inwardIntent.current = 0;
        return;
      }
      if (e.deltaY < 0) {
        const now = performance.now();
        if (now - lastInwardAt.current > 1600) inwardIntent.current = 0;
        lastInwardAt.current = now;
        inwardIntent.current += 1;
        if (inwardIntent.current >= 3) fire();
      } else {
        inwardIntent.current = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (lastPinch.current && nearLimit()) {
        const spread = d - lastPinch.current;
        if (spread > 0) {
          pinchIntent.current += spread;
          if (pinchIntent.current > 140) fire();
        } else if (spread < -6) {
          pinchIntent.current = 0;
        }
      }
      lastPinch.current = d;
    };
    const onTouchEnd = () => {
      lastPinch.current = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [gl, mode, selected, planetRefs, camera, onApproachEarth, surfaceTargetRef, isMobile]);

  /* ---------- accessible imperative controls ---------- */
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      zoomIn: () => {
        const c = controlsRef.current;
        if (!c) return;
        tmp.current.copy(camera.position).sub(c.target);
        tmp.current.multiplyScalar(0.78);
        const min = c.minDistance;
        if (tmp.current.length() < min) tmp.current.setLength(min);
        camera.position.copy(c.target).add(tmp.current);
        c.update();
      },
      zoomOut: () => {
        const c = controlsRef.current;
        if (!c) return;
        tmp.current.copy(camera.position).sub(c.target);
        tmp.current.multiplyScalar(1.3);
        if (tmp.current.length() > c.maxDistance) tmp.current.setLength(c.maxDistance);
        camera.position.copy(c.target).add(tmp.current);
        c.update();
      },
      resetView: () => {
        if (selected) delete focusMemory.current[selected];
        travelling.current = true;
      },
      rotate: (dAzimuth: number, dPolar: number) => {
        const c = controlsRef.current;
        if (!c) return;
        tmp.current.copy(camera.position).sub(c.target);
        const sph = new THREE.Spherical().setFromVector3(tmp.current);
        sph.theta -= dAzimuth;
        sph.phi = THREE.MathUtils.clamp(
          sph.phi + dPolar,
          c.minPolarAngle + 0.05,
          c.maxPolarAngle - 0.05,
        );
        tmp.current.setFromSpherical(sph);
        camera.position.copy(c.target).add(tmp.current);
        c.update();
      },
    };
    return () => {
      if (handleRef) handleRef.current = null;
    };
  }, [handleRef, controlsRef, camera, selected]);

  useFrame((_, dt) => {
    const c = controlsRef.current;
    if (!c) return;

    // Global motion factor: system 1 → focus 0.12 → explorer 0.
    const s = speedRef.current;
    s.target = reduced ? 0 : mode === "system" ? 1 : mode === "focus" ? 0.12 : 0;
    s.current = THREE.MathUtils.damp(s.current, s.target, 1.6, dt);

    const lambda = reduced ? 40 : 2.0;

    if (earthDistRef && (mode === "system" || selected !== "earth")) {
      earthDistRef.current = 99;
    }

    if (mode === "system") {
      c.minDistance = 14;
      c.maxDistance = 78;
      c.zoomSpeed = 0.7;
      c.minPolarAngle = 0.3;
      c.maxPolarAngle = 1.38;
      if (travelling.current) {
        const defPos = isMobile ? MOBILE_POS : DESKTOP_POS;
        damp3(camera.position, defPos, lambda, dt);
        damp3(c.target, ORIGIN, lambda, dt);
        if (camera.position.distanceTo(defPos) < 0.1) travelling.current = false;
      }
      const idle =
        !interacting.current &&
        !travelling.current &&
        Date.now() - idleSince.current > 9000;
      c.autoRotate = idle && !reduced;
      c.autoRotateSpeed = 0.14;
    } else if (selected) {
      c.autoRotate = false;
      c.minPolarAngle = 0.12;
      c.maxPolarAngle = 2.9;
      const spec = PLANET_BY_ID[selected];
      const obj = planetRefs.current[selected];
      if (obj) {
        const p = obj.getWorldPosition(worldPos.current);
        const isExplorer = mode === "explorer";
        const minFactor =
          selected === "earth" && isMobile
            ? EARTH_FLOOR_MOBILE
            : MIN_VIEW_FACTOR[selected];
        const d = isExplorer ? spec.radius * 1.75 : spec.radius * 4.6 + 1.2;
        // Guided office descents cross the handoff zone (below the quality
        // floor for only the transition moment) — relax the clamp for them.
        c.minDistance = isExplorer
          ? spec.radius * 1.3
          : journey?.kind === "descend" && selected === "earth"
            ? spec.radius * 1.5
            : spec.radius * minFactor;
        c.maxDistance = isExplorer ? spec.radius * 6.5 : spec.radius * 13;

        if (selected === "earth" && earthDistRef) {
          earthDistRef.current = camera.position.distanceTo(p) / spec.radius;
        }
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as { __SB_CAM?: object }).__SB_CAM = {
            dist: +(camera.position.distanceTo(p) / spec.radius).toFixed(3),
            travelling: travelling.current,
            interacting: interacting.current,
          };
        }
        // Keep the frame stable while the planet keeps drifting on its orbit.
        delta.current.copy(p).sub(prevPlanetPos.current);
        if (!travelling.current) camera.position.add(delta.current);
        prevPlanetPos.current.copy(p);
        damp3(c.target, p, travelling.current ? lambda * 1.4 : 40, dt);

        // Earth Continuum: soft deep-zoom detent + pointer-targeted zoom.
        if (selected === "earth" && !isExplorer) {
          const distNow = camera.position.distanceTo(p);
          // Inward motion gently compresses near the deepest useful view —
          // a detent, not a wall.
          c.zoomSpeed =
            0.7 *
            THREE.MathUtils.clamp(
              0.38 +
                (distNow - spec.radius * minFactor) / (spec.radius * 0.55),
              0.38,
              1,
            );
          if (!travelling.current && !journey) {
            // Zoom approaches the surface point under the pointer, so the
            // pointed continent/country grows toward the frame center
            // instead of drifting off it.
            const st = surfaceTargetRef?.current;
            if (
              st &&
              performance.now() - st.at < 1300 &&
              lastEarthDist.current > 0 &&
              distNow < lastEarthDist.current - 1e-5
            ) {
              const body = earthBodyRef.current;
              if (body) {
                body.getWorldQuaternion(bodyQuat.current);
                latLonToUnit(st.lat, st.lon, zoomTargetDir.current).applyQuaternion(
                  bodyQuat.current,
                );
                zoomCamDir.current.copy(camera.position).sub(p).normalize();
                const ang = zoomCamDir.current.angleTo(zoomTargetDir.current);
                if (ang > 0.003 && ang < 2.6) {
                  const frac = (lastEarthDist.current - distNow) / distNow;
                  const rot = Math.min(ang, ang * frac * 4.4);
                  zoomAxis.current.crossVectors(
                    zoomCamDir.current,
                    zoomTargetDir.current,
                  );
                  if (zoomAxis.current.lengthSq() > 1e-10) {
                    zoomAxis.current.normalize();
                    tmp.current
                      .copy(camera.position)
                      .sub(p)
                      .applyAxisAngle(zoomAxis.current, rot);
                    camera.position.copy(p).add(tmp.current);
                  }
                }
              }
            }
            lastEarthDist.current = distNow;
          } else {
            lastEarthDist.current = -1;
          }
        } else {
          c.zoomSpeed = 0.7;
          lastEarthDist.current = -1;
        }

        if (travelling.current) {
          const saved = focusMemory.current[selected];
          if (saved && !isExplorer) {
            desired.current.copy(p).add(saved);
          } else {
            dir.current.copy(p).normalize();
            side.current.crossVectors(UP, dir.current).normalize();
            desired.current
              .copy(p)
              .addScaledVector(dir.current, d * (isExplorer ? 0.5 : 0.88))
              .addScaledVector(UP, d * (isExplorer ? 0.28 : 0.4))
              .addScaledVector(side.current, d * (isExplorer ? 0.85 : 0.34));
          }
          damp3(camera.position, desired.current, lambda, dt);
          if (camera.position.distanceTo(desired.current) < Math.max(0.06, d * 0.012)) {
            travelling.current = false;
          }
        } else if (journey && selected === "earth" && !isExplorer) {
          // Guided journey: orbit toward the geographic target; optionally descend.
          const body = earthBodyRef.current;
          if (body) {
            body.getWorldQuaternion(bodyQuat.current);
            latLonToUnit(journey.lat, journey.lon, journeyDir.current).applyQuaternion(
              bodyQuat.current,
            );
            // Stage-one arrivals compose the office slightly off-center.
            if (journey.kind === "inspect") {
              side.current.crossVectors(UP, journeyDir.current).normalize();
              journeyDir.current
                .addScaledVector(side.current, 0.13)
                .addScaledVector(UP, 0.05)
                .normalize();
            }
            const currentDist = camera.position.distanceTo(p);
            if (journeyDist.current < 0) journeyDist.current = currentDist;
            if (journey.kind === "descend") {
              // Bottom out just inside the handoff zone — never below the
              // texture-quality floor for more than the crossing moment.
              journeyDist.current = Math.max(
                spec.radius * (HANDOFF_ZONE_FACTOR - 0.04),
                THREE.MathUtils.damp(journeyDist.current, spec.radius * 1.5, 0.55, dt),
              );
            } else if (journey.kind === "inspect") {
              const arriveAt = Math.max(journey.dist ?? INSPECT_FACTOR, minFactor + 0.02);
              journeyDist.current = Math.max(
                spec.radius * minFactor,
                THREE.MathUtils.damp(journeyDist.current, spec.radius * arriveAt, 0.85, dt),
              );
            } else {
              journeyDist.current = currentDist;
            }
            const targetDist = journeyDist.current;
            desired.current.copy(p).addScaledVector(journeyDir.current, targetDist);
            damp3(camera.position, desired.current, reduced ? 40 : 1.6, dt);

            tmp.current.copy(camera.position).sub(p).normalize();
            const aligned = tmp.current.dot(journeyDir.current) > 0.9985;
            if (journey.kind === "descend") {
              if (aligned && currentDist < spec.radius * HANDOFF_ZONE_FACTOR) {
                onJourneyHandoff?.(journey.officeId);
              }
            } else if (journey.kind === "inspect") {
              const arriveAt = Math.max(journey.dist ?? INSPECT_FACTOR, minFactor + 0.02);
              if (
                aligned &&
                Math.abs(currentDist - spec.radius * arriveAt) < spec.radius * 0.07
              ) {
                onJourneyDone?.();
              }
            } else if (aligned) {
              onJourneyDone?.();
            }
          }
        }
      }
    }
    c.update();
  });

  return null;
}
