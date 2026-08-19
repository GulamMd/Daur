/**
 * Age rules for eligibility.
 *
 * Two things this gets right that a naive implementation does not:
 *
 * 1. Age is measured on the EVENT date, not today. Someone who turns 16 the
 *    week before the race is eligible for a 16+ category, and someone who turns
 *    16 the day after is not.
 * 2. The event date is resolved in the EVENT's timezone. A 05:00 IST flag-off
 *    is 23:30 the previous day in UTC, so reading the calendar date off a UTC
 *    timestamp shifts the race a day earlier and can flip a birthday boundary.
 *
 * dateOfBirth comes from a `date` column, which has no time and no zone, so its
 * parts are read in UTC deliberately — not converted.
 */

type YMD = { year: number; month: number; day: number };

function partsInZone(instant: Date, timeZone: string): YMD {
  // en-CA formats as YYYY-MM-DD, which is stable to split.
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  const [year, month, day] = formatted.split("-").map(Number);
  return { year, month, day };
}

function birthParts(dateOfBirth: Date): YMD {
  return {
    year: dateOfBirth.getUTCFullYear(),
    month: dateOfBirth.getUTCMonth() + 1,
    day: dateOfBirth.getUTCDate(),
  };
}

/** Whole years old on the day the event starts, in the event's timezone. */
export function ageOnEventDate(dateOfBirth: Date, eventStartAt: Date, timeZone: string): number {
  const born = birthParts(dateOfBirth);
  const race = partsInZone(eventStartAt, timeZone);

  let age = race.year - born.year;
  const birthdayHasPassed =
    race.month > born.month || (race.month === born.month && race.day >= born.day);
  if (!birthdayHasPassed) age -= 1;

  return age;
}

export function meetsMinAge(
  dateOfBirth: Date,
  eventStartAt: Date,
  timeZone: string,
  minAge: number | null | undefined,
): boolean {
  if (minAge == null) return true;
  return ageOnEventDate(dateOfBirth, eventStartAt, timeZone) >= minAge;
}

/** Age today, for display in participant lists. Not used for eligibility. */
export function currentAge(dateOfBirth: Date, timeZone = "Asia/Kolkata", now = new Date()): number {
  return ageOnEventDate(dateOfBirth, now, timeZone);
}
