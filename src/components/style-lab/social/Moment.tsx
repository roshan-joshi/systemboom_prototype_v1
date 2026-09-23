"use client";

/**
 * MOMENT ENTRY — an entry on the rule, not a card.
 *   date rule → line 1 readout (who · life · Earth · when) → line 2 kind
 *   readout → body → media → foot (Respond + word, facts, View in Life, ⋯)
 *   → notes thread.
 * HEALTH / PROBLEM are quieter: inset media, no Respond, visibility word.
 */

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Ellipsis, Users } from "lucide-react";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sbDate } from "@/lib/i18n/format";
import type { LocaleCode } from "@/lib/i18n/config";
import { now } from "@/lib/clock";
import type { Moment as MomentT, Note, Person, Privacy } from "./data";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { ExpressionControl, ExpressionSummary } from "./expressions";
import { ResonateControl, ResonanceSummary } from "@/components/celestial/ResonateControl";
import { momentLifeFor, personViewFor } from "./view-model";
import { MediaBlock } from "./Media";
import { formatTime, isToday, localISO, useSocial } from "./store";
import { announce } from "@/lib/announce";
import { useWorldMaybe } from "@/components/world/WorldProvider";

export const QUIET_KINDS = new Set(["health", "problem"]);
const BODY_LIMIT = 420;
const NOTE_LIMIT = 280;

/* ---------- date rule ---------- */

export function DateRule({ iso, sharedAt }: { iso: string; sharedAt?: string }) {
  const { t, locale } = useT();
  // Locale-aware date display; en stays byte-identical to the product's "DD MON YYYY".
  const latin = locale === "en" || locale === "es" || locale === "it" || locale === "nl";
  const sharedDate = sharedAt ? (latin ? sbDate(locale, sharedAt).toLowerCase() : sbDate(locale, sharedAt)) : "";
  return (
    <div className="relative flex items-baseline gap-2 pl-[var(--gutter)]" data-sb-date-rule>
      <span aria-hidden className="absolute top-1/2 right-0 left-[var(--rule-x)] h-px bg-[var(--rule)]" />
      <h3 className="relative bg-[var(--sheet-bg)] pr-2 text-[18px] leading-none font-semibold tracking-[0.01em] text-text tabular-nums">
        {isToday(iso) ? t("common.today") : sbDate(locale, iso)}
        {isToday(iso) && <span className="ml-2 text-[12px] font-medium tracking-[0.02em] text-muted">{sbDate(locale, iso)}</span>}
      </h3>
      {sharedAt && <span className="relative bg-[var(--sheet-bg)] px-2 text-[12px] font-medium text-muted">{isToday(sharedAt) ? t("moments.sharedToday") : t("moments.sharedOn", { date: sharedDate })}</span>}
    </div>
  );
}

/* ---------- kind readout ---------- */

function kindLine(
  m: MomentT,
  personOf: (id: string) => Person,
  tr: (key: string, params?: Record<string, string | number>) => string,
  locale: LocaleCode,
): { word: string; parts: React.ReactNode[] } | null {
  const f = m.fields ?? {};
  // `word` stays the canonical key token; the component re-localizes it via `kind.<word>`.
  const only = m.privacy === "onlyme" ? tr("moments.onlyYou") : null;
  switch (m.kind) {
    case "meal":
      // Final Social Connection pass §16: "with N" becomes a real person reference below, not
      // text here — only when the underlying data actually knows who (never inferred, never a
      // face-recognition guess).
      return { word: "MEAL", parts: [f.what, f.venue].filter(Boolean) as string[] };
    case "activity":
      return { word: "ACTIVITY", parts: [f.what, f.measure, f.duration].filter(Boolean) as string[] };
    case "project": {
      const [n, total] = f.progress ?? [0, 0];
      const since = f.since ? tr("moments.sinceDate", { date: sbDate(locale, `${f.since}T00:00:00`) }) : null;
      return {
        word: "PROJECT",
        parts: [
          f.name,
          total > 0 ? (
            <span key="p" className="inline-flex items-center gap-1.5">
              <span aria-hidden className="relative inline-block h-px w-10 bg-[var(--rule)] align-middle">
                <span className="absolute inset-y-[-1px] left-0 bg-[var(--ice)]" style={{ width: `${(n / total) * 100}%` }} />
              </span>
              {tr("moments.progressOfN", { n, total })}
            </span>
          ) : null,
          since,
        ].filter(Boolean) as React.ReactNode[],
      };
    }
    case "meeting":
      // Phase 4.4-A (A13): the meeting names its people ONCE — in the "with …" control below,
      // which also opens them — instead of a text part plus a second "with N".
      return { word: "MEETING", parts: [f.venue, f.duration].filter(Boolean) as string[] };
    case "health":
      return { word: "HEALTH", parts: [f.measurement, f.value, only].filter(Boolean) as string[] };
    case "problem":
      return { word: "PROBLEM", parts: [f.title, f.status, only].filter(Boolean) as string[] };
    default:
      return null;
  }
}

/* ---------- entry ---------- */

export function MomentEntry({ moment, showDate = true, onEdit }: { moment: MomentT; showDate?: boolean; onEdit: (m: MomentT) => void }) {
  // Inside <PreviewScope> ("View as public") `me` is the public stand-in and `previewing` is true:
  // the entry renders exactly as a stranger receives it, and nothing here can write.
  const { me, personOf, dispatch, state, previewing } = useSocial();
  const { t, tp, locale } = useT();
  const reduced = useReducedMotionPref();
  const world = useWorldMaybe();
  const authorRaw = personOf(moment.authorId);
  const isSelf = moment.authorId === me.id;
  const at = new Date(moment.at);
  // Everything rendered about the author comes from the privacy view model.
  const author = personViewFor(me, authorRaw);
  const pos = momentLifeFor(me, authorRaw, at);
  const quiet = QUIET_KINDS.has(moment.kind);
  const kind = kindLine(moment, personOf, t, locale);
  const uid = useId();
  // R3 §48–§50 — conversation depth is adaptive: shallow stays inline, deep opens a focused
  // surface on a phone (the feed must never become a 40-response thread).
  const [notesOpen, setNotesOpen] = useState(false);
  const [focusedConv, setFocusedConv] = useState<null | "write" | "read">(null);
  // The control that opened the phone conversation — focus returns there when it closes (A8).
  const convOpener = useRef<HTMLElement | null>(null);
  const [withOpen, setWithOpen] = useState(false);
  const withBtn = useRef<HTMLButtonElement>(null);
  const withPeople = (moment.fields?.with ?? []).map((id) => personOf(id)).filter((p) => !p.unavailable);
  const [moreOpen, setMoreOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const landed = state.justPosted === moment.id;

  // The one orchestrated motion: a just-posted entry rises onto the rule, then focus lands on its readout.
  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => {
      const el = ref.current;
      el?.querySelector<HTMLElement>("[data-sb-readout]")?.focus({ preventScroll: true });
      // A backdated moment can land many screens away; a smooth scroll across ten screens is a
      // tour, not a settle. Glide when it is near, jump when it is far — the entry's rise is the motion.
      const distance = el ? Math.abs(el.getBoundingClientRect().top - window.innerHeight / 2) : 0;
      const far = distance > window.innerHeight * 2.5;
      el?.scrollIntoView({ block: "center", behavior: reduced || far ? "auto" : "smooth" });
      dispatch({ type: "landed" });
    }, 40);
    return () => clearTimeout(t);
  }, [landed, dispatch, reduced]);

  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  /**
   * R3 §41–§44 — RESPOND is the verb, and the verb writes. (The R2 tap-toggle was a second,
   * anonymous acknowledgement competing with the Expression language; it is retired — see the
   * vocabulary audit in docs/handover/moment-conversation-model.md.) Respond opens the
   * conversation where it belongs for this width and puts the cursor in the composer.
   */
  const INLINE_DEPTH = 2;
  const isPhone = () => {
    const frame = ref.current?.closest("[data-sb-social-frame]");
    return (frame?.getBoundingClientRect().width ?? window.innerWidth) < 672;
  };
  const openConversation = (write: boolean, opener?: HTMLElement | null) => {
    const deep = topNotes.length > INLINE_DEPTH;
    if (deep && isPhone()) {
      convOpener.current = opener ?? null;
      setFocusedConv(write && !previewing ? "write" : "read");
      return;
    }
    setNotesOpen(true);
    if (write) requestAnimationFrame(() => ref.current?.querySelector<HTMLTextAreaElement>("[data-sb-response-composer] textarea")?.focus());
  };
  const closeConversation = () => {
    setFocusedConv(null);
    const back = convOpener.current;
    requestAnimationFrame(() => back?.isConnected && back.focus({ preventScroll: true }));
  };
  // Phase 4.4-A (A20): after Hide / Delete the entry is gone — focus lands on the neighbouring
  // Moment's readout (never on <body>) and the outcome is announced.
  const leaveAfter = (said: string) => {
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-sb-moment]"));
    const i = all.findIndex((el) => el === ref.current);
    const next = all[i + 1] ?? all[i - 1];
    requestAnimationFrame(() => requestAnimationFrame(() => next?.querySelector<HTMLElement>("[data-sb-readout]")?.focus()));
    announce(said);
  };
  // Phase 4.4-A (A19): "Link copied." only when the copy actually happened.
  const copyLink = () => {
    setMoreOpen(false);
    const fail = () => say(t("moments.linkCopyFailed"));
    if (!navigator.clipboard?.writeText) return fail();
    navigator.clipboard.writeText(`https://systemboom.example/m/${moment.id}`).then(() => say(t("moments.linkCopied")), fail);
  };

  const long = (moment.text?.length ?? 0) > BODY_LIMIT;
  const body = long && !expanded ? moment.text!.slice(0, BODY_LIMIT).replace(/\s+\S*$/, "") + "…" : moment.text;
  const topNotes = moment.notes.filter((n) => !n.parentId);

  return (
    <article ref={ref} className={`relative ${landed ? "sb-land" : ""}`} aria-labelledby={`${uid}-who`} data-sb-moment={moment.id} data-sb-at={moment.at} data-sb-kind={moment.kind} data-sb-privacy={moment.privacy}>
      {showDate && <DateRule iso={moment.at} sharedAt={moment.sharedAt} />}

      {/* line 1 — the readout */}
      <div className="relative mt-3 flex items-center gap-3 pl-[var(--gutter)]">
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: "var(--rule-x)" }}>
          <span className="block rounded-full bg-[var(--sheet-bg)] p-[2px]">
            <PersonIdentity viewer={me} subject={authorRaw} at={at} size={24} />
          </span>
        </span>
        <p id={`${uid}-who`} data-sb-readout tabIndex={-1} className="flex min-w-0 flex-1 items-baseline gap-x-2 pl-2 text-[13px] leading-[1.3] whitespace-nowrap tabular-nums outline-none">
          {/* Another person's name is the way to their person surface (complete-My-World pass) */}
          {!isSelf && world && !previewing && !authorRaw.unavailable ? (
            <button type="button" onClick={(e) => world.openPerson(authorRaw.id, e.currentTarget)} className="shrink-0 rounded-[4px] font-medium text-text underline-offset-4 hover:underline focus-visible:outline-[var(--focus)]" data-sb-open-person={authorRaw.id}>
              {author.name.length > 26 ? author.name.split(" ").slice(0, 2).join(" ") + " …" : author.name}
            </button>
          ) : (
            <span className="shrink-0 font-medium text-text">{author.name.length > 26 ? author.name.split(" ").slice(0, 2).join(" ") + " …" : author.name}</span>
          )}
          <Dot />
          {pos.exact ? (
            <span className="shrink-0 font-medium text-text" title={t("moments.ageTitle")}>{pos.exact}</span>
          ) : (
            <span className="shrink-0 font-medium text-muted" title={t("moments.bandTitle", { band: pos.band })}>{pos.band}</span>
          )}
          {moment.place && (
            <span className="hidden min-w-0 items-baseline gap-x-2 @2xl:flex">
              <Dot />
              <span className="min-w-0 truncate text-muted">{moment.place}</span>
            </span>
          )}
          {moment.feeling && (
            <span className="hidden shrink-0 items-baseline gap-x-2 @2xl:flex">
              <Dot />
              <span className="text-muted">{t("moments.feeling", { mood: moment.feeling })}</span>
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-baseline gap-1.5 pl-2 text-muted">
            {moment.privacy === "friends" && <Users size={12} aria-label={t("moments.friendsOnlyAria")} className="translate-y-[1px]" />}
            {moment.privacy === "onlyme" && !quiet && <span className="text-[11px]">{t("moments.onlyYou")}</span>}
            {moment.edited && <span className="text-[11px]">{t("moments.edited")}</span>}
            {moment.atPrecision !== "day" && <span>{formatTime(moment.at)}</span>}
          </span>
        </p>
      </div>

      {/* phone: the place and feeling get their own line so nothing truncates to a stub */}
      {(moment.place || moment.feeling) && (
        <p className="mt-0.5 flex items-baseline gap-x-2 pl-[calc(var(--gutter)+8px)] text-[13px] leading-[1.3] text-muted tabular-nums @2xl:hidden">
          {moment.place && <span className="min-w-0 truncate">{moment.place}</span>}
          {moment.place && moment.feeling && <Dot />}
          {moment.feeling && <span className="shrink-0">{t("moments.feeling", { mood: moment.feeling })}</span>}
        </p>
      )}

      {/* line 2 — the kind readout */}
      {kind && (
        // The outer wrapper stays a <div>, not a <p>: a plain <p> can't legally contain the
        // with-people Popover's <div role="menu">/<ul> below (a real hydration-mismatch warning,
        // not a stylistic choice) — but the kind word/parts themselves stay a real <p>, unchanged,
        // so nothing that measured or queried that text (e.g. a contrast check) loses its target.
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 pl-[calc(var(--gutter)+8px)] text-[13px] leading-[1.3] text-muted tabular-nums">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{t("kind." + kind.word.toLowerCase())}</span>
            {kind.parts.map((p, i) => (
              <span key={i} className="flex items-baseline gap-x-2">
                <Dot />
                <span className={quiet ? "text-muted" : "text-text/85"}>{p}</span>
              </span>
            ))}
          </p>
          {/* Final Social Connection pass §16: a real "with N" reference becomes discoverable
              people, never inferred — only when the Moment's own data already names them. */}
          {withPeople.length > 0 && (
            <span className="relative flex items-baseline gap-x-2">
              <Dot />
              <button ref={withBtn} type="button" onClick={() => setWithOpen((v) => !v)} aria-expanded={withOpen} className="text-text/85 underline-offset-4 hover:underline focus-visible:outline-[var(--focus)]" data-sb-moment-with>
                {moment.kind === "meeting" ? t("moments.withPeople", { names: withPeople.map((p) => p.name.split(" ")[0]).join(", ") }) : t("moments.withN", { n: withPeople.length })}
              </button>
              {withOpen && (
                <Popover onClose={() => setWithOpen(false)} label={t("moments.peopleInMoment")}>
                  <ul role="none" className="flex max-h-64 flex-col gap-1 overflow-y-auto" data-sb-moment-with-people>
                    {withPeople.map((p) => (
                      <li key={p.id} role="none">
                        {previewing ? (
                          <span role="menuitem" aria-disabled="true" className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1">
                            <PersonIdentity viewer={me} subject={p} size={24} label="" />
                            <span className="text-[13px] text-text">{p.name}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => { setWithOpen(false); if (p.id !== me.id) world?.openPerson(p.id, withBtn.current); }}
                            className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)]"
                          >
                            <PersonIdentity viewer={me} subject={p} size={24} label="" />
                            <span className="text-[13px] text-text">{p.name}</span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </Popover>
              )}
            </span>
          )}
        </div>
      )}

      {body && (
        <p className={`mt-2 max-w-[66ch] pl-[var(--gutter)] text-[16px] leading-[1.55] whitespace-pre-line text-text @2xl:text-[17px] @2xl:leading-[1.6] ${quiet ? "text-text/90" : ""}`}>
          {body}
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="ml-1 text-[14px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
              {expanded ? t("moments.readLess") : t("moments.readMore")}
            </button>
          )}
        </p>
      )}

      {moment.media && <div className={`mt-3 ${quiet ? "ml-[var(--gutter)]" : "-mx-[var(--bleed)] @2xl:mx-0 @2xl:ml-[var(--gutter)]"}`}>{<MediaBlock media={moment.media} quiet={quiet} />}</div>}

      {/* foot — R3 §44/§46: one clean action row, then one quiet presence line */}
      <div className="mt-2.5 flex items-center gap-2 pl-[var(--gutter)] text-[13px] leading-none tabular-nums @2xl:gap-3" data-sb-actions>
        {/* R3 §44 — one calm row: the verb, the feeling, one quiet human-presence line. Every
            numeric fact is no longer its own action. */}
        {!quiet && (
          <button
            type="button"
            onClick={(e) => openConversation(true, e.currentTarget)}
            className="sb-press inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--hair)] px-3.5 font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-3"
            data-sb-respond
          >
            <RespondMark on={false} />
            {t("moments.respond")}
          </button>
        )}
        {/* While previewing as public these render for the stand-in (no "yours") but are inert:
            a preview never writes an Expression or a Resonance. Outside the preview the DOM is
            exactly as before. */}
        {!quiet && (previewing ? <span className="contents" inert data-sb-preview-inert><ExpressionControl moment={moment} /></span> : <ExpressionControl moment={moment} />)}
        {!quiet && (previewing ? <span className="contents" inert data-sb-preview-inert><ResonateControl moment={moment} /></span> : <ResonateControl moment={moment} />)}
        <span className="ml-auto flex items-center gap-1">
          <button type="button" disabled aria-disabled="true" title={t("moments.viewInLifeLater")} className="hidden min-h-9 items-center gap-1.5 rounded-full px-2 text-muted opacity-60 @2xl:inline-flex">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-dashed border-steel" />
            {t("moments.viewInLife")}
          </button>
          <span className="relative">
            <button type="button" aria-label={t("moments.more")} aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} className="sb-transition inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)] @2xl:h-9 @2xl:w-9">
              <Ellipsis size={17} />
            </button>
            {moreOpen && (
              <Popover onClose={() => { setMoreOpen(false); setConfirmDelete(false); setPrivacyOpen(false); }} label={isSelf ? t("moments.yourMoment") : t("moments.thisMoment")} align="right">
                {isSelf ? (
                  <>
                    <MenuItem onClick={() => { setMoreOpen(false); onEdit(moment); }}>{t("moments.edit")}</MenuItem>
                    <MenuItem onClick={() => setPrivacyOpen((v) => !v)} expanded={privacyOpen}>{t("moments.changePrivacy")}</MenuItem>
                    {privacyOpen && (
                      <div role="group" aria-label={t("moments.privacyGroupAria")} className="mb-1 flex flex-col pl-3">
                        {(["public", "friends", "onlyme"] as Privacy[]).map((p) => {
                          const pName = p === "public" ? t("privacy.public") : p === "friends" ? t("privacy.friends") : t("privacy.onlyMe");
                          return (
                            <MenuItem key={p} onClick={() => { dispatch({ type: "privacy", id: moment.id, privacy: p }); setMoreOpen(false); setPrivacyOpen(false); say(t("moments.nowPrivacy", { privacy: p === "onlyme" ? t("moments.onlyYou") : pName })); }} checked={moment.privacy === p}>
                              {pName}
                            </MenuItem>
                          );
                        })}
                      </div>
                    )}
                    {!confirmDelete ? (
                      <MenuItem onClick={() => setConfirmDelete(true)}>{t("moments.delete")}</MenuItem>
                    ) : (
                      // A20 — the confirmation is part of the menu: its question is the group's name
                      // and focus lands on the safe choice (Keep), never on <body>.
                      <div role="group" aria-labelledby={`${uid}-delq`} className="mt-1 border-t border-[var(--hair)] px-3 pt-2 pb-1 text-[13px]">
                        <p id={`${uid}-delq`} className="text-text">{t("moments.deleteConfirm")}</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" role="menuitem" onClick={() => { leaveAfter(t("moments.deletedAnnounce")); dispatch({ type: "delete", id: moment.id }); }} className="rounded-full border border-[var(--hair)] px-3 py-1.5 font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">{t("moments.delete")}</button>
                          <button type="button" role="menuitem" autoFocus onClick={() => { setConfirmDelete(false); setMoreOpen(false); }} className="rounded-full px-3 py-1.5 text-muted hover:text-text focus-visible:outline-[var(--focus)]">{t("moments.keep")}</button>
                        </div>
                      </div>
                    )}
                    <MenuItem disabled>{t("moments.viewInLifeLaterMenu")}</MenuItem>
                  </>
                ) : (
                  <>
                    {/* While previewing, a stranger's menu is shown as a stranger would see it, paused. */}
                    <MenuItem disabled={previewing} onClick={() => { setMoreOpen(false); say(t("moments.reported")); }}>{t("moments.report")}</MenuItem>
                    <MenuItem disabled={previewing} onClick={() => { leaveAfter(t("moments.hiddenAnnounce")); dispatch({ type: "hide", id: moment.id }); }}>{t("moments.hide")}</MenuItem>
                    <MenuItem disabled={previewing} onClick={copyLink}>{t("moments.copyLink")}</MenuItem>
                    <MenuItem disabled>{t("moments.viewInLifeLaterMenu")}</MenuItem>
                  </>
                )}
              </Popover>
            )}
          </span>
        </span>
      </div>
      {/* Stage 23 — the Celestial Field mounts HERE, below the accepted action row, never
          inside it: that row is `flex` with no wrap, so a full-width child is shrunk to zero.
          One additive anchor; the row above is structurally unchanged. */}
      {!quiet && <div data-sb-resonate-anchor={moment.id} />}
      {toast && (
        <p role="status" className="mt-1 pl-[var(--gutter)] text-[12px] text-muted">
          {toast}
        </p>
      )}

      {/* R3 §45 — HUMAN PRESENCE: one quiet line under the actions. Who felt something, and how
          much was said. It answers "are people here?" — never "how popular is this?" */}
      <div className="mt-2 flex items-center gap-2 pl-[var(--gutter)] text-[13px] leading-none tabular-nums" data-sb-presence>
        {!quiet && <ExpressionSummary moment={moment} />}
        {!quiet && <ResonanceSummary moment={moment} />}
        <button
          type="button"
          aria-expanded={notesOpen}
          aria-controls={`${uid}-notes`}
          onClick={(e) => (notesOpen ? setNotesOpen(false) : openConversation(moment.notes.length === 0, e.currentTarget))}
          className="sb-transition inline-flex min-h-9 items-center gap-1 text-muted hover:text-text focus-visible:outline-[var(--focus)]"
          data-sb-responses={topNotes.length}
        >
          {moment.notes.length === 0 ? t("moments.writeResponse") : tp("moments.responsesN", moment.notes.length)}
          {moment.notes.length > 0 && !(topNotes.length > INLINE_DEPTH) && <ChevronDown size={13} className={`sb-transition ${notesOpen ? "rotate-180" : ""}`} />}
        </button>
      </div>
      {/* R2 §64 — one recent human response as a quiet preview; the full conversation opens on request */}
      {!notesOpen && topNotes.length > 0 && (
        <button type="button" onClick={(e) => openConversation(false, e.currentTarget)} data-sb-response-preview className="sb-press mt-2 flex min-h-8 w-full max-w-[62ch] items-baseline gap-2 pl-[calc(var(--gutter)+14px)] text-left text-[13px] leading-[1.4] focus-visible:outline-[var(--focus)]">
          {/* each inline run truncates ITSELF (nested spans inside one clipped parent would still
              report full-width rects to the frame-escape checker) */}
          <span className="shrink-0 font-medium text-text">{personOf(topNotes[topNotes.length - 1].authorId).name.split(" ").slice(0, 2).join(" ")}</span>
          <span className="min-w-0 flex-1 truncate text-muted">{topNotes[topNotes.length - 1].text}</span>
        </button>
      )}
      {notesOpen && <Notes moment={moment} topNotes={topNotes} id={`${uid}-notes`} />}
      {focusedConv && <MomentConversation moment={moment} topNotes={topNotes} focusComposer={focusedConv === "write"} onClose={closeConversation} />}
    </article>
  );
}

function Dot() {
  return <span aria-hidden className="shrink-0 text-[var(--rule)]">·</span>;
}

export function RespondMark({ on, size = 10 }: { on: boolean; size?: number }) {
  return (
    <span aria-hidden className="relative inline-block" style={{ width: size, height: size }}>
      <span className={`absolute inset-0 rounded-full border ${on ? "border-[var(--boom)]" : "border-steel"}`} />
      <span className={`absolute inset-[2px] rounded-full bg-[var(--boom)] transition-transform duration-150 ${on ? "scale-100" : "scale-0"}`} />
    </span>
  );
}

/* ---------- popover & menu ---------- */

export function Popover({ children, onClose, label, align = "left" }: { children: React.ReactNode; onClose: () => void; label: string; align?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass an inline onClose; keep the latest in a ref so the effect below runs ONCE per
  // opening (it used to re-run on every parent render and snap focus back to the first item).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const root = ref.current;
    // Phase 4.4-A (A20) — the control that opened the menu, to return focus to on close. The
    // trigger is the popover's previous sibling in every use; activeElement is the fallback
    // (browsers that don't focus a clicked button).
    const active = document.activeElement as HTMLElement | null;
    const sibling = root?.previousElementSibling as HTMLElement | null;
    const opener = sibling?.matches("button") ? sibling : active && active !== document.body ? active : null;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>("[role^=menuitem]:not([disabled])") ?? []);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      // role=menu keyboard contract: arrows / Home / End move between the menu's own items.
      if (!root?.contains(document.activeElement)) return;
      const list = items();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      const go = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length].focus(); };
      if (e.key === "ArrowDown") go(i + 1);
      else if (e.key === "ArrowUp") go(i < 0 ? list.length - 1 : i - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(list.length - 1);
    };
    const onDown = (e: PointerEvent) => {
      if (root && !root.contains(e.target as Node) && !(e.target as HTMLElement).closest("[aria-expanded=true]")) closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onDown);
    const first = root?.querySelector<HTMLElement>("button:not([disabled]),[tabindex='0']");
    (first ?? root)?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onDown);
      // Focus goes back to the trigger — unless something else has claimed it on purpose (the
      // Composer opened by Edit, a Person card opened from the list).
      requestAnimationFrame(() => {
        const current = document.activeElement;
        if (current && current !== document.body && current.isConnected) return;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <div ref={ref} role="menu" tabIndex={-1} aria-label={label} className={`absolute z-20 mt-1 min-w-44 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] p-1 text-[13px] shadow-[0_12px_32px_-16px_rgba(0,0,0,.45)] focus-visible:!outline-none ${align === "right" ? "right-0" : "left-0"}`}>
      {children}
    </div>
  );
}

export function MenuItem({ children, onClick, disabled, checked, expanded }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; checked?: boolean; expanded?: boolean }) {
  return (
    <button
      type="button"
      role={checked !== undefined ? "menuitemradio" : "menuitem"}
      disabled={disabled}
      aria-disabled={disabled}
      aria-expanded={expanded}
      aria-checked={checked}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)] disabled:opacity-50 disabled:hover:bg-transparent ${checked ? "font-medium" : ""}`}
    >
      {checked !== undefined && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${checked ? "bg-[var(--boom)]" : "border border-steel"}`} />}
      {children}
    </button>
  );
}

/* ---------- notes ---------- */

const SHOW_TOP = 3;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
/** Phone-only: grows a small control's pointer target to 44×44 without changing the layout (A21). */
const HIT44 = "relative after:absolute after:-inset-2 after:content-[''] @2xl:after:hidden";

function Notes({ moment, topNotes, id }: { moment: MomentT; topNotes: Note[]; id: string }) {
  const { personOf, previewing } = useSocial();
  const { t, tp } = useT();
  const [showAll, setShowAll] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  // R2 §49 — a just-sent response settles once at its truthful place, then is still.
  const [fresh, setFresh] = useState<string | null>(null);
  const sent = (nid: string) => { setFresh(nid); window.setTimeout(() => setFresh(null), 700); };
  const shown = showAll ? topNotes : topNotes.slice(0, SHOW_TOP);
  const hiddenCount = topNotes.length - shown.length;
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={rootRef} id={id} className="relative mt-3 pl-[calc(var(--gutter)+14px)]">
      {/* R2 §31–§33 — the RESPONSE BRANCH: one quiet stroke from the Almanac spine into the
          conversation. These people are responding to THIS memory — never a per-comment tree. */}
      <span aria-hidden data-sb-response-branch className="pointer-events-none absolute top-[-4px] h-[20px] rounded-bl-[12px] border-b border-l border-[var(--rule)]" style={{ left: "var(--rule-x)", width: "calc(var(--gutter) + 6px - var(--rule-x))" }} />
      {topNotes.length === 0 && <p className="text-[13px] text-muted">{t("conv.empty")}</p>}
      <ul className="flex flex-col gap-2.5">
        {shown.map((n) => {
          const replies = moment.notes.filter((r) => r.parentId === n.id);
          return (
            <li key={n.id}>
              <NoteRow note={n} momentId={moment.id} fresh={fresh === n.id} onReply={() => setReplyTo(replyTo === n.id ? null : n.id)} replying={replyTo === n.id} />
              {replies.length > 0 && (
                <ul className="mt-2 flex flex-col gap-2 pl-8">
                  {replies.map((r) => (
                    <li key={r.id}>
                      <NoteRow note={r} momentId={moment.id} depth={2} fresh={fresh === r.id} onReply={() => setReplyTo(replyTo === n.id ? null : n.id)} replying={false} />
                    </li>
                  ))}
                </ul>
              )}
              {replyTo === n.id && !previewing && (
                <div className="mt-2 pl-8">
                  <NoteComposer momentId={moment.id} parentId={n.id} autoFocus onDone={() => { setReplyTo(null); requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-sb-note="${n.id}"] [data-sb-reply-toggle]`)?.focus({ preventScroll: true })); }} onSent={sent} placeholder={t("conv.replyTo", { name: personOf(n.authorId).name.split(" ")[0] })} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-[13px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
          {tp("conv.viewMoreN", hiddenCount)}
        </button>
      )}
      {showAll && topNotes.length > SHOW_TOP && (
        <button type="button" onClick={() => setShowAll(false)} className="mt-2 ml-3 text-[13px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">
          {t("conv.collapse")}
        </button>
      )}
      {/* A preview as the public writes nothing — the composer is the viewer's own, not a stranger's. */}
      {!previewing && (
        <div className="mt-3">
          {/* a note you just wrote must be visible even if the thread was collapsed */}
          <NoteComposer momentId={moment.id} placeholder={t("conv.writePlaceholder")} onDone={() => setShowAll(true)} onSent={sent} />
        </div>
      )}
    </div>
  );
}

/**
 * MOMENT CONVERSATION — the focused surface (R3 §48–§51).
 *
 * A short exchange belongs inline in the Almanac. Once a conversation has real depth, a phone
 * cannot hold both the feed's rhythm and the discussion, so the responses move to their own
 * surface — which keeps a compact MEMORY HEADER at the top so the reader never loses what is
 * being talked about (§50). It is still one Moment's conversation: no conversation list, no
 * presence dots, no typing status. Chat remains a different product (§51).
 *
 * Phase 4.4-A (P0-5, A5–A8): the same conversation model as inline — Reply writes under its
 * parent; Respond lands the cursor in the composer; Escape and Tab belong to the top-most layer
 * (a Person card or a menu opened from here closes first); focus returns to the opener; the page
 * behind never scrolls through it; a just-sent response is revealed.
 */
function MomentConversation({ moment, topNotes, focusComposer, onClose }: { moment: MomentT; topNotes: Note[]; focusComposer: boolean; onClose: () => void }) {
  const { me, personOf, previewing } = useSocial();
  const { t, tp, locale } = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const authorRaw = personOf(moment.authorId);
  const author = personViewFor(me, authorRaw);
  const at = new Date(moment.at);
  const pos = momentLifeFor(me, authorRaw, at);
  const thumb = moment.media?.kind === "photos" ? moment.media.items[0].src : moment.media?.kind === "video" ? moment.media.poster.src : undefined;

  const backToReply = (parent: string) => requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-sb-note="${parent}"] [data-sb-reply-toggle]`)?.focus({ preventScroll: true }));
  const sent = (nid: string) => {
    setFresh(nid);
    window.setTimeout(() => setFresh(null), 700);
    // "center", not "nearest": the row's one-shot settle is a transform, and aligning an edge to a
    // row that is still settling left it a few pixels under the list's edge. (The last row simply
    // scrolls to the end.)
    requestAnimationFrame(() => requestAnimationFrame(() => listRef.current?.querySelector(`[data-sb-note="${nid}"]`)?.scrollIntoView({ block: "center" })));
  };

  useEffect(() => {
    const el = ref.current;
    const composer = el?.querySelector<HTMLTextAreaElement>("[data-sb-conv-composer] textarea");
    // Reading: focus the responses list itself, so arrow keys / Space scroll IT, not the page.
    (focusComposer && composer ? composer : listRef.current ?? el)?.focus({ preventScroll: true });
    // A layer above this one — a Person card, an open ⋯ menu, a response being edited — owns
    // Escape and Tab first; this surface only answers when it is the top of the stack.
    // A Person card is a separate layer and owns every key. A menu or a response being edited sit
    // INSIDE this dialog: they own Escape (they close first), while Tab stays trapped here.
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector("[data-sb-person-card]")) return;
      if (e.key === "Escape") {
        if (el?.querySelector("[role=menu]") || (e.target as HTMLElement | null)?.closest?.("[data-sb-note-editing]")) return;
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.getClientRects().length > 0);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const cur = document.activeElement as HTMLElement | null;
      const inside = !!cur && el.contains(cur);
      if (e.shiftKey ? !inside || cur === first || cur === el : !inside || cur === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    // The page behind never scrolls through this layer — neither touch nor wheel. Only the
    // responses list (whose overscroll is contained) and a composer with its own overflow scroll.
    const root = rootRef.current;
    const guard = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const scrolls = (n: HTMLElement | null | undefined) => !!n && n.scrollHeight > n.clientHeight + 1;
      if (scrolls(target?.closest<HTMLElement>("textarea")) || scrolls(target?.closest<HTMLElement>("[data-sb-conv-scroll]"))) return;
      e.preventDefault();
    };
    root?.addEventListener("wheel", guard, { passive: false });
    root?.addEventListener("touchmove", guard, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey, true);
      root?.removeEventListener("wheel", guard);
      root?.removeEventListener("touchmove", guard);
    };
    // Mounts once per opening; `focusComposer` is decided by what opened it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-y-0 left-1/2 z-[60] -translate-x-1/2" style={{ width: "var(--frame-w, 100vw)", maxWidth: "100vw" }} data-sb-conversation-surface={moment.id}>
      <button type="button" aria-label={t("common.close")} onClick={onClose} className="sb-scrim-in absolute inset-0 cursor-default touch-none bg-[var(--surface-scrim,rgba(20,28,42,.14))]" />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("conv.surfaceAria", { name: author.name })}
        className="sb-surface-in absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--card-edge)] bg-[var(--sheet-solid)] text-text shadow-[0_-16px_44px_-20px_rgba(0,0,0,.45)] focus-visible:!outline-none"
      >
        {/* THE MEMORY HEADER — what are we talking about (§50) */}
        <header className="flex items-start gap-3 border-b border-[var(--hair)] px-3 py-2.5">
          <button type="button" onClick={onClose} aria-label={t("search.back")} className="sb-press -ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-conversation-back>
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
          <PersonIdentity viewer={me} subject={authorRaw} at={at} size={28} />
          <span className="min-w-0 flex-1 text-[13px] leading-[1.35]">
            <span className="block truncate font-medium text-text">{author.name}</span>
            <span className="block truncate text-[12px] text-muted tabular-nums">
              {pos.exact ?? pos.band}
              <span aria-hidden> · </span>
              {sbDate(locale, moment.at)}
              {moment.place ? <><span aria-hidden> · </span>{moment.place}</> : null}
            </span>
            {moment.text && <span className="mt-0.5 block truncate text-[12px] text-muted">{moment.text}</span>}
          </span>
          {thumb && (
            <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-[var(--sheet-raised)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            </span>
          )}
        </header>

        <div ref={listRef} tabIndex={0} aria-label={tp("moments.responsesN", moment.notes.length)} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 focus-visible:outline-[var(--focus)]" data-sb-conv-scroll>
          <p className="pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{tp("moments.responsesN", moment.notes.length)}</p>
          <ul className="flex flex-col gap-3">
            {topNotes.map((n) => {
              const replies = moment.notes.filter((r) => r.parentId === n.id);
              const toggle = () => setReplyTo(replyTo === n.id ? null : n.id);
              return (
                <li key={n.id}>
                  <NoteRow note={n} momentId={moment.id} fresh={fresh === n.id} onReply={toggle} replying={replyTo === n.id} />
                  {replies.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-2 pl-8">
                      {replies.map((r) => (<li key={r.id}><NoteRow note={r} momentId={moment.id} depth={2} fresh={fresh === r.id} onReply={toggle} replying={false} /></li>))}
                    </ul>
                  )}
                  {replyTo === n.id && !previewing && (
                    <div className="mt-2 pl-8" data-sb-conv-reply={n.id}>
                      <NoteComposer momentId={moment.id} parentId={n.id} autoFocus onDone={() => { setReplyTo(null); backToReply(n.id); }} onSent={sent} placeholder={t("conv.replyTo", { name: personOf(n.authorId).name.split(" ")[0] })} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <span role="status" aria-live="polite" className="sr-only" data-sb-announcer />
        {!previewing && (
          <div className="border-t border-[var(--hair)] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))]" data-sb-conv-composer>
            <NoteComposer momentId={moment.id} placeholder={t("conv.writePlaceholder")} onSent={sent} />
          </div>
        )}
      </div>
    </div>
  );
}

function NoteRow({ note, momentId, depth = 1, fresh = false, onReply, replying }: { note: Note; momentId: string; depth?: 1 | 2; fresh?: boolean; onReply: () => void; replying: boolean }) {
  const { me, personOf, dispatch, previewing } = useSocial();
  const { t, locale } = useT();
  const world = useWorldMaybe();
  const author = personOf(note.authorId);
  const own = note.authorId === me.id;
  const rowRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const long = note.text.length > NOTE_LIMIT;
  const shown = long && !more ? note.text.slice(0, NOTE_LIMIT).replace(/\s+\S*$/, "") + "…" : note.text;
  const backToMenu = () => requestAnimationFrame(() => rowRef.current?.querySelector<HTMLElement>("[data-sb-note-more]")?.focus());
  const saveEdit = () => {
    if (text.trim()) dispatch({ type: "noteEdit", momentId, noteId: note.id, text: text.trim() });
    setEditing(false);
    backToMenu();
  };
  const cancelEdit = () => {
    setEditing(false);
    setText(note.text);
    backToMenu();
  };
  // A20 — a deleted response leaves focus in the conversation (its composer, else its toggle).
  const remove = () => {
    setMenu(false);
    const scope = rowRef.current?.closest<HTMLElement>("[data-sb-conversation-surface], [data-sb-moment]");
    dispatch({ type: "noteDelete", momentId, noteId: note.id });
    requestAnimationFrame(() => requestAnimationFrame(() => (scope?.querySelector<HTMLElement>("[data-sb-response-composer] textarea") ?? scope?.querySelector<HTMLElement>("[data-sb-responses]"))?.focus()));
    announce(t("conv.deletedAnnounce"));
  };

  return (
    <div ref={rowRef} className={`flex items-start gap-2.5 text-[14px] leading-[1.45] ${fresh ? "sb-reveal" : ""}`} data-sb-note={note.id} data-sb-depth={depth}>
      {/* the name beside it already says who — the ring is decorative for a screen reader (A22) */}
      <PersonIdentity viewer={me} subject={author} at={new Date(note.at)} size={20} label="" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {!editing ? (
          <p className="min-w-0 break-words">
            {/* R2 §44 — the response author is a doorway to their Person World */}
            {!own && world && !previewing && !author.unavailable ? (
              <button type="button" onClick={(e) => world.openPerson(author.id, e.currentTarget)} className="rounded-[4px] font-medium text-text underline-offset-4 hover:underline focus-visible:outline-[var(--focus)]" data-sb-note-author={author.id}>
                {author.name}
              </button>
            ) : (
              <span className="font-medium text-text">{author.name}</span>
            )}
            {own && <span className="ml-1 text-[12px] text-muted">{t("conv.you")}</span>}{" "}
            {/* A16 — the person's own line breaks are kept */}
            <span className="whitespace-pre-line text-text">{shown}</span>
            {long && (
              <button type="button" onClick={() => setMore((v) => !v)} className="ml-1 text-[13px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                {more ? t("moments.readLess") : t("moments.readMore")}
              </button>
            )}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            className="flex items-end gap-2"
            data-sb-note-editing
          >
            {/* A16 — multi-line like the composer: Enter saves, Shift+Enter is a new line, Escape cancels */}
            <textarea
              value={text}
              rows={Math.min(6, Math.max(1, text.split("\n").length))}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              aria-label={t("conv.editAria")}
              autoFocus
              // the cursor lands after the person's own words, ready to continue them
              onFocus={(e) => { const n = e.currentTarget.value.length; e.currentTarget.setSelectionRange(n, n); }}
              className="min-h-8 w-full max-w-[52ch] resize-none border-b border-[var(--hair)] bg-transparent py-1 text-[14px] leading-[1.4] text-text outline-none focus-visible:border-steel"
            />
            <button type="submit" className="text-[13px] font-medium text-text focus-visible:outline-[var(--focus)]">{t("composer.save")}</button>
            <button type="button" onClick={cancelEdit} className="text-[13px] text-muted focus-visible:outline-[var(--focus)]">{t("common.cancel")}</button>
          </form>
        )}
        {/* phones: 8px above the row so the 44px hit areas below never cover the words above */}
        <div className="mt-2 flex items-center gap-3 text-[12px] text-muted tabular-nums @2xl:mt-0.5">
          {/* A15 — a response written on another day states that day, never only a clock */}
          <time dateTime={note.at}>{isToday(note.at) ? formatTime(note.at) : `${sbDate(locale, note.at)} · ${formatTime(note.at)}`}</time>
          {note.edited && <span>{t("moments.edited")}</span>}
          {depth === 1 && (
            <button type="button" onClick={onReply} disabled={previewing} aria-expanded={replying} className={`${HIT44} min-h-7 hover:text-text focus-visible:outline-[var(--focus)] disabled:opacity-50`} data-sb-reply-toggle>
              {t("conv.reply")}
            </button>
          )}
          <span className="relative ml-auto">
            <button type="button" aria-label={t("moments.more")} aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={`${HIT44} inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]`} data-sb-note-more>
              <Ellipsis size={14} />
            </button>
            {menu && (
              <Popover onClose={() => setMenu(false)} label={t("conv.responseLabel")} align="right">
                {own ? (
                  <>
                    <MenuItem onClick={() => { setMenu(false); setEditing(true); }}>{t("moments.edit")}</MenuItem>
                    <MenuItem onClick={remove}>{t("moments.delete")}</MenuItem>
                  </>
                ) : (
                  <MenuItem disabled={previewing} onClick={() => { setMenu(false); setToast(t("moments.reported")); setTimeout(() => setToast(null), 1800); }}>{t("moments.report")}</MenuItem>
                )}
              </Popover>
            )}
          </span>
        </div>
        {toast && <p role="status" className="text-[12px] text-muted">{toast}</p>}
      </div>
    </div>
  );
}

export function NoteComposer({ momentId, parentId, placeholder, autoFocus, onDone, onSent }: { momentId: string; parentId?: string; placeholder: string; autoFocus?: boolean; onDone?: () => void; onSent?: (id: string) => void }) {
  const { me, dispatch, state } = useSocial();
  const { t } = useT();
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (state.simulateFailure) {
        setFailed(true);
        return;
      }
      const nid = `n-${Date.now().toString(36)}`;
      dispatch({ type: "note", momentId, note: { id: nid, authorId: me.id, text: body, at: localISO(now()), parentId, responses: 0 } });
      setText("");
      setFailed(false);
      onSent?.(nid);
      onDone?.();
    }, 350);
  };

  return (
    <div className="flex items-start gap-2.5" data-sb-response-composer>
      <PersonIdentity viewer={me} subject={me} size={20} className="mt-1" />
      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-2 border-b border-[var(--hair)] focus-within:border-steel">
          <textarea
            ref={ref}
            rows={1}
            value={text}
            autoFocus={autoFocus}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`;
            }}
            onKeyDown={(e) => {
              // A17 — while an input method is composing (Devanagari, Chinese, …) Enter confirms
              // the candidate; it must never send a half-written response.
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="min-h-8 w-full max-w-[56ch] resize-none overscroll-contain bg-transparent py-1.5 text-[14px] leading-[1.4] text-text outline-none placeholder:text-muted"
          />
          {/* R2 §36 — extremely lightweight: identity, human words, send. The two dead
              placeholder buttons (feeling/image) promised nothing and are gone; Unicode emoji
              enter through the person's own keyboard (§37). */}
          <span className="flex shrink-0 items-center pb-0.5 text-muted">
            <button type="button" onClick={send} disabled={!text.trim() || sending} aria-label={t("conv.send")} className="sb-press inline-flex min-h-9 items-center justify-center rounded-full px-2.5 text-[12px] font-medium text-text hover:bg-steel/15 disabled:opacity-40 focus-visible:outline-[var(--focus)]">
              {sending ? "…" : t("conv.send")}
            </button>
          </span>
        </div>
        {/* A26 — a failed send is announced, not only shown */}
        <p className="mt-1 text-[11px] text-muted" aria-live="polite">
          {failed ? (
            <>
              {t("conv.failedKept")}{" "}
              <button type="button" onClick={send} className="font-medium text-text underline-offset-2 hover:underline focus-visible:outline-[var(--focus)]">{t("common.retry")}</button>
            </>
          ) : (
            <span className="hidden @2xl:inline">{t("conv.enterSends")}</span>
          )}
        </p>
      </div>
    </div>
  );
}
