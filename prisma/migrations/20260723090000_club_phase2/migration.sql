-- CreateEnum
CREATE TYPE "ReviewClaimStatus" AS ENUM ('PENDING', 'AWARDED', 'REJECTED');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "referralCode" TEXT;

-- CreateTable
CREATE TABLE "ReviewClaim" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "ReviewClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewClaim_status_idx" ON "ReviewClaim"("status");

-- CreateIndex
CREATE INDEX "ReviewClaim_memberId_idx" ON "ReviewClaim"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_referralCode_key" ON "Member"("referralCode");

-- AddForeignKey
ALTER TABLE "ReviewClaim" ADD CONSTRAINT "ReviewClaim_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

