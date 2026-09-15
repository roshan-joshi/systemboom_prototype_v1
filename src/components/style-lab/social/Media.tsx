"use client";

/**
 * MEDIA — sized to its own aspect ratio inside a maximum height. Never a
 * letterbox, never a crop of a single photo. Portrait photos stand at the
 * gutter at their own width; panoramas run the full column and stay short.
 */

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Media as MediaT, Photo } from "./data";

/** A photo that cannot load keeps its place: same aspect, quiet ground, its own words. */
function SafeImg({ photo }: { photo: Photo }) {
  const { t } = useT();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span role="img" aria-label={photo.alt} className="flex h-full w-full items-center justify-center bg-[var(--sheet-raised)] px-4 text-center text-[12px] leading-[1.5] text-muted" data-sb-media-fallback>
        {photo.alt || t("media.couldNotLoad")}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="block h-full w-full object-cover" />;
}

const MAX_H = 480;

function Frame({ photo, maxH = MAX_H, className = "" }: { photo: Photo; maxH?: number; className?: string }) {
  const ar = photo.w / photo.h;
  return (
    <figure className={`sb-media relative max-w-full overflow-hidden bg-[var(--sheet-raised)] ${className}`} style={{ aspectRatio: `${photo.w} / ${photo.h}`, maxHeight: maxH, width: ar < 1 ? Math.round(maxH * ar) : undefined }}>
      <SafeImg photo={photo} />
    </figure>
  );
}

export function MediaBlock({ media, quiet = false }: { media: MediaT; quiet?: boolean }) {
  const { t, tp } = useT();
  const [expanded, setExpanded] = useState(false);
  const radius = quiet ? "rounded-[4px]" : "@2xl:rounded-[4px]";

  if (media.kind === "photos") {
    const items = media.items;
    if (items.length === 1) return <Frame photo={items[0]} className={radius} />;
    const shown = expanded ? items : items.slice(0, 4);
    const extra = items.length - shown.length;
    return (
      <div className={`overflow-hidden ${radius}`}>
        <div className="grid grid-cols-2 gap-[2px]">
          {shown.map((p, i) => (
            <button
              key={p.src + i}
              type="button"
              onClick={() => !expanded && extra > 0 && i === shown.length - 1 && setExpanded(true)}
              aria-label={extra > 0 && i === shown.length - 1 ? tp("media.showMoreN", extra) : p.alt}
              className="relative block overflow-hidden bg-[var(--sheet-raised)] focus-visible:outline-[var(--focus)]"
              style={{ aspectRatio: `${p.w} / ${p.h}`, maxHeight: 320 }}
            >
              <SafeImg photo={p} />
              {extra > 0 && i === shown.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,20,0.55)] text-[18px] font-semibold text-white tabular-nums">+{extra}</span>
              )}
            </button>
          ))}
        </div>
        {expanded && (
          <button type="button" onClick={() => setExpanded(false)} className="mt-1 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">
            Show fewer
          </button>
        )}
      </div>
    );
  }

  if (media.kind === "video") {
    const p = media.poster;
    const ar = p.w / p.h;
    return (
      <figure className={`sb-media relative max-w-full overflow-hidden bg-[var(--sheet-raised)] ${radius}`} style={{ aspectRatio: `${p.w} / ${p.h}`, maxHeight: MAX_H, width: ar < 1 ? Math.round(MAX_H * ar) : undefined }}>
        <SafeImg photo={p} />
        <button type="button" aria-label={t("media.playVideo", { duration: media.duration })} className="absolute inset-0 flex items-center justify-center focus-visible:outline-[var(--focus)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[rgba(10,13,20,0.35)] text-white">
            <Play size={20} fill="currentColor" strokeWidth={0} className="ml-1" />
          </span>
        </button>
        {media.caption && <span className="absolute bottom-8 left-2 rounded-[3px] bg-[rgba(10,13,20,0.55)] px-1.5 py-0.5 text-[12px] font-medium text-white tabular-nums">{media.caption}</span>}
        <span className="absolute bottom-2 left-2 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">{media.duration}</span>
      </figure>
    );
  }

  // link
  return (
    <a href={media.url} target="_blank" rel="noreferrer" className={`sb-transition flex items-stretch gap-3 border border-[var(--hair)] hover:border-steel/60 focus-visible:outline-[var(--focus)] ${quiet ? "rounded-[4px]" : "rounded-[4px]"} overflow-hidden`}>
      {media.image && (
        <span className="block w-24 shrink-0 overflow-hidden bg-[var(--sheet-raised)] @2xl:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.image.src} alt="" loading="lazy" className="block h-full w-full object-cover" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pr-3">
        <span className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
          {media.host} <ExternalLink size={11} aria-hidden />
        </span>
        <span className="line-clamp-2 text-[14px] leading-[1.35] font-medium text-text">{media.title}</span>
        <span className="line-clamp-2 text-[13px] leading-[1.4] text-muted">{media.description}</span>
      </span>
    </a>
  );
}
