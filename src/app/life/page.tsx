import type { Metadata } from "next";
import { PersonalDestination } from "@/components/shell/PersonalDestination";
import { CirclePreview } from "@/components/style-lab/circle/CirclePreview";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Life",
  description: "Your Circle of Life — where you are in time.",
};

/** The canonical Life destination. One implementation; `/style-lab/circle` is its development alias. */
export default function LifePage() {
  return (
    <PersonalDestination id="life">
      <CirclePreview product />
    </PersonalDestination>
  );
}
