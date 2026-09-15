# Open issues (cross-phase)

## Light-mode Cosmos is a dark scene with white chrome — Phase 9 convergence

Found in the Phase 4.0 token audit (2026-09-10). Owner decision: log, do not act
on it in Phase 4.

The "Solar Observatory" light theme sets page tokens to pale values
(`--bg #e8ecf3`), but the R3F Cosmos scene renders its light-theme background
as `#0f2038` (deep navy, `BG_LIGHT` in `src/components/cosmos/Scene.tsx`) and
the Cosmos chrome uses a hardcoded white-on-dark alpha system (chip glass
`rgba(9,14,24,.52)`, panel `rgba(8,12,21,.78)`, light panel
`rgba(16,32,56,.78)`, `text-white/*`, `border-white/*`, focus ring `#8fc2ff`
rather than `--focus`). Consequently the pre-login Cosmos identity currently
depends on darkness, and a light-mode user experiences a dark Cosmos followed
by a pale Social — a luminance jump the Phase 2 entry veil was designed to
bridge, but the underlying inconsistency remains.

Options for Phase 9: (a) accept that space is dark and define "light mode" as
Solar Observatory *chrome* over a dark sky, documenting it as intent;
(b) design a genuine daylight Cosmos (sun-lit, pale sky) — large scope;
(c) tokenise the Cosmos chrome so both modes share one system regardless of
the scene colour. Recommendation pending owner review; (c) is prerequisite to
either.

Related drift to resolve at the same time: `#d92a20`/`#f04136` literals instead
of `--boom`; `#e9eff8` text vs `--text #eef2f8`; canvas `#04070e` vs `--bg`.
