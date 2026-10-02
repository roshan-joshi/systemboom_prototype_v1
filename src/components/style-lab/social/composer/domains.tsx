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

import { useId, useState } from "react";
import { FEELINGS, type FoodFacts, type ObservedFood } from "../data";
import { DateField } from "../DateField";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sbDate, sbDateCoarse } from "@/lib/i18n/format";
import { resolveIntent, type ActivityType, type DomainDrafts, type FoodItem, type HealthType, type RecordIntent, type RecordKind, type UDraft } from "./types";

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
    { key: "notes", labelKey: "ucomposer.notes" },
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
export function DomainMore({ draft, set, min }: { draft: UDraft; set: SetDraft; min: string }) {
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
 * UC-MEAL-AI — a calm suggestion surface: "Looks like … / Estimated … / [Looks right] [Adjust]"
 * — never a giant AI panel, never a badge, never a sparkle, never a technical confidence
 * number (§NO AI BADGES, §CONFIDENCE SEMANTICS). Deliberately plain English, not yet routed
 * through `useT`/the 8 catalogs: this phase's file-touch list scopes to Meal only, and every
 * other string in this composer already goes through i18n — this is a documented, honest
 * carryover for a future localization pass, the same pattern this codebase already uses for
 * other deferred strings (e.g. the exact-age readout, S2/S3 carryovers).
 */
export function MealSuggestion({ draft, set, analyzing, openMore, facts }: { draft: UDraft; set: SetDraft; analyzing: boolean; openMore: () => void; facts?: Record<string, FoodFacts | null> }) {
  const obs = draft.domains.meal.aiObservation;
  if (analyzing && obs === undefined) {
    return <p className="text-[12px] text-muted" data-sb-meal-analyzing>Looking at your photo…</p>;
  }
  // §AI OBSERVATION IMMUTABILITY — dismissing the CARD never touches `aiObservation` itself;
  // it is what gets carried onto the record at submit, untouched by anything below.
  if (!obs || draft.domains.meal.aiObservationDismissed) return null;
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
  const factFor = (k: string): FoodFacts | undefined => (facts && Object.prototype.hasOwnProperty.call(facts, k) ? (facts[k] ?? undefined) : undefined);
  const factLines = useful
    .map((f) => ({ f, ff: factFor(f.canonicalName ?? f.name) }))
    .filter((x): x is { f: ObservedFood; ff: FoodFacts } => !!x.ff);
  const factText = (ff: FoodFacts) => {
    const parts: string[] = [];
    if (typeof ff.nutrition.calories === "number") parts.push(`${Math.round(ff.nutrition.calories)} ${ff.units.calories}`);
    if (typeof ff.nutrition.protein === "number") parts.push(`${Math.round(ff.nutrition.protein)} ${ff.units.protein} protein`);
    if (typeof ff.nutrition.carbs === "number") parts.push(`${Math.round(ff.nutrition.carbs)} ${ff.units.carbs} carbs`);
    if (typeof ff.nutrition.fat === "number") parts.push(`${Math.round(ff.nutrition.fat)} ${ff.units.fat} fat`);
    return `${parts.join(" · ")} · ${ff.basis}`;
  };
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
      {factLines.map(({ f, ff }) => (
        <p key={`${ff.fdcId}-${f.name}`} className="text-[12px] text-text" data-sb-food-fact={ff.fdcId}>
          {f.name}: {factText(ff)}
        </p>
      ))}
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
