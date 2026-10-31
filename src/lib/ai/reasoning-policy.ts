/**
 * Adaptive reasoning + vision configuration for the specialist route — one small deterministic policy, no second model, no
 * parallel specialists, no escalation loop. Verified live against DeepSeek's OpenAI-compatible endpoint (2026-10-30,
 * `prototype-evidence/social-4-records/probe-capabilities.log`): `extra_body.thinking.type` "enabled"/"disabled" and
 * `image_url.detail: "high"` are both accepted by `deepseek-flash` with `response_format: json_object`.
 *
 *   SIMPLE   (a cracked screen, a construction scene, a sketch)        → thinking disabled, detail "auto"
 *   COMPLEX  (dense whiteboards, multi-column notes, plans, lab reports) → thinking enabled, detail "high", a larger budget
 *   AMBIGUOUS content never raises effort further — the specialist returns uncertainty / `insufficient` instead.
 *
 * Complexity is decided from what the route already holds: the category's own nature (Meeting/Health are document-heavy) and
 * the image payload size (a large image is where readable text lives). Never from the model's answer, so no re-asking.
 */
import type { RecordKindAI } from "@/components/style-lab/social/data";

export interface ReasoningPolicy {
  thinking: "enabled" | "disabled";
  maxTokens: number;
  detail: "auto" | "high";
  complexity: "simple" | "complex";
}

/** bytes of base64 above which an image is treated as text-dense (≈ a 1.2 MB JPEG) */
export const COMPLEX_IMAGE_BYTES = 1_200_000;

export function reasoningPolicy(kind: RecordKindAI, imageByteLengths: number[], documentHeavy: boolean): ReasoningPolicy {
  const hasImage = imageByteLengths.length > 0;
  const largeImage = imageByteLengths.some((n) => n >= COMPLEX_IMAGE_BYTES);
  const complex = hasImage && (documentHeavy || largeImage || imageByteLengths.length > 1);
  return complex
    ? { thinking: "enabled", maxTokens: 6000, detail: "high", complexity: "complex" }
    : { thinking: "disabled", maxTokens: 4000, detail: kind === "project" && hasImage ? "high" : "auto", complexity: "simple" };
}
