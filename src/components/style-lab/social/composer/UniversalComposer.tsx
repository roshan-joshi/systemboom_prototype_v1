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

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Camera, ChevronDown, ChevronLeft, FolderOpen, Image as ImageIcon, Link2, MapPin, Play, Search, Sparkles, Star, Upload, Users, X } from "lucide-react";
import { useFocusTrap } from "@/components/identity/useFocusTrap";
import { now } from "@/lib/clock";
import { easeOut } from "@/lib/motion";
import { validateBirthDate } from "@/lib/identity/birth";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { matchPeople, PEOPLE, PLACES, type FoodFacts, type MediaAsset, type Privacy } from "../data";
import { localISO, useSocial } from "../store";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale, sbDate } from "@/lib/i18n/format";
import { allAssets, assetById, MEDIA_LIMIT, registerUploads } from "./media-assets";
import { ASSIST_CAPABILITIES, extractAssist, setSmartAssist, smartAssistEnabled, type AssistSuggestion } from "./smart-assist";
import { ACTIVITY_COMMON, ACTIVITY_TYPES, activityKey, ChipSelect, DomainMore, DomainQuick, FIELD, HEALTH_COMMON, HEALTH_TYPES, hasMore, healthTypeKey, KIND_DESC_KEY, KIND_LABEL_KEY, LABEL, MealCategorySuggestion, MealSuggestion, moreLabelKey, occasionKey, PLACEHOLDER_KEY, RECORD_KINDS, setDomain, TField } from "./domains";
import { analyzeMealMedia } from "./meal-intelligence/analyzeMealMedia";
import { commonActivityTypes, recentPeopleIds, recentPlaces } from "./recall";
import { hasAnyMedia, resolveIntent, type HealthType, type RecordIntent, type UDraft } from "./types";
import { buildSubmission, minimumProblem, successKey } from "./submit";

const TEXT_LIMIT = 2000;

type Phase = "idle" | "posting" | "failed" | "discard";
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
  const [mealAnalyzing, setMealAnalyzing] = useState(false);
  const mealAnalysisKeyRef = useRef<string | null>(null);
  const mealAnalysisGenRef = useRef(0);
  const mealAnalysisAbortRef = useRef<AbortController | null>(null);
  // PHASE C — selection provenance for the ONE-TAP UNDO gesture. Deliberately its own
  // transient, composer-local state and NOT a reading of `intentSource` (owner-directed): the
  // general Smart Assist's accepted text suggestions also set intentSource "ai" and must never
  // acquire the undo gesture. Component-local on purpose — the composer remounts per open, so
  // this never outlives the composition it describes, and no persisted schema changes.
  const [mealAutoSelected, setMealAutoSelected] = useState(false);
  // PHASE C — the medium-confidence "Looks like a Meal — use it?" ask was declined for this
  // composition. Reset when a NEW media set starts a new analysis (a new photo is a new question).
  const [mealCatDismissed, setMealCatDismissed] = useState(false);
  // PHASE B — structured nutrition FACTS per looked-up food (keyed by the lookup name:
  // canonicalName, falling back to the everyday name). SUGGESTION STATE, deliberately kept
  // beside — never inside — the immutable `aiObservation`; cleared when a new media set
  // starts a new analysis. "AI recognizes. USDA supplies facts. AI estimates only as fallback."
  const [mealFacts, setMealFacts] = useState<Record<string, FoodFacts | null>>({});
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
  const closeSheet = () => {
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
      if (a) return { id, src: a.src, alt: a.alt, w: a.w, h: a.h, videoDuration: a.mediaKind === "video" ? a.duration ?? "0:00" : undefined, takenAt: a.takenAt, takenPlace: a.takenPlace };
      const idx = id.startsWith("orig-") ? Number(id.slice(5)) : -1;
      const o = origItems[idx] ?? origItems[i];
      return o ? { id, src: o.src, alt: o.alt, w: o.w, h: o.h, videoDuration: o.videoDuration, takenAt: undefined, takenPlace: undefined } : null;
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
  const rederiveFromAsset = (assetId: string) => {
    const x = dRef.current;
    if (!x.mediaIds.includes(assetId)) return; // removed from the draft before metadata arrived
    const { next, snapshot } = applyDetectedMetadata(x, x.mediaIds);
    if (snapshot) setMetaSnapshot(snapshot);
    setD(next);
  };
  const addUploads = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = registerUploads(files, rederiveFromAsset);
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
  const canPost = !over && !minKey && !beforeBirth && evProblem !== "future" && phase !== "posting";

  /* ---- PHASE C — the MEDIUM-confidence category ask (never a modal, never while Meal is
   * already selected, never over a deliberate choice, gone for good once declined) ---- */
  const mealObs = d.domains.meal.aiObservation;
  const mealCatAsk =
    assistOn && !editing && phase === "idle" && anyMedia && resolved !== "meal" && !mealCatDismissed &&
    d.intentSource !== "user" && d.intentSource !== "ai" &&
    mealObs?.isFood === true && mealObs.confidence === "medium";

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
   */
  useEffect(() => {
    // PHASE B review fix (adversarial finding #2): turning Smart Assist OFF mid-flight must
    // honor "AI OFF means literally zero calls" — the in-flight analysis is aborted, its
    // generation retired (so a late resolution can neither store, auto-select, nor launch
    // facts lookups), and the key cleared so an explicit re-enable may genuinely re-ask.
    const retireInFlight = () => {
      if (!mealAnalysisAbortRef.current) return;
      mealAnalysisAbortRef.current.abort();
      mealAnalysisAbortRef.current = null;
      mealAnalysisGenRef.current++;
      mealAnalysisKeyRef.current = null;
      setMealAnalyzing(false);
    };
    if (editing || !assistOn) {
      if (!assistOn) retireInFlight();
      return;
    }
    const photoAssets = draftMedia.filter((m) => !m.videoDuration);
    const videoAsset = draftMedia.find((m) => m.videoDuration);
    // PHASE C — PHOTOS analyze on attach regardless of the current category (the observation
    // decides what happens next); VIDEO keyframe extraction keeps its original Meal-selected
    // gate (heavier work, and the Phase C brief scopes the broadened trigger to photos).
    const videoEligible = resolved === "meal" && !!videoAsset;
    if (photoAssets.length === 0 && !videoEligible) {
      // PHASE B review fix (adversarial finding #1): if EVERY attached medium is gone, the
      // analyzed set no longer exists — stop the orphaned analysis instead of letting it
      // resolve into (and launch lookups for) a draft the person already emptied. A video
      // that is merely not Meal-selected is NOT "gone", so that case is left untouched.
      if (draftMedia.length === 0) retireInFlight();
      return;
    }
    const key = draftMedia.map((m) => m.id).join(",");
    if (mealAnalysisKeyRef.current === key) return; // already running/done this session for this exact set
    mealAnalysisKeyRef.current = key;
    mealAnalysisAbortRef.current?.abort();
    const controller = new AbortController();
    mealAnalysisAbortRef.current = controller;
    const gen = ++mealAnalysisGenRef.current;
    setMealCatDismissed(false); // PHASE C — a new media set is a new question
    setMealFacts({}); // PHASE B — a new media set means a fresh facts board
    const w = window as unknown as {
      __SB_MEAL_ANALYSIS_LOG?: Array<{ key: string; status: string; observation: unknown }>;
      __SB_MEAL_FACTS_LOG?: Array<{ canonicalName: string; status: string; facts: unknown }>;
    };
    const log = (entry: { key: string; status: string; observation: unknown }) => {
      if (!w.__SB_MEAL_ANALYSIS_LOG) w.__SB_MEAL_ANALYSIS_LOG = [];
      w.__SB_MEAL_ANALYSIS_LOG.push(entry);
    };
    // PHASE B — the facts log is RESET to empty the moment an analysis starts (the
    // argument-less call below, per the contract and adversarial findings #4/#6): one
    // analysis, one log — entries never accumulate across analyses, so a test can both
    // distinguish "zero lookups were attempted" from "the capability does not exist" AND
    // trust that every entry belongs to the CURRENT analysis (late entries from a
    // superseded generation are dropped at the logging site, below).
    // Entries: start → found | miss | failed.
    const logFacts = (entry?: { canonicalName: string; status: string; facts: unknown }) => {
      if (!entry) {
        w.__SB_MEAL_FACTS_LOG = [];
        return;
      }
      if (!w.__SB_MEAL_FACTS_LOG) w.__SB_MEAL_FACTS_LOG = [];
      w.__SB_MEAL_FACTS_LOG.push(entry);
    };
    logFacts();
    log({ key, status: "start", observation: undefined });
    setMealAnalyzing(true);
    analyzeMealMedia({ photoUrls: photoAssets.map((p) => p.src), videoUrl: videoEligible ? videoAsset?.src : undefined, signal: controller.signal }).then((observation) => {
      log({ key, status: observation !== null ? "done" : "failed", observation });
      if (mealAnalysisGenRef.current !== gen) return; // superseded by a newer analysis — do nothing
      setMealAnalyzing(false);
      if (observation === null) return; // safe failure — nothing to show, Save is unaffected
      // PHASE C §auto-selection — decided at RESPONSE-APPLICATION time, never request time:
      // the person may have chosen a category while this was in flight, and an explicit choice
      // ("user", or an accepted suggestion's "ai") is never overridden. `mediaUnchanged` also
      // covers "the analyzed photo was removed before the result landed" — no auto-selection
      // for media that is no longer the draft's. `isFood === true` is already a strictly
      // validated boolean (route-side); a HIGH non-food or MEDIUM/LOW food never selects here.
      const cur = dRef.current;
      const deliberate = cur.intentSource === "user" || cur.intentSource === "ai";
      const mediaUnchanged = cur.mediaIds.join(",") === key;
      const auto = !deliberate && mediaUnchanged && smartAssistEnabled() && observation.isFood === true && observation.confidence === "high";
      // §LATE RESULT PROTECTION — this only ever sets the AI's OWN reading (and, when `auto`,
      // the category); it never touches `foodItems`, so a person's manual entry (typed while
      // this was in flight) is untouched. The observation is STORED regardless of the current
      // category — it is Meal-domain data either way, and the medium ask reads it from here.
      setD((x) => {
        const stillFree = x.intentSource !== "user" && x.intentSource !== "ai"; // re-guarded at application
        return {
          ...x,
          ...(auto && stillFree ? { intent: "meal" as const, intentSource: "ai" as const } : null),
          domains: { ...x.domains, meal: { ...x.domains.meal, aiObservation: observation } },
        };
      });
      if (auto) setMealAutoSelected(true);
      // PHASE B — after recognition, look up REAL nutrition facts per recognized food through
      // the one server boundary (`/api/food-facts`). Lookup key: canonicalName (fallback: the
      // everyday name); low-confidence foods are never looked up (they are hints, not
      // identities). Results merge into SUGGESTION STATE only — the aiObservation is never
      // touched. A miss or failure is quiet: the AI estimate remains the visible fallback.
      // The page-level `?mockfacts=` seam forwards as `?mock=` (same convention as `mockai`).
      // Adversarial findings #1/#2 — the launch is gated at RESPONSE-APPLICATION time, like
      // auto-selection above: never for a media set the person already changed/withdrew
      // (`mediaUnchanged`), and never after the person turned Smart Assist off mid-flight
      // (`smartAssistEnabled()` reads the switch's current stored state, not a stale closure).
      if (observation.isFood === true && mediaUnchanged && smartAssistEnabled()) {
        const mockFacts = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockfacts") : null;
        const lookups = observation.foods.filter((f) => f.confidence !== "low").slice(0, 5);
        for (const food of lookups) {
          const lookupName = food.canonicalName ?? food.name;
          logFacts({ canonicalName: lookupName, status: "start", facts: undefined });
          fetch(`/api/food-facts${mockFacts ? `?mock=${encodeURIComponent(mockFacts)}` : ""}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canonicalName: lookupName }),
            signal: controller.signal,
          })
            .then((r) => {
              if (!r.ok) throw new Error(`food-facts ${r.status}`);
              return r.json();
            })
            .then((j: { facts?: FoodFacts | null }) => {
              if (mealAnalysisGenRef.current !== gen) return; // superseded — neither state nor log (finding #6)
              const facts = j?.facts ?? null;
              logFacts({ canonicalName: lookupName, status: facts ? "found" : "miss", facts });
              if (facts) setMealFacts((prev) => ({ ...prev, [lookupName]: facts }));
            })
            .catch(() => {
              // Quiet by design — a facts failure must never break the Meal (B12). A lookup
              // aborted because its analysis was superseded belongs to the OLD log, not the
              // new one — the generation guard keeps the current analysis's record clean.
              if (mealAnalysisGenRef.current !== gen) return;
              logFacts({ canonicalName: lookupName, status: "failed", facts: null });
            });
        }
      }
    });
  }, [editing, resolved, assistOn, draftMedia]);
  useEffect(() => () => mealAnalysisAbortRef.current?.abort(), []);

  /* ---- intent selection (§7/§26 — switching never loses common or per-domain work) ---- */
  const chooseIntent = (k: RecordIntent) => {
    setD((x) => ({ ...x, intent: k, intentSource: "user" }));
    setMealAutoSelected(false); // PHASE C — an explicit choice is never "auto-selected"; the undo gesture dies here
    setMoreOpen(false);
    setSugg(null);
  };
  const applySuggestion = (s: AssistSuggestion) => {
    setMealAutoSelected(false); // PHASE C — accepting a text suggestion is a deliberate act, never the auto-selection's undo target
    setD((x) => {
      let next: UDraft = { ...x, intent: s.kind ?? x.intent, intentSource: "ai" };
      if (s.kind === "activity") next = { ...next, domains: { ...next.domains, activity: { ...next.domains.activity, type: s.activityType ?? next.domains.activity.type, distance: s.distance ?? next.domains.activity.distance, duration: s.duration ?? next.domains.activity.duration } } };
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
      setIssue(minKey ?? (over ? "ucomposer.tooLong" : beforeBirth ? "composer.beforeLife" : evProblem === "future" ? "composer.futureDate" : null));
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
      const action = buildSubmission(d, original, linkTitle, me.id, newId);
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
    resolved === "meal" && d.domains.meal.occasion
      ? d.domains.meal.occasion === "other" && d.domains.meal.occasionCustom ? d.domains.meal.occasionCustom : t(occasionKey(d.domains.meal.occasion))
      : resolved === "activity" && d.domains.activity.type
        ? t(activityKey(d.domains.activity.type))
        : resolved === "health" && d.domains.health.healthType
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
                  <div className={`grid gap-[3px] overflow-hidden rounded-[12px] ${draftMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {collageShown.map((p, i) => (
                      <span key={p.id + i} className={`relative block overflow-hidden bg-[var(--sheet-raised)] ${draftMedia.length === 1 ? "max-h-56" : "aspect-[4/3]"}`} style={draftMedia.length === 1 ? { aspectRatio: `${p.w} / ${p.h}` } : undefined} data-sb-thumb={p.id}>
                        <Thumb src={p.src} alt={p.alt} className="h-full w-full object-cover" />
                        {i === 0 && draftMedia.length > 1 && <span className="absolute top-1.5 left-1.5 rounded-[4px] bg-[rgba(10,13,20,0.7)] px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("ucomposer.cover")}</span>}
                        {p.videoDuration && (
                          <>
                            <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[rgba(10,13,20,0.35)] text-white"><Play size={12} fill="currentColor" strokeWidth={0} className="ml-0.5" /></span>
                            </span>
                            <span className="absolute bottom-1.5 left-1.5 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">{p.videoDuration}</span>
                          </>
                        )}
                        {p.takenAt && <span aria-hidden title={t("composer.hasDateInFile")} className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--boom)]" />}
                        {collageExtra > 0 && i === collageShown.length - 1 && (
                          <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-[rgba(10,13,20,0.55)] text-[18px] font-semibold text-white tabular-nums">+{collageExtra}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 flex items-baseline gap-2 text-[12px] text-muted">
                    <span className="tabular-nums">{t("ucomposer.nMedia", { n: draftMedia.length })}</span>
                    <button type="button" onClick={(e) => openSheet("organizer", e.currentTarget)} className="sb-press min-h-7 rounded-full px-1.5 font-medium text-text hover:bg-steel/10 focus-visible:outline-[var(--focus)]" data-sb-media-edit>
                      {t("ucomposer.editMedia")}
                    </button>
                  </p>
                  {/* the accepted single-video caption, in place */}
                  {singleVideo && (
                    <input value={d.videoCaption ?? ""} onChange={(e) => setD((x) => ({ ...x, videoCaption: e.target.value || undefined }))} placeholder={t("composer.caption")} aria-label={t("composer.caption")} className={`${FIELD} mt-2 w-full`} />
                  )}
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
                      if (resolved === "meal" && mealAutoSelected) {
                        setMealAutoSelected(false);
                        setD((x) => ({ ...x, intent: "social", intentSource: "default" }));
                        return;
                      }
                      openSheet("record", e.currentTarget);
                    }}
                    className={`${CHIP} bg-[var(--boom-soft)] text-text`}
                    data-sb-record-details
                    data-sb-record-pill={resolved}
                    data-sb-intent-indicator={resolved}
                  >
                    <span aria-hidden className="inline-flex">{KIND_GLYPH[resolved]}</span>
                    <span className={CHIP_WORD}>
                      {kindName(resolved)}
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

              {/* DOMAIN QUICK — the same composer, adapted in place */}
              {resolved !== "social" && (
                <div key={resolved} className="sb-reveal mt-3" data-sb-kind-fields={resolved}>
                  <DomainQuick draft={{ ...d, intent: resolved }} set={setD} min={me.birthDate} onOpenSheet={(s) => openSheet(s)} activityCommon={activityCommon} />
                  {resolved === "meal" && anyMedia && <MealSuggestion draft={{ ...d, intent: resolved }} set={setD} analyzing={mealAnalyzing} openMore={() => setMoreOpen(true)} facts={mealFacts} />}
                  {hasMore(resolved) && (
                    <div className={resolved === "moment" ? "" : "mt-2"}>
                      <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} className="sb-press -ml-2 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-more-toggle>
                        <span aria-hidden className={`sb-transition inline-block text-[10px] ${moreOpen ? "rotate-90" : ""}`}>›</span> {t(moreLabelKey(resolved))}
                      </button>
                      {moreOpen && (
                        <div className="sb-reveal mt-2" data-sb-more>
                          <DomainMore draft={{ ...d, intent: resolved }} set={setD} min={me.birthDate} />
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
              {resolved === "health" && (
                <p className="mt-3 rounded-[12px] border border-[var(--hair)] px-3 py-2 text-[12px] text-muted" data-sb-health-sharing>
                  <span className="font-medium text-text">{t("ucomposer.sharingWith", { audience: audienceName(d.audience) })}</span>{" "}
                  {t("ucomposer.healthShareNote")}
                </p>
              )}

              {/* §44 — a clear inline reason, never a mystery */}
              {issue && <p role="alert" className="mt-2 text-[12px] text-[var(--danger)]" data-sb-composer-issue>{t(issue)}</p>}
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
                      <button type="button" onClick={() => { dispatch({ type: "udraft", draft: d }); onClose(); }} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("composer.keepDraft")}</button>
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
              <Sheet title={t("ucomposer.addDetails")} onBack={closeSheet} hook="record">
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
                      const on = resolved === k;
                      return (
                        <button key={k} type="button" role="radio" aria-checked={on} aria-label={t(KIND_LABEL_KEY[k])} onClick={() => { chooseIntent(k); closeSheet(); }} className={`${ROW_BTN} ${on ? "bg-[var(--boom-soft)]" : ""}`}>
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
              <Sheet title={t("ucomposer.addMedia")} onBack={closeSheet} hook="media">
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
                    <button type="button" onClick={() => setSheet("media")} className="sb-press min-h-9 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]" data-sb-organizer-add>
                      + {t("ucomposer.addMore")}
                    </button>
                    <button type="button" onClick={closeSheet} className="sb-press min-h-9 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white focus-visible:outline-[var(--focus)]">{t("ucomposer.done")}</button>
                  </div>
                }
              >
                <ul className="grid gap-1.5" data-sb-organizer-list>
                  {draftMedia.map((p, i) => (
                    <li key={p.id + i} className="flex items-center gap-2.5 rounded-[12px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1.5" data-sb-thumb={p.id}>
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[var(--sheet-raised)]">
                        <Thumb src={p.src} alt={p.alt} className="h-full w-full object-cover" />
                        {p.videoDuration && <span className="absolute bottom-0.5 left-0.5 rounded-[3px] bg-[rgba(10,13,20,0.82)] px-1 text-[9px] font-medium text-white tabular-nums">{p.videoDuration}</span>}
                        {p.takenAt && <span aria-hidden title={t("composer.hasDateInFile")} className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-[var(--boom)]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-text">{p.alt}</span>
                        {i === 0 && <span className="mt-0.5 inline-block rounded-[4px] bg-[var(--boom-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-text">{t("ucomposer.cover")}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        {i > 0 && (
                          <button type="button" aria-label={t("ucomposer.makeCover", { n: i + 1 })} title={t("ucomposer.makeCover", { n: i + 1 })} onClick={() => makeCover(i)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-make-cover={i}><Star size={13} /></button>
                        )}
                        {/* §65 — accessible reorder (never drag-only), named for what the item IS */}
                        {i > 0 && (
                          <button type="button" aria-label={t(p.videoDuration ? "ucomposer.moveVideoEarlier" : "composer.movePhotoEarlier", { n: i + 1 })} onClick={() => moveAsset(i, -1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]"><ArrowLeft size={13} /></button>
                        )}
                        {i < draftMedia.length - 1 && (
                          <button type="button" aria-label={t(p.videoDuration ? "ucomposer.moveVideoLater" : "composer.movePhotoLater", { n: i + 1 })} onClick={() => moveAsset(i, 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]"><ArrowRight size={13} /></button>
                        )}
                        {/* §17 — Remove unlinks from THIS post; the asset itself stays in My Media */}
                        <button type="button" aria-label={t(p.videoDuration ? "ucomposer.removeVideo" : "composer.removePhoto", { n: i + 1 })} onClick={() => toggleAsset(p.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]"><X size={13} /></button>
                      </span>
                    </li>
                  ))}
                </ul>
                {singleVideo && (
                  <div className="mt-3">
                    <TField label={t("composer.caption")} value={d.videoCaption} onChange={(v) => setD((x) => ({ ...x, videoCaption: v }))} hook="videoCaption" />
                  </div>
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
              <Thumb src={p.src} alt={p.alt} className="h-full w-full object-cover" />
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
