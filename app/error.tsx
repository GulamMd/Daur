"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportError } from "@/lib/report-error";

/**
 * Route-level error boundary.
 *
 * Errors state what happened and what to do next. They do not apologise, and
 * they never show a stack trace to a runner.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, error.digest ? { digest: error.digest } : undefined);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="eyebrow text-sodium-ink">Something broke</p>
      <h1 className="font-display text-text mt-3 text-2xl font-extrabold tracking-tight">
        That page didn&rsquo;t load.
      </h1>
      <p className="text-text-muted mt-2 text-sm">
        The problem is on our side, not yours. Try again — if it keeps happening, the race pages are
        still reachable from the events list.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-accent text-accent-text rounded-token inline-flex h-11 items-center px-4 text-sm font-medium transition-[filter] hover:brightness-95"
        >
          Try again
        </button>
        <Link
          href="/events"
          className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
        >
          All events
        </Link>
      </div>

      {error.digest && (
        <p className="tnum text-text-muted mt-6 font-mono text-xs">Reference: {error.digest}</p>
      )}
    </div>
  );
}
