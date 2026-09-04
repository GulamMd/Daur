"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Progressive reveal over a grid of already-rendered cards.
 *
 * Same trick as <EventTabs />: the server renders the cards and hands them in
 * as children, so the cards themselves never cross into the client bundle —
 * only the decision about how many to show does.
 *
 * Note what this does NOT do: the cards beyond the first `step` are sliced off
 * before rendering, so they are not in the prerendered HTML and a crawler will
 * not see them here. That is fine — /events lists every event and app/sitemap.ts
 * enumerates them all — but it is the reason this is a presentation control and
 * not the canonical listing.
 *
 * Children must be a bare array. React.Children.toArray does not flatten
 * fragments, so wrapping the cards in <>…</> would count as a single child and
 * the slice would be a no-op.
 */
export function ShowMore({
  children,
  step = 6,
  label,
}: {
  children: ReactNode;
  step?: number;
  /** Plural noun for the screen-reader count, e.g. "past editions". */
  label: string;
}) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(step);
  const listRef = useRef<HTMLUListElement>(null);
  const revealedFrom = useRef<number | null>(null);

  // `shown` starts at `step` even when there are fewer items than that, so it
  // has to be clamped before it is shown to anyone.
  const visible = Math.min(shown, items.length);
  const remaining = items.length - visible;
  const paged = items.length > step;

  useEffect(() => {
    const index = revealedFrom.current;
    revealedFrom.current = null;
    // The guard is what stops this stealing focus on first mount.
    if (index === null) return;

    const target = listRef.current?.children[index];
    target?.querySelector<HTMLElement>("a, button")?.focus();
  }, [shown]);

  function reveal() {
    revealedFrom.current = visible;
    setShown(Math.min(visible + step, items.length));
  }

  return (
    <>
      <ul ref={listRef} className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.slice(0, visible).map((item, index) => (
          // scroll-mt clears the 3.5rem sticky header when focus lands here.
          <li key={index} className="reveal scroll-mt-20">
            {item}
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={reveal}
            className="border-border text-text rounded-token hover:bg-surface-sunk inline-flex h-11 items-center px-5 text-sm font-medium transition-colors hover:border-[color:var(--daur-sodium)]"
          >
            {/* A real number, per the copy table in docs/design-direction.md. */}
            Show {Math.min(step, remaining)} more
          </button>
        </div>
      )}

      {/* Only worth announcing when there is actually something to page
          through — "Showing 4 of 4" is noise. */}
      {paged && (
        <p role="status" className="sr-only">
          Showing {visible} of {items.length} {label}.
        </p>
      )}
    </>
  );
}
