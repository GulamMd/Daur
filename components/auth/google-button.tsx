"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/ui/google-mark";

export function GoogleButton({ next }: { next: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => signIn("google", { redirectTo: next })}
    >
      <GoogleMark />
      Continue with Google
    </Button>
  );
}
