import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getRegistrationGroup } from "@/server/services/registration.service";
import { formatEventDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "You're registered", robots: { index: false } };

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps<"/events/[slug]/register/success">) {
  const [session, { slug }, query] = await Promise.all([auth(), params, searchParams]);
  if (!session?.user?.id) redirect(`/login?next=/events/${slug}`);

  const groupId = typeof query.group === "string" ? query.group : null;
  if (!groupId) notFound();

  const rows = await getRegistrationGroup(session.user.id, groupId);
  if (rows.length === 0) notFound();

  const { event, category } = rows[0]!;
  const many = rows.length > 1;

  return (
    <>
      <section className="on-asphalt sodium-glow">
        <div className="mx-auto max-w-lg px-4 py-16">
          <p className="eyebrow rise text-signal" style={{ color: "var(--daur-signal)" }}>
            Registered
          </p>
          <h1
            className="font-display rise mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl"
            style={{ animationDelay: "90ms" }}
          >
            {many ? `${rows.length} entries confirmed.` : "You're in."}
          </h1>
          <p className="rise text-chalk/80 mt-3" style={{ animationDelay: "180ms" }}>
            {event.name} · {category.name}
          </p>
          <p
            className="tnum rise text-chalk/70 mt-1 font-mono text-sm"
            style={{ animationDelay: "180ms" }}
          >
            {formatEventDate(event.startAt, event.timezone)} · flag-off{" "}
            {formatTime(category.startTime, event.timezone)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-lg px-4 py-10">
        <h2 className="eyebrow text-text-muted">{many ? "Your references" : "Your reference"}</h2>
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-border rounded-token flex items-center justify-between gap-4 border p-3"
            >
              <div>
                <p className="text-text font-medium">{row.participant.fullName}</p>
                <p className="tnum text-text-muted mt-0.5 font-mono text-xs">
                  {row.ageAtEvent} on race day
                </p>
              </div>
              <p className="tnum font-display text-text text-lg font-extrabold tracking-wide">
                {row.ref}
              </p>
            </li>
          ))}
        </ul>

        <hr className="lane-rule my-8" />

        <h2 className="eyebrow text-text-muted">What happens next</h2>
        <ul className="text-text-muted mt-3 space-y-2 text-sm">
          <li>
            Bib collection details go out closer to the race — there is no collection on race
            morning.
          </li>
          <li>
            Reporting is at {event.venueName}, {event.city}.
          </li>
          <li>Need to change or cancel? Contact the organiser before entries close.</li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`/api/registrations/${groupId}/calendar`}
            className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
          >
            Add to calendar
          </a>
          <Link
            href="/account/registrations"
            className="bg-accent text-accent-text rounded-token inline-flex h-11 items-center px-4 text-sm font-medium transition-[filter] hover:brightness-95"
          >
            My registrations
          </Link>
        </div>
      </div>
    </>
  );
}
