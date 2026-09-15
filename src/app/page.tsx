import type { Metadata } from "next";
import { CosmosRoot } from "@/components/shell/CosmosRoot";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Cosmos",
  description:
    "From the universe to your life. Explore a living solar system — the root of SYSTEMBOOM.",
};

/** SYSTEMBOOM COSMOS — the root of the application. Space itself is the interface. */
export default function CosmosPage() {
  return <CosmosRoot />;
}
