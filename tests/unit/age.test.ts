import { describe, expect, it } from "vitest";
import { ageOnEventDate, meetsMinAge, currentAge } from "@/lib/age";

/**
 * Age decides who is allowed to start a race, so the boundaries get tested
 * rather than assumed.
 *
 * The reference race is 13 Sep 2026, 05:00 IST — which is 12 Sep 23:30 UTC.
 * That gap is the whole reason this module resolves dates in the event's
 * timezone instead of reading them off a UTC timestamp.
 */
const RACE_IST_0500 = new Date("2026-09-13T05:00:00+05:30");
const IST = "Asia/Kolkata";

const dob = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("ageOnEventDate", () => {
  it("counts a birthday that falls the day before the race", () => {
    expect(ageOnEventDate(dob("2010-09-12"), RACE_IST_0500, IST)).toBe(16);
  });

  it("counts a birthday that falls ON race day", () => {
    // The trap: in UTC the race instant is 12 Sep, so a naive implementation
    // decides the birthday has not happened yet and returns 15.
    expect(ageOnEventDate(dob("2010-09-13"), RACE_IST_0500, IST)).toBe(16);
  });

  it("does not count a birthday the day after the race", () => {
    expect(ageOnEventDate(dob("2010-09-14"), RACE_IST_0500, IST)).toBe(15);
  });

  it("resolves the date in the event timezone, not UTC", () => {
    const asUtc = ageOnEventDate(dob("2010-09-13"), RACE_IST_0500, "UTC");
    const asIst = ageOnEventDate(dob("2010-09-13"), RACE_IST_0500, IST);
    expect(asUtc).toBe(15); // 12 Sep in UTC — birthday not yet reached
    expect(asIst).toBe(16); // 13 Sep in IST — birthday reached
  });

  it("handles a 29 February birthday in a non-leap year", () => {
    // Born 29 Feb 2008; by 13 Sep 2026 they have had their 2026 birthday.
    expect(ageOnEventDate(dob("2008-02-29"), RACE_IST_0500, IST)).toBe(18);
  });

  it("handles 29 February against a race held on 28 February", () => {
    const feb28 = new Date("2026-02-28T06:00:00+05:30");
    // 2026 is not a leap year, so 29 Feb has not "occurred" by 28 Feb.
    expect(ageOnEventDate(dob("2008-02-29"), feb28, IST)).toBe(17);
  });

  it("handles 29 February against a race held on 1 March", () => {
    const mar1 = new Date("2026-03-01T06:00:00+05:30");
    expect(ageOnEventDate(dob("2008-02-29"), mar1, IST)).toBe(18);
  });

  it("returns 0 for a baby born earlier the same year", () => {
    expect(ageOnEventDate(dob("2026-01-04"), RACE_IST_0500, IST)).toBe(0);
  });

  it("goes negative for a date of birth after the race", () => {
    // Not a real case, but it must not silently clamp — the caller decides.
    expect(ageOnEventDate(dob("2027-01-01"), RACE_IST_0500, IST)).toBeLessThan(0);
  });

  it("is stable across a westward timezone", () => {
    const nyRace = new Date("2026-09-13T07:00:00-04:00");
    expect(ageOnEventDate(dob("2010-09-13"), nyRace, "America/New_York")).toBe(16);
  });
});

describe("meetsMinAge", () => {
  it("allows anyone when no minimum is set", () => {
    expect(meetsMinAge(dob("2020-01-01"), RACE_IST_0500, IST, null)).toBe(true);
    expect(meetsMinAge(dob("2020-01-01"), RACE_IST_0500, IST, undefined)).toBe(true);
  });

  it("admits someone exactly on the minimum", () => {
    expect(meetsMinAge(dob("2010-09-13"), RACE_IST_0500, IST, 16)).toBe(true);
  });

  it("rejects someone one day short", () => {
    expect(meetsMinAge(dob("2010-09-14"), RACE_IST_0500, IST, 16)).toBe(false);
  });
});

describe("currentAge", () => {
  it("measures against the supplied instant", () => {
    expect(currentAge(dob("2000-06-15"), IST, new Date("2026-06-14T12:00:00+05:30"))).toBe(25);
    expect(currentAge(dob("2000-06-15"), IST, new Date("2026-06-15T12:00:00+05:30"))).toBe(26);
  });
});
