import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { participantInputSchema } from "@/lib/schemas/participant.schema";
import {
  createParticipant,
  listParticipants,
  DuplicateParticipantError,
} from "@/server/services/participant.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  return NextResponse.json({ participants: await listParticipants(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const parsed = participantInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    // userId comes from the session, never the body.
    const participant = await createParticipant(session.user.id, parsed.data);
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateParticipantError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[daur] create participant failed", error);
    return NextResponse.json({ error: "Could not add that person." }, { status: 500 });
  }
}
