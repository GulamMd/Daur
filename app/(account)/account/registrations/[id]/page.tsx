import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getRegistrationDetail } from "@/server/services/registration.service";
import { readSnapshot } from "@/components/account/registration-card";
import { GENDER_LABELS } from "@/lib/schemas/participant.schema";
import { formatEventDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Registration" };

export default async function RegistrationDetailPage({
  params,
}: PageProps<"/account/registrations/[id]">) {
  const [session, { id }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) redirect("/login?next=/account/registrations");

  // Scoped to the session user — another account's id resolves to nothing.
  const registration = await getRegistrationDetail(session.user.id, id);
  if (!registration) notFound();

  const { event, category } = registration;
  const person = readSnapshot(registration.participantSnapshot);
  const cancelled = registration.status === "CANCELLED";
  const address = [event.addressLine, event.city, event.state, event.pincode]
    .filter(Boolean)
    .join(", ");

  const mailto =
    `mailto:${event.organizer.contactEmail}` +
    `?subject=${encodeURIComponent(`Cancel ${registration.ref} — ${event.name}`)}` +
    `&body=${encodeURIComponent(
      `Please cancel this entry.\n\nReference: ${registration.ref}\nRunner: ${person.fullName}\nDistance: ${category.name}\n`,
    )}`;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account/registrations"
          className="text-text-muted hover:text-text text-sm underline underline-offset-4"
        >
          All registrations
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">
              {event.name}
            </h1>
            <p className="tnum text-text-muted mt-1 font-mono text-sm">
              {formatEventDate(event.startAt, event.timezone)} · {category.name} · flag-off{" "}
              {formatTime(category.startTime, event.timezone)}
            </p>
          </div>
          {cancelled ? (
            <span className="eyebrow text-text-muted border-border rounded-token border px-2 py-1">
              Cancelled
            </span>
          ) : (
            <span className="eyebrow text-signal-ink rounded-token inline-flex items-center gap-1.5 border border-[color:var(--daur-signal)] px-2 py-1">
              <span aria-hidden="true" className="bg-signal size-1.5 rounded-full" />
              Confirmed
            </span>
          )}
        </div>
      </div>

      {cancelled && (
        <p role="status" className="border-border bg-surface-sunk rounded-token border p-4 text-sm">
          <span className="text-text">This entry was cancelled</span>
          {registration.cancelledAt && (
            <span className="text-text-muted">
              {" "}
              on {formatEventDate(registration.cancelledAt, event.timezone)}
            </span>
          )}
          {registration.cancelledReason && (
            <span className="text-text-muted"> — {registration.cancelledReason}</span>
          )}
          <span className="text-text-muted">. The slot has been released.</span>
        </p>
      )}

      <section className="border-border rounded-token border p-4">
        <p className="eyebrow text-text-muted">Reference</p>
        <p className="bib-numeral text-text mt-1" style={{ fontSize: "clamp(2rem,8vw,3rem)" }}>
          {registration.ref}
        </p>
      </section>

      <section>
        <h2 className="eyebrow text-text-muted">Runner</h2>
        <p className="text-text-muted mt-1 text-sm">
          These are the details as submitted on{" "}
          {formatEventDate(registration.createdAt, event.timezone)}. Editing this person later does
          not change the entry.
        </p>
        <dl className="border-border rounded-token mt-3 divide-y divide-[color:var(--daur-chalk)] border">
          <Row label="Name" value={person.fullName} />
          <Row label="Date of birth" value={person.dateOfBirth || "—"} mono />
          <Row label="Age on race day" value={String(registration.ageAtEvent)} mono />
          <Row
            label="Gender"
            value={
              GENDER_LABELS[person.gender as keyof typeof GENDER_LABELS] ?? person.gender ?? "—"
            }
          />
          <Row label="Mobile" value={person.phone || "—"} mono />
          {person.email && <Row label="Email" value={person.email} />}
        </dl>
      </section>

      <section>
        <h2 className="eyebrow text-text-muted">Race</h2>
        <dl className="border-border rounded-token mt-3 divide-y divide-[color:var(--daur-chalk)] border">
          <Row
            label="Distance"
            value={`${category.name} · ${(category.distanceMeters / 1000).toFixed(category.distanceMeters % 1000 === 0 ? 0 : 3)} km`}
            mono
          />
          <Row label="Flag-off" value={formatTime(category.startTime, event.timezone)} mono />
          {category.minAge != null && (
            <Row label="Minimum age" value={String(category.minAge)} mono />
          )}
          <Row label="Venue" value={event.venueName} />
          <Row label="Address" value={address} />
          <Row
            label="Terms accepted"
            value={`${registration.termsVersion} · ${formatEventDate(registration.acceptedTermsAt, event.timezone)}`}
            mono
          />
        </dl>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/events/${event.slug}`}
            className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
          >
            Race details
          </Link>
          {event.mapsUrl && (
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
            >
              Open in Maps
            </a>
          )}
          {!cancelled && (
            <a
              href={`/api/registrations/${registration.groupId}/calendar`}
              className="border-border text-text rounded-token inline-flex h-11 items-center border px-4 text-sm font-medium hover:border-[color:var(--daur-sodium)]"
            >
              Add to calendar
            </a>
          )}
        </div>
      </section>

      {!cancelled && (
        <section className="border-border rounded-token border border-dashed p-4">
          <h2 className="eyebrow text-text-muted">Need to cancel?</h2>
          {/* Cancellation is manual in the MVP: the organizer cancels, which
              releases the slot and frees the runner to enter again. */}
          <p className="text-text-muted mt-2 text-sm">
            Entries are not transferable. Email {event.organizer.name} with your reference and they
            will cancel it and release the slot.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href={mailto} className="text-text underline underline-offset-4">
              {event.organizer.contactEmail}
            </a>
            {event.organizer.contactPhone && (
              <a
                href={`tel:${event.organizer.contactPhone}`}
                className="text-text-muted tnum font-mono underline underline-offset-4"
              >
                {event.organizer.contactPhone}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-text-muted shrink-0 text-sm">{label}</dt>
      <dd className={`text-text text-right text-sm ${mono ? "tnum font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
