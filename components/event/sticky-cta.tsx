import Link from "next/link";
import { EventStatus } from "@/generated/prisma/enums";
import type { EventDetail } from "@/server/services/event.service";
import { effectiveStatus, ctaLabel } from "@/lib/event-status";

/**
 * The single most important conversion element on the site, so it renders a
 * real state for every point in the lifecycle rather than being hidden when
 * registration is shut.
 *
 * Asphalt text ON sodium (7.17:1), never white on sodium — see the contrast
 * rules in docs/design-direction.md.
 */
export function StickyCta({ event }: { event: EventDetail }) {
  const status = effectiveStatus(event);
  const soldOut =
    event.categories.length > 0 &&
    event.categories.every((category) => category.slotsTaken >= category.slotLimit);

  const registerable = status === EventStatus.REGISTRATION_OPEN && !soldOut;
  const label = registerable
    ? "Register"
    : status === EventStatus.REGISTRATION_OPEN && soldOut
      ? "Sold out"
      : ctaLabel(event);

  const distances = event.categories.map((category) => category.name).join(" · ");

  return (
    <div
      className={`sticky bottom-0 z-30 ${registerable ? "bg-accent" : "bg-surface-sunk border-border border-t"}`}
    >
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 ${
          registerable ? "text-accent-text" : "text-text-muted"
        }`}
      >
        <span className="tnum font-mono text-sm">{distances}</span>

        {registerable ? (
          <Link
            href={`/events/${event.slug}/register`}
            className="font-display rounded-token bg-[color:var(--daur-asphalt)] px-4 py-2 text-sm font-extrabold tracking-wide text-[color:var(--daur-bib)] uppercase transition-opacity hover:opacity-90"
          >
            {label}
          </Link>
        ) : (
          <span className="font-display text-sm font-extrabold tracking-wide uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
