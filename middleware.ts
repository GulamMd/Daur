import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

// Built from the edge-safe config only — no Prisma, no argon2.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (req.auth) return;

  // Preserve where they were heading so login can bounce them straight back.
  // This is what makes the Instagram → event → register → login → register
  // journey feel like one continuous flow rather than a dead end.
  const next = req.nextUrl.pathname + req.nextUrl.search;
  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("next", next);
  return Response.redirect(url);
});

export const config = {
  matcher: ["/account/:path*", "/events/:slug/register/:path*"],
};
