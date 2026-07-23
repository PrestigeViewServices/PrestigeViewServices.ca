-- AlterTable
ALTER TABLE "GiveawayEntry" ADD COLUMN     "entrantEmail" TEXT,
ADD COLUMN     "entrantName" TEXT,
ADD COLUMN     "entrantTown" TEXT;

-- CreateIndex
CREATE INDEX "GiveawayEntry_giveawayId_entrantEmail_idx" ON "GiveawayEntry"("giveawayId", "entrantEmail");

