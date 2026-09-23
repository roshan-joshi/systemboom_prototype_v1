"use client";

import Link from "next/link";
import { byId } from "@/components/shell/destinations";
import { takeIntent, peekIntent } from "@/components/shell/intent";

/**
 * SYSTEMBOOM IDENTITY GATE — sign in over the living Cosmos.
 *
 * One dialog, two layouts: a right-anchored spatial sheet under the Sign In
 * chip on desktop, a bottom sheet (DestinationPanel idiom, safe-area aware)
 * on phones. z-50 — above CosmosLoading's z-40. The Cosmos stays live behind
 * a soft scrim; the wrapper in CosmosEntry is `inert` while this is open.
 *
 * Rendered ABOVE the WebGL / fallback fork (see CosmosEntry), so the static
 * fallback has the identical gate. Always mounted; content mounts on open.
 *
 * Honest by construction: no password, no "secure", nothing leaves the
 * browser, and the storage-unavailable case says so in one line.
 */

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { X } from "lucide-react";
import { CHIP_BASE, useChrome } from "@/components/cosmos/overlays";
import { Avatar } from "@/components/ui/Avatar";
import { demoUser } from "@/lib/mock/demo-user";
import { parseBirthDate } from "@/lib/identity/birth";
import type { PrototypeIdentity } from "@/lib/identity/types";
import { easeOut, M2, M3 } from "@/lib/motion";
import { CreateIdentityForm } from "./CreateIdentityForm";
import { useIdentity, type GateView } from "./IdentityProvider";
import { useFocusTrap } from "./useFocusTrap";

const EYEBROW = "text-xs font-semibold tracking-[0.18em] uppercase opacity-60";

function formatBirthDate(birthDate: string): string {
  const p = parseBirthDate(birthDate);
  if (!p) return birthDate;
  return new Date(p.year, p.month - 1, p.day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function IdentityGate() {
  const { gate } = useIdentity();
  const { theme } = useChrome();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {gate.open && (
          <motion.div
            key="identity-gate"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: M2 }}
          >
            <button
              type="button"
              aria-label="Close sign in"
              data-sb-gate-scrim
              onClick={gate.closeGate}
              className={`absolute inset-0 cursor-default ${
                theme === "light" ? "bg-[#0f2038]/30" : "bg-[#02040a]/35"
              }`}
            />
            <GatePanel view={gate.view} />
          </motion.div>
        )}
      </AnimatePresence>
      <p aria-live="polite" className="sr-only">
        {gate.announce}
      </p>
    </MotionConfig>
  );
}

function GatePanel({ view }: { view: GateView }) {
  const identity = useIdentity();
  const { gate } = identity;
  const { chip, panel } = useChrome();
  const uid = useId();
  const container = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useFocusTrap(true, container, {
    initial: heading,
    onEscape: gate.closeGate,
    returnTo: gate.opener,
  });

  // Re-land focus on the heading whenever the view changes.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [view]);

  return (
    <motion.div
      ref={container}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${uid}-title`}
      tabIndex={-1}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: M3, ease: [...easeOut] }}
      className={`absolute overflow-y-auto border backdrop-blur-xl !outline-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[85dvh] max-sm:rounded-t-3xl max-sm:px-5 max-sm:pt-3 max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:top-[4.6rem] sm:right-6 sm:max-h-[calc(100dvh-6rem)] sm:w-[min(92vw,400px)] sm:rounded-3xl sm:p-6 ${panel}`}
    >
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25 sm:hidden" />
      <button
        type="button"
        aria-label="Close sign in"
        onClick={gate.closeGate}
        className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-[#8fc2ff] sm:top-4 sm:right-4"
      >
        <X size={17} />
      </button>

      {view === "signin" && (
        <SignInView uid={uid} headingRef={heading} chip={chip} />
      )}
      {view === "create" && (
        <>
          <p className={EYEBROW}>Create your identity</p>
          <h2
            id={`${uid}-title`}
            ref={heading}
            tabIndex={-1}
            className="mt-1 text-2xl font-semibold tracking-tight !outline-none"
          >
            Who enters this world?
          </h2>
          <CreateIdentityForm
            chip={chip}
            onCancel={() => gate.setView("signin")}
            onSubmit={identity.createAndEnter}
          />
        </>
      )}
      {view === "signedIn" && identity.activeIdentity && (
        <SignedInView
          uid={uid}
          headingRef={heading}
          chip={chip}
          who={identity.activeIdentity}
        />
      )}
    </motion.div>
  );
}

/* ---------- SIGN IN ---------- */

function SignInView({
  uid,
  headingRef,
  chip,
}: {
  uid: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  chip: string;
}) {
  const identity = useIdentity();
  const { gate, created } = identity;
  // Phase 4.4-A owner fixture add-on: the gate reads the ONE demo identity, never a copy of it.
  const demoName = demoUser.name;

  return (
    <>
      <p className={EYEBROW}>Enter SYSTEMBOOM</p>
      <h2
        id={`${uid}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 text-2xl font-semibold tracking-tight !outline-none"
      >
        Your universe. Your world. Your life.
      </h2>
      <p className="mt-3 text-sm leading-relaxed opacity-85">
        Prototype sign-in. No account is created on any server — everything
        stays in this browser.
      </p>
      {identity.hydrated && identity.storageMode === "memory" && (
        <p className="mt-2 text-xs leading-relaxed text-[#ffd28a]">
          This browser can&apos;t remember an identity — it will last until you
          close this tab.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {created ? (
          <>
            <button
              type="button"
              onClick={identity.enterAsCreated}
              className="sb-transition inline-flex min-h-12 w-full items-center gap-3 rounded-full bg-[#d92a20] pr-6 pl-1.5 text-left font-semibold text-white hover:bg-[#f04136] focus-visible:outline-[#8fc2ff]"
            >
              <Avatar src={created.avatar} name={created.name} size="md" />
              <span>
                Enter as {created.name}
                <span className="block text-xs font-normal opacity-75">Your identity</span>
              </span>
            </button>
            <button
              type="button"
              onClick={identity.enterAsDemo}
              className={`${CHIP_BASE} ${chip} w-full`}
            >
              Enter as {demoName} (demo identity)
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={identity.enterAsDemo}
            className="sb-transition inline-flex min-h-12 w-full items-center gap-3 rounded-full bg-[#d92a20] pr-6 pl-1.5 text-left font-semibold text-white hover:bg-[#f04136] focus-visible:outline-[#8fc2ff]"
          >
            <Avatar src={demoUser.avatar} name={demoName} size="md" />
            <span>
              Enter as {demoName}
              <span className="block text-xs font-normal opacity-75">Demo identity</span>
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => gate.setView("create")}
          className={`${CHIP_BASE} ${chip} w-full`}
        >
          {created ? "Create a new identity" : "Create your identity"}
        </button>
        {created && (
          <p className="text-xs leading-relaxed opacity-55">
            A new identity replaces {created.name} in this browser.
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- SIGNED IN (2.2: committed, no transition yet) ---------- */

function SignedInView({
  uid,
  headingRef,
  chip,
  who,
}: {
  uid: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  chip: string;
  who: PrototypeIdentity;
}) {
  const identity = useIdentity();
  const first = who.name.split(" ")[0];
  const birthLine = `Born ${formatBirthDate(who.birthDate)} · ${
    who.birthTimeKnown && who.birthTime ? who.birthTime : "birth time unknown"
  }`;

  return (
    <>
      <p className={EYEBROW}>{who.source === "demo-seed" ? "Demo identity" : "Your identity"}</p>
      <h2
        id={`${uid}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 text-2xl font-semibold tracking-tight !outline-none"
      >
        You&apos;re in, {first}.
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <Avatar src={who.avatar} name={who.name} size="lg" ring />
        <div className="min-w-0">
          <p className="truncate font-semibold">{who.name}</p>
          {who.currentPlace && (
            <p className="truncate text-sm opacity-70">{who.currentPlace.label}</p>
          )}
          <p className="text-sm opacity-70">{birthLine}</p>
        </div>
      </div>
<ContinueInward chip={chip} onGo={identity.gate.closeGate} />
      <button type="button" onClick={identity.gate.closeGate} className={`${CHIP_BASE} ${chip} mt-2 w-full`}>
        Back to the Cosmos
      </button>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[11px] leading-relaxed opacity-50">
          Prototype testing affordance — not sign-out. Clears this sign-in and
          keeps the identity in this browser.
        </p>
        <button
          type="button"
          onClick={identity.clearSession}
          className="mt-1.5 min-h-9 text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:outline-[#8fc2ff]"
        >
          Switch identity
        </button>
      </div>
    </>
  );
}


/**
 * The one thing to do after entering: continue to what the person asked for.
 * A destination they requested before identity (Social or Life) is honoured;
 * otherwise the human world — Social — is the natural place to land. There is
 * no hub in between.
 */
function ContinueInward({ chip, onGo }: { chip: string; onGo: () => void }) {
  // Read once, on the client, from the session's remembered request.
  const [dest] = useState(() => {
    if (typeof window === "undefined") return "world";
    const asked = peekIntent();
    return asked === "world" || asked === "life" ? asked : "world";
  });
  const d = byId(dest);
  return (
    <>
      <p className="mt-4 text-sm leading-relaxed opacity-85">
        {dest === "life"
          ? "Your Circle of Life is one scale inward — where you are in time."
          : "Your Moments, your people and your life. The Cosmos stays one step outward."}
      </p>
      <Link
        href={d.route}
        onClick={() => {
          takeIntent();
          try {
            sessionStorage.setItem("sb-arrive", "1");
          } catch {
            /* entry still works without the resolve */
          }
          onGo();
        }}
        className={`${CHIP_BASE} ${chip} mt-5 w-full justify-center !bg-[#d92a20] !text-white hover:!bg-[#b91f16]`}
        data-sb-enter-world
        data-sb-continue-to={dest}
      >
        {dest === "life" ? "Continue to Life" : "Enter My World"}
      </Link>
    </>
  );
}
