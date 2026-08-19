import { EventStatus } from "@/generated/prisma/enums";
import { effectiveStatus, type StatusInput } from "@/lib/event-status";
import { formatDayAndMonth } from "@/lib/format";

/**
 * Signal green means "go" and nothing else. Using it decoratively anywhere
 * would destroy its meaning here.
 */
export function StatusChip({ event, timeZone }: { event: StatusInput; timeZone?: string }) {
  const status = effectiveStatus(event);

  const { label, tone } = describe(status, event, timeZone);

  const toneClass =
    tone === "go"
      ? "text-signal-ink border-[color:var(--daur-signal)]"
      : tone === "soon"
        ? "text-sodium-ink border-[color:var(--daur-sodium)]"
        : "text-text-muted border-border";

  return (
    <span
      className={`eyebrow rounded-token inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 ${toneClass}`}
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
