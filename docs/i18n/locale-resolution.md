# SYSTEMBOOM — locale resolution (the §5 policy, in detail)

This describes exactly how the active locale is chosen, on the server and the client.
It is the binding contract for the live port. The pure logic lives in
`src/lib/i18n/resolve.ts` and is mirrored 1:1 by the Node test
`prototype-tests/locale-resolution.js` (documented lockstep — change one, change both).

## The priority (binding)

`resolveLocale(input)` returns `{ locale, source, region }` choosing the **first**
that yields a supported locale:

1. **profile** (`input.profileLocale`) — the authenticated user's saved preference.
   Authoritative. Never silently overwritten by any lower rule.
2. **manual-device** (`input.manualLocale`) — a manual pre-login choice, persisted in
   the `sb-locale` cookie / localStorage.
3. **browser** (`input.acceptLanguage`) — parsed, q-sorted; `en-GB`→`en`,
   `zh-Hant`/`zh-*`→`zh-Hans`, unknown tags skipped.
4. **region** (`input.regionCode`) — `REGION_LANGUAGE_HINT[country]` (e.g. `NP`→`ne`,
   `IN`→`hi`, `CN`→`zh-Hans`, `US`/`GB`→`en`). A coarse hint only.
5. **English** — the final fallback. `source: "fallback"`.

**USER CHOICE ALWAYS WINS. LOCATION IS NEVER PROOF OF LANGUAGE.** Rules 1–2 are the
user's own choice; they beat browser and region every time. Region (rule 4) is the
weakest signal and only applies when there is no profile, no manual choice, and no
usable browser preference.

## Where the inputs come from (server)

`resolveRequestLocale()` in `src/lib/i18n/server.ts`:

- `manualLocale` ← `sb-locale` cookie (`await cookies()`).
- `regionCode` ← `sb-region` cookie or `x-sb-region` header (coarse; **deterministic
  test injection** — no GPS, no precise geolocation, no third-party lookup).
- `acceptLanguage` ← the `accept-language` header (`await headers()`), q-sorted.
- `profileLocale` ← not wired to a real backend in the prototype; the seam exists so
  the live port passes the authenticated user's saved preference here (rule 1).

The result seeds SSR (`<html lang dir>`) and `LocaleProvider`, so first paint is the
resolved locale — no flash (see `architecture.md` §5).

## The region change → suggestion (§12–§14, §58–§59)

Region **never auto-switches** the language. `regionSuggestion(input)` returns a
candidate locale, or `null`, and is `null` unless **all** hold:

- there is a `region`, and it maps to a supported locale (`REGION_LANGUAGE_HINT`);
- that mapped locale is **different** from the active locale;
- the active locale did **not** come from an explicit user choice that should be left
  alone in a way the policy protects; and
- this region has **not already been handled** (`lastHandledRegion`).

The UI (`RegionSuggestion.tsx`) then offers a quiet **Keep / Switch** strip. Choosing
either marks the region handled (`sb-locale-region-handled`) so it never re-prompts.
There is no modal, no notification/bell event, and no automatic change.

## Persistence & inheritance

- A manual pre-login choice persists (cookie + localStorage) and **a new account
  inherits the pre-login locale**.
- Once authenticated, the **profile preference is authoritative** and is never silently
  overwritten by browser/region.

## Test matrix

`prototype-tests/locale-resolution.js` (21 checks, Node-only) covers:

- each priority level winning in isolation and in combination;
- `Accept-Language` parsing (`en-GB`→en, `zh-*`→zh-Hans, q-ordering, junk skipped);
- region hints (NP/IN/CN/US/GB and an unknown country → fallback);
- the suggestion logic (fires only on a real, unhandled region change to a different
  supported locale; never when the user chose; never twice for a handled region).
