import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="eyebrow text-text-muted">404</p>
      <h1 className="font-display text-text mt-3 text-2xl font-extrabold tracking-tight">
        Nothing here.
      </h1>
      {/* An empty screen is an invitation to act, not a dead end. */}
      <p className="text-text-muted mt-2 text-sm">
        This page doesn&rsquo;t exist, or the race has been taken down.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/events"
          className="bg-accent text-accent-text rounded-token inline-flex h-11 items-center px-4 text-sm font-medium transition-[filter] hover:brightness-95"
        >
          Browse events
        </Link>
        <Link
          href="/"
          className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
