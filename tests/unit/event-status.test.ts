import { describe, expect, it } from "vitest";
import { effectiveStatus, canRegister, isPubliclyVisible, ctaLabel } from "@/lib/event-status";
import { EventStatus } from "@/generated/prisma/enums";

const at = (iso: string) => new Date(iso);

const openEvent = (opens: string | null, closes: string | null) => ({
  status: EventStatus.REGISTRATION_OPEN,
  registrationOpensAt: opens ? at(opens) : null,
  registrationClosesAt: closes ? at(closes) : null,
});

describe("effectiveStatus", () => {
  it("passes non-open statuses straight through", () => {
    for (const status of [
      EventStatus.DRAFT,
      EventStatus.COMING_SOON,
      EventStatus.REGISTRATION_CLOSED,
      EventStatus.COMPLETED,
      EventStatus.CANCELLED,
    ]) {
      const event = { status, registrationOpensAt: null, registrationClosesAt: null };
      expect(effectiveStatus(event, at("2026-06-01T00:00:00Z"))).toBe(status);
    }
  });

  it("holds an open event shut before its opening time", () => {
    const event = openEvent("2026-09-01T00:00:00Z", null);
    expect(effectiveStatus(event, at("2026-08-31T23:59:59Z"))).toBe(EventStatus.COMING_SOON);
  });

  it("opens exactly at the opening instant", () => {
    const event = openEvent("2026-09-01T00:00:00Z", null);
    expect(effectiveStatus(event, at("2026-09-01T00:00:00Z"))).toBe(EventStatus.REGISTRATION_OPEN);
  });

  it("closes an open event once the window has passed", () => {
    const event = openEvent(null, "2026-09-10T00:00:00Z");
    expect(effectiveStatus(event, at("2026-09-10T00:00:00Z"))).toBe(
      EventStatus.REGISTRATION_CLOSED,
    );
  });

  it("only ever narrows — it never opens what the organizer left shut", () => {
    // A COMING_SOON event whose window has arrived stays COMING_SOON until a
    // human flips it. The guard is a safety net, not an automation.
    const event = {
      status: EventStatus.COMING_SOON,
      registrationOpensAt: at("2026-01-01T00:00:00Z"),
      registrationClosesAt: at("2026-12-01T00:00:00Z"),
    };
    expect(effectiveStatus(event, at("2026-06-01T00:00:00Z"))).toBe(EventStatus.COMING_SOON);
  });
});

describe("canRegister", () => {
  it("is true only inside the window on an open event", () => {
    const event = openEvent("2026-09-01T00:00:00Z", "2026-09-10T00:00:00Z");
    expect(canRegister(event, at("2026-08-30T00:00:00Z"))).toBe(false);
    expect(canRegister(event, at("2026-09-05T00:00:00Z"))).toBe(true);
    expect(canRegister(event, at("2026-09-11T00:00:00Z"))).toBe(false);
  });
});

describe("isPubliclyVisible", () => {
  it("hides only drafts", () => {
    expect(isPubliclyVisible(EventStatus.DRAFT)).toBe(false);
    expect(isPubliclyVisible(EventStatus.COMING_SOON)).toBe(true);
    expect(isPubliclyVisible(EventStatus.CANCELLED)).toBe(true);
  });
});

describe("ctaLabel", () => {
  it("names the opening date when there is one", () => {
    const event = openEvent("2026-09-22T04:30:00Z", null);
    expect(ctaLabel(event, at("2026-09-01T00:00:00Z"))).toBe("Registration opens 22 Sep");
  });

  it("falls back gracefully with no opening date", () => {
    const event = {
      status: EventStatus.COMING_SOON,
      registrationOpensAt: null,
      registrationClosesAt: null,
    };
    expect(ctaLabel(event, at("2026-09-01T00:00:00Z"))).toBe("Registration opens soon");
  });

  it("labels every terminal state", () => {
    const make = (status: EventStatus) => ({
      status,
      registrationOpensAt: null,
      registrationClosesAt: null,
    });
    expect(ctaLabel(make(EventStatus.REGISTRATION_CLOSED))).toBe("Registration closed");
    expect(ctaLabel(make(EventStatus.COMPLETED))).toBe("Event completed");
    expect(ctaLabel(make(EventStatus.CANCELLED))).toBe("Event cancelled");
  });
});
