"use client";

/**
 * CHROME — top bar (red plate + flat white in light, glass in dark), text
 * nav with active state, search with grouped results, avatar menu,
 * notifications grouped by day on a small rule. Chrome is the only place
 * cosmic material (glass) is allowed, and only in dark mode.
 *
 * S5 (Discovery + Signal): Search and Notifications become object-aware and
 * join the ONE transient-surface family (`world/TransientSurface.tsx`) —
 * anchored under the bar where they were invoked, My World quiet underneath,
 * Escape/scrim/same-control to leave. Search knows a PERSON (photo + Life
 * Ring, name, safe life band, relationship), a MOMENT (words or media, then
 * the person and the date · life · place coordinate) and a PLACE (the place
 * leads, with how much life is recorded there) apart, and a Moment result or
 * a Moment notification takes the reader straight to that exact Moment in the
 * Almanac (`focusMoment`). No recommendations, no trending, no grouping the
 * data does not already carry.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, MapPin, MessageCircle, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/lib/use-theme";
import { now } from "@/lib/clock";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { ResonanceNotificationMark } from "@/components/celestial/ResonateControl";
import { matchPeople, PLACES, RECENT_SEARCHES, type Moment } from "./data";
import { MenuItem, Popover } from "./Moment";
import { dayLabel, dateKey, formatDate, formatTime, useSocial } from "./store";
import { momentLifeFor } from "./view-model";
import { Brand } from "@/components/shell/Brand";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/identity/IdentityProvider";
import { setTheme } from "@/lib/use-theme";
import { MessagesButton } from "@/components/world/Messages";
import { PeopleButton } from "@/components/world/People";
import { useWorldMaybe } from "@/components/world/WorldProvider";
import { focusMoment } from "@/components/world/focus-moment";
import { useT } from "@/lib/i18n/LocaleProvider";
import { sbDate } from "@/lib/i18n/format";
import { LanguageMenu } from "@/components/i18n/LanguageMenu";

/**
 * MY WORLD's top bar. Global navigation is the SYSTEMBOOM brand alone: the mark
 * goes Home to Cosmos, and one quiet word says whose World this is. Everything
 * else here is utility — search, people, chat, notifications, theme, the
 * account menu — and stays quiet beside the human content. There is no
 * destination menu anywhere.
 */
export function TopBar({
  onBell,
  bellOpen,
  active = "world",
  messages = false,
  onMessages = () => {},
  people = false,
  onPeople = () => {},
  search,
  onSearch,
  surface,
  worldLabel,
  onReturnHome,
}: {
  onBell: () => void;
  bellOpen: boolean;
  active?: string;
  messages?: boolean;
  onMessages?: () => void;
  people?: boolean;
  onPeople?: () => void;
  /** S5 — Search's open state, lifted so the page keeps exactly one transient surface open at a time. Uncontrolled when omitted. */
  search?: boolean;
  onSearch?: (open: boolean) => void;
  /** S5/S6 — the one open utility surface (People / Notifications / Messages), hung from the bar so it sits where it was invoked and stays with the sticky bar. */
  surface?: ReactNode;
  /** Final Social Connection pass §17–18: whose World is this — overrides the destination's own "My World" label only while a visitor is looking at someone else's. */
  worldLabel?: string;
  /** Present only while viewing another person's World — one low-noise route back, from the account control, not a second navigation row. */
  onReturnHome?: () => void;
}) {
  const world = useWorldMaybe();
  const router = useRouter();
  const identity = useIdentity();
  const theme = useTheme();
  const themeNow = theme;
  const { me, state } = useSocial();
  const { t } = useT();
  const unread = state.notifications.filter((n) => n.unread).length;
  const [menu, setMenu] = useState(false);
  const light = theme === "light";
  const barRef = useRef<HTMLDivElement>(null);

  // The bar's real bottom edge in the viewport, published as --sb-bar-h so a surface can cap
  // itself to the space under the bar without guessing: the bar is 56–74px depending on theme
  // and width, and sits 24px down the page until the page scrolls (then sticks at 0). Measured
  // on resize and on scroll (passive), never per frame.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const set = () => el.style.setProperty("--sb-bar-h", `${Math.max(0, Math.round(el.getBoundingClientRect().bottom))}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("scroll", set, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", set);
    };
  }, []);

  return (
    // My World 2030 Visual Leap §14: the shell audit — proportion, material, depth only, never a
    // redesign. The light bar's hard 1px line becomes a soft, layered shadow (the same "premium
    // instrument" material language as the Life Instrument's own shadow, just far quieter); the
    // inner row gains a touch more breathing room. No colour, text, or navigation contract moved.
    // S7: the bar honours a device's top safe area (notch) — additive padding, zero on plain
    // browsers; simulated in evidence, not claimed as real-device Safari verification.
    <div ref={barRef} data-sb-topbar style={{ paddingTop: "env(safe-area-inset-top, 0px)" }} className={`sticky top-0 z-30 ${light ? "bg-[#FFFFFF] shadow-[0_1px_0_rgba(15,21,32,.05),0_10px_24px_-20px_rgba(15,21,32,.18)]" : "px-3 pt-3 @2xl:px-6"}`}>
      {/* Social 2030 Final (self-critique): a longer visitor context label ("{Name}'s World")
          widened this row past 360 — tighter phone gaps/padding fit it, and the brand truncates
          as the safety net for any long name. Desktop spacing is unchanged. S7: the brand word is
          now genuinely flexible (Brand min-w-0 instead of shrink-0), so ONE row holds every
          utility down to 320 — under pressure the context word truncates first, the mark and the
          utilities never. No wrap: a wrapping bar breaks on base sizes before shrinking. */}
      <div className={`flex items-center gap-1 px-2 py-2.5 @2xl:gap-4 @2xl:px-4 ${light ? "" : "material-floating rounded-2xl"}`}>
        <Brand current={active} label={worldLabel} />
        <SearchField open={search} onOpenChange={onSearch} />
        <span className="ml-auto flex shrink-0 items-center gap-0 @2xl:gap-1">
          {world && <PeopleButton open={people} onToggle={onPeople} />}
          {world ? (
            <MessagesButton open={messages} onToggle={onMessages} />
          ) : (
            <button type="button" aria-label={t("chat.laterAria")} title={t("chat.laterLabel")} className="hidden @2xl:inline-flex sb-transition h-9 w-9 items-center justify-center rounded-full @2xl:h-10 @2xl:w-10 text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
              <MessageCircle size={18} strokeWidth={1.75} />
            </button>
          )}
          <button type="button" aria-label={t("notif.aria", { n: unread })} aria-expanded={bellOpen} onClick={onBell} className="sb-transition relative inline-flex h-9 w-9 items-center justify-center rounded-full @2xl:h-10 @2xl:w-10 text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-bell>
            <Bell size={18} strokeWidth={1.75} />
            {unread > 0 && <span aria-hidden className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--boom)]" data-sb-unread-dot />}
          </button>
          <span className="hidden @2xl:inline [&>button]:h-10 [&>button]:min-h-0 [&>button]:w-10 [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0">
            <ThemeToggle />
          </span>
          <span className="relative ml-0.5 @2xl:ml-1">
            <button type="button" aria-label={t("account.menuAria", { name: me.name })} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="inline-flex items-center gap-1 rounded-full focus-visible:outline-[var(--focus)]">
              <PersonIdentity viewer={me} subject={me} size={28} />
              <span aria-hidden className="hidden text-[10px] text-muted @2xl:inline">▾</span>
            </button>
            {menu && (
              <Popover onClose={() => setMenu(false)} label={t("account.title")} align="right">
                <div className="flex items-center gap-2 px-3 py-2">
                  <PersonIdentity viewer={me} subject={me} size={28} />
                  <span className="text-[13px]"><span className="block font-medium text-text">{me.name}</span><span className="text-muted">{me.home}</span></span>
                </div>
                {onReturnHome && (
                  <>
                    <div className="my-1 border-t border-[var(--hair)]" />
                    {/* Final Social Connection pass §19: a low-noise way back while visiting
                        someone else's World — not another Cosmos → Enter my world round trip. */}
                    <MenuItem onClick={() => { setMenu(false); onReturnHome(); }}>
                      {t("world.returnToMyWorld")}
                    </MenuItem>
                  </>
                )}
                <div className="my-1 border-t border-[var(--hair)]" />
                {[
                  { key: "account.statistics" },
                  { key: "account.weather" },
                  { key: "account.exchange" },
                  { key: "settings.title" },
                ].map((x) => (
                  <MenuItem key={x.key} onClick={() => setMenu(false)}>
                    {t(x.key)}
                    <span className="ml-auto text-[11px] text-muted">{t("account.later")}</span>
                  </MenuItem>
                ))}
                <div className="my-1 border-t border-[var(--hair)]" />
                <MenuItem
                  onClick={() => {
                    setTheme(themeNow === "dark" ? "light" : "dark");
                  }}
                >
                  {t("account.appearance")}
                  <span className="ml-auto text-[11px] text-muted" data-sb-appearance-state>{themeNow === "dark" ? t("account.deepCosmos") : t("account.solarObservatory")}</span>
                </MenuItem>
                {/* S1 — authenticated language lives here, in Account, never as a top-bar icon
                    (§72). One control, same design as pre-login Cosmos; the profile preference is
                    authoritative and switching preserves context (no route change, no reload). */}
                <div className="flex items-center justify-between gap-2 px-3 py-2" data-sb-account-language>
                  <span className="text-[13px] text-text">{t("settings.language")}</span>
                  <LanguageMenu />
                </div>
                <div className="my-1 border-t border-[var(--hair)]" />
                <MenuItem
                  onClick={() => {
                    setMenu(false);
                    identity.clearSession();
                    router.push("/");
                  }}
                >
                  {t("account.logout")}
                </MenuItem>
              </Popover>
            )}
          </span>
        </span>
      </div>
      {surface}
    </div>
  );
}

/* ---------- search ---------- */

/** Relationship → chip catalog key (localized at render; empty = no chip). */
const REL_CHIP_KEY: Record<string, string> = { friend: "rel.friends", family: "rel.family", "request-in": "relchip.askedYou", "request-out": "relchip.requested", none: "" };

const GROUP_LABEL = "px-2 pt-1 pb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase";
const ROW = "sb-press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)]";

function SearchField({ open: controlled, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { state, personOf, me, dispatch } = useSocial();
  const world = useWorldMaybe();
  const { t, tp, locale } = useT();
  const [q, setQ] = useState("");
  const [openU, setOpenU] = useState(false);
  const open = controlled ?? openU;
  const setOpen = (o: boolean) => {
    setOpenU(o);
    onOpenChange?.(o);
  };
  const ref = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // True while a Person surface opened from a result is up: the ONE focus that comes back to the
  // field when it closes must not re-open the results (and their scrim) over My World — the
  // query stays, one touch brings the results back. Without this, the accepted flow "close the
  // person, then tap a Moment author" would tap the scrim instead.
  const restoring = useRef(false);
  const id = useId();
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen is stable per render for this purpose
  }, [controlled === undefined]);
  const term = q.trim().toLowerCase();
  // Search sees only what this viewer may see: another person's only-me Moments
  // never reach a result, a count or a place tally.
  const visible = state.moments.filter((m) => m.authorId === me.id || m.privacy !== "onlyme");
  const matches = (m: Moment) => (m.text ?? "").toLowerCase().includes(term) || (m.place ?? "").toLowerCase().includes(term);
  const photos = term ? visible.filter((m) => m.media && matches(m)).slice(0, 4) : [];
  const moments = term ? visible.filter((m) => !m.media && matches(m)).slice(0, 3) : [];
  const people = matchPeople(term, undefined, 4);
  const places = term ? PLACES.filter((p) => p.toLowerCase().includes(term)).slice(0, 4) : [];
  const placeCount = (place: string) => visible.filter((m) => m.place === place).length;
  const empty = term && !photos.length && !moments.length && !people.length && !places.length;

  // §49 return context: the Person surface hands focus back to the SEARCH FIELD (its own
  // opener), whose focus re-opens these results with the same query — not to a row that no
  // longer exists. On a phone the field is hidden, so the search control takes that role.
  const opener = () => (fieldRef.current && fieldRef.current.getClientRects().length > 0 ? fieldRef.current : toggleRef.current);
  const goToMoment = (m: Moment) => {
    setOpen(false);
    dispatch({ type: "reveal", id: m.id });
    focusMoment(m.id);
  };
  const close = () => {
    setOpen(false);
    opener()?.focus({ preventScroll: true });
  };

  return (
    // Phone: the results surface hangs from the BAR (this wrapper is not positioned below @2xl),
    // desktop: it is anchored to the field itself. S7: on a phone the wrapper is a flex row that
    // keeps the toggle right beside the other utilities and can never collapse below the toggle's
    // own 36px — at 320 the brand word truncates instead of Search silently disappearing.
    <div ref={ref} className="min-w-0 flex-1 @max-2xl:flex @max-2xl:min-w-9 @max-2xl:justify-end @2xl:relative @2xl:max-w-[360px]">
      <label className="hidden items-center gap-2 rounded-full border border-[var(--hair)] bg-[var(--sheet-raised)] px-3 py-1.5 text-muted focus-within:border-steel @2xl:flex">
        <Search size={15} strokeWidth={1.75} aria-hidden />
        <span className="sr-only">{t("search.aria")}</span>
        <input
          ref={fieldRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { if (restoring.current) { restoring.current = false; return; } setOpen(true); }}
          onClick={() => setOpen(true)}
          // Escape LEAVES search (closes, blurs) — it must not first wipe the words, which is what a
          // native type=search field does with Escape on its own.
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false); (e.target as HTMLInputElement).blur(); } }}
          placeholder={t("common.search.placeholder")}
          aria-controls={id}
          className="w-full bg-transparent text-[14px] text-text outline-none placeholder:text-muted"
        />
      </label>
      <button ref={toggleRef} type="button" aria-label={t("search.aria")} aria-expanded={open} onClick={() => setOpen(!open)} className="sb-transition inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full @2xl:h-10 @2xl:w-10 text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)] @2xl:hidden" data-sb-search-toggle>
        <Search size={18} strokeWidth={1.75} />
      </button>
      {open && (
        <div id={id} role="region" aria-label="Search results" className="sb-surface-in absolute top-full right-0 left-0 z-10 px-2 pt-1.5 @2xl:right-auto @2xl:left-0 @2xl:w-[440px] @2xl:px-0 @2xl:pt-1.5" data-sb-search-surface>
          <div className="max-h-[min(calc(100dvh-var(--sb-bar-h,60px)-14px-env(safe-area-inset-bottom,0px)),42rem)] overflow-y-auto overscroll-contain rounded-[18px] border border-[var(--card-edge)] bg-[var(--card)] p-2 text-[13px] shadow-[var(--card-shadow)]">
            {/* Phone: the query lives on the surface itself — Back · the words · Clear. The keyboard
                opens at once; results stay above it because the surface scrolls, the page does not. */}
            <div className="flex items-center gap-1 pb-1 @2xl:hidden">
              <button type="button" aria-label={t("search.back")} onClick={close} className="sb-transition inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-search-back>
                <ArrowLeft size={17} strokeWidth={1.75} />
              </button>
              <label className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--hair)] bg-[var(--sheet-raised)] pl-3 pr-1 focus-within:border-steel">
                <span className="sr-only">{t("search.aria")}</span>
                <input
                  type="search"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close(); } }}
                  placeholder={t("common.search.placeholder")}
                  className="min-w-0 flex-1 appearance-none bg-transparent py-1.5 text-[15px] text-text placeholder:text-muted focus-visible:!outline-none [&::-webkit-search-cancel-button]:hidden"
                  data-sb-search-input
                />
                {q && (
                  <button type="button" aria-label={t("search.clear")} onClick={() => setQ("")} className="sb-transition inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-search-clear>
                    <X size={15} strokeWidth={1.75} />
                  </button>
                )}
              </label>
            </div>
            {!term && (
              <>
                {/* §21 zero state: what can be found here — never what is trending. */}
                <p className="px-2 pt-1 pb-1.5 text-[12px] text-muted" data-sb-search-zero>{t("search.zeroHint")}</p>
                <p className={GROUP_LABEL}>{t("search.recent")}</p>
                {RECENT_SEARCHES.map((r) => (
                  <button key={r} type="button" onClick={() => setQ(r)} className="sb-press block w-full rounded-[10px] px-2 py-1.5 text-left text-text hover:bg-steel/12 focus-visible:outline-[var(--focus)]">{r}</button>
                ))}
              </>
            )}
            {empty && (
              // §33 honest no-results: the sentence, and one useful next step. No suggestions.
              <div className="px-2 py-3" data-sb-search-empty>
                <p className="text-muted">{t("search.nothingFor", { q: q.trim() })}</p>
                <button type="button" onClick={() => setQ("")} className="mt-1.5 text-[12px] font-medium text-text underline-offset-2 hover:underline focus-visible:outline-[var(--focus)]">{t("search.clear")}</button>
              </div>
            )}
            {/* PEOPLE — a person leads (§23): photo + Life Ring, name, safe life position, relationship. */}
            {people.length > 0 && (
              <Group title={t("search.people")}>
                {people.map((p) => {
                  const rel = p.id !== me.id && world ? world.relationshipOf(p.id) : null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (p.id !== me.id) {
                          restoring.current = true;
                          world?.openPerson(p.id, opener());
                        }
                      }}
                      className={ROW}
                      data-sb-search-person={p.id}
                    >
                      <PersonIdentity viewer={me} subject={p} size={28} />
                      {/* Social 2030 §2/§12: a name with a trailing metadata caption reads like a
                          generic contacts row. Life position is now the name's own subtitle — the
                          same two-line grammar PersonCard and Moment already use for a person — not
                          a stat parked on the right. Same content, same test contract, no invention. */}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block truncate text-[12px] text-muted tabular-nums" data-sb-search-life>
                          {momentLifeFor(me, p, now()).exact ?? momentLifeFor(me, p, now()).band}
                          {rel && REL_CHIP_KEY[rel] ? ` · ${t(REL_CHIP_KEY[rel])}` : p.home ? ` · ${p.home.split(",")[0]}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </Group>
            )}
            {/* MOMENTS — the words lead, then the person and the date · place coordinate (§24). */}
            {moments.length > 0 && (
              <Group title={t("search.moments")}>
                {moments.map((m) => {
                  const who = personOf(m.authorId);
                  return (
                    <button key={m.id} type="button" onClick={() => goToMoment(m)} className={`${ROW} items-start`} data-sb-search-moment={m.id}>
                      <span className="mt-0.5 shrink-0"><PersonIdentity viewer={me} subject={who} at={new Date(m.at)} size={22} label="" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{m.text}</span>
                        <span className="block truncate text-[12px] text-muted tabular-nums">{who.name} · {sbDate(locale, m.at)}{m.place ? ` · ${m.place}` : ""}</span>
                      </span>
                    </button>
                  );
                })}
              </Group>
            )}
            {/* PHOTOS — media-led Moments: the image leads, its date under it (the accepted grammar). */}
            {photos.length > 0 && (
              <Group title={t("search.photos")}>
                <div className="grid grid-cols-4 gap-1.5 px-2">
                  {photos.map((m) => (
                    <button key={m.id} type="button" onClick={() => goToMoment(m)} className="sb-press rounded-[8px] text-left focus-visible:outline-[var(--focus)]" aria-label={t("search.openMomentAria", { name: `${m.place ?? t("search.momentWord")} · ${personOf(m.authorId).name}`, date: sbDate(locale, m.at) })} data-sb-search-photo>
                      <span className="block aspect-square overflow-hidden rounded-[6px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumbOf(m)} alt="" className="h-full w-full object-cover" />
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-muted tabular-nums">{sbDate(locale, m.at)}</span>
                    </button>
                  ))}
                </div>
              </Group>
            )}
            {/* PLACES — the place leads; how much life is recorded there is its subtitle (§25).
                Choosing one narrows the search to that place — the tally is the truth we have. */}
            {places.length > 0 && (
              <Group title={t("search.places")}>
                {places.map((p) => {
                  const n = placeCount(p);
                  return (
                    <button key={p} type="button" onClick={() => setQ(p)} className={ROW} data-sb-search-place>
                      <MapPin size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p}</span>
                        <span className="block text-[12px] text-muted tabular-nums">{n === 0 ? t("search.noMomentsRecorded") : tp("search.momentsN", n)}</span>
                      </span>
                    </button>
                  );
                })}
              </Group>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <p className={GROUP_LABEL}>{title}</p>
      {children}
    </div>
  );
}
function thumbOf(m: Moment): string {
  if (m.media?.kind === "photos") return m.media.items[0].src;
  if (m.media?.kind === "video") return m.media.poster.src;
  if (m.media?.kind === "link") return m.media.image?.src ?? "";
  return "";
}

/* ---------- notifications ---------- */

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, personOf, me } = useSocial();
  const world = useWorldMaybe();
  const { t, tp } = useT();
  /** The Moment a notification points at — its own date is the coordinate the row states. */
  const momentOf = (id?: string) => (id ? state.moments.find((m) => m.id === id) : undefined);
  const groups = new Map<string, typeof state.notifications>();
  for (const n of [...state.notifications].sort((a, b) => b.at.localeCompare(a.at))) {
    const k = dateKey(n.at);
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }
  const unread = state.notifications.filter((n) => n.unread).length;
  // §41 — a Moment event goes to THAT Moment: reveal it if it is not loaded, land on it, settle.
  const goToMoment = (id: string, momentId?: string) => {
    dispatch({ type: "read", id });
    if (!momentId) return;
    onClose();
    dispatch({ type: "reveal", id: momentId });
    focusMoment(momentId);
  };

  return (
    <section
      aria-label={t("notif.title")}
      className="max-h-[min(calc(100dvh-var(--sb-bar-h,60px)-14px-env(safe-area-inset-bottom,0px)),42rem)] w-full overflow-y-auto overscroll-contain rounded-[20px] border border-[var(--card-edge)] bg-[var(--card)] p-3 shadow-[var(--card-shadow)] @2xl:w-[420px]"
      data-sb-notifications
    >
      {/* Longer languages (ru "Отметить всё прочитанным") wrap as whole units under the title,
          never word-by-word into a stack. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-2 pb-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("notif.title")}</p>
        <span className="ml-auto flex items-center gap-2 text-[12px] whitespace-nowrap">
          {unread > 0 && <span className="text-muted tabular-nums">{tp("notif.unreadN", unread)}</span>}
          <button type="button" onClick={() => dispatch({ type: "readAll" })} disabled={unread === 0} className="font-medium text-text disabled:opacity-40 focus-visible:outline-[var(--focus)]">{t("notif.markAllRead")}</button>
        </span>
      </div>
      {state.notifications.length === 0 && <p className="px-2 py-6 text-center text-[13px] text-muted">{t("notif.nothingNew")}</p>}
      {/* S7 §23 — one scroll owner: the SECTION scrolls (capped to the space under the bar on a
          phone, 42rem on desktop); the old inner @2xl scroller made two nested vertical owners. */}
      <div className="relative">
        {state.notifications.length > 0 && <span aria-hidden className="absolute top-0 bottom-0 left-[9px] w-px bg-[var(--rule)]" />}
        {[...groups.entries()].map(([k, items]) => (
          <div key={k} className="mb-2">
            <p className="relative pl-6 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase"><span aria-hidden className="absolute top-1/2 left-[7px] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--sheet-raised)] ring-1 ring-[var(--rule)]" />{dayLabel(items[0].at)}</p>
            <ul className="mt-1 flex flex-col">
              {items.map((n) => {
                const who = personOf(n.whoId);
                if (n.kind === "request" && world) {
                  const rel = world.relationshipOf(n.whoId);
                  return (
                    <li key={n.id}>
                      <div className={`flex w-full items-center gap-3 rounded-[10px] py-1.5 pr-2 pl-6 ${n.unread ? "" : "opacity-80"}`} data-sb-notification-request={n.whoId}>
                        <button type="button" aria-label={t("notif.openPersonAria", { name: who.name })} onClick={(e) => { dispatch({ type: "read", id: n.id }); world.openPerson(n.whoId, e.currentTarget); }} className="sb-press flex min-w-0 flex-1 items-center gap-3 rounded-[10px] text-left focus-visible:outline-[var(--focus)]">
                          {/* §37 — a human asking to connect: the face + Life Ring get a touch more room than an event row. */}
                          <PersonIdentity viewer={me} subject={who} at={new Date(n.at)} size={32} />
                          <span className="min-w-0 flex-1 text-[13px] leading-[1.4]">
                            <span className="font-medium text-text">{who.name}</span> <span className="text-text">{n.text}</span>
                            {/* Social 2030 Final Delta §2: a dense notification row is
                                IDENTITY-ONLY context — the real photo + Life Ring already say
                                "this is a life"; a band label here was reconsidered and removed
                                (superseded the previous pass's addition — recorded in AGENTS.md). */}
                            <span className="block text-[12px] text-muted tabular-nums">{formatTime(n.at)}</span>
                          </span>
                        </button>
                        {rel === "request-in" ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <button type="button" onClick={() => { world.dispatch({ type: "accept", id: n.whoId }); dispatch({ type: "read", id: n.id }); }} className="sb-press inline-flex min-h-11 items-center rounded-full bg-[var(--boom)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--boom-strong)] focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-2.5" data-sb-notif-accept>{t("rel.accept")}</button>
                            <button type="button" onClick={() => { world.dispatch({ type: "decline", id: n.whoId }); dispatch({ type: "read", id: n.id }); }} className="sb-press inline-flex min-h-11 items-center rounded-full border border-[var(--hair)] px-3 text-[12px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)] @2xl:min-h-9 @2xl:px-2.5" data-sb-notif-decline>{t("rel.decline")}</button>
                          </span>
                        ) : (
                          // §37 — resolves truthfully in place, with the one relationship settle; the list does not jump.
                          <span key={rel} className="shrink-0 text-[12px] text-muted [animation:sb-rel-resolve_200ms_ease-out_both]" data-sb-notif-outcome>{rel === "friend" ? t("notif.nowFriends") : t("notif.declined")}</span>
                        )}
                      </div>
                    </li>
                  );
                }
                const target = momentOf(n.momentId);
                const thumb = target?.media ? thumbOf(target) : "";
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => goToMoment(n.id, n.momentId)} className={`sb-press flex w-full items-center gap-3 rounded-[10px] py-1.5 pr-2 pl-6 text-left hover:bg-steel/10 focus-visible:outline-[var(--focus)] ${n.unread ? "" : "opacity-80"}`} data-sb-notification-moment={n.momentId}>
                      <PersonIdentity viewer={me} subject={who} at={new Date(n.at)} size={24} />
                      <span className="min-w-0 flex-1 text-[13px] leading-[1.4]">
                        <span className="font-medium text-text">{who.name}</span> <span className="text-text">{n.text}</span>
                        {/* Stage 23 — Celestial notifications are SIGNAL tier: a static mark on
                            the existing row. Never the Event renderer, never a second
                            notifications architecture, and the actor identity above is the
                            same privacy-safe PersonIdentity every other row already uses. */}
                        {n.kind === "resonance" && n.resonanceId && (
                          <span data-sb-notification-resonance={n.resonanceId} className="ml-1.5 inline-flex align-[-4px]">
                            <ResonanceNotificationMark resonanceId={n.resonanceId} />
                          </span>
                        )}
                        {target?.at && (
                          <span className="block text-[12px] text-muted tabular-nums" data-sb-notification-coord>
                            {formatDate(target.at)}
                            {target.place ? ` · ${target.place}` : ""}
                          </span>
                        )}
                      </span>
                      {/* §38 — which Moment: its own image where it has one, so the reader recognises it before they arrive. */}
                      {thumb && (
                        <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-[6px] bg-[var(--sheet-raised)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        </span>
                      )}
                      <span className="flex items-center gap-2 text-[12px] text-muted tabular-nums">{formatTime(n.at)}<span aria-label={n.unread ? t("notif.unread") : undefined} className={`h-2 w-2 rounded-full ${n.unread ? "bg-[var(--boom)]" : "border border-[var(--hair)]"}`} /></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
