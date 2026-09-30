/**
 * UNIVERSAL COMPOSER — the one submission path (§30) and its projections (§29).
 *
 * `buildMoment` turns the ComposerDraft into exactly ONE feed entity: the Social projection,
 * carrying zero or one Human Record underneath (`record: "none"` = Social only; a kind =
 * that record; never a specialist PLUS a Life Moment, §31). Temporal truth is preserved:
 * postedAt and eventTime never collapse (§21) — a dated event keeps its own day (noon sort
 * anchor, day precision) and the posting moment stays provenance (`sharedAt`).
 *
 * PROJECTION RULE (§29): only the keys named per kind below travel into the Moment's fields —
 * they are what the Social card may render, PLUS record-only keys explicitly marked; those
 * (privateNote, severity, bodyArea) are stored on the record and never rendered by Moment.tsx.
 * Everything else in a domain draft stays draft.
 */
import type { GalleryItem, KindFields, Media, Moment } from "../data";
import { LIBRARY } from "../data";
import { localISO } from "../store";
import { now } from "@/lib/clock";
import { allAssets, assetById } from "./media-assets";
import { hasAnyMedia, resolveIntent, type RecordIntent, type UDraft } from "./types";

/** §20 — the minimum meaningful content per intent. Returns a message KEY when invalid. */
export function minimumProblem(d: UDraft): string | null {
  const words = d.text.trim().length > 0;
  const media = hasAnyMedia(d);
  const intent = resolveIntent(d);
  if (intent === "social" || intent === "moment") return words || media ? null : "ucomposer.needWordsOrMedia";
  if (intent === "project") return words || d.domains.project.title?.trim() ? null : "ucomposer.needProjectName";
  if (intent === "meeting") return words || d.domains.meeting.subject?.trim() ? null : "ucomposer.needMeetingSubject";
  if (intent === "health") return words ? null : "ucomposer.needHealthWords";
  // meal · activity · problem: meaningful text or media
  return words || media ? null : "ucomposer.needWordsOrMedia";
}

/** §29 — the per-kind Social projection allowlist (record-only keys stored, never rendered). */
function projectedFields(d: UDraft, intent: RecordIntent): KindFields | undefined {
  const out: KindFields = {};
  const set = (k: keyof KindFields, v: unknown) => {
    if (v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) (out as Record<string, unknown>)[k] = v;
  };
  // §7 common People travel with any post when present.
  set("with", d.people.length ? d.people : undefined);
  switch (intent) {
    case "moment":
      set("milestone", d.domains.moment.milestone);
      // Record depth (MOMENT-007): the story and chapter enrich the Life Moment, never the card.
      set("story", d.domains.moment.story);
      set("chapter", d.domains.moment.chapter);
      break;
    case "meal": {
      const m = d.domains.meal;
      set("occasion", m.occasion);
      set("occasionCustom", m.occasion === "other" ? m.occasionCustom : undefined);
      set("items", m.items);
      set("context", m.context);
      // Record depth — stored, never rendered by the projection.
      set("preparation", m.preparation);
      set("ingredients", m.ingredients);
      set("experience", m.experience);
      set("cost", m.cost);
      set("foodItems", m.foodItems?.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), quantity: it.quantity?.trim() || undefined })));
      set("notes", m.notes);
      break;
    }
    case "activity": {
      const a = d.domains.activity;
      set("activityType", a.type);
      set("what", a.session ?? a.sport ?? a.practice);
      set("distance", a.distance);
      set("duration", a.duration);
      set("intensity", a.intensity);
      set("route", a.route);
      set("goal", a.goal);
      set("notes", a.notes);
      // 04 — per-subtype record depth (never rendered; detailed series stay private by canon).
      set("purpose", a.purpose);
      set("felt", a.felt);
      set("steps", a.steps);
      set("pace", a.pace);
      set("avgSpeed", a.avgSpeed);
      set("elevation", a.elevation);
      set("exercises", a.exercises);
      set("matchKind", a.matchKind);
      set("team", a.team);
      set("opponent", a.opponent);
      set("water", a.water);
      set("laps", a.laps);
      set("stroke", a.stroke);
      set("style", a.style);
      set("workedOn", a.workedOn);
      set("topic", a.topic);
      set("learned", a.learned);
      set("transport", a.transport);
      break;
    }
    case "health":
      // RECORD-ONLY depth (§16/§29): stored on the Human Record, never rendered socially.
      set("healthType", d.domains.health.healthType);
      set("bodyArea", d.domains.health.bodyArea);
      set("severity", d.domains.health.severity);
      set("measureValue", d.domains.health.healthType === "measurement" ? d.domains.health.measureValue : undefined);
      set("measureUnit", d.domains.health.healthType === "measurement" ? d.domains.health.measureUnit : undefined);
      set("medication", d.domains.health.healthType === "medication" ? d.domains.health.medication : undefined);
      set("privateNote", d.domains.health.privateNote);
      break;
    case "problem":
      set("status", "open"); // §17 — internal default, never asked
      set("category", d.domains.problem.category);
      set("impact", d.domains.problem.impact);
      set("urgency", d.domains.problem.urgency);
      set("attempt", d.domains.problem.attempt);
      set("nextAction", d.domains.problem.nextAction);
      set("relatedProject", d.domains.problem.relatedProject);
      set("notes", d.domains.problem.notes);
      break;
    case "project":
      set("name", d.domains.project.title);
      set("status", "active"); // 23_PROJECT — default by context, never asked at creation
      set("goal", d.domains.project.goal);
      set("milestone", d.domains.project.milestone);
      set("target", d.domains.project.target);
      set("focus", d.domains.project.focus);
      set("relatedProblem", d.domains.project.relatedProblem);
      set("notes", d.domains.project.notes);
      break;
    case "meeting": {
      const m = d.domains.meeting;
      set("subject", m.subject);
      set("purpose", m.purpose);
      if (m.online) set("online", true);
      set("duration", m.duration);
      set("relatedProject", m.related);
      set("notes", m.notes);
      break;
    }
    default:
      break; // social — People only
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * A3 + UC-C3 §9/§13 — media truth: an edit keeps the Moment's own media unless deliberately
 * changed, and every id is an ASSET REFERENCE (My Media or a session upload) — never a copy.
 * Emission rules keep every accepted rendering byte-identical: all photos → "photos"; one
 * video alone → the accepted "video" block (with its caption); mixed / multi-video →
 * "gallery" (the UC-C3 addition).
 */
export function buildMedia(d: UDraft, original: Moment | undefined, linkTitle: string): Media | undefined {
  const origItems: GalleryItem[] =
    original?.media?.kind === "photos" ? original.media.items
    : original?.media?.kind === "gallery" ? original.media.items
    : original?.media?.kind === "video" ? [{ ...original.media.poster, videoDuration: original.media.duration }]
    : [];
  if (d.editingId && original?.media) {
    const orig = original.media;
    if ((orig.kind === "photos" || orig.kind === "gallery" || orig.kind === "video") && d.mediaIds.length > 0) {
      const originalIds =
        orig.kind === "video"
          ? [assetById(d.mediaIds[0])?.mediaKind === "video" && assetById(d.mediaIds[0])?.src === orig.poster.src ? d.mediaIds[0] : "orig-0"]
          : origItems.map((p, i) => allAssets().find((l) => l.src === p.src)?.id ?? `orig-${i}`);
      if (JSON.stringify(originalIds) === JSON.stringify(d.mediaIds)) {
        // unchanged set — the Moment's own media object survives byte-identical,
        // except a single video's caption, which stays editable in place.
        return orig.kind === "video" ? { ...orig, caption: d.videoCaption || undefined } : orig;
      }
    }
    if (orig.kind === "link" && d.link) return { ...orig, url: d.link, title: linkTitle };
  }
  if (d.link && d.mediaIds.length === 0) {
    return { kind: "link", url: d.link, title: linkTitle, description: "Bells, prayer wheels and the first buses on the ring road.", host: hostOf(d.link), image: LIBRARY[4] };
  }
  if (d.mediaIds.length === 0) return undefined;
  // resolve every reference: a known asset, or the original's own item (`orig-<i>` — A3)
  const items: GalleryItem[] = d.mediaIds
    .map((id, i) => {
      const a = assetById(id);
      if (a) return { src: a.src, w: a.w, h: a.h, alt: a.alt, videoDuration: a.mediaKind === "video" ? a.duration ?? "0:00" : undefined };
      const idx = id.startsWith("orig-") ? Number(id.slice(5)) : -1;
      return origItems[idx] ?? origItems[i];
    })
    .filter((p): p is GalleryItem => !!p);
  if (items.length === 0) return undefined;
  const videos = items.filter((p) => p.videoDuration);
  if (videos.length === 0) return { kind: "photos", items: items.map(({ src, w, h, alt }) => ({ src, w, h, alt })) };
  if (items.length === 1 && videos.length === 1) {
    const v = items[0];
    return { kind: "video", poster: { src: v.src, w: v.w, h: v.h, alt: v.alt }, duration: v.videoDuration!, caption: d.videoCaption || undefined };
  }
  return { kind: "gallery", items };
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * §30 — build the ONE entity a POST creates (or the edit patch for the same event, §34).
 * Time rules (§21): no eventTime → the post happens NOW (minute precision, no sharedAt);
 * an eventTime on another day → that day leads (noon anchor, day precision) and today is
 * kept only as provenance. An eventTime provenance never fabricates a clock time.
 */
export function buildSubmission(d: UDraft, original: Moment | undefined, linkTitle: string, authorId: string, newId: () => string):
  | { type: "post"; moment: Moment }
  | { type: "edit"; id: string; patch: Partial<Moment> } {
  const intent = resolveIntent(d);
  const today = localISO(now()).slice(0, 10);
  const timeUnknown = !!d.timeUnknown && intent !== "social";
  const evDate = timeUnknown ? undefined : d.eventTime?.date;
  // §18 — the CLAIMED precision beyond the day/minute model. For month/year/approximate the
  // picked date is only the sort anchor; "unknown" means the record is UNPLACED.
  const coarse = !timeUnknown && evDate && d.eventTime && (d.eventTime.precision === "month" || d.eventTime.precision === "year" || d.eventTime.precision === "approximate")
    ? d.eventTime.precision
    : undefined;
  const timePrecision = timeUnknown ? ("unknown" as const) : coarse;
  const backdated = !!evDate && evDate !== today;
  const media = buildMedia(d, original, linkTitle);
  const fields = projectedFields(d, intent);
  const placePrecision = d.place ? d.placePrecision : undefined;
  const record = intent === "social" ? ("none" as const) : undefined;
  const kind = intent === "social" || intent === "moment" ? ("moment" as const) : intent;
  // §28 — a specialist record born in Social is OWNER-PRIVATE at record depth by default.
  const recordPrivacy = intent !== "social" && intent !== "moment" ? ("private" as const) : undefined;
  const feeling = intent === "moment" ? d.domains.moment.feeling : undefined;

  if (d.editingId && original) {
    // A2 — same date: the Moment's own at/atPrecision kept exactly; moved date: day precision,
    // provenance retained (sharedAt keeps when it was first shared / posted).
    const originalDate = original.at.slice(0, 10);
    const nextDate = evDate ?? originalDate;
    // A2 — same date: the Moment's own at/atPrecision kept exactly (a precision claim is
    // patched separately and never rewrites the anchor); moved date: day anchor + provenance.
    const temporal =
      nextDate === originalDate
        ? { at: original.at, atPrecision: original.atPrecision }
        : { at: `${nextDate}T12:00:00`, atPrecision: "day" as const, sharedAt: original.sharedAt ?? original.at };
    return {
      type: "edit",
      id: d.editingId,
      patch: {
        text: d.text.trim() || undefined,
        kind,
        record,
        recordPrivacy,
        fields,
        privacy: d.audience,
        feeling,
        place: d.place || undefined,
        placePrecision,
        media,
        ...temporal,
        timePrecision,
      },
    };
  }

  // A coarse claim (month/year/approximate) always takes the day-anchor path: a minute
  // timestamp under a month claim would be fabricated precision. "unknown" keeps the
  // recording time as `at` (provenance, never the claim) and marks the record UNPLACED.
  const anchored = backdated || (!!coarse && !!evDate);
  return {
    type: "post",
    moment: {
      id: newId(),
      authorId,
      at: anchored ? `${evDate}T12:00:00` : `${today}T${localISO(now()).slice(11, 19)}`,
      sharedAt: anchored ? localISO(now()) : undefined,
      atPrecision: anchored ? "day" : "minute",
      timePrecision,
      place: d.place || undefined,
      placePrecision,
      text: d.text.trim() || undefined,
      kind,
      record,
      recordPrivacy,
      fields,
      feeling,
      privacy: d.audience,
      media,
      responses: 0,
      responders: [],
      notes: [],
    },
  };
}

/** §45 — the success line key for a completed POST. */
export function successKey(intent: RecordIntent): string {
  if (intent === "social") return "ucomposer.posted";
  if (intent === "moment") return "ucomposer.postedMoment";
  return `ucomposer.posted_${intent}`;
}
