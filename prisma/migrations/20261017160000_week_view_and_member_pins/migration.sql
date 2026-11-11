-- Week view headline per crew per day, and personal PINs per crew member.
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "headline" TEXT;

-- Personal sign-in per crew member (replaces the shared crew PIN).
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- Customer name and phone per stop, with per-stop phone visibility.
DO $$ BEGIN
  CREATE TYPE "CrewRank" AS ENUM ('FIELD_SUPERVISOR', 'CREW_LEAD', 'SENIOR_TECH', 'TECHNICIAN', 'TRAINEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "rank" "CrewRank" NOT NULL DEFAULT 'TECHNICIAN';
DO $$ BEGIN
  CREATE TYPE "PhoneVisibility" AS ENUM ('ALL', 'LEADS', 'NONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "GamePlanStop" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "GamePlanStop" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "GamePlanStop" ADD COLUMN IF NOT EXISTS "phoneVisibility" "PhoneVisibility" NOT NULL DEFAULT 'LEADS';

-- Standard daily game plan: mission, crew lead, gear check, heads up,
-- end of day, contact; time and upsell per stop.
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "trailer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "weather" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "mission" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "headsUp" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "contact" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "tomorrowDrop" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "leadId" TEXT;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "gear" JSONB;
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "endOfDay" JSONB;
DO $$ BEGIN
  ALTER TABLE "GamePlan" ADD CONSTRAINT "GamePlan_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrewMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE "GamePlanStop" ADD COLUMN IF NOT EXISTS "time" TEXT;
ALTER TABLE "GamePlanStop" ADD COLUMN IF NOT EXISTS "upsell" TEXT;
