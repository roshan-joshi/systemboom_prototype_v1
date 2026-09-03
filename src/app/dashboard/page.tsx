import Link from "next/link";
import { Bell, MessageCircle, Search } from "lucide-react";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/bits";
import { demoUser } from "@/lib/mock/demo-user";

/**
 * Authenticated-demo placeholder. The real SYSTEMBOOM Life / Social
 * experience is built in later phases — this proves the shell direction.
 */
export default function DashboardPlaceholder() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="material-floating sticky top-0 z-10 flex items-center gap-3 px-4 py-3 sm:px-8">
        <Link href="/" aria-label="SYSTEMBOOM home" className="shrink-0">
          <SystemboomLogo height={22} />
        </Link>

        <div
          className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-full border border-edge bg-content px-4 py-2.5 text-muted sm:flex"
          role="presentation"
        >
          <Search size={16} strokeWidth={1.75} />
          <span className="text-sm">Universal search — prototype, coming later</span>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <span className="relative inline-flex h-11 w-11 items-center justify-center text-muted">
            <MessageCircle size={19} strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5">
              <Badge count={2} label="2 unread chats" />
            </span>
          </span>
          <span className="relative inline-flex h-11 w-11 items-center justify-center text-muted">
            <Bell size={19} strokeWidth={1.75} />
            <span className="absolute -top-0.5 -right-0.5">
              <Badge count={4} label="4 notifications" />
            </span>
          </span>
          <ThemeToggle />
          <Avatar src={demoUser.avatar} name={demoUser.name} size="sm" />
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <p className="type-label">SYSTEMBOOM Life</p>
        <h1 className="type-title max-w-2xl text-balance">
          Welcome back, {demoUser.name.split(" ")[0]}.
        </h1>
        <p className="type-body max-w-lg text-balance text-muted">
          Your Social feed, Circle of Life and Mini Chat are assembled in the
          next phases. This placeholder proves the authenticated shell.
        </p>
        <span className="type-meta rounded-full border border-edge px-4 py-1.5">
          Prototype — dashboard experience arrives in a later phase
        </span>
        <Link
          href="/style-lab"
          className="sb-transition inline-flex min-h-11 items-center rounded-full border border-edge bg-content px-6 font-medium transition-[border-color] hover:border-steel/50"
        >
          Review the visual system →
        </Link>
      </section>
    </main>
  );
}
