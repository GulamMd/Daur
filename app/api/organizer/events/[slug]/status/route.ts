import { NextResponse } from "next/server";
import { requireOrganizer } from "@/server/auth-guards";
import { eventStatusUpdateSchema } from "@/lib/schemas/event.schema";
import { setEventStatus, EventNotFoundError } from "@/server/services/organizer.service";
import { prisma } from "@/server/db";
import { revalidatePublicEvent } from "@/server/revalidate";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/organizer/events/[slug]/status">,
) {
  const guard = await requireOrganizer();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { slug } = await params;

  const parsed = eventStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid status." }, { status: 400 });
  }

  // Scope the write to this organizer's own events, not just any slug.
  const owned = await prisma.event.findFirst({
    where: { slug, organizerId: guard.organizerId },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: `No event with slug "${slug}".` }, { status: 404 });

  try {
    const updated = await setEventStatus(slug, parsed.data.status);
    revalidatePublicEvent(slug);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[daur] status update failed", error);
    return NextResponse.json({ error: "Could not update the status." }, { status: 500 });
  }
}
