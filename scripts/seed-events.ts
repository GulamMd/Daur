import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eventInputSchema } from "../lib/schemas/event.schema";
import { ensureOrganizer, upsertEvent } from "../server/services/organizer.service";
import { prisma } from "../server/db";

/**
 * Authors events from versioned JSON documents.
 *
 * This calls the organizer service directly rather than POSTing to
 * /api/organizer/events. The API exists and uses the same schema and the same
 * service, but making seeding depend on a running server plus a session cookie
 * would make it fragile in CI and on a fresh clone. Validation is identical
 * either way, which is the property that actually matters.
 *
 * Run: npm run seed:events
 */

const EVENTS_DIR = join(process.cwd(), "seed", "events");
const ORGANIZER_FILE = join(process.cwd(), "seed", "organizer.json");

async function main() {
  const organizerInput = JSON.parse(readFileSync(ORGANIZER_FILE, "utf8"));
  const organizer = await ensureOrganizer(organizerInput);
  console.log(`organizer  ${organizer.name} (${organizer.slug})`);

  // Optional: link an existing account so the organizer API is usable.
  const adminEmail = process.env.ORGANIZER_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (!user) {
      console.warn(
        `  ! ORGANIZER_ADMIN_EMAIL is set to ${adminEmail} but no such account exists yet.`,
      );
      console.warn("    Sign up with that email, then re-run the seed.");
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ORGANIZER_ADMIN" } });
      await prisma.organizerMember.upsert({
        where: { organizerId_userId: { organizerId: organizer.id, userId: user.id } },
        create: { organizerId: organizer.id, userId: user.id, role: "OWNER" },
        update: { role: "OWNER" },
      });
      console.log(`  linked ${adminEmail} as OWNER`);
    }
  }

  const files = readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("no event documents in seed/events");
    return;
  }

  let failed = 0;
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(EVENTS_DIR, file), "utf8"));
    const parsed = eventInputSchema.safeParse(raw);

    if (!parsed.success) {
      failed++;
      console.error(`\nFAILED  ${file}`);
      for (const issue of parsed.error.issues) {
        console.error(`   ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }

    const event = await upsertEvent(parsed.data, organizer.id);
    const categories = parsed.data.categories.map((c) => c.name).join(" / ");
    // Report the status the event actually has, not the one in the document —
    // on update the document does not own lifecycle.
    console.log(`event      ${event.slug}  [${event.status}]  ${categories}`);
  }

  if (failed) {
    console.error(`\n${failed} document(s) rejected.`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
