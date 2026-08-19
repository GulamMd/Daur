import Link from "next/link";

/**
 * Structural shell. The authenticated variant (avatar + dropdown) arrives in
 * Phase 1; the event page's sticky CTA bar arrives in Phase 4.
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
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <Link href="/events" className="text-text-muted hover:text-text transition-colors">
              Events
            </Link>
          </li>
          <li>
            <Link href="/login" className="text-text-muted hover:text-text transition-colors">
              Log in
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
