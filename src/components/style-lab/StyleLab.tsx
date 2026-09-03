"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig } from "motion/react";
import {
  Bell,
  Heart,
  Home,
  MessageCircle,
  Orbit,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton, PrimaryAction, SecondaryAction } from "@/components/ui/actions";
import { FloatingControl, GlassSurface, MediaSurface, Surface } from "@/components/ui/surfaces";
import { Badge, EmptyState, Pill, Skeleton } from "@/components/ui/bits";
import { demoUser } from "@/lib/mock/demo-user";
import {
  CircleSample,
  IdentityMini,
  LifeCounterDemo,
  MotionStudies,
  useDemoLifeTime,
} from "./demos";

/* ---------- section scaffold ---------- */

function Study({
  index,
  title,
  intro,
  children,
}: {
  index: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 py-12 sm:py-16" aria-label={title}>
      <header className="max-w-2xl">
        <p className="type-label mb-2">
          <span className="text-boom-strong">{index}</span> · Study
        </p>
        <h2 className="type-title">{title}</h2>
        <p className="type-body mt-3 text-muted">{intro}</p>
      </header>
      {children}
    </section>
  );
}

/* ---------- token swatches ---------- */

const SWATCHES = [
  ["Background", "var(--bg)"],
  ["Surface", "var(--surface)"],
  ["Content", "var(--content)"],
  ["Steel", "var(--steel)"],
  ["Ice", "var(--ice)"],
  ["Boom", "var(--boom)"],
  ["Success", "var(--success)"],
  ["Warning", "var(--warning)"],
  ["Danger", "var(--danger)"],
  ["Focus", "var(--focus)"],
] as const;

/* ---------- page ---------- */

export function StyleLab() {
  const life = useDemoLifeTime();
  const [filter, setFilter] = useState("Friends");
  const [query, setQuery] = useState("");
  const [loved, setLoved] = useState(true);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh pb-28">
        {/* Floating shell — the Layer-2 material working as real navigation */}
        <header className="sticky top-0 z-20 px-3 pt-3 sm:px-6">
          <div className="material-floating mx-auto flex max-w-6xl items-center gap-3 rounded-2xl px-4 py-2.5 sm:px-5">
            <Link href="/" aria-label="SYSTEMBOOM home">
              <SystemboomLogo height={20} priority />
            </Link>
            <span className="type-label hidden md:inline">Visual System · Phase 0</span>
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle labeled />
              <Avatar src={demoUser.avatar} name={demoUser.name} size="sm" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 sm:px-6">
          {/* HERO */}
          <section className="flex flex-col gap-8 pt-16 pb-8 sm:pt-24">
            <p className="type-label">SYSTEMBOOM design laboratory</p>
            <h1 className="type-hero max-w-4xl text-balance">
              A visual system for a whole life.
            </h1>
            <p className="type-body max-w-2xl text-muted">
              Every decision here answers one question: does it serve the
              moment, the person or the time? Content stays solid and human.
              SYSTEMBOOM material floats above it. Red speaks only when
              something matters now.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Surface className="flex flex-col items-center gap-5 px-6 py-10">
                <SystemboomLogo height={34} />
                <p className="type-meta text-center">
                  Official transparent lockup — primary mark for navigation and
                  UI in both themes. Its chrome letterforms carry their own
                  contrast.
                </p>
              </Surface>
              <div className="relative overflow-hidden rounded-2xl border border-edge">
                <Image
                  src="/brand/systemboom-plate.jpeg"
                  alt="SYSTEMBOOM brand plate — gunmetal wordmark on brand-red field"
                  width={1253}
                  height={832}
                  className="h-full w-full object-cover"
                />
                <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,6,10,0.75)] to-transparent px-5 pt-8 pb-3 text-sm text-white">
                  Brand plate — reserved for hero and marketing moments, never
                  tiled through the UI.
                </p>
              </div>
            </div>
          </section>

          {/* 01 MATERIALS */}
          <Study
            index="01"
            title="Three materials, one hierarchy"
            intro="Layer 1: human content — solid, photographic, readable. Layer 2: SYSTEMBOOM material — translucent, floating, transient. Layer 3: Boom energy — one red, spent carefully."
          >
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <MediaSurface
                src="/mock/media-lake.svg"
                alt="Alpine lake at first light (placeholder artwork)"
                aspect="16/10"
                caption={
                  <span className="flex flex-wrap items-center gap-2">
                    Layer 1 · A moment carries the frame
                    <span className="rounded-full bg-boom px-2.5 py-0.5 text-xs font-bold tracking-wider text-white">
                      NOW
                    </span>
                  </span>
                }
              />
              <div className="flex flex-col gap-4">
                <GlassSurface className="p-5">
                  <p className="type-label mb-1.5">Layer 2 · Floating material</p>
                  <p className="type-body text-muted">
                    Navigation, search, menus and Circle controls hover on this
                    blurred, luminous surface — present, never heavy.
                  </p>
                </GlassSurface>
                <Surface className="p-5">
                  <p className="type-label mb-1.5">Layer 1 · Content surface</p>
                  <p className="type-body text-muted">
                    Posts and writing sit on calm, solid ground. No glass where
                    people read.
                  </p>
                </Surface>
                <div className="flex items-center gap-3 rounded-2xl border border-boom/40 bg-boom/10 p-5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-boom" />
                  <p className="type-body text-muted">
                    <strong className="text-text">Layer 3 · Boom.</strong>{" "}
                    Active, unread, publishing, now. Nothing else earns red.
                  </p>
                </div>
              </div>
            </div>
          </Study>

          {/* 02 COLOR */}
          <Study
            index="02"
            title="Color under discipline"
            intro="Deep Cosmos and Solar Observatory share one token vocabulary. Flip the theme in the header — both modes are designed, neither is an inversion."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {SWATCHES.map(([name, token]) => (
                <div key={name} className="overflow-hidden rounded-xl border border-edge">
                  <div className="h-16" style={{ background: token }} />
                  <div className="bg-content px-3 py-2">
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Surface className="p-6">
                <p className="type-label mb-4 text-success">Red speaks when</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Pill boom>NOW</Pill>
                  <span className="relative inline-flex">
                    <IconButton label="Notifications">
                      <Bell size={19} strokeWidth={1.75} />
                    </IconButton>
                    <span className="absolute -top-0.5 -right-0.5">
                      <Badge count={4} label="4 unread notifications" />
                    </span>
                  </span>
                  <IconButton
                    label={loved ? "Remove Love reaction" : "React with Love"}
                    active={loved}
                    onClick={() => setLoved((v) => !v)}
                  >
                    <Heart size={19} strokeWidth={1.75} fill={loved ? "currentColor" : "none"} />
                  </IconButton>
                  <PrimaryAction>Share moment</PrimaryAction>
                </div>
              </Surface>
              <Surface className="p-6">
                <p className="type-label mb-4 text-danger">Red never</p>
                <p className="type-body text-muted">
                  Backgrounds, borders-for-decoration, headings, gradients,
                  hover states of neutral controls, charts by default. When
                  everything is loud, nothing is.
                </p>
              </Surface>
            </div>
          </Study>

          {/* 03 TYPOGRAPHY */}
          <Study
            index="03"
            title="Typography that carries a life"
            intro="Geist Sans for voice, Geist Mono for time. Fluid sizes — nothing tiny, nothing shouting."
          >
            <Surface className="flex flex-col gap-7 p-6 sm:p-10">
              <div>
                <p className="type-meta mb-2">Identity hero</p>
                <p className="type-hero">Moments become memory.</p>
              </div>
              <div>
                <p className="type-meta mb-2">Page title</p>
                <p className="type-title">Your Circle of Life</p>
              </div>
              <div>
                <p className="type-meta mb-2">Section title</p>
                <p className="type-section">May 2016 · Langtang trek</p>
              </div>
              <div className="max-w-xl">
                <p className="type-meta mb-2">Social post body</p>
                <p className="type-body">
                  Reached Gosaikunda before sunrise. The whole valley was
                  holding its breath — and then the light arrived all at once.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-10 gap-y-5">
                <div>
                  <p className="type-meta mb-2">Metadata</p>
                  <p className="type-meta">12 May 2016 · 05:41 · Friends</p>
                </div>
                <div>
                  <p className="type-meta mb-2">Label</p>
                  <p className="type-label">Photo Journey</p>
                </div>
                <div>
                  <p className="type-meta mb-2">Counter</p>
                  <p className="type-counter text-2xl">12,720 days</p>
                </div>
              </div>
            </Surface>
          </Study>

          {/* 04 CONTROLS */}
          <Study
            index="04"
            title="Controls people trust"
            intro="44px minimum touch targets, visible focus, honest states. Try tabbing through this study."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Surface className="flex flex-col gap-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <PrimaryAction>
                    <Plus size={17} strokeWidth={2.25} /> Share moment
                  </PrimaryAction>
                  <SecondaryAction>Save to Life</SecondaryAction>
                  <SecondaryAction disabled>Publishing…</SecondaryAction>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="type-label">Universal search</span>
                  <span className="flex items-center gap-2.5 rounded-full border border-edge bg-surface px-4 py-3 transition-[border-color] focus-within:border-focus">
                    <Search size={17} strokeWidth={1.75} className="shrink-0 text-muted" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search your life, people, places…"
                      className="w-full bg-transparent outline-none placeholder:text-muted"
                    />
                  </span>
                  <span className="type-meta">
                    {query
                      ? `Search is wired in a later phase — you typed “${query}”.`
                      : "Field is real; results arrive with the dashboard phase."}
                  </span>
                </label>
                <div>
                  <p className="type-label mb-3">Feed context — working filter pattern</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Feed filters">
                    {["Friends", "Recent", "Discover", "My Life"].map((f) => (
                      <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
                        {f}
                      </Pill>
                    ))}
                  </div>
                  <p className="type-meta mt-2">Selected: {filter}</p>
                </div>
              </Surface>

              <div className="flex flex-col gap-5">
                <Surface className="flex flex-col gap-5 p-6 sm:p-7">
                  <p className="type-label">Avatars &amp; presence</p>
                  <div className="flex flex-wrap items-end gap-5">
                    <Avatar src={demoUser.avatar} name={demoUser.name} size="sm" presence="online" />
                    <Avatar src={demoUser.avatar} name={demoUser.name} size="md" presence="away" />
                    <Avatar src={demoUser.avatar} name={demoUser.name} size="lg" presence="offline" />
                    <Avatar src={demoUser.avatar} name={demoUser.name} size="xl" ring />
                  </div>
                </Surface>
                <div className="flex flex-col gap-3">
                  <p className="type-label px-1">Floating dock — desktop &amp; mobile navigation seed</p>
                  <FloatingControl className="self-start px-2">
                    <IconButton label="Home">
                      <Home size={19} strokeWidth={1.75} />
                    </IconButton>
                    <IconButton label="Social" active>
                      <Users size={19} strokeWidth={1.75} />
                    </IconButton>
                    <span className="mx-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-boom text-white">
                      <Plus size={20} strokeWidth={2.25} aria-label="Create" />
                    </span>
                    <IconButton label="Life">
                      <Orbit size={19} strokeWidth={1.75} />
                    </IconButton>
                    <span className="relative">
                      <IconButton label="Chat">
                        <MessageCircle size={19} strokeWidth={1.75} />
                      </IconButton>
                      <span className="absolute -top-0.5 -right-0.5">
                        <Badge count={2} label="2 unread chats" />
                      </span>
                    </span>
                  </FloatingControl>
                  <p className="type-meta px-1">
                    Home · Social · Create · Life · Chat — the mobile bottom
                    navigation concept, already at touch-target scale.
                  </p>
                </div>
              </div>
            </div>
          </Study>

          {/* 05 IDENTITY */}
          <Study
            index="05"
            title="Identity, not a cover photo"
            intro="The seed of the Identity Horizon: the cover breathes into the surface below it, the person leads, and the Life Counter belongs to the identity — not to a widget."
          >
            <IdentityMini life={life} />
          </Study>

          {/* 06 LIFE COUNTER */}
          <Study
            index="06"
            title="Time lived, calculated"
            intro="Computed from the demo user's real date of birth (4 Nov 1991, 06:42). Framed as a life gathered — never a countdown."
          >
            <LifeCounterDemo life={life} />
          </Study>

          {/* 07 CIRCLE LANGUAGE */}
          <Study
            index="07"
            title="The Circle's visual language"
            intro="A first look at the time instrument: quiet geometry, lived bands in steel, and a single red truth."
          >
            <CircleSample life={life} />
          </Study>

          {/* 08 MOTION */}
          <Study
            index="08"
            title="Motion as continuity"
            intro="M1 feedback 140ms · M2 component 220ms · M3 spatial 360ms · M4 cinematic, rarely. Every demo respects prefers-reduced-motion."
          >
            <MotionStudies />
          </Study>

          {/* 09 STATES */}
          <Study
            index="09"
            title="Waiting, empty, focused"
            intro="The in-between states get the same care as the hero states."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Surface className="flex flex-col gap-4 p-6 sm:p-7">
                <p className="type-label">Loading — a post taking shape</p>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </Surface>
              <Surface className="p-6 sm:p-7">
                <p className="type-label mb-4">Empty — an invitation</p>
                <EmptyState
                  title="No moments here yet"
                  hint="This day in your Circle is still open. The best time to add to it is now."
                  action={<PrimaryAction>Share a moment</PrimaryAction>}
                />
              </Surface>
            </div>
          </Study>

          <footer className="flex flex-col items-center gap-3 border-t border-divider pt-10 pb-6 text-center">
            <SystemboomLogo height={18} />
            <p className="type-meta">
              Phase 0 · Visual foundation · All data local &amp; fictional ·
              Prototype, not production
            </p>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}
