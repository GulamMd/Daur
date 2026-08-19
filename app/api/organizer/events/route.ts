import { NextResponse } from "next/server";
import { requireOrganizer } from "@/server/auth-guards";
import { eventInputSchema } from "@/lib/schemas/event.schema";
import {
  upsertEvent,
  CategoryInUseError,
  SlotLimitBelowTakenError,
} from "@/server/services/organizer.service";
import { prisma } from "@/server/db";

export async function GET() {
  const guard = await requireOrganizer();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const events = await prisma.event.findMany({
    where: { organizerId: guard.organizerId },
    orderBy: { startAt: "desc" },
    select: {
      slug: true,
      name: true,
      status: true,
      startAt: true,
      categories: { select: { name: true, slotLimit: true, slotsTaken: true } },
    },
  });
  return NextResponse.json({ events });
}

/** Create or update an event from the same document the seed script uses. */
export async function POST(request: Request) {
  const guard = await requireOrganizer();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = eventInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The event document is not valid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const event = await upsertEvent(parsed.data, guard.organizerId);
    return NextResponse.json({ slug: event.slug }, { status: 200 });
  } catch (error) {
    if (error instanceof CategoryInUseError || error instanceof SlotLimitBelowTakenError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[daur] event upsert failed", error);
    return NextResponse.json({ error: "Could not save the event." }, { status: 500 });
  }
}
