"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

/** Chooses the live Cosmos or the polished static fallback. */
export function CosmosEntry() {
  const [state, setState] = useState<"checking" | "webgl" | "fallback">("checking");

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("cosmos");
    // One-shot client capability probe — must run post-hydration by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(forced === "fallback" || !webglAvailable() ? "fallback" : "webgl");
  }, []);

  if (state === "fallback") return <CosmosFallback />;
  if (state === "webgl") return <CosmosExperience />;
  return <CosmosLoading />;
}
