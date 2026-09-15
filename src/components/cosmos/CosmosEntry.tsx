"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { IdentityGate } from "@/components/identity/IdentityGate";
import { useIdentityGate } from "@/components/identity/IdentityProvider";
import { CosmosLoading } from "./CosmosLoading";
import { CosmosFallback } from "./CosmosFallback";

const CosmosExperience = dynamic(() => import("./CosmosExperience"), {
  ssr: false,
  loading: () => <CosmosLoading />,
});

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * Chooses the live Cosmos or the polished static fallback, and mounts the
 * identity gate ABOVE that fork so both paths share one gate. While the gate
 * is open the whole Cosmos subtree is `inert` — no focus, no pointer, no AT.
 */
export function CosmosEntry() {
  const [state, setState] = useState<"checking" | "webgl" | "fallback">("checking");
  const gate = useIdentityGate();

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("cosmos");
    // One-shot client capability probe — must run post-hydration by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(forced === "fallback" || !webglAvailable() ? "fallback" : "webgl");
  }, []);

  const cosmos =
    state === "fallback" ? (
      <CosmosFallback />
    ) : state === "webgl" ? (
      <CosmosExperience />
    ) : (
      <CosmosLoading />
    );

  return (
    <>
      <div inert={gate.open} data-sb-cosmos-root>
        {cosmos}
      </div>
      <IdentityGate />
    </>
  );
}
