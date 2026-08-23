-- Owner's /admin login, moved out of the ADMIN_PASSWORD env var so it can be
-- changed from the dashboard. Exactly one row, id 'owner'.
--
-- Additive and nullable-free but with no backfill on purpose: an EMPTY table
-- means "fall back to ADMIN_PASSWORD", which is exactly the behaviour that
-- shipped before this migration. Applying this migration therefore changes
-- nothing about how login works until the owner sets a password in the UI.
CREATE TABLE "AdminCredential" (
    "id" TEXT NOT NULL DEFAULT 'owner',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCredential_pkey" PRIMARY KEY ("id")
);
