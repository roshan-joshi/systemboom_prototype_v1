"use client";

/**
 * THE ROOT — Cosmos, SYSTEMBOOM's universal Home.
 *
 * Cosmos stays fully immersive: the frozen experience carries its own controls,
 * and no application chrome is layered over it. This wrapper adds only the two
 * seams the one-product model needs:
 *   · `?identity=1` — a personal destination asked for an identity, so the gate
 *     (which lives with the root experience) opens here and continues after
 *   · a contextual "Enter my world" for a person who is already signed in —
 *     an invitation, not a navigation system
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CosmosEntry } from "@/components/cosmos/CosmosEntry";
import { useIdentity } from "@/components/identity/IdentityProvider";
import { LanguageMenu } from "@/components/i18n/LanguageMenu";
import { useT } from "@/lib/i18n/LocaleProvider";
import { byId } from "./destinations";
import { peekIntent } from "./intent";

export function CosmosRoot() {
  const identity = useIdentity();
  const { t } = useT();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current || !identity.hydrated) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("identity") !== "1") return;
    opened.current = true;
    q.delete("identity");
    window.history.replaceState(null, "", `${window.location.pathname}${q.toString() ? `?${q}` : ""}`);
    if (!identity.activeIdentity) identity.gate.openGate("signin", null);
  }, [identity]);

  const signedIn = !!identity.activeIdentity;
  const intent = typeof window === "undefined" ? null : peekIntent();
  const onward = byId(intent === "life" ? "life" : "world");

  return (
    <>
      <CosmosEntry />
      {/* S1 — pre-login language, accessible in Cosmos (§55–§57). A person who has not
          signed in still chooses their language here; the choice persists and a new account
          inherits it. Immersive tone so it sits on the cosmos ground without application chrome.
          Once signed in, language lives in Account/Settings, never as a top-bar icon (§72). */}
      {!signedIn && (
        // Placed below the SYSTEMBOOM logo on the left — clear of the frozen Cosmos overlay's
        // own top-right chip cluster (sound · theme · identity gate), so nothing overlaps the
        // gate opener; the immersive surface opens downward into empty space.
        <div className="pointer-events-none fixed top-16 left-3 z-40 sm:top-20 sm:left-6">
          <div className="pointer-events-auto">
            <LanguageMenu tone="immersive" />
          </div>
        </div>
      )}
      {signedIn && (
        <div className="pointer-events-none fixed right-3 bottom-4 z-40 sm:right-6 sm:bottom-6">
          <Link
            href={onward.route}
            onClick={() => {
              try {
                sessionStorage.setItem("sb-arrive", "1");
              } catch {
                /* the entry still works, just without the resolve */
              }
            }}
            className="sb-transition pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-[rgba(10,13,20,.55)] px-4 text-[13px] font-medium text-[#EEF2F8] backdrop-blur-md hover:bg-[rgba(10,13,20,.72)] focus-visible:outline-[var(--focus)]"
            data-sb-enter-world
          >
            {t("nav.enterMyWorld")}
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      )}
    </>
  );
}
