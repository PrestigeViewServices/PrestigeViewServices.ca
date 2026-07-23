-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PointsType" ADD VALUE 'EARN_WELCOME';
ALTER TYPE "PointsType" ADD VALUE 'EARN_BOOKING';
ALTER TYPE "PointsType" ADD VALUE 'EARN_SOCIAL';
ALTER TYPE "PointsType" ADD VALUE 'EARN_PROFILE';

-- DropIndex
DROP INDEX "ReviewClaim_memberId_idx";

-- AlterTable
ALTER TABLE "ReviewClaim" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'review',
ADD COLUMN     "note" TEXT;

-- CreateIndex
CREATE INDEX "ReviewClaim_memberId_kind_idx" ON "ReviewClaim"("memberId", "kind");

