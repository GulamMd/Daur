import "dotenv/config";
import { prisma } from "../server/db";

/**
 * Removes accounts left behind by browser tests and releases the slots they
 * consumed.
 *
 * This lives outside the Playwright spec because Playwright's transpiler
 * cannot load the generated Prisma client, and because it is useful on its own
 * when a test run is interrupted halfway.
 *
 * Only touches @daur.test addresses — real accounts are never in scope.
 */
const TEST_DOMAIN = "@daur.test";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("No test accounts to clean.");
    return;
  }

  const userIds = users.map((u) => u.id);

  // Release a slot for each confirmed entry before deleting it, or the counter
  // drifts above the number of real registrations.
  const confirmed = await prisma.registration.findMany({
    where: { userId: { in: userIds }, status: "CONFIRMED" },
    select: { categoryId: true },
  });

  for (const registration of confirmed) {
    await prisma.$executeRaw`
      UPDATE "RaceCategory" SET "slotsTaken" = "slotsTaken" - 1
      WHERE "id" = ${registration.categoryId} AND "slotsTaken" > 0`;
  }

  const { count } = await prisma.registration.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`Removed ${users.length} test account(s) and ${count} registration(s).`);
  console.log(`Released ${confirmed.length} slot(s).`);

  const slots = await prisma.raceCategory.findMany({
    select: { name: true, slotsTaken: true, event: { select: { slug: true } } },
  });
  for (const slot of slots) {
    console.log(`  ${slot.event.slug}  ${slot.name.padEnd(5)} ${slot.slotsTaken} taken`);
  }
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
