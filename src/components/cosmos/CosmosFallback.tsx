"use client";

import { useState } from "react";
import { PLANETS, PLANET_BY_ID, type PlanetId } from "@/lib/cosmos/planets";
import { CosmosNav } from "./overlays";

const TINTS: Record<PlanetId, [string, string]> = {
  mercury: ["#b5ab9c", "#5c554b"],
  venus: ["#e8cb9c", "#8a6a3e"],
  earth: ["#7fb2e8", "#274c7e"],
  mars: ["#d98a5e", "#7e3f24"],
  jupiter: ["#dcc09a", "#8a6a4a"],
  saturn: ["#e5d2a8", "#93794f"],
  uranus: ["#b2e0e4", "#4d8a92"],
  neptune: ["#7396e0", "#2c4a92"],
};

/**
 * Static Cosmos — shown when WebGL is unavailable (or forced with
 * ?cosmos=fallback). The page stays fully usable and informative.
 */
export function CosmosFallback() {
  const [selected, setSelected] = useState<PlanetId | null>(null);
  const spec = selected ? PLANET_BY_ID[selected] : null;

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{
        background:
          "radial-gradient(130% 100% at 50% -10%, #101c31 0%, #060a14 55%, #030509 100%)",
      }}
    >
      <CosmosNav onSelectPlanet={setSelected} onHome={() => setSelected(null)} />

      <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-8 px-5 pt-24 pb-16">
        {/* Static solar system illustration */}
        <svg
          viewBox="0 0 800 420"
          className="w-full max-w-3xl"
          role="img"
          aria-label="Illustration of the Solar System: eight planets orbiting the Sun"
        >
          <defs>
            <radialGradient id="fsun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff3d0" />
              <stop offset="0.4" stopColor="#ffc76e" />
              <stop offset="0.75" stopColor="#e8862e" stopOpacity="0.65" />
              <stop offset="1" stopColor="#e8862e" stopOpacity="0" />
            </radialGradient>
            {PLANETS.map((p) => (
              <radialGradient key={p.id} id={`fp-${p.id}`} cx="0.35" cy="0.35" r="0.75">
                <stop offset="0" stopColor={TINTS[p.id][0]} />
                <stop offset="1" stopColor={TINTS[p.id][1]} />
              </radialGradient>
            ))}
          </defs>
          {/* orbits */}
          {PLANETS.map((p, i) => (
            <ellipse
              key={`o-${p.id}`}
              cx="400"
              cy="210"
              rx={70 + i * 46}
              ry={(70 + i * 46) * 0.42}
              fill="none"
              stroke="#7e93ae"
              strokeOpacity="0.25"
            />
          ))}
          <circle cx="400" cy="210" r="60" fill="url(#fsun)" />
          <circle cx="400" cy="210" r="22" fill="#ffd9a0" />
          {PLANETS.map((p, i) => {
            const rx = 70 + i * 46;
            const ry = rx * 0.42;
            const a = (p.initialAngleDeg * Math.PI) / 180;
            const x = 400 + Math.cos(a) * rx;
            const y = 210 + Math.sin(a) * ry;
            const r = 4 + p.radius * 4.2;
            return (
              <g key={`p-${p.id}`}>
                <circle cx={x} cy={y} r={r} fill={`url(#fp-${p.id})`} />
                {p.id === "saturn" && (
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={r * 2}
                    ry={r * 0.55}
                    fill="none"
                    stroke="#d8c49a"
                    strokeOpacity="0.7"
                    strokeWidth="1.5"
                    transform={`rotate(-18 ${x} ${y})`}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <p className="max-w-md text-center text-sm leading-relaxed text-[#8e9bb0]">
          The interactive Cosmos needs WebGL, which isn&apos;t available here —
          this is the still view. Everything below remains explorable.
        </p>

        <div className="flex max-w-2xl flex-wrap justify-center gap-2" role="group" aria-label="Planets">
          {PLANETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
              aria-pressed={selected === p.id}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium backdrop-blur-md focus-visible:outline-[#8fc2ff] ${
                selected === p.id
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/10 bg-[rgba(9,14,24,0.52)] text-[#e9eff8] hover:bg-[rgba(22,32,50,0.6)]"
              }`}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: TINTS[p.id][0] }}
              />
              {p.name}
            </button>
          ))}
        </div>

        {spec && (
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[rgba(8,12,21,0.78)] p-6 text-[#e9eff8] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
              {spec.ordinal}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{spec.name}</h2>
            <p className="mt-0.5 text-sm opacity-70">{spec.type}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-90">{spec.fact}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Day", spec.dayLength],
                  ["Moons", String(spec.moons)],
                  ["Distance", spec.distance],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
                  <dt className="text-[11px] tracking-wide uppercase opacity-55">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}
