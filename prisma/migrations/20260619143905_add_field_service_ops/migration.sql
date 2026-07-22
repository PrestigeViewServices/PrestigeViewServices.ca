-- CreateEnum
CREATE TYPE "Division" AS ENUM ('LAWNPROS', 'CLEARVIEW', 'SNOWLAND');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('PUBLIC_FORM', 'PORTAL', 'MANUAL', 'PHONE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETE', 'INVOICED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ContractFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'PER_STORM', 'SEASONAL');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('REQUESTED', 'RECEIVED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'ON',
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT,
    "ltvCents" INTEGER NOT NULL DEFAULT 0,
    "winterOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPriceCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringContract" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "serviceId" TEXT,
    "frequency" "ContractFrequency" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "priceCents" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastGeneratedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "propertyAddress" TEXT,
    "division" "Division",
    "serviceSlugs" JSONB,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'PUBLIC_FORM',
    "estimateCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "propertyId" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "serviceId" TEXT,
    "leadId" TEXT,
    "contractId" TEXT,
    "crewId" TEXT,
    "routeId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "priceCents" INTEGER,
    "crewNotes" TEXT,
    "photoUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "jobId" TEXT,
    "number" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "jobId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'REQUESTED',
    "rating" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "externalUrl" TEXT,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_lastName_firstName_idx" ON "Customer"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Property_customerId_idx" ON "Property"("customerId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Account_customerId_idx" ON "Account"("customerId");

-- CreateIndex
CREATE INDEX "Account_winterOnly_idx" ON "Account"("winterOnly");

-- CreateIndex
CREATE INDEX "Account_active_idx" ON "Account"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_division_active_idx" ON "Service"("division", "active");

-- CreateIndex
CREATE INDEX "RecurringContract_status_idx" ON "RecurringContract"("status");

-- CreateIndex
CREATE INDEX "RecurringContract_division_idx" ON "RecurringContract"("division");

-- CreateIndex
CREATE INDEX "RecurringContract_endDate_idx" ON "RecurringContract"("endDate");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Crew_active_idx" ON "Crew"("active");

-- CreateIndex
CREATE INDEX "CrewMember_crewId_idx" ON "CrewMember"("crewId");

-- CreateIndex
CREATE INDEX "CrewMember_userId_idx" ON "CrewMember"("userId");

-- CreateIndex
CREATE INDEX "Route_crewId_date_idx" ON "Route"("crewId", "date");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_scheduledFor_idx" ON "Job"("scheduledFor");

-- CreateIndex
CREATE INDEX "Job_crewId_scheduledFor_idx" ON "Job"("crewId", "scheduledFor");

-- CreateIndex
CREATE INDEX "Job_accountId_idx" ON "Job"("accountId");

-- CreateIndex
CREATE INDEX "Job_propertyId_idx" ON "Job"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_jobId_key" ON "Invoice"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_accountId_idx" ON "Invoice"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_key" ON "Review"("jobId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringContract" ADD CONSTRAINT "RecurringContract_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringContract" ADD CONSTRAINT "RecurringContract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringContract" ADD CONSTRAINT "RecurringContract_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RecurringContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

