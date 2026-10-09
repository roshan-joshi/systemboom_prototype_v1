# UC-MEAL-AI Phase B — Final Evidence Addendum (2026-10-02)

Status: evidence only. No source change in this addendum. Not committed, not pushed. Phase B2 (Open Food Facts) and Phase D (cache) NOT started. Phase B closes only after owner review + ChatGPT re-review.

Working tree under review (uncommitted over e0ef95f): `AGENTS.md`, `prototype-tests/meal-intelligence.js`, `src/app/api/food-facts/route.ts`, `UniversalComposer.tsx`, `domains.tsx`, `data.ts` (+783 / −34).

## 1. Accepted decisions (owner, 2026-10-02)

1. KEEP the three extra safety gates H1 (same-rank calorie disagreement), H2 (identity-negating descriptors), H3 (a LIKELY winner must be the queried food prepared differently and nothing more). Withholding a number beats publishing a wrong one; the recall loss is accepted.
2. LEAVE the variety-specific labeling issue (e.g. noodles → "Noodles, chow mein" published as CONFIDENT) as-is. Scope is not expanded; a later phase may address it (candidate rule: a rank-2 winner carrying its own descriptors is shown as LIKELY, "based on …").
3. KEEP the full fact line: `354 kcal · 20 g protein · 35 g carbs · 14 g fat · per 100 g`. Not shortened; "per 100 g" keeps the fact verifiable.

Accepted limitations: tofu case withheld (not published); group-first USDA names ("Fish, salmon, …") withheld; `pageSize` stays 5; `/api/analyze-meal`'s uncapped `?mock=…:<delayMs>` is out of scope.

## 2. Controlled-marker (client-bundle leak) evidence — raw

Commands (cold `.next`):
```
rm -rf .next
DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 USDA_FDC_API_KEY=TEST_LEAK_MARKER_usda789 npx next build
grep -R -n "TEST_LEAK_MARKER_xyz123" .next/static
grep -R -n "TEST_LEAK_MARKER_usda789" .next/static
grep -R -l "data-sb-meal-estimate" .next/static | head -2     # positive control: grep method works on this bundle
```
Raw results:
```
--- build tail
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

marker build exit: 0
--- grep deepseek marker
grep deepseek exit: 1
--- grep usda marker
grep usda exit: 1
--- positive control (a string known to be in the client bundle)
.next/static/chunks/0-bzr4z6o3ddt.js
positive-control exit: 0
```
Both markers: NOT FOUND (grep exit 1 each). Positive control finds a known client string (exit 0).

## 3. Baseline evidence on FINAL code (fresh run, 2026-10-02)

### tsc
```
tsc exit: 0
```

### eslint (the four changed product files)
```
eslint exit: 0
```

### next build (plain)
```
  Finished TypeScript in 3.1s ...
  Collecting page data using 9 workers ...
  Generating static pages using 9 workers (0/15) ...
  Generating static pages using 9 workers (3/15) 
  Generating static pages using 9 workers (7/15) 
  Generating static pages using 9 workers (11/15) 
✓ Generating static pages using 9 workers (15/15) in 154ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/analyze-meal
├ ƒ /api/food-facts
├ ƒ /api/geocode
├ ƒ /chat
├ ○ /icon.png
├ ƒ /life
├ ƒ /social
├ ƒ /style-lab
├ ƒ /style-lab/celestial
├ ƒ /style-lab/circle
├ ƒ /style-lab/social
└ ƒ /world


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

build exit: 0
```

### social-composer (full raw tail)
```
  ✓ 5. two materially different metadata places, with no user input, leave BOTH recordPlace and the Social place unfabricated (never the first asset, never the last) — the live draft chip never shows a place at all
  ✓ 6. deep-comparing every MediaAsset before and after a full recordPlace-deriving submission shows them byte-for-byte identical — proven on the real asset objects, never UI banner text
  ✓ 7. recordPlace?.value ?? place resolves correctly on a real, directly-typed Moment field (check 4's Moment, where place is cleared but recordPlace survives) — no structural-read/object-widening, no Circle code change needed
  ✓ 8. recordPlace retains the person's own selected value/source even while the current Social choice (cleared) differs from it
  ✓ 9. editing something unrelated to Place carries a real recordPlace through UNCHANGED (schema-dependent — fails without it) and leaves a legacy Moment's recordPlace genuinely absent, place unchanged
  ✓ 10. explicitly touching a legacy Moment's Place creates recordPlace from that action (source: user); Social place follows it too
  ✓ 11. no usable metadata is a normal state — no banner, no error, an empty usable picker, POST works, and leaving Place untouched creates no recordPlace at all; typing one anyway still works correctly
page health
  ✓ zero page errors (0)

social-composer: 140 passed, 0 failed
exit: 0
```

### meal-intelligence (full raw output, 72 checks)
```
1. REAL MEAL PHOTO — client analyzer → /api/analyze-meal (mocked) → normalized MealAIObservation with provenance ai_visual_estimate
  ✓ real photo → settled analysis ({"key":"thali","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:12:59.212Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}}) → suggestion card (true) → posted record with mealAIObservation + a confirmed ai_visual_estimate food item ({"foodItems":[{"name":"Dal bhat","quantity":"one plate","source":"ai_visual_estimate","state":"confirmed"},{"name":"Rice","quantity":"one plate","source":"ai_visual_estimate","state":"confirmed"},{"name":"Chicken curry","quantity":"one bowl","source":"ai_visual_estimate","state":"confirmed"},{"name":"Vegetables","source":"ai_visual_estimate","state":"confirmed"}],"mealAIObservation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:12:59.212Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}})
2. MULTIPLE FOODS — one meal image produces multiple structured food suggestions
  ✓ the suggestion names all four distinct foods (found: "Looks like Dal bhat · Rice · Chicken curry · VegetablesEstimated ~700–900 kcal · ~25–35 g proteinLooks rightAdjust")
3. LOW CONFIDENCE — a low-confidence food remains a hint/suggested state and is not automatically confirmed
  ✓ a low-confidence reading shows only as a hint ({"hint":"Could be a dish","acceptBtn":false}), the record carries confidence "low" (low), and posting without acting creates NO confirmed food item (undefined)
4. NUTRITION RANGE — visual nutrition returns a range + confidence, rejecting exact fabricated precision
  ✓ calories is a real min/max range with no fabricated exact value alongside it (found: {"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"})
5. NUTRITION PROVENANCE — every returned nutrition value preserves its own source
  ✓ every present nutrition value carries source+confidence (found: {"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}})
6. USER CORRECTION — AI suggests Chicken curry; the person corrects it to Paneer curry; the confirmed record says Paneer curry, state corrected
  ✓ Adjust pre-filled 4 suggested rows; the edited item posts as Paneer curry/state "corrected", with no "Chicken curry" left in the confirmed list (found: [{"name":"Dal bhat","quantity":"one plate","source":"ai_visual_estimate","state":"suggested"},{"name":"Rice","quantity":"one plate","source":"ai_visual_estimate","state":"suggested"},{"name":"Paneer curry","quantity":"one bowl","source":"ai_visual_estimate","state":"corrected"},{"name":"Vegetables","source":"ai_visual_estimate","state":"suggested"}])
7. OBSERVATION IMMUTABILITY — the original MealAIObservation from test 6 remains unchanged after that correction
  ✓ the AI's OWN reading still says Chicken curry, untouched by the correction (found: [{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}])
8. VIDEO KEYFRAMES — the video path extracts up to five client keyframes and reaches the Meal analysis boundary (FIX 2: a real uploaded MP4, not a My Media fixture)
  ✓ a REAL video attachment produces a settled, non-empty analysis (found: {"key":"up-1-mealvideomp4","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:13:26.917Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}})
9. VIDEO EXTRACTION FAILURE — a video whose keyframes cannot be extracted settles as a safe failure, never blocks Save, never shows a technical error
  ✓ keyframe extraction failure settles as a logged, safe null ({"key":"vid-terrace","status":"failed","observation":null}), the video stays attached (true), Save stays available (true), and the Meal saves (true)
10. OCR — menu / package label / receipt fixtures each return structured OCR observations, through the SAME Meal analysis call
  ✓ all three OCR fixtures produce their own structured observation (found: {"ocr-menu":true,"ocr-label":true,"ocr-receipt":true})
11. NON-FOOD IMAGE — a non-food image yields no fabricated food observation, and manual Meal creation still works
  ✓ a non-food image settles with zero foods ({"key":"thali","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:13:57.625Z","isFood":false,"foods":[],"confidence":"high"}}), no suggestion card appears (false), and the manually-created Meal carries no fabricated food (undefined)
12. PROVIDER FAILURE — the client receives a safe null, the Meal still saves, no technical error is shown, failures are server-logged only
  ✓ a provider failure settles as a safe null ({"key":"thali","status":"failed","observation":null}), with no technical error text (false) and the Meal still saves (true)
13. AI OFF — analyzeMealMedia never called, /api/analyze-meal never requested, manual Meal creation stays complete; turning AI back ON (same media) does start analysis
  ✓ AI off: zero /api/analyze-meal requests (0), no analyzing/suggestion UI (false), manual save still works (true); AI back on with media already attached: 1 request(s) fired and an analysis does start ({"key":"thali","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:14:21.603Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}})
14. LATE AI RESULT — a manual correction made before a delayed AI result arrives is never overwritten by it
  ✓ the manual entry (["Paneer curry",""]) survives the delayed AI result ({"key":"thali","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:14:27.626Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}}) untouched (["Paneer curry",""]); the confirmed record keeps Paneer curry while the AI's own (different) reading is recorded separately (found: {"foodItems":[{"name":"Paneer curry"}],"mealAIObservation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:14:27.626Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}})
15. MEDIA METADATA IMMUTABILITY — MediaAsset.sourceMetadata is byte-identical before vs. after analysis, correction and save
  ✓ an analysis genuinely ran ({"key":"nyatapola","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:14:32.927Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}}) and the asset's own sourceMetadata is still byte-identical afterward
16. CLIENT KEY LEAK — structural precondition here; the authoritative controlled-marker production-build search runs as its own Phase D shell procedure, not inside this dev-server suite
  ✓ src/app/api/analyze-meal/route.ts exists as the ONE server boundary that reads DEEPSEEK_API_KEY
    (the full test — `DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 npx next build`, then grepping .next/static for that exact marker — was run manually as a Phase D step; see the UC-MEAL-AI report for its NOT FOUND result. It is a separate production build, not part of this dev-server run, so it is not re-executed automatically here.)
17. SERVER PRIVACY PAYLOAD — the exact outgoing DeepSeek request carries no identity/filename/caption/GPS/account data
  ✓ the ?mock=echo boundary answers with the real provider payload, containing no user id/filename/GPS/caption (found: {"status":200,"body":{"observation":null,"_debugProviderPayload":{"model":"deepseek-flash","messages":[{"role":"system","content":"You are a food-recognition assistant analyzing photo(s) for a personal food journal. Identify visible foods/drinks, a likely meal type if the image makes it evident, approximate portion cues (e.g. \"one plate\", \"two pieces\" — never a fabricated exact weight), and any visible text on a menu, package label, or receipt. Respond with ONLY a JSON object, no prose, matching exactly:\n{\n  \"isFood\": boolean,\n  \"foods\": [{\"name\": string, \"canonicalName\": string, \"confidence\": \"high\"|\"medium\"|\"low\", \"portion\"?: string}],\n  \"possibleMealType\"?: \"breakfast\"|\"lunch\"|\"dinner\"|\"snack\",\n  \"ingredients\"?: string[],\n  \"nutrition\"?: {\"calories\"?: {\"min\": number, \"max\": number}, \"protein\"?: {\"min\": number, \"max\": number}, \"carbs\"?: {\"min\": number, \"max\": number}, \"fat\"?: {\"min\": number, \"max\": number}},\n  \"ocr\"?: [{\"kind\": \"menu\"|\"package\"|\"receipt\", \"text\": string}],\n  \"confidence\": \"high\"|\"medium\"|\"low\"\n}\n\"isFood\" is true ONLY if the image meaningfully depicts food, drink, or a meal context. \"name\" is the everyday human name (e.g. \"burger\"); \"canonicalName\" is a normalized, lookup-oriented identity for the same food (e.g. \"sloppy joe sandwich\") — never a brand guess. Never claim a nutrition data source, database, or authority of any kind: any nutrition you provide is always your own visual estimate and nothing else. If the image is not meaningfully food-related, return {\"isFood\": false, \"foods\": [], \"confidence\": \"high\"} and omit every other key. Never invent a fact you cannot actually see. Prefer a min/max range over a single exact number for nutrition — you cannot know exact recipe, hidden oil, or exact weight from a photograph. Never make an allergen safety claim beyond a tentative \"may contain\" when genuinely evidenced. Never provide medical advice or a diagnosis of any kind."},{"role":"user","content":[{"type":"text","text":"Analyze the attached photo(s). Respond ONLY with the JSON object described above — no prose, no markdown, no explanation."},{"type":"image_url","image_url":{"url":"data:image/jpeg;base64,AAAA"}}]}],"response_format":{"type":"json_object"},"max_tokens":4000,"extra_body":{"thinking":{"type":"disabled"}}}}})
PHASE C — automatic Meal category selection
C1–C4. HIGH + FOOD — isFood on the observation; auto-selection with NO Meal pre-selected; visible selected state from the same observation; exactly one request
  ✓ C1: a photo attach with NO category selected analyzes by itself, and the normalized observation carries a real boolean isFood: true (found: {"key":"thali","status":"done","observation":{"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:14:38.528Z","isFood":true,"foods":[{"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"},{"name":"Rice","canonicalName":"steamed rice","confidence":"high","portion":"one plate"},{"name":"Chicken curry","canonicalName":"chicken curry","confidence":"medium","portion":"one bowl"},{"name":"Vegetables","canonicalName":"mixed vegetable tarkari","confidence":"medium"}],"possibleMealType":"dinner","nutritionEstimate":{"calories":{"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"},"protein":{"range":{"min":25,"max":35},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"}})
  ✓ C2: high-confidence food auto-selects Meal — the record pill reads "meal" with no human category tap (found pill: meal)
  ✓ C3: the auto-selection shows through the EXISTING pill styling and the suggestion card carries the SAME observation's foods (found: {"pillText":"MealChange","card":"Looks like Dal bhat · Rice · Chicken curry · VegetablesEstimated ~700–900 kcal · ~25–35 g proteinLooks rightAdjust"})
  ✓ C4: exactly ONE /api/analyze-meal request across attach → auto-select → suggestion render (found 1: ["http://localhost:3210/api/analyze-meal?mock=meal"])
C5–C6. MEDIUM + FOOD — a quiet ask instead of an auto-selection; Yes selects Meal with no second request
  ✓ C5: medium confidence never auto-selects (pill: moment); it asks once — "Looks like a Meal — use it?YesNo" — with Yes/No (true)
  ✓ C6: Yes selects Meal (pill: meal) showing the SAME observation's food ("Looks like Khana setLooks rightAdjust") with still exactly one request (1)
C7. MEDIUM + NO — declining leaves the category alone and the ask does not return
  ✓ C7: No dismisses the ask (asked true → gone true, still gone true), the category stays the normal media default (moment), the photo stays attached (true)
C8. NON-FOOD — isFood false: no category change, no ask, no card, no crash
  ✓ C8: a non-food photo analyzes (isFood: false) and changes nothing — pill moment, no ask/card/hint ({"banner":false,"card":false,"hint":false})
C9. LOW CONFIDENCE — food, but low: no auto-selection, no ask
  ✓ C9: low confidence is never acted on — pill moment, no ask (observation: isFood true, confidence low)
C10. EXPLICIT CHOICE BEFORE THE RESULT — a category the person chose mid-flight is never overridden (checked at response-application time)
  ✓ C10: the HIGH result landed (done) but the person's own Activity choice stands (pill: activity), no ask (null), one request (1)
C11. AI OFF / BACK ON — off: zero requests, zero category changes; on with the same photo attached: analysis fires and auto-selects
  ✓ C11: AI off — 0 requests, pill moment; AI back on with the same photo — analysis fires (1 request, done) and auto-selects (true)
C12. AI FAILURE — a failed analysis on a category-less attach changes nothing and never blocks the post
  ✓ C12: a provider failure settles safely ({"key":"thali","status":"failed","observation":null}), pill moment, no ask (null), no error text (false), the post still lands (true)
C13. ONE-TAP UNDO — tapping the auto-selected Meal pill reverts it, keeps photo + observation, opens no chooser, re-fires nothing, never re-selects itself
  ✓ C13: one tap undoes the auto-selection ({"pill":"moment","chooserOpen":false,"photo":true}), it never re-selects itself (moment), the kept observation re-surfaces on a MANUAL re-select ("Looks like Dal bhat · Rice · Chicken curry · VegetablesEstimated ~700–900 kcal · ~25–35 g proteinLooks rightAdjust"), and the whole lifecycle made exactly one request (1)
C14. EXPLICIT CHOICE DURING FLIGHT — Life Moment chosen while HIGH is in flight stays; its pill still opens the chooser (the undo gesture never leaks onto explicit choices)
  ✓ C14: the HIGH result (done) never overrode the explicit Life Moment (pill: moment), asked nothing (null), and the pill still opens the chooser normally (true)
C15. NO METADATA IS NORMAL — a photo with no EXIF still recognizes and categorizes; zero page errors
  ✓ C15: no metadata, no problem — no review banner (false), recognition ran (done), the category followed the observation (true), zero page errors (0)
PHASE B — real USDA nutrition
B1/B3/B4. USDA ROUTE — a known canonical food returns structured facts with usda provenance and a preserved fdcId
  ✓ B1: a known canonical food search returns structured nutrition (found: {"status":200,"body":{"facts":{"source":"usda","fdcId":2345678,"matchedName":"SLOPPY JOE SANDWICH","nutrition":{"calories":354,"protein":20,"carbs":35,"fat":14},"units":{"calories":"kcal","protein":"g","carbs":"g","fat":"g"},"basis":"per 100 g","retrievedAt":"2026-10-02T10:15:35.091Z","match":"confident"}}}) and, over [wheat-bun sandwich, white-bun sandwich, no-bun, crackers, Cuban], SELECTS fdcId 2706884 "Sloppy joe sandwich, on wheat bun" (found: {"fdcId":2706884,"matchedName":"Sloppy joe sandwich, on wheat bun","kcal":180})
  ✓ B3: the USDA response stores source: "usda" (found: "usda")
  ✓ B4: fdcId is preserved on the normalized facts (found: 2345678)
B2. TWO-FIELD IDENTITY — a recognized food carries an everyday name AND a distinct lookup canonicalName; the card still shows the everyday name
  ✓ B2: "Dal bhat" carries a distinct canonicalName ({"name":"Dal bhat","canonicalName":"dal bhat set","confidence":"high","portion":"one plate"}) and the card keeps the everyday name only ("Looks like Dal bhat · Rice · Chicken curry · VegetablesEstimated ~700–900 kcal · ~25–35 g proteinLooks rightAdjust")
B5. NO FABRICATED AUTHORITY — a raw provider payload claiming 'USDA FoodData Central' normalizes to ai_estimate, through the REAL normalization path
  ✓ B5: the fabricated attribution is stripped by normalization — every nutrition source is "ai_estimate", never "usda"/"USDA FoodData Central" (found: {"schemaVersion":1,"providerModel":"deepseek-flash","analyzedAt":"2026-10-02T10:15:38.711Z","isFood":true,"foods":[{"name":"burger","canonicalName":"sloppy joe sandwich","confidence":"high"}],"nutritionEstimate":{"calories":{"range":{"min":450,"max":750},"unit":"kcal","source":"ai_estimate","confidence":"high"},"protein":{"range":{"min":22,"max":38},"unit":"g","source":"ai_estimate","confidence":"medium"}},"confidence":"high"})
B6/B7. USDA MISS — one lookup per useful food, every one missed, the ai_estimate fallback is used, and it stays a range (no fabricated exact number)
  ✓ B6: exactly 4 lookups — one per useful food — all missed (["miss","miss","miss","miss"], 4 requests) and the posted fallback nutrition carries source "ai_estimate" (found: {"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"})
  ✓ B7: the ai_estimate fallback remains a true range with no exact value beside it (found: {"range":{"min":700,"max":900},"unit":"kcal","source":"ai_estimate","confidence":"medium"})
B8/B9/B10. RENDERING + RECORD PURITY — every useful food gets its OWN factual line; the AI estimate stays visibly approximate; facts never leak into the posted observation or confirmed items
  ✓ B8: one factual line per useful food (4), the Dal bhat line carries its own full figures + basis, never a tilde or "Estimated", and names its match identity — USDA entry 2345678, classified "confident" (found: "Dal bhat: 354 kcal · 20 g protein · 35 g carbs · 14 g fat · per 100 g")
  ✓ B9: the AI estimate stays visibly approximate in its own line (found: "Estimated ~700–900 kcal · ~25–35 g protein")
  ✓ B10: with facts FOUND and the Meal posted, the observation stays untouched by them (no usda/fdcId/354; nutrition still ai_estimate: ["ai_estimate","ai_estimate"]) and confirmed items keep food-item provenance (["ai_visual_estimate","ai_visual_estimate","ai_visual_estimate","ai_visual_estimate"])
B11. USDA KEY SERVER-ONLY — structural precondition; the authoritative dual controlled-marker production-build grep runs as its own shell step
  ✓ B11: src/app/api/food-facts/route.ts exists as the ONE server boundary reading process.env.USDA_FDC_API_KEY (and reads no NEXT_PUBLIC_ variable)
    (the full test — `DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 USDA_FDC_API_KEY=TEST_LEAK_MARKER_usda789 npx next build`, then grepping .next/static for BOTH exact markers — runs as a separate production-build step; see the Phase B report for its NOT FOUND results.)
B12. USDA FAILURE — every lookup fails quietly; the estimate fallback still renders and the Meal still posts
  ✓ B12: all 4 lookups failed quietly (["failed","failed","failed","failed"]), the card still shows the estimate with no fact and no error text ({"card":true,"est":"Estimated ~700–900 kcal · ~25–35 g protein","fact":false,"err":false}), and the Meal posts (true)
B13. AI FAILURE — no recognition means ZERO facts requests on the wire, start to post; the manual Meal stays complete
  ✓ B13: AI failed → zero /api/food-facts requests across the entire flow (0) and a still-empty log at the end ([]); the hand-typed Meal posts intact ([{"name":"Hand-written momo"}])
B14. BOTH UNAVAILABLE — AI fails and USDA fails; the manual path is untouched (network-level proof)
  ✓ B14: with both unavailable there are zero facts requests (0), an empty log at the end ([]), zero technical errors (false), and the Meal still saves (true)
PHASE B CORRECTION — semantic selection + confidence gate
  ✓ T1: query "banana" over [dehydrated/powder, raw, baked] selects "Banana, raw" — 97 kcal, never the 346 kcal powder (found: {"fdcId":2709224,"matchedName":"Banana, raw","kcal":97})
  ✓ T2: query "spinach" over [creamed, raw, canned] selects "Spinach, raw" — 27 kcal, never the 90 kcal creamed (found: {"fdcId":2709614,"matchedName":"Spinach, raw","kcal":27})
  ✓ T3: query "banana powder" over [raw, baked, dehydrated/powder] selects the powder variant — the correction is NOT "always prefer raw" (found: {"fdcId":173945,"matchedName":"Bananas, dehydrated, or banana powder"})
  ✓ T4: query "creamed spinach" over [raw, canned, creamed] selects "Spinach, creamed" (found: {"fdcId":2709628,"matchedName":"Spinach, creamed"})
  ✓ T5: semantics beats completeness — the correct raw banana (3 of 4 nutrients, no fat) wins over the all-4-nutrient dehydrated powder, and its missing fat is NOT borrowed (found: {"fdcId":2709224,"kcal":97})
  ✓ T6: no confident winner → the route answers uncertain with NO facts ({"facts":null,"uncertain":true}); the page logs 4 uncertain lookups, renders 4 "No reliable nutrition match yet" lines and ZERO fact lines ({"factLines":0,"uncertain":["Dal bhat: No reliable nutrition match yet","Rice: No reliable nutrition match yet","Chicken curry: No reliable nutrition match yet","Vegetables: No reliable nutrition match yet"],"estimate":"Estimated ~700–900 kcal · ~25–35 g protein"}); the AI estimate path stays and the record carries no usda ("ai_estimate")
  ✓ T7: a usable candidate with a minor qualifier is published WITH its qualifier — route: {"fdcId":2709225,"match":"likely","basedOn":"baked banana"}; page lines: ["Dal bhat: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g · based on frozen dal bhat set","Rice: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g · based on frozen rice","Chicken curry: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g · based on frozen chicken curry","Vegetables: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g · based on frozen mixed vegetable tarkari"]
  ✓ T8: an exact common-name match is a clean fact — no qualifier, no extra UI — route: {"fdcId":2709224,"match":"confident"}; page: "Dal bhat: 120 kcal · 4 g protein · 20 g carbs · 2 g fat · per 100 g"
G1–G3. GATES FOUND BY THE LIVE BASKET — ambiguous same-rank candidates, negating descriptors, composed winners
  ✓ G1: "egg" over [white 55 / whole 148 / yolk 334 / Benedict 288 kcal] is AMBIGUOUS — no number is published ({"facts":null,"uncertain":true}); the control, two near-identical sandwich candidates (180 vs 185 kcal), stays confident (confident)
  ✓ G2: "bacon" never publishes "Bacon, meatless" (309 kcal) as bacon ({"facts":null,"uncertain":true}); the control, query "meatless bacon", selects it (fdcId 172439, confident)
  ✓ G3: "white rice" never publishes "Rice, white, cooked, glutinous" (96 kcal) as likely — it carries its own descriptor ({"facts":null,"uncertain":true}); the control, "Banana, baked" for "banana", is still likely "baked banana"
G4–G7 + Q1–Q4. REVIEW-DRIVEN — category-first names, singular/plural folding, 'cooked' beside a method, unique keys, tie-break order, agreement boundaries, stop/neutral words, missing preparation
  ✓ G4: no group-first-name guess — "tofu" over the real page [Tofu yogurt, Tofu fried, Mayonnaise made with tofu, Soup, "Fish, tofu, and vegetables, tempura" 177 kcal] publishes NOTHING, never the fish-tempura dish ({"facts":null,"uncertain":true}); control: "sandwich" over [sloppy joe…, Crackers sandwich, Cuban] publishes nothing ({"facts":null,"uncertain":true})
  ✓ G5: singular and plural meet at one stem — "peach" selects "Peaches, yellow, raw" (fdcId 169928, confident) instead of letting "Peach, frozen" win as likely; "peaches" selects "Peach, raw" (fdcId 9000402, confident)
  ✓ G6: USDA's "cooked" beside a named method is implied, not a second preparation — "fried chicken" over "Chicken, fried, cooked" is confident with no "based on cooked chicken" ({"match":"confident"}); "fried egg" over "Egg, whole, cooked, fried" is confident (confident)
  ✓ G7: two foods both named "Curry" (lookups "chicken curry" / "lentil curry") render 2 lines with 0 duplicate-key warnings
  ✓ Q1: the person's own preparation must be honoured — "banana powder" over a page with NO powder variant publishes nothing (never raw banana as likely): {"facts":null,"uncertain":true}
  ✓ Q2: stop words and the neutral words (the / a / fresh / raw / plain, plural) never change the food — every query selects "Banana, raw": [["the banana",2709224,"confident"],["a banana",2709224,"confident"],["fresh banana",2709224,"confident"],["raw banana",2709224,"confident"],["plain banana",2709224,"confident"],["Bananas",2709224,"confident"]]
  ✓ Q3: ties break in the specified order — token overlap beats completeness and order (the terse "Rice, white" 9000602), completeness beats order (the 4-nutrient "Rice, brown" 9000612), then USDA order (9000621)
  ✓ Q4: the agreement guard's boundaries — 100 vs 124 kcal agree (confident), 100 vs 130 do not ({"facts":null,"uncertain":true}), and near-zero foods never trip it: 5 vs 20 kcal (confident)
R1–R6. REGRESSION GUARDS — mid-flight guarantees, Atwater/kJ extraction, log reset, polluted keys, superseded generations
  ✓ R1: removing EVERY attached photo mid-flight retires the analysis — control: 4 lookups fired; after removal: 0 requests, log [], 0 thumbs
  ✓ R2: turning Smart Assist OFF mid-flight stops the lookups AND the auto-selection — control 4; after OFF: 0 requests, log [], pill moment
  ✓ R3: energy is read from the Atwater rows (957/958 KCAL → 26.6) and a kJ-only row is NEVER taken as kcal nor converted (calories undefined, protein 2.85 kept, no "111" anywhere)
  ✓ R4: the facts log resets per analysis — 8 entries after the first analysis; after a second one in the same page session, 8 (must be exactly 8 — accumulation would give 16)
  ✓ R5: foods literally named constructor / toString / hasOwnProperty / __proto__ render safely (own-property reads only): card present (true), 0 fact lines, 0 page errors
  ✓ R6: a superseded generation's late (aborted) lookups never write into the new analysis's log — 8 entries, statuses ["start","found"] (a leak would show 4 stray "failed")
page health
  ✓ (informational only — see individual failures above for the missing-implementation reasons)

meal-intelligence: 72 passed, 0 failed
exit: 0
```

## 4. T1–T8 failing-first (raw, against the pre-fix selection)

Same suite run against the OLD completeness-first selection; result line `52 passed, 9 failed` (T1–T8 + B8). R1–R6 passed immediately by design (regression guards for already-fixed defects).
```
  ✗ B8: one factual line per useful food (4), the Dal bhat line carries its own full figures + basis, never a tilde or "Estimated", and names its match identity — USDA entry 2345678, classified "null" (found: "Dal bhat: 354 kcal · 20 g protein · 35 g carbs · 14 g fat · per 100 g")
  ✗ T1: query "banana" over [dehydrated/powder, raw, baked] selects "Banana, raw" — 97 kcal, never the 346 kcal powder (found: {"fdcId":173945,"matchedName":"Bananas, dehydrated, or banana powder","kcal":346})
  ✗ T2: query "spinach" over [creamed, raw, canned] selects "Spinach, raw" — 27 kcal, never the 90 kcal creamed (found: {"fdcId":2709628,"matchedName":"Spinach, creamed","kcal":90})
  ✗ T3: query "banana powder" over [raw, baked, dehydrated/powder] selects the powder variant — the correction is NOT "always prefer raw" (found: {"fdcId":2709224,"matchedName":"Banana, raw"})
  ✗ T4: query "creamed spinach" over [raw, canned, creamed] selects "Spinach, creamed" (found: {"fdcId":2709614,"matchedName":"Spinach, raw"})
  ✗ T5: semantics beats completeness — the correct raw banana (3 of 4 nutrients, no fat) wins over the all-4-nutrient dehydrated powder, and its missing fat is NOT borrowed (found: {"fdcId":173945,"kcal":346,"fat":1.81})
  ✗ T6: no confident winner → the route answers uncertain with NO facts ({"facts":{"source":"usda","fdcId":173945,"matchedName":"Bananas, dehydrated, or banana powder","nutrition":{"calories":346,"protein":3.89,"carbs":88.3,"fat":1.81},"units":{"calories":"kcal","protein":"g","carbs":"g","fat":"g"},"basis":"per 100 g","retrievedAt":"2026-10-02T03:46:40.367Z"}}); the page logs 4 uncertain lookups, renders 0 "No reliable nutrition match yet" lines and ZERO fact lines ({"factLines":4,"uncertain":[],"estimate":"Estimated ~700–900 kcal · ~25–35 g protein"}); the AI estimate path stays and the record carries no usda ("ai_estimate")
  ✗ T7: a usable candidate with a minor qualifier is published WITH its qualifier — route: {"fdcId":2709225}; page lines: ["Dal bhat: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g","Rice: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g","Chicken curry: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g","Vegetables: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g"]
  ✗ T8: an exact common-name match is a clean fact — no qualifier, no extra UI — route: {"fdcId":2709224}; page: "Dal bhat: 120 kcal · 4 g protein · 20 g carbs · 2 g fat · per 100 g"
meal-intelligence: 52 passed, 9 failed
```

## 5. R1–R6 mutation proof (raw)

Each guard was broken by mutating the guarded code; the targeted guard must FAIL. Files restored and sha256-verified identical. Current tree sha256 (first 16): UniversalComposer.tsx `683fda043586e657`, route.ts `824e58b89c0b19c1`, domains.tsx `7f7658bf91979289` — identical to the "restored" hashes below.
```
CONTROL (unmutated): {'R1': 'PASS', 'R2': 'PASS', 'R3': 'PASS', 'R4': 'PASS', 'R5': 'PASS', 'R6': 'PASS'}
MUTATION R1: removing every attached photo no longer retires the in-flight analysis
   targeted guard R1: STILL PASSES (NOT CAUGHT)   | other five guards: all pass
   ✓ R1: removing EVERY attached photo mid-flight retires the analysis — control: 4 lookups fired; after removal: 0 requests, log [], 0 thumbs
   restored UniversalComposer.tsx: sha256 IDENTICAL (683fda043586e657)
MUTATION R2: Smart Assist OFF mid-flight no longer aborts the analysis, and neither late gate re-checks the switch
   targeted guard R2: FAILS (caught)   | other five guards: all pass
   ✗ R2: turning Smart Assist OFF mid-flight stops the lookups AND the auto-selection — control 4; after OFF: 4 requests, log [{"canonicalName":"dal bhat set","status":"start"},{"canonicalName":"steamed rice","status":"start"},{"canonicalName":"chicken curry","status":"start"},{"canonicalName":"mixed v
   restored UniversalComposer.tsx: sha256 IDENTICAL (683fda043586e657)
MUTATION R3: energy extraction loses the Atwater rows AND the KCAL-unit filter (a kJ-only row is taken as kcal)
   targeted guard R3: FAILS (caught)   | other five guards: all pass
   ✗ R3: energy is read from the Atwater rows (957/958 KCAL → undefined) and a kJ-only row is NEVER taken as kcal nor converted (calories 111, protein 2.85 kept, no "111" anywhere)
   restored route.ts: sha256 IDENTICAL (824e58b89c0b19c1)
MUTATION R4: the facts log is created once and never reset per analysis (accumulates)
   targeted guard R4: FAILS (caught)   | other five guards: some fail: ['R6']
   ✗ R4: the facts log resets per analysis — 8 entries after the first, 16 (not 16) after a second analysis in the same page session
   restored UniversalComposer.tsx: sha256 IDENTICAL (683fda043586e657)
MUTATION R5: the render reads facts[k] with a bare bracket (inherited Object members reachable)
   targeted guard R5: FAILS (caught)   | other five guards: all pass
   ✗ R5: foods literally named constructor / toString / hasOwnProperty / __proto__ render safely (own-property reads only): card present (false), 0 fact lines, 1 page errors — TypeError: Cannot read properties of undefined (reading 'calories')
   restored domains.tsx: sha256 IDENTICAL (7f7658bf91979289)
MUTATION R6: a superseded generation's aborted lookups write 'failed' into the new analysis's log
   targeted guard R6: FAILS (caught)   | other five guards: all pass
   ✗ R6: a superseded generation's late (aborted) lookups never write into the new analysis's log — 12 entries, statuses ["failed","start","found"] (a leak would show 4 stray "failed")
   restored UniversalComposer.tsx: sha256 IDENTICAL (683fda043586e657)
MUTATION R1b: BOTH layers defending remove-all are removed: the abort/retire AND the response-application mediaUnchanged gate on the lookups
   targeted guard R1b: FAILS (caught)   | other five guards: all pass
   ✗ R1: removing EVERY attached photo mid-flight retires the analysis — control: 4 lookups fired; after removal: 4 requests, log [{"canonicalName":"dal bhat set","status":"start"},{"canonicalName":"steamed rice","status":"start"},{"canonicalName":"chicken curry","status":"start"},{"canonicalName":"mix
   restored UniversalComposer.tsx: sha256 IDENTICAL (683fda043586e657)
```

Honest reading: R2–R6 each caught by their guard. **R1 is defended by two independent layers** — removing only one layer is NOT caught (the other still holds, which is the intent: "STILL PASSES" on the single-layer mutation); removing both (R1b) IS caught. The R4 failure text prints "16 (not 16)" — a cosmetic message-wording bug in the test, the assertion itself (8 vs 16) is correct.

## 6. Live USDA proof (real FDC, key from `.env.local`)

| Query | Selected fdcId / name | kcal per 100 g | Verdict · reason |
|---|---|---|---|
| banana | 2709224 "Banana, raw" | 97 | CONFIDENT · exact (beat 173945 powder 346 and "Banana, baked") |
| spinach | 2709614 "Spinach, raw" | 27 | CONFIDENT · exact (beat "Spinach, creamed" 90) |
| banana powder | 173945 "Bananas, dehydrated, or banana powder" | 346 | CONFIDENT · exact — the processed variant, so the fix is not "always prefer raw" |
| creamed spinach | 2709628 "Spinach, creamed" | 90 | CONFIDENT · exact |
| sloppy joe sandwich | 2706884 "Sloppy joe sandwich, on wheat bun" | 180 | CONFIDENT · common name, no preparation |

Full candidate lists, per-candidate rank/overlap/position, and the real-route JSON:
```

================ "banana" ================
USDA candidates, in USDA's own order:
  #1 fdcId=173945  "Bananas, dehydrated, or banana powder"
        -> 4 common name, DIFFERING preparation | overlap 0.5 | completeness 7 | sorted position 2
  #2 fdcId=2709225  "Banana, baked"
        -> 4 common name, DIFFERING preparation | overlap 0.5 | completeness 7 | sorted position 3
  #3 fdcId=2709224  "Banana, raw"
        -> 1 exact | overlap 1 | completeness 7 | sorted position 1
  #4 fdcId=2709200  "Banana chips"
        -> 5 no common-name match | overlap 0.5 | completeness 7 | sorted position 4
  #5 fdcId=2709342  "Banana nectar"
        -> 5 no common-name match | overlap 0.5 | completeness 7 | sorted position 5
SELECTED: fdcId=2709224 "Banana, raw" | verdict CONFIDENT | reason: exact name
THE REAL ROUTE (POST /api/food-facts, no mock) -> {"fdcId":2709224,"matchedName":"Banana, raw","match":"confident","nutrition":{"calories":97,"protein":0.74,"carbs":22.71,"fat":0.28},"basis":"per 100 g"}

================ "spinach" ================
USDA candidates, in USDA's own order:
  #1 fdcId=2709628  "Spinach, creamed"
        -> 4 common name, DIFFERING preparation | overlap 0.5 | completeness 7 | sorted position 2
  #2 fdcId=2709614  "Spinach, raw"
        -> 1 exact | overlap 1 | completeness 7 | sorted position 1
  #3 fdcId=2709629  "Spinach souffle"
        -> 5 no common-name match | overlap 0.5 | completeness 7 | sorted position 4
  #4 fdcId=170494  "Spinach souffle"
        -> 5 no common-name match | overlap 0.5 | completeness 7 | sorted position 5
  #5 fdcId=1999632  "Spinach, baby"
        -> 4 common name, DIFFERING preparation | overlap 0.5 | completeness 7 | sorted position 3
SELECTED: fdcId=2709614 "Spinach, raw" | verdict CONFIDENT | reason: exact name
THE REAL ROUTE (POST /api/food-facts, no mock) -> {"fdcId":2709614,"matchedName":"Spinach, raw","match":"confident","nutrition":{"calories":27,"protein":2.85,"carbs":2.41,"fat":0.62},"basis":"per 100 g"}

================ "banana powder" ================
USDA candidates, in USDA's own order:
  #1 fdcId=173945  "Bananas, dehydrated, or banana powder"
        -> 1 exact | overlap 1 | completeness 7 | sorted position 1
  #2 fdcId=167806  "Baobab powder"
        -> 5 no common-name match | overlap 0.3333 | completeness 7 | sorted position 3
  #3 fdcId=169656  "Sugars, powdered"
        -> 5 no common-name match | overlap 0.3333 | completeness 7 | sorted position 4
  #4 fdcId=170461  "Tomato powder"
        -> 5 no common-name match | overlap 0.3333 | completeness 7 | sorted position 5
  #5 fdcId=2709225  "Banana, baked"
        -> 4 common name, DIFFERING preparation | overlap 0.3333 | completeness 7 | sorted position 2
SELECTED: fdcId=173945 "Bananas, dehydrated, or banana powder" | verdict CONFIDENT | reason: exact name
THE REAL ROUTE (POST /api/food-facts, no mock) -> {"fdcId":173945,"matchedName":"Bananas, dehydrated, or banana powder","match":"confident","nutrition":{"calories":346,"protein":3.89,"carbs":88.3,"fat":1.81},"basis":"per 100 g"}

================ "sloppy joe sandwich" ================
USDA candidates, in USDA's own order:
  #1 fdcId=2706884  "Sloppy joe sandwich, on wheat bun"
        -> 2 common name, no preparation | overlap 0.6 | completeness 7 | sorted position 1
  #2 fdcId=2706883  "Sloppy joe sandwich, on white bun"
        -> 2 common name, no preparation | overlap 0.6 | completeness 7 | sorted position 2
  #3 fdcId=2706378  "Sloppy joe, no bun"
        -> 5 no common-name match | overlap 0.4 | completeness 7 | sorted position 3
  #4 fdcId=2708171  "Crackers, sandwich"
        -> 5 no common-name match | overlap 0.25 | completeness 7 | sorted position 4
  #5 fdcId=2706973  "Cuban sandwich"
        -> 5 no common-name match | overlap 0.25 | completeness 7 | sorted position 5
SELECTED: fdcId=2706884 "Sloppy joe sandwich, on wheat bun" | verdict CONFIDENT | reason: common name, no preparation
THE REAL ROUTE (POST /api/food-facts, no mock) -> {"fdcId":2706884,"matchedName":"Sloppy joe sandwich, on wheat bun","match":"confident","nutrition":{"calories":180,"protein":11.85,"carbs":18.43,"fat":6.44},"basis":"per 100 g"}

================ "creamed spinach" ================
USDA candidates, in USDA's own order:
  #1 fdcId=2709628  "Spinach, creamed"
        -> 1 exact | overlap 1 | completeness 7 | sorted position 1
  #2 fdcId=170941  "Babyfood, vegetables, spinach, creamed, strained"
        -> 5 no common-name match | overlap 0.4 | completeness 7 | sorted position 3
  #3 fdcId=2708773  "Ravioli, cheese and spinach-filled, with cream sauce"
        -> 5 no common-name match | overlap 0.1429 | completeness 7 | sorted position 5
  #4 fdcId=2709614  "Spinach, raw"
        -> 4 common name, DIFFERING preparation | overlap 0.5 | completeness 7 | sorted position 2
  #5 fdcId=2709629  "Spinach souffle"
        -> 5 no common-name match | overlap 0.3333 | completeness 7 | sorted position 4
SELECTED: fdcId=2709628 "Spinach, creamed" | verdict CONFIDENT | reason: exact name
THE REAL ROUTE (POST /api/food-facts, no mock) -> {"fdcId":2709628,"matchedName":"Spinach, creamed","match":"confident","nutrition":{"calories":90,"protein":2.39,"carbs":6.11,"fat":6.09},"basis":"per 100 g"}
```

## 7. Fact-line UI strings (exact)

- CONFIDENT: `Dal bhat: 354 kcal · 20 g protein · 35 g carbs · 14 g fat · per 100 g`
- LIKELY (verbatim from suite T7's rendered page): `Dal bhat: 150 kcal · 5 g protein · 22 g carbs · 4 g fat · per 100 g · based on frozen dal bhat set` — the `based on <short phrase>` suffix is the only addition.
- UNCERTAIN (no number): `Dal bhat: No reliable nutrition match yet` — muted, `data-sb-food-fact-uncertain`; the AI's own `Estimated ~700–900 kcal · ~25–35 g protein` line stays separate and visibly approximate.

## 8. Owner browser test plan B1–B4 — PENDING OWNER (not simulated)

Prereq: server running with real `DEEPSEEK_API_KEY` + `USDA_FDC_API_KEY`; open `/world`, Smart Assist ON, no `?mockai` / `?mockfacts`.

- **B1** Attach a real photo of a banana (or a plain food). Expect: Meal auto-selects (if high confidence), a fact line reads `Banana: 97 kcal · … · per 100 g` — NOT a dehydrated/powder figure; no "USDA FoodData Central" wording in the AI estimate.
- **B2** Attach a mixed dish (e.g. dal bhat). Expect: per-food lines are either a clean fact, a fact with `based on …`, or `No reliable nutrition match yet`; the separate `Estimated ~…` line stays visibly approximate; never one ambiguous number.
- **B3** Turn Smart Assist OFF, attach a photo. Expect: zero network calls to `/api/analyze-meal` and `/api/food-facts` (DevTools Network); Meal can be chosen and posted by hand; Save never waits.
- **B4** Remove all photos (or turn Assist OFF) mid-analysis. Expect: no late fact lines appear, no stale auto-selection, no console errors; post what you typed.

Pass criteria for all four: no AI badge/sparkle/model name; every automatic default visible and undoable (one tap on an auto-selected Meal pill reverts); 0 page errors.
