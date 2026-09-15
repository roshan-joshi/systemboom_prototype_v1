"use client";

/**
 * THE COMPOSER — one state machine, two shells (see docs/design/composer-states.md).
 * Desktop: centred modal ≤560px. Mobile (<@2xl): full-height sheet. The
 * confirmable life readout is always visible; detection from a photo's file
 * metadata is optional behaviour with a manual path that always exists.
 *
 * S5/S6 carryover visual correction (owner review of the S3 evidence: "still
 * reads like a form"). The MACHINE is untouched — Moment model, kinds, date
 * truth, place, privacy, media, drafts, keyboard, localization, save logic,
 * every `data-sb-*`/aria contract — only the order things are revealed in:
 *
 *   REMEMBER SOMETHING          the words come first, focused, large
 *   → PLACE IT IN LIFE          one quiet coordinate sentence under them:
 *                               today · 13 SEP 2026 · Kathmandu · 34y 10m 09d
 *                               (the date and place ARE the instruments — no
 *                               boxed "WHERE THIS SITS" block; the native
 *                               picker is the disclosure)
 *   → ADD CONTEXT IF NEEDED     feeling, then the kinds as a quiet row of
 *                               glyph+word chips (media a shade stronger),
 *                               kind fields and media revealed only when asked.
 *
 * Author and privacy live in the header with the title — one horizontal
 * layer fewer on a phone.
 */

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Link2, MapPin, Smile, Users, Video, X } from "lucide-react";
import { useFocusTrap } from "@/components/identity/useFocusTrap";
import { now } from "@/lib/clock";
import { easeOut } from "@/lib/motion";
import { validateBirthDate } from "@/lib/identity/birth";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { FEELINGS, LIBRARY, PEOPLE, PLACES, type Kind, type KindFields, type LibraryPhoto, type Moment, type Privacy } from "./data";
import { pad2 } from "./life";
import { DateField } from "./DateField";
import { momentLifeFor } from "./view-model";
import { localISO, useSocial, type Draft } from "./store";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale, sbDate } from "@/lib/i18n/format";

// S3 §46 — the kind buttons; `labelKey` resolves through the frozen S1 catalog. The media kind's
// aria stays "Photos & video" (en byte-identical, asserted by social-final); the others reuse the
// shared kind.* vocabulary.
const KINDS: { id: Kind; labelKey: string; glyph: React.ReactNode }[] = [
  { id: "moment", labelKey: "composer.kindMediaAria", glyph: <ImageIcon size={14} strokeWidth={1.75} /> },
  { id: "meal", labelKey: "composer.kindMeal", glyph: <Glyph d="M3 11h14a7 7 0 0 1-14 0zM7 5c0 1.5 1 1.5 1 3M10 4c0 1.5 1 1.5 1 3M13 5c0 1.5 1 1.5 1 3" /> },
  { id: "activity", labelKey: "composer.kindActivity", glyph: <Glyph d="M12 4.5a1 1 0 1 0 0-.01M7 17l3-4-1-3 3-2 2 2h3M10 13l-1 4M13 8l-1 3 3 2v4" /> },
  { id: "problem", labelKey: "composer.kindProblem", glyph: <Glyph d="M10 3 2 17h16L10 3zM10 8v4M10 14.5v.5" /> },
  { id: "health", labelKey: "composer.kindHealth", glyph: <Glyph d="M4 17V6h12v11M8 17v-4h4v4M10 8v4M8 10h4" /> },
  { id: "project", labelKey: "composer.kindProject", glyph: <Glyph d="M4 5.5l1.5 1.5L8 4.5M10 6h7M4 11l1.5 1.5L8 10M10 11.5h7M4 16.5l1.5 1.5L8 15.5M10 17h7" /> },
  { id: "meeting", labelKey: "composer.kindMeeting", glyph: <Glyph d="M2 9l4-3 4 3M18 9l-4-3-4 3M10 9v3l-2 2M10 12l2 2M6 6v6l4 4 4-4V6" /> },
];
function Glyph({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TEXT_LIMIT = 2000;
const PHOTO_LIMIT = 10;
const FIELD = "min-h-9 rounded-[10px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-2.5 text-[13px] text-text outline-none placeholder:text-muted focus-visible:outline-[var(--focus)] tabular-nums";
const LABEL = "text-[11px] font-semibold tracking-[0.14em] text-muted uppercase";

interface KindFieldDef {
  key: keyof KindFields;
  labelKey: string;
  required?: boolean;
  type?: "text" | "people" | "status" | "progress" | "date";
  phKey?: string;
}
const KIND_FIELDS: Record<Exclude<Kind, "moment">, KindFieldDef[]> = {
  meal: [
    { key: "what", labelKey: "composer.fieldWhat", required: true, phKey: "composer.phMealWhat" },
    { key: "venue", labelKey: "composer.fieldVenue", phKey: "composer.phMealVenue" },
    { key: "with", labelKey: "composer.fieldWith", type: "people", phKey: "composer.namesCommaSeparated" },
  ],
  activity: [
    { key: "what", labelKey: "composer.fieldWhat", required: true, phKey: "composer.phActivityWhat" },
    { key: "measure", labelKey: "composer.fieldMeasure", phKey: "composer.phActivityMeasure" },
    { key: "duration", labelKey: "composer.fieldDuration", phKey: "composer.phActivityDuration" },
  ],
  problem: [
    { key: "title", labelKey: "composer.fieldTitle", required: true, phKey: "composer.phProblemTitle" },
    { key: "status", labelKey: "composer.fieldStatus", type: "status" },
  ],
  health: [
    { key: "measurement", labelKey: "composer.fieldMeasurement", required: true, phKey: "composer.phHealthMeasurement" },
    { key: "value", labelKey: "composer.fieldValue", required: true, phKey: "composer.phHealthValue" },
  ],
  project: [
    { key: "name", labelKey: "composer.fieldName", required: true, phKey: "composer.phProjectName" },
    { key: "progress", labelKey: "composer.fieldProgress", type: "progress" },
    { key: "since", labelKey: "composer.fieldSince", type: "date" },
  ],
  meeting: [
    { key: "with", labelKey: "composer.fieldWith", required: true, type: "people", phKey: "composer.namesCommaSeparated" },
    { key: "venue", labelKey: "composer.fieldVenue", phKey: "composer.phMeetingVenue" },
    { key: "duration", labelKey: "composer.fieldDuration", phKey: "composer.phMeetingDuration" },
  ],
};

// The small label under each kind button — lowercase in English (an accepted contract) and a
// locale-appropriate short word elsewhere. Keyed off the kind id.
const SHORT_KIND_KEY: Record<string, string> = {
  meal: "composer.kindMealLc", activity: "composer.kindActivityLc", problem: "composer.kindProblemLc",
  health: "composer.kindHealthLc", project: "composer.kindProjectLc", meeting: "composer.kindMeetingLc",
};

export function emptyDraft(date: string, place: string): Draft {
  return { text: "", kind: "moment", fields: {}, privacy: "public", photoIds: [], date, place, confirmedDetection: false };
}

export function draftFromMoment(m: Moment): Draft {
  const photoIds = m.media?.kind === "photos" ? m.media.items.map((p) => LIBRARY.find((l) => l.src === p.src)?.id ?? "").filter(Boolean) : [];
  return {
    text: m.text ?? "",
    kind: m.kind,
    fields: { ...(m.fields ?? {}) },
    privacy: m.privacy,
    feeling: m.feeling,
    photoIds,
    video: m.media?.kind === "video",
    link: m.media?.kind === "link" ? m.media.url : undefined,
    date: m.at.slice(0, 10),
    place: m.place ?? "",
    confirmedDetection: true,
    editingId: m.id,
  };
}

type Phase = "idle" | "posting" | "failed" | "discard";

/** The separator of the coordinate sentence. */
function Dot() {
  return <span aria-hidden className="text-muted">·</span>;
}

export function Composer({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Draft }) {
  const { me, dispatch, state, newId, personOf } = useSocial();
  const { t, locale } = useT();
  // The composer remounts for every open (the page renders it only while open), so
  // `initial` is read once here — no effect needs to re-sync it.
  const [d, setD] = useState<Draft>(initial);
  const [phase, setPhase] = useState<Phase>("idle");
  const [picker, setPicker] = useState<"none" | "photos" | "feeling" | "privacy">("none");
  const [mediaTab, setMediaTab] = useState<"photos" | "video" | "link">("photos");
  const [linkState, setLinkState] = useState<"none" | "resolving" | "preview" | "plain">(initial.link ? "preview" : "none");
  const [linkTitle, setLinkTitle] = useState("Boudha morning kora — field recording (12 min)");
  const [touched, setTouched] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const editing = !!d.editingId;

  // Focus returns to the composer bar on close (the bar always exists in the owner view).
  const returnTo = typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-sb-open-composer]") : null;
  useFocusTrap(open, container, { initial: textRef, onEscape: () => (picker !== "none" ? setPicker("none") : requestClose()), returnTo });

  const today = localISO(now()).slice(0, 10);
  const photos = d.photoIds.map((id) => LIBRARY.find((p) => p.id === id)!).filter(Boolean);
  const detected: LibraryPhoto | undefined = photos.find((p) => p.takenAt);
  const detectionActive = !!detected && !d.confirmedDetection && !editing;
  const effDate = detectionActive ? detected!.takenAt!.slice(0, 10) : d.date;
  const effPlace = detectionActive ? (detected!.takenPlace ?? d.place) : d.place;
  const dateProblem = validateBirthDate(effDate, now());
  const future = dateProblem === "future";
  const posAt = momentLifeFor(me, me, new Date(`${effDate}T12:00:00`));
  const backdated = effDate < today;
  const quiet = d.kind === "health" || d.kind === "problem";
  const over = d.text.length > TEXT_LIMIT;
  const requiredMissing = d.kind !== "moment" ? KIND_FIELDS[d.kind].filter((f) => f.required).filter((f) => !valueOf(d.fields, f)).map((f) => t(f.labelKey)) : [];
  const mediaRequiredMissing = d.kind === "moment" && touched && !d.text.trim() && photos.length === 0 && !d.video && !d.link;
  const hasContent = !!d.text.trim() || photos.length > 0 || d.video || !!d.link || requiredMissing.length < (d.kind !== "moment" ? KIND_FIELDS[d.kind].filter((f) => f.required).length : 0);
  const canPost = !over && !future && !detectionActive && requiredMissing.length === 0 && (!!d.text.trim() || photos.length > 0 || !!d.video || !!d.link) && phase !== "posting";

  const requestClose = () => {
    if (hasContent && !editing) setPhase("discard");
    else onClose();
  };

  // Health and Problem default to Only me; leaving them restores the privacy the
  // person had before, unless they changed it themselves in between.
  const [privacyTouched, setPrivacyTouched] = useState(false);
  const setKind = (k: Kind) => {
    setD((x) => {
      const next = x.kind === k ? "moment" : k;
      const wasQuiet = x.kind === "health" || x.kind === "problem";
      const isQuiet = next === "health" || next === "problem";
      let privacy = x.privacy;
      if (isQuiet && !wasQuiet && !privacyTouched) privacy = "onlyme";
      if (!isQuiet && wasQuiet && !privacyTouched) privacy = initial.privacy;
      return { ...x, kind: next, privacy };
    });
    setTouched(true);
  };

  const submit = () => {
    if (!canPost) return;
    setPhase("posting");
    setTimeout(() => {
      if (state.simulateFailure) {
        setPhase("failed");
        return;
      }
      const media: Moment["media"] = d.video
        ? { kind: "video", poster: { src: "/mock/social/video-poster-9x16.jpg", w: 675, h: 1200, alt: "Portrait video poster" }, duration: "0:42", caption: d.fields.title ?? undefined }
        : d.link
          ? { kind: "link", url: d.link, title: linkTitle, description: "Bells, prayer wheels and the first buses on the ring road.", host: hostOf(d.link), image: LIBRARY[4] }
          : photos.length
            ? { kind: "photos", items: photos.map(({ src, w, h, alt }) => ({ src, w, h, alt })) }
            : undefined;
      // Temporal honesty (Phase 5 §6): only a moment recorded for today carries the clock; a
      // backdated moment has DATE precision — noon is a sort anchor, never displayed as a time.
      const at = backdated ? `${effDate}T12:00:00` : `${effDate}T${localISO(now()).slice(11, 19)}`;
      if (editing) {
        dispatch({ type: "edit", id: d.editingId!, patch: { text: d.text.trim() || undefined, kind: d.kind, fields: d.fields, privacy: d.privacy, feeling: d.feeling, place: effPlace || undefined, media, at: `${effDate}${d.date === initial.date ? initialTime(initial, d) : "T12:00:00"}` } });
      } else {
        dispatch({
          type: "post",
          moment: {
            id: newId(),
            authorId: me.id,
            at,
            sharedAt: backdated ? localISO(now()) : undefined,
            atPrecision: backdated ? "day" : "minute",
            place: effPlace || undefined,
            text: d.text.trim() || undefined,
            kind: d.kind,
            fields: d.kind === "moment" ? undefined : d.fields,
            feeling: d.feeling,
            privacy: d.privacy,
            media,
            responses: 0,
            responders: [],
            notes: [],
          },
        });
      }
      setPhase("idle");
      onClose();
    }, 900);
  };

  const togglePhoto = (id: string) =>
    setD((x) => {
      if (x.photoIds.includes(id)) return { ...x, photoIds: x.photoIds.filter((p) => p !== id), confirmedDetection: false };
      if (x.photoIds.length >= PHOTO_LIMIT) return x;
      return { ...x, photoIds: [...x.photoIds, id], confirmedDetection: false };
    });
  const move = (i: number, dir: -1 | 1) =>
    setD((x) => {
      const arr = [...x.photoIds];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return x;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...x, photoIds: arr };
    });
  const resolveLink = (url: string) => {
    setD((x) => ({ ...x, link: url || undefined }));
    if (!url) return setLinkState("none");
    try {
      new URL(url);
    } catch {
      return setLinkState("plain");
    }
    setLinkState("resolving");
    setTimeout(() => setLinkState(url.includes("example.org") ? "preview" : "plain"), 700);
  };
  const feelingLabel = d.feeling ? t("moments.feeling", { mood: d.feeling }) : null;
  const privacyWord = (p: Privacy) => (p === "public" ? t("privacy.public") : p === "friends" ? t("privacy.friends") : t("privacy.onlyMe"));

  // The overlay is viewport-fixed (the product's real shell). In the preview it is
  // constrained to the simulated frame width via --frame-w so a 360px preview stays 360px.
  // S6 §59 — opening means "I am now recording": the sheet rises from where the entry bar's
  // sentence was read (position + elevation), 260ms, no modal pop; the exit is a short fade.
  return (
    <AnimatePresence>
      {open && (
        <motion.div key="composer" className="fixed inset-y-0 left-1/2 z-[60] -translate-x-1/2" style={{ width: "var(--frame-w, 100vw)", maxWidth: "100vw" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label={t("composer.close")} onClick={requestClose} className="absolute inset-0 cursor-default bg-[rgba(10,13,20,0.42)]" />
          <motion.div
            ref={container}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sb-composer-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 22, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.26, ease: [...easeOut] }}
            className="sb-composer-shell absolute flex flex-col overflow-hidden bg-[var(--sheet-solid)] text-text !outline-none"
            data-sb-composer
            data-sb-composer-phase={phase}
          >
            {/* header — who is recording, for whom; the title stays the meaning of this surface */}
            <header className="flex items-center gap-3 px-4 pt-3 pb-1 @2xl:px-5 @2xl:pt-4">
              <PersonIdentity viewer={me} subject={me} size={28} />
              <div className="min-w-0 flex-1">
                <h2 id="sb-composer-title" className="text-[14px] leading-tight font-semibold">{editing ? t("composer.editMoment") : t("composer.newMoment")}</h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <span className="truncate">{me.name}</span>
                  <span aria-hidden>·</span>
                  <span className="relative">
                    <button type="button" aria-haspopup="listbox" aria-expanded={picker === "privacy"} onClick={() => setPicker(picker === "privacy" ? "none" : "privacy")} className="sb-press -mx-1 inline-flex min-h-7 items-center gap-1 rounded-full px-1 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                      {privacyWord(d.privacy)} <span aria-hidden className="text-[10px]">▾</span>
                    </button>
                    {picker === "privacy" && (
                      <ul role="listbox" aria-label={t("composer.whoCanSeeThis")} className="sb-surface-in absolute left-0 z-10 mt-1 min-w-44 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1 text-[13px] shadow-[0_12px_32px_-16px_rgba(0,0,0,.45)]">
                        {(["public", "friends", "onlyme"] as Privacy[]).map((p) => (
                          <li key={p}>
                            <button type="button" role="option" aria-selected={d.privacy === p} onClick={() => { setD((x) => ({ ...x, privacy: p })); setPrivacyTouched(true); setPicker("none"); }} className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)]">
                              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${d.privacy === p ? "bg-[var(--boom)]" : "border border-steel"}`} />
                              {privacyWord(p)}
                              <span className="ml-auto text-[11px] text-muted">{p === "public" ? t("composer.privacyAnyone") : p === "friends" ? t("composer.privacyYourPeople") : t("composer.privacyJustYou")}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </div>
              </div>
              <button type="button" onClick={requestClose} aria-label={t("composer.close")} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
                <X size={17} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 @2xl:px-5">
              {/* THE MEMORY — first, focused, the largest thing here */}
              <label htmlFor="sb-composer-text" className="sr-only">{t("moments.yourMoment")}</label>
              {/* Focus is shown as the notebook rule under the words turning focus-blue — not a
                  2px rectangle around a box (the one residue that read most like a form). */}
              <div className="border-b border-[var(--hair)] pb-1 focus-within:border-[var(--focus)]">
                <textarea
                  id="sb-composer-text"
                  ref={textRef}
                  rows={3}
                  value={d.text}
                  onChange={(e) => { setD((x) => ({ ...x, text: e.target.value })); setTouched(true); }}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
                  placeholder={t("moments.whatHappenedAt", { age: momentLifeFor(me, me, now()).exact ?? "" })}
                  className="block min-h-[104px] w-full resize-none bg-transparent text-[17px] leading-[1.5] text-text placeholder:text-muted focus-visible:!outline-none @2xl:min-h-[128px] @2xl:text-[18px]"
                  aria-describedby="sb-composer-count"
                />
              </div>

              {/* THE COORDINATE — where this sits in a life, as one quiet sentence. The date and the
                  place are the instruments (the native picker is the disclosure); the life position
                  is read from them. Detected from a photo's file: the sentence is stated and asks to
                  be confirmed or changed, exactly as before. */}
              <div role="group" aria-label={t("composer.contextAria")} className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted tabular-nums" data-sb-readout-state={detectionActive ? "detected" : future ? "future" : backdated ? "backdated" : "manual"}>
                <span className="sr-only">{detectionActive ? t("composer.fromThePhoto") : t("composer.whereThisSits")}</span>
                {detectionActive ? (
                  <>
                    <span className="text-text">
                      <span className="sr-only">{t("composer.willSitAt")} </span>
                      <span className="font-medium">{posAt.exact}</span>
                      <span className="text-muted"> · </span>
                      {effPlace ? <span>{effPlace}</span> : <span className="text-muted">{t("composer.whereWasThisLc")}</span>}
                      <span className="text-muted"> · </span>
                      <span>{effDate === today ? t("life.todayLabel") : sbDate(locale, `${effDate}T00:00:00`)}</span>
                    </span>
                    <span className="basis-full text-[12px] text-muted">{t("composer.readFromFile")}</span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => setD((x) => ({ ...x, date: effDate, place: effPlace, confirmedDetection: true }))} className="sb-press rounded-full bg-[var(--boom)] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)]">{t("composer.confirm")}</button>
                      <button type="button" onClick={() => setD((x) => ({ ...x, confirmedDetection: true }))} className="sb-press rounded-full border border-[var(--hair)] px-3 py-1.5 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("composer.change")}</button>
                    </span>
                  </>
                ) : (
                  <>
                    {effDate === today && (
                      <>
                        <span>{t("life.todayLabel")}</span>
                        <Dot />
                      </>
                    )}
                    <DateField quiet value={d.date} max={today} onChange={(v) => setD((x) => ({ ...x, date: v }))} label={t("composer.dateOfMoment")} />
                    <Dot />
                    <span className="text-text">
                      <span className="sr-only">{t("composer.willSitAt")} </span>
                      <span className="font-medium">{posAt.exact}</span>
                    </span>
                    {/* The place takes its own line on a phone (a sentence never strands a "·" at
                        a line end); it stays inline where the width allows. */}
                    <span aria-hidden className="hidden text-muted @2xl:inline">·</span>
                    <label className="flex basis-full items-center gap-1 @2xl:inline-flex @2xl:basis-auto">
                      <MapPin size={13} strokeWidth={1.75} aria-hidden className="shrink-0" />
                      <span className="sr-only">{t("composer.place")}</span>
                      <input list="sb-places" value={d.place} onChange={(e) => setD((x) => ({ ...x, place: e.target.value }))} placeholder={t("composer.whereWasThisLc")} className="min-h-8 w-full min-w-0 rounded-[6px] border-b border-transparent bg-transparent px-0.5 text-[13px] text-text placeholder:text-muted focus:border-[var(--hair)] focus-visible:!outline-none @2xl:w-[18ch]" />
                    </label>
                    <datalist id="sb-places">{PLACES.map((p) => <option key={p} value={p} />)}</datalist>
                  </>
                )}
              </div>
              {future && <p className="mt-1.5 text-[12px] text-[var(--danger)]">{t("composer.futureDate")}</p>}
              {!future && backdated && !detectionActive && <p className="mt-1.5 text-[12px] text-muted">{t("composer.backdatedNote")}</p>}

              {/* feeling · counter */}
              <div className="mt-2 flex items-center justify-between text-[12px] tabular-nums">
                <span className="relative">
                  <button type="button" aria-expanded={picker === "feeling"} onClick={() => setPicker(picker === "feeling" ? "none" : "feeling")} className="sb-press -ml-2 inline-flex min-h-8 items-center gap-1.5 rounded-full px-2 text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                    <Smile size={14} strokeWidth={1.75} aria-hidden /> {feelingLabel ?? t("composer.feelingPrompt")}
                  </button>
                  {picker === "feeling" && (
                    <ul role="listbox" aria-label={t("composer.feelingPicker")} className="sb-surface-in absolute left-0 z-10 mt-1 grid w-56 grid-cols-2 gap-0.5 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1 text-[13px] shadow-[0_12px_32px_-16px_rgba(0,0,0,.45)]">
                      <li className="col-span-2">
                        <button type="button" role="option" aria-selected={!d.feeling} onClick={() => { setD((x) => ({ ...x, feeling: undefined })); setPicker("none"); }} className="w-full rounded-[10px] px-3 py-1.5 text-left text-muted hover:bg-steel/12 focus-visible:outline-[var(--focus)]">{t("composer.none")}</button>
                      </li>
                      {FEELINGS.map((f) => (
                        <li key={f}>
                          <button type="button" role="option" aria-selected={d.feeling === f} onClick={() => { setD((x) => ({ ...x, feeling: f })); setPicker("none"); }} className={`w-full rounded-[10px] px-3 py-1.5 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)] ${d.feeling === f ? "font-medium" : ""}`}>{f}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
                <span id="sb-composer-count" className={over ? "text-[var(--danger)]" : "text-muted"}>{formatNumberLocale(locale, d.text.length)} / {formatNumberLocale(locale, TEXT_LIMIT)}</span>
              </div>

              {/* WHAT KIND OF MOMENT — only if needed: a quiet row of glyph + word, media a shade
                  stronger as the one quick action, never a palette of equal circles. */}
              <div role="group" aria-label={t("composer.kindOfMoment")} className="mt-2 flex gap-1 overflow-x-auto pb-1 @max-2xl:[mask-image:linear-gradient(to_right,#000_86%,transparent)] @2xl:flex-wrap @2xl:gap-0.5 @2xl:overflow-visible" data-sb-kind-row>
                {KINDS.map((k) => {
                  const on = d.kind === k.id && k.id !== "moment";
                  const isMedia = k.id === "moment";
                  const active = on || (isMedia && picker === "photos");
                  const kLabel = t(k.labelKey);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={isMedia ? picker === "photos" : on}
                      aria-label={kLabel}
                      title={kLabel}
                      onClick={() => (isMedia ? setPicker(picker === "photos" ? "none" : "photos") : setKind(k.id))}
                      className={`sb-press inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2 focus-visible:outline-[var(--focus)] @2xl:min-h-8 @2xl:px-1.5 ${active ? "bg-[var(--boom-soft)] text-text" : isMedia ? "border border-[var(--hair)] text-text hover:border-steel/60" : "text-muted hover:bg-steel/10 hover:text-text"}`}
                    >
                      <span aria-hidden className="inline-flex">{k.glyph}</span>
                      <span aria-hidden className="text-[11px] leading-none font-medium tracking-[0.02em]">{k.id === "moment" ? t("composer.mediaShort") : t(SHORT_KIND_KEY[k.id])}</span>
                    </button>
                  );
                })}
              </div>
              {d.kind !== "moment" && <p className="mt-2 text-[12px] text-muted"><span className={LABEL}>{t("kind." + d.kind)}</span>{quiet && <span className="ml-2">· {t("composer.privateFactNote")}</span>}</p>}

              {/* kind fields — one measured reveal for the group (§60), never label by label */}
              {d.kind !== "moment" && (
                <div key={d.kind} className="sb-reveal mt-3 grid gap-3 @2xl:grid-cols-2" data-sb-kind-fields={d.kind}>
                  {KIND_FIELDS[d.kind].map((f) => (
                    <KindField key={f.key} def={f} draft={d} setDraft={setD} missing={touched && !!f.required && !valueOf(d.fields, f)} personOf={personOf} />
                  ))}
                </div>
              )}

              {/* media: photos · video · link in one panel (video and link ride with the media picker) */}
              {picker === "photos" && (
                <div role="tablist" aria-label={t("composer.mediaAria")} className="sb-reveal mt-3 flex gap-1 text-[12px]">
                  {(["photos", "video", "link"] as const).map((tab) => (
                    <button key={tab} type="button" role="tab" aria-selected={mediaTab === tab} onClick={() => setMediaTab(tab)} className={`sb-press inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-medium focus-visible:outline-[var(--focus)] ${mediaTab === tab ? "bg-[var(--sheet-raised)] text-text shadow-[inset_0_0_0_1px_var(--hair)]" : "text-muted hover:text-text"}`}>
                      {tab === "photos" ? <ImageIcon size={13} aria-hidden /> : tab === "video" ? <Video size={13} aria-hidden /> : <Link2 size={13} aria-hidden />}
                      {tab === "photos" ? t("composer.mediaPhotos") : tab === "video" ? t("composer.mediaVideo") : t("composer.mediaLink")}
                    </button>
                  ))}
                </div>
              )}
              {picker === "photos" && mediaTab === "video" && (
                <div className="sb-reveal mt-2 rounded-[14px] border border-[var(--hair)] p-3 text-[13px]">
                  <label className="flex items-center gap-2 text-text"><input type="checkbox" checked={!!d.video} onChange={(e) => setD((x) => ({ ...x, video: e.target.checked }))} className="accent-[#d92a20]" aria-label={t("composer.mediaVideo")} /> {t("composer.attachVideo")} (0:42 · 9:16)</label>
                </div>
              )}
              {picker === "photos" && mediaTab === "link" && (
                <div className="sb-reveal mt-2 rounded-[14px] border border-[var(--hair)] p-3">
                  <label className="flex items-center gap-2 text-[13px] text-muted">
                    <Link2 size={14} aria-hidden />
                    <span className="sr-only">{t("composer.mediaLink")}</span>
                    <input value={d.link ?? ""} onChange={(e) => resolveLink(e.target.value)} placeholder={t("composer.pasteLink")} className={`${FIELD} w-full`} />
                  </label>
                </div>
              )}
              {picker === "photos" && mediaTab === "photos" && (
                <div className="sb-reveal mt-2 rounded-[14px] border border-[var(--hair)] p-2" role="group" aria-label={t("composer.choosePhotos")}>
                  <p className="px-1 pb-2 text-[12px] text-muted tabular-nums">{t("composer.ofLimit", { n: d.photoIds.length, limit: PHOTO_LIMIT })}{d.photoIds.length >= PHOTO_LIMIT ? t("composer.removeOneToAdd") : ""}</p>
                  <div className="grid grid-cols-4 gap-1.5 @2xl:grid-cols-6">
                    {LIBRARY.map((p) => {
                      const on = d.photoIds.includes(p.id);
                      const full = !on && d.photoIds.length >= PHOTO_LIMIT;
                      return (
                        <button key={p.id} type="button" aria-pressed={on} disabled={full} onClick={() => togglePhoto(p.id)} aria-label={p.alt} className={`sb-press relative aspect-square overflow-hidden rounded-[8px] bg-[var(--sheet-raised)] focus-visible:outline-[var(--focus)] disabled:opacity-40 ${on ? "ring-2 ring-[var(--boom)]" : ""}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                          {on && <span className="absolute top-1 left-1 rounded-full bg-[var(--boom)] px-1.5 text-[10px] font-semibold text-white tabular-nums">{d.photoIds.indexOf(p.id) + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {photos.length > 0 && (
                <div className="mt-3" role="group" aria-label={t("composer.chosenPhotos")}>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <div key={p.id} className="group relative shrink-0" style={{ height: 96, width: Math.round((96 * p.w) / p.h) }} data-sb-thumb={p.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt={p.alt} className="h-full w-full rounded-[6px] object-cover" />
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-1 text-white">
                          <button type="button" aria-label={t("composer.movePhotoEarlier", { n: i + 1 })} disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full bg-[rgba(10,13,20,.6)] p-1 disabled:opacity-30 focus-visible:outline-[var(--focus)]"><ArrowLeft size={12} /></button>
                          <button type="button" aria-label={t("composer.removePhoto", { n: i + 1 })} onClick={() => togglePhoto(p.id)} className="rounded-full bg-[rgba(10,13,20,.6)] p-1 focus-visible:outline-[var(--focus)]"><X size={12} /></button>
                          <button type="button" aria-label={t("composer.movePhotoLater", { n: i + 1 })} disabled={i === photos.length - 1} onClick={() => move(i, 1)} className="rounded-full bg-[rgba(10,13,20,.6)] p-1 disabled:opacity-30 focus-visible:outline-[var(--focus)]"><ArrowRight size={12} /></button>
                        </span>
                        {p.takenAt && <span aria-hidden className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-[var(--boom)]" title={t("composer.hasDateInFile")} />}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[12px] text-muted tabular-nums">{t("composer.ofLimit", { n: photos.length, limit: PHOTO_LIMIT })} · {t("composer.arrowsReorder")}</p>
                </div>
              )}
              {d.video && (
                <div className="mt-3 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mock/social/video-poster-9x16.jpg" alt={t("composer.videoPreviewAlt")} className="h-24 w-[54px] rounded-[6px] object-cover" />
                  <div className="text-[13px]">
                    <p className="text-text">{t("composer.mediaVideo")} · 0:42 · 9:16</p>
                    <label className="mt-1 flex items-center gap-2 text-muted">
                      <input type="checkbox" checked={!!d.fields.title} onChange={(e) => setD((x) => ({ ...x, fields: { ...x.fields, title: e.target.checked ? `${sbDate(locale, effDate + "T00:00:00")} · ${effPlace || "—"}` : undefined } }))} className="accent-[#d92a20]" />
                      {t("composer.burnDatePlace")}
                    </label>
                    {d.fields.title && <input value={d.fields.title} onChange={(e) => setD((x) => ({ ...x, fields: { ...x.fields, title: e.target.value } }))} aria-label={t("composer.caption")} className={`${FIELD} mt-1 w-full`} />}
                  </div>
                </div>
              )}
              {d.link && (
                <div className="mt-3">
                  {linkState === "resolving" && <span className="mt-1 block h-px w-full overflow-hidden bg-[var(--hair)]"><span className="sb-resolving block h-full w-1/3 bg-steel" /></span>}
                  {linkState === "preview" && (
                    <div className="mt-2 flex gap-3 rounded-[8px] border border-[var(--hair)] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={LIBRARY[4].src} alt="" className="h-14 w-20 rounded-[4px] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className={LABEL}>{hostOf(d.link ?? "")}</p>
                        <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} aria-label={t("composer.linkTitle")} className="w-full bg-transparent text-[14px] font-medium text-text outline-none" />
                      </div>
                      <button type="button" aria-label={t("composer.removePreview")} onClick={() => { setD((x) => ({ ...x, link: undefined })); setLinkState("none"); }} className="text-muted hover:text-text focus-visible:outline-[var(--focus)]"><X size={14} /></button>
                    </div>
                  )}
                  {linkState === "plain" && <p className="mt-1 text-[12px] text-muted">{t("composer.noLinkPreview")}</p>}
                </div>
              )}

              {/* validation */}
              {mediaRequiredMissing && picker === "photos" && <p className="mt-2 text-[12px] text-[var(--danger)]">{t("composer.addPhotoOrText")}</p>}
              {touched && requiredMissing.length > 0 && <p className="mt-2 text-[12px] text-muted">{t("composer.needed", { fields: requiredMissing.join(", ") })}</p>}
              {phase === "failed" && (
                <p className="mt-3 text-[13px] text-text">
                  {t("composer.postFailed")}{" "}
                  <button type="button" onClick={submit} className="font-medium underline-offset-2 hover:underline focus-visible:outline-[var(--focus)]">{t("common.retry")}</button>
                </p>
              )}
            </div>

            <footer className="border-t border-[var(--hair)] px-4 py-3 pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] @2xl:px-5 @2xl:pb-3">
              {phase === "discard" ? (
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="text-text">{t("composer.discardQ")}</span>
                  <button type="button" onClick={() => { dispatch({ type: "draft", draft: d }); onClose(); }} className="sb-press rounded-full border border-[var(--hair)] px-3 py-1.5 font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("composer.keepDraft")}</button>
                  <button type="button" onClick={() => { dispatch({ type: "draft", draft: null }); onClose(); }} className="sb-press rounded-full px-3 py-1.5 text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("composer.discard")}</button>
                  <button type="button" onClick={() => setPhase("idle")} className="ml-auto text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("composer.back")}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canPost}
                    aria-busy={phase === "posting"}
                    className="sb-press relative inline-flex min-h-11 min-w-24 items-center justify-center overflow-hidden rounded-full bg-[var(--boom)] @2xl:min-h-10 px-5 text-[14px] font-semibold text-white hover:bg-[var(--boom-strong)] disabled:opacity-50 focus-visible:outline-[var(--focus)]"
                  >
                    {phase === "posting" && <span aria-hidden className="sb-posting absolute inset-y-0 left-0 bg-white/25" />}
                    <span className="relative">{phase === "posting" ? t("composer.posting") : editing ? t("composer.save") : t("composer.post")}</span>
                  </button>
                  <button type="button" onClick={requestClose} className="sb-press inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("common.cancel")}</button>
                  <span className="ml-auto hidden text-[11px] text-muted @2xl:inline">{t("composer.cmdEnterPosts")}</span>
                </div>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function initialTime(a: Draft, b: Draft) {
  return a.date === b.date ? "T12:00:00" : "T12:00:00";
}
function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
function valueOf(f: KindFields, def: KindFieldDef): boolean {
  const v = f[def.key];
  if (Array.isArray(v)) return v.length > 0;
  if (def.type === "progress") return Array.isArray(v);
  return !!v && String(v).trim().length > 0;
}

function KindField({ def, draft, setDraft, missing, personOf }: { def: KindFieldDef; draft: Draft; setDraft: (f: (d: Draft) => Draft) => void; missing: boolean; personOf: (id: string) => { name: string } }) {
  const { t } = useT();
  const id = `sb-kf-${def.key}`;
  const labelText = t(def.labelKey);
  const ph = def.phKey ? t(def.phKey) : undefined;
  const set = (v: KindFields[keyof KindFields]) => setDraft((x) => ({ ...x, fields: { ...x.fields, [def.key]: v } }));
  const label = (
    <label htmlFor={id} className={`${LABEL} ${missing ? "text-[var(--danger)]" : ""}`}>
      {labelText}
      {def.required && <span aria-hidden> *</span>}
    </label>
  );
  if (def.type === "status") {
    const v = (draft.fields.status ?? "open") as "open" | "resolved";
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div role="radiogroup" aria-label={t("composer.fieldStatus")} className="flex overflow-hidden rounded-full border border-[var(--hair)] text-[13px]">
          {(["open", "resolved"] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={v === s} onClick={() => set(s)} className={`px-3 py-1.5 ${v === s ? "bg-[var(--sheet-raised)] font-medium text-text" : "text-muted"} focus-visible:outline-[var(--focus)]`}>{s === "open" ? t("composer.statusOpen") : t("composer.statusResolved")}</button>
          ))}
        </div>
      </div>
    );
  }
  if (def.type === "progress") {
    const [n, total] = draft.fields.progress ?? [0, 0];
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div className="flex items-center gap-2 text-[13px] text-muted tabular-nums">
          <input id={id} type="number" min={0} value={n || ""} onChange={(e) => set([Number(e.target.value) || 0, total])} placeholder="3" className={`${FIELD} w-16`} aria-label={t("composer.stepsDone")} />
          {t("composer.progressOf")}
          <input type="number" min={1} value={total || ""} onChange={(e) => set([n, Number(e.target.value) || 0])} placeholder="8" className={`${FIELD} w-16`} aria-label={t("composer.stepsTotal")} />
        </div>
      </div>
    );
  }
  if (def.type === "date") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <DateField id={id} value={(draft.fields.since as string) ?? ""} onChange={(v) => set(v)} label={labelText} />
      </div>
    );
  }
  if (def.type === "people") {
    const ids = (draft.fields.with as string[]) ?? [];
    const text = ids.map((x) => personOf(x).name).join(", ");
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-muted" aria-hidden />
          <input
            id={id}
            list="sb-people"
            defaultValue={text}
            onBlur={(e) => {
              const names = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              const matched = names.map((nm) => Object.values(PEOPLE).find((p) => p.name.toLowerCase().startsWith(nm.toLowerCase()))?.id).filter(Boolean) as string[];
              set(matched.length ? matched : names.length ? names : undefined);
            }}
            placeholder={ph}
            className={`${FIELD} w-full`}
          />
          <datalist id="sb-people">{Object.values(PEOPLE).map((p) => <option key={p.id} value={p.name} />)}</datalist>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {label}
      <input id={id} value={(draft.fields[def.key] as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={ph} className={`${FIELD} w-full`} />
    </div>
  );
}

export function useComposerSeed() {
  const { me } = useSocial();
  return useMemo(() => emptyDraft(localISO(now()).slice(0, 10), me.home), [me]);
}

export { pad2 };
