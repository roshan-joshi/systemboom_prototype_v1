/* eslint-disable @next/next/no-img-element */

const SIZES = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
  hero: 128,
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  ring = false,
  presence,
}: {
  src: string;
  name: string;
  size?: keyof typeof SIZES;
  /** Ice ring — used on identity surfaces. */
  ring?: boolean;
  presence?: "online" | "away" | "offline";
}) {
  const px = SIZES[size];
  return (
    <span className="relative inline-block shrink-0" style={{ width: px, height: px }}>
      <img
        src={src}
        alt={`${name} — avatar`}
        width={px}
        height={px}
        className={`h-full w-full rounded-full object-cover ${
          ring ? "ring-2 ring-[var(--ice)]/60 ring-offset-2 ring-offset-[var(--bg)]" : ""
        }`}
      />
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
