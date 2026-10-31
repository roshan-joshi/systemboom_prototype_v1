/**
 * UNIVERSAL SOCIAL POST COMPOSER — UC-C3 interaction layer (2026-09-29) over the canonical
 * greenfield machine.
 *
 * NORTH STAR (§0): easier than ordinary social media, quietly creating meaningful Human
 * Records. The opening state is COMPACT ordinary Social (§4): identity + Audience,
 * "What's happening?", Media · People · Place · Add details, POST — nothing else. Depth
 * arrives as FOCUSED SHEETS over the same draft (§6/§56): the Record chooser, Add media
 * (Upload / Camera / My Media / link), My Media, the Media organizer, the People picker,
 * the Place picker, the Activity/Health type pickers. Back in a sheet returns to the
 * composer, never out of it. A chosen record COLLAPSES to one smart pill (§7) —
 * "Meal · Dinner · Change" — never seven persistent categories.
 *
 * Deliberately carried over from the accepted machine (product truths, not old UX):
 * the cancellable pending publication + inert body while Posting (A4, incl. the live
 * Cancel), edit temporal/media truth (A2/A3 — submit.ts), the ONE configurable media
 * limit, before-birth/future refusals (A11), real-people-only tagging (A12), the
 * transform-free @2xl shell centring (S7 §50) and the safe-area footer (S7 §15).
 *
 * SMART ASSIST (§25–§38) is the quiet layer underneath: one dismissible suggestion,
 * a subtle ✦ control, a global on/off — everything works with it OFF.
 */
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Camera, ChevronDown, ChevronLeft, FolderOpen, Image as ImageIcon, Link2, MapPin, Play, Search, Sparkles, Star, Upload, Users, X } from "lucide-react";
import { useFocusTrap } from "@/components/identity/useFocusTrap";
import { now } from "@/lib/clock";
import { easeOut } from "@/lib/motion";
import { validateBirthDate } from "@/lib/identity/birth";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { matchPeople, PEOPLE, PLACES, type ActivityAIObservation, type RecordAIObservation, type RecordKindAI, type FoodFacts, type MealAIObservation, type MealAssetState, type MediaAsset, type Privacy } from "../data";
import { localISO, useSocial } from "../store";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale, sbDate } from "@/lib/i18n/format";
import { allAssets, assetById, MEDIA_LIMIT, registerUploads } from "./media-assets";
import { ASSIST_CAPABILITIES, extractAssist, setSmartAssist, smartAssistEnabled, type AssistSuggestion } from "./smart-assist";
import { ActivityCategorySuggestion, ActivitySuggestion, RecordSuggestion, VisionSuggestionCard, ACTIVITY_COMMON, ACTIVITY_TYPES, activityKey, applyAssetFacts, assetEditsFromDraft, ChipSelect, confirmAssetMeal, editAssetField, fillAssetMeal, overlayMealDraft, parseComponents, parseNutrient, seedAssetMeal, synthesizeMeal, type MealAssetField, DomainMore, DomainQuick, FIELD, finalizeMealIdentity, HEALTH_COMMON, HEALTH_TYPES, hasMore, healthTypeKey, KIND_DESC_KEY, KIND_LABEL_KEY, LABEL, MealCategorySuggestion, mealNutritionOf, MealSuggestion, mealLookupKeys, moreLabelKey, type IntelPhase, IntelWaiting, occasionKey, PLACEHOLDER_KEY, RECORD_KINDS, setDomain, TField } from "./domains";
import { analyzeMealMedia } from "./meal-intelligence/analyzeMealMedia";
import { analyzeActivityMedia } from "./meal-intelligence/analyzeActivityMedia";
import { analyzeRecordMedia } from "./meal-intelligence/analyzeRecordMedia";
import { applyRecordObservation, asHealthType, confirmRecordDomain, RECORD_SHOWN, type RecordDomain } from "./record-fields";
import { Grouping } from "./Grouping";
import { ASSET_KINDS, buildGroups, EMPTY_GROUPING, forgetAsset, mergeGroups, moveTo as groupMoveTo, moveToKind, startNewGroup, type GroupCategory, type GroupingState } from "./grouping-model";
import { activityProvenance, applyActivityObservation, applyTextReading, categoryVerdict, confirmActivity, revokeActivityAsset } from "./activity-fields";
import { commonActivityTypes, recentPeopleIds, recentPlaces } from "./recall";
import { hasAnyMedia, resolveIntent, type HealthType, type RecordIntent, type UDraft } from "./types";
import { buildSubmission, minimumProblem, successKey } from "./submit";

const TEXT_LIMIT = 2000;

type Phase = "idle" | "posting" | "failed" | "discard";
type AssetKind = (typeof ASSET_KINDS)[number];
/** a tiny stable hash of the settled words — the key of a text-only specialist reading */
function hashText(t: string): string {
  let h = 5381;
  const str = t.trim();
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const isRecKind = (k: string | undefined): k is RecordKindAI => k === "project" || k === "problem" || k === "meeting" || k === "health";
type SheetId = "record" | "media" | "mymedia" | "organizer" | "people" | "place" | "activityType" | "healthType" | null;

/**
 * UC-C4.1 — the exact pre-autofill state, captured the moment `applyDetectedMetadata`
 * actually changes something, so "Not this" can restore precisely what was there before —
 * never a generic "unknown"/"NOW" rollback (§2/§10 of the metadata hardening pass).
 */
interface MetaSnapshot {
  assetId: string;
  prevEventTime: UDraft["eventTime"];
  prevTimeUnknown: UDraft["timeUnknown"];
  prevPlace: UDraft["place"];
  prevPlacePrecision: UDraft["placePrecision"];
  /** UC-C4.2 — recordPlace/placeSource are part of the same exact-restore contract. */
  prevRecordPlace: UDraft["recordPlace"];
  prevPlaceSource: UDraft["placeSource"];
}

const CHIP = "sb-press inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2 focus-visible:outline-[var(--focus)] @2xl:min-h-8 @2xl:px-1.5";
const CHIP_WORD = "text-[11px] leading-none font-medium tracking-[0.02em]";
const ROW_BTN = "sb-press flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)]";

function Glyph({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const KIND_GLYPH: Record<string, React.ReactNode> = {
  moment: <Glyph d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM10 6v4l2.5 2.5" />,
  meal: <Glyph d="M3 11h14a7 7 0 0 1-14 0zM7 5c0 1.5 1 1.5 1 3M10 4c0 1.5 1 1.5 1 3M13 5c0 1.5 1 1.5 1 3" />,
  activity: <Glyph d="M12 4.5a1 1 0 1 0 0-.01M7 17l3-4-1-3 3-2 2 2h3M10 13l-1 4M13 8l-1 3 3 2v4" />,
  health: <Glyph d="M4 17V6h12v11M8 17v-4h4v4M10 8v4M8 10h4" />,
  problem: <Glyph d="M10 3 2 17h16L10 3zM10 8v4M10 14.5v.5" />,
  project: <Glyph d="M4 5.5l1.5 1.5L8 4.5M10 6h7M4 11l1.5 1.5L8 10M10 11.5h7M4 16.5l1.5 1.5L8 15.5M10 17h7" />,
  meeting: <Glyph d="M2 9l4-3 4 3M18 9l-4-3-4 3M10 9v3l-2 2M10 12l2 2M6 6v6l4 4 4-4V6" />,
};
const SOCIAL_GLYPH = <Glyph d="M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM3.8 8h12.4M3.8 12h12.4M10 3.5c-2 2-2 11 0 13M10 3.5c2 2 2 11 0 13" />;

/**
 * UC-C3 §57 — one asset that fails to decode never breaks the picker. This prototype has no
 * real upload transport (a device file becomes a local object URL synchronously; there is no
 * network transfer to fail) — true upload failure/retry is a documented live seam. What CAN
 * happen here, and is handled the same quiet way `Media.tsx`'s `SafeImg` handles it in the
 * feed, is a file the browser cannot decode: it degrades to a labeled placeholder, never a
 * broken-image icon, and never removes the tile from the selection.
 */
/** a fresh composition starts with an empty facts log (diagnostic seam; module-level so no hook mutates a global) */
function resetMealFactsLog() {
  (window as unknown as { __SB_MEAL_FACTS_LOG?: unknown[] }).__SB_MEAL_FACTS_LOG = [];
}

function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span role="img" aria-label={alt} className={`flex items-center justify-center bg-[var(--sheet-raised)] px-1 text-center text-[10px] leading-[1.3] text-muted ${className ?? ""}`} data-sb-media-fallback>
        {alt || "—"}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />;
}

/** One focused sheet OVER the composer (§6/§56): Back returns to the composer, never out. */
function Sheet({ title, onBack, children, footer, hook }: { title: string; onBack: () => void; children: React.ReactNode; footer?: React.ReactNode; hook: string }) {
  const { t } = useT();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  return (
    <div className="sb-reveal absolute inset-0 z-20 flex flex-col bg-[var(--sheet-solid)]" role="group" aria-label={title} data-sb-sheet-panel={hook}>
      <header className="flex items-center gap-2 border-b border-[var(--hair)] px-3 py-2.5 @2xl:px-5">
        <button ref={first} type="button" onClick={onBack} aria-label={t("composer.back")} className="sb-press inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-sheet-back>
          <ChevronLeft size={17} />
        </button>
        <h3 className="text-[14px] font-semibold text-text">{title}</h3>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 @2xl:px-5">{children}</div>
      {footer && <footer className="border-t border-[var(--hair)] px-3 py-2.5 pb-[max(0.625rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] @2xl:px-5 @2xl:pb-2.5">{footer}</footer>}
    </div>
  );
}

export function UniversalComposer({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: UDraft }) {
  const { me, dispatch, state, newId, personOf } = useSocial();
  const { t, locale } = useT();
  // Remounted per open — `initial` is read once.
  const [d, setD] = useState<UDraft>(initial);
  // UC-C4.4 — real metadata extraction/geocoding resolve ASYNCHRONOUSLY, after this
  // render's own `d` has gone stale; this ref always holds the latest draft so the
  // resolve callback (registered once, at attach time) can read current state rather
  // than a captured snapshot from when the file was first attached.
  const dRef = useRef(d);
  useEffect(() => { dRef.current = d; }, [d]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sheet, setSheet] = useState<SheetId>(null);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [assistMenu, setAssistMenu] = useState(false);
  // The Circle doorway arrives AT a coordinate, and an EDIT is "correct the same event"
  // (§34) — both open with their More/When visible.
  const [moreOpen, setMoreOpen] = useState(initial.origin === "circle" || !!initial.editingId);
  const [issue, setIssue] = useState<string | null>(null);
  const [sugg, setSugg] = useState<AssistSuggestion | null>(null);
  const suggDismissed = useRef(false);
  // §26 — the global switch, read at mount (the composer mounts closed during SSR).
  const [assistOn, setAssistOn] = useState(() => smartAssistEnabled());
  const [peopleQuery, setPeopleQuery] = useState("");
  // UC-MEAL-AI — the Meal analysis lifecycle. `mealAnalysisKeyRef` is the exact attached-media
  // set already kicked off for THIS composer session, so re-renders (typing, unrelated state
  // changes) never re-fire the same analysis; `mealAnalysisGenRef` lets a superseded (late)
  // response recognize itself and do nothing to the draft (§LATE RESULT PROTECTION) — the
  // observation is still logged either way.
  // MEAL CAPTURE EXTENSION — per-asset analysis: one run (controller + generation) per attached asset,
  // each asset's own observation, and the asset whose details the card is showing.
  const assetRunsRef = useRef<Map<string, { controller: AbortController; gen: number }>>(new Map());
  const assetGenRef = useRef(0);
  const [assetObs, setAssetObs] = useState<Record<string, MealAIObservation | null>>({});
  const [pendingAssets, setPendingAssets] = useState<string[]>([]);
  // V1.1 — when each photo's analysis started (display only: lets the longer-wait copy count from the photo's own attach)
  const [assetSince, setAssetSince] = useState<Record<string, number>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const mealAnalyzing = pendingAssets.length > 0;
  // PHASE C — selection provenance for the ONE-TAP UNDO gesture. Deliberately its own
  // transient, composer-local state and NOT a reading of `intentSource` (owner-directed): the
  // general Smart Assist's accepted text suggestions also set intentSource "ai" and must never
  // acquire the undo gesture. Component-local on purpose — the composer remounts per open, so
  // this never outlives the composition it describes, and no persisted schema changes.
  const [mealAutoSelected, setMealAutoSelected] = useState(false);
  // PHASE C — the medium-confidence "Looks like a Meal — use it?" ask was declined for this
  // composition. Reset when a NEW media set starts a new analysis (a new photo is a new question).
  const [mealCatDismissed, setMealCatDismissed] = useState(false);
  const [visionDismissed, setVisionDismissed] = useState(false); // V0.4 P1 — "Continue without" is final for this composition
  /**
   * UHI-DEC-017 — the category SYSTEMBOOM organised this composition as, when the seven-category verdict was strong and
   * unambiguous enough to act on. Composer-local provenance, deliberately NOT a new `intentSource` value: the draft's own
   * authority model (`default` < `media` < `ai` < `user`, plus `origin: "circle"` for a direct specialist entry) already
   * carries the priority order, and `ai` is exactly "selected by SYSTEMBOOM". This state only remembers WHICH kind it chose,
   * so the card can confirm it and a removed photo can take its choice back with it. Null the moment the person chooses.
   */
  const [autoByVision, setAutoByVision] = useState<RecordIntent | null>(null);
  /** a direct entry from a specialist world (the Circle's "Record here") — its category is the person's, never SYSTEMBOOM's */
  const directEntry = initial.origin === "circle";
  // MIXED-MEDIA PROTOTYPE — the person's own per-photo category corrections (stable asset id → kind); carried by Keep draft
  const [assetCategory, setAssetCategory] = useState<Record<string, AssetKind>>(() => initial.assetCategories ?? {});
  // SOCIAL-4 — specialist readings (Project · Problem · Meeting · Health), ONE per (kind, asset) — or (kind, the words) when there is
  // no media — composer-local like the Meal/Activity lifecycles; results cache per key, a late result applies only while live.
  const [recObs, setRecObs] = useState<Record<string, RecordAIObservation | null>>({});
  const [recPending, setRecPending] = useState<string[]>([]);
  const [recSince, setRecSince] = useState<Record<string, number>>({});
  const recRunsRef = useRef(new Map<string, { controller: AbortController; gen: number }>());
  const recGenRef = useRef(0);
  const recAppliedRef = useRef(new Set<string>());
  const [textStable, setTextStable] = useState("");
  // MIXED-MEDIA GROUPING — the person's own organisation of this post's media (Composer-local; carried by Keep draft only)
  const [grouping, setGrouping] = useState<GroupingState>(() => initial.grouping ?? EMPTY_GROUPING);
  // Phase A — ONE Media Organizer (the "organizer" sheet) with two modes; grouping is hosted inside it, never a second surface
  const [organizerMode, setOrganizerMode] = useState<"all" | "group">("all");
  const openOrganizer = (mode: "all" | "group", opener?: HTMLElement | null) => { setOrganizerMode(mode); openSheet("organizer", opener); };
  const groupSeq = useRef(0);
  const groupPrefix = useId();
  const newGroupId = () => `g-u${groupPrefix.replace(/[^a-z0-9]/gi, "")}-${++groupSeq.current}`;
  // V3 — ACTIVITY analysis (stage 2 of category-first). Composer-local on purpose (like the Meal lifecycle): one reading per asset,
  // keyed by its stable id; nothing here is persisted into the draft (the field CELLS that matter — ownership — live in the draft).
  const [actObs, setActObs] = useState<Record<string, ActivityAIObservation | null>>({});
  const [, setActPending] = useState<string[]>([]);
  const [actSince, setActSince] = useState<Record<string, number>>({});
  const [actAutoSelected, setActAutoSelected] = useState(false);
  const [actCatDismissed, setActCatDismissed] = useState(false);
  // refs for the removal re-derivation inside the Meal effect (read, never a dependency)
  const autoRef = useRef({ meal: false, act: false });
  const autoVisionRef = useRef<RecordIntent | null>(null);
  const assetObsRef = useRef<Record<string, MealAIObservation | null>>({});
  const setPendingActivity = (id: string, on: boolean) => {
    setActPending((prev) => (on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
    if (on) setActSince((prev) => ({ ...prev, [id]: Date.now() }));
  };
  const actRunsRef = useRef(new Map<string, { controller: AbortController; gen: number }>());
  const actGenRef = useRef(0);
  const actAppliedRef = useRef(new Set<string>());
  // PHASE B — structured nutrition FACTS per looked-up food (keyed by the lookup name:
  // canonicalName, falling back to the everyday name). SUGGESTION STATE, deliberately kept
  // beside — never inside — the immutable `aiObservation`; cleared when a new media set
  // starts a new analysis. "AI recognizes. USDA supplies facts. AI estimates only as fallback."
  const [mealFacts, setMealFacts] = useState<Record<string, FoodFacts | "uncertain" | null>>({});
  // §24 — one metadata review per detected asset; edit mode never re-asks (the truth is set).
  const [metaReview, setMetaReview] = useState<{ id: string; resolution: "used" | "ignored" } | null>(null);
  // UC-C4.1 — the EXACT state that existed immediately before a metadata autofill touched
  // it, keyed to the asset that triggered it, so "Not this" can restore it precisely
  // (never a generic "revert to NOW/empty" — see `ignoreMetadata`).
  const [metaSnapshot, setMetaSnapshot] = useState<MetaSnapshot | null>(null);
  const [linkOpen, setLinkOpen] = useState(!!initial.link);
  const sheetOpener = useRef<HTMLElement | null>(null);

  const editing = !!d.editingId;
  const original = editing ? state.moments.find((m) => m.id === d.editingId) : undefined;
  // MEAL V1 — every attached photo's OWN complete Meal form, keyed by its stable asset id. A Meal being edited that was
  // saved with per-photo states resumes them (matched by id, or by attach order when the old session's ids are gone).
  const [assetMeal, setAssetMeal] = useState<Record<string, MealAssetState>>(() => {
    // a resumed KEEP DRAFT brings back each photo's own state (edits and clears included) the same way an edit of a saved Meal does
    const stored = original?.fields?.mealAssets ?? initial.mealAssets;
    if (!stored?.length) return {};
    const out: Record<string, MealAssetState> = {};
    stored.forEach((st, i) => {
      const id = d.mediaIds.includes(st.assetId) ? st.assetId : d.mediaIds[i];
      if (id) out[id] = { ...st, assetId: id };
    });
    return out;
  });
  const assetMealRef = useRef(assetMeal);
  useEffect(() => {
    assetMealRef.current = assetMeal;
  }, [assetMeal]);
  const initialLinkTitle = original?.media?.kind === "link" ? original.media.title : "Boudha morning kora — field recording (12 min)";
  const [linkTitle, setLinkTitle] = useState(initialLinkTitle);
  const [linkState, setLinkState] = useState<"none" | "resolving" | "preview" | "plain">(initial.link ? "preview" : "none");

  // A4 — the one pending publication, cancellable until it lands.
  const postTimer = useRef<number | null>(null);
  const postBtn = useRef<HTMLButtonElement>(null);
  const retryBtn = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cancelPosting = () => {
    if (postTimer.current !== null) window.clearTimeout(postTimer.current);
    postTimer.current = null;
  };
  useEffect(() => () => cancelPosting(), []);
  // UC-C4.2 test seam (§6/§14 — real object-level immutability proof, never UI banner text):
  // a read-only deep-clone snapshot of every current MediaAsset, in the same spirit as the
  // existing __SB_SOCIAL_STATE/__SB_RING_DENSITY debug globals. No schema/behavior change.
  useEffect(() => {
    (window as unknown as { __SB_ASSET_SNAPSHOT?: () => unknown }).__SB_ASSET_SNAPSHOT = () => JSON.parse(JSON.stringify(allAssets()));
  }, []);

  const openSheet = (id: Exclude<SheetId, null>, opener?: HTMLElement | null) => {
    sheetOpener.current = opener ?? (document.activeElement as HTMLElement | null);
    setSheet(id);
  };
  // Phase A — "+ Add more" inside the organizer: the media pipeline's sheets close BACK to the organizer (mode preserved), so the
  // person never leaves it; any other close goes to the composer as before
  const sheetReturn = useRef<SheetId>(null);
  const closeSheet = () => {
    const back = sheetReturn.current;
    sheetReturn.current = null;
    if (back) {
      setSheet(back);
      return;
    }
    setSheet(null);
    requestAnimationFrame(() => sheetOpener.current?.focus?.());
  };

  const returnTo = typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-sb-open-composer]") : null;
  useFocusTrap(open, container, {
    initial: textRef,
    onEscape: () => {
      // §56 — the escape ladder: a nested sheet closes first, then popovers, then the exit ask.
      if (sheet === "mymedia" || sheet === "organizer") setSheet("media");
      else if (sheet !== null) closeSheet();
      else if (audienceOpen) setAudienceOpen(false);
      else if (assistMenu) setAssistMenu(false);
      else requestClose();
    },
    returnTo,
  });

  const today = localISO(now()).slice(0, 10);
  const resolved: RecordIntent = resolveIntent(d);
  const anyMedia = hasAnyMedia(d);

  /* ---- media assets: every id resolves to an asset or the original's own item (A3) ---- */
  const origItems =
    original?.media?.kind === "photos" ? original.media.items.map((p) => ({ ...p, videoDuration: undefined as string | undefined }))
    : original?.media?.kind === "gallery" ? original.media.items
    : original?.media?.kind === "video" ? [{ ...original.media.poster, videoDuration: original.media.duration }]
    : [];
  const draftMedia = d.mediaIds
    .map((id, i) => {
      const a = assetById(id);
      if (a) return { id, src: a.src, alt: a.alt, w: a.w, h: a.h, videoDuration: a.mediaKind === "video" ? a.duration ?? "0:00" : undefined, takenAt: a.takenAt, takenPlace: a.takenPlace, processing: a.processing, error: a.error, poster: a.poster };
      const idx = id.startsWith("orig-") ? Number(id.slice(5)) : -1;
      const o = origItems[idx] ?? origItems[i];
      return o ? { id, src: o.src, alt: o.alt, w: o.w, h: o.h, videoDuration: o.videoDuration, takenAt: undefined, takenPlace: undefined, processing: undefined, error: undefined, poster: undefined } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const singleVideo = draftMedia.length === 1 && !!draftMedia[0].videoDuration;

  /**
   * Zero-effort capture (§2: original media metadata) — called at every point new media
   * enters the draft (My Media, Upload, Camera). Prefills the event date from the FIRST
   * attached asset that carries one, ONLY into a genuinely empty field — never overwriting a
   * value the person already set, and never overriding an explicit "I don't know"
   * (`timeUnknown`).
   *
   * UC-C4.2 §4/§5/§9/§10/§11 — the canonical record place AND the Social-visible default are
   * BOTH recomputed here from EVERY currently attached asset's own metadata place, never just
   * the first (never first- or last-write-wins): a single consistent place across all
   * metadata-bearing assets is used IMMEDIATELY, no confirmation gate; a conflict among them
   * leaves neither populated rather than fabricating a winner; no usable metadata at all
   * leaves both exactly as they were (the normal, unremarkable case, §13). A place the person
   * has themselves supplied (`placeSource === "user"`) — including one already on a legacy
   * Moment being edited, see `uDraftFromMoment` — is never touched by this recomputation
   * (§11 user override precedence), whichever order metadata and the person's own action
   * happen in. Nothing here ever reads or writes an asset's own metadata — only derives from
   * it (§3/§6 media metadata truth stays immutable).
   *
   * UC-C4.1 §2/§10: returns the PRE-recomputation state alongside the result whenever a
   * banner would show for it, so the caller can snapshot exactly what to restore on
   * "Not this" — never a generic "unknown"/"NOW" rollback.
   */
  const applyDetectedMetadata = (x: UDraft, ids: string[]): { next: UDraft; snapshot: MetaSnapshot | null } => {
    let place = x.place;
    let placePrecision = x.placePrecision;
    let recordPlace = x.recordPlace;
    let placeSource = x.placeSource;
    if (x.placeSource !== "user") {
      const places = new Set(ids.map((id) => assetById(id)?.takenPlace).filter((p): p is string => !!p));
      if (places.size === 1) {
        const [value] = places;
        place = value;
        placePrecision = undefined; // never fabricate a precision metadata never supplied
        recordPlace = { value, source: "metadata" };
        placeSource = "metadata";
      } else if (places.size > 1) {
        // §10 — do not fabricate a winner: neither field is populated from conflicting
        // metadata (never the first attached asset, never the last).
        place = undefined;
        placePrecision = undefined;
        recordPlace = undefined;
        placeSource = undefined;
      }
      // places.size === 0 — no metadata place signal among currently attached assets;
      // `place`/`recordPlace` stay exactly as they were (§13 — nothing to derive, nothing to
      // retract; a photo with no usable location is a completely normal, unremarkable state).
    }
    const found = ids.map((id) => assetById(id)).find((a) => a?.takenAt && metaReview?.id !== a.id);
    if (!found) return { next: { ...x, place, placePrecision, recordPlace, placeSource }, snapshot: null };
    const canFillTime = !x.eventTime && !x.timeUnknown;
    const snapshot: MetaSnapshot = {
      assetId: found.id,
      prevEventTime: x.eventTime,
      prevTimeUnknown: x.timeUnknown,
      prevPlace: x.place,
      prevPlacePrecision: x.placePrecision,
      prevRecordPlace: x.recordPlace,
      prevPlaceSource: x.placeSource,
    };
    const next: UDraft = {
      ...x,
      eventTime: canFillTime && found.takenAt ? { date: found.takenAt.slice(0, 10), precision: "day", provenance: "exif" } : x.eventTime,
      place,
      placePrecision,
      recordPlace,
      placeSource,
    };
    return { next, snapshot };
  };

  const toggleAsset = (id: string) =>
    setD((x) => {
      if (x.mediaIds.includes(id)) return { ...x, mediaIds: x.mediaIds.filter((p) => p !== id) };
      if (x.mediaIds.length >= MEDIA_LIMIT) return x;
      return { ...x, mediaIds: [...x.mediaIds, id], link: undefined };
    });
  const moveAsset = (i: number, dir: -1 | 1) =>
    setD((x) => {
      const ids = [...x.mediaIds];
      const j = i + dir;
      if (j < 0 || j >= ids.length) return x;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...x, mediaIds: ids };
    });
  // §12/§16 — cover selection: the lead position IS the cover in this media model.
  const makeCover = (i: number) =>
    setD((x) => {
      if (i <= 0 || i >= x.mediaIds.length) return x;
      const ids = [...x.mediaIds];
      const [id] = ids.splice(i, 1);
      return { ...x, mediaIds: [id, ...ids] };
    });
  // UC-C4.4 — called once real time resolves and again if/when a real place resolves for
  // a just-attached asset (registerUploads' `onMetadataReady`). Re-runs the EXACT SAME
  // `applyDetectedMetadata` derivation against the LATEST draft — no new logic, just a
  // re-trigger now that the asset's own takenAt/takenPlace are populated for real.
  // HEIC prototype — an asset's derivative/metadata landed: re-render so the collage, the analysis gates and the draft see it
  const [, setMediaTick] = useState(0);
  const rederiveFromAsset = (assetId: string) => {
    setMediaTick((t) => t + 1);
    const x = dRef.current;
    if (!x.mediaIds.includes(assetId)) return; // removed from the draft before metadata arrived
    const { next, snapshot } = applyDetectedMetadata(x, x.mediaIds);
    if (snapshot) setMetaSnapshot(snapshot);
    setD(next);
  };
  const addUploads = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = registerUploads(files, rederiveFromAsset);
    if (d.mediaIds.length + added.length > MEDIA_LIMIT) setIssue("ucomposer.mediaLimit"); // D11 — never silently dropped
    const mediaIds = [...d.mediaIds, ...added.map((a) => a.id)].slice(0, MEDIA_LIMIT);
    const { next, snapshot } = applyDetectedMetadata({ ...d, mediaIds, link: undefined }, mediaIds);
    if (snapshot) setMetaSnapshot(snapshot);
    setD(next);
  };

  /*
   * ZERO-EFFORT CAPTURE (owner rule, 2026-09-29) — priority source #2: original media
   * metadata, read BEFORE asking the person to type anything. An asset's own date/place is
   * PREFILLED the instant it's attached (`applyDetectedMetadata`, called at every place new
   * media enters the draft — My Media, Upload, Camera) — never a blocking gate the person
   * must resolve before POST (this supersedes the earlier interpretation of §23/§24, which
   * the UC-C3 brief's own §20 already corrected: "Do not force confirmation for obvious
   * harmless metadata"). The provenance line stays visible so the value is always
   * distinguishable from something the person typed themselves; "Use" simply dismisses the
   * notice (the value is already applied), and "Not this" REVERTS exactly what was
   * auto-filled — never touching a value the person set themselves.
   */
  const detected = editing ? undefined : draftMedia.find((p) => p.takenAt);
  const showMetaBanner = !!detected && metaReview?.id !== detected.id;
  // UC-C4.2 §5/§18 — no confirmation gate exists: the date/place were already applied the
  // instant the metadata was read. "Use" is purely a review dismissal — it changes nothing.
  const useMetadata = () => {
    if (!detected) return;
    setMetaReview({ id: detected.id, resolution: "used" });
  };
  // UC-C4.1 §2/§8/§10 — "Not this" restores the EXACT snapshot taken before this asset's
  // autofill applied (whatever it was: unknown, an approximate year, a value the person had
  // already set) — never a generic "unknown"/"NOW" rollback. If nothing was actually
  // auto-applied for this asset (e.g. the fields were already set from elsewhere), there is
  // nothing to revert: the banner simply dismisses, honestly (§9 — never touch a value the
  // person set themselves; never delete the original asset's own metadata either).
  const ignoreMetadata = () => {
    if (!detected) return;
    if (metaSnapshot && metaSnapshot.assetId === detected.id) {
      const snap = metaSnapshot;
      setD((x) => ({
        ...x,
        eventTime: snap.prevEventTime,
        timeUnknown: snap.prevTimeUnknown,
        place: snap.prevPlace,
        placePrecision: snap.prevPlacePrecision,
        recordPlace: snap.prevRecordPlace,
        placeSource: snap.prevPlaceSource,
      }));
    }
    setMetaReview({ id: detected.id, resolution: "ignored" });
  };

  /* ---- event-time honesty (§21/A11): future and before-life dates are refused ---- */
  const evDate = d.eventTime?.date;
  const evProblem = evDate ? validateBirthDate(evDate, now()) : null; // "future" | "invalid" | null
  const beforeBirth = !!evDate && !evProblem && evDate < me.birthDate;
  const backdated = !!evDate && evDate < today && !beforeBirth;

  /* ---- §20 minimum + §44 clear validation ---- */
  const over = d.text.length > TEXT_LIMIT;
  const minKey = minimumProblem(d);
  // V3 — MIXED RECORD TYPES. One Social post has ONE primary record category (a cross-domain publication is a deferred architecture,
  // not built here), so when the per-asset category reads already held for this composition disagree — a photo that is food AND a
  // photo that is an Activity — the composer says so and holds Post until the PERSON picks one primary type (an explicit choice).
  // Nothing is stored for this: it is derived from the existing per-asset observations, so it needs no schema and nothing persists.
  // MIXED-MEDIA PROTOTYPE — each asset's own category: the person's correction first, else what its category read says.
  const categoryOf = (id: string): AssetKind | undefined => {
    if (assetCategory[id]) return assetCategory[id];
    const o = assetObs[id];
    if (!o) return undefined;
    if (o.isFood === true && o.confidence !== "low") return "meal";
    if (categoryVerdict(o) !== "none") return "activity";
    return undefined;
  };
  const mixedKinds = new Set<AssetKind>();
  for (const m of draftMedia) {
    const c = categoryOf(m.id);
    if (!c) continue;
    mixedKinds.add(c);
  }
  // GROUPING category: the same per-asset reading, read for organising (not for the gate): a settled non-food, non-activity
  // photo is a Life Moment; a failed or low-confidence read "needs review" (never forced into a kind); unread = pending.
  const groupCategoryOf = (id: string): GroupCategory | undefined => {
    if (assetCategory[id]) return assetCategory[id];
    const o = assetObs[id];
    if (o === undefined) return undefined;
    if (o === null) return "review";
    if (o.isFood === true) return o.confidence === "low" ? "review" : "meal";
    const v = categoryVerdict(o);
    if (v !== "none") return "activity";
    if (o.activityCategory?.isActivity) return "review";
    return "moment";
  };
  const groupView = buildGroups(grouping, draftMedia.map((m) => m.id), groupCategoryOf);
  const groupOf = (id: string) => groupView.groups.find((g) => g.mediaIds.includes(id));
  // Done: the organised post's kind is an EXPLICIT choice — one group left → that kind (Needs review → Life Moment); several
  // groups → the one generic Life-Moment shell that carries every photo (mixedAssets record-only)
  const settleKind = (): RecordIntent => {
    if (groupView.groups.length !== 1) return "moment";
    const c = groupView.groups[0].category;
    return c === "meal" || c === "activity" ? c : "moment";
  };
  const organisedCard = assistOn && !editing && groupView.groups.length > 1 && !grouping.organised;
  const organisedSummary = !editing && grouping.organised && groupView.groups.length > 1;
  const mixedDetected = assistOn && !editing && mixedKinds.size > 1;
  const mixedBlock = mixedDetected && d.intentSource !== "user";
  const canPost = !over && !minKey && !beforeBirth && evProblem !== "future" && phase !== "posting" && !mixedBlock;

  /* ---- PHASE C — the MEDIUM-confidence category ask (never a modal, never while Meal is
   * already selected, never over a deliberate choice, gone for good once declined) ---- */
  const mealObs = d.domains.meal.aiObservation;
  const mealCatAsk =
    assistOn && !editing && phase === "idle" && anyMedia && resolved !== "meal" && !mealCatDismissed &&
    d.intentSource !== "user" && d.intentSource !== "ai" &&
    mealObs?.isFood === true && mealObs.confidence === "medium" &&
    // UHI-DEC-014 — the medium ask is the same claim in a quieter voice: it may not contradict the seven-category verdict
    // (food present at a celebration asks nothing; the Intelligence card offers the real choice instead).
    (mealObs.suggestion === undefined || mealObs.suggestion.primary.kind === "meal");

  /* ---- V3 — the MEDIUM-confidence ACTIVITY category ask (same rules as Meal's: never a modal, never over a deliberate choice,
   * never while Activity is selected, gone for good once declined). The reading that decides is the first attached activity asset's. ---- */
  const actAskObs = draftMedia.map((m) => assetObs[m.id]).find((o) => !!o && categoryVerdict(o) === "ask");
  const actCatAsk =
    assistOn && !editing && phase === "idle" && anyMedia && resolved !== "activity" && !actCatDismissed &&
    d.intentSource !== "user" && d.intentSource !== "ai" && !!actAskObs &&
    (actAskObs.suggestion === undefined || actAskObs.suggestion.primary.kind === "activity");

  /* ---- MEAL CAPTURE EXTENSION — the selected photo owns the detail panel (never arrival order) ---- */
  const selId = selectedAssetId && draftMedia.some((m) => m.id === selectedAssetId) ? selectedAssetId : (draftMedia[0]?.id ?? null);
  // SELECTED-MEDIA CONTEXT — ONE anchor for every media-specific surface: in a mixed composition the pill, the contextual form,
  // the intelligence card, Adjust/Looks right and More follow the SELECTED asset's effective group (its own reading, or the
  // person's correction); otherwise the post's one category. Analysis gating and the save path keep reading `resolved`.
  // Per-asset context applies when the composition GENUINELY holds different record kinds (food AND activity read — the gate's own
  // definition) or once the person has organised it; a merely plain photo inside a Meal/Activity post stays part of that post (the
  // accepted Meal behaviour: a photo with no reading is a blank, editable Meal form, not a different record).
  const personOrganised = Object.keys(assetCategory).length > 0 || grouping.organised || grouping.groups.length > 0 || Object.keys(grouping.placed).length > 0;
  const mixedContext = !editing && draftMedia.length > 1 && groupView.groups.length > 1 && (mixedKinds.size > 1 || personOrganised);
  const selGroupCategory = selId ? groupOf(selId)?.category : undefined;
  // a post-level kind the person chose explicitly (Health · Problem · Project · Meeting — not per-asset kinds in this prototype)
  // is the whole post's context, even in a mixed composition
  const contextIntent: RecordIntent = mixedContext && selGroupCategory ? (selGroupCategory === "review" ? "moment" : selGroupCategory) : resolved;
  // SOCIAL-4 — the specialist kind the context is in, and the key of the reading that belongs to the selected asset (or the words)
  const recKind: RecordKindAI | null = isRecKind(contextIntent) ? contextIntent : null;
  // each attached asset's EFFECTIVE kind as one string — the reading effect re-runs exactly when an asset's kind changes
  const recKindMap = draftMedia.map((m) => `${m.id}=${mixedContext ? (groupOf(m.id)?.category ?? "") : resolved}`).join("|");
  const recTextKey = `text:${hashText(d.text)}`;
  const recKey = recKind ? `${recKind}:${draftMedia.length ? selId ?? "" : recTextKey}` : null;
  const recSelectedObs = recKey ? recObs[recKey] : undefined;
  /* ---- V0.4 P1 — SMART CATEGORY SUGGESTIONS from the neutral Pass 1 reading. The card belongs to the selected asset (else the
   * first read one); it shows ONLY while the category is not the person's own choice, never in a mixed composition (the
   * organised card owns that), never over a legacy Meal/Activity ask, never for a Circle "Record here" draft, and never after
   * "Continue without". It SUGGESTS — selection is always the person's (Use = an explicit choice). ---- */
  const visionObs = (() => {
    if (!anyMedia) return undefined;
    const pick = (id?: string) => (id ? assetObs[id] : undefined);
    const sel = selId ? pick(selId) : undefined;
    if (sel?.suggestion) return sel;
    return draftMedia.map((m) => assetObs[m.id]).find((o) => !!o?.suggestion);
  })();
  const visionSuggestion = visionObs?.suggestion;
  const visionOrganized = !!autoByVision && d.intentSource === "ai" && visionSuggestion?.primary.kind === autoByVision && resolved === autoByVision;
  const visionCard =
    assistOn && !editing && phase === "idle" && anyMedia && !mixedContext && !visionDismissed && initial.origin !== "circle" &&
    d.intentSource !== "user" && !mealCatAsk && !actCatAsk && !!visionSuggestion &&
    // UHI-DEC-017 — the card either PROPOSES a category or CONFIRMS the one SYSTEMBOOM organised. It adds nothing when the
    // composition already is that category for another reason (a Meal/Activity the specialist rules selected, which keep
    // their own silent flow, or the plain Life-Moment fallback with no match).
    (visionOrganized || (!(visionSuggestion.primary.kind === resolved && visionSuggestion.primary.kind !== "moment") &&
      !(visionSuggestion.noMatch && resolved !== "moment" && resolved !== "social")));
  const visionSeen = visionObs?.vision?.scene.description || visionObs?.vision?.scene.label || "";
  // true only while SYSTEMBOOM's own choice still stands and still matches what the card is about to confirm

  // Change on the pill / the chooser while a mixed composition is selected: the choice applies to the SELECTED asset only, through
  // the existing grouping operations (human authority — a late reading never moves it back). Other kinds stay a post-level choice.
  // ONE per-asset category change (the organizer's and, in a mixed composition, the chooser's): the existing grouping move +
  // the person's correction; when every photo then agrees the post's own kind follows explicitly. Never an AI rerun.
  const setAssetKind = (id: string, k: AssetKind) => {
    setGrouping((st) => moveToKind(st, groupView.groups, id, k, newGroupId));
    setAssetCategory((prev) => ({ ...prev, [id]: k }));
    const others = draftMedia.filter((m) => m.id !== id).map((m) => groupOf(m.id)?.category);
    if (others.length && others.every((c) => c === k)) chooseIntent(k);
  };
  const chooserScope = useRef<"post" | "asset">("post");
  const pickKind = (k: RecordIntent) => {
    if ((mixedContext || chooserScope.current === "asset") && selId && k !== "social") {
      chooserScope.current = "post";
      setAssetKind(selId, k);
      return;
    }
    chooserScope.current = "post";
    chooseIntent(k);
  };
  const selObs = selId ? assetObs[selId] : undefined;
  const mealView =
    draftMedia.length > 1 && selId
      ? { obs: selObs, pending: pendingAssets.includes(selId), index: draftMedia.findIndex((m) => m.id === selId) + 1, total: draftMedia.length, assetId: selId, isPrimary: !!selObs && selObs === d.domains.meal.aiObservation }
      : undefined;
  const mealSelectable = (resolved === "meal" || mixedContext) && draftMedia.length > 1;
  // V1.1 — each photo's waiting phase, DERIVED from the real request state (never stored): analysis in flight → nutrition lookups in
  // flight → ready; a failed / switched-off / not-yet-eligible photo is plain manual. No new request, no timer.
  const photoPhase = (id: string): IntelPhase => {
    const m = draftMedia.find((x) => x.id === id);
    if (m?.processing) return "processing"; // HEIC prototype — the photo itself is being made readable; not AI
    if (!m || m.error || !assistOn || editing || (m.videoDuration && resolved !== "meal" && resolved !== "activity")) return "manual";
    const kindOf = mixedContext ? groupOf(id)?.category : resolved;
    if (isRecKind(kindOf)) {
      // SOCIAL-4 — a specialist reading has its own lifecycle; the category read (stage 1) still runs first for a photo
      const ro = recObs[`${kindOf}:${id}`];
      if (ro === undefined) return recPending.includes(`${kindOf}:${id}`) || !m.videoDuration ? "analyzing" : "manual";
      return ro === null ? "manual" : "ready";
    }
    if (kindOf === "activity") {
      // V3 — Activity's own derived phase: the Activity reading is the only stage left once Activity is selected. An Activity-read
      // photo inside a post that is NOT (yet) Activity has only its category read to wait on — stage 2 never runs for it, so its
      // phase settles on that read (never an endless "analyzing").
      if (resolved !== "activity") {
        const mo = assetObs[id];
        return mo === undefined ? "analyzing" : mo === null ? "manual" : "ready";
      }
      const ao = actObs[id];
      return ao === undefined ? "analyzing" : ao === null ? "manual" : "ready";
    }
    const o = assetObs[id];
    if (o === undefined) return "analyzing"; // eligible and no answer yet — in flight (or about to be)
    if (o === null) return "manual";
    return mealLookupKeys(o).some((k) => !Object.prototype.hasOwnProperty.call(mealFacts, k)) ? "resolving" : "ready";
  };
  const selPhase: IntelPhase = selId ? photoPhase(selId) : "manual";
  // MEAL V1 — the SELECTED photo's complete form. While a Meal has photos, every Meal editor reads and writes THIS photo's
  // effective values (through the overlay draft below); a Meal with no photo, or an old one saved without per-photo
  // states, keeps editing the draft exactly as before.
  const assetBound = contextIntent === "meal" && !!selId && (!editing || Object.keys(assetMeal).length > 0);
  const selCells: MealAssetState | undefined = selId ? (assetMeal[selId] ?? seedAssetMeal(selId, d.domains.meal)) : undefined;
  const viewDraft: UDraft = assetBound && selCells ? overlayMealDraft({ ...d, intent: contextIntent }, selCells) : { ...d, intent: contextIntent };
  const OVERLAY_KEYS = new Set(["items", "preparation", "occasion", "context"]);
  const viewSet = (f: (x: UDraft) => UDraft) => {
    if (!assetBound || !selId || !selCells) {
      setD(f);
      return;
    }
    const next = f(viewDraft);
    const edits = assetEditsFromDraft(viewDraft, next);
    const fields = Object.keys(edits) as MealAssetField[];
    if (fields.length) {
      setAssetMeal((prev) => {
        let st = prev[selId] ?? selCells;
        for (const field of fields) st = editAssetField(st, field, edits[field] as never);
        return { ...prev, [selId]: st };
      });
    }
    // everything the photo does not own goes to the real draft (shallow-merged, so nothing concurrent is lost)
    setD((x) => {
      let nx = x;
      for (const k of Object.keys(next) as (keyof UDraft)[]) {
        if (k === "domains" || k === "intent") continue;
        if (next[k] !== viewDraft[k]) nx = { ...nx, [k]: next[k] };
      }
      const patch: Record<string, unknown> = {};
      for (const k of Object.keys(next.domains.meal) as (keyof typeof next.domains.meal)[]) {
        if (!OVERLAY_KEYS.has(k) && next.domains.meal[k] !== viewDraft.domains.meal[k]) patch[k] = next.domains.meal[k];
      }
      if (fields.includes("preparation") && !(nx.revealed?.meal ?? []).includes("preparation")) nx = { ...nx, revealed: { ...nx.revealed, meal: [...(nx.revealed?.meal ?? []), "preparation"] } };
      if (Object.keys(patch).length) nx = { ...nx, domains: { ...nx.domains, meal: { ...nx.domains.meal, ...patch } } };
      return nx;
    });
  };
  const editAssetText = (field: MealAssetField, text: string) => {
    if (!selId || !selCells) return;
    let value: unknown;
    if (field === "components") value = parseComponents(text);
    else if (field === "portion") value = text;
    else {
      const unit = field === "calories" ? "kcal" : "g";
      const parsed = parseNutrient(text, unit);
      if (parsed === null) return; // not a nutrient reading — ignored, never stored
      value = parsed;
    }
    setAssetMeal((prev) => ({ ...prev, [selId]: editAssetField(prev[selId] ?? selCells, field, value as never) }));
  };
  const lookRight = () => {
    if (!selId || !selCells) return;
    setAssetMeal((prev) => ({ ...prev, [selId]: confirmAssetMeal(prev[selId] ?? selCells) }));
  };
  const adjustMeal = () => {
    setMoreOpen(true);
    setD((x) => ({ ...x, revealed: { ...x.revealed, meal: [...new Set([...(x.revealed?.meal ?? []), "preparation", "ingredients", "experience", "cost", "foodItems", "notes"])] } }));
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>("[data-sb-ufield='items']");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  // V3 — Adjust: open the existing Activity fields and put the cursor in the first one; no modal, no second editor, no request.
  const adjustActivity = () => {
    setMoreOpen(true);
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>("[data-sb-ufield='distance']") ?? document.querySelector<HTMLInputElement>("[data-sb-domain-quick='activity'] input");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  /* ---- SMART ASSIST (§25–§38): one quiet suggestion, only while enabled ---- */
  useEffect(() => {
    if (!assistOn || editing || suggDismissed.current || d.intentSource === "user" || d.intentSource === "ai" || phase !== "idle") {
      setSugg(null);
      return;
    }
    const timer = window.setTimeout(() => setSugg(extractAssist(d.text, anyMedia, me.id)), 900);
    return () => window.clearTimeout(timer);
  }, [d.text, anyMedia, d.intentSource, phase, editing, assistOn, me.id]);

  /*
   * UC-MEAL-AI — media attachment may start Meal analysis automatically, reusing the SAME
   * Smart Assist ON/OFF switch as the one AI toggle in this composer (§AI ON/OFF PROTOTYPE
   * STATE: "if one exists, reuse it"). `!assistOn` returns before `analyzeMealMedia` is ever
   * referenced, so AI OFF means literally zero calls, zero `/api/analyze-meal` requests, zero
   * DeepSeek calls — a first-class, fully-usable path.
   *
   * MEAL CAPTURE EXTENSION — PER-ASSET LIFECYCLE. Every attached asset is analyzed ONCE, on its
   * own, and keeps its OWN observation (`assetObs`, keyed by the asset's stable id). Adding a photo
   * never re-analyzes (or aborts) the others; removing one retires only its own run, so a late answer
   * for a removed asset can never apply. The canonical Meal stays ONE record: its observation
   * (`domains.meal.aiObservation`, below) is the PRIMARY asset's — the first attached food asset.
   */
  useEffect(() => {
    // PHASE B review fix (adversarial finding #2): turning Smart Assist OFF mid-flight must
    // honor "AI OFF means literally zero calls" — every in-flight analysis is aborted and its run
    // retired (so a late resolution can neither store, auto-select, nor launch facts lookups), and
    // the lifecycle cleared so an explicit re-enable may genuinely re-ask.
    const retireAll = () => {
      for (const run of assetRunsRef.current.values()) run.controller.abort();
      assetRunsRef.current.clear();
      // prototype UX closure — a no-op when already empty: with Smart Assist OFF this effect re-runs on every render (its media
      // dependency is rebuilt each render), and an unconditional `[]` re-rendered forever ("Maximum update depth exceeded")
      setPendingAssets((prev) => (prev.length ? [] : prev));
    };
    if (editing || !assistOn) {
      if (!assistOn) retireAll();
      return;
    }
    const attached = new Set(draftMedia.map((m) => m.id));
    // PHASE B review fix (adversarial finding #1) + per-asset: a removed asset's run is retired on its
    // own (its late answer — and any lookups it would launch — can no longer apply). Everything else
    // is left exactly as it is.
    let removedAny = false;
    for (const [id, run] of assetRunsRef.current) {
      if (!attached.has(id)) {
        run.controller.abort();
        assetRunsRef.current.delete(id);
        removedAny = true;
      }
    }
    const pruneRemoved = () => {
      // SELECTED-MEDIA CONTEXT — an AUTO-selected post category must not outlive the photo that selected it: when media is removed
      // and the category was the AI's (never the person's), it is re-derived from the readings that remain, with the same HIGH-only
      // rule the response handler applies (food first, then Activity), else back to the plain media default.
      // UHI-DEC-017 — the readings changed, so SYSTEMBOOM's own choice is re-derived from what is left (same rule, no order)
      if (removedAny && autoVisionRef.current) {
        const settled = draftMedia
          .map((m) => (attached.has(m.id) ? assetObsRef.current[m.id]?.suggestion : undefined))
          .filter((v): v is NonNullable<typeof v> => !!v && !v.noMatch && v.primary.confidence === "high")
          .map((v) => v.primary.kind);
        const agreed = settled.length > 0 && settled.every((k) => k === settled[0]) ? settled[0] : null;
        const next: RecordIntent | null = agreed && agreed !== "health" && agreed !== "meal" && agreed !== "activity" ? agreed : null;
        autoVisionRef.current = next;
        setAutoByVision(next);
        setD((x) => (x.intentSource === "user" ? x : next ? { ...x, intent: next, intentSource: "ai" as const } : { ...x, intent: "social", intentSource: "default" as const }));
      }
      if (removedAny && (autoRef.current.meal || autoRef.current.act)) {
        const remaining = draftMedia.map((m) => assetObsRef.current[m.id]).filter((o): o is MealAIObservation => !!o);
        // UHI-DEC-014 — re-derivation applies the SAME experience-first rule as the response handler (a reading whose
        // verdict is not Meal/Activity never re-selects it when another photo is removed).
        const settledAs = (o: MealAIObservation, k: string) => !o.suggestion || (o.suggestion.primary.kind === k && o.suggestion.primary.confidence === "high");
        const meal = remaining.some((o) => o.isFood === true && o.confidence === "high" && settledAs(o, "meal"));
        const act = !meal && remaining.some((o) => categoryVerdict(o) === "select" && settledAs(o, "activity"));
        const next: RecordIntent = meal ? "meal" : act ? "activity" : "social";
        setD((x) => (x.intentSource === "user" ? x : { ...x, intent: next, intentSource: next === "social" ? "default" : "ai" }));
        setMealAutoSelected(meal);
        setActAutoSelected(act);
      }
      setPendingAssets((prev) => (prev.every((id) => attached.has(id)) ? prev : prev.filter((id) => attached.has(id))));
      setAssetObs((prev) => (Object.keys(prev).every((id) => attached.has(id)) ? prev : Object.fromEntries(Object.entries(prev).filter(([id]) => attached.has(id)))));
      // MEAL V1 — a removed photo takes ITS form with it; the others keep theirs (keyed by id, so nothing shifts or is reassigned).
      setAssetMeal((prev) => (Object.keys(prev).every((id) => attached.has(id)) ? prev : Object.fromEntries(Object.entries(prev).filter(([id]) => attached.has(id)))));
    };
    pruneRemoved();
    if (draftMedia.length === 0) return;
    // PHASE C — PHOTOS analyze on attach regardless of the current category (the observation
    // decides what happens next); VIDEO keyframe extraction keeps its original Meal-selected
    // gate (heavier work, and the Phase C brief scopes the broadened trigger to photos).
    // HEIC prototype — a photo still being converted (or one that could not be) has no pixels to read yet: not eligible
    const eligible = draftMedia.filter((m) => !m.processing && !m.error && (m.videoDuration ? resolved === "meal" : true));
    for (const asset of eligible) {
      if (assetRunsRef.current.has(asset.id)) continue; // already running/done for this exact asset — one call per unchanged asset
      if (assetRunsRef.current.size === 0) {
        // a fresh composition: the facts log starts empty (one composition, one log)
        resetMealFactsLog();
      }
      const controller = new AbortController();
      const gen = ++assetGenRef.current;
      assetRunsRef.current.set(asset.id, { controller, gen });
      const live = () => assetRunsRef.current.get(asset.id)?.gen === gen;
      setMealCatDismissed(false); // PHASE C — a new asset is a new question
      setVisionDismissed(false); // V0.4 P1 — likewise for the vision suggestion
      setActCatDismissed(false);
      setPendingAssets((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
      setAssetSince((prev) => ({ ...prev, [asset.id]: Date.now() }));
      const w = window as unknown as {
        __SB_MEAL_ANALYSIS_LOG?: Array<{ key: string; status: string; observation: unknown }>;
        __SB_MEAL_FACTS_LOG?: Array<{ canonicalName: string; status: string; facts: unknown; via?: string[] }>;
      };
      const log = (entry: { key: string; status: string; observation: unknown }) => {
        if (!w.__SB_MEAL_ANALYSIS_LOG) w.__SB_MEAL_ANALYSIS_LOG = [];
        w.__SB_MEAL_ANALYSIS_LOG.push(entry);
      };
      // Entries: start → found | miss | uncertain | failed (a late entry from a retired run is dropped).
      const logFacts = (entry: { canonicalName: string; status: string; facts: unknown; via?: string[] }) => {
        if (!w.__SB_MEAL_FACTS_LOG) w.__SB_MEAL_FACTS_LOG = [];
        w.__SB_MEAL_FACTS_LOG.push(entry);
      };
      log({ key: asset.id, status: "start", observation: undefined });
      analyzeMealMedia(asset.videoDuration ? { videoUrl: asset.src, signal: controller.signal } : { photoUrls: [asset.src], signal: controller.signal }).then((observation) => {
        log({ key: asset.id, status: observation !== null ? "done" : "failed", observation });
        if (!live()) return; // removed, or retired by Smart Assist OFF — a late result never applies
        setPendingAssets((prev) => prev.filter((id) => id !== asset.id));
        setAssetObs((prev) => ({ ...prev, [asset.id]: observation }));
        if (observation === null) return; // safe failure — nothing to show, Save is unaffected
        // MEAL V1 — this photo's OWN form fills from ITS OWN observation (high + medium; low stays blank), never from
        // another photo's, and never over anything the person already typed, cleared or confirmed for it.
        setAssetMeal((prev) => ({ ...prev, [asset.id]: fillAssetMeal(prev[asset.id] ?? seedAssetMeal(asset.id, dRef.current.domains.meal), observation, asset.takenAt) }));
        // PHASE C §auto-selection — decided at RESPONSE-APPLICATION time, never request time:
        // the person may have chosen a category while this was in flight, and an explicit choice
        // ("user", or an accepted suggestion's "ai") is never overridden. The asset must still be
        // attached (`live()` above). `isFood === true` is already a strictly validated boolean
        // (route-side); a HIGH non-food or MEDIUM/LOW food never selects here.
        const cur = dRef.current;
        const deliberate = cur.intentSource === "user" || cur.intentSource === "ai";
        // UHI-DEC-014 — food being PRESENT is not the same as the meal being the experience. Where the reading carries a
        // seven-category verdict (V0.4 Pass 1), Meal may auto-select only when that verdict says the meal IS the primary
        // experience; a birthday cake therefore offers the choice instead of selecting Meal. A legacy reading with no
        // verdict keeps the accepted Phase C behaviour exactly (isFood + HIGH).
        // …and an AMBIGUOUS verdict (the classifier states its primary as "likely", not "best") is a question for the
        // person, never a silent selection — Example C of UHI-DEC-014.
        const verdict = observation.suggestion?.primary;
        const settled = verdict?.confidence === "high";
        const mealIsTheExperience = verdict === undefined || (verdict.kind === "meal" && settled);
        const auto = !deliberate && smartAssistEnabled() && observation.isFood === true && observation.confidence === "high" && mealIsTheExperience;
        if (auto) {
          setD((x) => (x.intentSource !== "user" && x.intentSource !== "ai" ? { ...x, intent: "meal" as const, intentSource: "ai" as const } : x)); // re-guarded at application
          setMealAutoSelected(true);
        }
        // V3 — the SAME category decision, extended: a photo that is not food and that the category call judged an Activity with HIGH
        // confidence selects Activity under the identical rules (response-application time, never over a deliberate choice, undoable).
        // Food always wins: `categoryVerdict` is "none" for any food image, so Activity can never steal a Meal.
        const activityIsTheExperience = verdict === undefined || (verdict.kind === "activity" && settled);
        if (!deliberate && !auto && smartAssistEnabled() && categoryVerdict(observation) === "select" && activityIsTheExperience) {
          setD((x) => (x.intentSource !== "user" && x.intentSource !== "ai" ? { ...x, intent: "activity" as const, intentSource: "ai" as const } : x));
          setActAutoSelected(true);
        }
        /*
         * UHI-DEC-017 — INTELLIGENT AUTOMATIC CATEGORY SELECTION. Decided from EVERY reading this composition currently
         * holds (this one included), never from arrival order — two photographs are analysed at once, and whichever answers
         * last must reach the same conclusion. SYSTEMBOOM organises only when every settled reading agrees on ONE experience
         * that is its own supported subject (the UHI-DEC-014 ceiling already holds an unsupported category below the lead
         * band), the recommendation is SETTLED (`high` — an ambiguous lead is stated as "likely" and never acts) and it is a
         * real match (`noMatch` is the neutral fallback, never a claim). HEALTH is excluded: the owner's table says SUGGEST a
         * sensitive category, never select it; Meal and Activity keep their own specialist rules above. The moment the
         * readings stop agreeing, SYSTEMBOOM withdraws ITS OWN choice and asks — a choice the PERSON made is never touched.
         */
        assetObsRef.current = { ...assetObsRef.current, [asset.id]: observation }; // synchronous: the next answer must see this one
        if (!auto && smartAssistEnabled() && !editing && !directEntry) {
          const settled = draftMedia
            .map((m) => assetObsRef.current[m.id]?.suggestion)
            .filter((v): v is NonNullable<typeof v> => !!v && !v.noMatch && v.primary.confidence === "high")
            .map((v) => v.primary.kind);
          const agreed = settled.length > 0 && settled.every((k) => k === settled[0]) ? settled[0] : null;
          const next: RecordIntent | null = agreed && agreed !== "health" && agreed !== "meal" && agreed !== "activity" ? agreed : null;
          if (next !== autoVisionRef.current) {
            autoVisionRef.current = next; // synchronous for the same reason
            setAutoByVision(next);
            setD((x) => (x.intentSource === "user" ? x : next ? { ...x, intent: next, intentSource: "ai" as const } : x.intentSource === "ai" ? { ...x, intent: "social", intentSource: "default" as const } : x));
          }
        }
        // PHASE B — after recognition, look up REAL nutrition facts through the one server
        // boundary (`/api/food-facts`, or the packaged source first for a branded meal). Results
        // merge into SUGGESTION STATE only — the aiObservation is never touched. A miss or failure
        // is quiet: the AI estimate remains the visible fallback. `?mockfacts=` / `?mockpackaged=`
        // forward as `?mock=` (same convention as `mockai`). Launched only while this asset's run
        // is live and Smart Assist is still on (adversarial findings #1/#2).
        if (observation.isFood === true && smartAssistEnabled()) {
          const mockFacts = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockfacts") : null;
          const mockPackaged = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockpackaged") : null;
          // MEAL CAPTURE UX — with a specific Meal identity the lookup is for THAT meal (one lookup, its
          // canonical name + any printed brand); an unnamed/low identity looks nothing up. Observations
          // without `meal` (legacy) keep the per-food lookups.
          const lookups: { name: string; canonicalName?: string; brand?: string; confidence: "high" | "medium" | "low" }[] = observation.meal
            ? observation.meal.name && observation.meal.confidence !== "low"
              ? [{ name: observation.meal.name, canonicalName: observation.meal.canonicalName, brand: observation.meal.brand, confidence: observation.meal.confidence }]
              : []
            : observation.foods.filter((f) => f.confidence !== "low").slice(0, 5);
          const postJson = (url: string, payload: object) =>
            fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal }).then((r) => {
              if (!r.ok) throw new Error(`${url} ${r.status}`);
              return r.json();
            });
          for (const food of lookups) {
            const lookupName = food.canonicalName ?? food.name;
            // PHASE B2 — the chain, decided per food and never fanned out: a food the model read a
            // brand on, at HIGH confidence, asks the PACKAGED source (Open Food Facts) first; a miss
            // or failure there continues to USDA like any other food. Every other food goes to USDA
            // only. Both miss → no fact, the AI estimate stays.
            const packaged = food.confidence === "high" && !!food.brand;
            const via: string[] = [];
            const chain = packaged ? { via } : {};
            logFacts({ canonicalName: lookupName, status: "start", facts: undefined, ...chain });
            const usda = () =>
              postJson(`/api/food-facts${mockFacts ? `?mock=${encodeURIComponent(mockFacts)}` : ""}`, { canonicalName: lookupName })
                .then((j: { facts?: FoodFacts | null; uncertain?: boolean }) => {
                  if (!live()) return; // retired — neither state nor log (finding #6)
                  const facts = j?.facts ?? null;
                  const uncertain = !facts && j?.uncertain === true;
                  const status = facts ? "found" : uncertain ? "uncertain" : "miss";
                  if (packaged) via.push(`usda:${status}`);
                  logFacts({ canonicalName: lookupName, status, facts, ...chain });
                  if (facts) {
                    setMealFacts((prev) => ({ ...prev, [lookupName]: facts }));
                    setAssetMeal((prev) => (prev[asset.id] ? { ...prev, [asset.id]: applyAssetFacts(prev[asset.id], facts) } : prev));
                  } else if (uncertain) setMealFacts((prev) => ({ ...prev, [lookupName]: "uncertain" }));
                  else setMealFacts((prev) => ({ ...prev, [lookupName]: null })); // a settled miss — the Meal card says so quietly
                })
                .catch(() => {
                  // Quiet by design — a facts failure must never break the Meal (B12).
                  if (!live()) return;
                  if (packaged) via.push("usda:failed");
                  logFacts({ canonicalName: lookupName, status: "failed", facts: null, ...chain });
                  setMealFacts((prev) => ({ ...prev, [lookupName]: null }));
                });
            if (!packaged) {
              usda();
              continue;
            }
            postJson(`/api/food-facts-packaged${mockPackaged ? `?mock=${encodeURIComponent(mockPackaged)}` : ""}`, { canonicalName: lookupName, brand: food.brand })
              .then((j: { facts?: FoodFacts | null }) => {
                if (!live()) return;
                const facts = j?.facts && j.facts.source === "openfoodfacts" ? j.facts : null; // provenance comes from the route, never assumed
                if (!facts) {
                  via.push("openfoodfacts:miss");
                  return usda();
                }
                via.push("openfoodfacts:found");
                logFacts({ canonicalName: lookupName, status: "found", facts, via });
                setMealFacts((prev) => ({ ...prev, [lookupName]: facts }));
                setAssetMeal((prev) => (prev[asset.id] ? { ...prev, [asset.id]: applyAssetFacts(prev[asset.id], facts) } : prev));
              })
              .catch(() => {
                // OFF failing is silent and non-blocking: the chain simply continues to USDA.
                if (!live()) return;
                via.push("openfoodfacts:failed");
                return usda();
              });
          }
        }
      });
    }
  }, [editing, resolved, assistOn, draftMedia, directEntry]);
  useEffect(
    () => () => {
      for (const run of assetRunsRef.current.values()) run.controller.abort();
    },
    [],
  );

  /*
   * V3 — ACTIVITY, stage 2 of CATEGORY-FIRST. Stage 1 is the existing category intelligence (the Meal analysis, extended with an
   * Activity category call for a photo that is not food); this stage — the Activity-specific reading — starts ONLY once Activity is
   * the selected category (auto-selected at HIGH, accepted at MEDIUM, or chosen by the person). It never selects anything itself, so
   * a late result can never reselect Activity after the person moved on. Each attached asset is read ONCE per lifecycle; a removed
   * asset's run is retired on its own. VIDEO is eligible here (keyframes, client-side) — only because Activity is already selected.
   * `!assistOn` returns before `analyzeActivityMedia` is referenced: AI OFF = zero requests.
   */
  useEffect(() => {
    const retireAll = () => {
      for (const run of actRunsRef.current.values()) run.controller.abort();
      actRunsRef.current.clear();
      actAppliedRef.current.clear();
      setActPending((prev) => (prev.length ? [] : prev)); // no-op when already empty — never a render loop
    };
    if (editing || !assistOn) {
      if (!assistOn) retireAll();
      return;
    }
    const attached = new Set(draftMedia.map((m) => m.id));
    const removed: string[] = [];
    for (const [id, run] of actRunsRef.current) {
      if (!attached.has(id)) {
        run.controller.abort();
        actRunsRef.current.delete(id);
        removed.push(id);
      }
    }
    for (const id of [...actAppliedRef.current]) if (!attached.has(id) && !removed.includes(id)) removed.push(id);
    if (removed.length) {
      // a removed asset takes back what ITS reading wrote (and the person never touched); the others re-apply on top
      for (const id of [...actAppliedRef.current]) actAppliedRef.current.delete(id);
      const pruneActivity = () => {
        setActPending((prev) => prev.filter((id) => attached.has(id)));
        setActObs((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => attached.has(id))));
        setD((x) => {
          let a = x.domains.activity;
          for (const id of removed) a = revokeActivityAsset(a, id);
          return a === x.domains.activity ? x : { ...x, domains: { ...x.domains, activity: a } };
        });
      };
      pruneActivity();
    }
    if (draftMedia.length === 0 || resolved !== "activity") return;
    const w = window as unknown as { __SB_ACTIVITY_ANALYSIS_LOG?: Array<{ key: string; status: string; observation: unknown }> };
    const log = (entry: { key: string; status: string; observation: unknown }) => {
      if (!w.__SB_ACTIVITY_ANALYSIS_LOG) w.__SB_ACTIVITY_ANALYSIS_LOG = [];
      w.__SB_ACTIVITY_ANALYSIS_LOG.push(entry);
    };
    for (const asset of draftMedia) {
      if (asset.processing || asset.error) continue; // HEIC prototype — no pixels yet (or none possible)
      if (actRunsRef.current.has(asset.id)) continue; // one reading per unchanged asset lifecycle
      const controller = new AbortController();
      const gen = ++actGenRef.current;
      actRunsRef.current.set(asset.id, { controller, gen });
      const live = () => actRunsRef.current.get(asset.id)?.gen === gen;
      setPendingActivity(asset.id, true);
      log({ key: asset.id, status: "start", observation: undefined });
      analyzeActivityMedia(asset.videoDuration ? { videoUrl: asset.src, signal: controller.signal } : { photoUrls: [asset.src], signal: controller.signal }).then((observation) => {
        log({ key: asset.id, status: observation !== null ? "done" : "failed", observation });
        if (!live()) return; // removed, or retired by Smart Assist OFF — a late result never applies
        setPendingActivity(asset.id, false);
        setActObs((prev) => ({ ...prev, [asset.id]: observation }));
      });
    }
  }, [editing, resolved, assistOn, draftMedia]);
  useEffect(
    () => () => {
      for (const run of actRunsRef.current.values()) run.controller.abort();
    },
    [],
  );
  useEffect(() => {
    (window as unknown as { __SB_ACTIVITY_ASSET_OBS?: unknown }).__SB_ACTIVITY_ASSET_OBS = actObs;
  }, [actObs]);
  // test/diagnostic seam (same spirit as the Meal globals): the Activity field cells of the live draft
  useEffect(() => {
    (window as unknown as { __SB_ACTIVITY_CELLS?: unknown }).__SB_ACTIVITY_CELLS = d.domains.activity.field;
  }, [d.domains.activity.field]);
  // SOCIAL-4 — the words settle 900 ms after typing stops (so a text-only reading is asked once per settled text, never per keystroke)
  useEffect(() => {
    const t = window.setTimeout(() => setTextStable(d.text.trim()), 900);
    return () => window.clearTimeout(t);
  }, [d.text]);
  /*
   * SOCIAL-4 — SPECIALIST READINGS, category-gated. Only an asset whose EFFECTIVE kind is Project · Problem · Meeting · Health is read,
   * and only for THAT kind (the composition's authoritative choice: the person's, or the grouping's); a photo is read once per
   * (kind, asset) and cached — re-selecting, switching kinds and back, opening More, Looks right, edits, Keep draft and Post never
   * re-ask. With no media the words are read once per settled text. `!assistOn` returns before the helper is referenced: AI OFF = 0.
   */
  useEffect(() => {
    const retireAll = () => {
      for (const run of recRunsRef.current.values()) run.controller.abort();
      recRunsRef.current.clear();
      recAppliedRef.current.clear();
      setRecPending((prev) => (prev.length ? [] : prev));
    };
    if (editing || !assistOn) {
      if (!assistOn) retireAll();
      return;
    }
    const attached = new Set(draftMedia.map((m) => m.id));
    for (const [key, run] of recRunsRef.current) {
      const id = key.slice(key.indexOf(":") + 1);
      if (!id.startsWith("text:") && !attached.has(id)) {
        run.controller.abort();
        recRunsRef.current.delete(key);
      }
    }
    const kindOf = new Map(recKindMap.split("|").filter(Boolean).map((e) => e.split("=") as [string, string]));
    const targets: { key: string; kind: RecordKindAI; asset?: (typeof draftMedia)[number] }[] = [];
    if (draftMedia.length) {
      for (const m of draftMedia) {
        if (m.processing || m.error) continue;
        const k = kindOf.get(m.id);
        if (!isRecKind(k)) continue;
        if (m.videoDuration && resolved !== k) continue; // keyframes only for the post's own kind (heavier work)
        targets.push({ key: `${k}:${m.id}`, kind: k, asset: m });
      }
    } else if (isRecKind(resolved) && textStable.length >= 3) {
      targets.push({ key: `${resolved}:text:${hashText(textStable)}`, kind: resolved });
    }
    const w = window as unknown as { __SB_RECORD_ANALYSIS_LOG?: Array<{ key: string; status: string; observation: unknown }> };
    const log = (entry: { key: string; status: string; observation: unknown }) => {
      if (!w.__SB_RECORD_ANALYSIS_LOG) w.__SB_RECORD_ANALYSIS_LOG = [];
      w.__SB_RECORD_ANALYSIS_LOG.push(entry);
    };
    for (const tg of targets) {
      if (recRunsRef.current.has(tg.key) || Object.prototype.hasOwnProperty.call(recObs, tg.key)) continue; // once per (kind, asset|text)
      const controller = new AbortController();
      const gen = ++recGenRef.current;
      recRunsRef.current.set(tg.key, { controller, gen });
      const live = () => recRunsRef.current.get(tg.key)?.gen === gen;
      setRecPending((prev) => (prev.includes(tg.key) ? prev : [...prev, tg.key]));
      setRecSince((prev) => ({ ...prev, [tg.key]: Date.now() }));
      log({ key: tg.key, status: "start", observation: undefined });
      const a = tg.asset;
      analyzeRecordMedia({ category: tg.kind, ...(a ? (a.videoDuration ? { videoUrl: a.src } : { photoUrls: [a.src] }) : {}), text: dRef.current.text, signal: controller.signal }).then((observation) => {
        log({ key: tg.key, status: observation !== null ? "done" : "failed", observation });
        if (!live()) return; // removed, retired, or a stale generation — a late result never applies
        setRecPending((prev) => prev.filter((k) => k !== tg.key));
        setRecObs((prev) => ({ ...prev, [tg.key]: observation }));
      });
    }
  }, [editing, resolved, assistOn, draftMedia, textStable, recKindMap, recObs]);
  useEffect(
    () => () => {
      for (const run of recRunsRef.current.values()) run.controller.abort();
    },
    [],
  );
  useEffect(() => {
    (window as unknown as { __SB_RECORD_OBS?: unknown }).__SB_RECORD_OBS = recObs;
  }, [recObs]);
  useEffect(() => {
    (window as unknown as { __SB_RECORD_DOMAINS?: unknown }).__SB_RECORD_DOMAINS = { project: d.domains.project, problem: d.domains.problem, meeting: d.domains.meeting, health: d.domains.health };
  }, [d.domains.project, d.domains.problem, d.domains.meeting, d.domains.health]);
  // SOCIAL-4 — the reading that belongs to the CURRENT context (the selected asset's, or the words') fills ITS kind's fields through the
  // V2 contract — HIGH/MEDIUM into untouched empty fields only; never over an edit, a confirmation or a clear; a reading cached under
  // another kind or another asset never touches the active form. Idempotent, so re-selection costs nothing.
  // V3 GROUP INTELLIGENCE: every asset that belongs with the selected one (its group — or the whole composition when it is
  // one kind) contributes its own reading, in asset order, into fields still empty; a reading is applied once per key, and a
  // reading cached under another kind or another group never touches the active form.
  const recGroupKeys = recKind && draftMedia.length ? (mixedContext && selId ? (groupOf(selId)?.mediaIds ?? [selId]) : draftMedia.map((m) => m.id)).map((id) => `${recKind}:${id}`).join("|") : recKey ?? "";
  useEffect(() => {
    if (!recKind || !recKey || editing) return;
    const keys = recGroupKeys.split("|").filter(Boolean);
    const pending = keys.filter((k) => { const o = recObs[k]; return !!o && o.status === "complete" && !recAppliedRef.current.has(k); });
    if (!pending.length) return;
    for (const k of pending) recAppliedRef.current.add(k);
    setD((x) => {
      let cur = x.domains[recKind] as RecordDomain;
      for (const k of pending) {
        const o = recObs[k]!;
        const id = k.slice(k.indexOf(":") + 1);
        cur = applyRecordObservation(recKind, cur, o, id.startsWith("text:") ? undefined : id);
      }
      if (cur === x.domains[recKind]) return x;
      const nd = recKind === "health" ? { ...(cur as typeof x.domains.health), healthType: asHealthType((cur as typeof x.domains.health).healthType) ?? (cur as typeof x.domains.health).healthType } : cur;
      return { ...x, domains: { ...x.domains, [recKind]: nd } };
    });
  }, [recKind, recKey, recGroupKeys, recObs, editing]);
  // V3 — Social Quick is prefilled from the reading ONLY once Activity is the selected category: the primary asset first, a later
  // asset only fills what is still empty. Every fill goes through the field contract (user edit / clear / confirm is never replaced).
  useEffect(() => {
    if (resolved !== "activity" || editing || !assistOn) return;
    const primaryId = draftMedia.find((m) => actObs[m.id]?.isActivity)?.id;
    const todo = draftMedia.filter((m) => actObs[m.id]?.isActivity && !actAppliedRef.current.has(m.id)).sort((a, b) => (a.id === primaryId ? -1 : b.id === primaryId ? 1 : 0));
    if (!todo.length) return;
    for (const m of todo) actAppliedRef.current.add(m.id);
    setD((x) => {
      let a = x.domains.activity;
      for (const m of todo) a = applyActivityObservation(a, actObs[m.id] as ActivityAIObservation, m.id === primaryId, m.id);
      return a === x.domains.activity ? x : { ...x, domains: { ...x.domains, activity: a } };
    });
  }, [resolved, editing, assistOn, draftMedia, actObs]);

  /*
   * MEAL CAPTURE EXTENSION — the Meal's canonical observation is the PRIMARY asset's: the first
   * attached asset (attach order) whose reading is food, else the first reading at all. The
   * per-asset map is the source of truth; this only chooses which one the ONE Meal record carries
   * (`mealAIObservation`) and which one Looks right / Adjust / zero-effort act on. It never replaces
   * an observation the person has already started acting on, unless that asset itself was removed.
   */
  const primaryAssetRef = useRef<string | null>(null);
  useEffect(() => {
    if (editing) return;
    let pick: { id: string; obs: MealAIObservation } | null = null;
    for (const m of draftMedia) {
      const o = assetObs[m.id];
      if (!o) continue;
      if (o.isFood === true) {
        pick = { id: m.id, obs: o };
        break;
      }
      if (!pick) pick = { id: m.id, obs: o };
    }
    const cur = dRef.current.domains.meal;
    const curId = primaryAssetRef.current;
    const curStillAttached = !!curId && draftMedia.some((m) => m.id === curId);
    // "acted" = the person has made the Meal theirs (typed their own name, or confirmed/corrected an item).
    // What the autofill itself put there (a SUGGESTED identity item carrying its own name) does not count.
    // "acted" = the person has made this photo's form theirs (any field edited, cleared or confirmed), or added their own foods.
    const curCells = curId ? assetMealRef.current[curId] : undefined;
    const acted = (curCells ? Object.values(curCells).some((c) => typeof c === "object" && c !== null && "state" in c && (c as { state: string }).state !== "default") : false) || (cur.foodItems ?? []).length > 0;
    if (cur.aiObservation && curStillAttached && (acted || pick?.id === curId)) return; // keep what the person is working with
    if ((pick?.obs ?? undefined) === (cur.aiObservation ?? undefined)) {
      primaryAssetRef.current = pick?.id ?? null;
      return;
    }
    primaryAssetRef.current = pick?.id ?? null;
    // The Meal record's own observation follows the primary photo. NOTHING else is filled here: visible components are what a
    // photo SHOWS ("Made of", per photo) — they are never recipe ingredients, so the Ingredients field is left to the person
    // (or a trusted label/recipe source).
    const patch = { aiObservation: pick ? pick.obs : undefined };
    setD((x) => ({ ...x, domains: { ...x.domains, meal: { ...x.domains.meal, ...patch } } }));
  }, [assetObs, draftMedia, editing]);
  // test/diagnostic seam (same spirit as `__SB_MEAL_ANALYSIS_LOG`): the per-asset observations, by asset id
  useEffect(() => {
    (window as unknown as { __SB_MEAL_ASSET_OBS?: unknown }).__SB_MEAL_ASSET_OBS = assetObs;
    assetObsRef.current = assetObs;
  }, [assetObs]);
  useEffect(() => {
    autoRef.current = { meal: mealAutoSelected, act: actAutoSelected };
    autoVisionRef.current = autoByVision;
  }, [mealAutoSelected, actAutoSelected, autoByVision]);

  /* ---- intent selection (§7/§26 — switching never loses common or per-domain work) ---- */
  const chooseIntent = (k: RecordIntent) => {
    setD((x) => ({ ...x, intent: k, intentSource: "user" }));
    setMealAutoSelected(false); // PHASE C — an explicit choice is never "auto-selected"; the undo gesture dies here
    setActAutoSelected(false);
    setAutoByVision(null); // UHI-DEC-017 — human correction always wins: SYSTEMBOOM's own choice is over
    autoVisionRef.current = null;
    setMoreOpen(false);
    setSugg(null);
  };
  const applySuggestion = (s: AssistSuggestion) => {
    setMealAutoSelected(false); // PHASE C — accepting a text suggestion is a deliberate act, never the auto-selection's undo target
    setActAutoSelected(false);
    setD((x) => {
      let next: UDraft = { ...x, intent: s.kind ?? x.intent, intentSource: "ai" };
      // V3 — the person's OWN words: the reading keeps `user_text` provenance and never replaces a value they already own.
      if (s.kind === "activity") next = { ...next, domains: { ...next.domains, activity: applyTextReading(next.domains.activity, { type: s.activityType, distance: s.distance, duration: s.duration }) } };
      if (s.kind === "meal" && s.occasion) next = { ...next, domains: { ...next.domains, meal: { ...next.domains.meal, occasion: s.occasion } } };
      // UC-C4.1 §5/§6 — accepting "Use details" IS the person's deliberate confirmation.
      // UC-C4.2 §12 — provenance consistency only: the words were the person's own, Smart
      // Assist only read them, so the canonical record place is tagged 'ai' (the schema's
      // reserved value for exactly this), never silently folded into 'user'.
      if (s.place && !next.place) next = { ...next, place: s.place, placeSource: "ai", recordPlace: { value: s.place, source: "ai" } };
      if (s.people.length) next = { ...next, people: [...new Set([...next.people, ...s.people])] };
      if (s.when === "yesterday" && !next.eventTime && !next.timeUnknown) {
        const y = new Date(now());
        y.setDate(y.getDate() - 1);
        next = { ...next, eventTime: { date: localISO(y).slice(0, 10), precision: "day", provenance: "ai" } };
      }
      return next;
    });
    setSugg(null);
  };

  /* ---- §27/§30 drafts + the one submission ---- */
  const meaningful = d.text.trim().length > 0 || anyMedia || d.people.length > 0 || !!d.place || d.intentSource !== "default";
  const editChanged = editing && JSON.stringify(d) !== JSON.stringify(initial);
  const requestClose = () => {
    if (phase === "posting") cancelPosting();
    // §55 — untouched closes immediately; a meaningful draft gets the small recovery ask.
    if (editing ? editChanged : meaningful) setPhase("discard");
    else onClose();
  };
  const submit = () => {
    if (phase === "posting") return; // §30 lock — one POST
    if (!canPost) {
      // §44 — explain and focus, never a mystery-disabled button.
      setIssue(minKey ?? (mixedBlock ? "ucomposer.mixedHint" : over ? "ucomposer.tooLong" : beforeBirth ? "composer.beforeLife" : evProblem === "future" ? "composer.futureDate" : null));
      textRef.current?.focus();
      return;
    }
    setIssue(null);
    setSheet(null);
    setAudienceOpen(false);
    setPhase("posting");
    postBtn.current?.focus({ preventScroll: true });
    cancelPosting();
    postTimer.current = window.setTimeout(() => {
      postTimer.current = null;
      if (state.simulateFailure && !editing) {
        setPhase("failed");
        requestAnimationFrame(() => retryBtn.current?.focus());
        return;
      }
      // UC-C4.2 §5/§18 — no confirmation gate: `d.place` already carries whatever the person
      // is currently shown (typed, picked, or the metadata default), and travels exactly as-is.
      // MEAL CAPTURE UX — zero-effort default / correction of the offered Meal identity, applied at POST.
      // MEAL AUTOFILL — the nutrition recorded is the card's own best source at POST: the structured fact
      // (USDA / Open Food Facts) if one was found, else the labelled AI estimate. A Meal being edited keeps its own.
      let ready = d;
      let mealAssets: MealAssetState[] | undefined;
      if (resolved === "meal") {
        if (assetBound && draftMedia.length > 0) {
          // MEAL V1 — ONE Meal record: the primary photo's effective values are the record's own Meal fields, and EVERY photo's
          // complete state (with its original observation) rides along. States are never invented: an untouched default is saved
          // as a suggested default, never as confirmed.
          const states = draftMedia.map((m) => {
            const st = assetMeal[m.id] ?? (m.id === selId && selCells ? selCells : seedAssetMeal(m.id, d.domains.meal));
            return st.observation === undefined && assetObs[m.id] !== undefined ? { ...st, observation: assetObs[m.id] } : st;
          });
          const synth = synthesizeMeal(d, states, primaryAssetRef.current ?? draftMedia[0].id);
          ready = synth.draft;
          mealAssets = synth.assets;
        } else {
          ready = finalizeMealIdentity(d);
          if (!editing) {
            const nutrition = mealNutritionOf(ready.domains.meal.aiObservation, mealFacts);
            ready = { ...ready, domains: { ...ready.domains, meal: { ...ready.domains.meal, nutrition } } };
          }
        }
      }
      const action = buildSubmission(ready, original, linkTitle, me.id, newId);
      if (resolved === "activity") {
        // V3 — the original AI reading of the PRIMARY asset rides on the record (record-only, immutable once written); an edit keeps
        // the record's own and never regenerates it. Provenance is rebuilt from the cells, or kept from the record on an edit.
        const primaryId = draftMedia.find((m) => actObs[m.id]?.isActivity)?.id;
        const observation = editing ? original?.fields?.activityAIObservation : primaryId ? (actObs[primaryId] ?? undefined) : undefined;
        const prov = activityProvenance(ready.domains.activity) ?? (editing ? original?.fields?.activityProvenance : undefined);
        const extra = { ...(observation ? { activityAIObservation: observation } : {}), ...(prov ? { activityProvenance: prov } : {}) };
        if (Object.keys(extra).length) {
          if (action.type === "post") action.moment.fields = { ...action.moment.fields, ...extra };
          else action.patch.fields = { ...(action.patch.fields ?? original?.fields), ...extra };
        }
      }
      // V0.4 P1 — the primary asset's neutral visual observation travels at record depth (never rendered, never a claim)
      {
        const primaryVision = draftMedia.map((m) => assetObs[m.id]?.vision).find((v) => !!v) ?? (editing ? original?.fields?.visualObservation : undefined);
        if (primaryVision) {
          if (action.type === "post") action.moment.fields = { ...action.moment.fields, visualObservation: primaryVision };
          else action.patch.fields = { ...(action.patch.fields ?? original?.fields), visualObservation: primaryVision }; // an edit keeps the owner's private observation
        }
      }
      if (isRecKind(resolved) && !editing) {
        // SOCIAL-4 — the reading the record was made with (selected asset's, or the words'), record-only and immutable; Health keeps it
        // on the private record exactly like every other Health depth (never the Social projection)
        const o = recKey ? recObs[recKey] : undefined;
        if (o && o.status === "complete") {
          if (action.type === "post") action.moment.fields = { ...action.moment.fields, recordAIObservation: o };
          else action.patch.fields = { ...(action.patch.fields ?? original?.fields), recordAIObservation: o };
        }
      }
      if (resolved === "moment" && groupView.groups.length > 1 && !editing) {
        // MIXED-MEDIA PROTOTYPE — ONE generic post carrying every photo; each photo's own category + readings travel record-only
        // (nothing is rendered beyond a count line, no Meal/Activity field is copied, no canonical Meal/Activity record is claimed)
        const mixedAssets = draftMedia.map((m) => {
          const mo = assetObs[m.id];
          const ao = actObs[m.id];
          const gc = groupOf(m.id)?.category;
          const category = gc && gc !== "review" ? gc : ("moment" as const);
          const ro = isRecKind(gc) && gc !== "health" ? recObs[`${gc}:${m.id}`] : undefined; // a Health reading never leaves the private record
          return { assetId: m.id, category, ...(mo ? { mealAIObservation: mo } : {}), ...(ao ? { activityAIObservation: ao } : {}), ...(ro ? { recordAIObservation: ro } : {}) };
        });
        if (action.type === "post") action.moment.fields = { ...action.moment.fields, mixedAssets };
      }
      if (mealAssets) {
        if (action.type === "post") action.moment.fields = { ...action.moment.fields, mealAssets };
        else action.patch.fields = { ...(action.patch.fields ?? original?.fields), mealAssets };
      }
      dispatch(action.type === "post" ? { type: "post", moment: action.moment } : { type: "edit", id: action.id, patch: action.patch });
      if (!editing) dispatch({ type: "udraft", draft: null });
      setPhase("idle");
      onClose();
    }, 900);
  };

  const kindName = (k: RecordIntent) => (k === "social" ? t("ucomposer.justPost") : t(KIND_LABEL_KEY[k as keyof typeof KIND_LABEL_KEY]));
  const audienceName = (a: Privacy) => (a === "public" ? t("privacy.public") : a === "friends" ? t("privacy.friends") : t("privacy.onlyMe"));
  // §7 — the smart pill's subtype word, when the record already knows one.
  const pillSub =
    contextIntent === "meal" && viewDraft.domains.meal.occasion
      ? viewDraft.domains.meal.occasion === "other" && viewDraft.domains.meal.occasionCustom ? viewDraft.domains.meal.occasionCustom : t(occasionKey(viewDraft.domains.meal.occasion))
      : contextIntent === "activity" && d.domains.activity.type
        ? t(activityKey(d.domains.activity.type))
        : contextIntent === "health" && d.domains.health.healthType
          ? t(healthTypeKey(d.domains.health.healthType))
          : null;

  const resolveLink = (url: string) => {
    setD((x) => ({ ...x, link: url || undefined }));
    if (!url) return setLinkState("none");
    try {
      new URL(url);
    } catch {
      return setLinkState("plain");
    }
    setLinkState("resolving");
    window.setTimeout(() => setLinkState(url.includes("example.org") ? "preview" : "plain"), 700);
  };

  /* ---- §54 — the count appears only when it matters ---- */
  const nearLimit = d.text.length >= TEXT_LIMIT - 200;

  // Zero-effort capture (§1: trusted existing Human Record) — computed once per session
  // from the viewer's own visible history; empty until they have posted with these
  // fields, so a fresh viewer sees exactly today's static defaults.
  const ownRecentPlaces = useMemo(() => recentPlaces(state.moments, me.id), [state.moments, me.id]);
  const activityCommon = useMemo(() => {
    const own = commonActivityTypes(state.moments, me.id);
    return own.length ? own : ACTIVITY_COMMON;
  }, [state.moments, me.id]);

  const collageShown = draftMedia.slice(0, 4);
  const collageExtra = draftMedia.length - collageShown.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="ucomposer" className="fixed inset-y-0 left-1/2 z-[60] -translate-x-1/2" style={{ width: "var(--frame-w, 100vw)", maxWidth: "100vw" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" tabIndex={-1} aria-label={t("composer.close")} onClick={requestClose} className="absolute inset-0 cursor-default bg-[rgba(10,14,22,0.42)]" />
          <motion.div
            ref={container}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sb-ucomposer-title"
            data-sb-composer
            data-sb-ucomposer
            data-sb-composer-phase={phase}
            className="sb-composer-shell absolute flex flex-col overflow-hidden bg-[var(--sheet-solid)] text-text shadow-[0_24px_64px_-24px_rgba(0,0,0,.5)]"
            initial={{ y: 22 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.26, ease: easeOut }}
          >
            {/* HEADER (§5/§55) — one exit: X. Never "New moment"; never a Life age. */}
            <header className="flex items-center gap-2 border-b border-[var(--hair)] px-3 py-2.5 @2xl:px-5">
              <button type="button" onClick={requestClose} aria-label={t("composer.close")} className="sb-press inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
                <X size={16} />
              </button>
              <h2 id="sb-ucomposer-title" className="text-[15px] font-semibold">{editing ? t("ucomposer.editPost") : t("ucomposer.createPost")}</h2>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 @2xl:px-5" inert={phase === "posting"}>
              {/* IDENTITY + AUDIENCE (§4) */}
              <div className="flex items-center gap-2.5">
                <PersonIdentity viewer={me} subject={me} size={36} label="" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-text">{me.name}</p>
                  <span className="relative inline-block">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={audienceOpen}
                      aria-label={t("ucomposer.audience")}
                      disabled={phase === "posting"}
                      onClick={() => setAudienceOpen((v) => !v)}
                      className="sb-press -ml-1 inline-flex min-h-7 items-center gap-1 rounded-full px-1.5 text-[12px] text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]"
                      data-sb-audience
                    >
                      {audienceName(d.audience)} <ChevronDown size={12} aria-hidden />
                    </button>
                    {audienceOpen && (
                      <ul role="listbox" aria-label={t("composer.whoCanSeeThis")} className="sb-surface-in absolute left-0 z-10 mt-1 w-56 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1 text-[13px] shadow-[0_12px_32px_-16px_rgba(0,0,0,.45)]">
                        {(["public", "friends", "onlyme"] as Privacy[]).map((a) => (
                          <li key={a}>
                            <button type="button" role="option" aria-selected={d.audience === a} onClick={() => { setD((x) => ({ ...x, audience: a })); setAudienceOpen(false); }} className={`w-full rounded-[10px] px-3 py-1.5 text-left hover:bg-steel/12 focus-visible:outline-[var(--focus)] ${d.audience === a ? "font-medium text-text" : "text-muted"}`}>
                              {audienceName(a)}
                              <span className="block text-[11px] text-muted">{a === "public" ? t("composer.privacyAnyone") : a === "friends" ? t("composer.privacyYourPeople") : t("composer.privacyJustYou")}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </div>
              </div>

              {/* PRIMARY COMPOSITION (§4) — compact, grows with the words; the question adapts */}
              <label htmlFor="sb-composer-text" className="sr-only">{t(PLACEHOLDER_KEY[resolved])}</label>
              <textarea
                id="sb-composer-text"
                ref={textRef}
                value={d.text}
                onChange={(e) => {
                  setD((x) => ({ ...x, text: e.target.value }));
                  setIssue(null);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.38))}px`;
                }}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
                placeholder={t(PLACEHOLDER_KEY[resolved])}
                rows={2}
                className="mt-3 min-h-[60px] w-full resize-none border-b border-[var(--hair)] bg-transparent pb-2 text-[17px] leading-[1.5] text-text outline-none placeholder:text-muted focus:border-[var(--focus)] @2xl:min-h-[68px] @2xl:text-[18px]"
              />

              {/* MEDIA (§15) — 1 strong preview · 2–4 collage · 5+ compact collage + "+N" */}
              {draftMedia.length > 0 && (
                <div className="mt-2" data-sb-media-collage={draftMedia.length}>
                  {/* the collage CONTAINER owns the geometry (one bounded frame per count — never the images' own heights):
                      1 → one 4:3 preview · 2 → two equal columns (2:1) · 3 → one large + two stacked (3:2) · 4+ → a 2×2 frame (4:3),
                      the fourth tile carrying the translucent "+N more" overlay as a sibling INSIDE its cell, never a fifth cell */}
                  <div className={`grid gap-[3px] overflow-hidden rounded-[12px] bg-[var(--hair)] ${draftMedia.length === 1 ? "grid-cols-1 aspect-[4/3]" : draftMedia.length === 2 ? "grid-cols-2 aspect-[2/1]" : draftMedia.length === 3 ? "grid-cols-[3fr_2fr] grid-rows-2 aspect-[3/2]" : "grid-cols-2 grid-rows-2 aspect-[4/3]"}`} data-sb-collage-grid={Math.min(draftMedia.length, 5)}>
                    {collageShown.map((p, i) => {
                      const tile = (
                      <span key={p.id + i} className={`relative block h-full w-full min-h-0 overflow-hidden bg-[var(--sheet-raised)] ${draftMedia.length === 3 && i === 0 ? "row-span-2" : ""} ${mealSelectable ? `cursor-pointer focus-visible:outline-[var(--focus)] ${selId === p.id ? "outline outline-2 -outline-offset-2 outline-[var(--focus)]" : ""}` : ""}`} style={draftMedia.length === 1 ? { aspectRatio: `${p.w} / ${p.h}` } : undefined} data-sb-thumb={p.id}
                        data-sb-asset-state={photoPhase(p.id)}
                        aria-busy={photoPhase(p.id) === "analyzing" || photoPhase(p.id) === "resolving" ? true : undefined}
                        {...(mealSelectable
                          ? {
                              role: "button",
                              tabIndex: 0,
                              "aria-pressed": selId === p.id,
                              "aria-label": `${p.alt}`,
                              "data-sb-thumb-selected": selId === p.id ? "true" : undefined,
                              onClick: () => setSelectedAssetId(p.id),
                              onKeyDown: (e: React.KeyboardEvent) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedAssetId(p.id);
                                }
                              },
                            }
                          : null)}>
                        {p.processing ? (
                          <span role="img" aria-label={t("ucomposer.processingPhoto")} className="flex h-full w-full items-center justify-center bg-[var(--sheet-raised)] px-1 text-center text-[10px] text-muted" data-sb-media-processing>
                            {t("ucomposer.processingPhoto")}
                            <span className="sb-intel" aria-hidden><span className="sb-intel-halo" /></span>
                          </span>
                        ) : p.error ? (
                          <span role="img" aria-label={p.alt} className="flex h-full w-full items-center justify-center bg-[var(--sheet-raised)] px-1 text-center text-[10px] text-muted" data-sb-media-error={p.error}>
                            {p.alt}
                          </span>
                        ) : (
                          <Thumb src={p.poster ?? p.src} alt={p.alt} className="h-full w-full object-cover" />
                        )}
                        {groupView.groups.length > 1 && groupOf(p.id) && (
                          <span className="absolute bottom-1.5 right-1.5 rounded-[4px] bg-[rgba(10,13,20,0.7)] px-1.5 py-0.5 text-[10px] font-semibold text-white" data-sb-asset-category={groupOf(p.id)!.category}>
                            {groupOf(p.id)!.category === "review" ? t("ucomposer.needsReview") : kindName(groupOf(p.id)!.category as RecordIntent)}
                          </span>
                        )}
                        {(photoPhase(p.id) === "analyzing" || photoPhase(p.id) === "resolving") && (
                          <>
                            <span className="sb-intel" data-sb-intel-pulse={photoPhase(p.id)} aria-hidden>
                              <span className="sb-intel-halo" />
                              <span className="sb-intel-ring" data-sb-intel-orbit>
                                <span className="sb-intel-arm" style={{ transform: "rotate(0deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                                <span className="sb-intel-arm" style={{ transform: "rotate(130deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                                <span className="sb-intel-arm" style={{ transform: "rotate(250deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                              </span>
                            </span>
                            <span className="sr-only" data-sb-intel-status>{photoPhase(p.id) === "analyzing" ? "Reading this photo" : "Checking nutrition"}</span>
                          </>
                        )}
                        {p.videoDuration && (
                          <>
                            <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[rgba(10,13,20,0.35)] text-white"><Play size={12} fill="currentColor" strokeWidth={0} className="ml-0.5" /></span>
                            </span>
                            <span className="absolute bottom-1.5 left-1.5 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">{p.videoDuration}</span>
                          </>
                        )}
                        {p.takenAt && <span aria-hidden title={t("composer.hasDateInFile")} className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--boom)]" />}
                      </span>
                      );
                      if (!(collageExtra > 0 && i === 3)) return tile;
                      // the fourth cell: photo 4 underneath, the "+N more" button as a translucent overlay in the SAME cell —
                      // a real control opening the one Media Organizer (Phase A); it never selects tile 4 and never adds a cell
                      return (
                        <span key={`${p.id}-overflow`} className="relative block h-full w-full min-h-0 overflow-hidden" data-sb-collage-overflow-cell>
                          {tile}
                          <button type="button" aria-label={t("ucomposer.showAllMedia", { n: draftMedia.length })} onClick={(e) => openOrganizer("all", e.currentTarget)} className="sb-press absolute inset-0 z-[1] flex items-center justify-center bg-[rgba(10,13,20,0.5)] text-[16px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] hover:bg-[rgba(10,13,20,0.58)] focus-visible:outline-[var(--focus)] focus-visible:-outline-offset-2" data-sb-media-more={collageExtra}>
                            {t("ucomposer.moreN", { n: collageExtra })}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 flex items-baseline gap-2 text-[12px] text-muted">
                    <span className="tabular-nums" data-sb-media-count>{draftMedia.length >= MEDIA_LIMIT ? t("ucomposer.nOfLimitMedia", { n: draftMedia.length, limit: MEDIA_LIMIT }) : t("ucomposer.nMedia", { n: draftMedia.length })}</span>
                    <button type="button" onClick={(e) => openOrganizer("all", e.currentTarget)} className="sb-press min-h-7 rounded-full px-1.5 font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-media-edit>
                      {t("ucomposer.editMedia")}
                    </button>
                  </p>
                  {/* the accepted single-video caption, in place */}
                  {singleVideo && (
                    <input value={d.videoCaption ?? ""} onChange={(e) => setD((x) => ({ ...x, videoCaption: e.target.value || undefined }))} placeholder={t("composer.caption")} aria-label={t("composer.caption")} className={`${FIELD} mt-2 w-full`} />
              )}
                  {draftMedia.filter((m) => m.error).map((m) => (
                    <p key={m.id} role="alert" className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted" {...(m.error === "video" ? { "data-sb-video-error": m.id } : { "data-sb-heic-error": m.id })}>
                      <span>{t(m.error === "video" ? "ucomposer.videoUnsupported" : "ucomposer.heicFailed")}</span>
                      <button type="button" onClick={() => toggleAsset(m.id)} className="sb-press min-h-7 rounded-full px-1.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-heic-remove={m.id}>
                        {t("composer.removePhoto", { n: draftMedia.findIndex((x) => x.id === m.id) + 1 })}
                      </button>
                    </p>
                  ))}
                </div>
              )}

              {/* attached link (kept when no visual media) */}
              {d.link && draftMedia.length === 0 && (
                <div className="mt-2 rounded-[12px] border border-[var(--hair)] px-3 py-2 text-[12px] text-muted" data-sb-link-attached>
                  <span className="flex items-center gap-1.5"><Link2 size={12} aria-hidden /> <span className="min-w-0 truncate text-text">{linkState === "preview" ? linkTitle : d.link}</span></span>
                </div>
              )}

              {/* Zero-effort capture — already applied; this states the source and offers
                  Not this, never a gate the person must clear before POST. */}
              {showMetaBanner && detected && (
                <div className="sb-reveal mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted" data-sb-metadata-review>
                  <span>
                    {t("ucomposer.fromPhoto")}: <span className="text-text tabular-nums">{sbDate(locale, detected.takenAt!)}</span>
                    {detected.takenPlace ? <> · <span className="text-text">{detected.takenPlace}</span></> : null}
                  </span>
                  <button type="button" onClick={useMetadata} className="sb-press min-h-8 rounded-full px-2 font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-meta-use>{t("ucomposer.use")}</button>
                  <button type="button" onClick={ignoreMetadata} className="sb-press min-h-8 rounded-full px-2 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-meta-ignore>{t("ucomposer.notThis")}</button>
                </div>
              )}

              {/* SMART ASSIST (§30/§38) — one quiet suggestion: Use details / Ignore */}
              {sugg && (
                <div className="sb-reveal mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" data-sb-suggestion={sugg.kind}>
                  <span className="text-muted">
                    <span aria-hidden>✦ </span>
                    {t("ucomposer.looksLike", { kind: sugg.kind === "activity" && sugg.activityType ? t(activityKey(sugg.activityType)) : kindName(sugg.kind!) })}
                    {(() => {
                      // the occasion enum needs a localized label; everything else in
                      // `parts` (distance/duration/a real place/a real first name) is
                      // already locale-neutral free text.
                      const displayParts = [sugg.occasion ? t(occasionKey(sugg.occasion)) : null, ...sugg.parts].filter((x): x is string => !!x);
                      return displayParts.length > 0 && <span className="text-text"> — {displayParts.join(" · ")}</span>;
                    })()}
                  </span>
                  <button type="button" onClick={() => applySuggestion(sugg)} className="sb-press min-h-8 rounded-full px-2 font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-suggest-accept>
                    {t("ucomposer.useDetails")}
                  </button>
                  <button type="button" onClick={() => { suggDismissed.current = true; setSugg(null); }} className="sb-press min-h-8 rounded-full px-2 text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-suggest-keep>
                    {t("ucomposer.ignore")}
                  </button>
                </div>
              )}

              {/* ACTION ROW (§5): Media · People · Place · Add details / the record pill (§7) */}
              <div role="group" aria-label={t("composer.contextActions")} className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 @max-2xl:[mask-image:linear-gradient(to_right,#000_86%,transparent)] @2xl:flex-wrap @2xl:gap-0.5 @2xl:overflow-visible" data-sb-composer-actions>
                <button type="button" aria-expanded={sheet === "media"} aria-label={t("ucomposer.actMedia")} title={t("ucomposer.actMedia")} onClick={(e) => openSheet("media", e.currentTarget)} className={`${CHIP} border border-[var(--hair)] text-text hover:border-steel/60`}>
                  <span aria-hidden className="inline-flex"><ImageIcon size={14} strokeWidth={1.75} /></span>
                  <span aria-hidden className={CHIP_WORD}>{t("ucomposer.actMedia")}{draftMedia.length > 0 ? ` · ${draftMedia.length}` : ""}</span>
                </button>
                <button type="button" aria-expanded={sheet === "people"} aria-label={t("ucomposer.actPeople")} title={t("ucomposer.actPeople")} onClick={(e) => openSheet("people", e.currentTarget)} className={`${CHIP} text-muted hover:bg-steel/10 hover:text-text`} data-sb-people-chip={d.people.length}>
                  <span aria-hidden className="inline-flex"><Users size={14} strokeWidth={1.75} /></span>
                  <span aria-hidden className={CHIP_WORD}>{t("ucomposer.actPeople")}{d.people.length > 0 ? ` · ${d.people.length}` : ""}</span>
                </button>
                <button type="button" aria-expanded={sheet === "place"} aria-label={t("ucomposer.actPlace")} title={t("ucomposer.actPlace")} onClick={(e) => openSheet("place", e.currentTarget)} className={`${CHIP} text-muted hover:bg-steel/10 hover:text-text`} data-sb-place-chip={d.place ? "" : undefined}>
                  <span aria-hidden className="inline-flex"><MapPin size={14} strokeWidth={1.75} /></span>
                  <span aria-hidden className={`${CHIP_WORD} max-w-28 truncate`}>{d.place ? d.place : t("ucomposer.actPlace")}</span>
                </button>
                {/* §7 — before a choice: Add details. After: the collapsed smart record pill. */}
                {resolved === "social" ? (
                  <button type="button" aria-expanded={sheet === "record"} aria-haspopup="dialog" aria-label={t("ucomposer.addDetails")} title={t("ucomposer.addDetails")} onClick={(e) => openSheet("record", e.currentTarget)} className={`${CHIP} text-muted hover:bg-steel/10 hover:text-text`} data-sb-record-details>
                    <span aria-hidden className="inline-flex"><Glyph d="M4 5.5h12M4 10h12M4 14.5h7" /></span>
                    <span aria-hidden className={CHIP_WORD}>{t("ucomposer.addDetails")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-expanded={sheet === "record"}
                    aria-haspopup="dialog"
                    onClick={(e) => {
                      // PHASE C §one-tap undo — ONE tap on an AI-AUTO-selected Meal reverts it
                      // to the normal media-default category: photo kept, observation kept, no
                      // chooser opened, no new analysis (the key dedup already saw this set),
                      // and no re-selection (application happens once per analysis result).
                      // An EXPLICITLY chosen Meal never takes this branch — its pill opens the
                      // chooser exactly as before (`mealAutoSelected` dies in chooseIntent).
                      if (resolved === "meal" && mealAutoSelected && !mixedContext) {
                        setMealAutoSelected(false);
                        setD((x) => ({ ...x, intent: "social", intentSource: "default" }));
                        return;
                      }
                      // V3 — the same one-tap undo for an AI-AUTO-selected Activity (an explicit choice never takes this branch).
                      if (resolved === "activity" && actAutoSelected && !mixedContext) {
                        setActAutoSelected(false);
                        setD((x) => ({ ...x, intent: "social", intentSource: "default" }));
                        return;
                      }
                      openSheet("record", e.currentTarget);
                    }}
                    className={`${CHIP} bg-[var(--boom-soft)] text-text`}
                    data-sb-record-details
                    data-sb-record-pill={contextIntent}
                    data-sb-intent-indicator={contextIntent}
                    data-sb-context-media={mixedContext && selId ? selId : undefined}
                  >
                    <span aria-hidden className="inline-flex">{KIND_GLYPH[contextIntent]}</span>
                    <span className={CHIP_WORD}>
                      {kindName(contextIntent)}
                      {pillSub ? ` · ${pillSub}` : ""}
                    </span>
                    <span aria-hidden className={`${CHIP_WORD} text-muted`} data-sb-intent-change>{t("ucomposer.change")}</span>
                  </button>
                )}
                {/* §27 — Smart Assist stays subtle: a small ✦, mostly working underneath */}
                <span className="relative ml-auto inline-block shrink-0">
                  <button type="button" aria-haspopup="menu" aria-expanded={assistMenu} aria-label={t("ucomposer.assist")} title={t("ucomposer.assist")} onClick={() => setAssistMenu((v) => !v)} className={`${CHIP} text-muted hover:bg-steel/10 hover:text-text`} data-sb-assist-button>
                    <Sparkles size={14} strokeWidth={1.75} aria-hidden />
                  </button>
                  {assistMenu && (
                    <div role="menu" aria-label={t("ucomposer.assist")} className="sb-surface-in absolute right-0 z-10 mt-1 w-60 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1 text-[13px] shadow-[0_12px_32px_-16px_rgba(0,0,0,.45)]" data-sb-assist-menu>
                      <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{t("ucomposer.assist")}</p>
                      <p className="px-3 pb-1 text-[11px] text-muted">{assistOn ? t("ucomposer.assistOnNote") : t("ucomposer.assistOffNote")}</p>
                      {assistOn && (
                        <button type="button" role="menuitem" onClick={() => { setAssistMenu(false); suggDismissed.current = false; setSugg(extractAssist(d.text, anyMedia, me.id)); }} className="w-full rounded-[10px] px-3 py-1.5 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)]" data-sb-assist-suggest>
                          {t("ucomposer.suggestNow")}
                        </button>
                      )}
                      <button type="button" role="menuitem" onClick={() => { const next = !assistOn; setSmartAssist(next); setAssistOn(next); if (!next) setSugg(null); }} className="w-full rounded-[10px] px-3 py-1.5 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)]" data-sb-assist-toggle>
                        {assistOn ? t("ucomposer.turnOff") : t("ucomposer.turnOn")}
                      </button>
                    </div>
                  )}
                </span>
              </div>

              {/* selected people, visible at a glance (§73 — selection survives navigation) */}
              {d.people.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1" data-sb-people-selected>
                  {d.people.map((id) => {
                    const p = personOf(id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full border border-[var(--hair)] py-0.5 pr-1 pl-2 text-[12px] text-text">
                        {p.name.split(" ")[0]}
                        <button type="button" aria-label={t("ucomposer.removePerson", { name: p.name })} onClick={() => setD((x) => ({ ...x, people: x.people.filter((q) => q !== id) }))} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* PHASE C — the medium-confidence ask lives OUTSIDE the Meal-only domain block:
                  it exists precisely while Meal is NOT selected. Yes IS an explicit selection. */}
              {mealCatAsk && <MealCategorySuggestion onYes={() => chooseIntent("meal")} onNo={() => setMealCatDismissed(true)} />}
              {visionCard && visionSuggestion && (
                <VisionSuggestionCard
                  seen={visionSeen}
                  sceneLabel={visionObs?.vision?.scene.label ?? ""}
                  confidence={visionSuggestion.primary.confidence}
                  primary={visionSuggestion.primary.kind}
                  primaryName={kindName(visionSuggestion.primary.kind)}
                  alternatives={visionSuggestion.alternatives.map((a) => ({ kind: a.kind, name: kindName(a.kind) }))}
                  noMatch={visionSuggestion.noMatch}
                  organized={visionOrganized}
                  onUse={() => { chooseIntent(visionSuggestion.primary.kind); setVisionDismissed(true); }}
                  onChoose={() => { chooserScope.current = "post"; openSheet("record"); }}
                  onSkip={() => setVisionDismissed(true)}
                />
              )}
              {(organisedCard || mixedBlock) && (
                <div role="group" aria-label={t("ucomposer.organisedTitle")} className="mt-2 grid gap-1.5 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-2 text-[13px] text-text" data-sb-mixed-records data-sb-organised-card>
                  <p className="text-[13px] font-semibold text-text" data-sb-mixed-title>{t("ucomposer.organisedTitle")}</p>
                  <p className="text-[12px] text-muted">{t("ucomposer.organisedFound", { n: new Set(groupView.groups.map((g) => g.category)).size })}</p>
                  <p className="grid gap-0.5 text-[12px] text-text" data-sb-mixed-summary>
                    {groupView.groups.map((g) => (
                      <span key={g.id} data-sb-organised-line={g.category}>{g.category === "review" ? t("ucomposer.needsReview") : kindName(g.category as RecordIntent)} · {g.mediaIds.length}</span>
                    ))}
                  </p>
                  <span className="inline-flex flex-wrap gap-1">
                    <button type="button" onClick={() => { setGrouping((st) => ({ ...st, organised: true })); chooseIntent("moment"); }} title={t("ucomposer.mixedKeepAllHint")} className="sb-press inline-flex min-h-9 items-center rounded-full bg-steel/10 px-3 text-[13px] font-medium text-text focus-visible:outline-[var(--focus)]" data-sb-mixed-use="moment" data-sb-keep-together>
                      {t("ucomposer.keepTogether")}
                    </button>
                    <button type="button" onClick={(e) => openOrganizer("group", e.currentTarget)} className="sb-press inline-flex min-h-9 items-center rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-review-group>
                      {t("ucomposer.reviewGroup")}
                    </button>
                  </span>
                </div>
              )}
              {organisedSummary && (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted" data-sb-organised-summary>
                  <span className="font-medium text-text">{t("ucomposer.yourPost")}</span>
                  {groupView.groups.map((g) => (
                    <span key={g.id} data-sb-organised-line={g.category}>{g.category === "review" ? t("ucomposer.needsReview") : kindName(g.category as RecordIntent)} · {g.mediaIds.length}</span>
                  ))}
                  <button type="button" onClick={(e) => openOrganizer("group", e.currentTarget)} className="sb-press min-h-7 rounded-full px-1.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-review-group>{t("ucomposer.review")}</button>
                </p>
              )}
              {actCatAsk && <ActivityCategorySuggestion onYes={() => chooseIntent("activity")} onNo={() => setActCatDismissed(true)} />}

              {/* DOMAIN QUICK — the same composer, adapted in place */}
              {contextIntent !== "social" && (
                <div key={contextIntent} className="sb-reveal mt-3" data-sb-kind-fields={contextIntent}>
                  <DomainQuick draft={viewDraft} set={viewSet} min={me.birthDate} onOpenSheet={(s) => openSheet(s)} activityCommon={activityCommon} />
                  {contextIntent === "activity" && !editing && selPhase === "analyzing" && (
                    <div className="mt-2">
                      <IntelWaiting key={selId ?? "photo"} subject="activity" since={selId ? actSince[selId] : undefined} />
                    </div>
                  )}
                  {contextIntent === "activity" && anyMedia && !editing && <ActivitySuggestion activity={d.domains.activity} onLookRight={() => setD((x) => ({ ...x, domains: { ...x.domains, activity: confirmActivity(x.domains.activity) } }))} onAdjust={adjustActivity} />}
                  {recKind && !editing && recKey && recPending.includes(recKey) && (
                    <div className="mt-2">
                      <IntelWaiting key={recKey} subject="record" label={t("ucomposer.understandingKind", { kind: kindName(recKind).toLowerCase() })} since={recSince[recKey]} />
                    </div>
                  )}
                  {recKind && !editing && <RecordSuggestion kind={recKind} domain={viewDraft.domains[recKind] as RecordDomain} observation={recSelectedObs} kindName={kindName(recKind)} hintName={recSelectedObs?.categoryHint && d.intentSource !== "user" ? kindName(recSelectedObs.categoryHint) : undefined} onLookRight={() => setD((x) => ({ ...x, domains: { ...x.domains, [recKind]: confirmRecordDomain(recKind, x.domains[recKind] as RecordDomain) } }))} onAdjust={() => { setMoreOpen(true); requestAnimationFrame(() => { const first = RECORD_SHOWN[recKind][0]; const hook = recKind === "project" && first === "title" ? "projectTitle" : recKind === "problem" && first === "description" ? "problemDescription" : recKind === "health" && first === "healthType" ? "healthDescription" : first; document.querySelector<HTMLInputElement>(`[data-sb-ufield='${hook}']`)?.focus(); }); }} />}
                  {recKind === "health" && assistOn && !editing && <p className="mt-1.5 text-[11px] text-muted" data-sb-health-ai-note>{t("ucomposer.healthAiNote")}</p>}
                  {mealAnalyzing && contextIntent !== "meal" && contextIntent !== "activity" && !recKind && !editing &&
                    (d.intentSource === "user" ? (
                      <p className="mt-2 text-[12px] text-muted" data-sb-photo-reading role="status">Looking at your photo…</p>
                    ) : (
                      selPhase === "analyzing" && (
                        <div className="mt-2">
                          <IntelWaiting key={selId ?? "photo"} since={selId ? assetSince[selId] : undefined} />
                        </div>
                      )
                    ))}
                  {contextIntent === "meal" && anyMedia && <MealSuggestion draft={{ ...d, intent: contextIntent }} set={setD} analyzing={mealAnalyzing} view={mealView} cells={selCells} onLookRight={lookRight} onAdjust={adjustMeal} openMore={() => setMoreOpen(true)} facts={mealFacts} since={selId ? assetSince[selId] : undefined} factsPending={selPhase === "resolving"} />}
                  {hasMore(contextIntent) && (
                    <div className={contextIntent === "moment" ? "" : "mt-2"}>
                      <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} className="sb-press -ml-2 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-more-toggle>
                        <span aria-hidden className={`sb-transition inline-block text-[10px] ${moreOpen ? "rotate-90" : ""}`}>›</span> {t(moreLabelKey(contextIntent))}
                      </button>
                      {moreOpen && (
                        <div className="sb-reveal mt-2" data-sb-more>
                          <DomainMore draft={viewDraft} set={viewSet} min={me.birthDate} assets={assetBound && selCells ? { cells: selCells, onEdit: editAssetText } : undefined} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* event-time truth lines (§21/A11) */}
              {evProblem === "future" && <p className="mt-1.5 text-[12px] text-[var(--danger)]">{t("composer.futureDate")}</p>}
              {beforeBirth && <p className="mt-1.5 text-[12px] text-[var(--danger)]" data-sb-before-life>{t("composer.beforeLife")}</p>}
              {backdated && <p className="mt-1.5 text-[12px] text-muted">{t("composer.backdatedNote")}</p>}

              {/* §48 — Health sharing awareness: audience vs the private record, stated once */}
              {contextIntent === "health" && (
                <p className="mt-3 rounded-[12px] border border-[var(--hair)] px-3 py-2 text-[12px] text-muted" data-sb-health-sharing>
                  <span className="font-medium text-text">{t("ucomposer.sharingWith", { audience: audienceName(d.audience) })}</span>{" "}
                  {t("ucomposer.healthShareNote")}
                </p>
              )}

              {/* §44 — a clear inline reason, never a mystery */}
              {issue && <p role="alert" className="mt-2 text-[12px] text-[var(--danger)]" data-sb-composer-issue>{t(issue, issue === "ucomposer.mediaLimit" ? { limit: MEDIA_LIMIT } : undefined)}</p>}
            </div>

            {/* FOOTER (§55) — POST, stable and reachable; safe-area on phones (S7) */}
            <footer className="border-t border-[var(--hair)] px-4 py-3 pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] @2xl:px-5 @2xl:pb-3">
              {phase === "discard" ? (
                editing ? (
                  <div className="flex flex-wrap items-center justify-between gap-2" data-sb-discard-edit>
                    <p className="text-[13px] text-text">{t("composer.discardChangesQ")}</p>
                    <span className="flex gap-2">
                      <button type="button" onClick={onClose} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("composer.discardChanges")}</button>
                      <button type="button" autoFocus onClick={() => setPhase("idle")} className="sb-press min-h-9 rounded-full px-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("composer.keepEditing")}</button>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] text-text">{t("ucomposer.keepDraftQ")}</p>
                    <span className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { const kept = Object.values(assetMealRef.current); const cats = Object.keys(assetCategory).length ? assetCategory : undefined; const grp = grouping.organised || grouping.groups.length || Object.keys(grouping.placed).length ? grouping : undefined; dispatch({ type: "udraft", draft: { ...d, ...(kept.length ? { mealAssets: kept } : {}), ...(cats ? { assetCategories: cats } : {}), ...(grp ? { grouping: grp } : {}) } }); onClose(); }} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("composer.keepDraft")}</button>
                      <button type="button" onClick={() => { dispatch({ type: "udraft", draft: null }); onClose(); }} className="sb-press min-h-9 rounded-full px-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("composer.discard")}</button>
                      {/* §55/§82 — never an ambiguous "Back" here */}
                      <button type="button" autoFocus onClick={() => setPhase("idle")} className="sb-press min-h-9 rounded-full px-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("ucomposer.continueEditing")}</button>
                    </span>
                  </div>
                )
              ) : phase === "failed" ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p role="alert" className="text-[13px] text-[var(--danger)]">{t("composer.postFailed")}</p>
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => { setPhase("idle"); requestClose(); }} className="sb-press min-h-9 rounded-full px-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("common.cancel")}</button>
                    <button ref={retryBtn} type="button" onClick={() => { setPhase("idle"); requestAnimationFrame(submit); }} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]">{t("common.retry")}</button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3">
                  {/* §54 — the count earns its place only near the limit */}
                  {nearLimit && (
                    <span className={`mr-auto text-[12px] tabular-nums ${over ? "text-[var(--danger)]" : "text-muted"}`}>{formatNumberLocale(locale, d.text.length)} / {formatNumberLocale(locale, TEXT_LIMIT)}</span>
                  )}
                  <span className="flex items-center gap-2">
                    {/* A4 — Cancel exists WHILE POSTING: it cancels the pending publication. */}
                    {phase === "posting" && (
                      <button type="button" onClick={requestClose} className="sb-press min-h-9 rounded-full px-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)] @2xl:min-h-8">{t("common.cancel")}</button>
                    )}
                    <button
                      ref={postBtn}
                      type="button"
                      onClick={submit}
                      aria-disabled={!canPost}
                      aria-busy={phase === "posting" || undefined}
                      className={`sb-press relative min-h-11 overflow-hidden rounded-full px-5 text-[14px] font-semibold text-white focus-visible:outline-[var(--focus)] @2xl:min-h-9 ${canPost || phase === "posting" ? "bg-[var(--boom)]" : "bg-[var(--boom)] opacity-60"}`}
                    >
                      {phase === "posting" && <span aria-hidden className="sb-posting absolute inset-y-0 left-0 bg-white/20" />}
                      <span className="relative">{phase === "posting" ? t("composer.posting") : editing ? t("composer.save") : t("composer.post")}</span>
                    </button>
                  </span>
                </div>
              )}
            </footer>

            {/* ============================== FOCUSED SHEETS (§6/§56) ============================== */}

            {sheet === "record" && (
              <Sheet title={t("ucomposer.addDetails")} onBack={() => { chooserScope.current = "post"; closeSheet(); }} hook="record">
                <div className="grid gap-1" data-sb-record-panel>
                  <div role="radiogroup" aria-label={t("ucomposer.socialMode")}>
                    <button type="button" role="radio" aria-checked={resolved === "social"} onClick={() => { chooseIntent("social"); closeSheet(); }} className={`${ROW_BTN} ${resolved === "social" ? "bg-[var(--boom-soft)]" : ""}`} data-sb-record-social-only>
                      <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted">{SOCIAL_GLYPH}</span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-text">{t("ucomposer.justPost")}</span>
                        <span className="block text-[12px] text-muted">{t("ucomposer.justPostHint")}</span>
                      </span>
                    </button>
                  </div>
                  <p className={`${LABEL} mt-3 px-3`}>{t("ucomposer.recordThisAs")}</p>
                  <div role="radiogroup" aria-label={t("ucomposer.recordThisAs")} className="grid gap-0.5" data-sb-kind-row>
                    {RECORD_KINDS.map((k) => {
                      const on = contextIntent === k;
                      return (
                        <button key={k} type="button" role="radio" aria-checked={on} aria-label={t(KIND_LABEL_KEY[k])} onClick={() => { pickKind(k); closeSheet(); }} className={`${ROW_BTN} ${on ? "bg-[var(--boom-soft)]" : ""}`}>
                          <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted">{KIND_GLYPH[k]}</span>
                          <span className="min-w-0">
                            <span className={`block text-[14px] text-text ${on ? "font-semibold" : "font-medium"}`} data-sb-kind-label>{t(KIND_LABEL_KEY[k])}</span>
                            <span className="block text-[12px] text-muted">{t(KIND_DESC_KEY[k])}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Sheet>
            )}

            {sheet === "media" && (
              <Sheet title={t("ucomposer.addMedia")} onBack={() => { sheetReturn.current = null; closeSheet(); }} hook="media">
                <p className="pb-2 text-[12px] text-muted tabular-nums">{t("composer.ofLimit", { n: d.mediaIds.length, limit: MEDIA_LIMIT })}{d.mediaIds.length >= MEDIA_LIMIT ? t("composer.removeOneToAdd") : ""}</p>
                <div className="grid gap-0.5">
                  {/* §10 — clear SOURCES, human words. Upload/Camera are real file inputs. */}
                  <input ref={uploadRef} type="file" multiple accept="image/*,video/*" className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { addUploads(e.target.files); e.target.value = ""; closeSheet(); }} />
                  <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" className="sr-only" aria-hidden tabIndex={-1} onChange={(e) => { addUploads(e.target.files); e.target.value = ""; closeSheet(); }} />
                  <button type="button" onClick={() => uploadRef.current?.click()} className={ROW_BTN} data-sb-media-source="upload">
                    <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted"><Upload size={16} strokeWidth={1.75} /></span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-text">{t("ucomposer.srcUpload")}</span>
                      <span className="block text-[12px] text-muted">{t("ucomposer.srcUploadHint")}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => cameraRef.current?.click()} className={ROW_BTN} data-sb-media-source="camera">
                    <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted"><Camera size={16} strokeWidth={1.75} /></span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-text">{t("ucomposer.srcCamera")}</span>
                      <span className="block text-[12px] text-muted">{t("ucomposer.srcCameraHint")}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setSheet("mymedia")} className={ROW_BTN} data-sb-media-source="mymedia">
                    <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted"><FolderOpen size={16} strokeWidth={1.75} /></span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-text">{t("ucomposer.srcMyMedia")}</span>
                      <span className="block text-[12px] text-muted">{t("ucomposer.srcMyMediaHint")}</span>
                    </span>
                  </button>
                  {/* §10 — a link is a separate reference interaction, not a media source */}
                  <button type="button" aria-expanded={linkOpen} disabled={draftMedia.length > 0} onClick={() => setLinkOpen((v) => !v)} className={`${ROW_BTN} disabled:opacity-45`} data-sb-media-source="link">
                    <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hair)] text-muted"><Link2 size={16} strokeWidth={1.75} /></span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-text">{t("ucomposer.addLink")}</span>
                    </span>
                  </button>
                  {draftMedia.length > 0 && <p className="px-3 text-[12px] text-muted" data-sb-one-media>{t("ucomposer.linkSeparate")}</p>}
                  {linkOpen && draftMedia.length === 0 && (
                    <div className="px-3 pb-1">
                      <label className="flex items-center gap-2 text-[13px] text-muted">
                        <span className="sr-only">{t("composer.mediaLink")}</span>
                        <input value={d.link ?? ""} onChange={(e) => resolveLink(e.target.value)} placeholder={t("composer.pasteLink")} className={`${FIELD} w-full`} />
                      </label>
                      {linkState === "resolving" && <div aria-hidden className="sb-resolving mt-2 h-10 rounded-[10px]" />}
                      {linkState === "preview" && d.link && (
                        <label className="mt-2 block text-[12px] text-muted">
                          <span className="sr-only">{t("composer.linkTitle")}</span>
                          <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} aria-label={t("composer.linkTitle")} className={`${FIELD} w-full`} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </Sheet>
            )}

            {sheet === "mymedia" && (
              <MyMediaSheet
                selected={d.mediaIds}
                onBack={() => setSheet("media")}
                onDone={(ids) => {
                  const { next, snapshot } = applyDetectedMetadata({ ...d, mediaIds: ids, link: ids.length ? undefined : d.link }, ids);
                  if (snapshot) setMetaSnapshot(snapshot);
                  setD(next);
                  closeSheet();
                }}
              />
            )}

            {sheet === "organizer" && (
              <Sheet
                title={t("ucomposer.organizer")}
                onBack={closeSheet}
                hook="organizer"
                footer={
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <button type="button" disabled={draftMedia.length >= MEDIA_LIMIT} onClick={() => { sheetReturn.current = "organizer"; setSheet("media"); }} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)] disabled:opacity-50" data-sb-organizer-add>
                        + {t("ucomposer.addMore")}
                      </button>
                      <span className="text-[12px] text-muted tabular-nums" data-sb-organizer-count>{draftMedia.length >= MEDIA_LIMIT ? t("ucomposer.nOfLimitMedia", { n: draftMedia.length, limit: MEDIA_LIMIT }) : t("ucomposer.nMedia", { n: draftMedia.length })}</span>
                    </span>
                    <button type="button" onClick={closeSheet} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]" data-sb-organizer-done>{t("ucomposer.done")}</button>
                  </div>
                }
              >
                {/* Phase A — ONE Media Organizer: All media (see · select · correct · cover · order · remove) and Organise (the grouping editor) */}
                {draftMedia.length > 1 && (
                  <div role="tablist" aria-label={t("ucomposer.organizer")} className="mb-3 inline-flex rounded-full border border-[var(--hair)] p-0.5 text-[12px]" data-sb-organizer-modes>
                    {(["all", "group"] as const).map((mode) => (
                      <button key={mode} type="button" role="tab" aria-selected={organizerMode === mode} onClick={() => setOrganizerMode(mode)} className={`sb-press min-h-8 rounded-full px-3 font-medium focus-visible:outline-[var(--focus)] ${organizerMode === mode ? "bg-steel/15 text-text" : "text-muted hover:text-text"}`} data-sb-organizer-mode={mode}>
                        {mode === "all" ? t("ucomposer.allMedia") : t("ucomposer.organiseMode")}
                      </button>
                    ))}
                  </div>
                )}
                {draftMedia.length >= MEDIA_LIMIT && <p className="mb-2 text-[12px] text-muted" data-sb-organizer-limit>{t("ucomposer.mediaLimit", { limit: MEDIA_LIMIT })}</p>}
                {organizerMode === "group" && draftMedia.length > 1 ? (
                  <Grouping
                    groups={groupView.groups}
                    pending={groupView.pending}
                    media={draftMedia.map((m) => ({ id: m.id, src: m.poster ?? m.src, alt: m.alt, error: m.error, processing: m.processing }))}
                    kindName={(c) => kindName(c as RecordIntent)}
                    selected={selId}
                    onSelect={(id) => setSelectedAssetId(id)}
                    onMove={(id, gid) => { const g = groupView.groups.find((x) => x.id === gid); setGrouping((st) => groupMoveTo(st, groupView.groups, id, gid)); if (g && g.category !== "review") setAssetCategory((prev) => ({ ...prev, [id]: g.category as AssetKind })); }}
                    onMoveKind={(id, c) => setAssetKind(id, c as AssetKind)}
                    onNewGroup={(id) => setGrouping((st) => startNewGroup(st, groupView.groups, id, newGroupId))}
                    onMerge={(from, into) => { const g = groupView.groups.find((x) => x.id === into); const src = groupView.groups.find((x) => x.id === from); setGrouping((st) => mergeGroups(st, groupView.groups, from, into)); if (g && src && g.category !== "review") setAssetCategory((prev) => { const n = { ...prev }; for (const id of src.mediaIds) n[id] = g.category as AssetKind; return n; }); }}
                    onRemove={(id) => { toggleAsset(id); setGrouping((st) => forgetAsset(st, id)); }}
                    onDone={() => { setGrouping((st) => ({ ...st, organised: true })); chooseIntent(settleKind()); closeSheet(); }}
                  />
                ) : (
                  <>
                    {/* the SELECTED asset, larger, with everything that can be done to it */}
                    {(() => {
                      const p = draftMedia.find((m) => m.id === selId) ?? draftMedia[0];
                      if (!p) return null;
                      const idx = draftMedia.findIndex((m) => m.id === p.id);
                      const cat = groupOf(p.id)?.category;
                      const effective: RecordIntent = cat === "meal" || cat === "activity" ? cat : cat === "moment" ? "moment" : resolved === "meal" || resolved === "activity" || resolved === "moment" ? resolved : "moment";
                      return (
                        <section className="mb-3 grid gap-2 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-2.5 @2xl:grid-cols-[minmax(0,220px)_1fr]" aria-label={t("ucomposer.selectedMedia")} data-sb-organizer-preview={p.id}>
                          <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[var(--sheet)]">
                            {p.processing ? (
                              <span className="flex h-full w-full items-center justify-center text-[12px] text-muted">{t("ucomposer.processingPhoto")}</span>
                            ) : p.error ? (
                              <span className="flex h-full w-full items-center justify-center px-2 text-center text-[12px] text-muted">{t(p.error === "video" ? "ucomposer.videoUnsupported" : "ucomposer.heicFailed")}</span>
                            ) : (
                              <Thumb src={p.poster ?? p.src} alt={p.alt} className="h-full w-full object-cover" />
                            )}
                            {p.videoDuration && <span className="absolute bottom-1.5 left-1.5 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">{p.videoDuration}</span>}
                          </span>
                          <div className="min-w-0 grid content-start gap-2">
                            <p className="text-[12px] text-muted"><span className="tabular-nums">{t("ucomposer.mediaOf", { n: idx + 1, total: draftMedia.length })}</span>{idx === 0 && draftMedia.length > 1 ? ` · ${t("ucomposer.cover")}` : ""}</p>
                            <p className="truncate text-[13px] text-text">{p.alt}</p>
                            {/* category of THIS asset — the existing per-asset change; never an AI rerun */}
                            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("ucomposer.thisPhoto")} data-sb-organizer-kinds>
                              {(["moment", "meal", "activity"] as const).map((k) => (
                                <button key={k} type="button" aria-pressed={effective === k} onClick={() => setAssetKind(p.id, k)} className={`sb-press min-h-9 rounded-full px-2.5 text-[12px] font-medium focus-visible:outline-[var(--focus)] ${effective === k ? "bg-steel/15 text-text" : "border border-[var(--hair)] text-muted hover:text-text"}`} data-sb-organizer-kind={k}>
                                  {kindName(k)}
                                </button>
                              ))}
                              {/* every canonical kind: Other… opens the one record chooser (Health · Problem · Project · Meeting are post-level
                                  kinds in this prototype; Life Moment / Meal / Activity picked there apply to THIS photo) and returns here */}
                              <button type="button" onClick={(e) => { chooserScope.current = "asset"; sheetReturn.current = "organizer"; openSheet("record", e.currentTarget); }} className="sb-press min-h-9 rounded-full px-2.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-organizer-kind-more>
                                {t("ucomposer.otherKind")}
                              </button>
                            </div>
                            {photoPhase(p.id) === "analyzing" && <p className="text-[12px] text-muted" role="status" data-sb-organizer-reading>{t("ucomposer.readingPhoto")}</p>}
                            <div className="flex flex-wrap items-center gap-1" data-sb-organizer-actions>
                              {idx > 0 && <button type="button" onClick={() => makeCover(idx)} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-organizer-cover>{t("ucomposer.makeCover", { n: idx + 1 })}</button>}
                              {idx > 0 && <button type="button" onClick={() => moveAsset(idx, -1)} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-organizer-earlier>{t(p.videoDuration ? "ucomposer.moveVideoEarlier" : "composer.movePhotoEarlier", { n: idx + 1 })}</button>}
                              {idx < draftMedia.length - 1 && <button type="button" onClick={() => moveAsset(idx, 1)} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-organizer-later>{t(p.videoDuration ? "ucomposer.moveVideoLater" : "composer.movePhotoLater", { n: idx + 1 })}</button>}
                              <button type="button" onClick={() => { toggleAsset(p.id); setGrouping((st) => forgetAsset(st, p.id)); }} className="sb-press min-h-9 rounded-full px-2.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-organizer-remove>{t(p.videoDuration ? "ucomposer.removeVideo" : "composer.removePhoto", { n: idx + 1 })}</button>
                            </div>
                          </div>
                        </section>
                      );
                    })()}
                    <ul className="grid grid-cols-3 gap-1.5 @2xl:grid-cols-4" data-sb-organizer-list>
                      {draftMedia.map((p, i) => {
                        const cat = groupOf(p.id)?.category;
                        const on = selId === p.id;
                        return (
                          <li key={p.id} className="relative" data-sb-thumb={p.id}>
                            <button type="button" aria-pressed={on} aria-label={p.alt} onClick={() => setSelectedAssetId(p.id)} className={`relative block aspect-square w-full overflow-hidden rounded-[10px] bg-[var(--sheet-raised)] focus-visible:outline-[var(--focus)] ${on ? "ring-2 ring-[var(--boom)]" : ""}`} data-sb-organizer-tile={p.id} data-sb-asset-state={photoPhase(p.id)}>
                              {p.processing ? (
                                <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted" data-sb-media-processing>{t("ucomposer.processingPhoto")}</span>
                              ) : p.error ? (
                                <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted" data-sb-media-error={p.error}>{p.alt}</span>
                              ) : (
                                <Thumb src={p.poster ?? p.src} alt="" className="h-full w-full object-cover" />
                              )}
                              {(photoPhase(p.id) === "analyzing" || photoPhase(p.id) === "resolving") && (
                                <span className="sb-intel" data-sb-intel-pulse={photoPhase(p.id)} aria-hidden>
                                  <span className="sb-intel-halo" />
                                  <span className="sb-intel-ring" data-sb-intel-orbit>
                                    <span className="sb-intel-arm" style={{ transform: "rotate(0deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                                    <span className="sb-intel-arm" style={{ transform: "rotate(130deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                                    <span className="sb-intel-arm" style={{ transform: "rotate(250deg)" }}><i className="sb-intel-dot" data-sb-intel-dot /></span>
                                  </span>
                                </span>
                              )}
                              {p.videoDuration && <span className="absolute bottom-1 left-1 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 text-[9px] font-medium text-white tabular-nums">{p.videoDuration}</span>}
                              {cat && <span className="absolute bottom-1 right-1 rounded-[4px] bg-[rgba(10,13,20,0.7)] px-1 py-0.5 text-[9px] font-semibold text-white" data-sb-asset-category={cat}>{cat === "review" ? t("ucomposer.needsReview") : kindName(cat as RecordIntent)}</span>}
                              {i === 0 && draftMedia.length > 1 && <span className="absolute top-1 left-1 rounded-[4px] bg-[var(--boom-soft)] px-1 py-0.5 text-[9px] font-semibold text-text">{t("ucomposer.cover")}</span>}
                            </button>
                            {/* per-tile actions (named for what the item IS) — the same operations as the selected pane, reachable without selecting */}
                            <span className="mt-0.5 flex items-center justify-center gap-0.5">
                              {i > 0 && <button type="button" aria-label={t("ucomposer.makeCover", { n: i + 1 })} title={t("ucomposer.makeCover", { n: i + 1 })} onClick={() => makeCover(i)} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-make-cover={i}><Star size={12} strokeWidth={1.75} aria-hidden /></button>}
                              {i > 0 && <button type="button" aria-label={t(p.videoDuration ? "ucomposer.moveVideoEarlier" : "composer.movePhotoEarlier", { n: i + 1 })} onClick={() => moveAsset(i, -1)} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]"><ArrowLeft size={12} strokeWidth={1.75} aria-hidden /></button>}
                              {i < draftMedia.length - 1 && <button type="button" aria-label={t(p.videoDuration ? "ucomposer.moveVideoLater" : "composer.movePhotoLater", { n: i + 1 })} onClick={() => moveAsset(i, 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]"><ArrowRight size={12} strokeWidth={1.75} aria-hidden /></button>}
                              <button type="button" aria-label={t(p.videoDuration ? "ucomposer.removeVideo" : "composer.removePhoto", { n: i + 1 })} onClick={() => { toggleAsset(p.id); setGrouping((st) => forgetAsset(st, p.id)); }} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-steel/10 hover:text-text focus-visible:outline-[var(--focus)]"><X size={12} strokeWidth={1.75} aria-hidden /></button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {singleVideo && (
                      <div className="mt-3">
                        <TField label={t("composer.caption")} value={d.videoCaption} onChange={(v) => setD((x) => ({ ...x, videoCaption: v }))} hook="videoCaption" />
                      </div>
                    )}
                  </>
                )}
              </Sheet>
            )}

            {sheet === "people" && (
              <Sheet
                title={t("ucomposer.actPeople")}
                onBack={closeSheet}
                hook="people"
                footer={<div className="flex justify-end"><button type="button" onClick={closeSheet} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]" data-sb-people-done>{t("ucomposer.done")}</button></div>}
              >
                <div data-sb-people-panel-composer>
                  <label htmlFor="sb-people-common" className="sr-only">{t("ucomposer.searchPeople")}</label>
                  <div className="flex items-center gap-1.5">
                    <Search size={14} className="shrink-0 text-muted" aria-hidden />
                    <input id="sb-people-common" value={peopleQuery} onChange={(e) => setPeopleQuery(e.target.value)} placeholder={t("ucomposer.searchPeople")} className={`${FIELD} w-full`} autoFocus />
                  </div>
                  {d.people.length > 0 && (
                    <div className="mt-2.5">
                      <p className={LABEL}>{t("ucomposer.selectedPeople")}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.people.map((id) => {
                          const p = personOf(id);
                          return (
                            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-[var(--hair)] py-0.5 pr-1 pl-2 text-[12px] text-text">
                              {p.name}
                              <button type="button" aria-label={t("ucomposer.removePerson", { name: p.name })} onClick={() => setD((x) => ({ ...x, people: x.people.filter((q) => q !== id) }))} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
                                <X size={11} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <PeopleRows query={peopleQuery} meId={me.id} selected={d.people} onToggle={(id) => setD((x) => ({ ...x, people: x.people.includes(id) ? x.people.filter((q) => q !== id) : [...x.people, id] }))} />
                </div>
              </Sheet>
            )}

            {sheet === "place" && (
              <Sheet
                title={t("ucomposer.addPlace")}
                onBack={closeSheet}
                hook="place"
                footer={<div className="flex justify-end"><button type="button" onClick={closeSheet} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]" data-sb-place-done>{t("ucomposer.done")}</button></div>}
              >
                <div data-sb-place-panel>
                  <label htmlFor="sb-place-common" className="sr-only">{t("ucomposer.searchPlace")}</label>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="shrink-0 text-muted" aria-hidden />
                    <input id="sb-place-common" value={d.place ?? ""} onChange={(e) => setD((x) => ({ ...x, place: e.target.value || undefined, placeSource: e.target.value ? "user" : x.placeSource, recordPlace: e.target.value ? { value: e.target.value, precision: x.placePrecision, source: "user" } : x.recordPlace }))} placeholder={t("ucomposer.searchPlace")} className={`${FIELD} w-full`} autoFocus />
                  </div>
                  {/* §24 — a found place is offered, never silently applied */}
                  {detected?.takenPlace && !d.place && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-muted" data-sb-place-found>
                      <span>{t("ucomposer.placeFound")}: <span className="text-text">{detected.takenPlace}</span></span>
                      <button type="button" onClick={() => setD((x) => ({ ...x, place: detected.takenPlace, placeSource: "metadata", recordPlace: { value: detected.takenPlace!, source: "metadata" } }))} className="sb-press min-h-7 rounded-full px-1.5 font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]">{t("ucomposer.use")}</button>
                    </p>
                  )}
                  <div className="mt-2.5">
                    <p className={LABEL}>{d.place ? t("ucomposer.suggested") : t("ucomposer.recentPlaces")}</p>
                    <ul className="mt-1 grid gap-0.5">
                      {/* Zero-effort capture (§1) — lead with places the person has actually
                          been, most-recent first; fall back to the plain list until there is
                          usable history. */}
                      {(d.place ? PLACES.filter((p) => p.toLowerCase().includes(d.place!.toLowerCase()) && p !== d.place) : (ownRecentPlaces.length ? ownRecentPlaces : PLACES.slice(0, 5))).slice(0, 6).map((p) => (
                        <li key={p}>
                          <button type="button" onClick={() => setD((x) => ({ ...x, place: p, placeSource: "user", recordPlace: { value: p, precision: x.placePrecision, source: "user" } }))} className="sb-press flex min-h-9 w-full items-center gap-2 rounded-[10px] px-2 text-left text-[13px] text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-place-option={p}>
                            <MapPin size={13} className="shrink-0 text-muted" aria-hidden /> {p}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* §17/§24 — how precise the stated place is; exact GPS/current location are live seams */}
                  {d.place && (
                    <div className="mt-3">
                      <ChipSelect
                        label={t("ucomposer.placePrecision")}
                        options={["venue", "cityRegion", "country", "approximate"]}
                        value={d.placePrecision}
                        onChange={(v) => setD((x) => ({ ...x, placePrecision: v as UDraft["placePrecision"], recordPlace: x.recordPlace ? { ...x.recordPlace, precision: v as UDraft["placePrecision"] } : x.recordPlace }))}
                        nameOf={(p) => t(p === "venue" ? "ucomposer.ppVenue" : p === "cityRegion" ? "ucomposer.ppCityRegion" : p === "country" ? "ucomposer.ppCountry" : "ucomposer.ppApprox")}
                        hook="placePrecision"
                      />
                      {/* UC-C4.2 §8 — this control removes SOCIAL disclosure only; `recordPlace`/
                          `placeSource` are deliberately not touched here (never invent a
                          second control for the record-level place in this pass). */}
                      <button type="button" onClick={() => setD((x) => ({ ...x, place: undefined, placePrecision: undefined }))} className="sb-press mt-2 min-h-8 rounded-full px-2 text-[12px] text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-place-clear>
                        {t("ucomposer.noPlace")}
                      </button>
                    </div>
                  )}
                </div>
              </Sheet>
            )}

            {sheet === "activityType" && (
              <Sheet title={t("ucomposer.activityType")} onBack={closeSheet} hook="activityType">
                <div role="radiogroup" aria-label={t("ucomposer.activityType")} className="flex flex-wrap gap-1" data-sb-chipselect="activityType">
                  {ACTIVITY_TYPES.map((o) => {
                    const on = d.domains.activity.type === o;
                    return (
                      <button key={o} type="button" role="radio" aria-checked={on} onClick={() => { setDomain(setD, "activity", { type: o }); closeSheet(); }} className={`sb-press inline-flex min-h-10 items-center rounded-full px-3.5 text-[13px] focus-visible:outline-[var(--focus)] ${on ? "bg-[var(--boom-soft)] font-medium text-text" : "text-muted hover:bg-steel/10 hover:text-text"}`}>
                        {t(activityKey(o))}
                      </button>
                    );
                  })}
                </div>
              </Sheet>
            )}

            {sheet === "healthType" && (
              <HealthTypeSheet
                value={d.domains.health.healthType}
                onBack={closeSheet}
                onPick={(h) => { setDomain(setD, "health", { healthType: h }); closeSheet(); }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ People rows (§22) */

function PeopleRows({ query, meId, selected, onToggle }: { query: string; meId: string; selected: string[]; onToggle: (id: string) => void }) {
  const { t } = useT();
  const { me, personOf, state } = useSocial();
  void personOf;
  const all = Object.values(PEOPLE).filter((p) => p.id !== meId);
  // Zero-effort capture (§1: trusted existing Human Record) — lead with people the person
  // has actually tagged before, most-recent first; fall back to the plain list until there
  // is usable history (unaffected first-use behavior).
  const own = recentPeopleIds(state.moments, meId).map((id) => personOf(id)).filter((p) => !p.unavailable);
  const rows = query.trim() ? matchPeople(query, meId, 12) : own.length ? own : all.slice(0, 6);
  return (
    <div className="mt-2.5">
      <p className={LABEL}>{query.trim() ? t("ucomposer.actPeople") : t("ucomposer.recent")}</p>
      {rows.length === 0 && query.trim() && (
        /* A12 — a name that matches nobody is said out loud, never stored */
        <p role="status" className="mt-1 text-[12px] text-muted" data-sb-people-unmatched>{t("ucomposer.noPeopleMatch", { name: query.trim() })}</p>
      )}
      <ul className="mt-1 grid gap-0.5">
        {rows.map((p) => {
          const on = selected.includes(p.id);
          return (
            <li key={p.id}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(p.id)} className={`sb-press flex min-h-11 w-full items-center gap-2.5 rounded-[12px] px-2 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)] @2xl:min-h-10 ${on ? "bg-[var(--boom-soft)]" : ""}`} data-sb-person-option={p.id}>
                <PersonIdentity viewer={me} subject={p} size={28} label="" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{p.name}</span>
                {on && <span aria-hidden className="text-[12px] font-semibold text-text">✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- My Media picker (§12) */

function MyMediaSheet({ selected, onBack, onDone }: { selected: string[]; onBack: () => void; onDone: (ids: string[]) => void }) {
  const { t } = useT();
  const [filter, setFilter] = useState<"all" | "photos" | "videos">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>(selected);
  const assets = allAssets().filter((a) => {
    if (filter === "photos" && a.mediaKind === "video") return false;
    if (filter === "videos" && a.mediaKind !== "video") return false;
    if (q.trim() && !a.alt.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MEDIA_LIMIT ? s : [...s, id]));
  return (
    <Sheet
      title={t("ucomposer.srcMyMedia")}
      onBack={onBack}
      hook="mymedia"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-muted tabular-nums">{t("composer.ofLimit", { n: sel.length, limit: MEDIA_LIMIT })}{sel.length >= MEDIA_LIMIT ? t("composer.removeOneToAdd") : ""}</span>
          <button type="button" onClick={() => onDone(sel)} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]" data-sb-mymedia-add>
            {t("ucomposer.addN", { n: sel.length })}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("ucomposer.srcMyMedia")}>
        {(["all", "photos", "videos"] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`sb-press inline-flex min-h-8 items-center rounded-full px-3 text-[12px] font-medium focus-visible:outline-[var(--focus)] ${filter === f ? "bg-[var(--sheet-raised)] text-text shadow-[inset_0_0_0_1px_var(--hair)]" : "text-muted hover:text-text"}`} data-sb-mymedia-filter={f}>
            {f === "all" ? t("ucomposer.filterAll") : f === "photos" ? t("ucomposer.filterPhotos") : t("ucomposer.filterVideos")}
          </button>
        ))}
        <label className="ml-auto flex min-w-32 flex-1 items-center gap-1.5 @2xl:max-w-56">
          <Search size={13} className="shrink-0 text-muted" aria-hidden />
          <span className="sr-only">{t("ucomposer.searchMedia")}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ucomposer.searchMedia")} className={`${FIELD} min-h-8 w-full`} data-sb-mymedia-search />
        </label>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 @2xl:grid-cols-4" role="group" aria-label={t("ucomposer.srcMyMedia")} data-sb-mymedia-grid>
        {assets.map((p: MediaAsset) => {
          const idx = sel.indexOf(p.id);
          const on = idx >= 0;
          return (
            <button key={p.id} type="button" aria-pressed={on} aria-label={p.alt} onClick={() => toggle(p.id)} className={`relative aspect-square overflow-hidden rounded-[8px] focus-visible:outline-[var(--focus)] ${on ? "ring-2 ring-[var(--boom)]" : ""}`}>
              <Thumb src={p.poster ?? p.src} alt={p.alt} className="h-full w-full object-cover" />
              {on && <span aria-hidden className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--boom)] px-1 text-[10px] font-semibold text-white tabular-nums">{idx + 1}</span>}
              {p.mediaKind === "video" && (
                <>
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-[rgba(10,13,20,0.35)] text-white"><Play size={11} fill="currentColor" strokeWidth={0} className="ml-0.5" /></span>
                  </span>
                  <span className="absolute bottom-1 left-1 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 text-[9px] font-medium text-white tabular-nums">{p.duration}</span>
                </>
              )}
              {p.takenAt && <span aria-hidden title={t("composer.hasDateInFile")} className="absolute top-1 left-1 h-2 w-2 rounded-full bg-[var(--boom)]" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------- Health type picker (§47) */

function HealthTypeSheet({ value, onBack, onPick }: { value: HealthType | undefined; onBack: () => void; onPick: (h: HealthType) => void }) {
  const { t } = useT();
  const [all, setAll] = useState(!!value && !HEALTH_COMMON.includes(value));
  const [q, setQ] = useState("");
  const list = (all || q.trim() ? [...HEALTH_TYPES] : HEALTH_COMMON).filter((h) => !q.trim() || t(healthTypeKey(h)).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Sheet title={t("ucomposer.healthType")} onBack={onBack} hook="healthType">
      <label className="flex items-center gap-1.5">
        <Search size={13} className="shrink-0 text-muted" aria-hidden />
        <span className="sr-only">{t("ucomposer.healthType")}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ucomposer.searchTypes")} className={`${FIELD} min-h-8 w-full`} data-sb-healthtype-search />
      </label>
      <p className={`${LABEL} mt-2.5`}>{all || q.trim() ? t("ucomposer.healthType") : t("ucomposer.commonTypes")}</p>
      <div role="radiogroup" aria-label={t("ucomposer.healthType")} className="mt-1 flex flex-wrap gap-1" data-sb-chipselect="healthType">
        {list.map((h) => {
          const on = value === h;
          return (
            <button key={h} type="button" role="radio" aria-checked={on} onClick={() => onPick(h as HealthType)} className={`sb-press inline-flex min-h-10 items-center rounded-full px-3.5 text-[13px] focus-visible:outline-[var(--focus)] ${on ? "bg-[var(--boom-soft)] font-medium text-text" : "text-muted hover:bg-steel/10 hover:text-text"}`}>
              {t(healthTypeKey(h))}
            </button>
          );
        })}
      </div>
      {!all && !q.trim() && (
        <button type="button" onClick={() => setAll(true)} className="sb-press mt-2 inline-flex min-h-8 items-center rounded-full px-2.5 text-[13px] font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-healthtype-more>
          {t("ucomposer.moreTypes")}
        </button>
      )}
    </Sheet>
  );
}

export { successKey, ASSIST_CAPABILITIES };
