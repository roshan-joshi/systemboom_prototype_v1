"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor, useTexture } from "@react-three/drei";
import {
  orbitAngularSpeed,
  spinAngularSpeed,
  PLANET_BY_ID,
  type PlanetId,
} from "@/lib/cosmos/planets";
import { SYSTEMBOOM_OFFICES, type SystemboomOffice } from "@/lib/systemboom-origin";
import {
  GEO_BANDS,
  GEO_BY_ID,
  GEO_PRIORITY,
  GLOBE_GEO_LABELS,
  geoChildren,
  geoPath,
  type GeoLabelKind,
  type GlobeGeoLabel,
} from "@/lib/earth/globe-geo";
import { countryRings, hasCountryShape } from "@/lib/earth/country-shapes";
import { useTheme } from "@/lib/use-theme";
import type { CosmosMode, PlanetRefs, SpeedRef } from "./types";

const SPEC = PLANET_BY_ID.earth;

export interface SurfaceTarget {
  lat: number;
  lon: number;
  at: number;
}

function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

const RIM_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const RIM_FRAG = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float rim = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), uPower);
  gl_FragColor = vec4(uColor, rim * uIntensity);
}`;

/* ============================================================
   Beacon textures (shared, generated once per mount)
   ============================================================ */

function radialTexture(draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const s = 96;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBeaconCore() {
  return radialTexture((ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(255,190,150,0.95)");
    g.addColorStop(0.45, "rgba(217,42,32,0.75)");
    g.addColorStop(1, "rgba(217,42,32,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Warm glow with a faint ice/steel outer trace — one signal family. */
function makeBeaconHalo() {
  return radialTexture((ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,205,160,0.8)");
    g.addColorStop(0.3, "rgba(240,90,60,0.42)");
    g.addColorStop(0.6, "rgba(180,40,60,0.18)");
    g.addColorStop(0.82, "rgba(160,190,235,0.08)");
    g.addColorStop(1, "rgba(160,190,235,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,190,150,0.3)";
    ctx.lineWidth = s * 0.01;
    for (const a of [0, Math.PI / 2]) {
      ctx.beginPath();
      ctx.moveTo(s / 2 - Math.cos(a) * s * 0.44, s / 2 - Math.sin(a) * s * 0.44);
      ctx.lineTo(s / 2 + Math.cos(a) * s * 0.44, s / 2 + Math.sin(a) * s * 0.44);
      ctx.stroke();
    }
  });
}

function makeBeaconRing() {
  return radialTexture((ctx, s) => {
    ctx.strokeStyle = "rgba(240,120,90,0.9)";
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function makeLensRing() {
  return radialTexture((ctx, s) => {
    ctx.strokeStyle = "rgba(201,216,234,0.85)";
    ctx.lineWidth = s * 0.025;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.3);
    g.addColorStop(0, "rgba(201,216,234,0.25)");
    g.addColorStop(1, "rgba(201,216,234,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/* ============================================================
   COSMIC OFFICE MAST — the SYSTEMBOOM signal anatomy:
   logo · thin engineered mast · illuminated Earth contact point.
   Rotates with the surface; fades at the limb; distance-LOD labels;
   one quiet discovery pulse per appearance; day/night response.
   ============================================================ */

export interface BeaconSlot {
  x: number;
  y: number;
  on: boolean;
  /** Label priority — 1 selected office, 2 office, 4+ geographic labels. */
  pri: number;
}
export type BeaconSlots = Record<string, BeaconSlot>;

/** Nearest visible OFFICE beacon to a screen point — screen-space hit assist. */
function nearestBeaconSlot(
  slots: BeaconSlots,
  x: number,
  y: number,
  maxPx: number,
): string | null {
  let best: string | null = null;
  let bestD = maxPx;
  for (const id of Object.keys(slots)) {
    const s = slots[id];
    if (!s.on || s.pri > 2) continue;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

const UP_LOCAL = new THREE.Vector3(0, 1, 0);

function OfficeBeacon({
  office,
  primary,
  reduced,
  selected,
  onSelect,
  textures,
  slots,
  hoverOfficeRef,
}: {
  office: SystemboomOffice;
  primary: boolean;
  reduced: boolean;
  /** Office selection memory — stage-one keeps it subtly highlighted. */
  selected: boolean;
  onSelect: (officeId: string) => void;
  textures: {
    core: THREE.Texture;
    halo: THREE.Texture;
    ring: THREE.Texture;
    contact: THREE.Texture;
    logo: THREE.Texture;
  };
  /** Shared screen-space registry (hit assist + label collision). */
  slots: React.MutableRefObject<BeaconSlots>;
  hoverOfficeRef: React.MutableRefObject<string | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const contactRingMat = useRef<THREE.SpriteMaterial>(null);
  const contactCoreMat = useRef<THREE.SpriteMaterial>(null);
  const mastMat = useRef<THREE.MeshBasicMaterial>(null);
  const logoMat = useRef<THREE.SpriteMaterial>(null);
  const haloMat = useRef<THREE.SpriteMaterial>(null);
  const haloSprite = useRef<THREE.Sprite>(null);
  const selHaloMat = useRef<THREE.SpriteMaterial>(null);
  const pulseMat = useRef<THREE.SpriteMaterial>(null);
  const pulseSprite = useRef<THREE.Sprite>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const wasVisible = useRef(false);
  const pulseStart = useRef(-1);
  const [hovered, setHovered] = useState(false);
  const [tier, setTier] = useState(0);
  useCursor(hovered);

  const pos = useMemo(
    () => latLonToVec3(office.latitude, office.longitude, SPEC.radius * 1.004),
    [office],
  );
  // Orient the mast along the surface normal — physically attached.
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(UP_LOCAL, pos.clone().normalize()),
    [pos],
  );
  const wp = useRef(new THREE.Vector3());
  const centerPos = useRef(new THREE.Vector3());
  const outward = useRef(new THREE.Vector3());
  const toCam = useRef(new THREE.Vector3());
  const sunDir = useRef(new THREE.Vector3());
  const proj = useRef(new THREE.Vector3());

  const strength = primary ? 1 : 0.82;
  const MAST_H = primary ? 0.115 : 0.098;

  useFrame(({ camera, clock, size }, dt) => {
    const g = group.current;
    if (!g || !g.parent) return;
    g.getWorldPosition(wp.current);
    g.parent.getWorldPosition(centerPos.current);
    outward.current.copy(wp.current).sub(centerPos.current).normalize();
    toCam.current.copy(camera.position).sub(centerPos.current).normalize();
    const facing = outward.current.dot(toCam.current);

    // Distance LOD tier
    const dist = camera.position.distanceTo(centerPos.current) / SPEC.radius;
    const next = dist > 3.5 ? 0 : dist > 2.2 ? 1 : dist > 1.7 ? 2 : 3;
    if (next !== tier) setTier(next);

    // True geometric horizon: at distance d (radii) the limb sits at
    // facing = 1/d — beyond it the office is physically behind Earth,
    // so everything (including the DOM label) must be gone.
    const horizon = 1 / Math.max(dist, 1.001);
    const vis = THREE.MathUtils.clamp((facing - horizon - 0.02) / 0.22, 0, 1);

    // Day/night: night-side signals glow slightly warmer; day-side stay crisp.
    // The Sun sits at the world origin.
    sunDir.current.copy(centerPos.current).multiplyScalar(-1).normalize();
    const sunDot = outward.current.dot(sunDir.current);
    const nightBoost = THREE.MathUtils.clamp(1.02 - sunDot * 0.18, 0.86, 1.2);

    // Screen-space slot — shared hit assist + label collision.
    proj.current.copy(wp.current).project(camera);
    const slot = (slots.current[office.id] ??= { x: 0, y: 0, on: false, pri: 2 });
    slot.x = (proj.current.x + 1) * 0.5 * size.width;
    slot.y = (1 - proj.current.y) * 0.5 * size.height;
    slot.on = vis > 0.3 && proj.current.z < 1;
    slot.pri = selected ? 1 : 2;

    const hot = hovered || hoverOfficeRef.current === office.id;

    // One quiet discovery pulse each time the office rotates into view.
    if (vis > 0.5 && !wasVisible.current) {
      wasVisible.current = true;
      if (!reduced) pulseStart.current = clock.elapsedTime;
    } else if (vis < 0.06 && wasVisible.current) {
      wasVisible.current = false;
    }

    if (contactRingMat.current) contactRingMat.current.opacity = vis * 0.55 * strength;
    if (contactCoreMat.current) {
      contactCoreMat.current.opacity = vis * (selected ? 0.85 : 0.6) * strength;
    }
    if (mastMat.current) mastMat.current.opacity = vis * 0.8 * strength;
    if (logoMat.current) {
      const logoVis = tier >= 1 || hot || selected ? 1 : 0.35;
      logoMat.current.opacity = vis * logoVis * (hot ? 1 : 0.92) * strength;
    }
    if (haloMat.current && haloSprite.current) {
      const breath = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 0.4 + (primary ? 0 : 2.6)) * 0.05;
      haloSprite.current.scale.setScalar(
        (tier >= 1 ? 0.17 : 0.12) * (primary ? 1.12 : 1) * breath,
      );
      haloMat.current.opacity = vis * (hot ? 0.8 : 0.5) * strength * nightBoost;
    }
    if (selHaloMat.current) {
      selHaloMat.current.opacity = THREE.MathUtils.damp(
        selHaloMat.current.opacity,
        selected ? vis * 0.3 : 0,
        6,
        dt,
      );
    }
    if (pulseMat.current && pulseSprite.current) {
      const t = pulseStart.current < 0 ? 99 : clock.elapsedTime - pulseStart.current;
      if (!reduced && t < 1.8) {
        // One quiet ripple — never an alarm ring.
        const k = t / 1.8;
        pulseSprite.current.scale.setScalar(0.06 + k * 0.08);
        pulseMat.current.opacity = (1 - k) * 0.3 * vis * strength;
      } else {
        pulseMat.current.opacity = 0;
      }
    }
    if (labelRef.current) {
      // Head Office wins label priority when both signals crowd the frame.
      let suppressed = false;
      if (!primary && !selected && !hot) {
        const head = slots.current["head-office"];
        if (head?.on && slot.on && Math.hypot(head.x - slot.x, head.y - slot.y) < 110) {
          suppressed = true;
        }
      }
      const showText = (tier >= 1 || hot || selected) && !suppressed;
      // Text retires earlier than the signal near the limb — no clutter
      // hanging off Earth's edge while the mast itself gracefully fades.
      const textVis = THREE.MathUtils.clamp((facing - horizon - 0.12) / 0.22, 0, 1);
      labelRef.current.style.opacity = String(showText ? textVis : 0);
    }
  });

  return (
    <group ref={group} position={pos} quaternion={quat}>
      {/* Earth contact point — tiny illuminated anchor */}
      <sprite scale={0.034} position={[0, 0.002, 0]}>
        <spriteMaterial
          ref={contactRingMat}
          map={textures.contact}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={0.02} position={[0, 0.002, 0]}>
        <spriteMaterial
          ref={contactCoreMat}
          map={textures.core}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      {/* Thin engineered mast rising from the surface */}
      <mesh position={[0, MAST_H / 2, 0]}>
        <cylinderGeometry args={[0.0012, 0.0022, MAST_H, 6]} />
        <meshBasicMaterial
          ref={mastMat}
          color="#dfe9f5"
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Signal head: halo, mascot, selection halo, discovery pulse */}
      <sprite ref={haloSprite} scale={0.14} position={[0, MAST_H, 0]}>
        <spriteMaterial
          ref={haloMat}
          map={textures.halo}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={0.24} position={[0, MAST_H, 0]}>
        <spriteMaterial
          ref={selHaloMat}
          map={textures.halo}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={primary ? 0.05 : 0.043} position={[0, MAST_H, 0]}>
        <spriteMaterial
          ref={logoMat}
          map={textures.logo}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={pulseSprite} scale={0.08} position={[0, MAST_H, 0]}>
        <spriteMaterial
          ref={pulseMat}
          map={textures.ring}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      {/* generous invisible touch target over the whole mast */}
      <mesh
        visible={false}
        position={[0, MAST_H * 0.55, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(office.id);
        }}
      >
        <sphereGeometry args={[0.16, 8, 8]} />
      </mesh>
      {/* Restrained camera-readable label — fixed screen size so Earth
          always stays the visual hero, no giant billboards. */}
      <Html
        center
        position={[0, MAST_H + 0.015, 0]}
        zIndexRange={[15, 5]}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={labelRef}
          className="flex flex-col items-center gap-[1px] whitespace-nowrap transition-opacity duration-300"
          style={{ opacity: 0, transform: "translateY(-52px)" }}
        >
          <p className="text-[10px] font-semibold tracking-[0.3em] text-white/90 uppercase [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
            Systemboom
          </p>
          <p className="text-[8.5px] tracking-[0.24em] text-[#ffd08a]/85 uppercase [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
            {office.role}
          </p>
          {tier >= 2 && (
            <p
              className={`text-[8px] tracking-[0.18em] text-white/60 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] ${tier >= 3 ? "" : "uppercase"}`}
            >
              {tier >= 3 ? office.deepLine : office.nearLine}
            </p>
          )}
        </div>
      </Html>
    </group>
  );
}

/* ============================================================
   SEMANTIC GEOGRAPHIC LABELS — the Earth Continuum layer.
   Zoom reveals context: continents → countries → regions/cities.
   Spherically projected, Earth-locked, horizon-occluded, LOD-banded,
   priority-collided (SYSTEMBOOM offices always win). Orientation,
   not street mapping — the imagery stays dominant.
   ============================================================ */

const GEO_LABEL_STYLE: Record<
  GeoLabelKind,
  { cls: string; dy: number; dot: boolean }
> = {
  continent: {
    cls: "text-[13px] font-semibold tracking-[0.5em] text-white/70",
    dy: 0,
    dot: false,
  },
  country: {
    cls: "text-[10px] font-medium tracking-[0.3em] text-white/75",
    dy: 14,
    dot: false,
  },
  region: {
    cls: "text-[8.5px] tracking-[0.26em] text-white/60",
    dy: 13,
    dot: false,
  },
  city: {
    cls: "text-[9px] font-medium tracking-[0.22em] text-[#cfe0f5]/85",
    dy: 13,
    dot: true,
  },
};

/** Selection context shared by every label — who is subject, kin, or noise. */
export interface GeoSelection {
  id: string;
  kind: GeoLabelKind;
  lineage: Set<string>;
  children: Set<string>;
  siblings: Set<string>;
}

function GeoLabel({
  spec,
  registry,
  onNavigate,
  selection,
  focused = false,
}: {
  spec: GlobeGeoLabel;
  /** Shared screen registry with the office beacons — collision + priority. */
  registry: React.MutableRefObject<BeaconSlots>;
  /** Semantic ladder: the label itself is a navigable geographic object. */
  onNavigate: (label: GlobeGeoLabel) => void;
  selection: GeoSelection | null;
  /** Keyboard geography-mode focus. */
  focused?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const downAt = useRef<[number, number] | null>(null);
  const pos = useMemo(
    () => latLonToVec3(spec.lat, spec.lon, SPEC.radius * 1.005),
    [spec],
  );
  const wp = useRef(new THREE.Vector3());
  const centerPos = useRef(new THREE.Vector3());
  const outward = useRef(new THREE.Vector3());
  const toCam = useRef(new THREE.Vector3());
  const proj = useRef(new THREE.Vector3());
  const pri = GEO_PRIORITY[spec.kind];
  const band = GEO_BANDS[spec.kind];
  const style = GEO_LABEL_STYLE[spec.kind];

  useFrame(({ camera, size }) => {
    const g = group.current;
    if (!g || !g.parent || !labelRef.current) return;
    g.getWorldPosition(wp.current);
    g.parent.getWorldPosition(centerPos.current);
    outward.current.copy(wp.current).sub(centerPos.current).normalize();
    toCam.current.copy(camera.position).sub(centerPos.current).normalize();
    const facing = outward.current.dot(toCam.current);
    const dist = camera.position.distanceTo(centerPos.current) / SPEC.radius;

    // Short viewports (phone landscape) carry far less composition room:
    // keep only the essential hierarchy, front-and-center.
    const shortViewport = size.height < 480;

    // Semantic relevance: the selected geography dominates, its children
    // become discoverable, kin stay as quiet context, noise retires.
    let bandMin = band.min;
    let bandMax = band.max;
    let gain = 1;
    if (selection) {
      if (spec.id === selection.id) {
        bandMin = 1.35;
        bandMax = 4.4;
        gain = 1.25;
      } else if (selection.children.has(spec.id)) {
        bandMax = Math.max(bandMax, 3.3);
      } else if (selection.lineage.has(spec.id)) {
        gain = 0.55;
      } else if (selection.siblings.has(spec.id)) {
        gain = 0.4;
      } else {
        gain = 0;
      }
    }

    // Band fade: each kind belongs to a semantic-zoom range.
    const bandFade =
      THREE.MathUtils.clamp((dist - bandMin) / 0.12, 0, 1) *
      THREE.MathUtils.clamp((bandMax - dist) / 0.2, 0, 1);

    // True horizon occlusion + limb retirement — never through Earth.
    // Short viewports demand near-center dominance before text appears.
    const horizon = 1 / Math.max(dist, 1.001);
    const textVis = THREE.MathUtils.clamp(
      (facing - horizon - (shortViewport ? 0.3 : 0.12)) / 0.22,
      0,
      1,
    );

    let o = bandFade * textVis * gain;
    if (
      shortViewport &&
      (spec.kind === "city" || spec.kind === "region") &&
      selection?.id !== spec.id
    )
      o = 0;

    o = Math.min(1, o);

    proj.current.copy(wp.current).project(camera);
    const slot = (registry.current[spec.id] ??= { x: 0, y: 0, on: false, pri });
    // The selected geographic target outranks ordinary geography.
    const priNow = selection?.id === spec.id ? 3 : pri;
    slot.pri = priNow;
    slot.x = (proj.current.x + 1) * 0.5 * size.width;
    slot.y = (1 - proj.current.y) * 0.5 * size.height;
    if (proj.current.z >= 1) o = 0;

    // UI safe zones: semantic labels never sit behind the top nav, the
    // globe breadcrumb, or the bottom Earth controls.
    if (slot.y > size.height - 96 || slot.y < 108) o = 0;

    // Priority collision: retire beneath any visible higher-priority label.
    // SYSTEMBOOM offices always win and get generous clearance.
    if (o > 0.08) {
      for (const id of Object.keys(registry.current)) {
        const e = registry.current[id];
        if (e === slot || !e.on) continue;
        // A child may sit right beside its parent (Kathmandu under Nepal) —
        // the parent floats larger while the child reads below it; both
        // belong, and near the deep floor the child is the live affordance.
        if (id === spec.parent) continue;
        if (e.pri < priNow || (e.pri === priNow && id < spec.id)) {
          // Office clearance shrinks with distance (beacons are tiny at
          // planetary scale). Country and city names coexist with an office
          // entirely — office text floats above the mast while place text
          // sits below its anchor, so the two never actually overlap, and a
          // country hosting a SYSTEMBOOM office must keep its clickable name
          // (clicking the NAME is the only route into that geography's map).
          const officeCoexists =
            spec.kind === "country" ||
            spec.kind === "city" ||
            (!!selection && (spec.id === selection.id || selection.children.has(spec.id)));
          const need =
            e.pri <= 2
              ? officeCoexists
                ? 0
                : Math.max(30, Math.min(70, (70 * 2.2) / dist))
              : shortViewport
                ? 150
                : 56;
          if (need === 0) continue;
          if (Math.hypot(e.x - slot.x, e.y - slot.y) < need) {
            o = 0;
            break;
          }
        }
      }
    }
    slot.on = o > 0.12;
    labelRef.current.style.opacity = String(o);
    // Labels are navigable only while genuinely visible.
    labelRef.current.style.pointerEvents = o > 0.35 ? "auto" : "none";
  });

  const isSelected = selection?.id === spec.id;

  return (
    <group ref={group} position={pos}>
      <Html center zIndexRange={[12, 3]} style={{ pointerEvents: "none" }}>
        <div
          ref={labelRef}
          className="flex flex-col items-center gap-[3px] whitespace-nowrap transition-opacity duration-500"
          style={{ opacity: 0, transform: `translateY(${style.dy}px)`, pointerEvents: "none" }}
        >
          {style.dot && (
            <span
              aria-hidden
              className="h-[3px] w-[3px] rounded-full bg-[#cfe0f5]/80 shadow-[0_0_4px_rgba(207,224,245,0.8)]"
            />
          )}
          {/* The text itself is the spatial control — no boxes, no chrome.
              A grab that slides across the label must never activate it. */}
          <button
            onPointerDown={(e) => {
              downAt.current = [e.clientX, e.clientY];
            }}
            onClick={(e) => {
              const d = downAt.current;
              if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 7) return;
              onNavigate(spec);
            }}
            aria-label={`View ${spec.name}`}
            aria-current={isSelected ? "location" : undefined}
            className={`${style.cls} sb-transition -m-2 cursor-pointer p-2 uppercase hover:scale-[1.05] hover:brightness-150 focus-visible:outline-[#8fc2ff] ${
              isSelected
                ? "scale-[1.12] font-semibold !text-white [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_1px_4px_rgba(0,0,0,0.95),0_2px_14px_rgba(140,190,255,0.45)]"
                : "[text-shadow:0_0_2px_rgba(0,0,0,0.95),0_1px_4px_rgba(0,0,0,0.9),0_1px_10px_rgba(0,0,0,0.85)]"
            } ${
              focused
                ? "!text-white brightness-150 [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_0_14px_rgba(143,194,255,0.95)]"
                : ""
            }`}
          >
            {spec.name}
          </button>
        </div>
      </Html>
    </group>
  );
}

/* ============================================================
   COUNTRY TERRITORY FOCUS — the Earth quietly acknowledges the
   selected country. Real Natural Earth geometry, projected onto
   the sphere, drawn ONLY for the current selection: a thin ice
   edge and a whisper of interior lift. Never a GIS polygon.
   ============================================================ */

function CountryTerritory({
  countryId,
  reduced,
}: {
  countryId: string;
  reduced: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lineMats = useRef<THREE.LineBasicMaterial[]>([]);
  const fillMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const born = useRef(-1);
  const wp = useRef(new THREE.Vector3());
  const centerPos = useRef(new THREE.Vector3());
  const outward = useRef(new THREE.Vector3());
  const toCam = useRef(new THREE.Vector3());
  const sunDir = useRef(new THREE.Vector3());

  const built = useMemo(() => {
    const rings = countryRings(countryId);
    if (!rings) return null;
    const lines: THREE.BufferGeometry[] = [];
    const fills: THREE.BufferGeometry[] = [];
    for (const ring of rings) {
      const pts = ring.map(([lon, lat]) => latLonToVec3(lat, lon, SPEC.radius * 1.0045));
      lines.push(new THREE.BufferGeometry().setFromPoints(pts));
      try {
        // Triangulate in lon/lat space, then drape onto the sphere.
        const shape = new THREE.Shape(
          ring.map(([lon, lat]) => new THREE.Vector2(lon, lat)),
        );
        const g = new THREE.ShapeGeometry(shape);
        const posAttr = g.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const v = latLonToVec3(posAttr.getY(i), posAttr.getX(i), SPEC.radius * 1.0028);
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
        posAttr.needsUpdate = true;
        fills.push(g);
      } catch {
        /* interior lift is optional — the edge carries the meaning */
      }
    }
    // Anchor for limb fade: centroid of the main landmass.
    const main = rings[0];
    let lat = 0;
    let lon = 0;
    for (const p of main) {
      lon += p[0];
      lat += p[1];
    }
    const anchor = latLonToVec3(lat / main.length, lon / main.length, SPEC.radius);
    return { lines, fills, anchor };
  }, [countryId]);

  // Dispose geometries when the selection changes.
  useEffect(() => {
    born.current = -1;
    const b = built;
    return () => {
      b?.lines.forEach((g) => g.dispose());
      b?.fills.forEach((g) => g.dispose());
    };
  }, [built]);

  useFrame(({ camera, clock }) => {
    const g = groupRef.current;
    if (!g || !g.parent || !built) return;
    if (born.current < 0) born.current = clock.elapsedTime;

    // Limb fade from the territory's anchor — geometry behind the planet
    // is already depth-culled; this retires the near-limb remainder.
    g.getWorldPosition(wp.current);
    g.parent.getWorldPosition(centerPos.current);
    outward.current
      .copy(built.anchor)
      .applyQuaternion(g.parent.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();
    toCam.current.copy(camera.position).sub(centerPos.current).normalize();
    const facing = outward.current.dot(toCam.current);
    const vis = THREE.MathUtils.clamp((facing - 0.05) / 0.3, 0, 1);

    // Day/night adaptive edge — stronger separation in daylight, a softer
    // luminous boundary on the night side. The Sun sits at the origin.
    sunDir.current.copy(centerPos.current).multiplyScalar(-1).normalize();
    const sunDot = outward.current.dot(sunDir.current);
    const dayness = THREE.MathUtils.clamp(sunDot * 0.5 + 0.5, 0, 1);

    // One gentle arrival breath (0 → peak → resting), then stillness.
    const t = clock.elapsedTime - born.current;
    const breath = reduced
      ? 1
      : t < 0.45
        ? t / 0.45
        : t < 1.0
          ? 1.25 - ((t - 0.45) / 0.55) * 0.25
          : 1;

    const edge = (0.34 + dayness * 0.22) * vis * breath;
    const lift = (0.05 + dayness * 0.015) * vis * breath;
    for (const m of lineMats.current) if (m) m.opacity = edge;
    for (const m of fillMats.current) if (m) m.opacity = lift;
  });

  if (!built) return null;
  lineMats.current = [];
  fillMats.current = [];

  return (
    <group ref={groupRef}>
      {built.fills.map((geo, i) => (
        <mesh key={`f${i}`} geometry={geo}>
          <meshBasicMaterial
            ref={(m) => {
              if (m) fillMats.current[i] = m;
            }}
            color="#9fc4ee"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {built.lines.map((geo, i) => (
        <lineLoop key={`l${i}`} geometry={geo}>
          <lineBasicMaterial
            ref={(m) => {
              if (m) lineMats.current[i] = m;
            }}
            color="#d5e8ff"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </lineLoop>
      ))}
    </group>
  );
}

/* ============================================================
   EARTH
   ============================================================ */

export function Earth({
  speedRef,
  reduced,
  planetRefs,
  onSelect,
  selected,
  mode,
  clouds: cloudsEnabled,
  anisotropy,
  bodyRef,
  onOfficeSelect,
  onSurfaceFocus,
  surfaceTargetRef,
  selectedOfficeId,
  onGeoNavigate,
  selectedGeoId,
  focusedGeoId,
}: {
  speedRef: React.MutableRefObject<SpeedRef>;
  reduced: boolean;
  planetRefs: PlanetRefs;
  onSelect: (id: PlanetId) => void;
  selected: PlanetId | null;
  mode: CosmosMode;
  clouds: boolean;
  anisotropy: number;
  /** The spinning surface mesh — handoff + journeys read its orientation. */
  bodyRef: React.MutableRefObject<THREE.Mesh | null>;
  onOfficeSelect: (officeId: string) => void;
  onSurfaceFocus: (target: { lat: number; lon: number }) => void;
  /** Last surface point under the pointer — drives handoff targeting. */
  surfaceTargetRef: React.MutableRefObject<SurfaceTarget | null>;
  /** Currently selected SYSTEMBOOM office (two-stage journey memory). */
  selectedOfficeId: string | null;
  /** Semantic ladder navigation from a clicked geographic label. */
  onGeoNavigate: (label: GlobeGeoLabel) => void;
  /** The current semantic geographic subject (drives labels + territory). */
  selectedGeoId: string | null;
  /** Keyboard geography-mode focus (visible focus indication). */
  focusedGeoId: string | null;
}) {
  const theme = useTheme();
  const [day, night, cloudTex] = useTexture(
    [
      "/cosmos/2k_earth_daymap.jpg",
      "/cosmos/2k_earth_nightmap.jpg",
      "/cosmos/2k_earth_clouds.jpg",
    ],
    (textures) => {
      for (const t of textures as THREE.Texture[]) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = anisotropy;
      }
    },
  );
  const logoTex = useTexture("/icon.png", (t) => {
    (t as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
  });

  const beaconTextures = useMemo(
    () => ({
      core: makeBeaconCore(),
      halo: makeBeaconHalo(),
      ring: makeBeaconRing(),
      contact: makeLensRing(),
      logo: logoTex,
    }),
    [logoTex],
  );
  const lensTex = useMemo(() => makeLensRing(), []);
  /** Screen positions of both beacons — generous hit assist + label collision. */
  const beaconSlots = useRef<BeaconSlots>({});
  const hoverOfficeRef = useRef<string | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_SLOTS?: BeaconSlots }).__SB_SLOTS =
        beaconSlots.current;
    }
  }, []);

  /* Semantic selection context — subject, kin, and quiet territory. */
  const geoSelection = useMemo<GeoSelection | null>(() => {
    if (!selectedGeoId) return null;
    const label = GEO_BY_ID[selectedGeoId];
    if (!label) return null;
    return {
      id: label.id,
      kind: label.kind,
      lineage: new Set(geoPath(label.id).map((l) => l.id)),
      children: new Set(geoChildren(label.id).map((l) => l.id)),
      siblings: new Set(geoChildren(label.parent ?? null).map((l) => l.id)),
    };
  }, [selectedGeoId]);
  const territoryId =
    selectedGeoId &&
    GEO_BY_ID[selectedGeoId]?.kind === "country" &&
    hasCountryShape(selectedGeoId)
      ? selectedGeoId
      : null;
  const selectedCity =
    selectedGeoId && GEO_BY_ID[selectedGeoId]?.kind === "city"
      ? GEO_BY_ID[selectedGeoId]
      : null;

  const pivot = useRef<THREE.Group>(null);
  const worldCenter = useRef(new THREE.Vector3());
  const body = useRef<THREE.Mesh>(null);
  /* Ray→surface scratch (outer-sphere pointer events don't reach the body,
     so geographic targeting solves the true surface intersection itself). */
  const rayCenter = useRef(new THREE.Vector3());
  const rayOC = useRef(new THREE.Vector3());
  const rayPoint = useRef(new THREE.Vector3());
  const rayQuat = useRef(new THREE.Quaternion());
  const cloudMesh = useRef<THREE.Mesh>(null);
  const surfaceMat = useRef<THREE.MeshStandardMaterial>(null);
  const lensSprite = useRef<THREE.Sprite>(null);
  const lensMat = useRef<THREE.SpriteMaterial>(null);
  const angle = useRef((SPEC.initialAngleDeg * Math.PI) / 180);
  const [hovered, setHovered] = useState(false);
  /** Semantic zoom band: 0 none · 1 continents · 2 +countries · 3 +regions/cities. */
  const [zBand, setZBand] = useState(0);
  const atmoMat = useRef<THREE.ShaderMaterial>(null);
  useCursor(hovered && mode === "system");

  /** Geographic point under the pointer ray, from the true Earth surface. */
  const surfaceFromRay = (ray: THREE.Ray): { lat: number; lon: number } | null => {
    const b = body.current;
    const pv = pivot.current;
    if (!b || !pv) return null;
    pv.getWorldPosition(rayCenter.current);
    rayOC.current.copy(ray.origin).sub(rayCenter.current);
    const bb = rayOC.current.dot(ray.direction);
    const cc = rayOC.current.lengthSq() - SPEC.radius * SPEC.radius;
    const disc = bb * bb - cc;
    if (disc < 0) return null;
    const t = -bb - Math.sqrt(disc);
    if (t <= 0) return null;
    rayPoint.current.copy(ray.direction).multiplyScalar(t).add(ray.origin);
    b.getWorldQuaternion(rayQuat.current).invert();
    rayPoint.current.sub(rayCenter.current).applyQuaternion(rayQuat.current).normalize();
    const phi = Math.acos(THREE.MathUtils.clamp(rayPoint.current.y, -1, 1));
    const lat = 90 - THREE.MathUtils.radToDeg(phi);
    let lon =
      THREE.MathUtils.radToDeg(Math.atan2(rayPoint.current.z, -rayPoint.current.x)) - 180;
    if (lon < -180) lon += 360;
    return { lat, lon };
  };

  const orbitSpeed = useMemo(() => orbitAngularSpeed(SPEC.periodYears), []);
  const spin = useMemo(() => spinAngularSpeed(SPEC.spinHours), []);
  const isSelected = selected === "earth";
  const isExplorer = mode === "explorer";

  useFrame(({ camera, size }, dt) => {
    const g = pivot.current;
    if (!g) return;
    const speed = speedRef.current.current;
    if (!reduced) {
      angle.current += dt * orbitSpeed * speed;
      // During the Explorer handoff the globe holds still for a stable transfer.
      const spinFactor = isExplorer ? 0 : Math.max(speed, isSelected ? 0.4 : speed);
      if (body.current) body.current.rotation.y += dt * spin * spinFactor;
      if (cloudMesh.current) cloudMesh.current.rotation.y += dt * spin * spinFactor * 1.25;
    }
    g.position.set(
      Math.cos(angle.current) * SPEC.orbitRadius,
      0,
      Math.sin(angle.current) * SPEC.orbitRadius,
    );
    // Night lights bloom as Earth becomes the subject.
    if (surfaceMat.current) {
      const dark = theme === "dark";
      const target = isExplorer
        ? dark
          ? 1.05
          : 0.5
        : isSelected
          ? dark
            ? 0.7
            : 0.32
          : dark
            ? 0.2
            : 0.08;
      surfaceMat.current.emissiveIntensity = THREE.MathUtils.damp(
        surfaceMat.current.emissiveIntensity,
        target,
        2.5,
        dt,
      );
    }
    // Semantic zoom band — mounts/unmounts the geographic label tiers.
    {
      // World position — the mobile composition yaw makes local != world.
      const distR = pivot.current
        ? camera.position.distanceTo(pivot.current.getWorldPosition(worldCenter.current)) /
          SPEC.radius
        : 99;
      const nextBand =
        !isSelected || isExplorer
          ? 0
          : distR <= 1.9
            ? 3
            : distR <= 2.3
              ? 2
              : distR <= 6.5
                ? 1
                : 0;
      if (nextBand !== zBand) setZBand(nextBand);
      // Deep-zoom detent: the atmosphere quietly strengthens as the camera
      // compresses against the quality-based deep floor.
      if (atmoMat.current) {
        const floorR = size.width < 768 ? 1.55 : 1.62;
        const boost =
          isSelected && !isExplorer
            ? THREE.MathUtils.clamp((floorR + 0.22 - distR) / 0.22, 0, 1)
            : 0;
        atmoMat.current.uniforms.uIntensity.value = THREE.MathUtils.damp(
          atmoMat.current.uniforms.uIntensity.value,
          0.45 + boost * 0.42,
          3,
          dt,
        );
      }
    }
    // Surface-focus lens: quiet ring at the pointed location during deep inspection.
    if (lensSprite.current && lensMat.current) {
      const target = surfaceTargetRef.current;
      const dist = pivot.current
        ? camera.position.distanceTo(pivot.current.getWorldPosition(worldCenter.current)) /
          SPEC.radius
        : 99;
      const fresh = target && performance.now() - target.at < 1100;
      const show = isSelected && !isExplorer && dist < 2.4 && fresh;
      lensMat.current.opacity = THREE.MathUtils.damp(
        lensMat.current.opacity,
        show ? 0.75 : 0,
        reduced ? 40 : 8,
        dt,
      );
      if (target && show) {
        lensSprite.current.position.copy(
          latLonToVec3(target.lat, target.lon, SPEC.radius * 1.008),
        );
      }
    }
  });

  return (
    <group
      ref={(node) => {
        pivot.current = node;
        if (node) planetRefs.current.earth = node;
        else delete planetRefs.current.earth;
      }}
      position={[
        Math.cos(angle.current) * SPEC.orbitRadius,
        0,
        Math.sin(angle.current) * SPEC.orbitRadius,
      ]}
    >
      <group rotation={[0, 0, (SPEC.tiltDeg * Math.PI) / 180]}>
        <mesh
          ref={(node) => {
            body.current = node;
            bodyRef.current = node;
          }}
          onPointerMove={(e) => {
            if (selected !== "earth" || mode === "explorer" || !e.uv) return;
            surfaceTargetRef.current = {
              lat: e.uv.y * 180 - 90,
              lon: e.uv.x * 360 - 180,
              at: performance.now(),
            };
          }}
          onDoubleClick={(e) => {
            if (selected !== "earth" || mode === "explorer" || !e.uv) return;
            e.stopPropagation();
            onSurfaceFocus({ lat: e.uv.y * 180 - 90, lon: e.uv.x * 360 - 180 });
          }}
        >
          <sphereGeometry args={[SPEC.radius, 64, 64]} />
          <meshStandardMaterial
            ref={surfaceMat}
            map={day}
            emissiveMap={night}
            emissive="#ffd08a"
            emissiveIntensity={0.2}
            roughness={0.94}
            metalness={0}
          />
          {/* SYSTEMBOOM signal network — rotates with the world */}
          {SYSTEMBOOM_OFFICES.map((office) => (
            <OfficeBeacon
              key={office.id}
              office={office}
              primary={office.type === "HEAD_OFFICE"}
              reduced={reduced}
              selected={selectedOfficeId === office.id}
              onSelect={onOfficeSelect}
              textures={beaconTextures}
              slots={beaconSlots}
              hoverOfficeRef={hoverOfficeRef}
            />
          ))}
          {/* Semantic geographic context — zoom reveals, selection reveals
              children early, Earth stays hero */}
          {zBand >= 1 &&
            GLOBE_GEO_LABELS.filter(
              (l) =>
                (l.kind === "continent" && zBand >= 1) ||
                (l.kind === "country" && zBand >= 2) ||
                ((l.kind === "region" || l.kind === "city") && zBand >= 3) ||
                (geoSelection &&
                  (l.id === geoSelection.id ||
                    geoSelection.lineage.has(l.id) ||
                    geoSelection.children.has(l.id) ||
                    geoSelection.siblings.has(l.id))),
            ).map((l) => (
              <GeoLabel
                key={l.id}
                spec={l}
                registry={beaconSlots}
                onNavigate={onGeoNavigate}
                selection={geoSelection}
                focused={focusedGeoId === l.id}
              />
            ))}
          {/* Territory focus — only the selected country, never a political map */}
          {territoryId && <CountryTerritory countryId={territoryId} reduced={reduced} />}
          {/* Selected city: a quiet persistent lens at its coordinates */}
          {selectedCity && (
            <sprite
              scale={0.055}
              position={latLonToVec3(selectedCity.lat, selectedCity.lon, SPEC.radius * 1.006)}
            >
              <spriteMaterial
                map={lensTex}
                transparent
                opacity={0.42}
                depthWrite={false}
                toneMapped={false}
              />
            </sprite>
          )}
          {/* Surface focus lens — "continued zoom approaches here" */}
          <sprite ref={lensSprite} scale={0.06}>
            <spriteMaterial
              ref={lensMat}
              map={lensTex}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </mesh>
        {cloudsEnabled && (
          <mesh ref={cloudMesh} scale={1.018}>
            <sphereGeometry args={[SPEC.radius, 48, 48]} />
            <meshStandardMaterial
              alphaMap={cloudTex}
              color="#ffffff"
              transparent
              opacity={0.85}
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        )}
        {/* Atmosphere: thin rim + soft outer halo */}
        <mesh scale={1.04}>
          <sphereGeometry args={[SPEC.radius, 48, 48]} />
          <shaderMaterial
            ref={atmoMat}
            vertexShader={RIM_VERT}
            fragmentShader={RIM_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color("#6fb3ff") },
              uIntensity: { value: 0.45 },
              uPower: { value: 3.4 },
            }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={1.1}>
          <sphereGeometry args={[SPEC.radius, 48, 48]} />
          <shaderMaterial
            vertexShader={RIM_VERT}
            fragmentShader={RIM_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color("#4d8fe0") },
              uIntensity: { value: 0.22 },
              uPower: { value: 5.0 },
            }}
            transparent
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          // Screen-space beacon assist: office signals stay effortlessly
          // clickable even when Earth is small in the Solar System frame.
          const officeId = nearestBeaconSlot(
            beaconSlots.current,
            e.nativeEvent.clientX,
            e.nativeEvent.clientY,
            36,
          );
          if (officeId) {
            onOfficeSelect(officeId);
            return;
          }
          if (mode === "system") onSelect("earth");
        }}
        onDoubleClick={(e) => {
          if (selected !== "earth" || mode === "explorer") return;
          e.stopPropagation();
          const hit = surfaceFromRay(e.ray);
          if (hit) onSurfaceFocus(hit);
        }}
        onPointerMove={(e) => {
          hoverOfficeRef.current = nearestBeaconSlot(
            beaconSlots.current,
            e.nativeEvent.clientX,
            e.nativeEvent.clientY,
            30,
          );
          // Geographic targeting from exploration distance: this shell
          // swallows pointer events before they reach the surface mesh,
          // so resolve the surface point from the ray directly.
          if (selected === "earth" && mode !== "explorer") {
            const hit = surfaceFromRay(e.ray);
            if (hit) {
              surfaceTargetRef.current = { ...hit, at: performance.now() };
            }
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          hoverOfficeRef.current = null;
        }}
      >
        <sphereGeometry args={[SPEC.radius * 1.7, 12, 12]} />
      </mesh>
    </group>
  );
}
