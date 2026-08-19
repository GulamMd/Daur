/**
 * Every date on the site is rendered in the EVENT's timezone, never the
 * viewer's. A runner in Dubai looking at a Bengaluru race needs to see the
 * 05:00 IST flag-off, not 03:30 their time.
 */

const DEFAULT_TZ = "Asia/Kolkata";

export function formatEventDate(date: Date, timeZone = DEFAULT_TZ): string {
  // Built from parts rather than .format(): every locale inserts its own commas
  // ("Sun, 13 Sept, 2026") and en-GB/en-IN abbreviate September to four letters.
  // We want a flat "Sun 13 Sep 2026".
  return joinParts(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(date),
  );
}

function joinParts(parts: Intl.DateTimeFormatPart[]): string {
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  // "Sept" -> "Sep"; every other short month is already three letters.
  return `${get("weekday")} ${get("day")} ${get("month").slice(0, 3)} ${get("year")}`;
}

export function formatDayAndMonth(date: Date, timeZone = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month").slice(0, 3)}`;
}

/** 24-hour, because a 5 AM race start should never read "5:00 am". */
export function formatTime(date: Date, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatYear(date: Date, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric" }).format(date);
}

/** "214 left" beats "Filling fast" — specific over clever. */
export function slotsRemaining(slotLimit: number, slotsTaken: number): number {
  return Math.max(0, slotLimit - slotsTaken);
}

export function isScarce(slotLimit: number, slotsTaken: number): boolean {
  const left = slotsRemaining(slotLimit, slotsTaken);
  return left > 0 && left / slotLimit < 0.2;
}
