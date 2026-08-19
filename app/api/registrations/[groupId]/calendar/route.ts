import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import { getRegistrationGroup } from "@/server/services/registration.service";
import { buildIcs } from "@/lib/ics";
import { formatTime } from "@/lib/format";

/** Three hours covers the slowest finisher plus the walk back to the car. */
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/registrations/[groupId]/calendar">,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const { groupId } = await params;
  // Scoped to the session user, so a guessed group id returns nothing.
  const rows = await getRegistrationGroup(session.user.id, groupId);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No such registration." }, { status: 404 });
  }

  const first = rows[0]!;
  const { event, category } = first;
  const names = rows.map((r) => r.participant.fullName).join(", ");
  const start = category.startTime;

  const ics = buildIcs({
    uid: `${groupId}@daur`,
    start,
    end: new Date(start.getTime() + DEFAULT_DURATION_MS),
    summary: `${event.name} — ${category.name}`,
    location: `${event.venueName}, ${event.addressLine}, ${event.city}`,
    description:
      `${category.name} flag-off at ${formatTime(start, event.timezone)}.\n` +
      `Running: ${names}\n` +
      `Reference${rows.length > 1 ? "s" : ""}: ${rows.map((r) => r.ref).join(", ")}`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/events/${event.slug}`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-${category.name}.ics"`,
    },
  });
}
