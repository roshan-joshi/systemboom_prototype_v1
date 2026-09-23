"use client";

/**
 * THE PERSON SURFACE — who is this, what is my relationship, what can I do,
 * where are they in life at the resolution I am allowed to see.
 *
 * Opened from a Moment's author, a search result, a People row or a
 * notification. One primary relationship action, one communication action
 * where permitted, nothing else. Life stays band-only for anyone who is not
 * the viewer — being a friend does not raise the precision.
 *
 * S5/S6: the destination of every discovery loop, so its system text now
 * routes through the S1 catalog (English byte-identical to the accepted
 * strings) and it arrives with the one transient-surface settle (§53: the
 * photo + Life Ring the reader just selected resolve in place — no zoom, no
 * morphing ring). The relationship action group re-settles on each state
 * change (§63–§64: pending → connected is perceptible, never bouncy).
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, UserCheck, UserPlus, X } from "lucide-react";
import { now } from "@/lib/clock";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { PEOPLE } from "@/components/style-lab/social/data";
import { lifeViewFor, personViewFor } from "@/components/style-lab/social/view-model";
import { useSocial } from "@/components/style-lab/social/store";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useWorld } from "./WorldProvider";

/** Relationship → the stable state word (catalog keys; en byte-identical to the accepted words). */
const REL_KEY: Record<string, string> = {
  friend: "rel.friends",
  family: "rel.family",
  "request-in": "rel.askedToBeFriend",
  "request-out": "rel.requestSent",
  none: "rel.notConnected",
};

export function PersonCard() {
  const world = useWorld();
  const { me, state } = useSocial();
  const { t } = useT();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const id = world.person;

  useEffect(() => {
    if (!id) return;
    const el = ref.current;
    el?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        world.closePerson();
        return;
      }
      // Phase 4.4-A (A8) — an aria-modal dialog keeps Tab inside itself (it used to walk out into
      // whatever lay behind, e.g. an open phone conversation).
      if (e.key !== "Tab") return;
      const dialog = el?.closest<HTMLElement>("[data-sb-person-card]");
      const nodes = Array.from(dialog?.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]") ?? []).filter((n) => n.getClientRects().length > 0 && n.getAttribute("tabindex") !== "-1");
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const cur = document.activeElement as HTMLElement | null;
      const inside = !!cur && !!dialog?.contains(cur);
      if (e.shiftKey ? !inside || cur === first : !inside || cur === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [id, world]);

  if (!id) return null;
  const subject = Object.values(PEOPLE).find((p) => p.id === id);
  if (!subject || subject.id === me.id) return null;

  const at = now();
  const person = personViewFor(me, subject);
  const life = lifeViewFor(me, subject, at);
  const rel = world.relationshipOf(id);
  const band = life.scope === "owner" ? life.band : life.band;

  const message = () => {
    world.closePerson();
    if (window.matchMedia("(min-width: 1024px)").matches) world.dispatch({ type: "openMini", id });
    else router.push(`/chat?c=${id}`);
  };

  const primary = "sb-press inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--boom)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-3.5";
  const quiet = "sb-press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--hair)] px-4 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-3.5";

  return (
    // Phase 4.4-A (A7): z-[66] — above the phone conversation surface (z-[60]) it can be opened
    // from, which used to paint over it; still below the language sheet (z-[70]).
    <div className="fixed inset-0 z-[66] flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:items-center" role="dialog" aria-modal="true" aria-label={t("person.dialogAria", { name: person.name })} data-sb-person-card={id} data-sb-person-rel={rel}>
      <button type="button" aria-label={t("common.close")} onClick={world.closePerson} className="sb-scrim-in absolute inset-0 bg-[var(--scrim)]" />
      <div ref={ref} className="sb-surface-in relative w-full max-w-[400px] rounded-[20px] border border-[var(--card-edge)] bg-[var(--sheet-raised,var(--content))] p-5 shadow-[0_24px_64px_-24px_rgba(0,0,0,.5)]">
        <button type="button" aria-label={t("common.close")} onClick={world.closePerson} className="sb-transition absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
          <X size={16} strokeWidth={1.75} />
        </button>
        <div className="flex items-start gap-4">
          <span className="block shrink-0 rounded-full bg-[var(--sheet-raised,var(--content))] p-[3px]">
            {/* §31: a person card is large enough for documented-memory nuance — a friend/family
                viewer sees density from Moments visible to them; a stranger's ring stays geometry only. */}
            <PersonIdentity viewer={me} subject={subject} at={at} size={56} connected={world.canMessage(id)} moments={state.moments} label={t("life.circleBand", { band })} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="truncate text-[18px] leading-tight font-semibold text-text">{person.name}</p>
            {person.home && <p className="mt-0.5 truncate text-[13px] text-muted">{person.home}</p>}
            {/* Social 2030 §12: this life fact was reading as a caption under a hovercard-style
                name+action block — the residue of a contact card, not a life. It now carries the
                same weight as the name; the relationship word stays present but secondary, and
                its privacy explanation sits right beside it, not stranded after the actions. */}
            <p className="mt-1.5 text-[13px] font-medium text-text tabular-nums">
              {t("life.circleBand", { band })}
              <span aria-hidden className="mx-1.5 font-normal text-muted">·</span>
              <span className="font-normal text-muted" data-sb-person-state>{t(REL_KEY[rel])}</span>
            </p>
            <p className="mt-0.5 text-[11px] leading-[1.4] text-muted">{t("life.exactPositionTheirs")}</p>
          </div>
        </div>
        {/* key={rel}: the action group re-settles once per real state change — pending → connected reads. */}
        <div key={rel} className="mt-4 flex flex-wrap items-center gap-2 [animation:sb-rel-resolve_220ms_ease-out_both]" data-sb-person-actions>
          {rel === "request-in" && (
            <>
              <button type="button" className={primary} onClick={() => world.dispatch({ type: "accept", id })} data-sb-accept>
                <UserCheck size={14} strokeWidth={2} aria-hidden /> {t("rel.accept")}
              </button>
              <button type="button" className={quiet} onClick={() => world.dispatch({ type: "decline", id })} data-sb-decline>
                {t("rel.decline")}
              </button>
            </>
          )}
          {rel === "none" && (
            <button type="button" className={primary} onClick={() => world.dispatch({ type: "add", id })} data-sb-add-friend>
              <UserPlus size={14} strokeWidth={2} aria-hidden /> {t("person.addFriend")}
            </button>
          )}
          {rel === "request-out" && (
            <button type="button" className={quiet} onClick={() => world.dispatch({ type: "cancel", id })} data-sb-cancel-request>
              {t("rel.cancelRequest")}
            </button>
          )}
          {(rel === "friend" || rel === "family") && (
            <>
              <button type="button" className={primary} onClick={message} data-sb-message>
                <MessageCircle size={14} strokeWidth={2} aria-hidden /> {t("rel.message")}
              </button>
              <button type="button" className="sb-transition ml-1 inline-flex min-h-9 items-center rounded-full px-2 text-[12px] text-muted hover:text-text focus-visible:outline-[var(--focus)]" onClick={() => world.dispatch({ type: "remove", id })} data-sb-remove-friend>
                {t("rel.remove")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
