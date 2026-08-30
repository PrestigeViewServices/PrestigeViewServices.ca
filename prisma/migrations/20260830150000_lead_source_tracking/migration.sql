-- Winter 2026-27 lead tracking.
--
-- 1. Every lead records which page/CTA produced it (sourcePage) and, for
--    winter interest, which package the visitor had picked (packageInterest).
-- 2. Winter reservations record their source page too.
-- 3. The lead pipeline gains the CONTACTED stage between NEW and QUOTED.
--
-- All changes are additive; /api/leads keeps a pre-migration fallback that
-- folds the new fields into notes, so deploy order cannot drop a lead.

ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONTACTED' AFTER 'NEW';

ALTER TABLE "Lead" ADD COLUMN "sourcePage" TEXT;
ALTER TABLE "Lead" ADD COLUMN "packageInterest" TEXT;

ALTER TABLE "WinterReservation" ADD COLUMN "sourcePage" TEXT;
