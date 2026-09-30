/**
 * MY WORLD — people and conversation. The relationship and chat model for the
 * prototype reference.
 *
 * The live system already has friends, a family tree and a full Chat
 * (`docs/SYSTEMBOOM-HANDOFF-BRIEF.md`): nothing here invents capability — it
 * gives those systems their SYSTEMBOOM presentation and integration seams.
 * Everything is honest in-memory prototype state: actions change real state,
 * nothing pretends to reach a network.
 *
 * Relationship semantics (audit: Friends and Family are distinct in the live
 * product; Family here is the current relationship context, never the Ancestor
 * Tree):
 *   friend        connected
 *   family        family member (implies connected)
 *   request-in    they asked; I can Accept / Decline
 *   request-out   I asked; I can Cancel
 *   none          no relationship; I can Add Friend
 *
 * Messaging is permitted between connected people (friend or family) — a
 * stranger's card offers no Message action. The exact live contract is the
 * backend's; this is the design posture (`people-chat-integration.md`).
 */

import { PEOPLE } from "@/components/style-lab/social/data";

export type Relationship = "friend" | "family" | "request-in" | "request-out" | "none";

/**
 * Social Wall S1 (owner-decided §5.4): MY WORLD holds the owner's own Moments plus the visible
 * Moments of ACCEPTED Friends and Family — never a stranger's or a pending person's. The seeded
 * circle is made coherent with that rule: everyone who authors a Moment in Giulia's feed is
 * connected (Marco shares Luca's birthday and their festivals; Chiara and M were always written
 * as circle people). The relationship-FLOW fixtures move to people who author nothing:
 * Francesca is the single, obvious incoming request; Martina and Alice stay outgoing;
 * Beatrice is the one stranger every Add-friend flow starts from.
 */
export const RELATIONSHIPS: Record<string, Relationship> = {
  [PEOPLE.bikash.id]: "friend",
  [PEOPLE.asha.id]: "friend",
  [PEOPLE.sunita.id]: "family",
  [PEOPLE.krishna.id]: "family",
  [PEOPLE.prakash.id]: "friend",
  [PEOPLE.ramesh.id]: "friend",
  [PEOPLE.m.id]: "friend",
  [PEOPLE.marcus.id]: "friend",
  [PEOPLE.grace.id]: "friend",
  [PEOPLE.theo.id]: "friend",
  [PEOPLE.hannah.id]: "friend",
  [PEOPLE.rory.id]: "request-in",
  [PEOPLE.walt.id]: "none",
  [PEOPLE.nadia.id]: "request-out",
  [PEOPLE.sofia.id]: "request-out",
};

/**
 * Social Wall S1 §5.1–§5.2 — ONE source of relationship truth, DIRECTION-AWARE.
 *
 * The prototype's relationship graph is anchored on the demo owner (Giulia): the map above reads
 * "the anchor's relationship to person X". A pending request is directional, so reading the same
 * edge from the other side inverts it (she asked me ⇄ I asked her). A pair with no anchor in it
 * is honestly UNKNOWN here — the prototype carries no third-party graph — and resolves to "none";
 * the live backend owns the full graph (LIVE CONTRACT, social-api-contract.md §D).
 *
 * Every surface (Hero, PersonCard, People, feed composition, search chips) reads THIS function,
 * so no two surfaces can disagree about the same pair again (the "Friends" here / "Not connected"
 * there contradiction was exactly two surfaces reading the map from different sides).
 */
export const RELATIONSHIP_ANCHOR = PEOPLE.maya.id;

export const invertRel = (r: Relationship): Relationship =>
  r === "request-in" ? "request-out" : r === "request-out" ? "request-in" : r;

export function relationshipBetween(map: Record<string, Relationship>, viewerId: string, otherId: string): Relationship {
  if (viewerId === RELATIONSHIP_ANCHOR) return map[otherId] ?? "none";
  if (otherId === RELATIONSHIP_ANCHOR) return invertRel(map[viewerId] ?? "none");
  return "none";
}

/** The map key a relationship ACTION for (viewer, other) writes — always the non-anchor person. */
export const relationshipKeyFor = (viewerId: string, otherId: string) =>
  viewerId === RELATIONSHIP_ANCHOR ? otherId : viewerId;

/** The acting viewer's own people list — for the anchor, the whole map; for anyone else, the
 *  one edge the prototype truthfully knows (their edge to the anchor). */
export function relationshipEntriesFor(map: Record<string, Relationship>, viewerId: string): [string, Relationship][] {
  if (viewerId === RELATIONSHIP_ANCHOR) return Object.entries(map);
  const own = map[viewerId];
  return own ? [[RELATIONSHIP_ANCHOR, invertRel(own)]] : [];
}

export const connected = (r: Relationship) => r === "friend" || r === "family";

export interface ChatMessage {
  id: string;
  /** "me" or the other person's id. */
  from: string;
  text: string;
  /** HH:MM — chat is conversation first; timestamps stay subordinate. */
  at: string;
  /** Prototype-only: a send that could not complete keeps the text. */
  failed?: boolean;
  /**
   * Stage 23 — Celestial Quick Resonance, ACTOR-AWARE: personId → { resonanceId, at }.
   * A Quick Resonance is performed BY A PERSON, so the person is the key. One active
   * Resonance per person per message; several people may resonate to the same message
   * independently, and one person changing theirs never touches another's.
   * No Life data, no birth data, no age, no location — ever (22-PRIVACY-SECURITY-CONTRACT §2).
   */
  resonances?: Record<string, { resonanceId: string; at: string }>;
}

export interface Conversation {
  personId: string;
  messages: ChatMessage[];
  unread: number;
}

/** Fixture conversations — real prototype people, Devanagari included. */
export const SEED_CONVERSATIONS: Conversation[] = [
  {
    personId: PEOPLE.asha.id,
    unread: 2,
    messages: [
      { id: "c-a1", from: PEOPLE.asha.id, text: "The thermals were unreal this morning. You have to come up before Dashain.", at: "06:41" },
      { id: "c-a2", from: "me", text: "Saw the photo — that ridge line! Which company are you flying with now?", at: "07:02" },
      { id: "c-a3", from: PEOPLE.asha.id, text: "Same one, new wing. Come Saturday, I'll book you a tandem.", at: "07:05" },
      { id: "c-a4", from: PEOPLE.asha.id, text: "शनिबार बिहान ६ बजे साराङकोटमा भेटौं।", at: "07:06" },
    ],
  },
  {
    personId: PEOPLE.bikash.id,
    unread: 0,
    messages: [
      { id: "c-b1", from: "me", text: "Is the khaja set at Nyatapola still the one to beat?", at: "12:31" },
      { id: "c-b2", from: PEOPLE.bikash.id, text: "Still the one. Come before the festival crowds — the square is filling up already.", at: "12:40" },
    ],
  },
  {
    personId: PEOPLE.sunita.id,
    unread: 1,
    messages: [
      { id: "c-s1", from: PEOPLE.sunita.id, text: "I scanned the rest of the wedding prints. Bringing them when we come down for Dashain.", at: "19:12" },
    ],
  },
];
