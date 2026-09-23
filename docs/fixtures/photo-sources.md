# SYSTEMBOOM Social — fixture photography sources

> These photographs represent **fictional prototype identities** and do not imply
> endorsement or actual SYSTEMBOOM membership. Each persona's name, city, birth
> data, relationships, Moments and Life data are invented fixture data and imply
> nothing about the photographed individual. All imagery is stored locally under
> `public/mock/social/` for an offline design prototype and is not redistributed.

The authoritative per-file manifest (every place, event, document and portrait image,
with source URL, creator and licence) is **`public/mock/social/CREDITS.md`** and its
machine-readable twin `public/mock/social/credits.json`. This file summarises the
human cast used to evaluate the Social experience as a believable global network.

## Human cast — the Italian social circle (Phase 4.4-A owner fixture add-on)

| File | Persona (fictional) | Fixture id | Age band | Source (CC0) | Creator |
|---|---|---|---|---|---|
| `cast/giulia-bianchi.jpg` | Giulia Bianchi (owner, u-demo-001) | `u-demo-001` | 30–35 | Brunette woman near brick wall (Unsplash).jpg (crop of `cast-nadia.jpg`) | Martin Miranda martinmiranda |
| `cast/sofia-romano.jpg` | Sofia Romano | `p-asha` | 30–35 | Brunette woman portrait (Unsplash).jpg (crop of `cast-hannah.jpg`) | Christopher Campbell chrisjoelcampbell |
| `cast/elena-ricci.jpg` | Elena Ricci | `p-sunita` | 30–35 | Dark-haired woman by a tree (Unsplash).jpg (crop of `cast-sofia.jpg`) | Allef Vinicius seteales |
| `cast/chiara-conti.jpg` | Chiara Conti | `p-prakash` | 25–30 | Mother Nature, Summer (Unsplash).jpg (crop of `cast-grace.jpg`) | Autumn Goodman auttgood |
| `cast/luca-rinaldi.jpg` | Luca Rinaldi | `p-bikash` | 30–35 | Stockholm man with headphones (Unsplash).jpg (crop of `cast-theo.jpg`) | Yingchou Han hyingchou |
| `cast/federico-castelbarco.jpg` | Federico Alessandro Castelbarco Visconti | `p-krishna` | 30–35 | Man vanguard glasses outdoors (Unsplash).jpg (crop of `cast-rory.jpg`) | Seth Doyle sethdoylee |

Every fixture adult is 20–35 in the prototype's September 2026; the bands above are stated coarsely on
purpose — exact birth data stays inside the fixture and the Life privacy model (visitors see a band).

Fixtures WITHOUT a portrait file deliberately exercise the initials fallback, which is a first-class,
tested part of the identity system: Marco Bellini (MB), Matteo Gallo (MG), Aurora Ferrari (AF), Andrea
Costa (AC), Camilla Greco (CG), Francesca Marino (FM), Martina Moretti (MM), Beatrice Esposito (BE),
Alice Lombardi (AL) and "M". Initials are unique across the circle.

### Photo assets still required

The owner asked that MOST of the circle carry a real photo. Only six suitable portraits exist locally
(licensed, adult, reading 20–35). Nothing was downloaded or scraped for this pass. To finish the cast,
supply **nine** licensed portraits (CC0 / CC BY, or owner-cleared) of clearly adult people who read as
20–35 — ideally six women and three men, natural light, not fashion/glamour, face-centred with room
for a square crop — one each for: Marco Bellini, Matteo Gallo, Andrea Costa (men); Aurora Ferrari,
Camilla Greco, Francesca Marino, Martina Moretti, Beatrice Esposito, Alice Lombardi (women). Each drops
in as `public/mock/social/cast/<first-last>.jpg` plus one `avatar:` line in `social/data.ts`.

Retired from the cast: `cast-marcus.jpg`, `cast-walt.jpg` (read older than the 20–35 circle),
`face-portrait.jpg` (now only the m-face Moment photograph), `face-portrait-man.jpg` (unused). They stay
on disk with their credits.

The earlier Nepali and US/UK persona names (Maya Rai, Asha Gurung, …, Sofia Marchetti) are superseded;
stable fixture ids are unchanged (see AGENTS.md, Phase 4.4-A owner fixture add-on).

## Sourcing rules honoured

- Only imagery whose licence and source can be verified and documented locally.
- Every cast portrait is a real photograph of a clearly adult (18+) subject.
- No minors or minor-looking subjects appear in the cast.
- No sexualised or model-only/glamour imagery; everyday adults across genders, ages,
  appearances and contexts, so the product never resembles a dating app or catalogue.
- Portraits are the person; World Walls (covers) are place/environment/memory; Moment
  media are events — three distinct image roles, never conflated.
