import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  countRegistrations,
  listRegistrationsForUser,
} from "@/server/services/registration.service";
import { RegistrationCard } from "@/components/account/registration-card";

export const metadata: Metadata = { title: "Registrations" };

export default async function RegistrationsPage({
  searchParams,
}: PageProps<"/account/registrations">) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (!session?.user?.id) redirect("/login?next=/account/registrations");

  const filter = params.show === "past" ? "past" : "upcoming";
  const [registrations, counts] = await Promise.all([
    listRegistrationsForUser(session.user.id, filter),
    countRegistrations(session.user.id),
  ]);

  const tabs = [
    { key: "upcoming", label: "Upcoming", href: "/account/registrations", count: counts.upcoming },
    { key: "past", label: "Past", href: "/account/registrations?show=past", count: counts.past },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
        Your registrations
      </h1>

      <nav aria-label="Filter registrations">
        <ul className="border-border flex gap-6 border-b text-sm">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px inline-block border-b-2 px-0.5 pb-3 transition-colors ${
                    active
                      ? "text-text border-[color:var(--daur-sodium)] font-medium"
                      : "text-text-muted hover:text-text border-transparent"
                  }`}
                >
                  {tab.label}
                  <span className="tnum text-text-muted ml-1.5 font-mono text-xs">{tab.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {registrations.length === 0 ? (
        <EmptyState filter={filter} hasPast={counts.past > 0} />
      ) : (
        <ul className="space-y-3">
          {registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** An empty screen is an invitation to act, not a dead end. */
function EmptyState({ filter, hasPast }: { filter: "upcoming" | "past"; hasPast: boolean }) {
  return (
    <div className="border-border rounded-token border border-dashed p-8 text-center">
      {filter === "upcoming" ? (
        <>
          <p className="text-text">No races coming up.</p>
          <p className="text-text-muted mt-1 text-sm">
            <Link href="/events" className="text-text underline underline-offset-4">
              Browse events
            </Link>
            {hasPast && (
              <>
                {" or "}
                <Link
                  href="/account/registrations?show=past"
                  className="text-text underline underline-offset-4"
                >
                  look back at past races
                </Link>
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="text-text">Nothing in the archive yet.</p>
          <p className="text-text-muted mt-1 text-sm">Races you have run will show up here.</p>
        </>
      )}
    </div>
  );
}
