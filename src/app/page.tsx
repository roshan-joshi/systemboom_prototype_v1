import type { Metadata } from "next";
import { CosmosEntry } from "@/components/cosmos/CosmosEntry";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Cosmos",
  description:
    "From the universe to your life. Explore a living solar system — the doorway into SYSTEMBOOM.",
};

/** SYSTEMBOOM COSMOS — space itself is the interface. */
export default function CosmosPage() {
  return <CosmosEntry />;
}
