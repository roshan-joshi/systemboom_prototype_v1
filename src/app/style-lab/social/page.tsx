import type { Metadata } from "next";
import { SocialPreview } from "@/components/style-lab/social/SocialPreview";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Social visual language",
  description: "Phase 4.0 design preview — Direction A, The Almanac. Style-lab only.",
};

export default function SocialPreviewPage() {
  return <SocialPreview />;
}
