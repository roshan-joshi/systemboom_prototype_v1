"use client";

/**
 * MY WORLD — the people-and-conversation provider.
 *
 * Owns the relationship states, the conversations, the open person card and
 * the desktop mini chat. Everything is truthful in-memory state: an accepted
 * request becomes a friend everywhere at once (notification, person card,
 * search); a sent message is really in the conversation. Nothing fakes a
 * network and nothing invents a second unread total — message unread lives
 * here, notification unread stays in the Social store.
 */

import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from "react";
import { now } from "@/lib/clock";
import { RELATIONSHIPS, SEED_CONVERSATIONS, connected, type ChatMessage, type Conversation, type Relationship } from "./model";
import { applyChatResonance } from "@/lib/celestial/chat-resonance";

interface WorldState {
  relationships: Record<string, Relationship>;
  conversations: Conversation[];
  /** Desktop mini chat: at most one panel, possibly minimised. */
  mini: { personId: string; minimised: boolean } | null;
}

type Action =
  | { type: "accept"; id: string }
  | { type: "decline"; id: string }
  | { type: "add"; id: string }
  | { type: "cancel"; id: string }
  | { type: "remove"; id: string }
  | { type: "openMini"; id: string }
  | { type: "closeMini" }
  | { type: "minimise"; on: boolean }
  | { type: "read"; id: string }
  | { type: "send"; id: string; text: string }
  /** Stage 23 — one Celestial Quick Resonance per person per message. `personId` is the actor;
   *  `resonance: null` clears only that person's own entry. */
  | { type: "resonate"; id: string; messageId: string; personId: string; resonance: string | null };

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = () => {
  const d = now();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function reduce(s: WorldState, a: Action): WorldState {
  const rel = (id: string, r: Relationship): WorldState => ({ ...s, relationships: { ...s.relationships, [id]: r } });
  switch (a.type) {
    case "accept":
      return rel(a.id, "friend");
    case "decline":
    case "cancel":
    case "remove":
      return rel(a.id, "none");
    case "add":
      return rel(a.id, "request-out");
    case "openMini": {
      // opening a conversation reads it; a person without one starts an honest empty thread
      const exists = s.conversations.some((c) => c.personId === a.id);
      const conversations = exists
        ? s.conversations.map((c) => (c.personId === a.id ? { ...c, unread: 0 } : c))
        : [...s.conversations, { personId: a.id, messages: [], unread: 0 }];
      return { ...s, conversations, mini: { personId: a.id, minimised: false } };
    }
    case "closeMini":
      return { ...s, mini: null };
    case "minimise":
      return s.mini ? { ...s, mini: { ...s.mini, minimised: a.on } } : s;
    case "read":
      return { ...s, conversations: s.conversations.map((c) => (c.personId === a.id ? { ...c, unread: 0 } : c)) };
    case "send": {
      const msg: ChatMessage = { id: `c-new-${Date.now().toString(36)}`, from: "me", text: a.text, at: hhmm() };
      const exists = s.conversations.some((c) => c.personId === a.id);
      const conversations = exists
        ? s.conversations.map((c) => (c.personId === a.id ? { ...c, messages: [...c.messages, msg] } : c))
        : [...s.conversations, { personId: a.id, messages: [msg], unread: 0 }];
      return { ...s, conversations };
    }
    case "resonate": {
      const conversations = s.conversations.map((c) =>
        c.personId !== a.id
          ? c
          : {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== a.messageId) return m;
                // Only this actor's own entry is written or removed — everyone else's stands.
                // The rule is a pure function so it can be proven in isolation.
                return { ...m, resonances: applyChatResonance(m.resonances, a.personId, a.resonance, hhmm()) };
              }),
            },
      );
      return { ...s, conversations };
    }
  }
}

export interface WorldCtx {
  relationships: Record<string, Relationship>;
  conversations: Conversation[];
  mini: WorldState["mini"];
  /** Total unread messages — the messages badge's single source of truth. */
  unreadMessages: number;
  relationshipOf: (id: string) => Relationship;
  canMessage: (id: string) => boolean;
  dispatch: (a: Action) => void;
  /** The open person card. */
  person: string | null;
  openPerson: (id: string, opener?: HTMLElement | null) => void;
  closePerson: () => void;
  personOpener: HTMLElement | null;
}

const Ctx = createContext<WorldCtx | null>(null);

export function WorldProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, () => ({
    relationships: { ...RELATIONSHIPS },
    conversations: SEED_CONVERSATIONS.map((c) => ({ ...c, messages: [...c.messages] })),
    mini: null,
  }));
  const [person, setPerson] = useState<string | null>(null);
  const [personOpener, setPersonOpener] = useState<HTMLElement | null>(null);

  const relationshipOf = useCallback((id: string) => state.relationships[id] ?? "none", [state.relationships]);
  const canMessage = useCallback((id: string) => connected(state.relationships[id] ?? "none"), [state.relationships]);
  const openPerson = useCallback((id: string, opener?: HTMLElement | null) => {
    setPerson(id);
    setPersonOpener(opener ?? null);
  }, []);
  const closePerson = useCallback(() => {
    setPerson(null);
    personOpener?.focus?.();
    setPersonOpener(null);
  }, [personOpener]);

  const value = useMemo<WorldCtx>(
    () => ({
      relationships: state.relationships,
      conversations: state.conversations,
      mini: state.mini,
      unreadMessages: state.conversations.reduce((n, c) => n + c.unread, 0),
      relationshipOf,
      canMessage,
      dispatch,
      person,
      openPerson,
      closePerson,
      personOpener,
    }),
    [state, relationshipOf, canMessage, person, openPerson, closePerson, personOpener],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorld(): WorldCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorld outside <WorldProvider>");
  return c;
}

/** Some accepted surfaces render with or without the provider (dev harness). */
export function useWorldMaybe(): WorldCtx | null {
  return useContext(Ctx);
}
