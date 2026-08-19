import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getParticipant, ParticipantNotFoundError } from "@/server/services/participant.service";
import { ParticipantForm } from "@/components/account/participant-form";
import { fromDateOnly } from "@/lib/schemas/participant.schema";

export const metadata: Metadata = { title: "Edit person" };

export default async function EditParticipantPage({
  params,
}: PageProps<"/account/participants/[id]/edit">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/participants");

  const { id } = await params;

  let participant;
  try {
    // Scoped to the session's user, so another account's id resolves to 404.
    participant = await getParticipant(session.user.id, id);
  } catch (error) {
    if (error instanceof ParticipantNotFoundError) notFound();
    throw error;
  }

  const otherSelf = await prisma.participant.findFirst({
    where: { userId: session.user.id, isSelf: true, deletedAt: null, id: { not: id } },
    select: { id: true },
  });

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
          Edit {participant.fullName}
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Changes here do not alter races already registered — those keep the details submitted at
          the time.
        </p>
      </div>

      <ParticipantForm
        participantId={participant.id}
        // Offer the toggle unless someone else already holds it.
        offerSelf={!otherSelf}
        defaults={{
          fullName: participant.fullName,
          dateOfBirth: fromDateOnly(participant.dateOfBirth),
          gender: participant.gender,
          phone: participant.phone,
          email: participant.email ?? "",
          isSelf: participant.isSelf,
        }}
      />
    </div>
  );
}
