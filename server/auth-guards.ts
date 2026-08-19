import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export type GuardFailure = { ok: false; status: 401 | 403; error: string };
export type OrganizerContext = { ok: true; userId: string; organizerId: string };

/**
 * Two conditions, deliberately separate:
 *   role === ORGANIZER_ADMIN   — this account may use organizer tooling at all
 *   OrganizerMember row        — and this is the organizer it acts for
 *
 * Keeping them apart is what makes multi-organizer a data change later rather
 * than a rewrite: the role stays a coarse gate, membership decides scope.
 */
export async function requireOrganizer(): Promise<OrganizerContext | GuardFailure> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Log in to continue." };
  }
  if (session.user.role !== "ORGANIZER_ADMIN") {
    return { ok: false, status: 403, error: "This account cannot manage events." };
  }

  const membership = await prisma.organizerMember.findFirst({
    where: { userId: session.user.id },
    select: { organizerId: true },
  });
  if (!membership) {
    return { ok: false, status: 403, error: "This account is not linked to an organizer." };
  }

  return { ok: true, userId: session.user.id, organizerId: membership.organizerId };
}
