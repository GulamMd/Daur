import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { participantInputSchema } from "@/lib/schemas/participant.schema";
import {
  deleteParticipant,
  updateParticipant,
  DuplicateParticipantError,
  ParticipantHasUpcomingRaceError,
  ParticipantNotFoundError,
} from "@/server/services/participant.service";
import { formatEventDate } from "@/lib/format";

export async function PATCH(request: Request, { params }: RouteContext<"/api/participants/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = participantInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const participant = await updateParticipant(session.user.id, id, parsed.data);
    return NextResponse.json({ participant });
  } catch (error) {
    if (error instanceof ParticipantNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DuplicateParticipantError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[daur] update participant failed", error);
    return NextResponse.json({ error: "Could not save those changes." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/participants/[id]">,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const outcome = await deleteParticipant(session.user.id, id);
    return NextResponse.json({ outcome });
  } catch (error) {
    if (error instanceof ParticipantNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ParticipantHasUpcomingRaceError) {
      // Say exactly what is blocking it and what to do about it.
      return NextResponse.json(
        {
          error:
            `${error.participantName} is registered for ${error.eventName} on ` +
            `${formatEventDate(error.eventDate)}. Cancel that entry before removing them.`,
        },
        { status: 409 },
      );
    }
    console.error("[daur] delete participant failed", error);
    return NextResponse.json({ error: "Could not remove that person." }, { status: 500 });
  }
}
