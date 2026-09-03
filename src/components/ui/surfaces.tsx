/* eslint-disable @next/next/no-img-element */

/** Layer 1 — solid human-content surface. Posts, text, identity. */
export function Surface({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`material-content rounded-2xl ${className}`}>{children}</div>
  );
}

/** Layer 2 — SYSTEMBOOM floating material. Navigation, menus, transient UI. */
export function GlassSurface({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`material-floating rounded-2xl ${className}`}>{children}</div>
  );
}

/** Floating control — pill-shaped Layer-2 material for docks and toolbars. */
export function FloatingControl({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`material-floating inline-flex items-center gap-1 rounded-full p-1.5 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * MediaSurface — photography-first frame. Media bleeds to the edge;
 * optional caption sits on a scrim, never in a nested card.
 */
export function MediaSurface({
  src,
  alt,
  caption,
  aspect = "16/10",
  className = "",
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  aspect?: string;
  className?: string;
}) {
  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-edge ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,6,10,0.72)] to-transparent px-5 pt-10 pb-4 text-sm text-white">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
