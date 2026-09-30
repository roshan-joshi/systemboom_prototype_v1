"use client";

/**
 * In-memory mock state for the Social preview. React state only — nothing is
 * persisted, nothing leaks to localStorage. Reset restores the seed.
 */

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import { now } from "@/lib/clock";
import { canSeeMoment, connectedRel, type ViewerRelationship } from "./view-model";
import type { UDraft } from "./composer/types";
import {
  PEOPLE,
  synthPerson,
  unavailablePerson,
  SEED_MOMENTS,
  SEED_NOTIFICATIONS,
  type Moment,
  type Note,
  type Notification,
  type Person,
  type Privacy,
} from "./data";

export type ViewerMode = "maya" | "asha" | "visitor" | "ashaVisitor" | "prakashVisitor";


interface State {
  viewer: ViewerMode;
  /** S1 §5.5 — whose World the page shows. null = the acting viewer's own; a person id = THAT
   *  person's World (their Moments only, filtered through the access seam). */
  profileId: string | null;
  moments: Moment[];
  notifications: Notification[];
  visible: number;
  hidden: string[];
  /** S5 — the viewer's private bookmarks. Ids only, never counts, never anyone else's. */
  saved: string[];
  simulateFailure: boolean;
  /** Universal Composer §27 — the kept draft (in-memory autosave). Nothing exists until POST. */
  udraft: UDraft | null;
  /** The moment id that just landed on the rule — drives the one orchestrated motion. */
  justPosted: string | null;
  seedVersion: number;
}

type Action =
  | { type: "reset" }
  | { type: "viewer"; viewer: ViewerMode }
  /** S1 §5.5 / §7.4 — open a person's World (null returns to the viewer's own). */
  | { type: "openWorld"; id: string | null }
  /** S5 — private Save (a bookmark): the viewer's own list, no counts, no social surface. */
  | { type: "save"; id: string }
  | { type: "unsave"; id: string }
  /** Universal Composer §27/§36 — keep/clear the composer draft; stop/again sharing a projection. */
  | { type: "udraft"; draft: UDraft | null }
  | { type: "shareState"; id: string; shared: boolean }
  | { type: "post"; moment: Moment }
  | { type: "edit"; id: string; patch: Partial<Moment> }
  | { type: "delete"; id: string }
  | { type: "privacy"; id: string; privacy: Privacy }
  | { type: "respond"; id: string }
  /** R2 — set / replace / remove the acting viewer's single Expression on a Moment. */
  | { type: "express"; id: string; expression: string | null }
  /** Stage 23 — set / replace / remove the acting viewer's single Celestial Resonance.
   *  Independent of `express` in both directions: neither reducer reads the other's field. */
  | { type: "resonate"; id: string; resonance: string | null }
  // R3.3 harness-only (§31): the review route seeds Human Pulse scale fixtures with it
  | { type: "pulse-sim"; id: string; expressions: Record<string, string> }
  /** Celestial Social Universe — harness-only: seed one Moment's multi-person Resonance map
   *  (`?resonance=` on the style-lab route, never the product route). Sibling of pulse-sim. */
  | { type: "resonance-sim"; id: string; resonances: Record<string, string> }
  /** Celestial Social Universe — harness-only: ONE more person's Resonance arrives live, so
   *  the quiet arrival motion is demonstrable. Never the acting viewer; one entry per person. */
  | { type: "resonance-arrive"; id: string; personId: string; resonance: string }
  | { type: "hide"; id: string }
  | { type: "note"; momentId: string; note: Note }
  | { type: "noteEdit"; momentId: string; noteId: string; text: string }
  /** S2 §6.1 — set / replace / remove the acting viewer's single Boom on a Response. */
  | { type: "noteExpress"; momentId: string; noteId: string; expression: string | null }
  | { type: "noteDelete"; momentId: string; noteId: string }
  | { type: "noteRespond"; momentId: string; noteId: string }
  | { type: "loadMore" }
  /** S5 — make sure a Moment a Search result / Notification points at is loaded (UI window only; no data changes). */
  | { type: "reveal"; id: string }
  | { type: "readAll" }
  | { type: "read"; id: string }
  | { type: "simulateFailure"; on: boolean }
  | { type: "landed" }
  | { type: "notifications"; mode: "seed" | "many" | "empty" | "celestial" };

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function seed(viewer: ViewerMode = "maya", seedVersion = 0): State {
  return {
    viewer,
    profileId: null,
    moments: clone(SEED_MOMENTS),
    notifications: clone(SEED_NOTIFICATIONS),
    visible: 8,
    hidden: [],
    simulateFailure: false,
    justPosted: null,
    udraft: null,
    saved: [],
    seedVersion,
  };
}

export function viewerPerson(mode: ViewerMode): Person {
  return mode === "asha" ? PEOPLE.asha : PEOPLE.maya;
}
/** Whose profile is on the page: the viewer's own, or Giulia's (`maya`, u-demo-001) when visiting. */
export function profilePerson(mode: ViewerMode): Person {
  return mode === "asha" ? PEOPLE.asha : PEOPLE.maya;
}

/**
 * The ledger is chronology: the moment's OWN date/time, newest first.
 *
 * S1 note: this is the SAFETY-FLOOR ordering the reducer's window math (post / reveal) uses —
 * it hides only what is never visible to anyone but its author (only-me). The rendered feed is
 * `composeFeed` below (a subset), so an index computed here is an upper bound: the window may
 * open a little wider than strictly needed, never narrower.
 */
export function orderFeed(moments: Moment[], hidden: string[], meId: string): Moment[] {
  const key = (m: Moment) => new Date(m.at).getTime();
  return moments
    .filter((m) => !hidden.includes(m.id))
    .filter((m) => m.privacy !== "onlyme" || m.authorId === meId)
    .sort((a, b) => key(b) - key(a));
}

/**
 * S1 — WORLD COMPOSITION through the one access seam (owner-decided §5.3–§5.5).
 *
 * MY WORLD (profileId === viewerId): the viewer's own Moments plus the visible Moments of
 * ACCEPTED Friends / Family. A stranger's or a pending person's Moment never auto-populates it.
 *
 * ANOTHER PERSON'S WORLD (profileId !== viewerId — a visitor mode, an opened World, or the
 * View-as-public stand-in): THAT PERSON's Moments only, filtered by the viewer's real access —
 * never a mixed feed of the subject's friends.
 *
 * No trending, no ranking: chronology is the only order.
 */
export function composeFeed(
  moments: Moment[],
  hidden: string[],
  viewerId: string,
  profileId: string,
  relTo: (otherId: string) => ViewerRelationship,
): Moment[] {
  const key = (m: Moment) => new Date(m.at).getTime();
  const mine = profileId === viewerId;
  return moments
    // Universal Composer §36 — an unshared post's Social projection is gone from the stream;
    // the Human Record itself stays in Life/Circle (which do not read this composition).
    .filter((m) => !hidden.includes(m.id) && !m.unshared)
    .filter((m) => {
      if (!mine) return m.authorId === profileId && canSeeMoment(m, viewerId, relTo(profileId));
      if (m.authorId === viewerId) return true;
      const rel = relTo(m.authorId);
      return connectedRel(rel) && canSeeMoment(m, viewerId, rel);
    })
    .sort((a, b) => key(b) - key(a));
}
export function actingPerson(mode: ViewerMode): Person {
  if (mode === "visitor") return PEOPLE.bikash;
  if (mode === "ashaVisitor") return PEOPLE.asha;
  // Test-only third visitor: Chiara viewing Giulia. (Since S1 she is a FRIEND — the request-in
  // Hero surface is exercised the semantically correct way instead: the owner opens the
  // requester's World. This mode also lets Chiara act as herself, e.g. editing her own Moment.)
  if (mode === "prakashVisitor") return PEOPLE.prakash;
  return viewerPerson(mode);
}

function reduce(s: State, a: Action): State {
  const editMoment = (id: string, f: (m: Moment) => Moment) => ({ ...s, moments: s.moments.map((m) => (m.id === id ? f(m) : m)) });
  switch (a.type) {
    case "reset":
      return seed(s.viewer, s.seedVersion + 1);
    case "viewer":
      return { ...seed(a.viewer, s.seedVersion + 1) };
    case "openWorld":
      return { ...s, profileId: a.id };
    case "post": {
      // The new moment lands at its chronological position; make sure that position is loaded.
      const moments = [a.moment, ...s.moments];
      const index = orderFeed(moments, s.hidden, actingPerson(s.viewer).id).findIndex((m) => m.id === a.moment.id);
      return { ...s, moments, justPosted: a.moment.id, visible: Math.max(s.visible + 1, index + 1), udraft: null };
    }
    case "edit":
      return editMoment(a.id, (m) => ({ ...m, ...a.patch, edited: true }));
    case "delete":
      // S5 — a deleted Moment leaves no ghost bookmark.
      return { ...s, moments: s.moments.filter((m) => m.id !== a.id), saved: s.saved.filter((x) => x !== a.id) };
    case "privacy":
      return editMoment(a.id, (m) => ({ ...m, privacy: a.privacy }));
    case "respond": {
      const me = actingPerson(s.viewer).id;
      return editMoment(a.id, (m) => {
        const on = !m.respondedByViewer;
        return {
          ...m,
          respondedByViewer: on,
          responses: m.responses + (on ? 1 : -1),
          responders: on ? [me, ...m.responders.filter((r) => r !== me)] : m.responders.filter((r) => r !== me),
        };
      });
    }
    case "pulse-sim":
      // harness fixture: replace one Moment's expression map wholesale (review route only)
      return { ...s, moments: s.moments.map((m) => (m.id === a.id ? { ...m, expressions: a.expressions } : m)) };
    case "resonance-sim":
      // harness fixture: replace one Moment's Resonance map wholesale (review route only).
      // `m.expressions` is untouched: the two families never cross-write.
      return { ...s, moments: s.moments.map((m) => (m.id === a.id ? { ...m, resonances: a.resonances } : m)) };
    case "resonance-arrive":
      // harness fixture: one more person's single Resonance lands (review route only)
      return editMoment(a.id, (m) => ({ ...m, resonances: { ...(m.resonances ?? {}), [a.personId]: a.resonance } }));
    case "express": {
      const meId = actingPerson(s.viewer).id;
      return editMoment(a.id, (m) => {
        const expressions = { ...(m.expressions ?? {}) };
        if (a.expression) expressions[meId] = a.expression; // replace = the invariant: one per viewer
        else delete expressions[meId];
        return { ...m, expressions: Object.keys(expressions).length ? expressions : undefined };
      });
    }
    case "resonate": {
      const meId = actingPerson(s.viewer).id;
      return editMoment(a.id, (m) => {
        const resonances = { ...(m.resonances ?? {}) };
        if (a.resonance) resonances[meId] = a.resonance; // replace = one Celestial per viewer
        else delete resonances[meId];
        // `m.expressions` is spread through untouched: a Celestial change never edits Boom.
        return { ...m, resonances: Object.keys(resonances).length ? resonances : undefined };
      });
    }
    case "hide":
      return { ...s, hidden: [...s.hidden, a.id] };
    case "save":
      return s.saved.includes(a.id) ? s : { ...s, saved: [...s.saved, a.id] };
    case "unsave":
      return { ...s, saved: s.saved.filter((x) => x !== a.id) };
    case "udraft":
      return { ...s, udraft: a.draft };
    case "shareState":
      // §36 — stop sharing removes the Social projection only; the Human Record stays.
      return { ...s, moments: s.moments.map((m) => (m.id === a.id ? { ...m, unshared: a.shared ? undefined : (true as const) } : m)) };
    case "note":
      return editMoment(a.momentId, (m) => ({ ...m, notes: [...m.notes, a.note] }));
    case "noteEdit":
      return editMoment(a.momentId, (m) => ({ ...m, notes: m.notes.map((x) => (x.id === a.noteId ? { ...x, text: a.text, edited: true } : x)) }));
    case "noteExpress": {
      const meId = actingPerson(s.viewer).id;
      return editMoment(a.momentId, (m) => ({
        ...m,
        notes: m.notes.map((x) => {
          if (x.id !== a.noteId) return x;
          const expressions = { ...(x.expressions ?? {}) };
          if (a.expression) expressions[meId] = a.expression; // replace = one per person
          else delete expressions[meId];
          return { ...x, expressions: Object.keys(expressions).length ? expressions : undefined };
        }),
      }));
    }
    case "noteDelete":
      // S2 §6.4 — deleting a response with replies never deletes the conversation under it: the
      // response becomes a tombstone (content CLEARED, not hidden) and the replies stand. A
      // childless response simply goes; removing the last reply lets its tombstone go too.
      return editMoment(a.momentId, (m) => {
        const hasChildren = m.notes.some((x) => x.parentId === a.noteId && x.id !== a.noteId);
        let notes = hasChildren
          ? m.notes.map((x) => (x.id === a.noteId ? { id: x.id, authorId: x.authorId, text: "", at: x.at, parentId: x.parentId, responses: 0, removed: true as const } : x))
          : m.notes.filter((x) => x.id !== a.noteId);
        notes = notes.filter((x) => !x.removed || notes.some((c) => c.parentId === x.id));
        return { ...m, notes };
      });
    case "noteRespond":
      return editMoment(a.momentId, (m) => ({
        ...m,
        notes: m.notes.map((x) => (x.id === a.noteId ? { ...x, respondedByViewer: !x.respondedByViewer, responses: x.responses + (x.respondedByViewer ? -1 : 1) } : x)),
      }));
    case "loadMore":
      return { ...s, visible: s.visible + 8 };
    case "reveal": {
      // The same rule "post" uses to land a new Moment at its chronological position: widen the
      // visible window just far enough. Nothing about the Moments themselves changes.
      const index = orderFeed(s.moments, s.hidden, actingPerson(s.viewer).id).findIndex((m) => m.id === a.id);
      return index >= s.visible ? { ...s, visible: index + 1 } : s;
    }
    case "readAll":
      return { ...s, notifications: s.notifications.map((x) => ({ ...x, unread: false })) };
    case "read":
      return { ...s, notifications: s.notifications.map((x) => (x.id === a.id ? { ...x, unread: false } : x)) };
    case "simulateFailure":
      return { ...s, simulateFailure: a.on };
    case "landed":
      return { ...s, justPosted: null };
    case "notifications": {
      if (a.mode === "empty") return { ...s, notifications: [] };
      if (a.mode === "seed") return { ...s, notifications: clone(SEED_NOTIFICATIONS) };
      if (a.mode === "celestial") {
        // Harness-only (like "many"): every notification in this prototype is a fixture — none
        // are generated at runtime — so the Celestial Signal row is exercised the same way.
        const base = SEED_NOTIFICATIONS[0];
        const rows: Notification[] = [
          { ...base, id: "n-cel-1", kind: "resonance", resonanceId: "saturn-support", text: "resonated with your moment", unread: true },
          { ...base, id: "n-cel-2", kind: "resonance", resonanceId: "mercury-curious", text: "resonated with your moment", unread: false },
        ];
        return { ...s, notifications: [...rows, ...clone(SEED_NOTIFICATIONS)] };
      }
      const many: Notification[] = [];
      for (let i = 0; i < 26; i++) {
        const base = SEED_NOTIFICATIONS[i % SEED_NOTIFICATIONS.length];
        const d = new Date(base.at);
        d.setDate(d.getDate() - Math.floor(i / 4));
        many.push({ ...base, id: `${base.id}-${i}`, at: localISO(d), unread: i < 6 });
      }
      return { ...s, notifications: many };
    }
  }
}

interface Ctx {
  state: State;
  dispatch: (a: Action) => void;
  me: Person;
  profile: Person;
  isOwnerView: boolean;
  /** Phase 4.4-A — true inside <PreviewScope>: the owner is looking at their World as the
   *  public would. Render-time only; nothing written while previewing ever reaches the state. */
  previewing: boolean;
  /** Feed in display order — composed through the S1 access seam wherever <AudienceScope> is
   *  mounted (the Social page always mounts it); the bare store falls back to the safety floor. */
  feed: Moment[];
  total: number;
  /** S1 §5.8 — may the acting viewer see this Moment at all (Search, notification landing, any
   *  direct route)? The bare store answers with the safety floor; <AudienceScope> answers with
   *  the real relationship matrix. */
  canSee: (m: Moment) => boolean;
  personOf: (id: string) => Person;
  newId: () => string;
}

const StoreContext = createContext<Ctx | null>(null);

export function SocialStore({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, () => seed());
  const me = actingPerson(state.viewer);
  // S1 §5.5 — an opened World takes precedence over the mode's default profile. An id that
  // resolves to nobody falls back to the viewer's own World rather than a broken page.
  const openedProfile = state.profileId ? Object.values(PEOPLE).find((p) => p.id === state.profileId) : undefined;
  const profile = openedProfile ?? profilePerson(state.viewer);
  // Final Social Connection pass: derived from identity, not an enumerated list of visitor
  // modes — correct automatically for any future viewer mode (e.g. `prakashVisitor`, added to
  // exercise the seeded request-in relationship) without needing this line updated again.
  const isOwnerView = me.id === profile.id;
    // `sim-` ids exist only when the review harness seeds a Human Pulse scale fixture; they
  // resolve to deterministic fictional people so who-expressed stays a real human surface.
  // Phase 4.4-A (A12): an id that resolves to nobody is shown as unavailable — never silently as
  // another real person (it used to fall back to the fixture person "M").
  const personOf = useCallback((id: string) => Object.values(PEOPLE).find((p) => p.id === id) ?? (id.startsWith("sim-") ? synthPerson(id) : unavailablePerson(id)), []);
  const newId = useCallback(() => `m-new-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`, []);

  const ordered = useMemo(() => orderFeed(state.moments, state.hidden, me.id), [state.moments, state.hidden, me.id]);
  // Safety floor only — <AudienceScope> (mounted by the Social page under <WorldProvider>)
  // replaces this with the real relationship matrix.
  const canSee = useCallback((m: Moment) => m.authorId === me.id || m.privacy !== "onlyme", [me.id]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch,
      me,
      profile,
      isOwnerView,
      previewing: false,
      feed: ordered.slice(0, state.visible),
      total: ordered.length,
      canSee,
      personOf,
      newId,
    }),
    [state, me, profile, isOwnerView, ordered, canSee, personOf, newId],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * S1 — THE AUDIENCE SCOPE. Mounted once by the Social page, under <WorldProvider>, so the feed
 * every surface reads is composed through the one access seam with the LIVE relationship state
 * (accepting a request adds that person's visible Moments to My World at once; removing a friend
 * withdraws theirs). `relTo` is the direction-aware relationship truth for the acting viewer.
 */
export function AudienceScope({ relTo, children }: { relTo: (otherId: string) => ViewerRelationship; children: ReactNode }) {
  const c = useContext(StoreContext);
  if (!c) throw new Error("AudienceScope outside <SocialStore>");
  const { state, me, profile } = c;
  const composed = useMemo(
    () => composeFeed(state.moments, state.hidden, me.id, profile.id, relTo),
    [state.moments, state.hidden, me.id, profile.id, relTo],
  );
  const canSee = useCallback(
    (m: Moment) => canSeeMoment(m, me.id, m.authorId === me.id ? "self" : relTo(m.authorId)),
    [me.id, relTo],
  );
  const value = useMemo<Ctx>(
    () => ({ ...c, feed: composed.slice(0, state.visible), total: composed.length, canSee }),
    [c, composed, state.visible, canSee],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * Phase 4.4-A — VIEW AS PUBLIC, part 1 (P0-3; the no-decision part).
 *
 * Everything inside renders for `viewer` — the owner's technical public stand-in — through the
 * SAME privacy view model a genuine stranger gets: no exact age, no owner tick, no owner menus,
 * and no only-me Moment (the feed is re-ordered for the stand-in, which authors nothing).
 *
 * The stand-in is a render-time viewer only. It is never persisted, never a relationship, never
 * a network identity and never an author: every write dispatched from inside the scope is refused
 * here, so it can never become a Moment's or a response's author (the reducer also writes as the
 * acting person, never as `me`). Only the reading actions below pass through.
 *
 * S1 (owner-decided §5.3–§5.5/§5.7, superseding the Phase 4.4-A "part 2 not settled" posture):
 * the preview feed is composed through the SAME access seam as a genuine stranger's view of this
 * World — the subject's own Moments only, public only. D-2 and D-4 are decided; nothing here is
 * a second privacy branch.
 */
const PREVIEW_READ_ONLY = new Set<Action["type"]>(["loadMore", "reveal", "landed"]);

export function PreviewScope({ viewer, children }: { viewer: Person | null; children: ReactNode }) {
  const c = useContext(StoreContext);
  if (!c) throw new Error("PreviewScope outside <SocialStore>");
  const { state, dispatch } = c;
  const strangerRel = useCallback((): ViewerRelationship => "none", []);
  const ordered = useMemo(
    () => (viewer ? composeFeed(state.moments, state.hidden, viewer.id, c.profile.id, strangerRel) : null),
    [viewer, state.moments, state.hidden, c.profile.id, strangerRel],
  );
  const guarded = useCallback((a: Action) => {
    if (PREVIEW_READ_ONLY.has(a.type)) dispatch(a);
  }, [dispatch]);
  const previewCanSee = useCallback((m: Moment) => (viewer ? canSeeMoment(m, viewer.id, "none") : false), [viewer]);
  const value = useMemo<Ctx | null>(
    () =>
      viewer && ordered
        ? { ...c, me: viewer, isOwnerView: false, previewing: true, dispatch: guarded, feed: ordered.slice(0, state.visible), total: ordered.length, canSee: previewCanSee }
        : null,
    [c, viewer, ordered, guarded, state.visible, previewCanSee],
  );
  if (!value) return <>{children}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useSocial(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useSocial outside <SocialStore>");
  return c;
}

/* ---------- time helpers (prototype clock, never new Date()) ---------- */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const pad = (n: number) => String(n).padStart(2, "0");
export const parseLocal = (iso: string) => new Date(iso);
export const dateKey = (iso: string) => iso.slice(0, 10);
export const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const todayKey = () => dateKey(localISO(now()));
export const formatDate = (iso: string) => {
  const d = parseLocal(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const formatTime = (iso: string) => {
  const d = parseLocal(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const isToday = (iso: string) => dateKey(iso) === todayKey();
export function dayLabel(iso: string): string {
  const k = dateKey(iso);
  const t = now();
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (k === todayKey()) return "Today";
  if (k === dateKey(localISO(y))) return "Yesterday";
  return formatDate(iso);
}
