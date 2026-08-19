import { NextResponse } from "next/server";
import { requireOrganizer } from "@/server/auth-guards";
import { listEventRegistrations } from "@/server/services/organizer.service";
import { prisma } from "@/server/db";

type Snapshot = {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string | null;
};

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // A leading =, +, - or @ makes spreadsheets treat the cell as a formula.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Race-day start list. CSV because it gets opened in a spreadsheet on a phone. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/organizer/events/[slug]/registrations">,
) {
  const guard = await requireOrganizer();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { slug } = await params;
  const event = await prisma.event.findFirst({
    where: { slug, organizerId: guard.organizerId },
    select: { id: true, slug: true },
  });
  if (!event) return NextResponse.json({ error: `No event with slug "${slug}".` }, { status: 404 });

  const rows = await listEventRegistrations(event.id);

  const header = [
    "ref",
    "category",
    "name",
    "dateOfBirth",
    "ageAtEvent",
    "gender",
    "phone",
    "email",
    "registeredAt",
  ];
  const body = rows.map((row) => {
    const person = (row.participantSnapshot ?? {}) as Snapshot;
    return [
      row.ref,
      row.category.name,
      person.fullName,
      person.dateOfBirth,
      row.ageAtEvent,
      person.gender,
      person.phone,
      person.email ?? row.user.email,
      row.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(",");
  });

  const csv = [header.map(csvCell).join(","), ...body].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-registrations.csv"`,
    },
  });
}
