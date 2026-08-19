import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { canRegister } from "@/lib/event-status";
import { ageOnEventDate } from "@/lib/age";
import { formatRegistrationRef, deriveRefPrefix } from "@/lib/refs";
import { toDateOnly, type ParticipantInput } from "@/lib/schemas/participant.schema";
import type { RegistrationRequest } from "@/lib/schemas/registration.schema";

/**
 * The heart of the system.
 *
 * Everything else exists to make this transaction correct. Three invariants
 * must hold no matter how many people press Confirm at the same moment:
 *
 *   1. A category never sells more slots than it has.
 *   2. A person is never registered twice for the same event.
 *   3. A checkout is all-or-nothing — no half-registered group.
 *
 * None of the three rests on application logic alone. Capacity is a conditional
 * UPDATE that simply matches no rows when full; duplicates are rejected by a
 * partial unique index; atomicity is the transaction.
 */

export class EventNotRegisterableError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "EventNotRegisterableError";
  }
}
export class CategoryNotFoundError extends Error {
  constructor() {
    super("That distance is not on this event.");
    this.name = "CategoryNotFoundError";
  }
}
export class ParticipantNotOwnedError extends Error {
  constructor() {
    super("One of those people is not on your account.");
    this.name = "ParticipantNotOwnedError";
  }
}
export class UnderageParticipantError extends Error {
  constructor(
    public readonly participantName: string,
    public readonly age: number,
    public readonly minAge: number,
    public readonly categoryName: string,
  ) {
    super(`${participantName} is ${age}. The ${categoryName} needs a minimum age of ${minAge}.`);
    this.name = "UnderageParticipantError";
  }
}
export class AlreadyRegisteredError extends Error {
  constructor(
    public readonly participantName: string,
    public readonly categoryName: string,
  ) {
    super(`${participantName} is already registered for this event in the ${categoryName}.`);
    this.name = "AlreadyRegisteredError";
  }
}
export class NotEnoughSlotsError extends Error {
  constructor(
    public readonly requested: number,
    public readonly remaining: number,
  ) {
    super(
      remaining === 0
        ? "That distance just sold out."
        : `Only ${remaining} slot${remaining === 1 ? "" : "s"} left, and you chose ${requested}.`,
    );
    this.name = "NotEnoughSlotsError";
  }
}

export type ConfirmedRegistration = {
  id: string;
  ref: string;
  participantName: string;
};

export type RegistrationResult = {
  groupId: string;
  eventSlug: string;
  categoryName: string;
  registrations: ConfirmedRegistration[];
  replayed: boolean;
};

function snapshotOf(participant: {
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  phone: string;
  email: string | null;
}) {
  return {
    fullName: participant.fullName,
    dateOfBirth: participant.dateOfBirth.toISOString().slice(0, 10),
    gender: participant.gender,
    phone: participant.phone,
    email: participant.email,
  };
}

export async function registerParticipants(
  userId: string,
  eventSlug: string,
  input: RegistrationRequest,
): Promise<RegistrationResult> {
  // --- idempotent replay -------------------------------------------------
  // A double-tap, a retried fetch, or a back-then-forward all arrive with the
  // same key. Return what was already created rather than charging the person
  // a second slot.
  const existing = await findByGroupId(input.idempotencyKey, userId);
  if (existing) return existing;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      startAt: true,
      timezone: true,
      termsVersion: true,
      refPrefix: true,
      registrationOpensAt: true,
      registrationClosesAt: true,
    },
  });
  if (!event) throw new EventNotRegisterableError("That race does not exist.");

  // Re-checked server-side at confirm time. The page may have been open for an
  // hour, and the window may have closed since it rendered.
  if (!canRegister(event)) {
    throw new EventNotRegisterableError("Registration for this race is not open.");
  }

  const category = await prisma.raceCategory.findFirst({
    where: { id: input.categoryId, eventId: event.id },
    select: { id: true, name: true, minAge: true, slotLimit: true, slotsTaken: true },
  });
  if (!category) throw new CategoryNotFoundError();

  return prisma
    .$transaction(
      async (tx) => {
        // --- resolve people -------------------------------------------------
        const created: { id: string }[] = [];
        for (const person of input.newParticipants) {
          const row = await tx.participant.create({
            data: {
              userId,
              fullName: person.fullName,
              dateOfBirth: toDateOnly(person.dateOfBirth),
              gender: person.gender,
              phone: person.phone,
              email: person.email || null,
              isSelf: false,
            },
            select: { id: true },
          });
          created.push(row);
        }

        const ids = [...input.participantIds, ...created.map((c) => c.id)];

        // Scoped by userId: an id belonging to someone else simply is not found.
        const participants = await tx.participant.findMany({
          where: { id: { in: ids }, userId, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            email: true,
          },
        });
        if (participants.length !== ids.length) throw new ParticipantNotOwnedError();

        // --- eligibility ----------------------------------------------------
        const ages = new Map<string, number>();
        for (const person of participants) {
          const age = ageOnEventDate(person.dateOfBirth, event.startAt, event.timezone);
          ages.set(person.id, age);
          if (category.minAge != null && age < category.minAge) {
            throw new UnderageParticipantError(
              person.fullName,
              age,
              category.minAge,
              category.name,
            );
          }
        }

        // --- duplicates -----------------------------------------------------
        // The partial unique index is the real guard; this exists to name the
        // person and the distance instead of surfacing a constraint violation.
        const clashes = await tx.registration.findMany({
          where: { eventId: event.id, participantId: { in: ids }, status: "CONFIRMED" },
          select: { participantId: true, category: { select: { name: true } } },
        });
        if (clashes.length > 0) {
          const clash = clashes[0]!;
          const person = participants.find((p) => p.id === clash.participantId);
          throw new AlreadyRegisteredError(person?.fullName ?? "That person", clash.category.name);
        }

        // --- claim capacity --------------------------------------------------
        // Conditional UPDATE, not read-then-write. If the category is full the
        // statement matches zero rows; there is no window between checking and
        // taking.
        const n = participants.length;
        const claimed = await tx.$executeRaw`
        UPDATE "RaceCategory"
        SET "slotsTaken" = "slotsTaken" + ${n}
        WHERE "id" = ${category.id} AND "slotsTaken" + ${n} <= "slotLimit"`;

        if (claimed === 0) {
          const fresh = await tx.raceCategory.findUniqueOrThrow({
            where: { id: category.id },
            select: { slotLimit: true, slotsTaken: true },
          });
          throw new NotEnoughSlotsError(n, Math.max(0, fresh.slotLimit - fresh.slotsTaken));
        }

        // --- claim a block of reference numbers ------------------------------
        // Also atomic, so two concurrent checkouts never mint the same ref.
        const [seq] = await tx.$queryRaw<{ registrationSeq: number }[]>`
        UPDATE "Event"
        SET "registrationSeq" = "registrationSeq" + ${n}
        WHERE "id" = ${event.id}
        RETURNING "registrationSeq"`;
        const lastNumber = seq!.registrationSeq;
        const firstNumber = lastNumber - n + 1;

        const prefix = event.refPrefix ?? deriveRefPrefix(event.name);
        const acceptedTermsAt = new Date();

        const rows = participants.map((person, index) => ({
          ref: formatRegistrationRef(prefix, event.startAt, firstNumber + index, event.timezone),
          groupId: input.idempotencyKey,
          eventId: event.id,
          categoryId: category.id,
          participantId: person.id,
          userId,
          participantSnapshot: snapshotOf(person),
          ageAtEvent: ages.get(person.id)!,
          acceptedTermsAt,
          termsVersion: event.termsVersion,
        }));

        await tx.registration.createMany({ data: rows });

        const saved = await tx.registration.findMany({
          where: { groupId: input.idempotencyKey },
          select: { id: true, ref: true, participant: { select: { fullName: true } } },
          orderBy: { ref: "asc" },
        });

        return {
          groupId: input.idempotencyKey,
          eventSlug: event.slug,
          categoryName: category.name,
          registrations: saved.map((r) => ({
            id: r.id,
            ref: r.ref,
            participantName: r.participant.fullName,
          })),
          replayed: false,
        };
      },
      { timeout: 20_000, maxWait: 8_000 },
    )
    .catch(async (error) => {
      // Two requests with the same key can both pass the replay check. The
      // partial unique index rejects the loser; return the winner's group.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await findByGroupId(input.idempotencyKey, userId);
        if (raced) return raced;
        throw new AlreadyRegisteredError("That person", "this event");
      }
      throw error;
    });
}

async function findByGroupId(groupId: string, userId: string): Promise<RegistrationResult | null> {
  const rows = await prisma.registration.findMany({
    where: { groupId, userId },
    select: {
      id: true,
      ref: true,
      participant: { select: { fullName: true } },
      category: { select: { name: true } },
      event: { select: { slug: true } },
    },
    orderBy: { ref: "asc" },
  });
  if (rows.length === 0) return null;

  return {
    groupId,
    eventSlug: rows[0]!.event.slug,
    categoryName: rows[0]!.category.name,
    registrations: rows.map((r) => ({
      id: r.id,
      ref: r.ref,
      participantName: r.participant.fullName,
    })),
    replayed: true,
  };
}

/**
 * Cancelling releases the slot and, because the unique index is partial on
 * CONFIRMED, frees that person to register again.
 */
export async function cancelRegistration(registrationId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      select: { id: true, status: true, categoryId: true },
    });
    if (!registration) return null;
    if (registration.status === "CANCELLED") return registration;

    await tx.registration.update({
      where: { id: registrationId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason: reason ?? null },
    });

    // Guarded so a double-cancel can never push the counter below zero.
    await tx.$executeRaw`
      UPDATE "RaceCategory"
      SET "slotsTaken" = "slotsTaken" - 1
      WHERE "id" = ${registration.categoryId} AND "slotsTaken" > 0`;

    return { ...registration, status: "CANCELLED" as const };
  });
}

// --- read side ------------------------------------------------------------

/**
 * History always renders the frozen `participantSnapshot`, never the live
 * participant row. If someone corrects a spelling next year, the entry still
 * shows what was actually submitted — which is what was printed on the bib and
 * what the organizer's start list says.
 */
export type RegistrationSnapshot = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
};

const HISTORY_SELECT = {
  id: true,
  ref: true,
  groupId: true,
  status: true,
  ageAtEvent: true,
  createdAt: true,
  participantSnapshot: true,
  category: { select: { name: true, startTime: true } },
  event: {
    select: {
      slug: true,
      name: true,
      startAt: true,
      timezone: true,
      venueName: true,
      city: true,
    },
  },
} as const;

export async function listRegistrationsForUser(
  userId: string,
  filter: "upcoming" | "past" = "upcoming",
  now = new Date(),
) {
  return prisma.registration.findMany({
    where: {
      userId,
      event: { startAt: filter === "upcoming" ? { gte: now } : { lt: now } },
    },
    // Soonest first when looking forward, most recent first when looking back.
    orderBy: [{ event: { startAt: filter === "upcoming" ? "asc" : "desc" } }, { ref: "asc" }],
    select: HISTORY_SELECT,
  });
}

export async function countRegistrations(userId: string, now = new Date()) {
  const [upcoming, past] = await Promise.all([
    prisma.registration.count({ where: { userId, event: { startAt: { gte: now } } } }),
    prisma.registration.count({ where: { userId, event: { startAt: { lt: now } } } }),
  ]);
  return { upcoming, past };
}

/** Scoped by userId, so another account's registration id simply is not found. */
export async function getRegistrationDetail(userId: string, id: string) {
  return prisma.registration.findFirst({
    where: { id, userId },
    select: {
      ...HISTORY_SELECT,
      termsVersion: true,
      acceptedTermsAt: true,
      cancelledAt: true,
      cancelledReason: true,
      category: { select: { name: true, startTime: true, minAge: true, distanceMeters: true } },
      event: {
        select: {
          slug: true,
          name: true,
          startAt: true,
          timezone: true,
          venueName: true,
          addressLine: true,
          city: true,
          state: true,
          pincode: true,
          mapsUrl: true,
          organizer: { select: { name: true, contactEmail: true, contactPhone: true } },
        },
      },
    },
  });
}

export async function getRegistrationGroup(userId: string, groupId: string) {
  return prisma.registration.findMany({
    where: { groupId, userId },
    orderBy: { ref: "asc" },
    select: {
      id: true,
      ref: true,
      status: true,
      ageAtEvent: true,
      participant: { select: { fullName: true } },
      category: { select: { name: true, startTime: true } },
      event: {
        select: {
          slug: true,
          name: true,
          startAt: true,
          timezone: true,
          venueName: true,
          addressLine: true,
          city: true,
        },
      },
    },
  });
}

export type RegistrationHistoryItem = Awaited<ReturnType<typeof listRegistrationsForUser>>[number];
export type RegistrationDetail = NonNullable<Awaited<ReturnType<typeof getRegistrationDetail>>>;
