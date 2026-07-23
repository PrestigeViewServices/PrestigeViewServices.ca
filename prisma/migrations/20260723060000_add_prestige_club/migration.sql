-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('MEMBER', 'INSIDER', 'ELITE', 'PRESTIGE');

-- CreateEnum
CREATE TYPE "PointsType" AS ENUM ('EARN_SERVICE', 'EARN_REVIEW', 'EARN_REFERRAL', 'EARN_CROSS_CATEGORY', 'EARN_SNOW_EARLYBIRD', 'EARN_BIRTHDAY', 'REDEEM', 'EXPIRE', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'APPLIED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('INVITED', 'BOOKED', 'COMPLETED', 'AWARDED');

-- CreateEnum
CREATE TYPE "ClubTicketType" AS ENUM ('QUOTE', 'BOOK_SERVICE', 'ISSUE', 'BILLING', 'CALLBACK');

-- CreateEnum
CREATE TYPE "ClubTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PublicCategory" AS ENUM ('WINDOW_EXTERIOR', 'LAWN_CARE', 'SNOW_REMOVAL');

-- CreateEnum
CREATE TYPE "VeteranStatus" AS ENUM ('NONE', 'SELF_DECLARED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ServiceRecordStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "GiveawayStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'DRAWN');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "jobberClientId" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "region" TEXT DEFAULT 'ON',
    "postalCode" TEXT,
    "birthdayMonth" INTEGER,
    "veteranStatus" "VeteranStatus" NOT NULL DEFAULT 'NONE',
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'MEMBER',
    "tierSpend12moCents" INTEGER NOT NULL DEFAULT 0,
    "notifyServiceReminders" BOOLEAN NOT NULL DEFAULT true,
    "notifyPromos" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "PointsType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "sourceRef" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "creditCents" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'REQUESTED',
    "appliedInvoiceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredEmail" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubTicket" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "ClubTicketType" NOT NULL,
    "subject" TEXT NOT NULL,
    "preferredContact" TEXT,
    "timeWindow" TEXT,
    "status" "ClubTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Giveaway" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "status" "GiveawayStatus" NOT NULL DEFAULT 'DRAFT',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "drawnAt" TIMESTAMP(3),
    "winnerEntryId" TEXT,
    "skillTestResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiveawayEntry" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "memberId" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiveawayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "jobberJobId" TEXT,
    "jobberInvoiceId" TEXT,
    "category" "PublicCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "status" "ServiceRecordStatus" NOT NULL DEFAULT 'SCHEDULED',
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pointsAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMapping" (
    "id" TEXT NOT NULL,
    "matchTerm" TEXT NOT NULL,
    "category" "PublicCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_memberId_key" ON "CustomerProfile"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_jobberClientId_key" ON "CustomerProfile"("jobberClientId");

-- CreateIndex
CREATE INDEX "PointsTransaction_memberId_createdAt_idx" ON "PointsTransaction"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction"("type");

-- CreateIndex
CREATE INDEX "Redemption_status_idx" ON "Redemption"("status");

-- CreateIndex
CREATE INDEX "Redemption_memberId_idx" ON "Redemption"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "ClubTicket_status_idx" ON "ClubTicket"("status");

-- CreateIndex
CREATE INDEX "ClubTicket_memberId_createdAt_idx" ON "ClubTicket"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "ClubTicketMessage_ticketId_createdAt_idx" ON "ClubTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "GiveawayEntry_giveawayId_idx" ON "GiveawayEntry"("giveawayId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRecord_jobberJobId_key" ON "ServiceRecord"("jobberJobId");

-- CreateIndex
CREATE INDEX "ServiceRecord_memberId_serviceDate_idx" ON "ServiceRecord"("memberId", "serviceDate");

-- CreateIndex
CREATE INDEX "ServiceRecord_status_idx" ON "ServiceRecord"("status");

-- CreateIndex
CREATE INDEX "ServiceRecord_paid_idx" ON "ServiceRecord"("paid");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMapping_matchTerm_key" ON "CategoryMapping"("matchTerm");

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTicket" ADD CONSTRAINT "ClubTicket_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubTicketMessage" ADD CONSTRAINT "ClubTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ClubTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiveawayEntry" ADD CONSTRAINT "GiveawayEntry_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiveawayEntry" ADD CONSTRAINT "GiveawayEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

