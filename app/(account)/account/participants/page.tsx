import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listParticipants } from "@/server/services/participant.service";
import { ParticipantRow } from "@/components/account/participant-row";
import { currentAge } from "@/lib/age";

export const metadata: Metadata = { title: "Participants" };

export default async function ParticipantsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/participants");

  const participants = await listParticipants(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
            People you register
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            Add someone once and they stay on your account for future editions.
          </p>
        </div>
        <Link
          href="/account/participants/new"
          className="bg-accent text-accent-text rounded-token inline-flex h-11 shrink-0 items-center px-4 text-sm font-medium transition-[filter] hover:brightness-95"
        >
          Add someone
        </Link>
      </div>

      {participants.length === 0 ? (
        <div className="border-border rounded-token border border-dashed p-8 text-center">
          <p className="text-text">Nobody added yet.</p>
          <p className="text-text-muted mt-1 text-sm">
            Add yourself first — you can add family and crew when you register.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {participants.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={{
                id: participant.id,
                fullName: participant.fullName,
                gender: participant.gender,
                phone: participant.phone,
                email: participant.email,
                isSelf: participant.isSelf,
                // Computed here so the browser never derives "now" itself.
                age: currentAge(participant.dateOfBirth),
                confirmedRegistrations: participant._count.registrations,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
