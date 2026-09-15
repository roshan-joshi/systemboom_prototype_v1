import type { Metadata } from "next";
import { PersonalDestination } from "@/components/shell/PersonalDestination";
import { ChatSurface } from "@/components/world/ChatSurface";

export const metadata: Metadata = {
  title: "SYSTEMBOOM · Chat",
  description: "Conversations inside your World.",
};

/**
 * CHAT — the conversation surface of My World. Same identity, same theme, no
 * second login: an authenticated person moves straight from their World into a
 * conversation. (The live Chat's separate hosted login is a deployment
 * artifact; the live port owes this boundary a shared SYSTEMBOOM session.)
 */
export default function ChatPage() {
  return (
    <PersonalDestination id="chat">
      <ChatSurface />
    </PersonalDestination>
  );
}
