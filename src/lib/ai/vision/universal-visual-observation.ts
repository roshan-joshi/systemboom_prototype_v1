/**
 * V0.4 P1 — UniversalVisualObservationV1: the category-NEUTRAL Pass 1 reading of one image. It says what is visible
 * (objects · scene · observable actions · legible text · limitations) and nothing about categories or specialist fields;
 * the seven-category classifier (`classify.ts`) and every specialist consume it downstream. Untrusted model output is
 * normalized here (bounded lists/strings, confidences validated, illegible text dropped) — never trusted raw.
 */
import type { AIConfidence } from "@/components/style-lab/social/data";

export type PrimarySubject = "person" | "food" | "place" | "object" | "document" | "screen" | "animal" | "scene" | "unknown";

export interface VisualItem {
  label: string;
  confidence: AIConfidence;
  evidence?: string;
}
export interface UniversalVisualObservationV1 {
  schemaVersion: 1;
  assetId: string | null;
  analyzedAt: string;
  provider: string;
  objects: VisualItem[];
  scene: { label: string; description: string; evidence?: string };
  /** observable actions only (a person running, someone writing) — never intent or purpose */
  actions: VisualItem[];
  /** text actually legible in the image; illegible text is never guessed — it becomes a limitation */
  text: string[];
  primarySubject: PrimarySubject;
  limitations: string[];
}

const conf = (v: unknown): AIConfidence => (v === "high" || v === "medium" || v === "low" ? v : typeof v === "number" ? (v >= 0.8 ? "high" : v >= 0.5 ? "medium" : "low") : "low");
const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const items = (v: unknown, max = 12): VisualItem[] =>
  Array.isArray(v)
    ? v
        .map((x) => (typeof x === "string" ? { label: x } : x && typeof x === "object" ? (x as Record<string, unknown>) : null))
        .filter((x): x is Record<string, unknown> => !!x)
        .map((x) => ({ label: str(x.label ?? x.name, 60), confidence: conf(x.confidence ?? "medium"), ...(str(x.evidence, 120) ? { evidence: str(x.evidence, 120) } : {}) }))
        .filter((x) => x.label)
        .slice(0, max)
    : [];
const SUBJECTS: readonly PrimarySubject[] = ["person", "food", "place", "object", "document", "screen", "animal", "scene"];

/** Normalize the provider's `vision` block; `null` when nothing usable was observed. */
export function normalizeVision(raw: unknown, provider: string, assetId: string | null = null): UniversalVisualObservationV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  const sceneRaw = v.scene && typeof v.scene === "object" ? (v.scene as Record<string, unknown>) : {};
  const scene = { label: str(sceneRaw.label, 60), description: str(sceneRaw.description ?? v.description, 240), ...(str(sceneRaw.evidence, 120) ? { evidence: str(sceneRaw.evidence, 120) } : {}) };
  const textRaw = Array.isArray(v.text) ? v.text : [];
  const text = textRaw
    .map((t) => (typeof t === "string" ? { text: t, legible: true } : t && typeof t === "object" ? (t as Record<string, unknown>) : null))
    .filter((t): t is Record<string, unknown> => !!t && t.legible !== false)
    .map((t) => str(t.text, 200))
    .filter(Boolean)
    .slice(0, 20);
  const limitations = (Array.isArray(v.limitations) ? v.limitations : []).map((l) => str(l, 120)).filter(Boolean).slice(0, 8);
  const primarySubject = SUBJECTS.includes(v.primarySubject as PrimarySubject) ? (v.primarySubject as PrimarySubject) : "unknown";
  const objects = items(v.objects);
  const actions = items(v.actions, 6);
  if (!scene.label && !scene.description && !objects.length) return null;
  return { schemaVersion: 1, assetId, analyzedAt: new Date().toISOString(), provider, objects, scene, actions, text, primarySubject, limitations };
}

/** every label the observation carries, one line — what the classifier's rules read */
export const visionEvidenceText = (o: UniversalVisualObservationV1): string =>
  [o.scene.label, o.scene.description, o.scene.evidence, ...o.objects.map((x) => `${x.label} ${x.evidence ?? ""}`), ...o.actions.map((x) => x.label), ...o.text].filter(Boolean).join(" \n ");
