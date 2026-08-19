import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";

const base = {
  uid: "group-123@daur",
  start: new Date("2026-09-13T05:30:00+05:30"),
  end: new Date("2026-09-13T08:30:00+05:30"),
  summary: "Daur Bengaluru Edition 04 — 10K",
  location: "Cubbon Park, Kasturba Road, Bengaluru",
  description: "10K flag-off at 05:30.",
};

const lines = (ics: string) => ics.split("\r\n");

describe("buildIcs", () => {
  it("emits a well-formed envelope", () => {
    const ics = buildIcs(base);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("uses CRLF endings, as the spec requires", () => {
    const ics = buildIcs(base);
    expect(ics.includes("\r\n")).toBe(true);
    // No bare LF anywhere.
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  it("writes times as UTC instants", () => {
    const ics = buildIcs(base);
    // 05:30 IST is 00:00 UTC the same day.
    expect(ics).toContain("DTSTART:20260913T000000Z");
    expect(ics).toContain("DTEND:20260913T030000Z");
  });

  it("escapes commas, semicolons and backslashes in text values", () => {
    const ics = buildIcs({
      ...base,
      summary: "Race; with, punctuation\\here",
      description: "line one\nline two",
    });
    expect(ics).toContain("Race\\; with\\, punctuation\\\\here");
    expect(ics).toContain("line one\\nline two");
  });

  it("folds long lines to 75 octets", () => {
    const ics = buildIcs({ ...base, description: "x".repeat(400) });
    for (const line of lines(ics)) {
      expect(Buffer.from(line, "utf8").length).toBeLessThanOrEqual(75);
    }
  });

  it("marks continuation lines with a leading space", () => {
    const ics = buildIcs({ ...base, description: "y".repeat(300) });
    const continuations = lines(ics).filter((l) => l.startsWith(" "));
    expect(continuations.length).toBeGreaterThan(0);
  });

  it("never splits a multi-byte character across a fold", () => {
    // Devanagari is 3 bytes per character; folding on a naive byte boundary
    // would produce mojibake in the calendar entry.
    const ics = buildIcs({ ...base, description: "दौड़ ".repeat(60) });
    const unfolded = ics
      .split("\r\n")
      .reduce<string[]>((acc, line) => {
        if (line.startsWith(" ")) acc[acc.length - 1] += line.slice(1);
        else acc.push(line);
        return acc;
      }, [])
      .join("\n");
    expect(unfolded).toContain("दौड़");
    expect(unfolded).not.toContain("�"); // replacement character
  });

  it("omits URL when none is given", () => {
    expect(buildIcs(base)).not.toContain("URL:");
    expect(buildIcs({ ...base, url: "https://daur.run/events/x" })).toContain("URL:");
  });
});
