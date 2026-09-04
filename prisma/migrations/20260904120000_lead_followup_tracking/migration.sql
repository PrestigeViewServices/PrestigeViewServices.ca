-- Lead follow-up tracking: a CONTACTED stage between NEW and QUOTED, plus
-- timestamps for first contact, close, and the next promised follow-up.
-- (Postgres 12+ allows ADD VALUE in a transaction as long as the new value
-- is not used later in the same transaction — and it is not.)
ALTER TYPE "LeadStatus" ADD VALUE 'CONTACTED' BEFORE 'QUOTED';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "contactedAt" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "followUpAt" TIMESTAMP(3);

-- Backfill: anything already worked has by definition been contacted, and
-- anything already decided is closed. updatedAt is the best signal we have.
UPDATE "Lead" SET "contactedAt" = "updatedAt" WHERE "status" <> 'NEW';
UPDATE "Lead" SET "closedAt" = "updatedAt" WHERE "status" IN ('WON', 'LOST');

-- CreateIndex
CREATE INDEX "Lead_followUpAt_idx" ON "Lead"("followUpAt");
