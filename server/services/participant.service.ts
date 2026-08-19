import { prisma } from "@/server/db";
import { toDateOnly, type ParticipantInput } from "@/lib/schemas/participant.schema";

/**
 * Every function here takes the userId from the session and scopes on it. An
 * id arriving from the client is only ever used inside a `where` that also
 * pins userId, so a guessed id resolves to nothing rather than to someone
 * else's record.
 */

export class ParticipantNotFoundError extends Error {
  constructor() {
    super("That person is not on your account.");
    this.name = "ParticipantNotFoundError";
  }
}

export class DuplicateParticipantError extends Error {
  constructor(name: string) {
    super(`${name} is already on your account with the same date of birth.`);
    this.name = "DuplicateParticipantError";
  }
}

export class ParticipantHasUpcomingRaceError extends Error {
  constructor(
    public readonly participantName: string,
    public readonly eventName: string,
    public readonly eventDate: Date,
  ) {
    super(`${participantName} is registered for ${eventName}.`);
    this.name = "ParticipantHasUpcomingRaceError";
  }
}

const LIST_SELECT = {
  id: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  email: true,
  isSelf: true,
} as const;

export async function listParticipants(userId: string) {
  return prisma.participant.findMany({
    where: { userId, deletedAt: null },
    // The account holder first, then alphabetical — the person registering is
    // nearly always themselves plus people they know by name.
    orderBy: [{ isSelf: "desc" }, { fullName: "asc" }],
    select: {
      ...LIST_SELECT,
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export async function getParticipant(userId: string, id: string) {
  const participant = await prisma.participant.findFirst({
    where: { id, userId, deletedAt: null },
    select: LIST_SELECT,
  });
  if (!participant) throw new ParticipantNotFoundError();
  return participant;
}

async function assertNoDuplicate(userId: string, input: ParticipantInput, excludeId?: string) {
  const clash = await prisma.participant.findFirst({
    where: {
      userId,
      deletedAt: null,
      id: excludeId ? { not: excludeId } : undefined,
      fullName: { equals: input.fullName, mode: "insensitive" },
      dateOfBirth: toDateOnly(input.dateOfBirth),
    },
    select: { id: true },
  });
  if (clash) throw new DuplicateParticipantError(input.fullName);
}

export async function createParticipant(userId: string, input: ParticipantInput) {
  await assertNoDuplicate(userId, input);

  return prisma.$transaction(async (tx) => {
    // Exactly one person on an account can be "me".
    if (input.isSelf) {
      await tx.participant.updateMany({
        where: { userId, isSelf: true },
        data: { isSelf: false },
      });
    }

    return tx.participant.create({
      data: {
        userId,
        fullName: input.fullName,
        dateOfBirth: toDateOnly(input.dateOfBirth),
        gender: input.gender,
        phone: input.phone,
        email: input.email || null,
        isSelf: input.isSelf,
      },
      select: LIST_SELECT,
    });
  });
}

export async function updateParticipant(userId: string, id: string, input: ParticipantInput) {
  const existing = await prisma.participant.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new ParticipantNotFoundError();

  await assertNoDuplicate(userId, input, id);

  return prisma.$transaction(async (tx) => {
    if (input.isSelf) {
      await tx.participant.updateMany({
        where: { userId, isSelf: true, id: { not: id } },
        data: { isSelf: false },
      });
    }

    return tx.participant.update({
      where: { id },
      data: {
        fullName: input.fullName,
        dateOfBirth: toDateOnly(input.dateOfBirth),
        gender: input.gender,
        phone: input.phone,
        email: input.email || null,
        isSelf: input.isSelf,
      },
      select: LIST_SELECT,
    });
  });
}

export type DeleteOutcome = "hard-deleted" | "soft-deleted";

/**
 * Three outcomes, in order of severity:
 *
 *   1. Holds a confirmed entry for a race that has not happened yet — refuse.
 *      Silently removing them would leave a paid-for start-line slot attached
 *      to a person the account can no longer see.
 *   2. Has past registrations — soft delete. The row stays so race history
 *      still resolves, but it disappears from the account.
 *   3. Referenced by nothing — hard delete, so the table does not accumulate
 *      tombstones for people added by mistake.
 */
export async function deleteParticipant(
  userId: string,
  id: string,
  now = new Date(),
): Promise<DeleteOutcome> {
  const participant = await prisma.participant.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true, fullName: true },
  });
  if (!participant) throw new ParticipantNotFoundError();

  const upcoming = await prisma.registration.findFirst({
    where: {
      participantId: id,
      status: "CONFIRMED",
      event: { startAt: { gte: now } },
    },
    orderBy: { event: { startAt: "asc" } },
    select: { event: { select: { name: true, startAt: true } } },
  });

  if (upcoming) {
    throw new ParticipantHasUpcomingRaceError(
      participant.fullName,
      upcoming.event.name,
      upcoming.event.startAt,
    );
  }

  const registrations = await prisma.registration.count({ where: { participantId: id } });

  if (registrations > 0) {
    await prisma.participant.update({ where: { id }, data: { deletedAt: now } });
    return "soft-deleted";
  }

  await prisma.participant.delete({ where: { id } });
  return "hard-deleted";
}

export type ParticipantListItem = Awaited<ReturnType<typeof listParticipants>>[number];
