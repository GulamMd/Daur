import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ParticipantForm } from "@/components/account/participant-form";

export const metadata: Metadata = { title: "Add someone" };

export default async function NewParticipantPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/participants/new");

  const [user, self] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    prisma.participant.findFirst({
      where: { userId: session.user.id, isSelf: true, deletedAt: null },
      select: { id: true },
    }),
  ]);

  // If the account has not yet added itself, this is almost certainly the
  // account holder — prefill from the profile and pre-tick "This is me".
  const first = !self;

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
          {first ? "Add yourself" : "Add someone"}
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          {first
            ? "Start with your own details. You can add family and crew afterwards."
            : "Family, friends, anyone you register on your account."}
        </p>
      </div>

      <ParticipantForm
        offerSelf={first}
        defaults={
          first
            ? {
                fullName: user?.name ?? "",
                phone: user?.phone ?? "",
                email: user?.email ?? "",
                isSelf: true,
              }
            : {}
        }
      />
    </div>
  );
}
