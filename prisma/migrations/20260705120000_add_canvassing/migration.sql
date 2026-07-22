-- CreateEnum
CREATE TYPE "CanvassStatus" AS ENUM ('NOT_VISITED', 'NOT_HOME', 'NOT_INTERESTED', 'FOLLOW_UP', 'QUOTE_GIVEN', 'SOLD', 'DO_NOT_KNOCK');

-- CreateEnum
CREATE TYPE "KnockOutcome" AS ENUM ('NOT_HOME', 'NOT_INTERESTED', 'FOLLOW_UP', 'QUOTE_GIVEN', 'SOLD', 'DO_NOT_KNOCK');

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'DOOR_TO_DOOR';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REP';

-- CreateTable
CREATE TABLE "CanvassAddress" (
    "id" TEXT NOT NULL,
    "odaId" TEXT,
    "civicNumber" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "unit" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "CanvassStatus" NOT NULL DEFAULT 'NOT_VISITED',
    "lastKnockAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanvassAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knock" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "outcome" "KnockOutcome" NOT NULL,
    "note" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "callbackAt" TIMESTAMP(3),
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Knock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepLocation" (
    "id" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "sessionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangerSession" (
    "id" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "hangerCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "HangerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CanvassAddress_odaId_key" ON "CanvassAddress"("odaId");

-- CreateIndex
CREATE INDEX "CanvassAddress_city_status_idx" ON "CanvassAddress"("city", "status");

-- CreateIndex
CREATE INDEX "CanvassAddress_status_idx" ON "CanvassAddress"("status");

-- CreateIndex
CREATE INDEX "Knock_repId_createdAt_idx" ON "Knock"("repId", "createdAt");

-- CreateIndex
CREATE INDEX "Knock_addressId_idx" ON "Knock"("addressId");

-- CreateIndex
CREATE INDEX "Knock_createdAt_idx" ON "Knock"("createdAt");

-- CreateIndex
CREATE INDEX "RepLocation_repId_recordedAt_idx" ON "RepLocation"("repId", "recordedAt");

-- CreateIndex
CREATE INDEX "RepLocation_sessionId_recordedAt_idx" ON "RepLocation"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "HangerSession_repId_startedAt_idx" ON "HangerSession"("repId", "startedAt");

-- CreateIndex
CREATE INDEX "HangerSession_startedAt_idx" ON "HangerSession"("startedAt");

-- AddForeignKey
ALTER TABLE "Knock" ADD CONSTRAINT "Knock_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "CanvassAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knock" ADD CONSTRAINT "Knock_repId_fkey" FOREIGN KEY ("repId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knock" ADD CONSTRAINT "Knock_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepLocation" ADD CONSTRAINT "RepLocation_repId_fkey" FOREIGN KEY ("repId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepLocation" ADD CONSTRAINT "RepLocation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HangerSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangerSession" ADD CONSTRAINT "HangerSession_repId_fkey" FOREIGN KEY ("repId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

