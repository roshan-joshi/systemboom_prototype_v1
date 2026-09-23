"use client";

/**
 * CELESTIAL RESONANCE — the settled optical tiers: SIGNAL and SEAL.
 *
 * Contract: 22-COMPONENT-ARCHITECTURE.md · 22-ASSET-PIPELINE.md · Bible Ch. 08.
 *
 * Signal prioritizes the heart, corona, trail or planetary silhouette; Seal keeps more
 * surface detail. Both use dedicated transparent optical exports from the same art family
 * as the Field. No enclosing night disc or radial crop is applied to these silhouettes.
 *
 * Both tiers are STATIC once settled — no passive loops anywhere in settled UI (Bible Ch. 09).
 */

import { useT } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/use-theme";
import { CELESTIAL_A11Y_KEY, resonanceById } from "@/lib/celestial/registry";
import { artifactAura, masteredAsset, nightSky, nightSkyTheme, objectFilter, OBJECT_LIGHT } from "./visual";
import type { ResonanceId } from "@/lib/celestial/types";

/** The canonical accessible name: "Celestial Resonance: Mercury, Curious. Tell me more." */
export function useResonanceName(): (id: ResonanceId) => string {
  const { t } = useT();
  return (id: ResonanceId) => {
    const d = resonanceById(id);
    if (!d) return "";
    return t(CELESTIAL_A11Y_KEY, {
      object: t(d.objectNameKey),
      meaning: t(d.meaningKey),
      phrase: t(d.canonicalPhraseKey),
    });
  };
}

interface MarkProps {
  id: ResonanceId;
  /** Rendered size in CSS px. Signal 16–24, Seal 24–36. */
  size?: number;
  /**
   * Decorative marks (one inside a labelled row) pass `decorative` so the row's own text
   * carries the meaning and a screen reader is not told the same thing twice.
   */
  decorative?: boolean;
  className?: string;
  title?: string;
}

function Aperture({ id, size = 20, tier, decorative, className, title }: MarkProps & { tier: "signal" | "seal" }) {
  const d = resonanceById(id);
  const theme = useTheme();
  const name = useResonanceName();
  if (!d) return null;
  const label = title ?? name(id);
  const light = OBJECT_LIGHT[d.objectKey];
  return (
    <span
      className={`sb-celestial-mark relative inline-block shrink-0 align-middle ${className ?? ""}`}
      style={{ width: size, height: size }}
      data-sb-resonance={id}
      data-sb-resonance-tier={tier}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      title={decorative ? undefined : label}
    >
      {/* The aura the object casts, at settled-tier strength — present, never loud. */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: size * 1.9, height: size * 1.9,
          background: artifactAura(d.objectKey, light.intensity * (theme === "light" ? 0.3 : 0.62)),
        }}
      />
      {theme === "light" && light.needsNightSky && (
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: nightSky(), borderRadius: "50%" }} />
      )}
      {/* The transparent optical tier carries the same identity as the larger Field art. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- local static asset, no remote host, no optimizer */}
      <img
        src={masteredAsset(d.objectKey, nightSkyTheme(theme, light.needsNightSky), tier)}
        alt=""
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        loading="lazy"
        className="relative block h-full w-full object-cover"
        style={{
          filter: objectFilter(theme, light.accent, size, false, light.intensity),
        }}
      />
    </span>
  );
}

/**
 * SIGNAL — 16–24px. The cheapest tier: notification rows, dense lists. Static always.
 */
export function ResonanceSignal({ size = 20, ...rest }: MarkProps) {
  return <Aperture {...rest} size={size} tier="signal" />;
}

/**
 * SEAL — 24–36px. The settled record of a commit: Human Pulse chips, Chat history.
 * Static once settled: a Seal never animates in history (Bible Ch. 08, brief §16).
 */
export function ResonanceSeal({ size = 30, ...rest }: MarkProps) {
  return <Aperture {...rest} size={size} tier="seal" />;
}
