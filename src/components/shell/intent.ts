/**
 * DESTINATION INTENT — the request survives identity.
 *
 * A person who asks for Social or Life without an identity should not have to
 * ask twice. The requested destination is remembered for this browser session
 * only, and consumed once the identity gate succeeds. Nothing is stored about
 * who they are; this is a single string naming a destination they chose.
 */

const KEY = "sb-intent";

export function rememberIntent(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* private mode — the person simply repeats the request */
  }
}

export function peekIntent(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function takeIntent(): string | null {
  const v = peekIntent();
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  return v;
}
