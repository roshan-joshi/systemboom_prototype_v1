/**
 * UNIVERSAL COMPOSER — the domain adapters (UC-C3 interaction layer over the canonical
 * field contract).
 *
 * One common composer + a selected adapter. Each adapter contributes its approved QUICK
 * fields and a MORE DETAILS depth that is CONTEXTUAL, never a field matrix (UC-C3 §40/§51):
 * a field renders only when it carries a value or the person deliberately added it
 * ("+ Field" chips — `draft.revealed`); everything else waits. No canonical field
 * disappears — every CURRENT capture from the field contract stays reachable at its depth.
 *
 * Depth policy per domain is frozen by UC-C3 §67: Life Moment Quick+More · Meal Quick+More
 * (+ the deliberate Foods & drinks editor) · Activity Quick+More adaptive by subtype ·
 * Health Quick + PRIVATE HEALTH DETAILS (never a generic "Advanced") · Problem current-state
 * only · Project Quick+More · Meeting stays Basic.
 */
"use client";

import { useEffect, useId, useState } from "react";
import { FEELINGS, type AIConfidence, type FoodFacts, type MealAIObservation, type MealAssetState, type MealFieldCell, type MealNutrientValue, type MealNutritionRecord, type NutritionValue, type ObservedFood } from "../data";
import { DateField } from "../DateField";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sbDate, sbDateCoarse } from "@/lib/i18n/format";
import { confirmFields, edit as editFieldCell, emptyCell as emptyFieldCell, hasUnconfirmed, isBlankValue, supersede, suggest } from "./field-contract";
import { resolveIntent, type ActivityType, type DomainDrafts, type FoodItem, type MealDomain, type HealthType, type RecordIntent, type RecordKind, type UDraft } from "./types";

export const FIELD = "min-h-9 rounded-[10px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-2.5 text-[13px] text-text outline-none placeholder:text-muted focus-visible:outline-[var(--focus)]";
export const LABEL = "text-[11px] font-semibold tracking-[0.14em] text-muted uppercase";
export const ADD_CHIP = "sb-press inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-muted hover:border-steel/60 hover:text-text focus-visible:outline-[var(--focus)]";

/** The seven record choices (§8), in the product's canonical order. */
export const RECORD_KINDS = ["moment", "meal", "activity", "health", "problem", "project", "meeting"] as const;

export const KIND_LABEL_KEY: Record<(typeof RECORD_KINDS)[number], string> = {
  moment: "composer.kindMoment",
  meal: "composer.kindMeal",
  activity: "composer.kindActivity",
  health: "composer.kindHealth",
  problem: "composer.kindProblem",
  project: "composer.kindProject",
  meeting: "composer.kindMeeting",
};

/** UC-C3 §6 — one short human explanation per record type in the chooser. */
export const KIND_DESC_KEY: Record<(typeof RECORD_KINDS)[number], string> = {
  moment: "ucomposer.descMoment",
  meal: "ucomposer.descMeal",
  activity: "ucomposer.descActivity",
  health: "ucomposer.descHealth",
  problem: "ucomposer.descProblem",
  project: "ucomposer.descProject",
  meeting: "ucomposer.descMeeting",
};

/** §5/§14–§19 — the writing area speaks the selected category's own question. */
export const PLACEHOLDER_KEY: Record<RecordIntent, string> = {
  social: "ucomposer.whatsHappening",
  moment: "ucomposer.whatsHappening",
  meal: "ucomposer.whatsHappening",
  activity: "ucomposer.phActivity",
  health: "ucomposer.phHealth",
  problem: "ucomposer.phProblem",
  project: "ucomposer.phProject",
  meeting: "ucomposer.phMeeting",
};

export const OCCASIONS = ["breakfast", "lunch", "dinner", "snack", "drink", "other"] as const;
/** 13_MEAL_FIELDS — the canonical eight contexts (takeaway = Takeaway–Delivery). */
export const MEAL_CONTEXTS = ["home", "restaurant", "takeaway", "packaged", "work", "event", "travel", "other"] as const;
export const ACTIVITY_TYPES: ActivityType[] = ["run", "walk", "cycling", "gym", "hiking", "swimming", "sport", "mindbody", "travel", "learning", "hobby", "other"];
/** UC-C3 §39 — the quick, common subset; the full list lives in the focused type picker. */
export const ACTIVITY_COMMON: ActivityType[] = ["run", "walk", "gym", "cycling"];
/** 38_HEALTH_FIELDS — the canonical record types (Episode is a grouping layer, never here). */
export const HEALTH_TYPES = [
  "symptom", "condition", "injury", "appointment", "diagnosis", "medication", "measurement",
  "test", "imaging", "procedure", "vaccination", "allergy", "dental", "vision", "mental",
  "document", "other",
] as const;
/** UC-C3 §47 — the common/recent Health choices the picker leads with. */
export const HEALTH_COMMON: HealthType[] = ["symptom", "injury", "appointment", "medication", "measurement", "test"];

const CAP = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const occasionKey = (o: string) => `ucomposer.occ${CAP(o)}`;
export const contextKey = (c: string) => `ucomposer.ctx${CAP(c)}`;
export const activityKey = (t: string) => `ucomposer.act${CAP(t)}`;
export const healthTypeKey = (h: string) => `ucomposer.ht${CAP(h)}`;

/** §15 — adaptive Quick metrics per activity subtype. Never every metric at once. */
export function activityQuickMetrics(t: ActivityType | undefined): Array<"distance" | "duration" | "session" | "sport" | "practice"> {
  switch (t) {
    case "run":
    case "walk":
    case "cycling":
    case "hiking":
    case "swimming":
      return ["distance", "duration"];
    case "gym":
      return ["session", "duration"];
    case "sport":
      return ["sport", "duration"];
    case "mindbody":
      return ["practice", "duration"];
    default:
      return [];
  }
}

/* ------------------------------------------------------------------ primitives */

export type SetDraft = (f: (d: UDraft) => UDraft) => void;

export function setDomain<K extends keyof DomainDrafts>(set: SetDraft, key: K, patch: Partial<DomainDrafts[K]>) {
  set((d) => ({ ...d, domains: { ...d.domains, [key]: { ...d.domains[key], ...patch } } }));
}

/** UC-C3 §40 — remember that the person deliberately added this More field. */
export function revealField(set: SetDraft, kind: RecordKind, key: string) {
  set((d) => {
    const cur = d.revealed?.[kind] ?? [];
    if (cur.includes(key)) return d;
    return { ...d, revealed: { ...d.revealed, [kind]: [...cur, key] } };
  });
}

/** A labelled single-select chip row (radio semantics; tap the chosen one to clear when optional). */
export function ChipSelect({ label, options, value, onChange, nameOf, optional = true, hook }: {
  label: string;
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  nameOf: (v: string) => string;
  optional?: boolean;
  hook?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1" data-sb-chipselect={hook}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on && optional ? undefined : o)}
              className={`sb-press inline-flex min-h-9 items-center rounded-full px-3 text-[13px] focus-visible:outline-[var(--focus)] @2xl:min-h-8 ${on ? "bg-[var(--boom-soft)] font-medium text-text" : "text-muted hover:bg-steel/10 hover:text-text"}`}
            >
              {nameOf(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TField({ label, value, onChange, placeholder, hook, textarea, privateHint, autoFocus, onFocus }: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  hook?: string;
  textarea?: boolean;
  privateHint?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL}>{label}</label>
      {textarea ? (
        <textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} placeholder={placeholder} rows={2} autoFocus={autoFocus} onFocus={onFocus} className={`${FIELD} w-full resize-none py-2`} data-sb-ufield={hook} />
      ) : (
        <input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} placeholder={placeholder} autoFocus={autoFocus} onFocus={onFocus} className={`${FIELD} w-full`} data-sb-ufield={hook} />
      )}
      {privateHint && <p className="text-[11px] text-muted">{privateHint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ When (§42/§18) */

const TIME_PRECISIONS = ["day", "month", "year", "approximate"] as const;

/**
 * UC-C3 §42 — ONE understandable time control. Collapsed it states the truth ("Today",
 * the date's own grammar, or "Date unknown") beside Change; opened, it offers the §18
 * precisions (exact date · month · year · approximate) and "I don't know" — never a bare
 * empty date box, never fabricated precision. Life-period precision is a live seam.
 */
export function WhenControl({ draft, set, min, max }: { draft: UDraft; set: SetDraft; min: string; max?: string }) {
  const { t, locale } = useT();
  const id = useId();
  // The Circle doorway and an edit arrive AT a time — their editor opens ready.
  const [openEditor, setOpenEditor] = useState(!!draft.eventTime);
  const precisionKey = (p: string) =>
    p === "day" ? "ucomposer.precDay" : p === "month" ? "ucomposer.precMonth" : p === "year" ? "ucomposer.precYear" : "ucomposer.precApprox";
  const ev = draft.eventTime;
  const valueText = draft.timeUnknown
    ? t("ucomposer.dateUnknown")
    : !ev
      ? t("ucomposer.whenToday")
      : ev.precision === "month" || ev.precision === "year"
        ? sbDateCoarse(locale, `${ev.date}T00:00:00`, ev.precision)
        : ev.precision === "approximate"
          ? t("moments.around", { date: sbDate(locale, `${ev.date}T00:00:00`) })
          : sbDate(locale, `${ev.date}T00:00:00`);
  return (
    <div className="flex flex-col gap-1.5" data-sb-when>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={LABEL}>{t("ucomposer.when")}</span>
        <span className="text-[13px] text-text tabular-nums" data-sb-when-value>{valueText}</span>
        {!openEditor && (
          <button type="button" aria-expanded={false} onClick={() => setOpenEditor(true)} className="sb-press min-h-7 rounded-full px-1.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-when-change>
            {t("ucomposer.change")}
          </button>
        )}
      </div>
      {openEditor && (
        <div className="sb-reveal flex flex-col gap-1.5">
          {!draft.timeUnknown && (
            <DateField
              id={id}
              value={ev?.date ?? ""}
              onChange={(v) => set((d) => ({ ...d, eventTime: v ? { date: v, precision: d.eventTime && d.eventTime.precision !== "minute" ? d.eventTime.precision : "day", provenance: "user" } : undefined }))}
              min={min}
              max={max}
              label={t("ucomposer.when")}
            />
          )}
          {!draft.timeUnknown && ev && (
            <ChipSelect
              label={t("ucomposer.precisionLabel")}
              options={TIME_PRECISIONS}
              value={ev.precision === "minute" ? "day" : ev.precision}
              onChange={(v) => set((d) => (d.eventTime ? { ...d, eventTime: { ...d.eventTime, precision: (v ?? "day") as "day" | "month" | "year" | "approximate" } } : d))}
              nameOf={(p) => t(precisionKey(p))}
              optional={false}
              hook="timePrecision"
            />
          )}
          {resolveIntent(draft) !== "social" && (
            <button
              type="button"
              aria-pressed={!!draft.timeUnknown}
              onClick={() => set((d) => (d.timeUnknown ? { ...d, timeUnknown: undefined } : { ...d, timeUnknown: true, eventTime: undefined }))}
              className={`sb-press inline-flex min-h-8 w-fit items-center rounded-full px-3 text-[12px] focus-visible:outline-[var(--focus)] ${draft.timeUnknown ? "bg-[var(--boom-soft)] font-medium text-text" : "text-muted hover:bg-steel/10 hover:text-text"}`}
              data-sb-time-unknown
            >
              {t("ucomposer.dontKnow")}
            </button>
          )}
          {draft.timeUnknown && <p className="text-[11px] text-muted">{t("ucomposer.dateUnknownHint")}</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------ contextual More details (§40/§51) */

type MoreDef = { key: string; labelKey: string; textarea?: boolean; hint?: string };

const MORE_DEFS: Record<Exclude<RecordKind, "health">, MoreDef[]> = {
  moment: [
    { key: "feeling", labelKey: "ucomposer.feelingLabel" },
    { key: "story", labelKey: "ucomposer.story", textarea: true },
    { key: "milestone", labelKey: "ucomposer.milestoneLabel" },
    { key: "chapter", labelKey: "ucomposer.chapter" },
  ],
  meal: [
    { key: "preparation", labelKey: "ucomposer.preparation" },
    { key: "ingredients", labelKey: "ucomposer.ingredients" },
    { key: "experience", labelKey: "ucomposer.experience" },
    { key: "cost", labelKey: "ucomposer.cost" },
    { key: "foodItems", labelKey: "ucomposer.foodItems" },
    { key: "notes", labelKey: "ucomposer.mealNotes" },
  ],
  activity: [
    // per-subtype extras are prepended adaptively in DomainMore (04_ACTIVITY_TYPES)
    { key: "purpose", labelKey: "ucomposer.purposeLabel" },
    { key: "felt", labelKey: "ucomposer.felt" },
    { key: "intensity", labelKey: "ucomposer.intensity" },
    { key: "route", labelKey: "ucomposer.route" },
    { key: "goal", labelKey: "ucomposer.goal" },
    { key: "notes", labelKey: "ucomposer.notes" },
  ],
  problem: [
    { key: "impact", labelKey: "ucomposer.impact" },
    { key: "urgency", labelKey: "ucomposer.urgency" },
    { key: "category", labelKey: "ucomposer.problemCategory" },
    { key: "relatedProject", labelKey: "ucomposer.relatedProject" },
    { key: "attempt", labelKey: "ucomposer.attempt", textarea: true },
    { key: "nextAction", labelKey: "ucomposer.nextAction" },
    { key: "notes", labelKey: "ucomposer.notes" },
  ],
  project: [
    { key: "target", labelKey: "ucomposer.targetLabel" },
    { key: "milestone", labelKey: "ucomposer.milestoneLabel" },
    { key: "focus", labelKey: "ucomposer.focusLabel" },
    { key: "relatedProblem", labelKey: "ucomposer.relatedProblem" },
    { key: "notes", labelKey: "ucomposer.notes" },
  ],
  meeting: [
    { key: "purpose", labelKey: "ucomposer.purpose" },
    { key: "duration", labelKey: "ucomposer.duration" },
    { key: "related", labelKey: "ucomposer.relatedTo" },
    { key: "notes", labelKey: "ucomposer.notes" },
  ],
};

/** UC-C3 §45 — a chosen Meal context auto-opens only ITS relevant fields. */
const MEAL_CONTEXT_PRIORITY: Record<string, string[]> = {
  home: ["preparation", "ingredients"],
  restaurant: ["experience", "cost"],
  takeaway: ["cost"],
  packaged: ["ingredients"],
  work: [],
  event: ["experience"],
  travel: ["experience"],
  other: [],
};

/** 04_ACTIVITY_TYPES — subtype extras, prepended to the More set for the active type. */
const ACTIVITY_EXTRAS: Partial<Record<ActivityType, MoreDef[]>> = {
  walk: [{ key: "steps", labelKey: "ucomposer.steps" }],
  run: [{ key: "pace", labelKey: "ucomposer.pace" }, { key: "elevation", labelKey: "ucomposer.elevation" }],
  cycling: [{ key: "avgSpeed", labelKey: "ucomposer.avgSpeed" }, { key: "elevation", labelKey: "ucomposer.elevation" }],
  hiking: [{ key: "elevation", labelKey: "ucomposer.elevation" }],
  gym: [{ key: "exercises", labelKey: "ucomposer.exercises" }],
  sport: [{ key: "team", labelKey: "ucomposer.team" }, { key: "opponent", labelKey: "ucomposer.opponent" }],
  swimming: [{ key: "laps", labelKey: "ucomposer.laps" }, { key: "stroke", labelKey: "ucomposer.stroke" }],
  mindbody: [{ key: "style", labelKey: "ucomposer.styleLabel" }],
  hobby: [{ key: "workedOn", labelKey: "ucomposer.workedOn" }],
  learning: [{ key: "topic", labelKey: "ucomposer.topic" }, { key: "learned", labelKey: "ucomposer.learned" }],
  travel: [{ key: "transport", labelKey: "ucomposer.transport" }],
};

function domainValue(d: UDraft, kind: RecordKind, key: string): unknown {
  return (d.domains[kind] as Record<string, unknown>)[key];
}

/** One contextual field group: visible fields first, then "+ Field" chips for the rest. */
function AddableFields({ draft, set, kind, defs }: { draft: UDraft; set: SetDraft; kind: RecordKind; defs: MoreDef[] }) {
  const { t } = useT();
  const revealed = draft.revealed?.[kind] ?? [];
  // §65 — a just-added field receives focus once; consuming the focus clears the marker.
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const visible = defs.filter((f) => revealed.includes(f.key) || domainValue(draft, kind, f.key) !== undefined);
  const addable = defs.filter((f) => !visible.includes(f));
  return (
    <div className="grid gap-3">
      {visible.map((f) =>
        f.key === "feeling" && kind === "moment" ? (
          <ChipSelect key={f.key} label={t("ucomposer.feelingLabel")} options={FEELINGS} value={draft.domains.moment.feeling} onChange={(v) => setDomain(set, "moment", { feeling: v })} nameOf={(o) => o} hook="feeling" />
        ) : f.key === "foodItems" && kind === "meal" ? (
          <FoodItemsEditor key={f.key} items={draft.domains.meal.foodItems ?? []} onChange={(items) => setDomain(set, "meal", { foodItems: items.length ? items : undefined })} />
        ) : (
          <TField
            key={f.key}
            label={t(f.labelKey)}
            value={domainValue(draft, kind, f.key) as string | undefined}
            onChange={(v) => setDomain(set, kind, { [f.key]: v } as never)}
            textarea={f.textarea}
            hook={f.key}
            autoFocus={justAdded === f.key}
            onFocus={() => justAdded === f.key && setJustAdded(null)}
          />
        ),
      )}
      {addable.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-sb-add-fields>
          {addable.map((f) => (
            <button key={f.key} type="button" onClick={() => { setJustAdded(f.key); revealField(set, kind, f.key); }} aria-label={t("ucomposer.addFieldAria", { field: t(f.labelKey) })} className={ADD_CHIP} data-sb-add-field={f.key}>
              <span aria-hidden>+</span> {t(f.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ adapters */

/**
 * SOCIAL QUICK for the selected record kind — only what the workbook approves at quick
 * depth, and never a wall: Activity leads with its common four (the full picker is a
 * sheet, §39), Health leads with a Choose control (§47).
 */
export function DomainQuick({ draft, set, min, onOpenSheet, activityCommon = ACTIVITY_COMMON }: { draft: UDraft; set: SetDraft; min: string; onOpenSheet: (s: "activityType" | "healthType") => void; activityCommon?: ActivityType[] }) {
  const { t } = useT();
  const d = draft.domains;
  switch (draft.intent) {
    case "meal":
      return (
        <div className="grid gap-3" data-sb-domain-quick="meal">
          <ChipSelect label={t("ucomposer.occasion")} options={OCCASIONS} value={d.meal.occasion} onChange={(v) => setDomain(set, "meal", { occasion: v as never })} nameOf={(o) => t(occasionKey(o))} hook="occasion" />
          {d.meal.occasion === "other" && (
            /* 13_MEAL_FIELDS — the occasion is editable/custom; one culture's schedule is never assumed */
            <TField label={t("ucomposer.occasionCustom")} value={d.meal.occasionCustom} onChange={(v) => setDomain(set, "meal", { occasionCustom: v })} hook="occasionCustom" />
          )}
          <TField label={t("ucomposer.whatDidYouHave")} value={d.meal.items} onChange={(v) => setDomain(set, "meal", { items: v })} hook="items" />
        </div>
      );
    case "activity": {
      const metrics = activityQuickMetrics(d.activity.type);
      return (
        <div className="grid gap-3" data-sb-domain-quick="activity">
          {/* §39 — a light quick row: the common four + More; the full canonical list is a
              sheet. Zero-effort capture (§1): the four are the PERSON'S OWN most-used
              types once they have any, never a fixed default forever. */}
          {!d.activity.type ? (
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("ucomposer.activityType")}</span>
              <div role="group" aria-label={t("ucomposer.activityType")} className="flex flex-wrap gap-1" data-sb-activity-common>
                {activityCommon.map((o) => (
                  <button key={o} type="button" onClick={() => setDomain(set, "activity", { type: o })} className="sb-press inline-flex min-h-9 items-center rounded-full px-3 text-[13px] text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)] @2xl:min-h-8">
                    {t(activityKey(o))}
                  </button>
                ))}
                <button type="button" onClick={() => onOpenSheet("activityType")} className="sb-press inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)] @2xl:min-h-8" data-sb-activity-more-types>
                  {t("ucomposer.moreTypes")}
                </button>
              </div>
            </div>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]" data-sb-activity-chosen={d.activity.type}>
              <span className={LABEL}>{t("ucomposer.activityType")}</span>
              <span className="font-medium text-text">{t(activityKey(d.activity.type))}</span>
              <button type="button" onClick={() => onOpenSheet("activityType")} className="sb-press min-h-7 rounded-full px-1.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-activity-change>
                {t("ucomposer.change")}
              </button>
            </p>
          )}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3" data-sb-activity-metrics={d.activity.type}>
              {metrics.map((m) => (
                <TField
                  key={m}
                  label={t(m === "session" ? "ucomposer.session" : m === "sport" ? "ucomposer.sportName" : m === "practice" ? "ucomposer.practice" : `ucomposer.${m}`)}
                  value={d.activity[m]}
                  onChange={(v) => setDomain(set, "activity", { [m]: v })}
                  hook={m}
                />
              ))}
            </div>
          )}
          {/* sport/swim state their one structural nuance right beside the type (04) */}
          {d.activity.type === "sport" && (
            <ChipSelect label={t("ucomposer.matchKind")} options={["match", "training"]} value={d.activity.matchKind} onChange={(v) => setDomain(set, "activity", { matchKind: v as never })} nameOf={(o) => t(o === "match" ? "ucomposer.matchMatch" : "ucomposer.matchTraining")} hook="matchKind" />
          )}
          {d.activity.type === "swimming" && (
            <ChipSelect label={t("ucomposer.water")} options={["pool", "open"]} value={d.activity.water} onChange={(v) => setDomain(set, "activity", { water: v as never })} nameOf={(o) => t(o === "pool" ? "ucomposer.waterPool" : "ucomposer.waterOpen")} hook="water" />
          )}
        </div>
      );
    }
    case "health":
      return (
        <div className="grid gap-3" data-sb-domain-quick="health">
          <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
            <span className={LABEL}>{t("ucomposer.healthType")}</span>
            {d.health.healthType && <span className="font-medium text-text">{t(healthTypeKey(d.health.healthType))}</span>}
            <button type="button" onClick={() => onOpenSheet("healthType")} className="sb-press min-h-7 rounded-full px-1.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-health-choose>
              {d.health.healthType ? t("ucomposer.change") : t("ucomposer.choose")}
            </button>
          </p>
          <TField label={t("ucomposer.bodyArea")} value={d.health.bodyArea} onChange={(v) => setDomain(set, "health", { bodyArea: v })} hook="bodyArea" />
        </div>
      );
    case "problem":
      // §17/§50 — quick Problem is the words themselves; Status=Open is internal, never asked.
      return null;
    case "project":
      return (
        <div className="grid gap-3 @2xl:grid-cols-2" data-sb-domain-quick="project">
          <TField label={t("ucomposer.projectTitle")} value={d.project.title} onChange={(v) => setDomain(set, "project", { title: v })} hook="projectTitle" />
          <TField label={t("ucomposer.goal")} value={d.project.goal} onChange={(v) => setDomain(set, "project", { goal: v })} hook="goal" />
        </div>
      );
    case "meeting":
      return (
        <div className="grid gap-3" data-sb-domain-quick="meeting">
          <TField label={t("ucomposer.subject")} value={d.meeting.subject} onChange={(v) => setDomain(set, "meeting", { subject: v })} hook="subject" />
          {/* §19 — Meeting is the one kind whose When is visible immediately */}
          <WhenControl draft={draft} set={set} min={min} />
        </div>
      );
    default:
      return null; // moment/social — the common composer is already the quick record (§13)
  }
}

/**
 * MORE DETAILS per kind — contextual additions, never a matrix (§40/§51). Health's depth
 * is PRIVATE HEALTH DETAILS (§48/§49), grouped and named for what it is.
 */
export function DomainMore({ draft, set, min, assets }: { draft: UDraft; set: SetDraft; min: string; assets?: { cells: MealAssetState; onEdit: (f: MealAssetField, text: string) => void } }) {
  const { t } = useT();
  const d = draft.domains;
  switch (draft.intent) {
    case "moment":
      return (
        <div className="grid gap-3" data-sb-domain-more="moment">
          <WhenControl draft={draft} set={set} min={min} />
          <AddableFields draft={draft} set={set} kind="moment" defs={MORE_DEFS.moment} />
        </div>
      );
    case "meal": {
      const ctx = d.meal.context;
      const priority = ctx ? MEAL_CONTEXT_PRIORITY[ctx] ?? [] : [];
      const defs = [...MORE_DEFS.meal].sort((a, b) => {
        const pa = priority.indexOf(a.key);
        const pb = priority.indexOf(b.key);
        return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
      });
      // §45 — the chosen context's own fields open by themselves; the rest stay chips
      const revealed = new Set([...(draft.revealed?.meal ?? []), ...priority]);
      const adapted: UDraft = { ...draft, revealed: { ...draft.revealed, meal: [...revealed] } };
      return (
        <div className="grid gap-3" data-sb-domain-more="meal">
          <ChipSelect label={t("ucomposer.context")} options={MEAL_CONTEXTS} value={ctx} onChange={(v) => setDomain(set, "meal", { context: v as never })} nameOf={(o) => t(contextKey(o))} hook="context" />
          {assets && <MealAssetEditors cells={assets.cells} onEdit={assets.onEdit} />}
          <AddableFields draft={adapted} set={set} kind="meal" defs={defs} />
          <WhenControl draft={draft} set={set} min={min} />
        </div>
      );
    }
    case "activity": {
      const defs = [...(ACTIVITY_EXTRAS[d.activity.type as ActivityType] ?? []), ...MORE_DEFS.activity];
      return (
        <div className="grid gap-3" data-sb-domain-more="activity">
          <AddableFields draft={draft} set={set} kind="activity" defs={defs} />
          <WhenControl draft={draft} set={set} min={min} />
        </div>
      );
    }
    case "health": {
      const ht = d.health.healthType;
      return (
        <div className="grid gap-3" data-sb-domain-more="health">
          {/* §22/§48 — ONE clear boundary, stated once, grouped visually */}
          <section className="grid gap-1" data-sb-shared-group>
            <span className={LABEL}>{t("ucomposer.sharedInPost")}</span>
            <p className="text-[12px] text-muted">{t("ucomposer.sharedInPostNote")}</p>
          </section>
          <section className="grid gap-3 rounded-[14px] border border-[var(--hair)] p-3" data-sb-private-group>
            <span className={LABEL}>{t("ucomposer.privateHealthDetails")}</span>
            <WhenControl draft={draft} set={set} min={min} />
            {ht === "measurement" && (
              <div className="grid grid-cols-2 gap-3" data-sb-health-adaptive="measurement">
                <TField label={t("ucomposer.measureValue")} value={d.health.measureValue} onChange={(v) => setDomain(set, "health", { measureValue: v })} hook="measureValue" />
                <TField label={t("ucomposer.measureUnit")} value={d.health.measureUnit} onChange={(v) => setDomain(set, "health", { measureUnit: v })} hook="measureUnit" />
              </div>
            )}
            {ht === "medication" && (
              <div data-sb-health-adaptive="medication">
                <TField label={t("ucomposer.medicationName")} value={d.health.medication} onChange={(v) => setDomain(set, "health", { medication: v })} hook="medication" />
              </div>
            )}
            <TField label={t("ucomposer.severity")} value={d.health.severity} onChange={(v) => setDomain(set, "health", { severity: v })} hook="severity" />
            <TField
              label={t("ucomposer.privateNote")}
              value={d.health.privateNote}
              onChange={(v) => setDomain(set, "health", { privateNote: v })}
              textarea
              privateHint={t("ucomposer.privateNoteHint")}
              hook="privateNote"
            />
          </section>
        </div>
      );
    }
    case "problem":
      return (
        <div className="grid gap-3" data-sb-domain-more="problem">
          <AddableFields draft={draft} set={set} kind="problem" defs={MORE_DEFS.problem} />
          <WhenControl draft={draft} set={set} min={min} />
        </div>
      );
    case "project":
      return (
        <div className="grid gap-3" data-sb-domain-more="project">
          <AddableFields draft={draft} set={set} kind="project" defs={MORE_DEFS.project} />
          <WhenControl draft={draft} set={set} min={min} />
        </div>
      );
    case "meeting":
      return (
        <div className="grid gap-3" data-sb-domain-more="meeting">
          <AddableFields draft={draft} set={set} kind="meeting" defs={MORE_DEFS.meeting} />
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input type="checkbox" checked={!!d.meeting.online} onChange={(e) => setDomain(set, "meeting", { online: e.target.checked || undefined })} className="accent-[#d92a20]" data-sb-ufield="online" />
            {t("ucomposer.online")}
          </label>
        </div>
      );
    default:
      return null;
  }
}

/** Whether the selected kind has a More-details drawer at all. */
export function hasMore(intent: RecordIntent): boolean {
  return intent !== "social";
}

/** UC-C3 §67 — Health's depth is named for what it is, never a generic label. */
export function moreLabelKey(intent: RecordIntent): string {
  return intent === "health" ? "ucomposer.privateHealthDetails" : "ucomposer.moreDetails";
}

/* --------------------------------------------- Foods & drinks (§46 — human cards) */

/**
 * 13_MEAL_FIELDS — the structured MealFoodItem list ("do not flatten"). Human item rows:
 * name + portion written in place (borderless, card-like), one quiet remove, one add.
 * Deeper per-item structure (product/nutrition/allergen evidence) is the live specialist
 * layer — never quick-meal nutrition software.
 */
export function FoodItemsEditor({ items, onChange }: { items: FoodItem[]; onChange: (items: FoodItem[]) => void }) {
  const { t } = useT();
  // UC-MEAL-AI — editing a suggested item's own name is the person's correction: its lifecycle
  // moves "suggested" → "corrected" (§FOOD ITEM STATE). A manually-typed item (no `state` at
  // all) is untouched by this — it was never a suggestion to correct.
  const patch = (i: number, p: Partial<FoodItem>) =>
    onChange(
      items.map((it, j) => {
        if (j !== i) return it;
        const next = { ...it, ...p };
        if ("name" in p && it.state === "suggested" && p.name !== it.name) next.state = "corrected";
        return next;
      }),
    );
  return (
    <div className="grid gap-1.5" data-sb-fooditems>
      <span className={LABEL}>{t("ucomposer.foodItems")}</span>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-1.5" data-sb-fooditem={i}>
          <span className="flex min-w-0 flex-1 flex-col">
            <input value={it.name} onChange={(e) => patch(i, { name: e.target.value })} placeholder={t("ucomposer.itemName")} aria-label={t("ucomposer.itemName")} className="w-full bg-transparent text-[13px] font-medium text-text outline-none placeholder:text-muted focus-visible:outline-[var(--focus)]" />
            <input value={it.quantity ?? ""} onChange={(e) => patch(i, { quantity: e.target.value || undefined })} placeholder={t("ucomposer.itemQty")} aria-label={t("ucomposer.itemQty")} className="w-full bg-transparent text-[12px] text-muted outline-none placeholder:text-muted/70 focus-visible:outline-[var(--focus)]" />
          </span>
          <button type="button" aria-label={t("ucomposer.removeItem")} onClick={() => onChange(items.filter((_, j) => j !== i))} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { name: "" }])} className={`${ADD_CHIP} w-fit`} data-sb-add-item>
        <span aria-hidden>+</span> {t("ucomposer.addItem")}
      </button>
    </div>
  );
}

/* --------------------------------------------- Meal AI suggestion (UC-MEAL-AI) */

/**
 * The factual nutrition line, shared by both suggestion cards. CONFIDENT: clean figures. LIKELY:
 * the same figures plus "based on …" — conditional transparency, never a score, never the verbose
 * source description, never an AI badge.
 */
function factLineText(ff: FoodFacts): string {
  const parts: string[] = [];
  if (typeof ff.nutrition.calories === "number") parts.push(`${Math.round(ff.nutrition.calories)} ${ff.units.calories}`);
  if (typeof ff.nutrition.protein === "number") parts.push(`${Math.round(ff.nutrition.protein)} ${ff.units.protein} protein`);
  if (typeof ff.nutrition.carbs === "number") parts.push(`${Math.round(ff.nutrition.carbs)} ${ff.units.carbs} carbs`);
  if (typeof ff.nutrition.fat === "number") parts.push(`${Math.round(ff.nutrition.fat)} ${ff.units.fat} fat`);
  return `${parts.join(" · ")} · ${ff.basis}${ff.match === "likely" && ff.basedOn ? ` · based on ${ff.basedOn}` : ""}`;
}

/** MEAL CAPTURE UX — the lookup key for the Meal identity's structured facts (same rule the
 *  Composer uses when it asks USDA/OFF): canonicalName, falling back to the everyday name. */
export const mealFactKey = (obs: MealAIObservation): string | null => (obs.meal?.name ? (obs.meal.canonicalName ?? obs.meal.name) : null);

/**
 * MEAL CAPTURE UX — a USABLE identity is a named one the model is not unsure of. A LOW or unnamed
 * identity is never offered, never looked up, never saved as a default — "can you name it?" instead.
 */
export const usableMealIdentity = (obs: MealAIObservation | null | undefined): { name: string; confidence: "high" | "medium" } | null =>
  obs?.meal?.name && obs.meal.confidence !== "low" ? { name: obs.meal.name, confidence: obs.meal.confidence } : null;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const isIdentityItem = (f: FoodItem, name: string) => f.source === "ai_visual_estimate" && f.name === name;

/** The meal occasion implied by WHEN THE PHOTO WAS TAKEN (its own capture time, from the file's metadata). */
export function occasionFromCapture(takenAt?: string): "breakfast" | "lunch" | "snack" | "dinner" | undefined {
  const m = takenAt?.match(/T(\d{2}):/);
  if (!m) return undefined;
  const h = Number(m[1]);
  return h >= 5 && h < 11 ? "breakfast" : h >= 11 && h < 15 ? "lunch" : h >= 15 && h < 17 ? "snack" : h >= 17 && h < 22 ? "dinner" : "snack";
}

/** MEAL AUTOFILL — the nutrition the Meal is recorded with: a structured fact (USDA / Open Food Facts)
 *  when one was found for the identity, else the AI's own clearly-labelled estimate; never invented. */
export function mealNutritionOf(obs: MealAIObservation | null | undefined, facts: Record<string, FoodFacts | "uncertain" | null> | undefined): MealNutritionRecord | undefined {
  if (!obs?.meal?.name) return undefined;
  const key = mealFactKey(obs);
  const f = key && facts && Object.prototype.hasOwnProperty.call(facts, key) ? facts[key] : undefined;
  if (f && f !== "uncertain") {
    const v = (n: number | undefined, unit: string): NutritionValue | undefined =>
      typeof n === "number" ? { value: n, unit, source: f.source, confidence: f.match === "confident" ? "high" : "medium" } : undefined;
    return { basis: f.basis, name: f.matchedName, calories: v(f.nutrition.calories, f.units.calories), protein: v(f.nutrition.protein, f.units.protein), carbs: v(f.nutrition.carbs, f.units.carbs), fat: v(f.nutrition.fat, f.units.fat) };
  }
  const e = obs.nutritionEstimate;
  if (e && (e.calories || e.protein || e.carbs || e.fat)) return { basis: "whole meal · visual estimate", calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat };
  return undefined;
}

/**
 * MEAL CAPTURE UX — applied to the draft at POST time (the Composer's submit), never earlier, so a
 * late AI answer can never touch what the person is typing.
 *  - CORRECTION: if the person changed the name of an identity they were offered (Adjust), the item
 *    becomes their own corrected value.
 *  - CLEARED: if the person emptied the Meal name, the AI's identity item is recorded as rejected —
 *    clearing is a decision, never silently undone.
 * The AI observation itself is never touched; anything else is left exactly as it is.
 */
export function finalizeMealIdentity(d: UDraft): UDraft {
  const m = d.domains.meal;
  const id = usableMealIdentity(m.aiObservation);
  if (!id) return d;
  const typed = (m.items ?? "").trim();
  const items = m.foodItems ?? [];
  const idx = items.findIndex((f) => isIdentityItem(f, id.name));
  if (idx >= 0 && !typed) {
    const next = items.map((f, i) => (i === idx ? { ...f, state: "rejected" as const } : f));
    return { ...d, domains: { ...d.domains, meal: { ...m, foodItems: next } } };
  }
  if (idx >= 0 && typed && !sameName(typed, id.name)) {
    const next = items.map((f, i) => (i === idx ? { name: typed, quantity: f.quantity, source: "user" as const, state: "corrected" as const } : f));
    return { ...d, domains: { ...d.domains, meal: { ...m, foodItems: next } } };
  }
  return d;
}


/* ================================================================================================
 * MEAL V1 — PER-PHOTO EFFECTIVE FORM
 *
 * Every attached photo owns its OWN complete Meal form (`MealAssetState`, keyed by the photo's stable
 * asset id — never by array position). The photo that is selected decides which one the editors show and
 * which one every edit / clear / Looks right / Adjust acts on; the Meal stays ONE record.
 *
 * Aggressive fill: HIGH and MEDIUM confidence populate the field automatically, LOW or missing stays
 * blank. The person sees one clean value per field; the cell keeps the original reading, its confidence,
 * its source (USDA fdcId / Open Food Facts code / basis) and what the person did with it
 * (suggested default → confirmed | corrected | cleared). A cleared or corrected field is the person's:
 * nothing — a late analysis, a re-render, switching photos — ever restores it.
 * ============================================================================================== */
export const MEAL_ASSET_FIELDS = ["name", "components", "preparation", "portion", "occasion", "setting", "calories", "protein", "carbs", "fat"] as const;
export type MealAssetField = (typeof MEAL_ASSET_FIELDS)[number];
export const MEAL_NUTRIENTS = ["calories", "protein", "carbs", "fat"] as const;

const nowISO = () => new Date().toISOString();
const emptyCell = <V,>(): MealFieldCell<V> => emptyFieldCell<V, NonNullable<MealFieldCell<V>["source"]>, NonNullable<MealFieldCell<V>["ref"]>>();

export function blankAssetMeal(assetId: string, observation?: MealAIObservation | null): MealAssetState {
  return { assetId, observation, name: emptyCell(), components: emptyCell(), preparation: emptyCell(), portion: emptyCell(), occasion: emptyCell(), setting: emptyCell(), calories: emptyCell(), protein: emptyCell(), carbs: emptyCell(), fat: emptyCell() };
}

/** A photo attached AFTER the person already typed Meal fields: those values belong to the person, so the
 *  photo's form starts from them (state "corrected" = the person's own) instead of hiding them. */
export function seedAssetMeal(assetId: string, m: MealDomain): MealAssetState {
  const st = blankAssetMeal(assetId);
  const own = <V,>(value: V | undefined): MealFieldCell<V> => (value === undefined ? emptyCell<V>() : { value, state: "corrected", source: "user", at: nowISO() });
  return { ...st, name: own(m.items?.trim() || undefined), preparation: own(m.preparation?.trim() || undefined), occasion: own<string>(m.occasion), setting: own<string>(m.context) };
}

const lowestConfidence = (list: AIConfidence[]): AIConfidence => (list.includes("medium") ? "medium" : "high");

/** Fill ONE cell from a reading — the universal field contract's `suggest` (only while never filled, never over the person's own value,
 *  low confidence stays blank). Which fields exist and what their readings mean stays Meal's. */
function fillCell<V>(cell: MealFieldCell<V>, value: V | undefined, meta: Pick<MealFieldCell<V>, "confidence" | "source" | "ref">): MealFieldCell<V> {
  return suggest(cell, value, meta);
}

const estimateOf = (obs: MealAIObservation, k: (typeof MEAL_NUTRIENTS)[number]): MealFieldCell<MealNutrientValue> | null => {
  const e = obs.nutritionEstimate?.[k];
  if (!e?.range || e.confidence === "low") return null; // LOW stays blank
  return { state: "default", value: { range: e.range, unit: e.unit }, original: { range: e.range, unit: e.unit }, confidence: e.confidence, source: "ai_estimate" };
};

/** Fill a photo's form from ITS OWN observation (aggressive: high + medium fill, low / missing stay blank). */
export function fillAssetMeal(st: MealAssetState, obs: MealAIObservation, takenAt?: string): MealAssetState {
  if (!obs.meal) return { ...st, observation: obs }; // legacy observations carry no Meal identity: nothing to fill
  const id = usableMealIdentity(obs);
  const comps = (obs.visibleComponents ?? []).map((c) => c.name);
  const compConf = lowestConfidence((obs.visibleComponents ?? []).map((c) => c.confidence));
  const occ = obs.possibleMealType ?? occasionFromCapture(takenAt);
  const setting = obs.meal.brand ? "packaged" : obs.setting;
  let next: MealAssetState = {
    ...st,
    observation: obs,
    name: fillCell(st.name, id?.name, { confidence: id?.confidence, source: "ai_visual_estimate" }),
    components: fillCell(st.components, comps.length ? comps : undefined, { confidence: compConf, source: "ai_visual_estimate" }),
    preparation: fillCell(st.preparation, obs.preparation, { confidence: obs.preparationConfidence ?? "high", source: "ai_visual_estimate" }),
    portion: fillCell(st.portion, obs.portion, { confidence: obs.portionConfidence ?? "high", source: "ai_visual_estimate" }),
    occasion: fillCell(st.occasion, occ, obs.possibleMealType ? { confidence: "medium", source: "ai_visual_estimate" } : { confidence: "medium", source: "metadata" }),
    setting: fillCell(st.setting, setting, obs.meal.brand ? { confidence: "high", source: "ai_visual_estimate" } : { confidence: obs.settingConfidence ?? "high", source: "ai_visual_estimate" }),
  };
  for (const k of MEAL_NUTRIENTS) {
    const est = estimateOf(obs, k);
    if (est && next[k].original === undefined && next[k].state === "default") next = { ...next, [k]: est };
  }
  return next;
}

/** Meal owns its source vocabulary and priority; the contract only applies the rule. A structured fact outranks (or equals) any estimate. */
const MEAL_SOURCE_RANK: Record<string, number> = { ai_estimate: 1, ai_visual_estimate: 1, metadata: 1, usda: 3, openfoodfacts: 3 };
const mealOutranks = (incoming: string | undefined, current: string | undefined) => (MEAL_SOURCE_RANK[incoming ?? ""] ?? 0) >= (MEAL_SOURCE_RANK[current ?? ""] ?? 0);

/** A structured fact (USDA / Open Food Facts) arrived for this photo's meal: it replaces the AI estimate in
 *  every nutrient the person has not touched. Their own value / clear / confirmation is never replaced. */
export function applyAssetFacts(st: MealAssetState, f: FoodFacts): MealAssetState {
  let next = st;
  const ref = { fdcId: f.fdcId, productId: f.productId, basis: f.basis, matchedName: f.matchedName };
  for (const k of MEAL_NUTRIENTS) {
    const n = f.nutrition[k];
    if (typeof n !== "number") continue;
    const reading: MealNutrientValue = { value: n, unit: f.units[k] };
    next = { ...next, [k]: supersede(next[k], reading, { confidence: f.match === "confident" ? "high" : "medium", source: f.source, ref }, mealOutranks) };
  }
  return next;
}

export { isBlankValue };

/** The person edits (or clears) ONE field of ONE photo — and nothing else changes (the contract's `edit`: blank = cleared, same as the
 *  original = confirmed, anything else = corrected; the original evidence is never rewritten). */
export function editAssetField<K extends MealAssetField>(st: MealAssetState, field: K, value: MealAssetState[K]["value"]): MealAssetState {
  return { ...st, [field]: editFieldCell(st[field] as MealFieldCell<unknown>, value) };
}

/** Looks right: the person accepts EVERYTHING currently shown and populated for this photo (the contract's `confirmFields` over this
 *  photo's own field set). Only the state changes (default → confirmed) — source, reference and observation stay exactly as they were. */
export function confirmAssetMeal(st: MealAssetState): MealAssetState {
  return confirmFields(st, MEAL_ASSET_FIELDS);
}
export const assetHasUnconfirmed = (st: MealAssetState | undefined) => hasUnconfirmed(st, MEAL_ASSET_FIELDS);

/** text ↔ value for the editors */
export const componentsText = (v?: string[]) => (v ?? []).join(", ");
export const parseComponents = (t: string): string[] => t.split(/[,·;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
export const nutrientText = (v?: MealNutrientValue) => (v ? (v.value !== undefined ? String(v.value) : v.range ? `${v.range.min}–${v.range.max}` : "") : "");
/** "400" → a value, "650–1050" → a range, "" → cleared; anything else → null (not a nutrient reading — the edit is ignored). */
export function parseNutrient(text: string, unit: string): MealNutrientValue | undefined | null {
  const t = text.trim().replace(/[~≈]/g, "").trim();
  if (!t) return undefined;
  const r = t.match(/^(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)$/);
  if (r) {
    const a = Number(r[1]);
    const b = Number(r[2]);
    return { range: { min: Math.min(a, b), max: Math.max(a, b) }, unit };
  }
  return /^\d+(?:\.\d+)?$/.test(t) ? { value: Number(t), unit } : null;
}

/** The Meal editors read the SELECTED photo's effective values through this view of the draft. */
export function overlayMealDraft(d: UDraft, st: MealAssetState): UDraft {
  // Preparation is always a visible editor while the form belongs to a photo (a cleared value must stay clearable/typable, not fold into a chip).
  const revealed = { ...d.revealed, meal: [...new Set([...(d.revealed?.meal ?? []), "preparation"])] };
  return { ...d, revealed, domains: { ...d.domains, meal: { ...d.domains.meal, items: st.name.value, preparation: st.preparation.value, occasion: st.occasion.value as MealDomain["occasion"], context: st.setting.value as MealDomain["context"] } } };
}
/** the four fields a draft-shaped editor can change that belong to the photo */
export function assetEditsFromDraft(before: UDraft, after: UDraft): Partial<Record<MealAssetField, string | undefined>> {
  const b = before.domains.meal;
  const a = after.domains.meal;
  const out: Partial<Record<MealAssetField, string | undefined>> = {};
  if (a.items !== b.items) out.name = a.items;
  if (a.preparation !== b.preparation) out.preparation = a.preparation;
  if (a.occasion !== b.occasion) out.occasion = a.occasion;
  if (a.context !== b.context) out.setting = a.context;
  return out;
}

/**
 * At POST: the ONE Meal record. The primary photo's effective values become the record's own Meal fields
 * (name, preparation, occasion, setting, the identity item with its portion + state, and the recorded
 * nutrition with per-value provenance); every photo's complete state rides along as `mealAssets`.
 * Nothing about states is invented: suggested stays suggested, a cleared AI item is recorded as rejected.
 */
export function synthesizeMeal(d: UDraft, states: MealAssetState[], primaryId: string | null): { draft: UDraft; assets: MealAssetState[] } {
  const p = states.find((s) => s.assetId === primaryId) ?? states[0];
  if (!p) return { draft: d, assets: [] };
  const m = d.domains.meal;
  const extras = m.foodItems ?? []; // the person's own foods (and the legacy card's items) — the identity item is built below
  const portion = p.portion.value;
  let identity: FoodItem | undefined;
  const original = p.name.original;
  if (original !== undefined) {
    identity =
      p.name.state === "corrected" ? { name: p.name.value ?? original, quantity: portion, source: "user", state: "corrected" }
      : p.name.state === "cleared" ? { name: original, quantity: p.portion.original, source: "ai_visual_estimate", state: "rejected" }
      : { name: p.name.value ?? original, quantity: portion, source: "ai_visual_estimate", state: p.name.state === "confirmed" ? "confirmed" : "suggested" };
  }
  const nv = (c: MealFieldCell<MealNutrientValue>): NutritionValue | undefined =>
    c.value ? { ...(c.value.value !== undefined ? { value: c.value.value } : { range: c.value.range }), unit: c.value.unit, source: c.state === "corrected" || !c.source ? "user" : (c.source as NutritionValue["source"]), confidence: c.confidence ?? "medium" } : undefined;
  const cal = nv(p.calories), pro = nv(p.protein), car = nv(p.carbs), fat = nv(p.fat);
  const anyN = cal || pro || car || fat;
  const ref = [p.calories, p.protein, p.carbs, p.fat].find((c) => c.ref)?.ref;
  const nutrition: MealNutritionRecord | undefined = anyN ? { basis: ref?.basis ?? "whole meal · visual estimate", name: ref?.matchedName, calories: cal, protein: pro, carbs: car, fat } : undefined;
  const draft: UDraft = {
    ...d,
    domains: {
      ...d.domains,
      meal: {
        ...m,
        items: p.name.value,
        preparation: p.preparation.value,
        occasion: p.occasion.value as MealDomain["occasion"],
        context: p.setting.value as MealDomain["context"],
        foodItems: identity || extras.length ? [...(identity ? [identity] : []), ...extras] : undefined,
        nutrition,
      },
    },
  };
  return { draft, assets: states };
}


/**
 * MEAL V1 — one Meal field of the SELECTED photo: a labelled input that is always editable and always clearable
 * (an explicit × beside any value). The text is kept locally while the person types — "650–" or "a, " are not yet
 * valid readings — and committed as soon as it parses; when focus leaves, it settles on the effective value.
 */
function MealField({ label, formatted, onCommit, hook, state, inputMode }: { label: string; formatted: string; onCommit: (text: string) => void; hook: string; state?: string; inputMode?: "decimal" | "text" }) {
  const id = useId();
  const [text, setText] = useState(formatted);
  const [prev, setPrev] = useState(formatted);
  const [focused, setFocused] = useState(false);
  if (formatted !== prev) {
    setPrev(formatted);
    if (!focused) setText(formatted); // an effective value changed from outside (photo switch, Looks right, facts)
  }
  return (
    <div className="flex min-w-0 flex-col gap-1" data-sb-meal-field={hook} data-sb-field-state={state ?? "default"}>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <span className="relative flex items-center">
        <input
          id={id}
          value={text}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(formatted);
          }}
          onChange={(e) => {
            setText(e.target.value);
            onCommit(e.target.value);
          }}
          className={`${FIELD} w-full pr-9`}
          data-sb-ufield={hook}
        />
        {text && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setText("");
              onCommit("");
            }}
            className="absolute right-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]"
            data-sb-clear={hook}
          >
            ×
          </button>
        )}
      </span>
    </div>
  );
}

/** MEAL V1 — the editors for the SELECTED photo's own Made of / Portion / Nutrition (the name, occasion, setting and preparation
 *  keep the existing Meal editors, which read the same photo through the overlay draft). Nutrients are independent: editing or
 *  clearing one never recalculates another. */
function MealAssetEditors({ cells, onEdit }: { cells: MealAssetState; onEdit: (f: MealAssetField, text: string) => void }) {
  return (
    <div className="grid gap-3" data-sb-meal-asset-editors data-sb-asset={cells.assetId}>
      <MealField label="Made of" hook="components" formatted={componentsText(cells.components.value)} state={cells.components.state} onCommit={(t) => onEdit("components", t)} />
      <MealField label="Portion" hook="portion" formatted={cells.portion.value ?? ""} state={cells.portion.state} onCommit={(t) => onEdit("portion", t)} />
      <div className="grid grid-cols-2 gap-2" data-sb-meal-nutrition>
        <MealField label="Calories (kcal)" hook="calories" formatted={nutrientText(cells.calories.value)} state={cells.calories.state} inputMode="decimal" onCommit={(t) => onEdit("calories", t)} />
        <MealField label="Protein (g)" hook="protein" formatted={nutrientText(cells.protein.value)} state={cells.protein.state} inputMode="decimal" onCommit={(t) => onEdit("protein", t)} />
        <MealField label="Carbs (g)" hook="carbs" formatted={nutrientText(cells.carbs.value)} state={cells.carbs.state} inputMode="decimal" onCommit={(t) => onEdit("carbs", t)} />
        <MealField label="Fat (g)" hook="fat" formatted={nutrientText(cells.fat.value)} state={cells.fat.state} inputMode="decimal" onCommit={(t) => onEdit("fat", t)} />
      </div>
    </div>
  );
}

/*
 * PHASE V1.1 — INTELLIGENCE WAITING EXPERIENCE (UX only). The waiting state is DERIVED from the real per-photo request
 * state the Composer already holds (analysis in flight → nutrition lookups in flight → ready · manual); it adds no request,
 * no timer that changes logic and no stored truth. Copy is exact and fixed.
 */
export type IntelPhase = "analyzing" | "resolving" | "ready" | "manual";
export const INTEL_PRIMARY = "Understanding this meal…";
export const INTEL_SECONDARY = "Reading the photo and preparing the details.";
export const INTEL_NUTRITION = "Checking nutrition…";
export const INTEL_LONG_PRIMARY = "Still working on the details…";
export const INTEL_LONG_SECONDARY = "You can keep editing or save without waiting.";
const INTEL_LONG_MS = 12000;
/** the names this observation's nutrition lookups are keyed by — mirrors the lookups the Composer launches (one source of truth for "pending") */
export const mealLookupKeys = (obs: MealAIObservation | null | undefined): string[] => {
  if (!obs || obs.isFood !== true) return [];
  if (obs.meal) return obs.meal.name && obs.meal.confidence !== "low" ? [obs.meal.canonicalName ?? obs.meal.name] : [];
  return obs.foods.filter((f) => f.confidence !== "low").slice(0, 5).map((f) => f.canonicalName ?? f.name);
};
const SKEL = "sb-skel block rounded-[6px]";

/** The calm processing card: the exact copy + skeletons that match the resolved card's geometry. The only timer is a display
 *  timeout that swaps the copy once the wait is longer than usual — it triggers nothing else (no retry, no request). */
export function IntelWaiting({ since, view }: { since?: number; view?: MealView }) {
  const [long, setLong] = useState(false);
  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get("mockwait"); // test seam, same convention as mockai/mockfacts
    const limit = override && /^\d+$/.test(override) ? Number(override) : INTEL_LONG_MS;
    const t = window.setTimeout(() => setLong(true), Math.max(0, limit - (Date.now() - (since ?? Date.now()))));
    return () => window.clearTimeout(t);
  }, [since]);
  return (
    <div className="grid gap-2 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-3" data-sb-meal-analyzing data-sb-intel-state="analyzing" data-sb-asset={view?.assetId} role="status" aria-live="polite">
      {view && <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase" data-sb-photo-indicator>Photo {view.index} of {view.total}</p>}
      <div className="grid gap-0.5">
        <p className="text-[13px] font-medium text-text" data-sb-intel-primary>{long ? INTEL_LONG_PRIMARY : INTEL_PRIMARY}</p>
        <p className="text-[12px] text-muted" data-sb-intel-secondary>{long ? INTEL_LONG_SECONDARY : INTEL_SECONDARY}</p>
      </div>
      <div className="grid gap-1.5" aria-hidden>
        <span className={`${SKEL} h-[17px] w-3/5`} data-sb-skeleton />
        <span className={`${SKEL} h-[12px] w-4/5`} data-sb-skeleton />
        <span className={`${SKEL} h-[12px] w-2/5`} data-sb-skeleton />
        <span className={`${SKEL} h-[12px] w-3/5`} data-sb-skeleton />
      </div>
    </div>
  );
}

/** MEAL CAPTURE EXTENSION — which attached photo the detail panel is showing (several photos only). */
export interface MealView {
  obs: MealAIObservation | null | undefined;
  pending: boolean;
  index: number;
  total: number;
  assetId: string;
  /** the selected photo is the one the Meal record carries — only then do Looks right / Adjust apply */
  isPrimary: boolean;
}

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
const MADE_OF_INLINE = 4;

/**
 * MEAL CAPTURE UX — the suggestion card for the current recognition contract: the ONE Meal as a
 * person names it, then the trustworthy nutrition (a structured fact, else an honest "no reliable
 * match" + the AI's clearly-labelled estimate), then Looks right / Adjust. No badge, no sparkle, no
 * model name, no confidence number. Looks right and Adjust act on the EXISTING Meal field
 * ("What did you have?") — no modal, no second editor, no second AI call.
 */
function MealIdentityCard({ obs, facts, view, cells, onLookRight, onAdjust, factsPending }: { obs: MealAIObservation; factsPending?: boolean; facts?: Record<string, FoodFacts | "uncertain" | null>; view?: MealView; cells?: MealAssetState; onLookRight: () => void; onAdjust: () => void }) {
  const id = usableMealIdentity(obs);
  const [expanded, setExpanded] = useState(false);
  // SECONDARY detail (never the title): the photo's EFFECTIVE components, then preparation / portion / occasion as one
  // compact line — what the person sees and edits, so an edit or a clear shows here too.
  const comps = cells?.components.value ?? [];
  const shown = expanded ? comps : comps.slice(0, MADE_OF_INLINE);
  const hidden = comps.length - shown.length;
  const occ = cells?.occasion.value;
  const attrs = [cells?.preparation.value && cap(cells.preparation.value), cells?.portion.value, occ && cap(occ)].filter(Boolean).join(" · ");
  const key = mealFactKey(obs);
  const fact = id && key && facts && Object.prototype.hasOwnProperty.call(facts, key) ? facts[key] : undefined; // own-property read: provider-supplied key
  const n = obs.nutritionEstimate;
  const estimate: string[] = [];
  if (n?.calories?.range) estimate.push(`~${n.calories.range.min}–${n.calories.range.max} ${n.calories.unit}`);
  if (n?.protein?.range) estimate.push(`~${n.protein.range.min}–${n.protein.range.max} ${n.protein.unit} protein`);
  if (n?.carbs?.range) estimate.push(`~${n.carbs.range.min}–${n.carbs.range.max} ${n.carbs.unit} carbs`);
  if (n?.fat?.range) estimate.push(`~${n.fat.range.min}–${n.fat.range.max} ${n.fat.unit} fat`);
  return (
    <div className="grid gap-1.5 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-3" data-sb-meal-suggestion data-sb-asset={view?.assetId}>
      {view && (
        <>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase" data-sb-photo-indicator>Photo {view.index} of {view.total}</p>
          <p className="text-[12px] text-muted" data-sb-photo-header>This photo</p>
        </>
      )}
      {id ? (
        <p className="text-[15px] font-medium text-text" data-sb-meal-identity data-sb-meal-identity-level={id.confidence === "high" ? "confident" : "likely"}>
          {id.confidence === "high" ? id.name : `Looks like: ${id.name}`}
        </p>
      ) : (
        <p className="text-[13px] text-text" data-sb-meal-unknown>Looks like a meal — can you name it?</p>
      )}
      {id && fact && fact !== "uncertain" && (
        <p className="text-[12px] text-text" data-sb-food-fact={fact.fdcId ?? fact.productId} data-sb-fact-source={fact.source} data-sb-fact-match={fact.match}>
          {factLineText(fact)}
        </p>
      )}
      {id && fact === undefined && factsPending && (
        <p className="text-[12px] text-muted" data-sb-nutrition-waiting role="status">{INTEL_NUTRITION}</p>
      )}
      {id && (fact === "uncertain" || fact === null) && (
        <p className="text-[12px] text-muted" data-sb-meal-nofact>No reliable nutrition match yet</p>
      )}
      {id && estimate.length > 0 && (
        <p className="text-[12px] text-muted" data-sb-meal-estimate>
          <span className={LABEL}>Estimated </span>
          {estimate.join(" · ")}
        </p>
      )}
      {id && comps.length > 0 && (
        <p className="text-[12px] text-muted" data-sb-made-of data-sb-observed="visible">
          Made of: {shown.join(" · ")}
          {hidden > 0 && (
            <>
              {" · "}
              <button type="button" onClick={() => setExpanded(true)} className="rounded-[4px] px-0.5 font-medium text-text underline underline-offset-2 focus-visible:outline-[var(--focus)]" data-sb-made-of-more>
                +{hidden} more
              </button>
            </>
          )}
        </p>
      )}
      {id && attrs && (
        <p className="text-[12px] text-muted" data-sb-meal-attrs>{attrs}</p>
      )}
      {/* MEAL V1: Looks right accepts EVERYTHING shown and populated for THIS photo; Adjust opens every editor.
          The pair stays until there is nothing left on this photo that is still just a suggested default. */}
      {id && assetHasUnconfirmed(cells) && (
        <div className="flex gap-2">
          <button type="button" onClick={onLookRight} className={ADD_CHIP} data-sb-meal-accept>Looks right</button>
          <button type="button" onClick={onAdjust} className={ADD_CHIP} data-sb-meal-adjust>Adjust</button>
        </div>
      )}
    </div>
  );
}

/**
 * UC-MEAL-AI — a calm suggestion surface: "Looks like … / Estimated … / [Looks right] [Adjust]"
 * — never a giant AI panel, never a badge, never a sparkle, never a technical confidence
 * number (§NO AI BADGES, §CONFIDENCE SEMANTICS). Deliberately plain English, not yet routed
 * through `useT`/the 8 catalogs: this phase's file-touch list scopes to Meal only, and every
 * other string in this composer already goes through i18n — this is a documented, honest
 * carryover for a future localization pass, the same pattern this codebase already uses for
 * other deferred strings (e.g. the exact-age readout, S2/S3 carryovers).
 */
export function MealSuggestion({ draft, set, analyzing, openMore, facts, view, cells, onLookRight, onAdjust, since, factsPending }: { draft: UDraft; set: SetDraft; analyzing: boolean; since?: number; factsPending?: boolean; openMore: () => void; facts?: Record<string, FoodFacts | "uncertain" | null>; view?: MealView; cells?: MealAssetState; onLookRight?: () => void; onAdjust?: () => void }) {
  // MEAL CAPTURE EXTENSION — with several photos the card shows the SELECTED photo's own observation
  // (`view`); with one it reads the Meal's observation exactly as before.
  const obs = view ? view.obs : draft.domains.meal.aiObservation;
  if ((view ? view.pending : analyzing) && obs === undefined) {
    return <IntelWaiting key={view?.assetId ?? "meal"} since={since} view={view} />;
  }
  // §AI OBSERVATION IMMUTABILITY — dismissing the CARD never touches `aiObservation` itself;
  // it is what gets carried onto the record at submit, untouched by anything below.
  if (!obs || (!view && draft.domains.meal.aiObservationDismissed)) return null;
  // MEAL CAPTURE UX — the current recognition contract: the card leads with the ONE specific Meal
  // identity. Observations without `meal` (legacy) keep the component-based card below.
  if (obs.meal) return <MealIdentityCard key={view?.assetId ?? "meal"} obs={obs} facts={facts} view={view} cells={cells} factsPending={factsPending} onLookRight={onLookRight ?? (() => {})} onAdjust={onAdjust ?? (() => {})} />;
  const useful = obs.foods.filter((f) => f.confidence !== "low");
  const hintOnly = obs.foods.filter((f) => f.confidence === "low");
  const dismiss = () => setDomain(set, "meal", { aiObservationDismissed: true });
  if (useful.length === 0) {
    // §CONFIDENCE SEMANTICS — low confidence is a hint only, never auto-confirmable: no accept
    // control exists alongside it at all.
    if (hintOnly.length === 0) return null;
    return <p className="text-[12px] text-muted" data-sb-meal-hint>Could be {hintOnly[0].name.toLowerCase()}</p>;
  }
  const n = obs.nutritionEstimate;
  const nutritionParts: string[] = [];
  if (n?.calories?.range) nutritionParts.push(`~${n.calories.range.min}–${n.calories.range.max} ${n.calories.unit}`);
  if (n?.protein?.range) nutritionParts.push(`~${n.protein.range.min}–${n.protein.range.max} ${n.protein.unit} protein`);
  // PHASE B — FACT vs ESTIMATE, never one ambiguous value: a real USDA fact renders factually
  // per food ("354 kcal · 20 g protein", no tilde, never the word "Estimated"); the AI's own
  // whole-plate estimate keeps its separate, visibly-approximate line below. The everyday
  // `name` leads — lookup terminology (canonicalName/matchedName) stays data, not UI.
  // Own-property read only (adversarial finding #5): the key is provider-supplied text — a
  // food named "constructor"/"toString" must find nothing, never an inherited Object member.
  const factFor = (k: string): FoodFacts | "uncertain" | undefined => (facts && Object.prototype.hasOwnProperty.call(facts, k) ? (facts[k] ?? undefined) : undefined);
  const factLines = useful
    .map((f) => ({ f, ff: factFor(f.canonicalName ?? f.name) }))
    .filter((x): x is { f: ObservedFood; ff: FoodFacts | "uncertain" } => !!x.ff);
  const factText = factLineText;
  const accept = () => {
    const confirmed: FoodItem[] = useful.map((f) => ({ name: f.name, quantity: f.portion, source: "ai_visual_estimate", state: "confirmed" }));
    setDomain(set, "meal", { foodItems: [...(draft.domains.meal.foodItems ?? []), ...confirmed] });
    dismiss();
  };
  const adjust = () => {
    const suggested: FoodItem[] = useful.map((f) => ({ name: f.name, quantity: f.portion, source: "ai_visual_estimate", state: "suggested" }));
    setDomain(set, "meal", { foodItems: [...(draft.domains.meal.foodItems ?? []), ...suggested] });
    revealField(set, "meal", "foodItems");
    // The Foods & drinks editor lives inside "More details" (§UC-C3 AddableFields) — Adjust
    // must open that outer disclosure too, or the just-revealed field stays invisible.
    openMore();
    dismiss();
  };
  return (
    <div className="grid gap-1.5 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-3" data-sb-meal-suggestion>
      <p className="text-[13px] text-text">
        <span className={LABEL}>Looks like </span>
        {useful.map((f) => f.name).join(" · ")}
      </p>
      {factLines.map(({ f, ff }, i) =>
        ff === "uncertain" ? (
          // UNCERTAIN: USDA offered candidates but none can be trusted to BE this food — no number
          // is published as fact; the AI's own visibly-approximate estimate (below) stays.
          <p key={`unsure-${i}-${f.canonicalName ?? f.name}`} className="text-[12px] text-muted" data-sb-food-fact-uncertain>
            {f.name}: No reliable nutrition match yet
          </p>
        ) : (
          <p key={`${ff.fdcId ?? ff.productId}-${i}-${f.canonicalName ?? f.name}`} className="text-[12px] text-text" data-sb-food-fact={ff.fdcId ?? ff.productId} data-sb-fact-source={ff.source} data-sb-fact-match={ff.match}>
            {f.name}: {factText(ff)}
          </p>
        ),
      )}
      {nutritionParts.length > 0 && (
        <p className="text-[12px] text-muted" data-sb-meal-estimate>
          <span className={LABEL}>Estimated </span>
          {nutritionParts.join(" · ")}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={accept} className={ADD_CHIP} data-sb-meal-accept>Looks right</button>
        <button type="button" onClick={adjust} className={ADD_CHIP} data-sb-meal-adjust>Adjust</button>
      </div>
    </div>
  );
}

/**
 * PHASE C — the MEDIUM-confidence category ask: the AI believes this photo is food, but not
 * strongly enough to decide FOR the person. One quiet line + Yes/No — never a modal, never a
 * wizard, never a badge (§NO AI BADGES). It renders precisely while Meal is NOT selected;
 * "Yes" routes through the SAME explicit-selection path as the chooser (`onYes` is
 * `chooseIntent("meal")` in the composer), and "No" dismisses it for this composition.
 * Plain English — the same documented localization carryover as MealSuggestion above.
 */
export function MealCategorySuggestion({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-2 text-[13px] text-text" data-sb-meal-category-suggestion>
      <span>Looks like a Meal — use it?</span>
      <button type="button" onClick={onYes} className={ADD_CHIP} data-sb-meal-cat-yes>Yes</button>
      <button type="button" onClick={onNo} className={ADD_CHIP} data-sb-meal-cat-no>No</button>
    </div>
  );
}
