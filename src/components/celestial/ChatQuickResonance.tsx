"use client";

/**
 * CHAT QUICK RESONANCE — Stage 23, Slice 5.
 *
 * Contract: 22-COMPONENT-ARCHITECTURE.md §7 · 22-DATA-CONTRACT.md §6 (actor-aware).
 *
 * Chat is NOT redesigned. This adds one small affordance to a message bubble and renders the
 * settled result as STATIC Seals — never the Event renderer, never a loop in history.
 *
 * ACTOR-AWARE: the commit is keyed by the acting person, so several people can resonate to the
 * same message independently and one person changing theirs never disturbs another's.
 * The stored entry is {resonanceId, at} and nothing else: no Life data, no birth data, no
 * exact age, no location. It never reads Moment state.
 */

import { useCallback, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useCelestialSurface } from "@/lib/celestial/flags";
import { byCanonicalOrder, resonanceById } from "@/lib/celestial/registry";
import type { ResonanceId } from "@/lib/celestial/types";
import type { ChatMessage } from "@/components/world/model";
import { useWorld } from "@/components/world/WorldProvider";
import { CelestialField } from "./CelestialField";
import { ResonanceSeal, useResonanceName } from "./ResonanceMark";

/** The acting viewer in this prototype's Chat is always "me" (see WorldProvider's `send`). */
const ACTOR = "me";

export function ChatQuickResonance({ personId, message }: { personId: string; message: ChatMessage }) {
  const enabled = useCelestialSurface("chat");
  const { t } = useT();
  const { dispatch } = useWorld();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const name = useResonanceName();

  const mine = (message.resonances?.[ACTOR]?.resonanceId ?? null) as ResonanceId | null;

  const commit = useCallback((id: ResonanceId) => {
    dispatch({ type: "resonate", id: personId, messageId: message.id, personId: ACTOR, resonance: id });
  }, [dispatch, personId, message.id]);

  const remove = useCallback(() => {
    dispatch({ type: "resonate", id: personId, messageId: message.id, personId: ACTOR, resonance: null });
  }, [dispatch, personId, message.id]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  if (!enabled) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-sb-chat-resonate={message.id}
        data-sb-chat-resonate-mine={mine ?? ""}
        aria-expanded={open}
        aria-label={mine ? name(mine) : t("celestial.chat.aria")}
        onClick={() => setOpen((v) => !v)}
        className="sb-transition inline-flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full text-muted opacity-60 hover:bg-steel/15 hover:text-text hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-[var(--focus)]"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
          <path d="M2 13c3.4-3.6 12.6-3.6 16 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="10" cy="7.6" r="2.9" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>
      {open && (
        <div data-sb-chat-resonate-field className="w-full">
          <CelestialField open selected={mine} onCommit={commit} onRemove={remove} onCancel={close} objectSize={44} />
        </div>
      )}
    </>
  );
}

/**
 * The settled record on a message: one static Seal per person who resonated, in canonical
 * order. No animation ever runs in chat history.
 */
export function ChatResonanceSeals({ message }: { message: ChatMessage }) {
  const enabled = useCelestialSurface("chat");
  const name = useResonanceName();
  const entries = Object.entries(message.resonances ?? {});
  if (!enabled || entries.length === 0) return null;
  const sorted = entries
    .filter(([, v]) => resonanceById(v.resonanceId))
    .sort((a, b) => byCanonicalOrder(a[1].resonanceId, b[1].resonanceId));
  if (sorted.length === 0) return null;
  return (
    <span data-sb-chat-seals={sorted.length} className="mt-0.5 inline-flex items-center gap-0.5">
      {sorted.map(([pid, v]) => (
        <ResonanceSeal key={pid} id={v.resonanceId as ResonanceId} size={18} title={name(v.resonanceId as ResonanceId)} />
      ))}
    </span>
  );
}
