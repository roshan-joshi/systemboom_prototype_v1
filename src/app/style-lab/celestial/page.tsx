import type { Metadata } from "next";
import { CelestialPreview } from "@/components/celestial/CelestialPreview";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Celestial Resonance",
  description: "Stage 23 Slice 2 — the Celestial Field in isolation. Dev-only reference surface.",
};

export default function CelestialPage() {
  return <CelestialPreview />;
}
