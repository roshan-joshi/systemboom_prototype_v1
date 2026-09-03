import type { Metadata } from "next";
import { StyleLab } from "@/components/style-lab/StyleLab";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Visual System Lab",
  description:
    "Phase 0 design laboratory — tokens, materials, typography, motion and identity treatments for the SYSTEMBOOM prototype.",
};

export default function StyleLabPage() {
  return <StyleLab />;
}
