import "dotenv/config";
import { setEventStatus, EventNotFoundError } from "../server/services/organizer.service";
import { effectiveStatus } from "../lib/event-status";
import { prisma } from "../server/db";

/**
 * Flips an event's lifecycle status from the command line.
 *
 * This is the operational cost of shipping without an admin dashboard: opening
 * registration at 10 AM on launch day means running this. It is a first-class
 * script rather than an afterthought for exactly that reason.
 *
 *   npm run event:status
 *   npm run event:status -- --slug=daur-bengaluru-edition-04 --status=REGISTRATION_OPEN
 */

const STATUSES = [
  "DRAFT",
  "COMING_SOON",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "COMPLETED",
  "CANCELLED",
] as const;
type Status = (typeof STATUSES)[number];

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function list() {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    select: {
      slug: true,
      name: true,
      status: true,
      startAt: true,
      registrationOpensAt: true,
      registrationClosesAt: true,
      categories: {
        select: { name: true, slotLimit: true, slotsTaken: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!events.length) {
    console.log("No events. Run: npm run seed:events");
    return;
  }

  for (const event of events) {
    const live = effectiveStatus(event);
    // The stored status and the effective status differ when the registration
    // window has closed the event without anyone flipping the column.
    const drift = live === event.status ? "" : `  (effective: ${live})`;
    console.log(`\n${event.slug}`);
    console.log(`  ${event.name}`);
    console.log(`  status   ${event.status}${drift}`);
    console.log(`  starts   ${event.startAt.toISOString()}`);
    for (const c of event.categories) {
      console.log(`  ${c.name.padEnd(4)}     ${c.slotsTaken}/${c.slotLimit} taken`);
    }
  }
  console.log(
    `\nTo change one:\n  npm run event:status -- --slug=<slug> --status=<${STATUSES.join("|")}>`,
  );
}

async function main() {
  const slug = arg("slug");
  const status = arg("status");

  if (!slug && !status) return list();

  if (!slug || !status) {
    console.error("Provide both --slug and --status.");
    process.exitCode = 1;
    return;
  }
  if (!STATUSES.includes(status as Status)) {
    console.error(`Unknown status "${status}". One of: ${STATUSES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const updated = await setEventStatus(slug, status as Status);
  console.log(`${updated.slug} -> ${updated.status}`);
}

main()
  .catch((error) => {
    if (error instanceof EventNotFoundError) {
      console.error(error.message);
    } else {
      console.error("Failed:", error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
