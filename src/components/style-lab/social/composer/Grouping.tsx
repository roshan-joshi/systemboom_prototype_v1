"use client";
/**
 * MIXED-MEDIA GROUPING — the Composer-local "Organise this post" mode (prototype UX). Media-first group cards on the composer's own
 * surface; tap a photo for Move to… (current groups first · Another type · Start new group · Remove); a group's own menu merges it
 * into another; desktop may also drag a photo onto a group. No navigation, no modal, no record is written here.
 */
import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LABEL } from "./domains";
import type { GroupCategory, GroupView } from "./grouping-model";

export interface GroupMedia {
  id: string;
  src: string;
  alt: string;
  error?: "heic" | "video";
  processing?: boolean;
}

const KIND_GLYPH: Record<GroupCategory, string> = { meal: "🍽", activity: "🏃", moment: "✨", health: "♥", problem: "⚠", project: "◆", meeting: "▣", review: "?" };
const CHIP = "sb-press inline-flex min-h-8 items-center rounded-full px-2.5 text-[12px] font-medium focus-visible:outline-[var(--focus)]";

export function groupLabel(t: (k: string, p?: Record<string, string | number>) => string, kindName: (c: Exclude<GroupCategory, "review">) => string, c: GroupCategory): string {
  return c === "review" ? t("ucomposer.needsReview") : kindName(c);
}

export function Grouping({ groups, pending, media, kindName, onMove, onMoveKind, onNewGroup, onMerge, onRemove, onDone, selected, onSelect }: {
  groups: GroupView[];
  pending: string[];
  media: GroupMedia[];
  kindName: (c: Exclude<GroupCategory, "review">) => string;
  onMove: (mediaId: string, groupId: string) => void;
  onMoveKind: (mediaId: string, c: Exclude<GroupCategory, "review">) => void;
  onNewGroup: (mediaId: string) => void;
  onMerge: (fromId: string, intoId: string) => void;
  onRemove: (mediaId: string) => void;
  onDone: () => void;
  /** Phase A — the ONE selected-media identity shared with the composer; when given, tapping a tile selects it there too */
  selected?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const { t } = useT();
  const [selLocal, setSelLocal] = useState<string | null>(null); // the tapped photo (when no shared selection is given)
  const sel = onSelect ? (selected ?? null) : selLocal;
  const setSel = (next: string | null | ((s: string | null) => string | null)) => {
    const v = typeof next === "function" ? next(sel) : next;
    if (onSelect) onSelect(v);
    else setSelLocal(v);
  };
  const [another, setAnother] = useState(false);
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const byId = (id: string) => media.find((m) => m.id === id);
  const label = (c: GroupCategory) => groupLabel(t, kindName, c);
  const count = (n: number) => (n === 1 ? t("ucomposer.onePhoto") : t("ucomposer.nPhotos", { n }));
  const selGroup = sel ? groups.find((g) => g.mediaIds.includes(sel)) : undefined;
  const pick = (id: string) => {
    setAnother(false);
    setMergeFrom(null);
    setSel((s) => (s === id ? null : id));
  };
  const tile = (id: string) => {
    const m = byId(id);
    if (!m) return null;
    const on = sel === id;
    return (
      <button
        key={id}
        type="button"
        draggable
        onDragStart={(e) => { setDrag(id); e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => setDrag(null)}
        aria-pressed={on}
        aria-label={m.alt}
        onClick={() => pick(id)}
        className={`sb-press relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--sheet-raised)] focus-visible:outline-[var(--focus)] @2xl:w-[88px] ${on ? "ring-2 ring-[var(--boom)]" : ""}`}
        data-sb-group-tile={id}
      >
        {m.error || m.processing ? (
          <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted">{m.processing ? t("ucomposer.processingPhoto") : m.alt}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.src} alt="" className="h-full w-full object-cover" />
        )}
      </button>
    );
  };
  const actions = selGroup && sel && (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]" data-sb-group-actions={sel}>
      <span className="text-muted">{t("ucomposer.moveTo")}</span>
      {groups.map((g) => (
        <button key={g.id} type="button" aria-pressed={g.id === selGroup.id} disabled={g.id === selGroup.id} onClick={() => { onMove(sel, g.id); setSel(null); }} className={`${CHIP} ${g.id === selGroup.id ? "bg-steel/15 text-text" : "border border-[var(--hair)] text-text hover:bg-steel/10"}`} data-sb-group-move={g.id}>
          {label(g.category)}{groups.filter((x) => x.category === g.category).length > 1 ? ` · ${g.mediaIds.length}` : ""}
        </button>
      ))}
      {!another ? (
        <button type="button" onClick={() => setAnother(true)} className={`${CHIP} text-muted hover:text-text`} data-sb-group-another>{t("ucomposer.anotherType")}</button>
      ) : (
        (["meal", "activity", "moment", "health", "problem", "project", "meeting"] as const).filter((c) => !groups.some((g) => g.category === c)).map((c) => (
          <button key={c} type="button" onClick={() => { onMoveKind(sel, c); setSel(null); setAnother(false); }} className={`${CHIP} border border-[var(--hair)] text-text hover:bg-steel/10`} data-sb-group-kind={c}>
            {kindName(c)}
          </button>
        ))
      )}
      {selGroup.mediaIds.length > 1 && (
        <button type="button" onClick={() => { onNewGroup(sel); setSel(null); }} className={`${CHIP} text-muted hover:text-text`} data-sb-group-new>{t("ucomposer.startNewGroup")}</button>
      )}
      <button type="button" onClick={() => { onRemove(sel); setSel(null); }} className={`${CHIP} text-muted hover:text-text`} data-sb-group-remove>{t("composer.removePhoto", { n: media.findIndex((m) => m.id === sel) + 1 })}</button>
    </div>
  );
  return (
    <section className="sb-reveal mt-2 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-3" aria-label={t("ucomposer.organiseTitle")} data-sb-grouping>
      <p className="text-[14px] font-semibold text-text">{t("ucomposer.organiseTitle")}</p>
      <p className="mt-0.5 text-[12px] text-muted">{t("ucomposer.organiseHint")}</p>
      <div className={`mt-3 grid gap-3 ${groups.length === 2 ? "@2xl:grid-cols-2" : ""}`}>
        {groups.map((g) => (
          <div
            key={g.id}
            className={`rounded-[12px] border border-[var(--hair)] bg-[var(--sheet)] p-2.5 ${drag && !g.mediaIds.includes(drag) ? "border-dashed" : ""}`}
            onDragOver={(e) => { if (drag && !g.mediaIds.includes(drag)) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || drag; if (id && !g.mediaIds.includes(id)) onMove(id, g.id); setDrag(null); }}
            data-sb-group={g.id}
            data-sb-group-category={g.category}
            data-sb-group-count={g.mediaIds.length}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-[14px]">{KIND_GLYPH[g.category]}</span>
              <span className={LABEL} data-sb-group-label>{label(g.category)} · {g.mediaIds.length}</span>
              {groups.length > 1 && (
                <span className="relative ml-auto">
                  {mergeFrom === g.id ? (
                    <span className="inline-flex flex-wrap items-center gap-1 text-[12px]" data-sb-group-merge-into>
                      <span className="text-muted">{t("ucomposer.mergeWith")}</span>
                      {groups.filter((x) => x.id !== g.id).map((x) => (
                        <button key={x.id} type="button" onClick={() => { onMerge(g.id, x.id); setMergeFrom(null); }} className={`${CHIP} border border-[var(--hair)] text-text hover:bg-steel/10`} data-sb-group-merge-target={x.id}>
                          {label(x.category)} · {x.mediaIds.length}
                        </button>
                      ))}
                    </span>
                  ) : (
                    <button type="button" onClick={() => { setMergeFrom(g.id); setSel(null); }} className={`${CHIP} text-muted hover:text-text`} data-sb-group-merge={g.id}>{t("ucomposer.mergeWith")}</button>
                  )}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" data-sb-group-tiles={g.id}>{g.mediaIds.map(tile)}</div>
            {selGroup?.id === g.id && actions}
          </div>
        ))}
        {pending.length > 0 && (
          <div className="rounded-[12px] border border-dashed border-[var(--hair)] p-2.5" data-sb-group-pending>
            <span className={LABEL}>{t("ucomposer.stillReading")} · {pending.length}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">{pending.map(tile)}</div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted">{count(media.length)}</p>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onDone} className="sb-press min-h-9 rounded-full bg-[var(--boom-soft)] px-4 text-[13px] font-semibold text-text focus-visible:outline-[var(--focus)]" data-sb-grouping-done>{t("ucomposer.done")}</button>
      </div>
    </section>
  );
}
