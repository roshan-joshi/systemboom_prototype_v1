/**
 * Prototype identity + session storage — the only module that touches the
 * `sb-identity` / `sb-session` keys.
 *
 * Local-only by design: nothing here is authentication. Storage is probed
 * once; when localStorage is unavailable (private mode, blocked site data)
 * the store degrades to in-memory for the life of the page and says so via
 * `mode`, so the UI can tell the person their identity won't persist.
 *
 * Reads are defensive: corrupt or foreign JSON yields null and is left in
 * place (never destroyed on read). Writes always pass through normalization,
 * so an unknown birth time can never reach storage as a key.
 */

import { now } from "../clock";
import { normalizeBirth } from "./birth";
import type {
  IdentityInput,
  PrototypeIdentity,
  PrototypePlace,
  PrototypeSession,
} from "./types";

export const IDENTITY_KEY = "sb-identity";
export const SESSION_KEY = "sb-session";

export type StorageMode = "persistent" | "memory";

/** The subset of the Web Storage API the store needs — injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

/** Probe real storage with a write/remove; fall back to memory on any failure. */
export function detectStorage(): { storage: StorageLike; mode: StorageMode } {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { storage: new MemoryStorage(), mode: "memory" };
    }
    const probe = "sb-storage-probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return { storage: window.localStorage, mode: "persistent" };
  } catch {
    return { storage: new MemoryStorage(), mode: "memory" };
  }
}

/* ---------- shape guards ---------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isPlace(x: unknown): x is PrototypePlace {
  if (!isRecord(x) || typeof x.label !== "string") return false;
  if (x.geoId !== undefined && typeof x.geoId !== "string") return false;
  if (x.countryCode !== undefined && typeof x.countryCode !== "string") return false;
  if (x.lat !== undefined && typeof x.lat !== "number") return false;
  if (x.lon !== undefined && typeof x.lon !== "number") return false;
  return true;
}

export function isPrototypeIdentity(x: unknown): x is PrototypeIdentity {
  if (!isRecord(x)) return false;
  if (typeof x.id !== "string" || typeof x.name !== "string") return false;
  if (typeof x.birthDate !== "string" || typeof x.birthTimeKnown !== "boolean") return false;
  if (x.birthTime !== undefined && typeof x.birthTime !== "string") return false;
  if (x.avatar !== undefined && typeof x.avatar !== "string") return false;
  if (x.birthplace !== undefined && !isPlace(x.birthplace)) return false;
  if (x.currentPlace !== undefined && !isPlace(x.currentPlace)) return false;
  if (typeof x.createdAt !== "string") return false;
  if (x.source !== "demo-seed" && x.source !== "created") return false;
  return true;
}

export function isPrototypeSession(x: unknown): x is PrototypeSession {
  if (!isRecord(x)) return false;
  if (typeof x.identityId !== "string" || typeof x.firstEntrySeen !== "boolean") return false;
  if (x.firstEntryStartedAt !== undefined && typeof x.firstEntryStartedAt !== "string") {
    return false;
  }
  return typeof x.signedInAt === "string";
}

/* ---------- normalization ---------- */

function cleanPlace(place: PrototypePlace | undefined): PrototypePlace | undefined {
  if (!place) return undefined;
  const label = place.label.trim();
  if (!label) return undefined;
  const out: PrototypePlace = { label };
  if (place.geoId) out.geoId = place.geoId;
  if (place.countryCode) out.countryCode = place.countryCode;
  if (typeof place.lat === "number" && typeof place.lon === "number") {
    out.lat = place.lat;
    out.lon = place.lon;
  }
  return out;
}

/**
 * Build the exact object that is stored: only defined keys, birth truth
 * re-enforced, so the serialized JSON never carries a birthTime key for an
 * unknown time — regardless of what the caller passed.
 */
export function normalizeIdentity(identity: PrototypeIdentity): PrototypeIdentity {
  const birth = normalizeBirth(identity);
  const out: PrototypeIdentity = {
    id: identity.id,
    name: identity.name.trim(),
    birthDate: birth.birthDate,
    birthTimeKnown: birth.birthTimeKnown,
    createdAt: identity.createdAt,
    source: identity.source,
  };
  if (birth.birthTimeKnown && birth.birthTime) out.birthTime = birth.birthTime;
  if (identity.avatar) out.avatar = identity.avatar;
  const birthplace = cleanPlace(identity.birthplace);
  if (birthplace) out.birthplace = birthplace;
  const currentPlace = cleanPlace(identity.currentPlace);
  if (currentPlace) out.currentPlace = currentPlace;
  return out;
}

function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return `id-${c.randomUUID()}`;
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A freshly created identity from the Create Identity surface. */
export function createIdentity(input: IdentityInput, at: Date = now()): PrototypeIdentity {
  return normalizeIdentity({
    id: newId(),
    name: input.name,
    avatar: input.avatar,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthTimeKnown: input.birthTimeKnown,
    currentPlace: input.currentPlace,
    createdAt: at.toISOString(),
    source: "created",
  });
}

/* ---------- the store ---------- */

export interface IdentityStore {
  readonly mode: StorageMode;
  readIdentity(): PrototypeIdentity | null;
  writeIdentity(identity: PrototypeIdentity): PrototypeIdentity;
  clearIdentity(): void;
  readSession(): PrototypeSession | null;
  writeSession(session: PrototypeSession): PrototypeSession;
  clearSession(): void;
}

function readJson<T>(storage: StorageLike, key: string, guard: (x: unknown) => x is T): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeJson(storage: StorageLike, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — the caller already knows the mode */
  }
}

function remove(storage: StorageLike, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    /* nothing to do */
  }
}

export function createIdentityStore(
  backing?: { storage: StorageLike; mode: StorageMode },
): IdentityStore {
  const { storage, mode } = backing ?? detectStorage();
  return {
    mode,
    readIdentity: () => readJson(storage, IDENTITY_KEY, isPrototypeIdentity),
    writeIdentity: (identity) => {
      const stored = normalizeIdentity(identity);
      writeJson(storage, IDENTITY_KEY, stored);
      return stored;
    },
    clearIdentity: () => remove(storage, IDENTITY_KEY),
    readSession: () => readJson(storage, SESSION_KEY, isPrototypeSession),
    writeSession: (session) => {
      const stored: PrototypeSession = {
        identityId: session.identityId,
        firstEntrySeen: session.firstEntrySeen,
        signedInAt: session.signedInAt,
      };
      if (session.firstEntryStartedAt) stored.firstEntryStartedAt = session.firstEntryStartedAt;
      writeJson(storage, SESSION_KEY, stored);
      return stored;
    },
    clearSession: () => remove(storage, SESSION_KEY),
  };
}

let browserStore: IdentityStore | null = null;

/** The page's single store — probes storage once, on first use in the browser. */
export function identityStore(): IdentityStore {
  if (!browserStore) browserStore = createIdentityStore();
  return browserStore;
}
