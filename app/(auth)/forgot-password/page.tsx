import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-text text-2xl font-extrabold tracking-tight">
          Forgot your password
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Enter the email on your account and we&rsquo;ll send a link to set a new password.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-text-muted text-sm">
        <Link href="/login" className="text-text underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
