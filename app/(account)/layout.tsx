import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/">) {
  // Middleware already redirects unauthenticated requests. This is the second
  // line of defence: the layout must not render account data on the strength of
  // middleware alone, since matcher config is easy to get wrong.
  const session = await auth();
  if (!session?.user) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
