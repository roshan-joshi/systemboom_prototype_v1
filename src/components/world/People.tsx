"use client";

/**
 * PEOPLE — the discoverable relationship utility of My World.
 *
 * Final Social Connection pass: relationship mechanics already existed
 * (Search's People group, the notification request row, PersonCard's own
 * action set) but nothing put "who are my people, who is requesting, how do
 * I find someone" in one obvious place — a capability reachable only by
 * guessing the right Search interaction is not discoverable. This is a
 * utility beside Search/Messages/Notifications/Account, not a fifth
 * navigation tab, and not a second relationship store: every row here reads
 * and writes the SAME `WorldProvider` relationships map Search, PersonCard
 * and the notification row already use — accepting here is the same accept
 * a notification would dispatch.
 *
 * Deliberately NOT an engagement surface: no suggested people, no "people you
 * may know," no algorithmic ranking, no follower counts. Three sections only
 * — find someone, requests (only while real ones exist), your people.
 *
 * S5/S6 carryover visual correction (owner review of the S4 evidence: "still a
 * contact directory"). Behaviour, data, state machine and every `data-sb-*`
 * contract are unchanged; only the grammar: the FACE + LIFE RING lead every
 * row (40px, 48px for a person asking to connect), the name and life position
 * stand beside them, and the action is the quiet continuation — one red
 * "Add friend" for a stranger, Accept/Decline for a request, a small
 * glyph+word "Message" for your people instead of a pill on every row. The
 * find field is an underline, not a search box; rows are separated by rhythm
 * and a whisper of a rule, not a grid of hairlines.
 */

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Users } from "lucide-react";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { matchPeople, PEOPLE, type Person } from "@/components/style-lab/social/data";
import { useSocial } from "@/components/style-lab/social/store";
import { momentLifeFor } from "@/components/style-lab/social/view-model";
import { now } from "@/lib/clock";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useWorld } from "./WorldProvider";
import type { Relationship } from "./model";

export function PeopleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const world = useWorld();
  const { me } = useSocial();
  const { t, tp } = useT();
  const requests = Object.values(PEOPLE).filter((p) => p.id !== me.id && world.relationshipOf(p.id) === "request-in").length;
  return (
    <button
      type="button"
      aria-label={requests ? tp("people.ariaWithRequests", requests) : t("people.aria")}
      title={t("people.title")}
      aria-expanded={open}
      onClick={onToggle}
      className="sb-transition relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)] @2xl:h-10 @2xl:w-10"
      data-sb-people
    >
      <Users size={17} strokeWidth={1.75} aria-hidden />
      {/* S5 §79 — utility burden: the same incoming request already carries Boom red on the
          bell (it IS a notification). A second red dot for the same fact made three utilities
          compete equally; People's indicator is real, still, and quiet — steel, not boom. */}
      {requests > 0 && <span aria-hidden className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--steel)]" data-sb-people-requests-dot />}
    </button>
  );
}

const primaryPill = "sb-press inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[var(--boom)] px-3.5 text-[12px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)] @2xl:min-h-8 @2xl:px-3";
const quietPill = "sb-press inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-[var(--hair)] px-3.5 text-[12px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)] @2xl:min-h-8 @2xl:px-3";
const quietWord = "sb-press inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium text-muted hover:bg-steel/12 hover:text-text focus-visible:outline-[var(--focus)] @2xl:min-h-8";

/** The one relationship action, restrained: a state resolves in ~200ms, never a bounce/glow. */
function RelationshipAction({ id, rel, onMessage }: { id: string; rel: Relationship; onMessage: (id: string) => void }) {
  const world = useWorld();
  const { t } = useT();
  const key = rel; // remounts the control on every state change — the resolve animation below
  if (rel === "none") {
    return (
      <button type="button" key={key} className={`${primaryPill} [animation:sb-rel-resolve_200ms_ease-out_both]`} onClick={() => world.dispatch({ type: "add", id })} data-sb-people-add>
        {t("rel.addFriend")}
      </button>
    );
  }
  if (rel === "request-out") {
    return (
      <span key={key} className="flex shrink-0 items-center gap-0.5 [animation:sb-rel-resolve_200ms_ease-out_both]">
        <span className="inline-flex min-h-8 items-center px-1.5 text-[12px] text-muted" data-sb-people-requested>{t("rel.requested")}</span>
        <button type="button" className={quietWord} onClick={() => world.dispatch({ type: "cancel", id })} data-sb-people-cancel>
          {t("rel.cancel")}
        </button>
      </span>
    );
  }
  if (rel === "request-in") {
    return (
      <span key={key} className="flex shrink-0 items-center gap-1.5 [animation:sb-rel-resolve_200ms_ease-out_both]">
        <button type="button" className={primaryPill} onClick={() => world.dispatch({ type: "accept", id })} data-sb-people-accept>
          {t("rel.accept")}
        </button>
        <button type="button" className={quietPill} onClick={() => world.dispatch({ type: "decline", id })} data-sb-people-decline>
          {t("rel.decline")}
        </button>
      </span>
    );
  }
  // Friend / family: Message is the natural continuation — obvious (glyph + the word), not a
  // bordered pill repeated down the list like a table column.
  return (
    <button type="button" key={key} className={`${quietWord} [animation:sb-rel-resolve_200ms_ease-out_both]`} onClick={() => onMessage(id)} data-sb-people-message>
      <MessageCircle size={15} strokeWidth={1.75} aria-hidden />
      {t("rel.message")}
    </button>
  );
}

function PersonRow({ person, onOpen, onMessage, tier = "row" }: { person: Person; onOpen: (id: string, opener: HTMLElement) => void; onMessage: (id: string) => void; /** "request": a human asking to connect gets a little more presence than a listed person. */ tier?: "row" | "request" }) {
  const world = useWorld();
  const { me } = useSocial();
  const { t } = useT();
  const rel = world.relationshipOf(person.id);
  const life = momentLifeFor(me, person, now());
  const request = tier === "request";
  const town = person.home ? person.home.split(",")[0] : "";
  return (
    <li>
      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${request ? "py-2.5" : "py-1"}`} data-sb-people-row={person.id} data-sb-people-rel={rel}>
        <button
          type="button"
          onClick={(e) => onOpen(person.id, e.currentTarget)}
          className="sb-transition flex min-w-0 flex-1 items-center gap-3 rounded-[12px] px-1 py-1 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)]"
        >
          <PersonIdentity viewer={me} subject={person} size={request ? 48 : 40} />
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-text ${request ? "text-[15px] font-semibold" : "text-[14px] font-medium"}`}>{person.name}</span>
            <span className="block truncate text-[12px] text-muted tabular-nums">
              {life.exact ?? t("life.circleBand", { band: life.band })}
              {request && town ? ` · ${town}` : ""}
            </span>
          </span>
        </button>
        {/* A request's Accept/Decline drop under the person on a phone (one-handed, nothing
            squeezed beside a 48px face); beside them where there is room. */}
        <span className={request ? "basis-full pl-[64px] @2xl:basis-auto @2xl:pl-0" : ""}>
          <RelationshipAction id={person.id} rel={rel} onMessage={onMessage} />
        </span>
      </div>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="px-1 pb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{title}</p>
      {children}
    </div>
  );
}

/** Rows read by rhythm; the rule between them is the quietest hairline the product has. */
const LIST = "flex flex-col [&>li+li]:border-t [&>li+li]:border-[var(--divider)]";

export function PeoplePanel({ onClose }: { onClose: () => void }) {
  const world = useWorld();
  const { me } = useSocial();
  const { t } = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const others = useMemo(() => Object.values(PEOPLE).filter((p) => p.id !== me.id), [me.id]);
  const found = matchPeople(term, me.id);
  const incoming = others.filter((p) => world.relationshipOf(p.id) === "request-in");
  const outgoing = others.filter((p) => world.relationshipOf(p.id) === "request-out");
  const yourPeople = others.filter((p) => { const r = world.relationshipOf(p.id); return r === "friend" || r === "family"; });

  // S5 §49 return context: the Person surface opens OVER People; the panel stays, so closing
  // the person lands focus back on the row it came from, query and scroll intact.
  const openPerson = useCallback(
    (id: string, opener: HTMLElement) => {
      world.openPerson(id, opener);
    },
    [world],
  );
  const message = useCallback(
    (id: string) => {
      onClose();
      if (window.matchMedia("(min-width: 1024px)").matches) world.dispatch({ type: "openMini", id });
      else router.push(`/chat?c=${id}`);
    },
    [onClose, world, router],
  );

  return (
    <section
      aria-label={t("people.title")}
      className="max-h-[min(calc(100dvh-var(--sb-bar-h,60px)-14px-env(safe-area-inset-bottom,0px)),42rem)] w-full overflow-y-auto overscroll-contain rounded-[20px] border border-[var(--card-edge)] bg-[var(--card)] p-3 shadow-[var(--card-shadow)] @2xl:w-[400px]"
      data-sb-people-panel
    >
      <div className="flex items-baseline justify-between px-1 pb-1">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("people.title")}</h2>
      </div>
      <label className="flex items-center gap-2 border-b border-[var(--hair)] px-1 py-1.5 text-muted focus-within:border-steel">
        <Search size={14} strokeWidth={1.75} aria-hidden />
        <span className="sr-only">{t("people.findSomeone")}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("people.findSomeone")}
          className="w-full bg-transparent text-[14px] text-text outline-none placeholder:text-muted"
          data-sb-people-find
        />
      </label>

      {term ? (
        <Section title={t("people.findSomeone")}>
          {found.length > 0 ? (
            <ul className={LIST}>{found.map((p) => <PersonRow key={p.id} person={p} onOpen={openPerson} onMessage={message} />)}</ul>
          ) : (
            <p className="px-1 py-3 text-[13px] text-muted" data-sb-people-empty-search>{t("people.noMatching")}</p>
          )}
        </Section>
      ) : (
        <>
          {(incoming.length > 0 || outgoing.length > 0) && (
            <Section title={t("people.requests")}>
              <div data-sb-people-requests>
                {/* Self-critique correction: mixing incoming and outgoing in one flat list left
                    direction implied only by which button appeared — a beat of ambiguity before
                    reading it closely. Two named sub-groups remove the guess. */}
                {incoming.length > 0 && (
                  <>
                    <p className="px-1 pb-0.5 text-[12px] text-muted">{t("people.wantsToConnect")}</p>
                    <ul className={LIST}>{incoming.map((p) => <PersonRow key={p.id} person={p} onOpen={openPerson} onMessage={message} tier="request" />)}</ul>
                  </>
                )}
                {outgoing.length > 0 && (
                  <>
                    <p className="px-1 pt-2 pb-0.5 text-[12px] text-muted">{t("people.waitingOnThem")}</p>
                    <ul className={LIST}>{outgoing.map((p) => <PersonRow key={p.id} person={p} onOpen={openPerson} onMessage={message} />)}</ul>
                  </>
                )}
              </div>
            </Section>
          )}
          <Section title={t("people.yourPeople")}>
            {yourPeople.length > 0 ? (
              <ul className={LIST} data-sb-people-yours>{yourPeople.map((p) => <PersonRow key={p.id} person={p} onOpen={openPerson} onMessage={message} />)}</ul>
            ) : (
              <p className="px-1 py-3 text-[13px] text-muted" data-sb-people-empty-yours>{t("people.noConnections")}</p>
            )}
          </Section>
        </>
      )}
    </section>
  );
}
