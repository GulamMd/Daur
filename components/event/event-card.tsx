import Link from "next/link";
import type { EventCard as EventCardData } from "@/server/services/event.service";
import { StatusChip } from "@/components/event/status-chip";
import { formatEventDate } from "@/lib/format";

/**
 * Deliberately NOT a bib. The bib is the signature element and belongs to race
 * categories on the event page — spending it here would spend the boldness
 * twice and make neither memorable.
 *
 * Every line is real data: the date leads because that is what a runner checks
 * first, then the name, then where, then what distances are on offer.
 */
export function EventCard({ event, past = false }: { event: EventCardData; past?: boolean }) {
  return (
    <article
      className={`border-border bg-surface rounded-bib group relative border transition-colors ${
        past ? "opacity-80" : "hover:border-[color:var(--daur-sodium)]"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow text-text-muted">
            {formatEventDate(event.startAt, event.timezone)}
          </p>
          <StatusChip event={event} timeZone={event.timezone} />
        </div>

        <h3 className="font-display text-text mt-3 text-xl font-extrabold tracking-tight">
          {/* The whole card is the target; this link carries the accessible name. */}
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0">
            {event.name}
          </Link>
        </h3>

        {event.tagline && <p className="text-text-muted mt-1 text-sm">{event.tagline}</p>}

        <p className="text-text-muted mt-2 text-sm">
          {event.venueName} · {event.city}
        </p>

        <hr className="lane-rule my-4" />

        <ul className="flex flex-wrap gap-2">
          {event.categories.map((category) => (
            <li
              key={category.name}
              className="border-border text-text rounded-token tnum border px-2 py-1 font-mono text-xs"
            >
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
