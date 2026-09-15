# SYSTEMBOOM — i18n architecture (Phase S1)

This is the authoritative description of how SYSTEMBOOM becomes a true multilingual
global product. It is a **live-system handover contract**: the developer of
`next.systemboom.co.uk` ports the model described here. Where this document and the
accepted, tested behaviour disagree, that is a conflict to REPORT and fix in the
document — never a licence to weaken accepted behaviour.

## 1. What S1 is (and is not)

S1 delivers the **global language foundation**: one language state for the whole
product, eight first-class locales, flash-free locale resolution, a dependency-free
i18n runtime, locale-aware formatting, a product glossary, and the two language
controls (pre-login in Cosmos, authenticated in Account). It does **not** translate
user-generated content, add routes, add flags, use GPS, or call any third-party
translation service.

## 2. Supported locales (§2, §3)

Eight first-class locales, one authoritative native name each, **no country flags**
(a language is not a nationality):

| code | native name | script | dir | Intl base |
|------|-------------|--------|-----|-----------|
| `en` | English | Latin | ltr | en |
| `es` | Español | Latin | ltr | es |
| `it` | Italiano | Latin | ltr | it |
| `nl` | Nederlands | Latin | ltr | nl |
| `ru` | Русский | Cyrillic | ltr | ru |
| `hi` | हिन्दी | Devanagari | ltr | hi |
| `ne` | नेपाली | Devanagari | ltr | ne |
| `zh-Hans` | 简体中文 | CJK | ltr | zh-Hans |

Source of truth: `src/lib/i18n/config.ts` (`LOCALES`, stable order). Every locale
carries `dir` and `script` so **RTL is structurally possible later without a redesign**
— but no initial locale is RTL and RTL is **not** enabled now.

## 3. The one language state (§16)

Language is a single product-wide preference. It applies to Cosmos, My World, Life —
everything. Switching is **React state + a persisted cookie/localStorage + the
`<html lang/dir>` attribute** — never a route change, never a reload. Routes never
change with language (§4): there is no `/en/world`. Language is preference/context.

- `src/lib/i18n/LocaleProvider.tsx` — the client provider. `useLocale()` (throwing),
  `useLocaleMaybe()` (non-throwing), and `useT()` which returns `{ t, tp, locale }`
  and **falls back to English outside a provider** so a component works in the app and
  in an isolated dev harness alike.
- `setLocale(code, source)` writes `localStorage` + the `sb-locale` cookie + the
  `<html>` `lang`/`dir`, then updates React state. No navigation.

## 4. Resolution policy (§5) — BINDING priority

Resolved by `resolveLocale()` in `src/lib/i18n/resolve.ts`, in this exact order:

1. **profile** — the authenticated user's saved preference (authoritative; never
   silently overwritten)
2. **manual-device** — a manual pre-login choice (cookie/localStorage)
3. **browser** — `Accept-Language` (q-sorted; `en-GB`→`en`, `zh-*`→`zh-Hans`)
4. **region** — a coarse region hint (`REGION_LANGUAGE_HINT`, ISO country → locale)
5. **English** — final fallback

**USER CHOICE ALWAYS WINS. LOCATION IS NEVER PROOF OF LANGUAGE.** Region only ever
*suggests* (see §7); it never auto-switches.

Region is a **coarse-region seam only**: `regionCode?` from a cookie/header
(`sb-region` / `x-sb-region`) with deterministic test injection. There is **no GPS,
no precise geolocation, and no third-party location service.**

## 5. Flash-free first paint (§23, §83) — CRITICAL

The server resolves the locale **before meaningful paint** and renders the correct
locale into the SSR HTML, with `<html lang dir>` already set:

- `src/lib/i18n/server.ts` `resolveRequestLocale()` reads `cookies()` (`sb-locale` as a
  manual choice, `sb-region`) and `headers()` (`accept-language`, `x-sb-region`), both
  awaited, and calls `resolveLocale()`.
- `src/app/layout.tsx` is an async server component: it resolves the locale, renders
  `<html lang={locale} dir={meta.dir} suppressHydrationWarning>`, and wraps the tree in
  `<LocaleProvider initialLocale … initialSource … region …>`. The client provider is
  seeded with the **same** server-resolved locale, so the first client render matches
  SSR — **no wrong-language flash, no hydration mismatch.** This mirrors the existing
  theme boot (an inline pre-paint `<script>` + `suppressHydrationWarning`).
- A small `localeBootScript` reconciles `<html lang>` for the review route's `?lang=`
  override before paint (review tooling only).

Why routes were **not** used: the bundled Next docs (`node_modules/next/dist/docs/`)
recommend `/[lang]` route segments for i18n. §4 forbids routes changing with language,
so we deliberately use **route-less server resolution** (cookie + `Accept-Language`)
instead. This is a conscious divergence from the Next recommendation, driven by the
binding product rule.

### Hydration determinism (the ICU trap)

`Intl` output is **not guaranteed identical between the SSR runtime and the browser**:
Node ships full ICU, but a browser's bundled ICU may lack data for a locale and
silently fall back to English, or use a different numbering system. Two examples we hit:

- `Intl.NumberFormat('ne')` → Devanagari digits on Node, Latin digits in a
  limited-ICU browser.
- `Intl.DateTimeFormat('ne', {month:'long'})` → Nepali on Node, **English** in a
  limited-ICU Chromium.

Either divergence is a §23 hydration mismatch — a hard fail. Therefore:

- **Month names ship in the product** (`src/lib/i18n/format.ts` `SHORT_MONTHS` /
  `LONG_MONTHS`), they are NOT read from `Intl`. Only the numeric day/year vary.
- **All `Intl` formatters are pinned to the Latin numbering system** (`numberingSystem:
  "latn"`), so digits are deterministic while grouping, month names and field order
  stay locale-aware.
- **Times render as deterministic 24-hour `HH:MM`** (no locale am/pm ICU divergence).

Native numerals (e.g. Devanagari digits) are a **future enhancement**, viable once
SSR/client ICU numeral parity can be guaranteed for the deployment target.

## 6. Message runtime (§26–§30)

Smallest robust architecture, **no heavy i18n dependency**:

- Catalogs are plain dotted-key maps: `src/lib/i18n/catalogs/<locale>.ts`. Keys
  describe **meaning**, never a UI position, and never a sentence built from fragments.
- `translate(locale, key, params)` — dotted lookup, `{param}` interpolation, English
  fallback then the raw key (never a blank).
- `translatePlural(locale, key, count, params)` — pipe-separated forms in **CLDR order
  for that locale's categories**, selected via `Intl.PluralRules`. English/Spanish/
  Italian/Dutch/Hindi/Nepali are `one|other`; **Russian is `one|few|many`** (the
  stress case); Simplified Chinese is `other` only.
- Every non-English value carries **`status: draft, awaiting native review`** — we do
  **not** claim native-reviewed (§ QA).

The English catalog values are **byte-identical to the product's current hardcoded
strings**, so the 662 accepted S0 checks stay green; only non-English output differs
(exercised by the i18n suite and the locale-resolution suite).

## 7. Region suggestion (§12–§14, §58–§59)

`regionSuggestion()` (in `resolve.ts`) returns a candidate locale **only** when a
genuine region change maps to a supported language different from the active one, and
the region has not already been handled. It is surfaced by
`src/components/i18n/RegionSuggestion.tsx` as a quiet strip with two choices —
**Keep / Switch** — never an auto-switch, never a modal, never a bell/notification
event, and it never re-prompts once handled (`sb-locale-region-handled`).

## 8. The two language controls (§17–§20, §55–§57, §72)

One component, `src/components/i18n/LanguageMenu.tsx`: native names only, no flags, one
red current-position check, a touch-first bottom sheet on mobile and an anchored
surface on desktop, no Submit (tap = select).

- **Pre-login**: mounted in Cosmos (`src/components/shell/CosmosRoot.tsx`), immersive
  tone, clear of the frozen Cosmos overlay's own chip cluster. A manual pre-login
  choice persists; a new account inherits the pre-login locale.
- **Authenticated**: mounted **inside the Account menu** (`Chrome.tsx`), never as a
  top-bar icon (§72). The authenticated profile preference is authoritative.

## 9. Context preservation on switch (§21, §22, §60–§62)

Switching language is state-only: the Cosmos camera, scroll position, the open person,
the Life coordinate, the theme and any draft are all preserved. No reload, no route
change. Verified in the browser: switching ne→en in the Account menu flips all system
text in place while the viewer, scroll and human content stay put.

## 10. System text vs human text (§31–§35)

- **System text** (labels, actions, states, empty states) is localized.
- **Human text** (a Moment's words, a response, a note, a person's name, a place, chat
  messages) is **never auto-translated** and never sent to any translation service.
  There is no content-translation feature. A person's name and city render in their
  own script regardless of the viewer's locale.

## 11. Typography across scripts (§45–§54)

Four script classes (Latin, Cyrillic, Devanagari, CJK) look intentional without an
all-script mega-bundle. Devanagari is served locally (`public/fonts/noto-sans-
devanagari/**`, already accepted); the other scripts use the system/UI stack with real
fallbacks. **CJK hierarchy comes from size/weight/position — never letter-spacing or
uppercasing** (§49), and Cyrillic/Devanagari dates are **not** uppercased (only the
Latin locales follow the "DD MON YYYY" caps convention).

## 12. Files

```
src/lib/i18n/
  config.ts            locales, scripts, cookies, region hints
  resolve.ts           pure resolveLocale() + regionSuggestion() (the §5 policy)
  server.ts            resolveRequestLocale() — cookies()/headers()
  format.ts            sbDate/sbTime + locale number/date helpers (deterministic)
  messages.ts          translate / translatePlural / PLURAL_ORDER
  LocaleProvider.tsx   the one client language state + useT()
  catalogs/<locale>.ts 8 catalogs + index.ts
src/components/i18n/
  LanguageMenu.tsx     the one selector (pre-login + Account)
  RegionSuggestion.tsx the quiet Keep/Switch strip
docs/i18n/             this file + glossary + translation-status + locale-resolution
prototype-tests/
  locale-resolution.js the §5 matrix + suggestion logic (Node, no browser)
  i18n.js              the browser i18n suite (first-paint, no-flash, formatting)
```

See also: `docs/i18n/systemboom-glossary.md`, `docs/i18n/translation-status.md`,
`docs/i18n/locale-resolution.md`, `docs/handover/i18n-live-contract.md`.
