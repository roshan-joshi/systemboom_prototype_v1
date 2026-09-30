# SYSTEMBOOM — Monetization Foundation (Social Wall S8)

**Status: architecture only.** This repository contains NO billing — no checkout, no
subscription state, no payment UI, and no simulated purchase flow. What it contains is the
entitlement seam a billing provider plugs into, and the product law that seam enforces.

## Product law (binding on the live port)

1. **The free core is complete.** Human connection — Moments, Respond, Boom, Resonate,
   Friends, Chat, Search, Notifications, privacy controls, basic Life, basic export — is
   never gated. These capabilities are deliberately NOT members of the `Entitlement` type,
   so no code can gate them without a type change that reviewers will see.
2. **Value-based premium service only.** What may be sold: storage, resolution, archive
   depth, memory intelligence over one's OWN data, family/legacy preservation, advanced
   personalization, advanced export.
3. **Never sold, in any form:** popularity, reach, ranking, placement, "boost", visibility
   of one person to another, or any attention mechanic. There is no ad system and no
   engagement economy to monetize.
4. **Basic data portability is a right.** Only the advanced export form
   (`export.advanced`: full archive + media originals + structure) is an entitlement.

## The seam

`src/lib/entitlements/index.ts`:

- `Entitlement` — the closed union of sellable capabilities (documented per member).
- `Plan { id, nameKey, entitlements }` — display names resolve through the i18n catalog.
- `EntitlementSource { planFor(personId) }` — the ONE interface a billing provider
  implements. Nothing else in the app may know how an entitlement was granted.
- `FREE_PLAN` — the shipped default: every entitlement absent, every core capability
  untouched.
- `can(entitlement, personId, source?)` — the one capability check. Callers ask about a
  capability, never a plan name.

## Where the seams sit in the product (documented, not built)

| Entitlement | Surface it would touch | Today's behaviour |
|---|---|---|
| `storage.expanded` / `storage.originals` / `storage.longVideo` | Composer media panel; media serving | Mock library, single-size images (recorded in `layout-metrics.md`) |
| `archive.expanded` / `archive.backup` | Almanac depth; live retention policy | Prototype keeps everything in fixtures |
| `memory.intelligence` | Search over one's own Moments (natural-language recall) | Substring search only; the S5 search surface is the mount point |
| `legacy.familyArchive` / `legacy.continuity` | Ancestor Tree + family spaces (frozen zones) | Documented seam only — do not reopen those zones for this |
| `personalization.advanced` | Theme system beyond Deep Cosmos / Solar Observatory | Two themes ship; the theme store is the mount point |
| `export.advanced` | Account menu (basic export stays free) | No export in the prototype; the live contract owes BOTH forms, basic one free |

## Live-port obligations

- Entitlements resolve **server-side**; the client `can()` is presentation-only. A person
  must never gain a capability by editing client state.
- Failure posture: if the entitlement source is unreachable, degrade to `FREE_PLAN`
  (never lock the free core, never grant premium by default).
- Lapsed plans: stored premium DATA (originals, archives) is never deleted on lapse;
  serving may fall back to standard tiers. Deletion is only ever the person's own action.
- Any plan-name UI string enters the i18n catalogs (all 8 locales) — `nameKey`, never text.
