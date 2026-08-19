import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import { resetPassword, InvalidResetTokenError } from "@/server/services/auth.service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "reset"), 10, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await resetPassword(parsed.data);
    return NextResponse.json({ message: "Password updated. Log in with your new password." });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return NextResponse.json(
        { error: "That reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }
    console.error("[daur] password reset failed", error);
    return NextResponse.json({ error: "Could not reset the password." }, { status: 500 });
  }
}
