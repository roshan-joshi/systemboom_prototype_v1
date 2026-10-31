/**
 * SYSTEMBOOM internal AI Knowledge Base — a static, typed, deterministic rule registry. It operates ONLY on validated
 * observations and other available evidence (the person's words); it is not an image-recognition model and cannot see
 * anything the AI or the person did not describe. Each rule maps recognisable evidence to: the category it indicates, and
 * a safe GENERIC fallback (a title, a neutral description, a Health type) that is always provisional (`generic_fallback`,
 * requires confirmation). Rules never add a specific fact.
 */
import type { RecordKindAI } from "@/components/style-lab/social/data";
import type { HEALTH_TYPE_VALUES } from "../specialists/health-specialist";

export type KnowledgeCategory = RecordKindAI | "meal" | "activity";

export interface KnowledgeRule {
  id: string;
  category: KnowledgeCategory;
  /** evidence labels (matched case-insensitively against the validated observation's values + evidence + the person's words) */
  patterns: RegExp[];
  /** generic fallback title — Project name · Problem description · Meeting subject */
  fallbackTitle?: string;
  /** neutral fallback description */
  fallbackDescription?: string;
  /** Health only: the accepted record type the evidence indicates */
  healthType?: (typeof HEALTH_TYPE_VALUES)[number];
}

export const KNOWLEDGE_RULES: readonly KnowledgeRule[] = [
  // ---- PROJECT
  { id: "project.construction", category: "project", patterns: [/scaffold/i, /construction site/i, /\bcrane\b/i, /building (site|under construction|work)/i, /under construction/i, /hard hat/i, /concrete (pour|form)/i], fallbackTitle: "Construction Project", fallbackDescription: "Building under construction" },
  { id: "project.renovation", category: "project", patterns: [/renovat/i, /refurbish/i, /remodel/i, /restoration/i], fallbackTitle: "Renovation Project", fallbackDescription: "Renovation work in progress" },
  { id: "project.software", category: "project", patterns: [/\bmockup\b/i, /wireframe/i, /app screenshot/i, /software (interface|screenshot|mock)/i, /code editor/i, /user interface/i, /\bUI\b/], fallbackTitle: "Software Project", fallbackDescription: "Software or application design material" },
  { id: "project.architecture", category: "project", patterns: [/architectural (plan|drawing)/i, /floor plan/i, /blueprint/i, /site plan/i], fallbackTitle: "Architecture Project", fallbackDescription: "Architectural plan or drawing" },
  { id: "project.garden", category: "project", patterns: [/landscap/i, /garden (project|bed|work)/i, /planting/i], fallbackTitle: "Garden Project", fallbackDescription: "Garden or landscaping work" },
  { id: "project.design", category: "project", patterns: [/product (design|prototype)/i, /prototype/i, /3d print/i], fallbackTitle: "Design Project", fallbackDescription: "Product design or prototype" },
  // ---- PROBLEM
  { id: "problem.screen", category: "problem", patterns: [/cracked (laptop |phone |computer )?(screen|display)/i, /shattered screen/i, /broken (screen|display)/i], fallbackTitle: "Laptop Screen Damage", fallbackDescription: "Display appears visibly cracked" },
  { id: "problem.software-error", category: "problem", patterns: [/error (message|code|screen)/i, /blue screen/i, /ran into a problem/i, /exception/i, /crash/i], fallbackTitle: "Software Error", fallbackDescription: "A software error message is displayed" },
  { id: "problem.leak", category: "problem", patterns: [/water (leak|damage|pooling)/i, /\bleak(ing)?\b/i, /dripping/i, /flooded/i], fallbackTitle: "Water Leak", fallbackDescription: "Signs of a water leak are visible" },
  { id: "problem.vehicle", category: "problem", patterns: [/dent(ed)?\b/i, /scratched (car|vehicle|bumper)/i, /flat tyre|flat tire/i, /vehicle damage/i], fallbackTitle: "Vehicle Damage", fallbackDescription: "Vehicle damage is visible" },
  { id: "problem.appliance", category: "problem", patterns: [/appliance/i, /not (working|turning on|charging)/i, /no longer (works|charges|turns on)/i, /stopped working/i], fallbackTitle: "Equipment Not Working", fallbackDescription: "Equipment reported as not working" },
  // ---- MEETING
  { id: "meeting.notes", category: "meeting", patterns: [/meeting notes/i, /\bagenda\b/i, /minutes\b/i, /action items?/i, /whiteboard/i, /planning (session|board)/i], fallbackTitle: "Meeting Notes", fallbackDescription: "Written meeting notes" },
  { id: "meeting.presentation", category: "meeting", patterns: [/presentation slide/i, /\bslides?\b/i, /\bdeck\b/i], fallbackTitle: "Presentation Meeting", fallbackDescription: "Presentation material" },
  // ---- HEALTH (the type is the fallback; never a diagnosis)
  { id: "health.lab", category: "health", patterns: [/lab(oratory)? (report|result|test)/i, /blood (test|work|panel)/i, /test results?/i, /reference range/i], healthType: "test", fallbackDescription: "Laboratory report containing test measurements" },
  { id: "health.prescription", category: "health", patterns: [/prescription/i, /\bRx\b/, /medication label/i, /pharmacy/i], healthType: "medication", fallbackDescription: "Prescription or medication information" },
  { id: "health.appointment", category: "health", patterns: [/appointment/i, /clinic visit/i, /doctor('s)? (visit|letter)/i], healthType: "appointment", fallbackDescription: "Medical appointment information" },
  { id: "health.imaging", category: "health", patterns: [/x-?ray/i, /\bMRI\b/, /\bCT scan\b/i, /ultrasound/i, /scan image/i], healthType: "imaging", fallbackDescription: "Medical imaging" },
  { id: "health.injury", category: "health", patterns: [/bandage/i, /\bcast\b/i, /sprain/i, /\bbruis/i, /\bcut\b/i, /\bfell\b|\bfall\b/i, /injur/i], healthType: "injury", fallbackDescription: "An injury is reported or visible" },
  { id: "health.symptom", category: "health", patterns: [/headache/i, /fever/i, /\bcough/i, /\bpain\b/i, /nausea/i, /dizzy/i, /\bsore\b/i], healthType: "symptom", fallbackDescription: "A symptom is reported" },
  // ---- OTHER CATEGORIES (conflict detection only — never an override)
  { id: "meal.food", category: "meal", patterns: [/\b(plate|bowl|dish) of\b/i, /\b(meal|lunch|dinner|breakfast)\b/i, /\bfood\b/i, /\bcurry\b|\brice\b|\bpizza\b|\bburger\b|\bsalad\b|\bsoup\b/i], fallbackDescription: "Food is the main subject" },
  { id: "activity.sport", category: "activity", patterns: [/\b(running|jogging|hiking|cycling|swimming|yoga|gym|workout|football|trek)\b/i, /\btrail\b/i, /\bmarathon\b/i], fallbackDescription: "A physical activity is the main subject" },
];
