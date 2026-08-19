import { EventStatus } from "@/generated/prisma/enums";
import { formatDayAndMonth } from "@/lib/format";

export type StatusInput = {
  status: EventStatus;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
};

/**
 * Status is an explicit column set by the organizer, but the dates act as a
 * guard around it. An event left on REGISTRATION_OPEN past its closing time
 * must not keep accepting entries just because nobody ran the status script.
 *
 * This never opens registration that the organizer has not opened — it only
 * ever narrows.
 */
export function effectiveStatus(event: StatusInput, now = new Date()): EventStatus {
  if (event.status !== EventStatus.REGISTRATION_OPEN) return event.status;

  if (event.registrationOpensAt && now < event.registrationOpensAt) {
    return EventStatus.COMING_SOON;
  }
  if (event.registrationClosesAt && now >= event.registrationClosesAt) {
    return EventStatus.REGISTRATION_CLOSED;
  }
  return EventStatus.REGISTRATION_OPEN;
}

export function canRegister(event: StatusInput, now = new Date()): boolean {
  return effectiveStatus(event, now) === EventStatus.REGISTRATION_OPEN;
}

/** DRAFT events 404 for the public; everything else renders. */
export function isPubliclyVisible(status: EventStatus): boolean {
  return status !== EventStatus.DRAFT;
}

/** Copy for the sticky CTA, per the design direction's status table. */
export function ctaLabel(event: StatusInput, now = new Date()): string {
  switch (effectiveStatus(event, now)) {
    case EventStatus.REGISTRATION_OPEN:
      return "Register";
    case EventStatus.COMING_SOON:
      return event.registrationOpensAt
        ? `Registration opens ${formatDayAndMonth(event.registrationOpensAt)}`
        : "Registration opens soon";
    case EventStatus.REGISTRATION_CLOSED:
      return "Registration closed";
    case EventStatus.COMPLETED:
      return "Event completed";
    case EventStatus.CANCELLED:
      return "Event cancelled";
    default:
      return "Registration closed";
  }
}
