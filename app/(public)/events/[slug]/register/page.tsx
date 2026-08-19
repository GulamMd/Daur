import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getEventBySlug } from "@/server/services/event.service";
import { listParticipants } from "@/server/services/participant.service";
import { prisma } from "@/server/db";
import { RegisterFlow } from "@/components/registration/register-flow";
import { canRegister, ctaLabel } from "@/lib/event-status";
import { ageOnEventDate } from "@/lib/age";
import { formatEventDate, formatTime, slotsRemaining } from "@/lib/format";

export const metadata: Metadata = { title: "Register", robots: { index: false } };

export default async function RegisterPage({
  params,
  searchParams,
}: PageProps<"/events/[slug]/register">) {
  const [session, { slug }, query] = await Promise.all([auth(), params, searchParams]);
  if (!session?.user?.id) redirect(`/login?next=/events/${(await params).slug}/register`);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  // Step 0 of the flow: the gate. The page may have been opened an hour ago.
  if (!canRegister(event)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
          {ctaLabel(event)}
        </h1>
        <p className="text-text-muted mt-2 text-sm">
          {event.name} is not accepting entries right now.
        </p>
        <Link
          href={`/events/${event.slug}`}
          className="text-text mt-4 inline-block text-sm underline underline-offset-4"
        >
          Back to the race
        </Link>
      </div>
    );
  }

  const [participants, existing] = await Promise.all([
    listParticipants(session.user.id),
    prisma.registration.findMany({
      where: { eventId: event.id, userId: session.user.id, status: "CONFIRMED" },
      select: { participantId: true, category: { select: { name: true } } },
    }),
  ]);

  const registeredIn = new Map(existing.map((r) => [r.participantId, r.category.name]));

  return (
    <RegisterFlow
      event={{
        slug: event.slug,
        name: event.name,
        dateLabel: formatEventDate(event.startAt, event.timezone),
        venue: `${event.venueName}, ${event.city}`,
        startAtIso: event.startAt.toISOString(),
        timeZone: event.timezone,
      }}
      categories={event.categories.map((category) => ({
        id: category.id,
        name: category.name,
        minAge: category.minAge,
        startLabel: formatTime(category.startTime, event.timezone),
        slotsLeft: slotsRemaining(category.slotLimit, category.slotsTaken),
        description: category.descriptionMd,
      }))}
      participants={participants.map((participant) => ({
        id: participant.id,
        fullName: participant.fullName,
        isSelf: participant.isSelf,
        // Age ON RACE DAY, computed server-side in the event's timezone. The
        // client never derives eligibility itself — it only renders it.
        ageAtEvent: ageOnEventDate(participant.dateOfBirth, event.startAt, event.timezone),
        registeredIn: registeredIn.get(participant.id) ?? null,
      }))}
      preselectedCategoryId={typeof query.category === "string" ? query.category : null}
    />
  );
}
