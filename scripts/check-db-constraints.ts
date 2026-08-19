import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Verifies the hand-written SQL constraints are actually present in the live
 * database.
 *
 * These two are the business rules that matter most, and neither can be
 * expressed in schema.prisma — so nothing regenerates them if a migration is
 * reset or squashed. Run: npm run check:db
 */
const prisma = new PrismaClient();

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "ok  " : "MISSING"} ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

async function main() {
  const idx = await prisma.$queryRaw<{ indexdef: string }[]>`
    SELECT indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'registration_one_confirmed_per_event'`;

  const def = idx[0]?.indexdef ?? "";
  check("partial unique index exists", idx.length === 1);
  check("index is UNIQUE", def.includes("CREATE UNIQUE INDEX"));
  check("index covers (eventId, participantId)", /\("?eventId"?,\s*"?participantId"?\)/.test(def));
  check(
    "index is PARTIAL on CONFIRMED",
    def.includes("WHERE") && def.includes("CONFIRMED"),
    def.includes("WHERE") ? "" : "a full unique index would block re-registration after cancelling",
  );

  const chk = await prisma.$queryRaw<{ conname: string; def: string }[]>`
    SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
    WHERE conname = 'racecategory_slots_within_limit'`;

  check("slot CHECK constraint exists", chk.length === 1);
  check(
    "CHECK bounds slotsTaken by slotLimit",
    (chk[0]?.def ?? "").includes("slotLimit") && (chk[0]?.def ?? "").includes("slotsTaken"),
    chk[0]?.def ?? "",
  );

  console.log(failures === 0 ? "\nAll database constraints present." : `\n${failures} missing.`);
  if (failures) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
