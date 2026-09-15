import type { Metadata } from "next";
import { PersonalDestination } from "@/components/shell/PersonalDestination";
import { SocialPreview } from "@/components/style-lab/social/SocialPreview";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · My World",
  description: "Your personal SYSTEMBOOM: your Moments, your people, your life.",
};

/**
 * MY WORLD — the personal Home after identity. One implementation (the accepted
 * Phase 4 build); `/style-lab/social` is its development alias.
 */
export default function MyWorldPage() {
  return (
    <PersonalDestination id="world">
      <SocialPreview product />
    </PersonalDestination>
  );
}
