import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listEvents } from "@/server/services/event.service";
import { EventCard } from "@/components/event/event-card";
import { ShowMore } from "@/components/event/show-more";
import { StatusChip } from "@/components/event/status-chip";
import { ctaLabel, canRegister } from "@/lib/event-status";
import { formatEventDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: "Daur — closed-road races in Indian cities" },
  description:
    "Closed-road running events in Indian cities. Register yourself and the people you run with.",
};

/**
 * The "Next race" CTA reads canRegister(), which is evaluated at prerender
 * time, so this tracks the same one-minute cadence as the event page.
 */
export const revalidate = 60;

/** How many cards a grid shows before asking. Matches ShowMore's default. */
const STEP = 6;

export default async function HomePage() {
  // Both lists are bounded. Every card fetched is rendered into the static
  // HTML so the listing stays crawlable, which means an unbounded past archive
  // would grow this page's payload forever. /events is where everything lives.
  const [upcoming, past] = await Promise.all([
    listEvents("upcoming", new Date(), 13),
    listEvents("past", new Date(), 12),
  ]);
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <>
      {/* The race starts in the dark, so the page does too. */}
      <section className="on-asphalt relative isolate overflow-hidden">
        <Image
          src="/images/hero/dawn-road.jpg"
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="-z-20 object-cover opacity-55"
        />
        {/* Order is the whole trick here. The photograph is the ground, the
            scrim puts asphalt back over it so the type has something to sit on,
            and the streetlight goes on TOP of both — it is a light source, and
            a scrim painted over it would put the lamp behind the fog. */}
        <div aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />
        <div aria-hidden="true" className="sodium-glow glow-drift absolute inset-0 -z-10" />

        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <p className="eyebrow rise text-chalk/70">
            Daur <span className="font-deva">दौड़</span>
          </p>
          <h1
            className="font-display rise mt-6 text-5xl leading-[0.9] font-extrabold tracking-tight sm:text-7xl"
            style={{ animationDelay: "90ms" }}
          >
            Before the city
            <br />
            wakes up.
          </h1>
          <p
            className="rise text-chalk/80 mt-6 max-w-md text-base"
            style={{ animationDelay: "180ms" }}
          >
            Closed-road races in Indian cities. Three hours of empty tarmac, then the traffic gets
            it back.
          </p>

          {next ? (
            <NextEvent event={next} />
          ) : (
            <p className="rise text-chalk/70 mt-10 text-sm" style={{ animationDelay: "260ms" }}>
              Dates for the next edition go up here first.
            </p>
          )}
        </div>
      </section>

      {/* Daylight. */}
      <div className="mx-auto max-w-5xl px-4 py-14">
        {/* Unconditional. This section being hidden when there was a single
            event is what made the home page a dead end. */}
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="eyebrow text-text-muted">The calendar</h2>
            <Link
              href="/events"
              className="text-text-muted hover:text-text text-sm underline underline-offset-4"
            >
              All events
            </Link>
          </div>

          {rest.length > 0 ? (
            <ShowMore step={STEP} label="upcoming races">
              {rest.map((event) => (
                <EventCard key={event.slug} event={event} />
              ))}
            </ShowMore>
          ) : (
            <p className="text-text-muted mt-4 text-sm">
              {next
                ? "One race on the calendar right now. The next dates go up here first."
                : "No races on the calendar right now. The next dates go up here first."}
            </p>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="eyebrow text-text-muted">Past editions</h2>
              <Link
                href="/events?show=past"
                className="text-text-muted hover:text-text text-sm underline underline-offset-4"
              >
                All editions
              </Link>
            </div>
            <ShowMore step={STEP} label="past editions">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} past />
              ))}
            </ShowMore>
          </section>
        )}

        <section className="reveal mt-14">
          <hr className="lane-rule" />
          <p className="text-text-muted mt-6 text-sm">
            Every Daur race is run on closed roads, marshalled end to end, and measured.{" "}
            <Link href="/events" className="text-text underline underline-offset-4">
              Browse every edition
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}

function NextEvent({ event }: { event: Awaited<ReturnType<typeof listEvents>>[number] }) {
  const open = canRegister(event);

  return (
    <div
      className="rise border-chalk/25 mt-12 max-w-lg border-t pt-6"
      style={{ animationDelay: "260ms" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-sodium">Next race</p>
        <StatusChip event={event} timeZone={event.timezone} onDark />
      </div>

      <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight">
        <Link href={`/events/${event.slug}`} className="hover:text-sodium transition-colors">
          {event.name}
        </Link>
      </h2>

      <p className="tnum text-chalk/80 mt-2 font-mono text-sm">
        {formatEventDate(event.startAt, event.timezone)} ·{" "}
        {formatTime(event.startAt, event.timezone)} · {event.venueName}
      </p>

      <p className="tnum text-chalk/70 mt-1 font-mono text-sm">
        {event.categories.map((c) => c.name).join("  ·  ")}
      </p>

      <Link
        href={`/events/${event.slug}`}
        className={`rounded-token mt-6 inline-flex h-11 items-center px-5 text-sm font-medium transition-colors ${
          open
            ? "bg-accent text-accent-text hover:brightness-95"
            : "border-chalk/30 text-chalk hover:border-chalk/60 border"
        }`}
      >
        {open ? "Register" : ctaLabel(event)}
      </Link>
    </div>
  );
}
