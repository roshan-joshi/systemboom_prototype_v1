/**
 * V3 — the Composer's ONLY Activity-vision boundary. The browser talks ONLY to this route; it never calls DeepSeek directly
 * and the API key never reaches client code (read here, server-side, nowhere else — never `NEXT_PUBLIC_`).
 *
 * PRIVACY: the provider request carries ONLY encoded image bytes plus one fixed instruction — no caption, GPS, filename,
 * asset id, user id, account, friend graph, health or Circle information is ever read from, or forwarded on behalf of, the
 * request that reaches this route.
 *
 * PROVIDER: the same DeepSeek `deepseek-flash` via the OpenAI-compatible SDK as `/api/analyze-meal` (unchanged).
 *
 * THE MODEL IS ASKED FOR A CATEGORY SIGNAL AND VISUAL CLAIMS ONLY. Distance, duration, route, pace, calories, heart rate,
 * steps, elevation, reps, weight, score, exact time, place, people and feelings are never asked for and, if a provider volunteers
 * them, are stripped by `normalizeProviderOutput` — the only measurement that can survive is one legibly READ off a visible
 * screen (`readout`, high-confidence and plausible only).
 *
 * `?mock=<scenario>[:<delayMs>]` is the test-only determinism seam (same convention as `/api/analyze-meal`); `?mock=echo`
 * returns the exact outgoing provider payload for the privacy test. Never reachable without the param.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { BLOCKED_HEADER, BLOCKED_MARKER, blockedUnlessLive, deepseekClient, mockScenario } from "@/lib/intelligence/provider-gate";
import { fillFromCompletion, withHeimProvenance, type ProviderTrace } from "@/lib/intelligence/provenance";
import type { AIConfidence, ActivityAIObservation } from "@/components/style-lab/social/data";

const MODEL = "deepseek-flash";
const SINGLE_IMAGE_TIMEOUT_MS = 30_000;
const MULTI_IMAGE_TIMEOUT_MS = 40_000;

/** the canonical Activity subtypes (mirrors `ActivityType` in composer/types.ts) */
const TYPES = ["run", "walk", "cycling", "gym", "hiking", "swimming", "sport", "mindbody", "travel", "learning", "hobby", "other"] as const;
/** an activity NAME describes what is being done — never who employs the person or what they are qualified as */
const EMPLOYMENT = /\b(employ\w*|employer|salary|wage|job|occupation|career|profession\w*|qualified|certified|licensed|contractor|worker for)\b/i;
const SETTINGS = ["outdoor", "indoor", "gym", "pool", "trail", "road", "track", "court", "field", "home", "water"] as const;

interface ImageInput {
  dataUrl: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildProviderPayload(images: ImageInput[]) {
  const SYSTEM_PROMPT =
    "You are an activity-recognition assistant analyzing photo(s) for a personal life journal. " +
    "Decide whether the image meaningfully shows a physical or practised ACTIVITY (exercise, sport, a walk, a hike, a swim, " +
    "a gym session, yoga, travel on foot or by bike, a practised hobby, a class being studied) rather than something else, " +
    "and what kind. Respond with ONLY a JSON object, no prose, matching exactly:\n" +
    "{\n" +
    '  "isActivity": boolean,\n' +
    '  "activityType"?: "run"|"walk"|"cycling"|"gym"|"hiking"|"swimming"|"sport"|"mindbody"|"travel"|"learning"|"hobby"|"other",\n' +
    '  "activityTypeConfidence"?: "high"|"medium"|"low",\n' +
    '  "activityName"?: string,\n' +
    '  "activityNameConfidence"?: "high"|"medium"|"low",\n' +
    '  "setting"?: "outdoor"|"indoor"|"gym"|"pool"|"trail"|"road"|"track"|"court"|"field"|"home"|"water",\n' +
    '  "settingConfidence"?: "high"|"medium"|"low",\n' +
    '  "readout"?: {"distanceKm"?: number, "durationMinutes"?: number, "confidence": "high"|"medium"|"low"},\n' +
    '  "confidence": "high"|"medium"|"low"\n' +
    "}\n" +
    '"isActivity" is true ONLY if the image meaningfully depicts someone doing, or evidently having just done, an activity. ' +
    'A photo of food, a landscape with no activity, a document or a pet is not an activity: return {"isActivity": false, "confidence": "high"} ' +
    "and omit every other key. The top-level \"confidence\" is how sure you are about that category call. " +
    '"activityType" is the broad family; "activityName" is the specific activity as an ordinary person would name it ("Yoga", "Football", ' +
    '"Carpentry", "Calisthenics") — only what is observably being done, never an occupation, job, employer or qualification; omit either when unsure. ' +
    '"setting" only when evident; omit it when unsure. ' +
    '"readout" ONLY when a distance or duration is clearly and legibly PRINTED on a visible watch, phone, treadmill or sign — it is text ' +
    "you read, never something you estimate; omit it otherwise. NEVER provide or guess distance, duration, route, pace, speed, calories, " +
    "heart rate, steps, elevation, repetitions, weight lifted, a score, the time of day, a place name, who is in the photo, how anyone " +
    "feels or how hard they worked. Never identify a person from their face. Never provide medical advice or a diagnosis of any kind.";
  const USER_TEXT = "Analyze the attached photo(s). Respond ONLY with the JSON object described above — no prose, no markdown, no explanation.";
  return {
    model: MODEL,
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: USER_TEXT },
          ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img.dataUrl } })),
        ],
      },
    ],
    response_format: { type: "json_object" as const },
    max_tokens: 4000,
    extra_body: { thinking: { type: "disabled" } },
  };
}

function stripMarkdownFence(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1] : trimmed;
}

function toConfidence(v: unknown): AIConfidence | undefined {
  if (v === "high" || v === "medium" || v === "low") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v >= 0.8 ? "high" : v >= 0.5 ? "medium" : "low";
  return undefined;
}

/**
 * Normalizes whatever the provider produced into a clean `ActivityAIObservation` — or null when it is not usable at all.
 * Only the schema's own keys are ever read: a volunteered distance/pace/calories/heart-rate/route/steps/… is dropped here.
 * `isActivity` is a STRICT boolean (a truthy string, number or missing field is false, never true).
 */
function normalizeProviderOutput(raw: string | null | undefined): ActivityAIObservation | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFence(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  const isActivity = o.isActivity === true;
  const confidence = toConfidence(o.confidence) ?? "low";
  if (!isActivity) return { isActivity: false, confidence };
  const out: ActivityAIObservation = { isActivity: true, confidence };
  const type = typeof o.activityType === "string" ? o.activityType.trim().toLowerCase() : "";
  if ((TYPES as readonly string[]).includes(type)) {
    out.activityType = type;
    out.activityTypeConfidence = toConfidence(o.activityTypeConfidence) ?? "low";
  }
  const name = typeof o.activityName === "string" ? o.activityName.trim() : "";
  if (name && name.length <= 40 && !/[\d@#/\\]/.test(name) && !EMPLOYMENT.test(name)) {
    out.activityName = name;
    out.activityNameConfidence = toConfidence(o.activityNameConfidence) ?? "low";
  }
  const setting = typeof o.setting === "string" ? o.setting.trim().toLowerCase() : "";
  if ((SETTINGS as readonly string[]).includes(setting)) {
    out.setting = setting;
    out.settingConfidence = toConfidence(o.settingConfidence) ?? "low";
  }
  const r = o.readout;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    const ro = r as Record<string, unknown>;
    const km = typeof ro.distanceKm === "number" && Number.isFinite(ro.distanceKm) && ro.distanceKm > 0 && ro.distanceKm <= 1000 ? Math.round(ro.distanceKm * 100) / 100 : undefined;
    const min = typeof ro.durationMinutes === "number" && Number.isFinite(ro.durationMinutes) && ro.durationMinutes > 0 && ro.durationMinutes <= 1440 ? Math.round(ro.durationMinutes) : undefined;
    if (km !== undefined || min !== undefined) {
      out.readout = { ...(km !== undefined ? { distanceKm: km } : {}), ...(min !== undefined ? { durationMinutes: min } : {}), confidence: toConfidence(ro.confidence) ?? "low" };
    }
  }
  return out;
}

/** the mock-library photographs the `byasset` fixtures key on (sha1 of the base64 payload, first 12 hex) */
const BYASSET: Record<string, { name: string; scenario: string }> = {
  "70cd430e0860": { name: "snow", scenario: "high" },
  "0ea554759747": { name: "terr", scenario: "secondary" },
  "68c8ff6ea691": { name: "garden", scenario: "none" },
  "aa489c635ac9": { name: "durbar", scenario: "ocr" },
};

/** deterministic fixtures — mock seam only, never a real provider path */
function buildMockObservation(scenario: string): ActivityAIObservation | null {
  switch (scenario) {
    case "fail":
      return null;
    case "high":
      return { isActivity: true, confidence: "high", activityType: "run", activityTypeConfidence: "high", activityName: "Running", activityNameConfidence: "high", setting: "outdoor", settingConfidence: "high" };
    case "carpentry":
      return { isActivity: true, confidence: "high", activityType: "other", activityTypeConfidence: "medium", activityName: "Carpentry", activityNameConfidence: "high", setting: "outdoor", settingConfidence: "medium" };
    case "yoga":
      return { isActivity: true, confidence: "high", activityType: "mindbody", activityTypeConfidence: "high", activityName: "Yoga", activityNameConfidence: "high", setting: "indoor", settingConfidence: "medium" };
    case "football":
      return { isActivity: true, confidence: "high", activityType: "sport", activityTypeConfidence: "high", activityName: "Football", activityNameConfidence: "high", setting: "field", settingConfidence: "high" };
    case "swim":
      return { isActivity: true, confidence: "high", activityType: "swimming", activityTypeConfidence: "high", setting: "pool", settingConfidence: "high" };
    case "hobby":
      return { isActivity: true, confidence: "high", activityType: "hobby", activityTypeConfidence: "high", activityName: "Piano practice", activityNameConfidence: "medium", setting: "indoor", settingConfidence: "medium" };
    case "learning":
      return { isActivity: true, confidence: "high", activityType: "learning", activityTypeConfidence: "high", setting: "indoor", settingConfidence: "medium" };
    case "cycle":
      return { isActivity: true, confidence: "high", activityType: "cycling", activityTypeConfidence: "high", setting: "road", settingConfidence: "medium" };
    case "medium":
      return { isActivity: true, confidence: "medium", activityType: "run", activityTypeConfidence: "medium", setting: "outdoor", settingConfidence: "medium" };
    case "low":
      return { isActivity: true, confidence: "low", activityType: "run", activityTypeConfidence: "low" };
    case "none":
      return { isActivity: false, confidence: "high" };
    case "gym":
      return { isActivity: true, confidence: "high", activityType: "gym", activityTypeConfidence: "high", setting: "gym", settingConfidence: "high" };
    case "lowfields":
      // category HIGH, but the field readings are LOW — the fields must stay blank (V2 contract) while the category still selects
      return { isActivity: true, confidence: "high", activityType: "run", activityTypeConfidence: "low", setting: "outdoor", settingConfidence: "low" };
    case "ocr":
      return { isActivity: true, confidence: "high", activityType: "run", activityTypeConfidence: "high", readout: { distanceKm: 5.2, durationMinutes: 32, confidence: "high" } };
    case "ocrlow":
      return { isActivity: true, confidence: "high", activityType: "run", activityTypeConfidence: "high", readout: { distanceKm: 5.2, durationMinutes: 32, confidence: "low" } };
    case "ocrmedium":
      return { isActivity: true, confidence: "high", activityType: "run", activityTypeConfidence: "high", readout: { distanceKm: 5.2, durationMinutes: 32, confidence: "medium" } };
    case "secondary":
      // a second reading that disagrees with `high` on the type and adds a screen readout
      return { isActivity: true, confidence: "high", activityType: "cycling", activityTypeConfidence: "high", readout: { distanceKm: 12, durationMinutes: 40, confidence: "high" } };
    case "fabricate":
      // a RAW provider payload that volunteers everything it must not — proves normalization strips it
      return normalizeProviderOutput(
        JSON.stringify({
          isActivity: true,
          confidence: "high",
          activityType: "run",
          activityTypeConfidence: "high",
          activityName: "Employed carpenter at Acme",
          distance: "10 km",
          distanceKm: 10,
          duration: "45 min",
          pace: "4:30 /km",
          calories: 700,
          heartRate: 150,
          steps: 9000,
          elevation: "120 m",
          route: "Riverside loop",
          place: "Phewa Tal",
          people: ["Sofia"],
          feeling: "exhausted",
          score: 3,
          employer: "Acme",
        }),
      );
    default:
      return null;
  }
}

async function handle(req: NextRequest, trace: ProviderTrace) {
  let body: { images?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ observation: null }, { status: 400 });
  }
  const images: ImageInput[] = Array.isArray(body.images)
    ? body.images.filter((i): i is ImageInput => !!i && typeof i === "object" && typeof (i as ImageInput).dataUrl === "string")
    : [];
  if (images.length === 0) return NextResponse.json({ observation: null }, { status: 400 });

  const mockRaw = mockScenario(req); // P2-B2 — local, non-production, non-live servers only
  if (mockRaw !== null) {
    const [scenario, delayStr] = mockRaw.split(":");
    const delay = Math.min(Number(delayStr), 10_000);
    if (Number.isFinite(delay) && delay > 0) await sleep(delay);
    if (scenario === "echo") return NextResponse.json({ observation: null, _debugProviderPayload: buildProviderPayload(images) });
    // `byasset[:slow<tag>]` — each attached image answers with its OWN deterministic reading, chosen by the image's bytes (so
    // the same photo always reads the same whichever composition or order it is in). Mock seam only.
    if (scenario === "byasset") {
      const b64 = images[0].dataUrl.slice(images[0].dataUrl.indexOf(",") + 1);
      const tag = BYASSET[createHash("sha1").update(b64).digest("hex").slice(0, 12)];
      if (tag && delayStr === `slow${tag.name}`) await sleep(2500);
      return NextResponse.json({ observation: buildMockObservation(tag ? tag.scenario : "none") });
    }
    return NextResponse.json({ observation: buildMockObservation(scenario) });
  }

  if (blockedUnlessLive("deepseek", "analyze-activity", req)) return NextResponse.json({ observation: null, ...BLOCKED_MARKER }, { headers: { [BLOCKED_HEADER]: "deepseek" } });
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("[analyze-activity] DEEPSEEK_API_KEY is not configured");
    return NextResponse.json({ observation: null });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), images.length > 1 ? MULTI_IMAGE_TIMEOUT_MS : SINGLE_IMAGE_TIMEOUT_MS);
  try {
    const client = deepseekClient(apiKey, "analyze-activity", req.headers.get("referer"));
    const startedAt = Date.now();
    const payload = buildProviderPayload(images);
    const completion = await client.chat.completions.create(payload, { signal: controller.signal });
    fillFromCompletion(trace, completion, payload, startedAt); // P2-B1: content-free provenance only
    console.log("[analyze-activity] provider answered in", Math.round((Date.now() - startedAt) / 100) / 10, "s");
    const raw = completion.choices[0]?.message?.content;
    if (!raw) console.error("[analyze-activity] provider returned empty content. finish_reason:", completion.choices?.[0]?.finish_reason);
    return NextResponse.json({ observation: normalizeProviderOutput(raw) });
  } catch (err) {
    trace.error = true;
    console.error("[analyze-activity] provider call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ observation: null });
  } finally {
    clearTimeout(timer);
  }
}

/** P2-B1 — the handler above is unchanged; this wrapper only adds best-effort, content-free provenance. */
export async function POST(req: NextRequest) {
  return withHeimProvenance(req, { taskType: "activity_specialist", promptId: "analyze-activity", requestedProvider: "deepseek", requestedModel: MODEL, schemaVersion: "1" }, (trace) => handle(req, trace));
}
