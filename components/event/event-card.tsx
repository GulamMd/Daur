import Image from "next/image";
import Link from "next/link";
import type { EventCard as EventCardData } from "@/server/services/event.service";
import { StatusChip } from "@/components/event/status-chip";
import { formatEventDate } from "@/lib/format";

/**
 * Deliberately NOT a bib. The bib is the signature element and belongs to race
 * categories on the event page — spending it here would spend the boldness
 * twice and make neither memorable. What the card borrows is the tear-strip,
 * on hover only: a promise of a bib rather than a bib.
 *
 * Every line is real data: the date leads because that is what a runner checks
 * first, then the name, then where, then what distances are on offer.
 */
export function EventCard({ event, past = false }: { event: EventCardData; past?: boolean }) {
  return (
    <article className="border-border bg-surface rounded-bib card-lift relative overflow-hidden border">
      <span aria-hidden="true" className="tear-strip" />

      <EventCardMedia event={event} past={past} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow text-text-muted">
            {formatEventDate(event.startAt, event.timezone)}
          </p>
          {/* Stays on the light body, never over the photo: the chip's inks are
              tuned for light surfaces and check:contrast cannot see a stock
              photograph. */}
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

/**
 * A missing cover is a normal state, not a failure — an event can be authored
 * months before there is anything to photograph. So the fallback is designed
 * rather than empty: the longest distance set on asphalt under the streetlight.
 * It reuses the bib vocabulary, carries real data, and costs no bytes.
 *
 * Deliberately not `relative`: the stretched link in the card body resolves
 * against the <article> and paints above this block because it comes later in
 * the DOM. A stacking context here would take the photo out of the click target.
 */
function EventCardMedia({ event, past }: { event: EventCardData; past: boolean }) {
  if (!event.coverImageUrl) {
    const longest = event.categories.reduce<EventCardData["categories"][number] | null>(
      (best, category) =>
        best && best.distanceMeters >= category.distanceMeters ? best : category,
      null,
    );

    return (
      <div className="on-asphalt sodium-glow flex aspect-[16/10] items-center justify-center overflow-hidden">
        {longest && (
          <span aria-hidden="true" className="bib-numeral text-sodium">
            {longest.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-sunk aspect-[16/10] overflow-hidden">
      {/* alt="" on purpose: the card's accessible name is the event name in the
          stretched link, and describing the stock photo would prepend noise to
          every card a screen reader announces. */}
      <Image
        src={event.coverImageUrl}
        alt=""
        width={1200}
        height={750}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
        className={`zoom-media h-full w-full object-cover ${past ? "past-media" : ""}`}
      />
    </div>
  );
}
