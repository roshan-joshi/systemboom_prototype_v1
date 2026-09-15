"use client";

/**
 * SYSTEMBOOM IDENTITY PROVIDER — the single owner of prototype identity,
 * session and identity-gate state.
 *
 * Mounted in the root layout, ABOVE the WebGL / fallback fork, so the gate
 * exists identically over the live Cosmos, the static fallback and (later)
 * the authenticated shell. CosmosExperience never owns gate state — it only
 * reads `open` and reports the explorer lock.
 *
 * Storage model: only a CREATED identity is ever persisted (sb-identity).
 * The Maya Rai demo identity is rebuilt from its seed on demand, so entering
 * as Maya never overwrites an identity the person created. The session
 * (sb-session) names which one is active.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { now } from "@/lib/clock";
import { identityFromDemoSeed } from "@/lib/identity/demo-seed";
import { createIdentity, identityStore, type StorageMode } from "@/lib/identity/store";
import type { IdentityInput, PrototypeIdentity, PrototypeSession } from "@/lib/identity/types";
import { demoUser } from "@/lib/mock/demo-user";

export type GateView = "signin" | "create" | "signedIn";

interface State {
  hydrated: boolean;
  storageMode: StorageMode;
  /** The persisted created identity, if any. */
  created: PrototypeIdentity | null;
  session: PrototypeSession | null;
  gateOpen: boolean;
  gateView: GateView;
  /** Element that opened the gate — focus returns here on close. */
  opener: HTMLElement | null;
  /** True while a map provider is live: the gate must not open. */
  locked: boolean;
  /** Polite live-region text — reducer-owned so no effect has to set it. */
  announce: string;
}

type Action =
  | {
      type: "hydrate";
      storageMode: StorageMode;
      created: PrototypeIdentity | null;
      session: PrototypeSession | null;
    }
  | { type: "open"; view: GateView; opener: HTMLElement | null }
  | { type: "close" }
  | { type: "view"; view: GateView }
  | { type: "lock"; locked: boolean }
  | { type: "commit"; created: PrototypeIdentity | null; session: PrototypeSession; name: string }
  | { type: "clearSession" };

const initial: State = {
  hydrated: false,
  storageMode: "memory",
  created: null,
  session: null,
  gateOpen: false,
  gateView: "signin",
  opener: null,
  locked: false,
  announce: "",
};

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...s, hydrated: true, storageMode: a.storageMode, created: a.created, session: a.session };
    case "open":
      if (s.locked) return s;
      return {
        ...s,
        gateOpen: true,
        gateView: a.view,
        opener: a.opener,
        announce: a.view === "signedIn" ? "Your identity." : "Sign in opened.",
      };
    case "close":
      return { ...s, gateOpen: false, announce: "" };
    case "view":
      return { ...s, gateView: a.view };
    case "lock":
      // Locking while open closes the gate — the map is taking the frame.
      return { ...s, locked: a.locked, gateOpen: a.locked ? false : s.gateOpen };
    case "commit":
      return {
        ...s,
        created: a.created,
        session: a.session,
        gateView: "signedIn",
        announce: `Signed in as ${a.name}.`,
      };
    case "clearSession":
      return {
        ...s,
        session: null,
        gateView: "signin",
        announce: "Sign-in cleared. Your identity is kept in this browser.",
      };
  }
}

export interface IdentityContextValue {
  hydrated: boolean;
  storageMode: StorageMode;
  created: PrototypeIdentity | null;
  session: PrototypeSession | null;
  /** The identity the session names (demo rebuilt from seed), or null. */
  activeIdentity: PrototypeIdentity | null;
  enterAsDemo: () => void;
  enterAsCreated: () => void;
  createAndEnter: (input: IdentityInput) => void;
  /** Prototype testing affordance — clears the session, keeps the identity. */
  clearSession: () => void;
  gate: {
    open: boolean;
    view: GateView;
    locked: boolean;
    openGate: (view: GateView, opener: HTMLElement | null) => void;
    closeGate: () => void;
    setView: (view: GateView) => void;
    setLock: (locked: boolean) => void;
    opener: HTMLElement | null;
    announce: string;
  };
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

function resolveActive(
  session: PrototypeSession | null,
  created: PrototypeIdentity | null,
): PrototypeIdentity | null {
  if (!session) return null;
  if (session.identityId === demoUser.id) return identityFromDemoSeed();
  if (created && created.id === session.identityId) return created;
  return null;
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, initial);

  // Storage is read post-mount only — nothing identity-shaped ever reaches
  // server-rendered markup, so there is no hydration mismatch to manage.
  useEffect(() => {
    const store = identityStore();
    const created = store.readIdentity();
    let session = store.readSession();
    if (session && !resolveActive(session, created)) {
      // A session naming an identity that no longer exists is stale.
      store.clearSession();
      session = null;
    }
    dispatch({ type: "hydrate", storageMode: store.mode, created, session });
  }, []);

  const newSession = useCallback((identityId: string): PrototypeSession => {
    return identityStore().writeSession({
      identityId,
      firstEntrySeen: false,
      signedInAt: now().toISOString(),
    });
  }, []);

  const enterAsDemo = useCallback(() => {
    dispatch({
      type: "commit",
      created: state.created,
      session: newSession(demoUser.id),
      name: demoUser.name,
    });
  }, [newSession, state.created]);

  const enterAsCreated = useCallback(() => {
    if (!state.created) return;
    dispatch({
      type: "commit",
      created: state.created,
      session: newSession(state.created.id),
      name: state.created.name,
    });
  }, [newSession, state.created]);

  const createAndEnter = useCallback(
    (input: IdentityInput) => {
      const identity = identityStore().writeIdentity(createIdentity(input));
      dispatch({
        type: "commit",
        created: identity,
        session: newSession(identity.id),
        name: identity.name,
      });
    },
    [newSession],
  );

  const clearSession = useCallback(() => {
    identityStore().clearSession();
    dispatch({ type: "clearSession" });
  }, []);

  const openGate = useCallback((view: GateView, opener: HTMLElement | null) => {
    dispatch({ type: "open", view, opener });
  }, []);
  const closeGate = useCallback(() => dispatch({ type: "close" }), []);
  const setView = useCallback((view: GateView) => dispatch({ type: "view", view }), []);
  const setLock = useCallback((locked: boolean) => dispatch({ type: "lock", locked }), []);

  const activeIdentity = useMemo(
    () => resolveActive(state.session, state.created),
    [state.session, state.created],
  );

  const value = useMemo<IdentityContextValue>(
    () => ({
      hydrated: state.hydrated,
      storageMode: state.storageMode,
      created: state.created,
      session: state.session,
      activeIdentity,
      enterAsDemo,
      enterAsCreated,
      createAndEnter,
      clearSession,
      gate: {
        open: state.gateOpen,
        view: state.gateView,
        locked: state.locked,
        opener: state.opener,
        announce: state.announce,
        openGate,
        closeGate,
        setView,
        setLock,
      },
    }),
    [
      state,
      activeIdentity,
      enterAsDemo,
      enterAsCreated,
      createAndEnter,
      clearSession,
      openGate,
      closeGate,
      setView,
      setLock,
    ],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_IDENTITY?: object }).__SB_IDENTITY = {
        hydrated: state.hydrated,
        storageMode: state.storageMode,
        gateOpen: state.gateOpen,
        gateView: state.gateView,
        locked: state.locked,
        sessionIdentityId: state.session?.identityId ?? null,
        activeIdentityId: activeIdentity?.id ?? null,
        createdId: state.created?.id ?? null,
      };
    }
  });

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used inside <IdentityProvider>");
  return ctx;
}

export function useIdentityGate(): IdentityContextValue["gate"] {
  return useIdentity().gate;
}
