import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="font-display text-text text-xl font-extrabold tracking-tight">Profile</h1>
          <p className="text-text-muted mt-1 text-sm">
            Signed in as <span className="text-text">{user.email}</span>
          </p>
        </div>
        <ProfileForm defaults={{ name: user.name ?? "", phone: user.phone ?? "" }} />
      </section>

      <hr className="lane-rule" />

      <section className="space-y-4">
        <h2 className="font-display text-text text-lg font-extrabold tracking-tight">Password</h2>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-text-muted text-sm">
            You sign in with Google, so there&rsquo;s no password to change.
          </p>
        )}
      </section>
    </div>
  );
}
