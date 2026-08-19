import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { profileSchema } from "@/lib/schemas/auth.schema";
import { updateProfile } from "@/server/services/auth.service";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // The id comes from the session, never from the request body.
  await updateProfile(session.user.id, parsed.data);
  return NextResponse.json({ message: "Profile saved." });
}
