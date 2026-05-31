import { auth } from "@clerk/nextjs/server";
import type { Role } from "./roles";
import { parseRole } from "./roles";

/**
 * Server-side Clerk helpers. Pages call these to get the current user's
 * role for rendering or guarding mutations. The middleware does the
 * route-level redirect; these helpers protect server actions and API routes
 * where role-specific logic lives.
 */

/** Names of env vars Clerk reads for production keys. Order matters for display. */
export const CLERK_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

/** Returns the subset of CLERK_ENV_VARS that aren't set. */
export function missingClerkEnvVars(): string[] {
  return CLERK_ENV_VARS.filter((k) => !process.env[k]);
}

/**
 * True when production Clerk env vars are set. Keyless mode (which works
 * for `next dev` only) is intentionally NOT counted here because Vercel
 * builds can't write to .clerk/ during prerender.
 *
 * Pages and the root layout use this to skip ClerkProvider when keys are
 * absent so the marketing site still builds + deploys cleanly. /admin and
 * /portal show a "Clerk not configured" notice in that mode.
 */
export function isClerkConfigured(): boolean {
  return missingClerkEnvVars().length === 0;
}

export type Session = {
  userId: string;
  role: Role;
};

/**
 * Returns the current session with the role read from Clerk's session
 * claims. Returns null when Clerk isn't configured or the user isn't
 * signed in.
 */
export async function getSession(): Promise<Session | null> {
  if (!isClerkConfigured()) return null;
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const claimRole = (sessionClaims as { publicMetadata?: { role?: unknown } })
    ?.publicMetadata?.role;
  const role = parseRole(claimRole) ?? "customer";
  return { userId, role };
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
