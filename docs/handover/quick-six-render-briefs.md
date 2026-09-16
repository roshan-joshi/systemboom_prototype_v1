# SYSTEMBOOM — Quick Six render briefs (R3.2 §78)

> **R3.5 note (2026-09-16).** Readability is now carried by the EMOTION CORE — a composited
> cutaway chamber revealing an internal emotional energy source per quick expression
> (`_build-emotion-cores.js`). This solves the no-label test at product scale; it does NOT
> close this brief. The FACE is still the single supplied grin, and a true render should
> carry BOTH the per-expression face specified below AND (ideally) the core chamber as real
> modelled geometry. The composites are placeholders that a render replaces file-for-file.

**Status: QUICK SIX FINAL ART — BLOCKED. Expression-specific 3D renders required.**

Everything around the art is finished, tested and green: the Quick-Six registry, the 3×2
phone deck, the desktop deck, tap and drag-preview, per-expression tempo and fuse, the Boom
Pulse, the three asset tiers with optical crops, on-idle warming, accessibility, reduced
motion and eight languages. What does not exist is **six different faces**.

The proof is `prototype-evidence/social-r3-2-signature-expression/01-quick-six-no-label-no-mark.png`:
with every mark, label and symbol removed, all six wear the same mischievous grin and differ
only in body tilt and scale. Per §12 that is a FAIL, and per §5/§77 it is reported as blocked
rather than dressed up.

When the renders land, the swap is **a file drop plus one line** (add the ids to `RENDERED`
in `src/components/style-lab/social/expressions.tsx`). No layout, motion, test, accessibility
or localization work follows.

---

## 1. Why this cannot be produced here

| capability | present |
|---|---|
| 3D renderer (Blender / Maya / C4D / any DCC) | no |
| image-generation model | no |
| 2D raster pipeline (sharp / libvips: resize, extract, composite, affine) | **yes** |
| headless Chromium (canvas, CSS transforms) | **yes** |

A 2D pipeline can move, scale, rotate and mask pixels. It cannot **open a closed mouth, close
an open one, or re-sculpt a brow**, and it cannot re-light the result. The mascot's mouth is
modelled geometry — individual shaded teeth, gums and a dark lip form on a reflective metal
sphere, seen three-quarter with a strong key light and a warm fuse rim.

Two of the six define the emotional range of the whole language and **both require a
non-grinning mouth**: CARE (warm, closed) and SUPPORT (serious, closed, firmly set). Neither
can exist without new artwork.

This was tested, not assumed. `prototype-evidence/social-r3-2-signature-expression/00-art-capability-experiment.png`
shows the two best 2D attempts available here — a puppet-warp squint for LAUGH and a
sample-and-paint attempt to close the mouth for SUPPORT. The squint mis-registers into a
doubled eye; the mouth paint-out is a blurred rectangle across the character's face. Shipping
either would be worse than shipping the canonical render unchanged.

## 2. Source and framing

| item | value |
|---|---|
| canonical source | `references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png` — 1055×1024, real alpha |
| alpha box | x 231–824, y 90–930 (594×841) |
| face window (the SM optical crop) | fractions of that box: x 0 → 0.876, y 0.357 → 0.976 |
| working face reference | `public/brand/expressions/neutral-face.webp` (256px) |
| the pipeline | `prototype-tests/_build-expression-assets.js` — drop `{id}.png` beside the source and re-run |

**Keep** the metallic body, physical material, large eyes, heavy brows, mouth and teeth, the
rope fuse, the spark, and the recognisable silhouette. **Do not** invent another mascot, change
the camera, or re-light per expression.

### Camera and light (identical for all six)

- Three-quarter view, character facing viewer-left, same as the canonical render.
- One key from upper-left; warm rim from the fuse spark on the upper-right; dark metallic
  body with a red-orange heat gradient down the right side.
- Transparent background, real alpha, no baked shadow, no background plate, no glow or halo.
- Crop safety: the character must sit inside the alpha box's proportions so the existing face
  window still lands on the face. Nothing essential within 3% of the canvas edge.

### Deliverables per expression

`{id}-sm.webp` 72×72 (the FACE crop — eyes, brows, mouth, a fuse cue) ·
`{id}-md.webp` 128×128 (full character) · `{id}-lg.webp` 256×256 (full character).

Budgets: ≤24KB `sm`, ≤70KB `md`, ≤140KB `lg`. Deliver the quick six before anything else —
they are the six a person sees without opening anything.

## 3. The six

### CARE — warmth, affection, "I care"

| field | specification |
|---|---|
| eyes | softened; upper lids lowered about a third; pupils centred on the viewer, not narrowed |
| brows | the heavy ridge relaxes — **level, inner ends slightly raised**. The downward angle that makes the canonical face read as a snarl must go |
| mouth / teeth | **closed**, a gentle asymmetric curve. **No teeth visible.** This is the single most important change |
| body angle | leans in and slightly down toward the viewer, weight settled, ~10° toward the lean, marginally smaller in frame |
| fuse curve | relaxed, the rope hanging rather than whipping |
| spark | small, warm, steady — a glow not a flare |
| serious-context | must be usable on a family memory or a personal milestone; warm, never romantic-only, never leering |

### JOY — this made me happy

| field | specification |
|---|---|
| eyes | wide open and bright, upper lids high, catchlights strong |
| brows | raised and relaxed, arched — no angle |
| mouth / teeth | an open, genuinely happy smile; teeth are fine here; corners high and even |
| body angle | buoyant, lifted clear of its resting line, slightly larger in frame, upright |
| fuse curve | lively upward flick |
| spark | quick, bright, controlled |
| must not | look like LAUGH — the eyes stay OPEN and the head stays upright |

### LAUGH — genuinely funny

| field | specification |
|---|---|
| eyes | **squeezed nearly shut**, crescents — this is the primary difference from Joy |
| brows | high and relaxed, following the squeeze |
| mouth / teeth | wide open laughter, jaw dropped, tongue/interior visible, not a static grin |
| body angle | rocked back ~14°, head thrown back, one side-rock |
| fuse curve | whipped by the rock, trailing |
| spark | one short energetic wobble |
| must not | read as aggressive; it is delight, not a sneer |

### WOW — amazement, surprise

| field | specification |
|---|---|
| eyes | **very wide**, whites visible all around, pupils small |
| brows | high and arched, maximum lift of the set |
| mouth / teeth | small open **O** — no grin, few or no teeth |
| body angle | recoil back and slightly up, chin raised, the largest scale of the six |
| fuse curve | pulled back with the recoil |
| spark | one brief flare, sharp and short |
| must not | depend on a star or burst symbol to be readable |

### CELEBRATE — congratulations, achievement, good news

| field | specification |
|---|---|
| eyes | bright, squinting with the grin, full delight |
| brows | high |
| mouth / teeth | broad open grin — the mascot's natural mischief may be used fully here |
| body angle | airborne, tilted, the highest lift and the most upward energy of the six |
| fuse curve | thrown upward by the lift |
| spark | the strongest one-shot burst; a few tiny local particles are allowed, no screen confetti |
| note | this is the one expression the canonical render already nearly is — use it as the anchor for the set's material and lighting |

### SUPPORT — "I'm with you"

**The most important serious-emotion test in the product. If only one render can be made, make this one.**

| field | specification |
|---|---|
| eyes | attentive, open, direct — present with the person, not happy |
| brows | **level and grounded**. Never angled down. Never raised into surprise |
| mouth / teeth | **closed and firmly set. No teeth. No grin at all.** A bared-teeth Support on a difficult Moment reads as mockery — this is the failure mode to design against |
| body angle | planted and squared, no lift, weight even, facing the viewer more than the other five |
| fuse curve | still, hanging |
| spark | stable, low-energy, warm |
| serious-context | must sit correctly on a difficult work day, a lost opportunity, or a reflective Moment without reading as laughing, mocking, scheming, or delighting in distress |

### Also needed: NEUTRAL

The supplied pose is a mischievous grin, which the empty Moment control wears today. §28 asks
that control to be **inviting, curious, mischievous — never angry or threatening**, and it is
seen far more often than any single expression. Deliver `neutral-{sm,md,lg}.webp`: eyes open
and level, brows level, **mouth closed** with the faintest hint of mischief at one corner,
head straight, spark calm. Same body, same light, at rest.

## 4. Acceptance

A delivered set is accepted when, with **every mark, label and symbol hidden**:

1. a person who has never seen SYSTEMBOOM can name at least five of the six;
2. JOY and LAUGH are unmistakably different (open eyes versus squeezed eyes);
3. SUPPORT reads as serious and kind at 68px and never as mockery;
4. CARE reads as warm with no heart anywhere near it;
5. every one still reads **static** — no motion required to understand the emotion (§13);
6. the set reads on Deep Cosmos (dark) and Solar Observatory (light);
7. the `sm` face crop still reads at 24px in the presence line.

## 5. What is already built and waiting

| system | state |
|---|---|
| registry, one-active invariant, change / remove | done, green |
| Quick deck — 3×2 phone, one row desktop, 68px character, all six visible 320–430 | done, green |
| tap · drag preview · hover anticipation · keyboard | done, green |
| per-expression tempo (Care 360 · Joy 300 · Laugh 400 · Wow 260 · Celebrate 460 · Support 380ms) | done, green |
| fuse language (warm · lift · wobble · flare · burst · steady) | done, green |
| mass impulse + mass-scaled Boom Pulse | done, green |
| asset tiers sm/md/lg with optical crops, on-idle warming, extended on demand | done, green |
| reduced motion, high contrast, eight languages | done, green |

## 6. R3.7 note — the chamber is not the face

R3.7 made the Emotion Chamber physically convincing (a bore seen obliquely, the core under the
wall) and made every scale carry the same object (chamber → Boom Lens). None of that closes
this brief: the mouth is still the supplied grin on all six, and Care and Support still need a
closed, non-grinning mouth that cannot be synthesised here. When the renders land, keep the
chamber geometry (`_build-emotion-cores.js` `CHAMBER` / `OPENING`) so the composited cores and
the lens windows stay valid, or render the chamber into the model and drop the compositor.

## 7. R3.8 note — cores are not faces either

R3.8 moved recognition to the EMOTION CORES (six lit objects, chosen and shown inside one
vessel), which is why the picker no longer depends on six different faces. The brief above is
unchanged: the vessel still wears the supplied grin for every expression, and Care/Support still
need a closed mouth. When the renders land they replace `{id}-md/lg.webp` and the lens tiers; the
core objects (`{id}-core.webp`) stay as the selectable emotions.
