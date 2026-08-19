import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { requestPasswordReset } from "@/server/services/auth.service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// One uniform body for every outcome. Returning a different response for
// "no such user" would turn this endpoint into an account-enumeration oracle.
const UNIFORM = {
  message: "If that email has an account, a reset link is on its way.",
};

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "forgot"), 5, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    await requestPasswordReset(parsed.data, siteUrl);
  } catch (error) {
    // Still answer uniformly — a 500 here would also leak signal.
    console.error("[daur] password reset request failed", error);
  }

  return NextResponse.json(UNIFORM);
}
