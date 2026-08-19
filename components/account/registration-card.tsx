import Link from "next/link";
import type {
  RegistrationHistoryItem,
  RegistrationSnapshot,
} from "@/server/services/registration.service";
import { formatEventDate, formatTime } from "@/lib/format";

/**
 * `participantSnapshot` is a Json column, so it is `unknown` at the type level
 * however carefully the write path guards it. Read it defensively rather than
 * casting and hoping.
 */
export function readSnapshot(value: unknown): RegistrationSnapshot {
  const snapshot = (value ?? {}) as Partial<RegistrationSnapshot>;
  return {
    fullName: snapshot.fullName ?? "Unknown",
    dateOfBirth: snapshot.dateOfBirth ?? "",
    gender: snapshot.gender ?? "",
    phone: snapshot.phone ?? "",
    email: snapshot.email ?? null,
  };
}

export function RegistrationCard({ registration }: { registration: RegistrationHistoryItem }) {
  const person = readSnapshot(registration.participantSnapshot);
  const cancelled = registration.status === "CANCELLED";

  return (
    <li
      className={`border-border rounded-token relative border p-4 transition-colors ${
        cancelled ? "opacity-65" : "hover:border-[color:var(--daur-sodium)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-text-muted">
            {formatEventDate(registration.event.startAt, registration.event.timezone)}
          </p>
          <h3 className="font-display text-text mt-1.5 text-lg font-extrabold tracking-tight">
            <Link
              href={`/account/registrations/${registration.id}`}
              className="after:absolute after:inset-0"
            >
              {registration.event.name}
            </Link>
          </h3>
          <p className="text-text-muted mt-1 text-sm">
            {person.fullName} · {registration.event.venueName}, {registration.event.city}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-text text-xl font-extrabold tracking-tight">
            {registration.category.name}
          </p>
          <p className="tnum text-text-muted mt-0.5 font-mono text-xs">
            {formatTime(registration.category.startTime, registration.event.timezone)}
          </p>
        </div>
      </div>

      <hr className="lane-rule my-3" />

      <div className="flex items-center justify-between gap-3">
        <p className="tnum font-display text-text text-sm font-extrabold tracking-wide">
          {registration.ref}
        </p>
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
    </li>
  );
}
