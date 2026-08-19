import type { EventInput } from "@/lib/schemas/event.schema";
import { deriveRefPrefix } from "@/lib/refs";
import { prisma } from "@/server/db";
import type { EventStatus } from "@/generated/prisma/enums";

/**
 * The organizer/event-management layer.
 *
 * No admin UI ships in the MVP, but this is the exact surface a future
 * dashboard will call. The seed script and the role-gated API both go through
 * here, so the path is proven by use rather than by hope.
 */

export class CategoryInUseError extends Error {
  constructor(name: string) {
    super(`Category "${name}" has registrations and cannot be removed.`);
    this.name = "CategoryInUseError";
  }
}

export class SlotLimitBelowTakenError extends Error {
  constructor(name: string, limit: number, taken: number) {
    super(`Category "${name}": slotLimit ${limit} is below the ${taken} slots already taken.`);
    this.name = "SlotLimitBelowTakenError";
  }
}

export class EventNotFoundError extends Error {
  constructor(slug: string) {
    super(`No event with slug "${slug}".`);
    this.name = "EventNotFoundError";
  }
}

export async function ensureOrganizer(input: {
  slug: string;
  name: string;
  contactEmail: string;
  contactPhone?: string | null;
  instagramUrl?: string | null;
  aboutMd?: string | null;
  logoUrl?: string | null;
}) {
  return prisma.organizer.upsert({
    where: { slug: input.slug },
    create: input,
    update: input,
  });
}

function scalarFields(input: EventInput) {
  return {
    name: input.name,
    tagline: input.tagline ?? null,
    // status is NOT here on purpose — see the note on upsertEvent. It is
    // applied on create only, so re-authoring content cannot change lifecycle.
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    timezone: input.timezone,
    venueName: input.venue.name,
    addressLine: input.venue.addressLine,
    city: input.venue.city,
    state: input.venue.state ?? null,
    pincode: input.venue.pincode ?? null,
    lat: input.venue.lat ?? null,
    lng: input.venue.lng ?? null,
    mapsUrl: input.venue.mapsUrl ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    ogImageUrl: input.ogImageUrl ?? null,
    registrationOpensAt: input.registrationOpensAt ?? null,
    registrationClosesAt: input.registrationClosesAt ?? null,
    aboutMd: input.aboutMd ?? null,
    rulesMd: input.rulesMd ?? null,
    sections: input.sections,
    termsVersion: input.termsVersion,
    refPrefix: input.refPrefix ?? deriveRefPrefix(input.name),
  };
}

/**
 * Idempotent by slug: authoring the same document twice is a no-op.
 *
 * Categories are upserted by name rather than replaced, because they carry
 * `slotsTaken` and are referenced by registrations. Pure content (schedule,
 * inclusions, images, FAQs, routes) is replaced wholesale, which is safe
 * precisely because nothing references it.
 *
 * `status` is applied on CREATE only. Re-authoring a live event to fix a typo
 * in an FAQ must not quietly close registration just because the document
 * still says COMING_SOON. Lifecycle is owned by setEventStatus (the API and
 * the event:status script), not by the content document.
 */
export async function upsertEvent(input: EventInput, organizerId: string) {
  return prisma.$transaction(
    async (tx) => {
      const fields = scalarFields(input);

      const event = await tx.event.upsert({
        where: { slug: input.slug },
        create: {
          slug: input.slug,
          organizerId,
          ...fields,
          status: input.status,
          publishedAt: input.status === "DRAFT" ? null : new Date(),
        },
        update: fields, // deliberately without status/publishedAt
        select: { id: true, slug: true, status: true },
      });

      const existing = await tx.raceCategory.findMany({
        where: { eventId: event.id },
        select: { id: true, name: true, slotsTaken: true },
      });
      const bySlotName = new Map(existing.map((c) => [c.name, c]));

      for (const category of input.categories) {
        const prior = bySlotName.get(category.name);
        if (prior && category.slotLimit < prior.slotsTaken) {
          // The CHECK constraint would reject this anyway; failing here gives a
          // message that says which category and by how much.
          throw new SlotLimitBelowTakenError(category.name, category.slotLimit, prior.slotsTaken);
        }

        const shared = {
          distanceMeters: category.distanceMeters,
          minAge: category.minAge ?? null,
          startTime: category.startTime,
          slotLimit: category.slotLimit,
          descriptionMd: category.descriptionMd ?? null,
          priceMinor: category.priceMinor,
          currency: category.currency,
          sortOrder: category.sortOrder,
        };

        await tx.raceCategory.upsert({
          where: { eventId_name: { eventId: event.id, name: category.name } },
          // slotsTaken is deliberately absent from `update` — re-authoring an
          // event must never reset how many people have already entered.
          create: { eventId: event.id, name: category.name, ...shared },
          update: shared,
        });
      }

      const authored = new Set(input.categories.map((c) => c.name));
      const removed = existing.filter((c) => !authored.has(c.name));
      for (const category of removed) {
        const used = await tx.registration.count({ where: { categoryId: category.id } });
        if (used > 0) throw new CategoryInUseError(category.name);
        await tx.raceCategory.delete({ where: { id: category.id } });
      }

      // --- pure content: replace wholesale -----------------------------------
      await tx.eventSchedule.deleteMany({ where: { eventId: event.id } });
      if (input.schedule.length) {
        await tx.eventSchedule.createMany({
          data: input.schedule.map((s) => ({
            eventId: event.id,
            timeLabel: s.timeLabel,
            title: s.title,
            description: s.description ?? null,
            sortOrder: s.sortOrder,
          })),
        });
      }

      await tx.eventInclusion.deleteMany({ where: { eventId: event.id } });
      if (input.inclusions.length) {
        await tx.eventInclusion.createMany({
          data: input.inclusions.map((i) => ({
            eventId: event.id,
            icon: i.icon,
            title: i.title,
            description: i.description ?? null,
            sortOrder: i.sortOrder,
          })),
        });
      }

      await tx.eventFaq.deleteMany({ where: { eventId: event.id } });
      if (input.faqs.length) {
        await tx.eventFaq.createMany({
          data: input.faqs.map((f) => ({
            eventId: event.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder,
          })),
        });
      }

      await tx.eventImage.deleteMany({ where: { eventId: event.id } });
      if (input.gallery.length) {
        await tx.eventImage.createMany({
          data: input.gallery.map((g) => ({
            eventId: event.id,
            url: g.url,
            alt: g.alt,
            kind: g.kind,
            sortOrder: g.sortOrder,
          })),
        });
      }

      // Routes come last: they may name a category, which must exist by now.
      await tx.eventRoute.deleteMany({ where: { eventId: event.id } });
      if (input.routes.length) {
        const current = await tx.raceCategory.findMany({
          where: { eventId: event.id },
          select: { id: true, name: true },
        });
        const idByName = new Map(current.map((c) => [c.name.toLowerCase(), c.id]));

        await tx.eventRoute.createMany({
          data: input.routes.map((r) => ({
            eventId: event.id,
            categoryId: r.categoryName
              ? (idByName.get(r.categoryName.toLowerCase()) ?? null)
              : null,
            mapImageUrl: r.mapImageUrl ?? null,
            gpxUrl: r.gpxUrl ?? null,
            descriptionMd: r.descriptionMd ?? null,
            elevationGainM: r.elevationGainM ?? null,
          })),
        });
      }

      return event;
    },
    {
      // Authoring an event is ~20 sequential round-trips, and Neon over the
      // pooler is a few hundred ms each — comfortably past Prisma default 5s.
      // This is a rare admin operation, so atomicity is worth the longer lease:
      // a half-written event page is far worse than a slow one.
      timeout: 30_000,
      maxWait: 10_000,
    },
  );
}

export async function setEventStatus(slug: string, status: EventStatus) {
  const event = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
  if (!event) throw new EventNotFoundError(slug);

  return prisma.event.update({
    where: { id: event.id },
    data: {
      status,
      publishedAt: status === "DRAFT" ? null : new Date(),
    },
    select: { slug: true, status: true },
  });
}

/** Race-day export: every confirmed entry for an event. */
export async function listEventRegistrations(eventId: string) {
  return prisma.registration.findMany({
    where: { eventId, status: "CONFIRMED" },
    orderBy: [{ categoryId: "asc" }, { createdAt: "asc" }],
    select: {
      ref: true,
      ageAtEvent: true,
      createdAt: true,
      participantSnapshot: true,
      category: { select: { name: true } },
      user: { select: { email: true } },
    },
  });
}
