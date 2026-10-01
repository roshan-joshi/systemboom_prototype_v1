/**
 * UC-MEAL-AI — SYSTEMBOOM-owned types for Meal AI. Meal UI/components import ONLY from this
 * module (never a provider SDK type) — the canonical shapes live in `data.ts` (so they can
 * persist on `KindFields`/`Moment`) and are re-exported here as the meal-intelligence module's
 * one surface. DeepSeek specifics never appear here or anywhere above `analyzeMealMedia`'s own
 * server-route call (§PROVIDER ABSTRACTION).
 */
export type {
  AIConfidence,
  FoodSource,
  MealAIObservation,
  NutritionEstimate,
  NutritionValue,
  ObservedFood,
  OcrObservation,
} from "../../data";

/** The normalized image input `analyzeMealMedia` sends to the server boundary. */
export interface MealAnalysisImage {
  /** A data URL (`data:image/...;base64,...`) — the only encoding this pipeline sends. */
  dataUrl: string;
}
