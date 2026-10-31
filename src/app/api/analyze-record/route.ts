/**
 * SOCIAL-4 — the Composer's ONE specialist-reading boundary for PROJECT · PROBLEM · MEETING · HEALTH. The browser talks only
 * to this route; it never calls DeepSeek directly and the key never reaches client code (read here, server-side, never
 * `NEXT_PUBLIC_`). Same provider, model and transport as `/api/analyze-meal` and `/api/analyze-activity` (unchanged).
 *
 * PRIVACY: the provider request carries ONLY the encoded image/keyframe bytes the person attached, the words they wrote in this
 * post, and one fixed instruction — no identity, filename, GPS, metadata, people graph, health history or any other record.
 * Health content is read only because the person chose Health for it; nothing here is logged beyond timing.
 *
 * ONE specialist per request: the CATEGORY is given by the caller (the person's / the composition's authoritative choice).
 * The model is asked only for that category's observations; everything else it volunteers is dropped by `normalize`.
 * Never asked for, never kept: diagnoses, severity from appearance, prices, causes, decisions not written down, names from
 * faces, dates not written, participants not written.
 *
 * `?mock=<scenario>[:<delayMs>]` is the test-only determinism seam (same convention as the other routes); `echo` returns the
 * exact outgoing payload for the privacy test; `byasset` answers per attached image (by its bytes) so mixed compositions test
 * deterministically.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { BLOCKED_HEADER, BLOCKED_MARKER, blockedUnlessLive, deepseekClient, mockScenario } from "@/lib/intelligence/provider-gate";
import { fillFromCompletion, withHeimProvenance, type ProviderTrace } from "@/lib/intelligence/provenance";
import type { RecordAIObservation, RecordKindAI, RecordSource, RecordValue } from "@/components/style-lab/social/data";
import { applyKnowledge } from "@/lib/ai/knowledge/knowledge-engine";
import { reasoningPolicy, type ReasoningPolicy } from "@/lib/ai/reasoning-policy";
import { buildSpecialistPrompt, SPECIALISTS } from "@/lib/ai/specialists";
import { normalizeRecordObservation, validateRecordObservation } from "@/lib/ai/observation-validator";
import { withStrength } from "@/lib/ai/universal-observation";

const MODEL = "deepseek-flash";
const SINGLE_IMAGE_TIMEOUT_MS = 30_000;
const MULTI_IMAGE_TIMEOUT_MS = 40_000;
const KINDS: readonly RecordKindAI[] = ["project", "problem", "meeting", "health"];

interface ImageInput {
  dataUrl: string;
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ----------------------------------------------------------------------------- prompts (V3: one specialist persona per category) */

const SYSTEM_PROMPT: Record<RecordKindAI, string> = { project: buildSpecialistPrompt(SPECIALISTS.project), problem: buildSpecialistPrompt(SPECIALISTS.problem), meeting: buildSpecialistPrompt(SPECIALISTS.meeting), health: buildSpecialistPrompt(SPECIALISTS.health) };

function policyFor(kind: RecordKindAI, images: ImageInput[]): ReasoningPolicy {
  return reasoningPolicy(kind, images.map((i) => i.dataUrl.length), SPECIALISTS[kind].documentHeavy);
}

function buildProviderPayload(kind: RecordKindAI, images: ImageInput[], text: string) {
  const policy = policyFor(kind, images);
  const USER_TEXT =
    (text ? `The person wrote: "${text.slice(0, 1200)}"\n` : "The person wrote nothing.\n") +
    (images.length ? `Analyze the attached ${images.length > 1 ? "images" : "image"} as evidence for this ${kind} record, together with those words. ` : "There is no image; read the words only. ") +
    "Respond ONLY with the JSON object described — no prose, no markdown.";
  return {
    model: MODEL,
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT[kind] },
      { role: "user" as const, content: [{ type: "text" as const, text: USER_TEXT }, ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img.dataUrl, detail: policy.detail } }))] },
    ],
    response_format: { type: "json_object" as const },
    max_tokens: policy.maxTokens,
    extra_body: { thinking: { type: policy.thinking } },
  };
}

/* ----------------------------------------------------------------------------- normalization (the validator) + Knowledge Engine */

const normalize = normalizeRecordObservation;
/** validated reading → Knowledge-Base fallbacks + category hint; the mapper protects human-owned fields downstream */
const finish = (kind: RecordKindAI, validated: RecordAIObservation | null, text: string): RecordAIObservation => applyKnowledge(kind, validated, text).observation;

/* ----------------------------------------------------------------------------- test fixtures */

const V = (value: string, confidence: RecordValue["confidence"], source: Exclude<RecordSource, "user">, evidence?: string): RecordValue => withStrength({ value, confidence, source, ...(evidence ? { evidence } : {}) });

const MOCKS: Record<string, (kind: RecordKindAI, text: string) => RecordAIObservation | null> = {
  fail: () => null,
  malformed: (k) => normalize(k, "{not json"),
  badenum: (k) => normalize(k, JSON.stringify({ status: "complete", type: { value: "migraine", confidence: "high", source: "ai_interpretation" }, description: { value: "Person reports a headache", confidence: "high", source: "user_text" } })),
  // the provider volunteers everything it must not — normalization keeps only the contract, and user_text-only fields drop
  fabricate: (k) =>
    normalize(
      k,
      JSON.stringify({
        status: "complete",
        name: { value: "New Apartment Construction Project", confidence: "high", source: "ai_interpretation" },
        goal: { value: "Finish by 2027", confidence: "high", source: "ai_interpretation" },
        description: { value: "Cracked laptop screen", confidence: "high", source: "visible_image", evidence: "visible crack across the display" },
        urgency: { value: "urgent", confidence: "high", source: "ai_interpretation" },
        cost: { value: "$300", confidence: "high", source: "ai_interpretation" },
        cause: { value: "dropped", confidence: "high", source: "ai_interpretation" },
        subject: { value: "Product Launch Meeting", confidence: "high", source: "image_text" },
        decisions: { value: ["Redesign approved"], confidence: "high", source: "ai_interpretation" },
        participants: { value: ["Sofia", "Luca"], confidence: "high", source: "ai_interpretation" },
        type: { value: "injury", confidence: "high", source: "visible_image" },
        severity: { value: "severe", confidence: "high", source: "visible_image" },
        diagnosis: { value: "torn ligament", confidence: "high", source: "ai_interpretation" },
        bodyArea: { value: "knee", confidence: "medium", source: "visible_image" },
      }),
    ),
  project: () => ({ category: "project", status: "complete", project: { name: V("Community Marketplace", "high", "image_text", 'heading "Community Marketplace"'), goal: V("Help local sellers connect with customers", "high", "image_text", '"Goal: Help local sellers connect with customers"'), description: V("Community marketplace application mockup", "medium", "visible_image") } }),
  "project-scene": () => ({ category: "project", status: "complete", project: { name: V("Construction Project", "medium", "ai_interpretation", "crane, building, workers and safety sign"), goal: V("Building and construction work", "medium", "ai_interpretation"), stage: V("Under construction", "medium", "ai_interpretation"), description: V("A construction site with engineers over blueprints", "high", "visible_image") } }),
  "problem-scene": () => ({ category: "problem", status: "complete", problem: { description: V("Person appears frustrated with computer work — possible technical issue with the laptop", "medium", "ai_interpretation", "a man holding his head at a laptop"), affectedItem: V("Laptop", "medium", "visible_image") } }),
  "project-nogoal": () => ({ category: "project", status: "complete", project: { description: V("Mobile app screenshot with a list screen", "medium", "visible_image") } }),
  "project-text": (k, text) => ({ category: "project", status: "complete", project: { name: V("Family Travel Planner", "high", "user_text", text.slice(0, 60)), goal: V("Plan the summer trip together", "medium", "user_text") } }),
  problem: () => ({ category: "problem", status: "complete", problem: { description: V("Laptop screen appears cracked", "high", "visible_image", "visible crack across the display"), affectedItem: V("Laptop", "high", "visible_image"), visibleDamage: V("Cracked display", "high", "visible_image") } }),
  "problem-text": (k, text) => ({ category: "problem", status: "complete", problem: { description: V("Person reports the laptop no longer charges", "high", "user_text", text.slice(0, 80)), affectedItem: V("Laptop", "high", "user_text"), attempt: /restart/i.test(text) ? V("Restarted the laptop three times", "high", "user_text") : undefined } }),
  meeting: () => ({ category: "meeting", status: "complete", meeting: { subject: V("Product Launch Meeting", "high", "image_text", 'heading "Product Launch Meeting"'), agenda: { value: ["Website redesign"], confidence: "high", source: "image_text" }, actions: { value: [{ action: "Prepare mockup", owner: "Priya" }], confidence: "high", source: "image_text" }, decisions: undefined } }),
  // V3.1 — purpose: stated on the board (fills) vs. inferred from the scene (card/record only)
  "meeting-purpose": () => ({ category: "meeting", status: "complete", meeting: { subject: V("Marketing Planning", "high", "image_text", 'heading "Marketing Planning"'), purpose: V("Agree the campaign launch date", "high", "image_text", '"Purpose: agree the campaign launch date"') } }),
  "meeting-scene": () => ({ category: "meeting", status: "complete", meeting: { subject: V("Marketing Planning", "high", "image_text", 'heading "Marketing Planning"'), purpose: V("Planning marketing activities: campaign launch and budget review", "medium", "ai_interpretation") } }),
  // UHI-UX-134 repro — the Meeting reading a CONSTRUCTION photograph produces: a real extracted subject whose own words
  // make the Knowledge Base point back at Project (the stale "Looks like Project" the owner saw after choosing Meeting).
  "meeting-construction": () => ({ category: "meeting", status: "complete", meeting: { subject: V("Construction site meeting", "high", "image_text", "whiteboard beside the site office") } }),
  "meeting-faces": () => ({ category: "meeting", status: "complete", meeting: { subject: V("Team sync", "medium", "ai_interpretation") } }),
  health: (k, text) => ({ category: "health", status: "complete", health: { type: V("injury", "high", "user_text"), description: V("Person reports falling while playing football", "high", "user_text", text.slice(0, 60)), bodyArea: V("knee", "medium", "visible_image", "a bandaged knee is visible") } }),
  "health-bandage": () => ({ category: "health", status: "complete", health: { type: V("injury", "medium", "visible_image"), description: V("A bandaged knee is visible", "high", "visible_image", "bandage on the knee"), bodyArea: V("knee", "medium", "visible_image") } }),
  "health-text": (k, text) => ({ category: "health", status: "complete", health: { type: V(/fell|fall/i.test(text) ? "injury" : "symptom", "high", "user_text"), description: V(/headache/i.test(text) ? "Person reports a headache since yesterday" : "Person reports falling while playing football", "high", "user_text", text.slice(0, 60)), bodyArea: /knee/i.test(text) ? V("knee", "high", "user_text") : undefined } }),
  // ---- V3 (Universal Media Intelligence Engine) — raw provider shapes that run through the REAL validator + Knowledge Engine
  "health-lab": (k) => normalize(k, JSON.stringify({ status: "complete", type: { value: "test", confidence: "high", source: "visible_image" }, description: { value: "Laboratory report containing test measurements", confidence: "high", source: "visible_image", evidence: "a printed lab report with a results table" }, documentType: { value: "laboratory report", confidence: "high", source: "visible_image" }, diagnosis: { value: "diabetes", confidence: "high", source: "ai_interpretation" }, measurement: { value: "HbA1c 9.1%", confidence: "high", source: "image_text" } })),
  "health-lab-notype": (k) => normalize(k, JSON.stringify({ status: "complete", description: { value: "A printed laboratory report with a results table", confidence: "high", source: "visible_image" }, documentType: { value: "laboratory report", confidence: "high", source: "visible_image" } })),
  empty: (k) => normalize(k, "{}"),
  "kb-construction": (k) => normalize(k, JSON.stringify({ status: "complete", description: { value: "Building under construction with visible scaffolding and a crane", confidence: "high", source: "visible_image", evidence: "scaffolding across the facade" } })),
  conflict: (k) => normalize(k, JSON.stringify({ status: "complete", description: { value: "A plate of dal bhat with curry and pickle on a steel plate", confidence: "high", source: "visible_image" } })),
  insufficient: (k) => ({ category: k, status: "insufficient" }),
};
/**
 * `byasset` — each attached fixture photo answers with ITS category's reading, recognised by its ASPECT RATIO (w/h × 1000,
 * read from the JPEG's own SOF header): the client now fits images to a readability budget before upload, so byte hashes
 * would change with every browser's encoder, while the aspect survives any resize. nyatapola 1920×1556 → 1234 ·
 * terraces 1920×1440 → 1333 · garden 1920×1241 → 1547 · durbar 1920×1280 → 1500.
 */
const BYASSET: Record<string, string> = { "1234": "project", "1333": "problem", "1547": "meeting", "1500": "health" };
function imageTag(dataUrl: string): string {
  try {
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return createHash("sha1").update(buf).digest("hex").slice(0, 12);
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return String(Math.round((w / h) * 1000));
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch {
    /* fall through */
  }
  return "unknown";
}
/** `byasset-meeting` — three photographs of ONE whiteboard: garden = the subject, durbar = the agenda, terraces = the actions */
const BYASSET_MEETING: Record<string, RecordAIObservation> = {
  "1547": { category: "meeting", status: "complete", meeting: { subject: V("Marketing Planning", "high", "image_text", 'heading "Marketing Planning"') } },
  "1500": { category: "meeting", status: "complete", meeting: { agenda: withStrength({ value: ["Launch campaign", "Budget review"], confidence: "high", source: "image_text" }) } },
  "1333": { category: "meeting", status: "complete", meeting: { actions: withStrength({ value: [{ action: "Prepare graphics", owner: "Alex" }], confidence: "high", source: "image_text" }) } },
};

async function handle(req: NextRequest, trace: ProviderTrace) {
  let body: { category?: unknown; images?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ observation: null }, { status: 400 });
  }
  const kind = typeof body.category === "string" && (KINDS as readonly string[]).includes(body.category) ? (body.category as RecordKindAI) : null;
  const images: ImageInput[] = Array.isArray(body.images) ? body.images.filter((i): i is ImageInput => !!i && typeof i === "object" && typeof (i as ImageInput).dataUrl === "string") : [];
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!kind || (images.length === 0 && !text)) return NextResponse.json({ observation: null }, { status: 400 });

  const mockRaw = mockScenario(req); // P2-B2 — local, non-production, non-live servers only
  if (mockRaw !== null) {
    const [scenario, delayStr] = mockRaw.split(":");
    const delay = Math.min(Number(delayStr), 10_000);
    if (Number.isFinite(delay) && delay > 0) await sleep(delay);
    if (scenario === "off") return NextResponse.json({ observation: null }); // the accepted suites' pin: no reading at all, not even a words-only fallback
    if (scenario === "echo") return NextResponse.json({ observation: null, _debugProviderPayload: buildProviderPayload(kind, images, text), _debugPolicy: policyFor(kind, images) });
    if (scenario === "byasset-meeting") {
      const img = images[0];
      const tag = img ? imageTag(img.dataUrl) : "";
      const o = kind === "meeting" ? BYASSET_MEETING[tag] : undefined;
      return NextResponse.json({ observation: o ?? { category: kind, status: "insufficient" } });
    }
    if (scenario === "byasset") {
      const img = images[0];
      const tag = img ? BYASSET[imageTag(img.dataUrl)] : undefined;
      // a photo answers with its own category's reading only when asked for that category; any other pairing is insufficient
      return NextResponse.json({ observation: tag === kind ? MOCKS[kind](kind, text) : { category: kind, status: "insufficient" } });
    }
    const fn = Object.prototype.hasOwnProperty.call(MOCKS, scenario) ? MOCKS[scenario] : undefined;
    if (!fn) return NextResponse.json({ observation: null });
    const canned = fn(kind, text);
    // a canned null = a provider failure (the Knowledge Engine may still seed from the person's words); otherwise the real finish
    return NextResponse.json({ observation: scenario === "fail" ? finish(kind, null, text) : canned ? finish(kind, canned, text) : finish(kind, null, text) });
  }

  // blocked = the same deterministic, network-free answer as "provider unavailable" (the Knowledge Engine may still use the words)
  if (blockedUnlessLive("deepseek", `analyze-record:${kind}`, req)) return NextResponse.json({ observation: finish(kind, null, text), ...BLOCKED_MARKER }, { headers: { [BLOCKED_HEADER]: "deepseek" } });
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("[analyze-record] DEEPSEEK_API_KEY is not configured");
    return NextResponse.json({ observation: finish(kind, null, text) });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), images.length > 1 ? MULTI_IMAGE_TIMEOUT_MS : SINGLE_IMAGE_TIMEOUT_MS);
  try {
    const client = deepseekClient(apiKey, `analyze-record:${kind}`, req.headers.get("referer"));
    const payload = buildProviderPayload(kind, images, text);
    const policy = policyFor(kind, images);
    // ONE call; ONE bounded retry only when the answer is not valid JSON (a transient formatting failure) — never for an unknown field
    let validated: RecordAIObservation | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const startedAt = Date.now();
      const completion = await client.chat.completions.create(payload, { signal: controller.signal });
      fillFromCompletion(trace, completion, payload, startedAt); // P2-B1: content-free provenance only
      console.log(`[analyze-record:${kind}] provider answered in`, Math.round((Date.now() - startedAt) / 100) / 10, "s;", policy.complexity, "/ thinking", policy.thinking, "/ detail", policy.detail, "/ attempt", attempt + 1); // timing + policy only — never content
      const raw = completion.choices[0]?.message?.content;
      const outcome = validateRecordObservation(kind, raw);
      trace.validation = outcome.ok ? "valid" : "invalid";
      if (outcome.ok) {
        validated = outcome.observation;
        break;
      }
      console.error(`[analyze-record:${kind}] provider answer unusable (${outcome.reason}); finish_reason:`, completion.choices?.[0]?.finish_reason);
      if (outcome.reason === "empty") break; // an empty answer is not a formatting glitch — fall back, do not spend again
    }
    return NextResponse.json({ observation: finish(kind, validated, text) });
  } catch (err) {
    trace.error = true;
    console.error(`[analyze-record:${kind}] provider call failed:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ observation: finish(kind, null, text) });
  } finally {
    clearTimeout(timer);
  }
}

/** P2-B1 — the handler above is unchanged; this wrapper only adds best-effort, content-free provenance. */
export async function POST(req: NextRequest) {
  return withHeimProvenance(req, { taskType: "record_specialist", promptId: (b) => `analyze-record.${typeof b?.category === "string" ? b.category.replace(/[^a-z_]/g, "").slice(0, 20) : "unknown"}`, requestedProvider: "deepseek", requestedModel: MODEL, schemaVersion: "1" }, (trace) => handle(req, trace));
}
