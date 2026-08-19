import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { registrationRequestSchema } from "@/lib/schemas/registration.schema";
import {
  registerParticipants,
  AlreadyRegisteredError,
  CategoryNotFoundError,
  EventNotRegisterableError,
  NotEnoughSlotsError,
  ParticipantNotOwnedError,
  UnderageParticipantError,
} from "@/server/services/registration.service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/events/[slug]/registrations">,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const limit = rateLimit(clientKey(request.headers, "register"), 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { slug } = await params;
  const parsed = registrationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await registerParticipants(session.user.id, slug, parsed.data);
    // A replay is a success, not a conflict — the person is registered either
    // way, and that is what they asked for.
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    if (error instanceof UnderageParticipantError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof NotEnoughSlotsError) {
      return NextResponse.json(
        { error: error.message, remaining: error.remaining },
        { status: 409 },
      );
    }
    if (error instanceof AlreadyRegisteredError || error instanceof EventNotRegisterableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ParticipantNotOwnedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof CategoryNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[daur] registration failed", error);
    return NextResponse.json({ error: "Could not complete the registration." }, { status: 500 });
  }
}
