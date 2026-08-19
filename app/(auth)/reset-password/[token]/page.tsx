import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  // The token is only validated on submit. Checking it here as well would mean
  // two lookups and would let someone probe token validity with a GET.
  const { token } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">
          Set a new password
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Reset links expire an hour after they&rsquo;re sent.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <p className="text-text-muted text-sm">
        <Link href="/login" className="text-text underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
