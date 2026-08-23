-- Referral system, phase 1.
-- Additive only: new enum value, new nullable columns, new indexes.
-- Nothing is dropped or rewritten, so this is safe to run against live data.

-- New terminal status for referrals we refuse to pay out (fraud, duplicate,
-- self-referral, existing customer).
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Referral: friend identity, attribution trail, reward snapshot, timestamps.
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "referredName" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "referredPhone" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "referredMemberId" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'link';
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "rewardPoints" INTEGER;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "friendCreditCents" INTEGER;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "friendCreditUsed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "bookedAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Referral" ADD COLUMN IF NOT EXISTS "awardedAt" TIMESTAMP(3);

-- One member can only ever be "the friend" on a single referral.
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredMemberId_key"
  ON "Referral"("referredMemberId");

CREATE INDEX IF NOT EXISTS "Referral_referredEmail_idx" ON "Referral"("referredEmail");
CREATE INDEX IF NOT EXISTS "Referral_createdAt_idx" ON "Referral"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Referral_referredMemberId_fkey'
  ) THEN
    ALTER TABLE "Referral"
      ADD CONSTRAINT "Referral_referredMemberId_fkey"
      FOREIGN KEY ("referredMemberId") REFERENCES "Member"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill timestamps for referrals already in flight, so the portal timeline
-- has something honest to show for historical rows.
UPDATE "Referral" SET "bookedAt" = "createdAt"
  WHERE "bookedAt" IS NULL AND "status" IN ('BOOKED', 'COMPLETED', 'AWARDED');
UPDATE "Referral" SET "completedAt" = "updatedAt"
  WHERE "completedAt" IS NULL AND "status" IN ('COMPLETED', 'AWARDED');
UPDATE "Referral" SET "awardedAt" = "updatedAt"
  WHERE "awardedAt" IS NULL AND "status" = 'AWARDED';
