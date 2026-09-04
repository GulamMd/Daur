import { EventStatus } from "@/generated/prisma/enums";
import { effectiveStatus, type StatusInput } from "@/lib/event-status";
import { formatDayAndMonth } from "@/lib/format";

/**
 * Signal green means "go" and nothing else. Using it decoratively anywhere
 * would destroy its meaning here.
 *
 * Two grounds, because this chip renders on both. The derived inks exist to be
 * legible on bib white and are unreadable on asphalt — signal-ink on asphalt is
 * 2.55:1 — so the dark hero gets its own set:
 *
 *   go     chalk text (13.25:1) with a signal dot. The dot is a UI element and
 *          needs 3:1, which signal on asphalt clears at 4.22:1. Signal as
 *          *text* on asphalt is only 4.22:1, so the word is set in chalk and
 *          the colour is carried by the dot.
 *   soon   sodium itself, 7.17:1 on asphalt.
 *   muted  chalk, held back with opacity rather than a darker ink.
 */
export function StatusChip({
  event,
  timeZone,
  onDark = false,
}: {
  event: StatusInput;
  timeZone?: string;
  /** Set on the asphalt hero. Swaps the light-surface inks for dark-ground ones. */
  onDark?: boolean;
}) {
  const status = effectiveStatus(event);

  const { label, tone } = describe(status, event, timeZone);

  const light =
    tone === "go"
      ? "text-signal-ink border-[color:var(--daur-signal)]"
      : tone === "soon"
        ? "text-sodium-ink border-[color:var(--daur-sodium)]"
        : "text-text-muted border-border";

  const dark =
    tone === "go"
      ? "text-chalk border-[color:var(--daur-signal)]"
      : tone === "soon"
        ? "text-sodium border-[color:var(--daur-sodium)]"
        : "text-chalk/80 border-chalk/40";

  return (
    <span
      className={`eyebrow rounded-token inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 ${
        onDark ? dark : light
      }`}
    >
      {tone === "go" && <span aria-hidden="true" className="bg-signal size-1.5 rounded-full" />}
      {label}
    </span>
  );
}

function describe(
  status: EventStatus,
  event: StatusInput,
  timeZone?: string,
): { label: string; tone: "go" | "soon" | "muted" } {
  switch (status) {
    case EventStatus.REGISTRATION_OPEN:
      return { label: "Registration open", tone: "go" };
    case EventStatus.COMING_SOON:
      return {
        label: event.registrationOpensAt
          ? `Opens ${formatDayAndMonth(event.registrationOpensAt, timeZone)}`
          : "Coming soon",
        tone: "soon",
      };
    case EventStatus.REGISTRATION_CLOSED:
      return { label: "Registration closed", tone: "muted" };
    case EventStatus.COMPLETED:
      return { label: "Completed", tone: "muted" };
    case EventStatus.CANCELLED:
      return { label: "Cancelled", tone: "muted" };
    default:
      return { label: "Draft", tone: "muted" };
  }
}
