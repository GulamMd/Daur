import { describe, expect, it } from "vitest";
import { participantInputSchema } from "@/lib/schemas/participant.schema";
import { registrationRequestSchema } from "@/lib/schemas/registration.schema";
import { eventInputSchema } from "@/lib/schemas/event.schema";
import { signupSchema, emailSchema, phoneSchema } from "@/lib/schemas/auth.schema";

const person = (over: Record<string, unknown> = {}) => ({
  fullName: "Aisha Khalid",
  dateOfBirth: "2010-09-14",
  gender: "FEMALE",
  phone: "9876543210",
  email: "",
  isSelf: false,
  ...over,
});

describe("emailSchema", () => {
  it("normalises to lowercase and trims", () => {
    expect(emailSchema.parse("  Gulam@Example.COM ")).toBe("gulam@example.com");
  });

  it("rejects malformed addresses", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("phoneSchema", () => {
  it("accepts a 10-digit Indian mobile", () => {
    for (const p of ["6000000000", "7123456789", "9876543210"]) {
      expect(phoneSchema.safeParse(p).success, p).toBe(true);
    }
  });

  it("rejects wrong length or leading digit", () => {
    for (const p of ["123456789", "12345678901", "5876543210", "98765 43210", "+919876543210"]) {
      expect(phoneSchema.safeParse(p).success, p).toBe(false);
    }
  });
});

describe("signupSchema", () => {
  it("requires at least 8 password characters", () => {
    const base = { name: "Gulam", email: "a@b.com" };
    expect(signupSchema.safeParse({ ...base, password: "1234567" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });
});

describe("participantInputSchema", () => {
  it("accepts a valid person", () => {
    expect(participantInputSchema.safeParse(person()).success).toBe(true);
  });

  it("rejects a future date of birth", () => {
    expect(participantInputSchema.safeParse(person({ dateOfBirth: "2206-01-01" })).success).toBe(
      false,
    );
  });

  it("rejects an impossible age", () => {
    expect(participantInputSchema.safeParse(person({ dateOfBirth: "1850-01-01" })).success).toBe(
      false,
    );
  });

  it("rejects a non date-picker format", () => {
    expect(participantInputSchema.safeParse(person({ dateOfBirth: "14/09/2010" })).success).toBe(
      false,
    );
  });

  it("rejects a date that does not exist", () => {
    expect(participantInputSchema.safeParse(person({ dateOfBirth: "2010-02-30" })).success).toBe(
      false,
    );
  });

  it("allows an empty email but not a malformed one", () => {
    expect(participantInputSchema.safeParse(person({ email: "" })).success).toBe(true);
    expect(participantInputSchema.safeParse(person({ email: "nope" })).success).toBe(false);
  });

  it("defaults isSelf to false", () => {
    const parsed = participantInputSchema.parse({ ...person(), isSelf: undefined });
    expect(parsed.isSelf).toBe(false);
  });
});

describe("registrationRequestSchema", () => {
  const base = {
    categoryId: "cat_1",
    participantIds: ["p1"],
    newParticipants: [],
    acceptedTerms: true,
    idempotencyKey: "11111111-2222-4333-8444-555555555555",
  };

  it("accepts a valid request", () => {
    expect(registrationRequestSchema.safeParse(base).success).toBe(true);
  });

  it("requires the terms box", () => {
    expect(registrationRequestSchema.safeParse({ ...base, acceptedTerms: false }).success).toBe(
      false,
    );
  });

  it("requires a uuid idempotency key", () => {
    expect(registrationRequestSchema.safeParse({ ...base, idempotencyKey: "abc" }).success).toBe(
      false,
    );
  });

  it("requires at least one person from either source", () => {
    expect(
      registrationRequestSchema.safeParse({ ...base, participantIds: [], newParticipants: [] })
        .success,
    ).toBe(false);
    expect(
      registrationRequestSchema.safeParse({
        ...base,
        participantIds: [],
        newParticipants: [person()],
      }).success,
    ).toBe(true);
  });
});

describe("eventInputSchema", () => {
  const event = (over: Record<string, unknown> = {}) => ({
    slug: "test-race",
    name: "Test Race",
    startAt: "2026-09-13T05:00:00+05:30",
    venue: { name: "Park", addressLine: "1 Road", city: "Bengaluru" },
    categories: [
      {
        name: "5K",
        distanceMeters: 5000,
        startTime: "2026-09-13T06:00:00+05:30",
        slotLimit: 100,
      },
    ],
    sections: ["hero"],
    ...over,
  });

  it("accepts a minimal valid document", () => {
    expect(eventInputSchema.safeParse(event()).success).toBe(true);
  });

  // Images live either on the CDN or in this repo. z.url() alone rejects a
  // root-relative path outright, which made committing a photo to public/
  // impossible — the seed would not validate.
  it.each([
    ["a root-relative path we ship ourselves", "/images/events/daur-mumbai-edition-01.jpg"],
    ["an https CDN URL", "https://res.cloudinary.com/daur/image/upload/cover.jpg"],
  ])("accepts a coverImageUrl that is %s", (_label, coverImageUrl) => {
    expect(eventInputSchema.safeParse(event({ coverImageUrl })).success).toBe(true);
  });

  it.each([
    ["a protocol-relative URL", "//evil.com/x.jpg"],
    ["a path traversal", "/images/../../secret.jpg"],
    ["a path with no leading slash", "images/x.jpg"],
    ["a path outside /images/", "/uploads/x.jpg"],
    ["a non-image extension", "/images/x.txt"],
    ["a data URI", "data:image/png;base64,AAAA"],
  ])("rejects a coverImageUrl that is %s", (_label, coverImageUrl) => {
    expect(eventInputSchema.safeParse(event({ coverImageUrl })).success).toBe(false);
  });

  it("demands an explicit UTC offset on every instant", () => {
    // Without this, Date.parse treats the value as local time and a 05:00 IST
    // flag-off silently shifts depending on where the seed script runs.
    const result = eventInputSchema.safeParse(event({ startAt: "2026-09-13T05:00:00" }));
    expect(result.success).toBe(false);
  });

  it("rejects duplicate category names", () => {
    const result = eventInputSchema.safeParse(
      event({
        categories: [
          {
            name: "5K",
            distanceMeters: 5000,
            startTime: "2026-09-13T06:00:00+05:30",
            slotLimit: 10,
          },
          {
            name: "5k",
            distanceMeters: 5000,
            startTime: "2026-09-13T07:00:00+05:30",
            slotLimit: 10,
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a route pointing at a category that does not exist", () => {
    const result = eventInputSchema.safeParse(
      event({ routes: [{ categoryName: "42K", descriptionMd: "x" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects registration closing after the race starts", () => {
    const result = eventInputSchema.safeParse(
      event({ registrationClosesAt: "2026-09-14T00:00:00+05:30" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a close time before the open time", () => {
    const result = eventInputSchema.safeParse(
      event({
        registrationOpensAt: "2026-09-01T00:00:00+05:30",
        registrationClosesAt: "2026-08-01T00:00:00+05:30",
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unknown inclusion icon", () => {
    const result = eventInputSchema.safeParse(
      event({ inclusions: [{ icon: "unicorn", title: "Magic" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("requires alt text on every image", () => {
    const result = eventInputSchema.safeParse(
      event({ gallery: [{ url: "https://example.com/a.jpg", alt: "" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("uppercases and validates the ref prefix", () => {
    const ok = eventInputSchema.parse(event({ refPrefix: "dbe" }));
    expect(ok.refPrefix).toBe("DBE");
    expect(eventInputSchema.safeParse(event({ refPrefix: "D" })).success).toBe(false);
  });
});
