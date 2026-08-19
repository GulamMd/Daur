-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "registrationSeq" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Registration_groupId_idx" ON "Registration"("groupId");
