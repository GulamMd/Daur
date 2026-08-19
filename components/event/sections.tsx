import Image from "next/image";
import type { ReactNode } from "react";
import type { EventDetail } from "@/server/services/event.service";
import { CategoryBib } from "@/components/event/category-bib";
import { InclusionIcon } from "@/components/event/inclusion-icon";
import { StatusChip } from "@/components/event/status-chip";
import { Markdown } from "@/components/ui/markdown";
import { canRegister } from "@/lib/event-status";
import { formatEventDate, formatTime } from "@/lib/format";

type Props = { event: EventDetail };

/** Consistent shell so section rhythm never depends on each section remembering it. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2 id={`${id}-heading`} className="eyebrow text-text-muted">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero — the only full-bleed dark section. The race starts before sunrise, so
// the page does; everything below is daylight.
// ---------------------------------------------------------------------------

export function HeroSection({ event }: Props) {
  return (
    <section className="on-asphalt sodium-glow">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow rise text-chalk/70">{event.city}</p>
          <StatusChip event={event} timeZone={event.timezone} />
        </div>

        <h1
          className="font-display rise mt-5 text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl"
          style={{ animationDelay: "90ms" }}
        >
          {event.name}
        </h1>

        {event.tagline && (
          <p
            className="rise text-chalk/80 mt-4 max-w-md text-lg"
            style={{ animationDelay: "180ms" }}
          >
            {event.tagline}
          </p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function FactsSection({ event }: Props) {
  const facts = [
    { label: "Date", value: formatEventDate(event.startAt, event.timezone) },
    { label: "Flag-off", value: formatTime(event.startAt, event.timezone) },
    { label: "Venue", value: event.venueName },
    { label: "Distances", value: event.categories.map((c) => c.name).join(" / ") },
  ];

  return (
    <section aria-label="Key facts" className="border-border border-b">
      <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-y-5 px-4 py-6 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="eyebrow text-text-muted">{fact.label}</dt>
            <dd className="tnum text-text mt-1 font-mono text-sm">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function CategoriesSection({ event }: Props) {
  const open = canRegister(event);

  return (
    <Section id="categories" title="Pick your distance">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {event.categories.map((category) => (
          <li key={category.id}>
            <CategoryBib
              category={category}
              city={event.city}
              timeZone={event.timezone}
              eventSlug={event.slug}
              registrationOpen={open}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function AboutSection({ event }: Props) {
  if (!event.aboutMd) return null;
  return (
    <Section id="about" title="About the race">
      <Markdown>{event.aboutMd}</Markdown>
    </Section>
  );
}

export function RulesSection({ event }: Props) {
  if (!event.rulesMd) return null;
  return (
    <Section id="rules" title="Rules and eligibility">
      <Markdown>{event.rulesMd}</Markdown>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function RouteSection({ event }: Props) {
  if (event.routes.length === 0) return null;

  return (
    <Section id="route" title="The route">
      <ul className="space-y-6">
        {event.routes.map((route) => (
          <li key={route.id} className="border-border rounded-token border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-text text-lg font-extrabold tracking-tight">
                {route.category?.name ?? "Whole event"}
              </h3>
              {route.elevationGainM != null && (
                <p className="tnum text-text-muted font-mono text-xs">
                  {route.elevationGainM} m elevation gain
                </p>
              )}
            </div>

            {route.mapImageUrl && (
              <div className="border-border relative mt-4 aspect-[16/9] overflow-hidden rounded border">
                <Image
                  src={route.mapImageUrl}
                  alt={`Route map for ${route.category?.name ?? event.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover"
                />
              </div>
            )}

            {route.descriptionMd && (
              <div className="mt-3">
                <Markdown>{route.descriptionMd}</Markdown>
              </div>
            )}

            {route.gpxUrl && (
              <a
                href={route.gpxUrl}
                className="text-text mt-3 inline-block font-mono text-xs underline underline-offset-4"
              >
                Download GPX
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// A schedule is genuinely a sequence, so the ordered markers here encode
// something true. That is why numbered devices appear nowhere else.
// ---------------------------------------------------------------------------

export function ScheduleSection({ event }: Props) {
  if (event.schedule.length === 0) return null;

  return (
    <Section id="schedule" title="Race morning">
      <ol className="border-border ml-2 border-l">
        {event.schedule.map((item) => (
          <li key={item.id} className="relative py-3 pl-6">
            <span
              aria-hidden="true"
              className="bg-sodium absolute top-[1.35rem] -left-[3px] size-1.5 rounded-full"
            />
            <p className="tnum text-text-muted font-mono text-xs">{item.timeLabel}</p>
            <p className="text-text mt-0.5 font-medium">{item.title}</p>
            {item.description && (
              <p className="text-text-muted mt-0.5 text-sm">{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function InclusionsSection({ event }: Props) {
  if (event.inclusions.length === 0) return null;

  return (
    <Section id="inclusions" title="What's included">
      <ul className="grid gap-4 sm:grid-cols-2">
        {event.inclusions.map((inclusion) => (
          <li key={inclusion.id} className="flex gap-3">
            <InclusionIcon name={inclusion.icon} />
            <div>
              <p className="text-text font-medium">{inclusion.title}</p>
              {inclusion.description && (
                <p className="text-text-muted mt-0.5 text-sm">{inclusion.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function GallerySection({ event }: Props) {
  const gallery = event.images.filter((image) => image.kind === "GALLERY");
  if (gallery.length === 0) return null;

  return (
    <Section id="gallery" title="Past editions">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((image) => (
          <li
            key={image.id}
            className="border-border relative aspect-square overflow-hidden rounded border"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, 320px"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function VenueSection({ event }: Props) {
  const address = [event.addressLine, event.city, event.state, event.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <Section id="venue" title="Getting there">
      <p className="text-text font-medium">{event.venueName}</p>
      <p className="text-text-muted mt-1 max-w-prose text-sm">{address}</p>
      {event.mapsUrl && (
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-text mt-3 inline-block text-sm underline underline-offset-4"
        >
          Open in Google Maps
        </a>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Native <details> so the accordion is keyboard-accessible and works before
// any JavaScript loads.
// ---------------------------------------------------------------------------

export function FaqsSection({ event }: Props) {
  if (event.faqs.length === 0) return null;

  return (
    <Section id="faqs" title="Questions">
      <ul className="border-border border-t">
        {event.faqs.map((faq) => (
          <li key={faq.id} className="border-border border-b">
            <details className="group">
              <summary className="text-text flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="text-text-muted shrink-0 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pb-4">
                <p className="text-text-muted max-w-prose text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------

export function OrganizerSection({ event }: Props) {
  const { organizer } = event;

  return (
    <Section id="organizer" title="Organised by">
      <div className="border-border rounded-token border p-4">
        <p className="font-display text-text text-lg font-extrabold tracking-tight">
          {organizer.name}
        </p>
        {organizer.aboutMd && (
          <div className="mt-2">
            <Markdown>{organizer.aboutMd}</Markdown>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href={`mailto:${organizer.contactEmail}`}
            className="text-text underline underline-offset-4"
          >
            {organizer.contactEmail}
          </a>
          {organizer.instagramUrl && (
            <a
              href={organizer.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-text underline underline-offset-4"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}
