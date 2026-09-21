"use client";

/**
 * MESSAGES — the conversation utility of My World.
 *
 * Three pieces, one truthful store:
 *   MessagesButton  the quiet utility control with the message-unread dot
 *   MessagesPanel   recent conversations; choosing one opens the desktop mini
 *                   chat, or the full Chat conversation on smaller screens
 *   MiniChat        the single desktop dock — chat while the World continues.
 *                   At most one panel; never over the 360 feed.
 *
 * Chat is conversation first: names, words, small times. No life coordinates,
 * no telemetry, no Circle graphics inside a conversation.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, Minus, SendHorizontal, X } from "lucide-react";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { PEOPLE } from "@/components/style-lab/social/data";
import { useSocial } from "@/components/style-lab/social/store";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useWorld } from "./WorldProvider";
import { ChatQuickResonance, ChatResonanceSeals } from "@/components/celestial/ChatQuickResonance";
import type { Conversation } from "./model";

const personOf = (id: string) => Object.values(PEOPLE).find((p) => p.id === id)!;

export function MessagesButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const world = useWorld();
  const { t } = useT();
  const n = world.unreadMessages;
  return (
    <button
      type="button"
      aria-label={n ? t("chat.messagesUnreadAria", { n }) : t("chat.title")}
      aria-expanded={open}
      onClick={onToggle}
      className="sb-transition relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)] @2xl:h-10 @2xl:w-10"
      data-sb-messages
    >
      <MessageCircle size={17} strokeWidth={1.75} aria-hidden />
      {n > 0 && <span aria-hidden className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--boom)]" data-sb-messages-unread />}
    </button>
  );
}

/**
 * S5/S6: the Messages utility joins the one transient-surface family (placed by the surface
 * around it, so the section carries only its own width) and its utility text routes through
 * the S1 catalog — en byte-identical. Conversation internals (ConversationBody, MiniChat, the
 * full Chat) are untouched: Chat is not redesigned here.
 */
export function MessagesPanel({ onClose }: { onClose: () => void }) {
  const world = useWorld();
  const { me } = useSocial();
  const { t, tp } = useT();
  const router = useRouter();
  const open = useCallback(
    (id: string) => {
      onClose();
      if (window.matchMedia("(min-width: 1024px)").matches) world.dispatch({ type: "openMini", id });
      else router.push(`/chat?c=${id}`);
    },
    [onClose, world, router],
  );
  return (
    <section aria-label={t("chat.title")} className="max-h-[min(calc(100dvh-var(--sb-bar-h,60px)-14px-env(safe-area-inset-bottom,0px)),42rem)] w-full overflow-y-auto overscroll-contain rounded-[20px] border border-[var(--card-edge)] bg-[var(--card)] p-3 shadow-[var(--card-shadow)] @2xl:w-[360px]" data-sb-messages-panel>
      <div className="flex items-baseline justify-between px-2 pb-2">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("chat.title")}</h2>
        <Link href="/chat" onClick={onClose} className="rounded-full text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-open-chat>
          {t("chat.openChat")}
        </Link>
      </div>
      {world.conversations.length === 0 ? (
        <p className="px-2 pb-2 text-[13px] text-muted">{t("chat.noConversations")}</p>
      ) : (
        <ul className="flex flex-col">
          {world.conversations.map((c) => {
            const p = personOf(c.personId);
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.personId}>
                <button type="button" onClick={() => open(c.personId)} className="sb-transition sb-press flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-conversation={c.personId}>
                  <span className="block shrink-0 rounded-full p-[2px]">
                    <PersonIdentity viewer={me} subject={p} size={28} label="" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[14px] leading-tight ${c.unread ? "font-semibold text-text" : "font-medium text-text/90"}`}>{p.name}</span>
                    <span className="block truncate text-[12px] text-muted">{last ? `${last.from === "me" ? t("chat.you") : ""}${last.text}` : t("chat.noMessagesYet")}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {last && <span className="text-[11px] text-muted tabular-nums">{last.at}</span>}
                    {c.unread > 0 && <span aria-label={tp("chat.unreadN", c.unread)} className="h-2 w-2 rounded-full bg-[var(--boom)]" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The message list + input, shared by the mini chat and the full Chat. */
export function ConversationBody({ conversation, compact = false }: { conversation: Conversation; compact?: boolean }) {
  const world = useWorld();
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const p = personOf(conversation.personId);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [conversation.messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    world.dispatch({ type: "send", id: conversation.personId, text: t });
    setText("");
  };

  return (
    <>
      <div ref={listRef} role="log" aria-label={`Conversation with ${p.name}`} className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 ${compact ? "py-2" : "py-3"}`} data-sb-chat-log>
        {conversation.messages.length === 0 && <p className="py-6 text-center text-[13px] text-muted">No messages in this conversation yet.</p>}
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex flex-wrap items-end gap-1 ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-[14px] px-3 py-1.5 text-[14px] leading-[1.45] ${m.from === "me" ? "rounded-br-[4px] bg-steel/20 text-text" : "rounded-bl-[4px] bg-steel/10 text-text"}`} data-sb-chat-msg={m.from === "me" ? "me" : "them"}>
              <span className="break-words whitespace-pre-line">{m.text}</span>
              <span className="ml-2 align-baseline text-[10px] text-muted tabular-nums">{m.at}</span>
              <ChatResonanceSeals message={m} />
            </div>
            <ChatQuickResonance personId={conversation.personId} message={m} />
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-[var(--hair)] px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${p.name.split(" ")[0]}…`}
          aria-label={`Message ${p.name}`}
          className="min-w-0 flex-1 rounded-full border border-[var(--hair)] bg-[var(--sheet-raised,var(--content))] px-3 py-1.5 text-[14px] text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          data-sb-chat-input
        />
        <button type="submit" aria-label="Send" className="sb-transition inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-chat-send>
          <SendHorizontal size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </form>
    </>
  );
}

/** The one desktop dock. Hidden below 1024px — phones use the full Chat. */
export function MiniChat() {
  const world = useWorld();
  const { me } = useSocial();
  const ref = useRef<HTMLElement>(null);
  const mini = world.mini;

  useEffect(() => {
    if (mini && !mini.minimised) ref.current?.querySelector<HTMLElement>("[data-sb-chat-input]")?.focus();
  }, [mini?.personId, mini?.minimised]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mini) return null;
  const p = personOf(mini.personId);
  const conversation = world.conversations.find((c) => c.personId === mini.personId) ?? { personId: mini.personId, messages: [], unread: 0 };
  const close = () => {
    world.dispatch({ type: "closeMini" });
    document.querySelector<HTMLElement>("[data-sb-messages]")?.focus();
  };

  return (
    <section
      ref={ref}
      aria-label={`Chat with ${p.name}`}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-40 hidden w-[320px] flex-col overflow-hidden rounded-[16px] border border-[var(--card-edge)] bg-[var(--sheet-raised,var(--content))] shadow-[0_18px_48px_-18px_rgba(0,0,0,.5)] lg:flex"
      style={{ height: mini.minimised ? "auto" : 400 }}
      data-sb-mini-chat={mini.personId}
      data-sb-mini-minimised={mini.minimised ? "" : undefined}
    >
      <header className="flex items-center gap-2.5 border-b border-[var(--hair)] px-3 py-2">
        <span className="block shrink-0 rounded-full p-[2px]">
          <PersonIdentity viewer={me} subject={p} size={24} label="" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text">{p.name}</span>
        <Link href={`/chat?c=${mini.personId}`} aria-label="Open in Chat" title="Open in Chat" className="sb-transition inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-mini-expand>
          <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
        </Link>
        <button type="button" aria-label={mini.minimised ? "Restore" : "Minimise"} onClick={() => world.dispatch({ type: "minimise", on: !mini.minimised })} className="sb-transition inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-mini-minimise>
          <Minus size={14} strokeWidth={1.75} aria-hidden />
        </button>
        <button type="button" aria-label="Close chat" onClick={close} className="sb-transition inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-mini-close>
          <X size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </header>
      {!mini.minimised && <ConversationBody conversation={conversation} compact />}
    </section>
  );
}
