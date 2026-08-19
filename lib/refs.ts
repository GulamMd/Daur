/**
 * Registration references, e.g. `DBE26-0042`.
 *
 *   DBE   event prefix — set per event, because these get printed and read
 *         aloud on race morning and the organizer should control them
 *   26    two-digit year of the event, in the event's timezone
 *   0042  per-event sequence, zero-padded to four
 *
 * The prefix is stored on the Event rather than derived at read time, so that
 * renaming an event never changes references already issued.
 */

const PREFIX_PATTERN = /^[A-Z]{2,5}$/;

export function isValidRefPrefix(value: string): boolean {
  return PREFIX_PATTERN.test(value);
}

/**
 * Fallback used only when an event is authored without an explicit prefix:
 * initials of the first words, uppercased. "Daur Bengaluru Edition 04" -> DBE.
 */
export function deriveRefPrefix(eventName: string): string {
  const initials = eventName
    .split(/[\s-]+/)
    .map((word) => word.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase())
    .join("");

  const trimmed = initials.slice(0, 5);
  if (trimmed.length >= 2) return trimmed;

  // A single-word name ("Daur") yields one initial, which is not a valid
  // prefix. Take the first letters of the word itself rather than padding with
  // filler — "DAU" reads like a race code, "DX" reads like a placeholder.
  const firstWord = eventName.replace(/[^A-Za-z]/g, "");
  if (firstWord.length >= 2) return firstWord.slice(0, 3).toUpperCase();

  return (trimmed + "XX").slice(0, 2);
}

export function eventYearTwoDigit(eventStartAt: Date, timeZone: string): string {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric" }).format(eventStartAt);
  return year.slice(-2);
}

export function formatRegistrationRef(
  prefix: string,
  eventStartAt: Date,
  sequence: number,
  timeZone: string,
): string {
  return `${prefix}${eventYearTwoDigit(eventStartAt, timeZone)}-${String(sequence).padStart(4, "0")}`;
}
