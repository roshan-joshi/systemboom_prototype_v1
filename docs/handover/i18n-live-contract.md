# SYSTEMBOOM — i18n live-system contract (Phase S1)

For the developer of `next.systemboom.co.uk`. This is what the live system **owes** the
accepted S1 language foundation. The prototype under `src/lib/i18n/**` and
`src/components/i18n/**` is the accepted reference; the documents in `docs/i18n/**`
describe it. Where a document and the accepted, tested behaviour disagree, REPORT it.

## Non-negotiables (binding)

1. **Eight first-class locales**, native names, **no country flags**. Order and
   metadata from `config.ts` (`LOCALES`).
2. **Routes never change with language** — no `/en/...`. Language is a product-wide
   preference resolved from cookie + headers, not the URL.
3. **Resolution priority** (exactly): profile → manual-device → browser → region →
   English. **User choice always wins; location is never proof of language.**
4. **Flash-free first paint**: the server resolves the locale and renders it (with
   `<html lang dir>`) before meaningful paint; the client is seeded with the same
   locale. **No wrong-language flash, no hydration mismatch.**
5. **User-generated content is never auto-translated** and never sent to a translation
   service. System text is localized; human text is original.
6. **Temporal truth never changes**: locale-aware presentation only; no fabricated
   birth time / midnight / noon; Gregorian calendar retained.
7. **No GPS / precise geolocation / third-party location service.** Region is a coarse
   hint with deterministic injection.

## What the live team must wire (P1)

- **`profileLocale` (resolution rule 1).** Pass the authenticated user's saved language
  preference into `resolveRequestLocale()`'s `profileLocale`. The seam exists; the
  prototype has no real backend. The profile preference is authoritative and must never
  be silently overwritten by browser/region.
- **`sb-region` / `x-sb-region` from a real coarse-region signal.** The prototype uses a
  cookie/header with deterministic test injection. The live system may set this from a
  CDN/edge country header (coarse only). Still **suggest, never auto-switch**.
- **Persisted manual choice → new account inheritance.** A pre-login `sb-locale` must
  carry into the created account's initial `profileLocale`.
- **Native translation review.** Every non-English catalog is `draft`. Run native
  review (`docs/i18n/translation-status.md`) before presenting a locale as complete.

## Hydration determinism (do not regress)

`Intl` output can differ between the SSR runtime and a user's browser (ICU data /
numbering system). The prototype avoids this by:

- shipping month names in `format.ts` (not reading them from `Intl`);
- pinning every `Intl` formatter to `numberingSystem: "latn"`;
- rendering times as deterministic 24-hour `HH:MM`.

If the live team re-introduces `Intl`-derived month names or native numerals, they
**must** guarantee SSR/client ICU parity for the deployment target, or gate that
formatting to after mount, or accept a `suppressHydrationWarning` boundary — otherwise
first paint breaks (§23). Native numerals are the intended future enhancement here.

## RTL (future, not now)

Every locale carries `dir` and `script`. No initial locale is RTL and RTL is not
enabled. Adding an RTL locale later must be a data + CSS-logical-properties change, not
a redesign — keep layouts direction-agnostic (logical properties, no hard-coded
left/right) so this stays true.

## Seams to connect through (do not refactor to "make it easier")

- `resolveRequestLocale()` — the one server entry point (cookies/headers → locale).
- `LocaleProvider` / `useT()` — the one client state; `useT` falls back to English
  outside a provider (keep that for harnesses).
- `LanguageMenu` — the one selector, mounted pre-login (Cosmos) and in Account.
- Catalogs are dotted-key maps with meaning-keys and CLDR-ordered plural forms; keep
  English byte-identical to the product's canonical strings so the accepted S0 suites
  stay green.

## Tests / evidence

- `prototype-tests/locale-resolution.js` — the §5 matrix + suggestion logic (Node).
- `prototype-tests/i18n.js` — browser suite: flash-free first paint per locale, no
  hydration error in a limited-ICU browser, deterministic formatting, human content
  untranslated, context preserved on switch.
- `prototype-evidence/i18n-s1/**` — captures per locale (see the suite).
