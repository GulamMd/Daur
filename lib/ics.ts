/**
 * Minimal RFC 5545 generator for a single race entry.
 *
 * Times are emitted as UTC instants (the trailing Z form) rather than with a
 * VTIMEZONE block: the flag-off is a fixed moment, and every calendar client
 * renders a UTC instant correctly in the reader's own zone without us shipping
 * an IANA definition.
 */

type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location: string;
  description: string;
  url?: string;
};

/** RFC 5545 escapes backslash, semicolon, comma and newline in TEXT values. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Content lines must not exceed 75 octets; longer ones are folded onto
 * continuation lines beginning with a single space. Folding is done on octets,
 * not characters, so a multi-byte character is never split down the middle.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  let limit = 75;

  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off if we landed inside a UTF-8 continuation byte (10xxxxxx).
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    limit = 74; // continuation lines carry a leading space
  }

  return parts.join("\r\n ");
}

export function buildIcs(event: IcsEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Daur//Race Registration//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    ...(event.url ? [`URL:${escapeText(event.url)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // CRLF line endings are mandatory, and the file must end with one.
  return lines.map(fold).join("\r\n") + "\r\n";
}
