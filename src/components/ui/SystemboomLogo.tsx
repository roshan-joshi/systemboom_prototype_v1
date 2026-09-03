import Image from "next/image";

/**
 * Official SYSTEMBOOM logo (references/brand/logo.png — transparent).
 * The chrome wordmark carries its own dark outline, so the same asset
 * reads correctly on Deep Cosmos and Solar Observatory surfaces.
 */
export function SystemboomLogo({
  height = 28,
  priority = false,
  className,
}: {
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round(height * (1219 / 249));
  return (
    <Image
      src="/brand/systemboom-logo.png"
      alt="SYSTEMBOOM"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
