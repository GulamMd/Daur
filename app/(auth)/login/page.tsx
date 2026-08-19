import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { FormMessage } from "@/components/ui/field";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const next = safeNext(params.next);

  if (session?.user) redirect(next);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">Log in</h1>
        <p className="text-text-muted mt-1 text-sm">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="text-text underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>

      {params.reset === "1" && (
        <FormMessage tone="success">Password updated. Log in with your new password.</FormMessage>
      )}

      {params.error === "OAuthAccountNotLinked" && (
        <FormMessage tone="error">
          This email already has a password-based account. Log in with your password below.
        </FormMessage>
      )}

      <GoogleButton next={next} />

      <div className="flex items-center gap-3">
        <hr className="lane-rule flex-1" />
        <span className="text-text-muted text-xs">or</span>
        <hr className="lane-rule flex-1" />
      </div>

      <LoginForm next={next} />

      <p className="text-text-muted text-sm">
        <Link href="/forgot-password" className="text-text underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
