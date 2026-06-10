-- CreateEnum
CREATE TYPE "DrivewayTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "DrivewaySize" AS ENUM ('ONE_CAR', 'TWO_CAR', 'THREE_PLUS_CAR');

-- CreateEnum
CREATE TYPE "ShovelingTier" AS ENUM ('NONE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED', 'COMPLETED');

-- CreateTable
CREATE TABLE "WinterReservation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'ON',
    "postalCode" TEXT,
    "drivewayTier" "DrivewayTier" NOT NULL,
    "drivewaySize" "DrivewaySize" NOT NULL,
    "shovelingTier" "ShovelingTier" NOT NULL DEFAULT 'NONE',
    "estimateLowCents" INTEGER NOT NULL,
    "estimateHighCents" INTEGER NOT NULL,
    "customerNotes" TEXT,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinterReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WinterReservation_status_idx" ON "WinterReservation"("status");

-- CreateIndex
CREATE INDEX "WinterReservation_createdAt_idx" ON "WinterReservation"("createdAt");
