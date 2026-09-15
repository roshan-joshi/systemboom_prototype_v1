"use client";

/**
 * PROFILE HERO — the entrance to a person's World, not a social profile page.
 *
 * My World 2030 Visual Leap: the previous pass's redesign (Social 2030 Final
 * Delta §1) correctly removed the Facebook cover-banner + overlapping-avatar
 * GRAMMAR — that stays removed. What was wrong was the execution around it:
 * too much empty space, a real cover capability that never actually rendered,
 * and a photo/ring small enough to read as a generic avatar border. This pass
 * makes the existing cover capability visible as a WORLD HORIZON (real photo,
 * full width, modest height, fading by material transition into the card —
 * never a hard banner edge, nothing overlapping it) and turns the identity
 * into a large dimensional LIFE INSTRUMENT (`LifeRing`'s own `instrument`
 * treatment — thicker machined stroke, the current band raised in radius
 * with its own shadow, owner-only engraved memory texture — geometry FIRST,
 * the "band …" text beside it is confirmation, not the primary signal).
 *
 * Renders from the privacy view model, unchanged: the OWNER sees the Born
 * row, the day count, the contact pill; a VISITOR sees name, place, the ring
 * at band level and the band panel — no Born row, no birth time, no life
 * count. `viewer` may be a technical stand-in (View as public) — this
 * component does not know or care; it only ever reads `life.scope`.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Eye, MessageCircle, UserCheck, UserPlus, Users } from "lucide-react";
import { now } from "@/lib/clock";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { useWorldMaybe } from "@/components/world/WorldProvider";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale, sbDate } from "@/lib/i18n/format";
import { useRouter } from "next/navigation";
import type { Moment, Person } from "./data";
import type { Relationship } from "@/components/world/model";
import { lifeViewFor, personViewFor } from "./view-model";

const REL_WORD_KEY: Partial<Record<Relationship, string>> = { friend: "rel.friends", family: "rel.family" };
const relPrimary = "sb-transition inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--boom)] px-3.5 text-[13px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)]";
const relQuiet = "sb-transition inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--hair)] px-3.5 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]";

/** The Life Instrument's design size — a single ring, CSS-scaled per breakpoint (no responsive pair). */
const INSTRUMENT = 168;
const INSTRUMENT_MOBILE = 116;
const INSTRUMENT_SCALE = (INSTRUMENT_MOBILE / INSTRUMENT).toFixed(4);

export function ProfileHero({
  viewer,
  subject,
  connected = false,
  moments,
  relationship,
  canPreviewPublic = false,
  selfPreview = false,
  onEnterPreview,
  onExitPreview,
  forceNoCover = false,
}: {
  viewer: Person;
  subject: Person;
  connected?: boolean;
  moments?: Moment[];
  /** The acting viewer's relationship to this subject — shown only when it's a stable, symmetric one (friend/family); request/none states stay silent here, PersonCard is the actionable surface. */
  relationship?: Relationship;
  /** The real owner, looking at their own profile, not yet previewing — offer the entry. */
  canPreviewPublic?: boolean;
  /** The owner is currently previewing their own profile through the public's eyes. */
  selfPreview?: boolean;
  onEnterPreview?: () => void;
  onExitPreview?: () => void;
  /** Style-lab harness only — demonstrates the no-cover material fallback without touching fixture data. */
  forceNoCover?: boolean;
}) {
  const at = now();
  const life = lifeViewFor(viewer, subject, at);
  const person = personViewFor(viewer, subject);
  const world = useWorldMaybe();
  const { t, tp, locale } = useT();
  const router = useRouter();
  // Social Freeze Delta: "View as public" passes a non-self stand-in viewer for `viewer` — it
  // does not fork this component's logic. `life`/`person` come from the SAME privacy view model
  // every real visitor renders from, so `owner` is false here for exactly the reason it would be
  // false for a genuine stranger — there is no second, duplicated privacy branch.
  const owner = life.scope === "owner";
  const positionLabel = owner ? life.exact : t("life.circleBand", { band: life.band });
  const firstName = person.name.split(" ")[0];
  // Final Social Connection pass §10–§14: every relationship state is expressed here now, not
  // just the stable friend/family pair — a Person surface that stays silent for "none" or a
  // pending request isn't discoverable, it's a dead end. The ring never carries any of this
  // (§26) — it renders entirely in this text/action row, exactly as the design model requires.
  const relKey = !owner && relationship ? REL_WORD_KEY[relationship] : undefined;
  const relWord = relKey ? t(relKey) : undefined;
  // `connected` already carries world.canMessage(me.id) from the caller (SocialPreview) — the
  // same check heroConnected/heroRelationship are built from; recomputing it against `subject`
  // here would ask the wrong question (subject is always the profile owner, never "the other
  // person" the real signed-in viewer has a relationship with). The same is true of every
  // relationship-changing dispatch below: the id is always `viewer.id`.
  const canMessage = !owner && !!world && connected;
  const canAct = !owner && !!world && !!relationship;
  const cover = forceNoCover ? undefined : person.cover;
  // §55 — a broken World Wall must degrade to the theme atmospheric field, never a broken-image
  // box. Track the SOURCE that failed (not a boolean) so a new cover source is retried without a
  // reset effect.
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const showCover = !!cover && failedCover !== cover;

  const message = () => {
    if (!world) return;
    // The real other person, from world's perspective, is the viewer here (see `canMessage` above)
    // — `subject` is always the profile's own owner, never the counterpart in the conversation.
    if (window.matchMedia("(min-width: 1024px)").matches) world.dispatch({ type: "openMini", id: viewer.id });
    else router.push(`/chat?c=${viewer.id}`);
  };
  const addFriend = () => world?.dispatch({ type: "add", id: viewer.id });
  const cancelRequest = () => world?.dispatch({ type: "cancel", id: viewer.id });
  const acceptRequest = () => world?.dispatch({ type: "accept", id: viewer.id });
  const declineRequest = () => world?.dispatch({ type: "decline", id: viewer.id });

  return (
    <section aria-label={`${person.name} — profile`} className="overflow-hidden rounded-[24px] border border-[var(--card-edge)] bg-[var(--card)] shadow-[var(--card-shadow)] @2xl:rounded-[32px]" data-sb-hero={owner ? "owner" : "visitor"} data-sb-self-preview={selfPreview ? "" : undefined}>
      {selfPreview && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hair)] bg-[var(--sheet-raised)] px-4 py-2" data-sb-viewing-as-public>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            <Eye size={13} strokeWidth={2} aria-hidden /> {t("profile.viewingAsPublic")}
          </span>
          <button type="button" onClick={onExitPreview} className="sb-transition inline-flex min-h-8 items-center rounded-full bg-[var(--boom)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)]" data-sb-return-to-my-world>
            {t("world.returnToMyWorld")}
          </button>
        </div>
      )}

      {/* WORLD HORIZON — the existing cover capability, finally rendered. A real photo becomes
          environmental identity: full width, modest height (never a 2030-huge banner), fading by a
          soft material transition into the card below it — never a hard edge, nothing overlapping
          it (that grammar stays removed). No cover: a quiet theme-material field, never a fabricated
          image. */}
      {/* Social 2030 Final (§20–§22, self-critique #1): the World Wall is ATMOSPHERE, not a
          masthead — the person is the anchor. So the cover is shallower than before (a band of
          environment, not a banner), fades into the card over a longer, eased material transition
          (never a hard edge), and collapses further on a short/landscape viewport (§70) so it can
          never consume the whole first screen. */}
      <div className="relative h-[92px] @2xl:h-[150px] [@media(max-height:520px)]:h-[56px]" data-sb-cover-region data-sb-cover={showCover ? "set" : "fallback"}>
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" onError={() => setFailedCover(cover ?? null)} className="absolute inset-0 h-full w-full object-cover" data-sb-cover-photo />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 140% at 28% 0%, var(--ice) 0%, transparent 62%), radial-gradient(90% 120% at 100% 100%, var(--boom) 0%, transparent 45%)", opacity: 0.34 }}
            data-sb-cover-fallback
          />
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-4/5" style={{ background: "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--card) 55%, transparent) 55%, var(--card) 100%)" }} />
      </div>

      {/* S2 Person World §3–§4: desktop is LEFT-ANCHORED — the person visibly anchors the World,
          not a centered account card (the old-social grammar §57). Everything in this region
          left-aligns at `@2xl`; mobile keeps the proven compact centered stack (§5, §25). */}
      <div className="flex flex-col items-center px-4 pt-2 pb-6 text-center @2xl:max-w-[760px] @2xl:items-start @2xl:px-8 @2xl:pt-4 @2xl:text-left">
        {/* Whose World this is — the one thing the global brand can't say (it never changes with
            whose profile is open). Quiet: a kicker, not a second navigation. Sits in the identity
            region, never pasted over the cover photo itself. */}
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase" data-sb-world-context>
          {owner ? t("world.context.my") : t("world.context.person", { name: firstName })}
        </p>

        {/* Final Social Connection pass §22–§23: the structural centre is PERSON + LIFE, not
            "cover photo + centered avatar + centered name stack" (the old-social test — remove
            the ring and this must not read as a conventional profile). Desktop stops mechanically
            centering everything: the Instrument anchors the left, the name/place/relationship
            column sits beside it, left-aligned — an asymmetric identity composition, not a
            centered card. Mobile keeps the proven centered stack (§25 — 360 stays compact). */}
        <div className="flex flex-col items-center gap-0 @2xl:mt-2 @2xl:flex-row @2xl:items-start @2xl:gap-7">
          {/* The Life Instrument: a real photo inside a dimensional, machined Life Ring. One ring —
              CSS-scaled per breakpoint, not a responsive pair — desktop ~168px, mobile ~116px
              (My World 2030 Visual Leap §4). Nothing overlaps it. */}
          <div className="relative mt-3 h-[116px] w-[116px] shrink-0 @2xl:mt-0 @2xl:h-[168px] @2xl:w-[168px]">
            <div className="origin-top-left @2xl:scale-100" style={{ transform: `scale(${INSTRUMENT_SCALE})` }}>
              {owner ? (
                // §27: the owner's own ring is a meaningful entry to Life — "look closer," not a
                // second unrelated destination. A visitor's ring stays inert: this page already is
                // their viewer-safe Person surface (§28) — there is no exact Circle to open.
                <Link href="/life" aria-label={t("life.openLife")} className="sb-transition block rounded-full focus-visible:outline-[var(--focus)]" data-sb-hero-ring-entry>
                  <PersonIdentity viewer={viewer} subject={subject} at={at} size={INSTRUMENT} connected={connected} moments={moments} label={positionLabel} animateEntry />
                </Link>
              ) : (
                <PersonIdentity viewer={viewer} subject={subject} at={at} size={INSTRUMENT} connected={connected} moments={moments} label={positionLabel} animateEntry />
              )}
            </div>
            {/* S2 §13/§30 — a small change-photo affordance parked in the corner GAP outside the
                ring circle, so the Life Instrument reads clean (never a control pasted over the
                ring, never over the face). */}
            {owner && (
              <button type="button" aria-label={t("profile.changeYourPhoto")} className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--hair)] bg-[var(--card)] text-text shadow-[0_2px_8px_-2px_rgba(0,0,0,.25)] hover:border-steel/60 focus-visible:outline-[var(--focus)]"><Camera size={14} /></button>
            )}
          </div>

          <div className="flex min-w-0 flex-col items-center @2xl:items-start">
            <h1 className="mt-4 flex items-center gap-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em] text-text @2xl:mt-0 @2xl:text-[26px]">
              <span>{person.name}</span>
              {person.verified && <BadgeCheck size={19} className="shrink-0 text-[var(--navy)]" aria-label={t("profile.verified")} />}
            </h1>
            {person.home && <p className="mt-0.5 text-[13px] text-muted">{person.home}</p>}

            {/* Final Social Connection pass §10–§14: relationship is a STATE + ACTION row, not a
                caption. A quiet pill states the current state (or nothing, for "none" — the button
                alone is the state there); the control beside it is always the one meaningful next
                step. Each remounts on `relationship` change so the ~200ms resolve plays once, per
                §32 — never a bounce, glow or particle. */}
            {!owner && relationship && (
              <div key={relationship} className="mt-2.5 flex flex-wrap items-center justify-center gap-2 [animation:sb-rel-resolve_200ms_ease-out_both] @2xl:justify-start" data-sb-hero-relationship={relationship}>
                {relWord && <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--sheet-raised)] px-3.5 text-[13px] font-semibold text-text" data-sb-hero-rel-state>{relWord}</span>}
                {canMessage && (
                  <button type="button" onClick={message} className={relQuiet} data-sb-hero-message>
                    <MessageCircle size={13} strokeWidth={2} aria-hidden /> {t("rel.message")}
                  </button>
                )}
                {relationship === "none" && canAct && (
                  <button type="button" onClick={addFriend} className={relPrimary} data-sb-hero-add-friend>
                    <UserPlus size={14} strokeWidth={2} aria-hidden /> {t("rel.addFriend")}
                  </button>
                )}
                {relationship === "request-out" && (
                  <>
                    <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--sheet-raised)] px-3.5 text-[13px] font-medium text-muted" data-sb-hero-rel-state>{t("rel.requested")}</span>
                    {canAct && (
                      <button type="button" onClick={cancelRequest} className={relQuiet} data-sb-hero-cancel-request>
                        {t("rel.cancelRequest")}
                      </button>
                    )}
                  </>
                )}
                {relationship === "request-in" && (
                  <>
                    <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--sheet-raised)] px-3.5 text-[13px] font-medium text-text" data-sb-hero-rel-state>{t("rel.wantsToConnect")}</span>
                    {canAct && (
                      <>
                        <button type="button" onClick={acceptRequest} className={relPrimary} data-sb-hero-accept>
                          <UserCheck size={14} strokeWidth={2} aria-hidden /> {t("rel.accept")}
                        </button>
                        <button type="button" onClick={declineRequest} className={relQuiet} data-sb-hero-decline>
                          {t("rel.decline")}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Life entry — the human context that makes this a World, not a card. Geometry
                (the instrument above) carries the current band FIRST; this line is text
                confirmation. Self-critique correction: kept in the same asymmetric column as
                name/place/relationship, not centered below it — primary identity reads as one
                cohesive left-aligned block on desktop, not a partial fix that reverts halfway
                down the card. */}
            {owner ? (
              <Link href="/life" className="sb-transition group mt-3 inline-flex items-baseline gap-1.5 rounded-[6px] underline-offset-4 hover:underline focus-visible:outline-[var(--focus)]" data-sb-life-entry>
                <span className="text-[14px] text-text">
                  {t("life.band", { band: life.band })} <span className="text-muted">· {tp("life.daysN", life.totalDays, { n: formatNumberLocale(locale, life.totalDays) })}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted group-hover:text-text">
                  {t("life.word")} <ArrowRight size={11} strokeWidth={2} aria-hidden className="translate-y-[1px]" />
                </span>
              </Link>
            ) : (
              <div className="mt-3 rounded-[16px] border border-[var(--hair)] px-4 py-2.5 text-[13px] text-muted" data-sb-band-panel>
                <span className="font-semibold text-text tabular-nums">{t("life.circleBand", { band: life.band })}</span> — {t("life.exactAgeTheirs")}
              </div>
            )}

            {/* S2 §4/§8: the owner's Born fact and private contact belong WITH the identity —
                one cohesive human block beside the ring — not a centered stack drifting below it.
                Contact stays a desktop-only inline pill (owner-only); on mobile it lives in the
                Manage-profile disclosure so the first screen is person + Life + first Moment. */}
            {owner && (
              <dl className="mt-3 text-[13px] tabular-nums @2xl:mt-2.5">
                <dt className="sr-only">{t("profile.born")}</dt>
                <dd className="text-muted">
                  {sbDate(locale, `${life.birth.birthDate}T00:00:00`)} · {life.precision === "minute" ? life.birth.birthTime : t("profile.birthTimeUnknown")}
                </dd>
              </dl>
            )}
            {owner && (
              <span className="mt-3 hidden max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-1.5 text-[13px] text-text @2xl:inline-flex [@media(max-height:520px)]:!hidden" data-sb-contact>
                <span className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("profile.onlyYouSeeThis")}</span>
                <span>{person.contact?.phone}</span>
                <span className="truncate">{person.contact?.email}</span>
              </span>
            )}
          </div>
        </div>

        {/* S2 §29 / §6 — one subordinate owner footer, never competing with the person above.
            Desktop: View as public + the management controls, plainly and left-aligned in a single
            row. Mobile: View as public sits BESIDE a "Manage profile" disclosure (both small pills
            share one row), so management never consumes first-screen priority and the first screen
            stays person + Life + first Moment. */}
        {owner && (
          <div className="mt-4 flex w-full flex-wrap items-start justify-center gap-x-4 gap-y-2 @2xl:justify-start" data-sb-owner-footer>
            {canPreviewPublic && (
              <button
                type="button"
                onClick={onEnterPreview}
                className="sb-transition inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--hair)] px-3 text-[12px] font-medium text-muted hover:border-steel/60 hover:text-text focus-visible:outline-[var(--focus)]"
                data-sb-view-as-public
              >
                <Eye size={13} strokeWidth={2} aria-hidden /> {t("profile.viewAsPublic")}
              </button>
            )}
            {/* desktop: the management controls, plainly */}
            <span className="hidden items-center gap-4 @2xl:flex [@media(max-height:520px)]:!hidden">
              {person.cover && (
                <button type="button" className="sb-transition inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-change-cover>
                  <Camera size={13} strokeWidth={1.75} aria-hidden /> {t("profile.changeCoverPhoto")}
                </button>
              )}
              <button type="button" className="sb-transition inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                <Users size={13} strokeWidth={1.75} aria-hidden /> {t("profile.whoCanSee")}
              </button>
            </span>
            {/* mobile: management behind one disclosure, beside View as public */}
            <details className="@2xl:hidden [@media(max-height:520px)]:!block" data-sb-owner-manage>
              <summary className="sb-transition inline-flex min-h-8 w-fit cursor-pointer list-none items-center gap-1 rounded-full border border-[var(--hair)] px-3 text-[12px] font-medium text-muted marker:hidden focus-visible:outline-[var(--focus)] [&::-webkit-details-marker]:hidden">
                {t("profile.manageProfile")} <span aria-hidden>▾</span>
              </summary>
              <div className="mt-3 flex flex-col items-center gap-2">
                <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-[14px] border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-1.5 text-[13px] text-text">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("profile.onlyYouSeeThis")}</span>
                  <span>{person.contact?.phone}</span>
                  <span className="truncate">{person.contact?.email}</span>
                </span>
                {person.cover && (
                  <button type="button" className="sb-transition inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-change-cover-mobile>
                    <Camera size={13} strokeWidth={1.75} aria-hidden /> {t("profile.changeCoverPhoto")}
                  </button>
                )}
                <button type="button" className="sb-transition inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                  <Users size={13} strokeWidth={1.75} aria-hidden /> {t("profile.whoCanSee")}
                </button>
              </div>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
