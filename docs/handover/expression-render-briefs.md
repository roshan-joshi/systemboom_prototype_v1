# SYSTEMBOOM — Expression render briefs (R3.1 §48)

**Status: ART ASSET BLOCKED.** The owner's 3D mascot landed and is shipping — it is the
artwork in `public/brand/expressions/`. What has NOT landed is a **per-expression face**.
One pose was supplied (a mischievous grin), so all eighteen expressions currently wear the
same face. Per R3.1 §4–§5 the FACE must change per emotion; per §48 that cannot be invented
here, and compensating with more symbols is explicitly forbidden. So this document is the
exact brief a 3D artist needs, and `prototype-evidence/social-r3-1-living-expression/02-quick-six-no-marks.png`
is the honest proof of what is missing.

Everything around the art is finished and green: the eighteen-expression registry, emotional
groups, the Quick Deck, the Expression Library, mass-based motion, the Boom Pulse, sizes and
optical crops, the neutral control, accessibility, and localization in eight languages. When
the renders land, the swap is **a file drop plus one line** — no layout, motion, test or
accessibility work follows it.

---

## 1. What exists today

| file | size | what it is |
|---|---|---|
| `public/brand/expressions/neutral-lg.webp` | 256 | full character, the owner's 3D render |
| `public/brand/expressions/neutral-md.webp` | 128 | full character |
| `public/brand/expressions/neutral-sm.webp` | 72 | **optical head crop** — the fuse and feet are dropped, because below ~30px they are noise (§32–§33, §36) |
| `public/brand/expressions/neutral-face.webp` | 192 | head crop at working size, the reference frame for every per-expression face |

Source: `references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png` (1055×1024, real alpha).

**The neutral pose is itself a gap.** The supplied render is a *mischievous grin* — the right
character, but not a neutral one. R3.1 §36–§38 asks the empty control to wear a **calm,
attentive** mascot that invites a feeling rather than pre-stating one. Until a neutral render
exists, the control wears the grin, which reads slightly more eager than the brief wants.
Deliver `neutral-{sm,md,lg}.webp` alongside the eighteen: eyes open and level, brows level,
**mouth closed**, head straight, no spark flare — the same body and lighting, at rest.

## 2. What to deliver

```
public/brand/expressions/
  care-sm.webp      care-md.webp      care-lg.webp
  joy-…  laugh-…  wow-…  celebrate-…  support-…
  love-…  respect-…  thanks-…  proud-…  inspired-…  curious-…
  touched-…  withyou-…  agree-…  thinking-…  nostalgia-…  speechless-…
```

Then add the ids to `RENDERED` in `src/components/style-lab/social/expressions.tsx`.
Partial delivery is supported: any id not in `RENDERED` keeps the neutral character, so the
set can land one expression at a time with no broken intermediate state. **Deliver the QUICK
SIX first** — they are the six a person sees without opening anything.

### Per-asset requirements

| property | requirement |
|---|---|
| Format | WebP, real alpha (AVIF fine if the pipeline's alpha is reliable; PNG last resort) |
| Sizes | `sm` 72×72 **head crop** (summary, control, who-list) · `md` 128×128 full character (deck, library) · `lg` 256×256 full character (sticker/preview) |
| Budget | ≤ 24KB `sm`, ≤ 70KB `md`, ≤ 140KB `lg`. Eighteen × (sm+md) ≤ ~1.7MB, loaded on demand — never in the first Social paint |
| Framing | square canvas, consistent optical size across all eighteen, transparent background, the artwork's own edge definition retained so it reads on Deep Cosmos **and** Solar Observatory |
| Lighting | the supplied render's language: one key from upper-left, warm rim from the fuse spark, dark metallic body. Do not re-light per expression |
| Pose | the render should already embody the body pose listed below; the CSS transform is the motion layer, so a render that carries the pose simply reads stronger |
| Prohibited | outer glow, halo, baked drop shadow, background plate, per-locale variants, looping frames, any culture-specific hand gesture |

## 3. The face is the brief

For every expression state **eyes · brows · mouth · head angle**. The mark beside the
character is supplementary and small — it may never be the reason an expression is readable.
The hard test is `02-quick-six-no-marks.png`: with marks hidden, a stranger must be able to
tell the six apart.

### Quick six — highest art quality

| id | name | eyes | brows | mouth | body / head |
|---|---|---|---|---|---|
| `care` | Care | softened, lids lowered a little, warm | level, inner ends slightly raised | closed, gently curved — no teeth | leans in and slightly down, settled, a touch smaller |
| `joy` | Joy | wide open, bright, upper lids high | raised, relaxed | open smile, teeth fine here, corners high | buoyant, lifted off the ground, scaled up |
| `laugh` | Laugh | squeezed nearly shut, crescents | high and relaxed | wide open laugh, head back | rocked back ~14°, one side-rock |
| `wow` | Wow | very wide, pupils small, whites visible | high, arched | small open O | recoil back, biggest scale, chin slightly up |
| `celebrate` | Celebrate | bright, squinting with the grin | high | broad open grin, full mischief allowed | airborne, tilted, at its highest lift |
| `support` | Support | steady, open, direct — attentive not happy | **level, never angled down** | closed and firmly set | planted, squared, no lift at all |

### Energy

| id | name | eyes | brows | mouth | body / head |
|---|---|---|---|---|---|
| `proud` | Proud | calm, lids a little lowered, confident | level, settled | closed, small satisfied curve | chest lifted, chin level, upright and still |
| `speechless` | Speechless | wide, unfocused, looking slightly past the viewer | one raised, one level | slightly open, slack — no smile | frozen mid-motion, weight back |

### Warmth

| id | name | eyes | brows | mouth | body / head |
|---|---|---|---|---|---|
| `love` | Love | soft, half-lidded, warm | relaxed, inner ends up | small closed smile | leans in, slightly up, gentle scale |
| `thanks` | Thanks | closed or nearly closed | level, calm | closed, soft | **a real bow** — ~13° forward, lowered |
| `touched` | Touched | glossy, lids lowered, inner corners raised | inner ends raised | relaxed, slightly parted — receiving, not performing | drawn inward, smallest scale, head tipped |
| `withyou` | With you | open, steady, looking at the viewer | level | closed, calm — **never grinning** | stands beside, offset to one side, upright, serious and present |

### Thought / connection

| id | name | eyes | brows | mouth | body / head |
|---|---|---|---|---|---|
| `respect` | Respect | direct, controlled, lids neutral | level, deliberate | closed, firm | upright, still, weight centred. No salute, no culture-specific sign |
| `inspired` | Inspired | open, looking up and slightly off-axis | raised | slightly open, breath caught | rises, chin up, gaze leading the body |
| `curious` | Curious | open, one lid marginally higher, focused | one raised | closed, slight asymmetric curve | **head tilt leads** — ~16°, the whole character following |
| `agree` | Agree | calm, lids relaxed | level | closed, small firm nod-smile | caught mid-nod, chin coming down, weight settled |
| `thinking` | Thinking | one narrowed, looking up-left | one drawn down, one up | closed, pressed slightly to one side | head tipped, weight on one side, still |
| `nostalgia` | Nostalgia | soft, distant focus, lids low | relaxed, inner ends raised | closed, faint wistful curve | turned slightly away, looking back over itself, lowered |

## 4. Serious-emotion safety (§17)

The supplied mascot is mischievous by design — aggressive brows, bared teeth. Six expressions
must be softened enough to sit on a serious but shareable Moment without reading as mocking,
sinister, or delighting in distress:

**`support` · `withyou` · `touched` · `respect` · `speechless` · `nostalgia`** — brows level
or raised, never angled down; mouth closed or relaxed; **no bared teeth**. `celebrate`, `joy`
and `laugh` may use the mascot's natural mischief fully.

No expression may use a gesture whose meaning is culture-specific. The face and body carry
the semantics; the mark only supports.

## 5. Mass (§28–§29) — what the renders must be consistent with

The character is a heavy metal bomb, not a rubber emoji. Motion is implemented as a separate
body-impulse layer and a mass-scaled pressure ring:

| mass | expressions | behaviour | pressure ring |
|---|---|---|---|
| heavy | care, support, touched, withyou, respect, agree, nostalgia, speechless | barely overshoots, lands hard, firm settle (300ms, hard-landing curve) | tightest (1.62×) |
| normal | wow, love, thanks, proud, inspired, curious, thinking | one clean overshoot (360ms) | 1.85× |
| light | joy, laugh, celebrate | may bound once (440ms, springier curve) | widest (2.02×) |

A render that shows the body compressed or lifted should match its mass band — a `heavy`
expression should never look airborne.

## 6. Acceptance

A delivered set is accepted when, with **every mark hidden**:

1. a person who has never seen SYSTEMBOOM can name at least five of the quick six;
2. `support`, `withyou`, `touched` and `respect` read as serious and kind at 40px;
3. no two of the eighteen are confusable at 56px;
4. the set reads on both Deep Cosmos (dark) and Solar Observatory (light);
5. `sm` still reads at 20px in the presence line — which is why `sm` is a head crop.
