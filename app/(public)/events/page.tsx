import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { listEvents, type EventCard as EventCardData } from "@/server/services/event.service";
import { EventCard } from "@/components/event/event-card";
import { EventTabs, EventTabsShell } from "@/components/event/event-tabs";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past Daur road races.",
};

/** Matches the event page, so the two never disagree about a status flip. */
export const revalidate = 60;

export default async function EventsPage() {
  // Both lists are fetched here rather than one per ?show= value: reading the
  // query string on the server would make this route dynamic, and a dynamic
  // route queries Neon on every visit. With a handful of events the extra
  // payload is nothing next to a cold start.
  const [upcoming, past] = await Promise.all([listEvents("upcoming"), listEvents("past")]);

  const upcomingPanel = <EventPanel events={upcoming} filter="upcoming" />;
  const pastPanel = <EventPanel events={past} filter="past" />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">Events</h1>

      {/* useSearchParams renders this boundary's fallback during prerender, so
          the fallback is the real Upcoming tab rather than a spinner — the
          default view ships in the static HTML and crawlers see the full list.
          A ?show=past deep link resolves on hydration. */}
      <Suspense fallback={<EventTabsShell active="upcoming">{upcomingPanel}</EventTabsShell>}>
        <EventTabs upcoming={upcomingPanel} past={pastPanel} />
      </Suspense>
    </div>
  );
}

function EventPanel({ events, filter }: { events: EventCardData[]; filter: "upcoming" | "past" }) {
  if (events.length === 0) return <EmptyState filter={filter} />;

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <li key={event.slug}>
          <EventCard event={event} past={filter === "past"} />
        </li>
      ))}
    </ul>
  );
}

/** An empty screen is an invitation to act, not a dead end. */
function EmptyState({ filter }: { filter: "upcoming" | "past" }) {
  return (
    <div className="py-16">
      {filter === "upcoming" ? (
        <>
          <p className="text-text">No races on the calendar right now.</p>
          <p className="text-text-muted mt-1 text-sm">
            Dates for the next edition go up here first.{" "}
            <Link href="/events?show=past" className="text-text underline underline-offset-4">
              Look at past editions
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="text-text">No past editions yet.</p>
          <p className="text-text-muted mt-1 text-sm">
            <Link href="/events" className="text-text underline underline-offset-4">
              See what&rsquo;s coming up
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
