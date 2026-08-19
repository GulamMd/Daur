import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { safeNext } from "@/lib/safe-next";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const next = safeNext(params.next);

  if (session?.user) redirect(next);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">
          Create an account
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Already have one?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-text underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>

      <GoogleButton next={next} />

      <div className="flex items-center gap-3">
        <hr className="lane-rule flex-1" />
        <span className="text-text-muted text-xs">or</span>
        <hr className="lane-rule flex-1" />
      </div>

      <SignupForm next={next} />

      <p className="text-text-muted text-xs">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="text-text underline underline-offset-4">
          terms
        </Link>
        .
      </p>
    </div>
  );
}
