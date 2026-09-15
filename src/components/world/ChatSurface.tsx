"use client";

/**
 * FULL CHAT — the conversation surface of My World, at /chat.
 *
 * The live system already has a full Chat (currently a separately hosted app
 * with its own login); this is its SYSTEMBOOM presentation and integration
 * reference, not a rebuilt messenger. Same identity, same theme, same brand:
 * entering Chat from an authenticated World never asks for a second login —
 * the live port owes that boundary a shared session (`people-chat-integration.md`).
 *
 * Desktop: conversation list beside the active conversation. Phone: list, then
 * the conversation full-screen with an obvious way back. Calm, human, no
 * temporal metadata forced into messages.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { PEOPLE } from "@/components/style-lab/social/data";
import { SocialStore, useSocial } from "@/components/style-lab/social/store";
import { WorldShell } from "@/components/shell/WorldShell";
import { ConversationBody } from "./Messages";
import { WorldProvider, useWorld } from "./WorldProvider";

const personOf = (id: string) => Object.values(PEOPLE).find((p) => p.id === id);

export function ChatSurface() {
  return (
    <SocialStore>
      <WorldProvider>
        <Inner />
      </WorldProvider>
    </SocialStore>
  );
}

function Inner() {
  const world = useWorld();
  const { me } = useSocial();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // ?c=<personId> — a person's Message action lands directly in their conversation.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("c");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the deep link
    if (c && personOf(c)) setActive(c);
    setReady(true);
  }, []);

  useEffect(() => {
    if (active) world.dispatch({ type: "read", id: active });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeConv = active ? (world.conversations.find((c) => c.personId === active) ?? { personId: active, messages: [], unread: 0 }) : null;

  return (
    <WorldShell current="chat">
      <main className="mx-auto flex h-[calc(100dvh-57px)] max-w-[1120px] flex-col px-0 sm:px-6 sm:py-6" data-sb-chat-surface>
        <div className="flex min-h-0 flex-1 overflow-hidden bg-[var(--card)] sm:rounded-[20px] sm:border sm:border-[var(--card-edge)] sm:shadow-[var(--card-shadow)]">
          {/* conversation list — the whole screen on phones until one is chosen */}
          <nav aria-label="Conversations" className={`${active ? "hidden lg:flex" : "flex"} w-full flex-col border-[var(--hair)] lg:w-[300px] lg:shrink-0 lg:border-r`} data-sb-chat-list>
            <h1 className="sr-only">Chat — conversations</h1>
            {ready && world.conversations.length === 0 && <p className="px-4 py-4 text-[13px] text-muted">No conversations yet. A friend&apos;s page is where one begins.</p>}
            <ul className="min-h-0 flex-1 overflow-y-auto px-2 pt-3 pb-2">
              {world.conversations.map((c) => {
                const p = personOf(c.personId)!;
                const last = c.messages[c.messages.length - 1];
                const current = active === c.personId;
                return (
                  <li key={c.personId}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => setActive(c.personId)}
                      className={`sb-transition flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)] ${current ? "bg-steel/12" : ""}`}
                      data-sb-chat-pick={c.personId}
                    >
                      <span className="block shrink-0 rounded-full p-[2px]">
                        <PersonIdentity viewer={me} subject={p} size={28} label="" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[14px] leading-tight ${c.unread ? "font-semibold text-text" : "font-medium text-text/90"}`}>{p.name}</span>
                        <span className="block truncate text-[12px] text-muted">{last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "No messages yet"}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {last && <span className="text-[11px] text-muted tabular-nums">{last.at}</span>}
                        {c.unread > 0 && <span aria-label={`${c.unread} unread`} className="h-2 w-2 rounded-full bg-[var(--boom)]" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* the active conversation */}
          {activeConv ? (
            <section aria-label={`Conversation with ${personOf(activeConv.personId)!.name}`} className="flex min-h-0 min-w-0 flex-1 flex-col" data-sb-chat-active={activeConv.personId}>
              <header className="flex items-center gap-2.5 border-b border-[var(--hair)] px-3 py-2">
                <button
                  type="button"
                  aria-label="Back to conversations"
                  onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? router.push("/world") : setActive(null))}
                  className="sb-transition inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)] lg:hidden"
                  data-sb-chat-back
                >
                  <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
                </button>
                <span className="block shrink-0 rounded-full p-[2px]">
                  <PersonIdentity viewer={me} subject={personOf(activeConv.personId)!} size={26} label="" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">{personOf(activeConv.personId)!.name}</span>
              </header>
              <ConversationBody conversation={activeConv} />
            </section>
          ) : (
            <section aria-label="No conversation selected" className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <p className="max-w-[30ch] text-center text-[13px] leading-[1.6] text-muted">Choose a conversation to continue it.</p>
            </section>
          )}
        </div>
      </main>
    </WorldShell>
  );
}
