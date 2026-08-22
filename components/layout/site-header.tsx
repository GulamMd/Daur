import Link from "next/link";
import { HeaderAuthNav } from "@/components/layout/header-auth-nav";

/**
 * Synchronous on purpose. This renders in the root layout, so any request-time
 * data it reads — a session, a cookie, a header — would make every page in the
 * app dynamic. The signed-in state lives in <HeaderAuthNav />, on the client.
 */
export function SiteHeader() {
  return (
    <header className="border-border bg-surface sticky top-0 z-40 border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4"
      >
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-text text-lg font-extrabold tracking-tight">Daur</span>
          <span className="font-deva text-text-muted text-sm" aria-hidden="true">
            दौड़
          </span>
        </Link>

        <ul className="flex items-center gap-5 text-sm">
          <li>
            <Link href="/events" className="text-text-muted hover:text-text transition-colors">
              Events
            </Link>
          </li>
          <HeaderAuthNav />
        </ul>
      </nav>
    </header>
  );
}
