import type { Metadata } from "next";
import { CirclePreview } from "@/components/style-lab/circle/CirclePreview";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Circle of Life",
  description: "Phase 5 — the Circle of Life: a person's life as a temporal instrument. Style-lab reference.",
};

export default function CirclePage() {
  return <CirclePreview />;
}
