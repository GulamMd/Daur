import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/server/services/event.service";
import { EventCard } from "@/components/event/event-card";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past Daur road races.",
};

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
] as const;

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const params = await searchParams;
  const filter = params.show === "past" ? "past" : "upcoming";
  const events = await listEvents(filter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">Events</h1>

      <nav aria-label="Filter events" className="mt-6">
        <ul className="border-border flex gap-6 border-b text-sm">
          {TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.key === "upcoming" ? "/events" : "/events?show=past"}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px inline-block border-b-2 px-0.5 pb-3 transition-colors ${
                    active
                      ? "text-text border-[color:var(--daur-sodium)] font-medium"
                      : "text-text-muted hover:text-text border-transparent"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {events.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.slug}>
              <EventCard event={event} past={filter === "past"} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
