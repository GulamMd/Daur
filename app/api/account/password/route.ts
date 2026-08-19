import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { changePasswordSchema } from "@/lib/schemas/auth.schema";
import { changePassword, WrongPasswordError } from "@/server/services/auth.service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const limit = rateLimit(clientKey(request.headers, "change-password"), 10, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ message: "Password updated." });
  } catch (error) {
    if (error instanceof WrongPasswordError) {
      return NextResponse.json({ error: "That current password is incorrect." }, { status: 400 });
    }
    console.error("[daur] change password failed", error);
    return NextResponse.json({ error: "Could not update the password." }, { status: 500 });
  }
}
