/**
 * Shown while a server component streams. Deliberately quiet — a skeleton that
 * mimics the final layout flashes more than it reassures on a fast connection.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <p role="status" aria-live="polite" className="eyebrow text-text-muted">
        Loading…
      </p>
      <div aria-hidden="true" className="mt-6 space-y-3">
        <div className="bg-surface-sunk h-8 w-2/3 rounded" />
        <div className="bg-surface-sunk h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}
