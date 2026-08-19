import { describe, expect, it } from "vitest";
import {
  deriveRefPrefix,
  eventYearTwoDigit,
  formatRegistrationRef,
  isValidRefPrefix,
} from "@/lib/refs";

const RACE = new Date("2026-09-13T05:00:00+05:30");
const IST = "Asia/Kolkata";

describe("isValidRefPrefix", () => {
  it("accepts two to five uppercase letters", () => {
    expect(isValidRefPrefix("DB")).toBe(true);
    expect(isValidRefPrefix("DBE")).toBe(true);
    expect(isValidRefPrefix("DAURX")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidRefPrefix("D")).toBe(false);
    expect(isValidRefPrefix("DAURXX")).toBe(false);
    expect(isValidRefPrefix("dbe")).toBe(false);
    expect(isValidRefPrefix("DB1")).toBe(false);
    expect(isValidRefPrefix("")).toBe(false);
  });
});

describe("deriveRefPrefix", () => {
  it("takes initials of the words", () => {
    expect(deriveRefPrefix("Daur Bengaluru Edition 04")).toBe("DBE");
    expect(deriveRefPrefix("Daur Monsoon Run")).toBe("DMR");
  });

  it("splits on hyphens too", () => {
    expect(deriveRefPrefix("Daur-Bengaluru-Half")).toBe("DBH");
  });

  it("ignores digits and punctuation", () => {
    expect(deriveRefPrefix("Daur 2026 Bengaluru!")).toBe("DB");
  });

  it("caps at five letters", () => {
    expect(deriveRefPrefix("A B C D E F G H")).toBe("ABCDE");
  });

  it("still returns something usable for a degenerate name", () => {
    expect(deriveRefPrefix("Run")).toBe("RUN");
    expect(deriveRefPrefix("Daur")).toBe("DAU");
    expect(deriveRefPrefix("123")).toBe("XX");
  });
});

describe("eventYearTwoDigit", () => {
  it("uses the event timezone, not UTC", () => {
    // 1 Jan 2027 00:30 IST is still 31 Dec 2026 in UTC.
    const newYear = new Date("2027-01-01T00:30:00+05:30");
    expect(eventYearTwoDigit(newYear, IST)).toBe("27");
    expect(eventYearTwoDigit(newYear, "UTC")).toBe("26");
  });
});

describe("formatRegistrationRef", () => {
  it("zero-pads to four digits", () => {
    expect(formatRegistrationRef("DBE", RACE, 1, IST)).toBe("DBE26-0001");
    expect(formatRegistrationRef("DBE", RACE, 42, IST)).toBe("DBE26-0042");
    expect(formatRegistrationRef("DBE", RACE, 9999, IST)).toBe("DBE26-9999");
  });

  it("does not truncate past four digits", () => {
    // A race bigger than 9,999 entries should get a longer ref, not a wrapped one.
    expect(formatRegistrationRef("DBE", RACE, 10000, IST)).toBe("DBE26-10000");
  });

  it("produces unique refs across a sequence", () => {
    const refs = Array.from({ length: 500 }, (_, i) =>
      formatRegistrationRef("DBE", RACE, i + 1, IST),
    );
    expect(new Set(refs).size).toBe(500);
  });
});
