-- Week view headline per crew per day, and personal PINs per crew member.
ALTER TABLE "GamePlan" ADD COLUMN IF NOT EXISTS "headline" TEXT;

-- Personal sign-in per crew member (replaces the shared crew PIN).
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "pinHash" TEXT;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
