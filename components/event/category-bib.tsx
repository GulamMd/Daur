import Link from "next/link";
import { formatTime, isScarce, slotsRemaining } from "@/lib/format";

type Category = {
  id: string;
  name: string;
  minAge: number | null;
  startTime: Date;
  slotLimit: number;
  slotsTaken: number;
  descriptionMd: string | null;
};

/**
 * The signature element.
 *
 * A race bib is the artifact this whole product exists to produce, and every
 * runner recognises one instantly. The distance is the bib numeral; the city
 * sits above it in small caps; the facts run underneath in mono; a sodium
 * tear-strip runs down the edge.
 *
 * The tear-strip is always visible rather than appearing on hover as the
 * design direction first sketched — a bib without its tear-strip is just a
 * card, and it is the one detail that makes the reference read at a glance.
 */
export function CategoryBib({
  category,
  city,
  timeZone,
  eventSlug,
  registrationOpen,
}: {
  category: Category;
  city: string;
  timeZone: string;
  eventSlug: string;
  registrationOpen: boolean;
}) {
  const left = slotsRemaining(category.slotLimit, category.slotsTaken);
  const soldOut = left === 0;
  const scarce = isScarce(category.slotLimit, category.slotsTaken);
  const selectable = registrationOpen && !soldOut;

  return (
    <article
      className={`border-border bg-surface rounded-bib relative overflow-hidden border transition-all ${
        soldOut ? "opacity-55" : ""
      } ${selectable ? "hover:-translate-y-0.5 hover:border-[color:var(--daur-sodium)]" : ""}`}
    >
      <span aria-hidden="true" className="bg-sodium absolute inset-y-0 left-0 w-1.5" />

      <div className="py-5 pr-5 pl-7">
        <p className="eyebrow text-text-muted">{city}</p>

        <p className="bib-numeral text-text mt-2">
          {selectable ? (
            <Link
              href={`/events/${eventSlug}/register?category=${category.id}`}
              className="after:absolute after:inset-0"
            >
              {category.name}
            </Link>
          ) : (
            category.name
          )}
        </p>

        <dl className="mt-4 flex items-start justify-between gap-4 font-mono text-xs">
          <div>
            <dt className="text-text-muted">Flag-off</dt>
            <dd className="tnum text-text mt-0.5">{formatTime(category.startTime, timeZone)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Minimum age</dt>
            <dd className="tnum text-text mt-0.5">
              {category.minAge == null ? "None" : `${category.minAge}`}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-text-muted">Slots</dt>
            <dd className="mt-0.5">
              {soldOut ? (
                <span className="text-text-muted">Sold out</span>
              ) : (
                <span
                  className={`tnum inline-flex items-center gap-1.5 ${
                    scarce ? "text-sodium-ink" : "text-signal-ink"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${scarce ? "bg-sodium" : "bg-signal"}`}
                  />
                  {left} left
                </span>
              )}
            </dd>
          </div>
        </dl>

        {category.descriptionMd && (
          <p className="text-text-muted mt-4 text-sm leading-relaxed">{category.descriptionMd}</p>
        )}
      </div>
    </article>
  );
}
