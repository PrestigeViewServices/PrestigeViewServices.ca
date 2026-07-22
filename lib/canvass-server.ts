/**
 * Server-side canvassing helpers shared by the /api/canvass/* routes.
 * (Server-only: pulls in Prisma + Clerk.)
 */
import { currentUser } from "@clerk/nextjs/server";
import type { PrismaClient } from "@prisma/client";
import { getSession, type Session } from "@/lib/auth";
import { canCanvass, canViewCanvassing } from "@/lib/roles";

/** Session gate for rep-facing endpoints (reps + ops tier). */
export async function requireCanvasser(): Promise<Session | null> {
  const session = await getSession();
  if (!session || !canCanvass(session.role)) return null;
  return session;
}

/** Session gate for admin-facing endpoints (ops tier only). */
export async function requireCanvassViewer(): Promise<Session | null> {
  const session = await getSession();
  if (!session || !canViewCanvassing(session.role)) return null;
  return session;
}

const ROLE_TO_PRISMA = {
  ultimate_admin: "ULTIMATE_ADMIN",
  super_admin: "SUPER_ADMIN",
  admin: "ADMIN",
  manager: "MANAGER",
  employee: "EMPLOYEE",
  rep: "REP",
  customer: "CUSTOMER",
} as const;

/**
 * Knock/RepLocation rows FK to User. The User table is mirrored from Clerk by
 * webhook, but a rep who signed up before the webhook was subscribed (or while
 * it was down) would have no row — so backfill it from Clerk on first write
 * instead of failing their knock.
 */
export async function ensureUserRow(
  db: PrismaClient,
  session: Session
): Promise<void> {
  const existing = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  if (existing) return;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress;
  if (!cu || !email) throw new Error("No Clerk profile for current user");

  await db.user.upsert({
    where: { id: session.userId },
    update: {},
    create: {
      id: session.userId,
      email,
      firstName: cu.firstName,
      lastName: cu.lastName,
      role: ROLE_TO_PRISMA[session.role],
    },
  });
}
