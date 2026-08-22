"use client";

import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * The header is the only part of a public page that depends on who is asking.
 *
 * Reading the session on the server here would opt every route in the app into
 * dynamic rendering — a root layout that touches cookies cannot be prerendered
 * — which is what kept /, /events and /events/[slug] querying Neon on every
 * single visit. Reading it in the browser instead lets those pages be static.
 *
 * The provider sits in this file rather than in the root layout deliberately:
 * the client boundary stops at the nav, and everything else stays server
 * rendered. The session strategy is JWT, so /api/auth/session decodes a cookie
 * and never touches the database.
 */
export function HeaderAuthNav() {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthNavItems />
    </SessionProvider>
  );
}

function AuthNavItems() {
  const { status } = useSession();

  // Hold the row's width until the session resolves, so the nav does not jump
  // sideways as it hydrates. Hidden from assistive tech: it is not content.
  if (status === "loading") {
    return (
      <li aria-hidden="true" className="text-text-muted invisible">
        Account
      </li>
    );
  }

  if (status === "authenticated") {
    return (
      <>
        <li>
          <Link
            href="/account/registrations"
            className="text-text-muted hover:text-text transition-colors"
          >
            Account
          </Link>
        </li>
        <li>
          <SignOutButton />
        </li>
      </>
    );
  }

  return (
    <li>
      <Link href="/login" className="text-text-muted hover:text-text transition-colors">
        Log in
      </Link>
    </li>
  );
}
