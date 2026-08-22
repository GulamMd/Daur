import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/server/services/event.service";
import { EventCard } from "@/components/event/event-card";
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

export default async function HomePage() {
  const [upcoming, past] = await Promise.all([listEvents("upcoming"), listEvents("past")]);
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <>
      {/* The race starts in the dark, so the page does too. */}
      <section className="on-asphalt sodium-glow">
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
        {rest.length > 0 && (
          <section>
            <h2 className="eyebrow text-text-muted">Also coming up</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {rest.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {past.length > 0 && (
          <section className={rest.length > 0 ? "mt-14" : ""}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="eyebrow text-text-muted">Past editions</h2>
              <Link
                href="/events?show=past"
                className="text-text-muted hover:text-text text-sm underline underline-offset-4"
              >
                All editions
              </Link>
            </div>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {past.slice(0, 4).map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} past />
                </li>
              ))}
            </ul>
          </section>
        )}
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
        <StatusChip event={event} timeZone={event.timezone} />
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
