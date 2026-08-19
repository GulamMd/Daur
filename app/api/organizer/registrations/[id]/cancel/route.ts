import { NextResponse } from "next/server";
import { requireOrganizer } from "@/server/auth-guards";
import { cancelRegistrationSchema } from "@/lib/schemas/registration.schema";
import { cancelRegistration } from "@/server/services/registration.service";
import { prisma } from "@/server/db";

/**
 * Cancellation is manual by design in the MVP: a runner emails the organizer,
 * who cancels here. Doing so releases the slot and — because the unique index
 * is partial on CONFIRMED — frees that person to register again.
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/organizer/registrations/[id]/cancel">,
) {
  const guard = await requireOrganizer();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;

  // Scope to this organizer's own events rather than any registration id.
  const owned = await prisma.registration.findFirst({
    where: { id, event: { organizerId: guard.organizerId } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "No such registration." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = cancelRegistrationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Reason is too long." }, { status: 400 });
  }

  const result = await cancelRegistration(id, parsed.data.reason);
  if (!result) return NextResponse.json({ error: "No such registration." }, { status: 404 });

  return NextResponse.json({ id: result.id, status: result.status });
}
