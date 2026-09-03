import { SystemboomLogo } from "@/components/ui/SystemboomLogo";

/** Deterministic star specks for the pre-WebGL state. */
function stars(count: number) {
  let seed = 19911104;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 1.4,
    opacity: 0.2 + rand() * 0.55,
  }));
}

const STARS = stars(70);

/**
 * Lightweight opening state — shown before and while WebGL assembles.
 * Server-renderable so the page is never blank.
 */
export function CosmosLoading({
  progress = 0,
  done = false,
}: {
  progress?: number;
  done?: boolean;
}) {
  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #101a2e 0%, #04070e 60%, #02040a 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#c9d8ea]"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
      <SystemboomLogo height={30} priority />
      <p className="text-xs font-semibold tracking-[0.3em] text-[#8e9bb0] uppercase">
        Cosmos
      </p>
      <div
        className="h-0.5 w-44 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Preparing the Cosmos"
      >
        <div
          className="h-full rounded-full bg-[#d92a20] transition-[width] duration-300"
          style={{ width: `${Math.max(6, progress)}%` }}
        />
      </div>
      <p className="text-sm text-[#8e9bb0]">Entering your universe…</p>
    </div>
  );
}
