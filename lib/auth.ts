import type { Role } from "./roles";
import { hasAdminSession, isAdminAuthConfigured } from "./admin-session";

/**
 * Server-side auth helpers — fully IN-HOUSE, no external auth service.
 *
 * Two session systems exist, both ours:
 *  - Admin/staff: owner password + signed cookie (lib/admin-session.ts).
 *    Resolves to `ultimate_admin`, which passes every role gate.
 *  - Customers: Prestige Club member cookie (lib/customer-auth.ts), used
 *    exclusively by /account — customer pages call getMember(), never this.
 */

export type Session = {
  userId: string;
  role: Role;
};

/** The current STAFF session (owner's internal login), or null. */
export async function getSession(): Promise<Session | null> {
  if (isAdminAuthConfigured() && (await hasAdminSession())) {
    return { userId: "internal-admin", role: "ultimate_admin" };
  }
  return null;
}

/** Throws if the user isn't authenticated or doesn't hold one of the allowed roles. */
export async function requireRole(allowed: Role | Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  const allowList = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowList.includes(session.role)) {
    throw new Error(
      `Forbidden: role ${session.role} not in [${allowList.join(", ")}]`
    );
  }
  return session;
}
