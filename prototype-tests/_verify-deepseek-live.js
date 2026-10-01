#!/usr/bin/env node
/**
 * UC-MEAL-AI — FIX 3 (Phase 3 review) + the 2026-10-01 one-shot fix: a MANUAL, ONE-OFF proof
 * that the real DeepSeek API is reachable and genuinely returns usable vision JSON, using the
 * EXACT same request shape `src/app/api/analyze-meal/route.ts` sends in production: model
 * `deepseek-flash`, baseURL `https://api.deepseek.com`, the `openai` SDK, thinking disabled.
 *
 * Every other UC-MEAL-AI check (`meal-intelligence.js`, all 17 capability tests) uses the
 * `?mock=` seam and NEVER calls DeepSeek for real — mocking proves the WIRING; this script is
 * the separate, deliberate proof that the actual INTEGRATION (a real key, a real network call,
 * a real model) also works.
 *
 * ⚠️  THIS MAKES ONE REAL, BILLED CALL TO THE DEEPSEEK API using whatever key is in your
 * .env.local. It is NOT part of `meal-intelligence.js`, not run by any npm script, not wired
 * into CI, and not invoked by anything else in this repository — it only runs when a developer
 * runs it on purpose:
 *
 *     node prototype-tests/_verify-deepseek-live.js
 *     VERIFY_IMAGE=/absolute/path/to/some-other-photo.jpg node prototype-tests/_verify-deepseek-live.js
 *
 * Requires a REAL secret already in .env.local:
 *     DEEPSEEK_API_KEY=sk-...
 *
 * 2026-10-01 root cause + fix, for context: a prior run with `max_tokens: 300` and no explicit
 * thinking control returned `finish_reason: "length"` with `content: ""` — `deepseek-flash`
 * defaults to "thinking mode" and spent the ENTIRE 300-token budget on the hidden
 * `reasoning_content` field, leaving nothing for the actual JSON answer (proven:
 * `usage.completion_tokens === usage.completion_tokens_details.reasoning_tokens === 300`).
 * Fixed by sending `extra_body: { thinking: { type: "disabled" } }` and raising `max_tokens`
 * to 800 (now that no budget is lost to reasoning).
 *
 * SUCCESS looks like:
 *     DeepSeek reachable: YES
 *     finish_reason: stop
 *     reasoning_tokens: 0 (or absent)
 *     completion_tokens: <well under 800>
 *     raw content: {"foods":[{"name":"...", ...}], "nutritionEstimate": {...}, ...}
 *     ✓ N food(s) identified — the real DeepSeek API answered with a well-formed JSON object.
 *   (exit code 0)
 *
 * FAILURE looks like (still reachable, but no usable content — reported, never thrown):
 *     DeepSeek reachable: YES
 *     finish_reason: length  (or another non-"stop" value)
 *     completion_tokens: <at or near max_tokens>
 *     reasoning_tokens: <non-zero — thinking fired despite extra_body>
 *     raw content: "" (or an unparseable string, printed verbatim)
 *     ✗ FAILED — no usable JSON content returned (see fields above)
 *   (exit code 1)
 *
 * A hard network/auth/billing failure (never reached a completion at all) looks like:
 *     DeepSeek reachable: NO
 *     <the actual error DeepSeek/the SDK returned — e.g. 401 or 402>
 *   (exit code 1)
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

/** Fix 4 — some providers wrap JSON in a markdown fence even under `response_format:
 *  json_object` and an explicit "no markdown" instruction. Strip it before parsing. */
function stripMarkdownFence(s) {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1].trim() : trimmed;
}

/**
 * 2026-10-01 fix — same conversion as route.ts's `toConfidence`: DeepSeek returns confidence
 * as a NUMBER (e.g. 0.9, 0.55) in real responses, not the "high"|"medium"|"low" enum the
 * prompt asks for. Accepts either shape.
 */
function toConfidence(v) {
  if (v === "high" || v === "medium" || v === "low") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v >= 0.8 ? "high" : v >= 0.5 ? "medium" : "low";
  return undefined;
}

/** Applies `toConfidence` to every confidence field in a parsed response, mirroring exactly
 *  what route.ts's `normalizeProviderOutput` does to food items / nutrition values / the
 *  top-level observation — so this script's printed output matches what production would
 *  actually store, not just the provider's raw (sometimes numeric) values. */
function normalizeConfidences(parsed) {
  const foods = Array.isArray(parsed.foods) ? parsed.foods.map((f) => ({ ...f, confidence: toConfidence(f.confidence) ?? "low" })) : parsed.foods;
  let nutritionEstimate = parsed.nutritionEstimate;
  if (nutritionEstimate && typeof nutritionEstimate === "object") {
    nutritionEstimate = {};
    for (const key of ["calories", "protein", "carbs", "fat"]) {
      const v = parsed.nutritionEstimate[key];
      if (v && typeof v === "object") nutritionEstimate[key] = { ...v, confidence: toConfidence(v.confidence) ?? "medium" };
    }
  }
  const confidence = toConfidence(parsed.confidence) ?? (foods?.length ? "low" : "high");
  return { ...parsed, foods, nutritionEstimate, confidence };
}

(async () => {
  const env = loadEnvLocal();
  const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("DEEPSEEK_API_KEY is not set in .env.local — cannot run a real integration check.");
    console.error("Add a real key (DEEPSEEK_API_KEY=sk-...) to .env.local and re-run this script.");
    process.exit(1);
  }

  // Resolves from the project root's node_modules (this script has no separate package.json).
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });

  // PART 2 — accept any image via VERIFY_IMAGE, defaulting to the bundled fixture.
  const imagePath = process.env.VERIFY_IMAGE || path.join(__dirname, "..", "public", "mock", "social", "meal-thali.jpg");
  const imageBuffer = fs.readFileSync(imagePath);
  const imageB64 = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const dataUrl = `data:${mime};base64,${imageB64}`;

  console.log("--- DIAGNOSTIC: image file ---");
  console.log("absolute path:", imagePath);
  console.log("file size (bytes):", imageBuffer.length);
  console.log("base64 length (chars):", imageB64.length);
  console.log("data URL header (first 30 chars):", dataUrl.slice(0, 30));

  // Fix 3 — text FIRST, image SECOND in the user message's content array.
  const USER_TEXT =
    "Analyze this meal photo. Respond ONLY with valid JSON: { foods: [{ name, confidence }], " +
    "nutritionEstimate: { calories, protein, carbs, fat each as { range: { min, max }, source, " +
    "confidence } }, confidence }. No prose. No markdown. No explanation.";
  const requestBody = {
    model: "deepseek-flash",
    messages: [
      { role: "user", content: [{ type: "text", text: USER_TEXT }, { type: "image_url", image_url: { url: dataUrl } }] },
    ],
    response_format: { type: "json_object" },
    // 2026-10-01 reliability fix (Phase A exit, OPTION A): raised from 800 → 4000. Live proof
    // showed `finish_reason:"length"` with `reasoning_tokens` consuming 729-800 of an 800
    // budget — `thinking: disabled` is not reliably honored call-to-call, so the budget must
    // survive worst-case reasoning overhead on its own. Prompt/schema unchanged.
    max_tokens: 4000,
    // Fix 1 — disable DeepSeek's "thinking" mode so the completion budget goes to the answer,
    // not hidden chain-of-thought (see the 2026-10-01 root-cause note above).
    extra_body: { thinking: { type: "disabled" } },
  };
  console.log("\n--- DIAGNOSTIC: request ---");
  console.log("baseURL:", "https://api.deepseek.com");
  console.log("model:", requestBody.model);
  console.log("max_tokens:", requestBody.max_tokens);
  console.log("extra_body:", JSON.stringify(requestBody.extra_body));
  console.log(
    "request body shape (image_url.url truncated, no key present):",
    JSON.stringify(
      {
        ...requestBody,
        messages: requestBody.messages.map((m) => ({
          ...m,
          content: m.content.map((c) => (c.type === "image_url" ? { type: "image_url", image_url: { url: c.image_url.url.slice(0, 40) + `...[${c.image_url.url.length} chars total]` } } : c)),
        })),
      },
      null,
      2,
    ),
  );

  console.log("\nCalling the REAL DeepSeek API (model: deepseek-flash) with a real test image...");
  let completion;
  try {
    // .withResponse() gives us the SDK-parsed `data` AND the raw Fetch Response (status,
    // headers) without changing the request — confirms `extra_body` really went out on the
    // wire (it is present in the logged request body above; the response's reasoning_tokens
    // dropping to 0 is the server-side confirmation that DeepSeek honored it).
    const result = await client.chat.completions.create(requestBody).withResponse();
    completion = result.data;
    const response = result.response;
    console.log("\n--- DIAGNOSTIC: response ---");
    console.log("HTTP status:", response.status, response.statusText);
    console.log("content-type header:", response.headers.get("content-type"));
    console.log("full parsed completion object:", JSON.stringify(completion, null, 2));
  } catch (err) {
    // A hard failure — network/auth/billing — never reached a completion at all.
    console.error("\nDeepSeek reachable: NO");
    if (err && typeof err === "object") {
      console.error("error.status:", err.status);
      console.error("error.message:", err.message);
      console.error("error.error (provider error envelope, if any):", JSON.stringify(err.error, null, 2));
    } else {
      console.error(err);
    }
    process.exit(1);
  }

  // From here on: the API call itself succeeded (reachable). Fix 4 — report, never throw.
  console.log("\nDeepSeek reachable: YES");
  const choice = completion.choices?.[0];
  const raw = choice?.message?.content;
  const finishReason = choice?.finish_reason;
  const usage = completion.usage;
  const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens;

  console.log("finish_reason:", finishReason);
  console.log("completion_tokens:", usage?.completion_tokens);
  console.log("reasoning_tokens:", reasoningTokens ?? "(absent)");
  console.log("raw content:", JSON.stringify(raw));

  if (!raw) {
    console.error("\n✗ FAILED — no content returned at all (see finish_reason/usage above).");
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(stripMarkdownFence(raw));
  } catch (parseErr) {
    console.error("\n✗ FAILED — JSON.parse could not parse the raw content above.");
    console.error("parse error:", parseErr.message);
    process.exit(1);
  }

  if (!Array.isArray(parsed.foods)) {
    console.error("\n✗ FAILED — parsed JSON is missing a foods array:", JSON.stringify(parsed));
    process.exit(1);
  }

  console.log("\nfoods (raw, as DeepSeek returned it):", JSON.stringify(parsed.foods, null, 2));
  console.log("nutritionEstimate (raw, as DeepSeek returned it):", JSON.stringify(parsed.nutritionEstimate, null, 2));

  const normalized = normalizeConfidences(parsed);
  console.log("\nfoods (normalized — confidence converted to \"high\"|\"medium\"|\"low\", matching route.ts):", JSON.stringify(normalized.foods, null, 2));
  console.log("nutritionEstimate (normalized):", JSON.stringify(normalized.nutritionEstimate, null, 2));
  console.log("confidence (top-level, normalized):", normalized.confidence);

  console.log(`\n✓ ${parsed.foods.length} food(s) identified — the real DeepSeek API answered with a well-formed JSON object.`);
  process.exit(0);
})();
