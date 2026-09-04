import { cache } from "react";
import { prisma } from "@/server/db";
import { EventStatus } from "@/generated/prisma/enums";

/**
 * Public read side. Server Components call these directly — no HTTP hop — so
 * DRAFT filtering has to live here rather than in a route handler that a page
 * might bypass.
 */

const PUBLIC_STATUSES = [
  EventStatus.COMING_SOON,
  EventStatus.REGISTRATION_OPEN,
  EventStatus.REGISTRATION_CLOSED,
  EventStatus.COMPLETED,
  EventStatus.CANCELLED,
];

const CARD_FIELDS = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  status: true,
  startAt: true,
  timezone: true,
  venueName: true,
  city: true,
  coverImageUrl: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  categories: {
    select: {
      name: true,
      distanceMeters: true,
      slotLimit: true,
      slotsTaken: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" },
  },
} as const;

/**
 * `take` bounds the result set. The home page renders every card it fetches
 * into static HTML so the listing stays crawlable, which means an unbounded
 * past archive would grow that payload forever. /events passes no `take` and
 * is unchanged. The @@index([status, startAt]) already covers this ordering.
 */
export async function listEvents(
  filter: "upcoming" | "past" = "upcoming",
  now = new Date(),
  take?: number,
) {
  return prisma.event.findMany({
    where: {
      status: { in: PUBLIC_STATUSES },
      startAt: filter === "upcoming" ? { gte: now } : { lt: now },
    },
    orderBy: { startAt: filter === "upcoming" ? "asc" : "desc" },
    select: CARD_FIELDS,
    ...(take === undefined ? {} : { take }),
  });
}

/**
 * Slugs only, for generateStaticParams. Deliberately not listEvents() — that
 * pulls a full card payload per event, and prerendering only needs the URL.
 * Unfiltered by date: past editions stay linkable.
 */
export async function listPublicSlugs() {
  return prisma.event.findMany({
    where: { status: { in: PUBLIC_STATUSES } },
    select: { slug: true },
  });
}

/**
 * Full event page payload. Returns null for unknown or DRAFT slugs.
 *
 * Wrapped in React's cache() because the event page asks for this twice per
 * render — once in generateMetadata, once in the page body — and it is eight
 * relation loads each time. The wrapper dedupes within a single render pass.
 */
export const getEventBySlug = cache(async (slug: string) => {
  return prisma.event.findFirst({
    where: { slug, status: { in: PUBLIC_STATUSES } },
    include: {
      organizer: {
        select: {
          name: true,
          logoUrl: true,
          aboutMd: true,
          contactEmail: true,
          instagramUrl: true,
        },
      },
      categories: { orderBy: { sortOrder: "asc" } },
      schedule: { orderBy: { sortOrder: "asc" } },
      inclusions: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      routes: { include: { category: { select: { name: true } } } },
    },
  });
});

/** Includes DRAFT — organizer tooling only, never a public page. */
export async function getEventBySlugForOrganizer(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      schedule: { orderBy: { sortOrder: "asc" } },
      inclusions: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      routes: true,
    },
  });
}

export type EventCard = Awaited<ReturnType<typeof listEvents>>[number];
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;
