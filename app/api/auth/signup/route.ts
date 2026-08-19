import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/schemas/auth.schema";
import { signupUser, EmailTakenError } from "@/server/services/auth.service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "signup"), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const user = await signupUser(parsed.data);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return NextResponse.json(
        { error: "An account with this email already exists. Log in instead." },
        { status: 409 },
      );
    }
    console.error("[daur] signup failed", error);
    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }
}
