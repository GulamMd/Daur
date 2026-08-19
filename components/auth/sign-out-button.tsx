"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/" })}
      className="text-text-muted hover:text-text transition-colors"
    >
      Log out
    </button>
  );
}
