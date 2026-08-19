"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/account/registrations", label: "Registrations" },
  { href: "/account/participants", label: "Participants" },
  { href: "/account/profile", label: "Profile" },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      <ul className="border-border flex gap-6 border-b text-sm">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-block border-b-2 px-0.5 pb-3 transition-colors ${
                  active
                    ? "text-text border-[color:var(--daur-sodium)] font-medium"
                    : "text-text-muted hover:text-text border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
