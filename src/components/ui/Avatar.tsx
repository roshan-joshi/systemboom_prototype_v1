/* eslint-disable @next/next/no-img-element */

const SIZES = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
  hero: 128,
} as const;

/** "Maya Rai" → "MR"; single names take their first two letters. */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  ring = false,
  presence,
}: {
  /** Curated asset path; omitted → initials on a quiet content surface. */
  src?: string;
  name: string;
  size?: keyof typeof SIZES;
  /** Ice ring — used on identity surfaces. */
  ring?: boolean;
  presence?: "online" | "away" | "offline";
}) {
  const px = SIZES[size];
  const ringClass = ring
    ? "ring-2 ring-[var(--ice)]/60 ring-offset-2 ring-offset-[var(--bg)]"
    : "";
  return (
    <span className="relative inline-block shrink-0" style={{ width: px, height: px }}>
      {src ? (
        <img
          src={src}
          alt={`${name} — avatar`}
          width={px}
          height={px}
          className={`h-full w-full rounded-full object-cover ${ringClass}`}
        />
      ) : (
        <span
          role="img"
          aria-label={`${name} — avatar`}
          className={`flex h-full w-full items-center justify-center rounded-full border border-edge bg-content-raised font-semibold tracking-wide text-text select-none ${ringClass}`}
          style={{ fontSize: Math.round(px * 0.38) }}
        >
          {initialsFor(name)}
        </span>
      )}
      {presence && (
        <span
          aria-label={presence}
          className={`absolute right-0 bottom-0 block rounded-full border-2 border-[var(--bg)] ${
            presence === "online"
              ? "bg-success"
              : presence === "away"
                ? "bg-warning"
                : "bg-muted"
          }`}
          style={{ width: px / 3.6, height: px / 3.6 }}
        />
      )}
    </span>
  );
}
