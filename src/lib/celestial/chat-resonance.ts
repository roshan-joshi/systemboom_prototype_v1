/**
 * CELESTIAL RESONANCE — the Chat Quick Resonance rule, as a pure function.
 *
 * Contract: 22-DATA-CONTRACT.md §6. Extracted from the reducer so the invariants can be
 * proven directly rather than inferred from the UI:
 *
 *   · ONE active Resonance per person per message.
 *   · Changing it replaces only THAT person's entry.
 *   · Several people may resonate to the same message independently.
 *   · The stored entry is {resonanceId, at} — no Life data, no birth data, no age, no
 *     location — and nothing here reads Moment state.
 */

/**
 * Stored loosely (`resonanceId: string`) so `world/model.ts` stays decoupled from the
 * Celestial types. The registry is the gate: an id it does not know is never rendered.
 */
export interface StoredChatResonance {
  resonanceId: string;
  at: string;
}

export type ChatResonanceMap = Record<string, StoredChatResonance>;

export function applyChatResonance(
  current: ChatResonanceMap | undefined,
  personId: string,
  resonanceId: string | null,
  at: string,
): ChatResonanceMap | undefined {
  const next: ChatResonanceMap = { ...(current ?? {}) };
  if (resonanceId) next[personId] = { resonanceId, at };
  else delete next[personId];
  return Object.keys(next).length ? next : undefined;
}
