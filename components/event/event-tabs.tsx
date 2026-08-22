"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "upcoming", label: "Upcoming", href: "/events" },
  { key: "past", label: "Past", href: "/events?show=past" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

/**
 * The tab strip and the visible panel, with no knowledge of where the active
 * tab came from. The page renders this directly as the Suspense fallback so
 * the default view is in the prerendered HTML.
 */
export function EventTabsShell({ active, children }: { active: TabKey; children: ReactNode }) {
  return (
    <>
      <nav aria-label="Filter events" className="mt-6">
        <ul className="border-border flex gap-6 border-b text-sm">
          {TABS.map((tab) => (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active === tab.key ? "page" : undefined}
                className={`-mb-px inline-block border-b-2 px-0.5 pb-3 transition-colors ${
                  active === tab.key
                    ? "text-text border-[color:var(--daur-sodium)] font-medium"
                    : "text-text-muted hover:text-text border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}

/**
 * Reading ?show=past here rather than on the server is what keeps /events a
 * static page. Both panels are server-rendered and handed in as props, so the
 * cards themselves never cross into the client bundle — only the choice of
 * which one to show does.
 */
export function EventTabs({ upcoming, past }: { upcoming: ReactNode; past: ReactNode }) {
  const active: TabKey = useSearchParams().get("show") === "past" ? "past" : "upcoming";
  return <EventTabsShell active={active}>{active === "past" ? past : upcoming}</EventTabsShell>;
}
