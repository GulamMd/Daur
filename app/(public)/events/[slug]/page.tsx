import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, listPublicSlugs } from "@/server/services/event.service";
import { EventSections } from "@/components/event/section-renderer";
import { StickyCta } from "@/components/event/sticky-cta";
import { effectiveStatus } from "@/lib/event-status";
import { formatEventDate } from "@/lib/format";
import { EventStatus } from "@/generated/prisma/enums";

/**
 * Prerendered at build time and refreshed at most once a minute.
 *
 * Sixty seconds rather than something longer because two things on this page
 * are read from the clock and the slot counter, and both freeze at prerender:
 * effectiveStatus() flips COMING_SOON to REGISTRATION_OPEN at
 * registrationOpensAt, and StickyCta derives "Sold out" from slotsTaken. A
 * minute bounds the lag on both. Overselling is not a risk either way — the
 * conditional UPDATE in registration.service.ts is the authority, not this page.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  return (await listPublicSlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  const distances = event.categories.map((c) => c.name).join(" · ");
  const description =
    event.tagline ??
    `${distances} on closed roads. ${formatEventDate(event.startAt, event.timezone)}, ${event.venueName}, ${event.city}.`;

  return {
    title: event.name,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "website",
      title: event.name,
      description,
      url: `/events/${event.slug}`,
      siteName: "Daur",
    },
    twitter: { card: "summary_large_image", title: event.name, description },
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const cancelled = effectiveStatus(event) === EventStatus.CANCELLED;

  return (
    <>
      {cancelled && (
        <p
          role="alert"
          className="border-border bg-surface-sunk text-sodium-ink border-b px-4 py-3 text-center text-sm"
        >
          This edition has been cancelled. Existing entries are being contacted directly.
        </p>
      )}

      <EventSections event={event} />
      <StickyCta event={event} />
    </>
  );
}
