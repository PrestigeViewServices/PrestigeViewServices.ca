-- Crew app (/crew): daily game plan, stop completion with photos, points,
-- field leads and issues. Purely additive; existing Crew/CrewMember rows keep
-- working (Dispatch is untouched).

ALTER TABLE "Crew" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;
ALTER TABLE "Crew" ADD COLUMN IF NOT EXISTS "truck" TEXT;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

DO $$ BEGIN
  CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "FieldLeadStatus" AS ENUM ('NEW', 'QUOTED', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "FieldIssueKind" AS ENUM ('DAMAGE', 'EQUIPMENT', 'SAFETY', 'CUSTOMER', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "FieldIssueStatus" AS ENUM ('OPEN', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "GamePlan" (
  "id" TEXT NOT NULL,
  "crewId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "truck" TEXT,
  "startTime" TEXT,
  "brief" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GamePlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GamePlan_crewId_date_key" ON "GamePlan"("crewId", "date");
CREATE INDEX IF NOT EXISTS "GamePlan_date_idx" ON "GamePlan"("date");
ALTER TABLE "GamePlan" ADD CONSTRAINT "GamePlan_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "GamePlanStop" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "address" TEXT NOT NULL,
  "service" TEXT,
  "note" TEXT,
  "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
  "doneAt" TIMESTAMP(3),
  "doneById" TEXT,
  "photoUrls" TEXT[],
  "crewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GamePlanStop_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GamePlanStop_planId_sortOrder_idx" ON "GamePlanStop"("planId", "sortOrder");
ALTER TABLE "GamePlanStop" ADD CONSTRAINT "GamePlanStop_planId_fkey" FOREIGN KEY ("planId") REFERENCES "GamePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GamePlanStop" ADD CONSTRAINT "GamePlanStop_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PointRule" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "autoKey" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PointRule_autoKey_key" ON "PointRule"("autoKey");

CREATE TABLE IF NOT EXISTS "PointEntry" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "date" TEXT NOT NULL,
  "ruleId" TEXT,
  "stopId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PointEntry_memberId_date_idx" ON "PointEntry"("memberId", "date");
CREATE INDEX IF NOT EXISTS "PointEntry_date_idx" ON "PointEntry"("date");
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CrewMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PointRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "GamePlanStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "FieldLead" (
  "id" TEXT NOT NULL,
  "crewId" TEXT NOT NULL,
  "memberId" TEXT,
  "stopId" TEXT,
  "address" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "note" TEXT,
  "status" "FieldLeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FieldLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FieldLead_status_createdAt_idx" ON "FieldLead"("status", "createdAt");
ALTER TABLE "FieldLead" ADD CONSTRAINT "FieldLead_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldLead" ADD CONSTRAINT "FieldLead_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FieldLead" ADD CONSTRAINT "FieldLead_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "GamePlanStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "FieldIssue" (
  "id" TEXT NOT NULL,
  "crewId" TEXT NOT NULL,
  "memberId" TEXT,
  "stopId" TEXT,
  "kind" "FieldIssueKind" NOT NULL,
  "note" TEXT NOT NULL,
  "photoUrls" TEXT[],
  "status" "FieldIssueStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "FieldIssue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FieldIssue_status_createdAt_idx" ON "FieldIssue"("status", "createdAt");
ALTER TABLE "FieldIssue" ADD CONSTRAINT "FieldIssue_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldIssue" ADD CONSTRAINT "FieldIssue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FieldIssue" ADD CONSTRAINT "FieldIssue_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "GamePlanStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CrewSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrewSetting_pkey" PRIMARY KEY ("key")
);

-- Default point rules. Admin edits them under Game Plan > Team.
INSERT INTO "PointRule" ("id", "label", "points", "autoKey", "sortOrder") VALUES
  ('pr_stop_photo',   'Stop done with photos',        10, 'stop_photo', 1),
  ('pr_route_ontime', 'Route finished on time',       15, NULL,         2),
  ('pr_clean_week',   'Clean week, zero callbacks',   25, NULL,         3),
  ('pr_review',       '5-star review names you',      50, NULL,         4),
  ('pr_upsell_won',   'Upsell lead that closed',      50, 'lead_won',   5),
  ('pr_trip_ticket',  'Trip ticket done, truck clean', 5, NULL,         6),
  ('pr_missing_photo','Missing photo',               -10, NULL,         7),
  ('pr_damage',       'Damage or no-show',           -50, NULL,         8)
ON CONFLICT ("id") DO NOTHING;
