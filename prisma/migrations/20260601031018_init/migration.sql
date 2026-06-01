-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ULTIMATE_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SignupMethod" AS ENUM ('GOOGLE', 'APPLE', 'EMAIL', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'CONTACTED', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('QUOTE', 'ISSUE', 'DISPATCH', 'GENERAL');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "streetAddress" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "signupMethod" "SignupMethod" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "validLicense" TEXT NOT NULL,
    "reliableCommute" TEXT NOT NULL,
    "yearsExperience" TEXT NOT NULL,
    "whyJoin" TEXT,
    "resumeUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "alt" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "SupportType" NOT NULL,
    "propertyAddress" TEXT,
    "details" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_roleSlug_idx" ON "Application"("roleSlug");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "GalleryImage_section_active_sortOrder_idx" ON "GalleryImage"("section", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");

-- CreateIndex
CREATE INDEX "SupportRequest_type_idx" ON "SupportRequest"("type");

-- CreateIndex
CREATE INDEX "SupportRequest_createdAt_idx" ON "SupportRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
