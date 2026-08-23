import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./customer-auth";

/**
 * The owner's /admin credential, stored in Postgres so it can be changed from
 * the dashboard instead of only through a Vercel env var.
 *
 * SAFETY MODEL — read this before changing anything here.
 *
 * `/admin` is the owner's front door on a live site, and deploys do NOT run
 * migrations (package.json `postinstall` is `prisma generate` only). So this
 * module treats "no credential row" as a completely normal state, not an
 * error, and every read is wrapped so a missing table or an unreachable
 * database degrades to env-var auth instead of a lockout.
 *
 * Precedence, implemented in lib/admin-session.ts:
 *   row present  -> authoritative; ADMIN_PASSWORD stops working, so a changed
 *                   password is genuinely changed and the old one dies.
 *   row absent   -> fall back to ADMIN_PASSWORD / ADMIN_EMAIL, i.e. exactly
 *                   the behaviour that shipped before this table existed.
 *
 * ADMIN_PASSWORD should therefore stay set even after a DB password is
 * chosen: it is the break-glass that gets the owner back in if Postgres is
 * down, and `sessionSecret()` still falls back to it.
 */

export const ADMIN_CREDENTIAL_ID = "owner";

export type AdminCredential = {
  email: string;
  passwordHash: string;
  updatedAt: Date;
};

/** Why there is no usable DB credential right now. */
export type CredentialStatus =
  | "ok" // a row exists and is in use
  | "no-db" // DATABASE_URL unset
  | "no-table" // table not migrated yet
  | "no-row" // migrated, but the owner hasn't set a password here
  | "error"; // anything else (connection refused, timeout, ...)

/**
 * Reads the credential row. NEVER throws — callers use the null to fall back
 * to env auth. `status` exists so the UI can explain the situation instead of
 * silently pretending the feature is unavailable.
 */
export async function readAdminCredential(): Promise<{
  credential: AdminCredential | null;
  status: CredentialStatus;
}> {
  const db = getDb();
  if (!db) return { credential: null, status: "no-db" };

  try {
    const row = await db.adminCredential.findUnique({
      where: { id: ADMIN_CREDENTIAL_ID },
      select: { email: true, passwordHash: true, updatedAt: true },
    });
    if (!row) return { credential: null, status: "no-row" };
    return { credential: row, status: "ok" };
  } catch (err) {
    // P2021 = table does not exist. Expected on any environment where the
    // migration hasn't been applied yet, so it is not worth logging loudly.
    const code = (err as { code?: string })?.code;
    if (code === "P2021") return { credential: null, status: "no-table" };
    // eslint-disable-next-line no-console
    console.error("[PVS admin-credentials] read failed", err);
    return { credential: null, status: "error" };
  }
}

/** True when a DB credential is in force (env password no longer accepted). */
export async function adminCredentialInUse(): Promise<boolean> {
  const { status } = await readAdminCredential();
  return status === "ok";
}

/** Verifies a candidate password against the stored hash. */
export async function verifyAdminCredentialPassword(
  candidate: string
): Promise<boolean> {
  const { credential } = await readAdminCredential();
  if (!credential) return false;
  try {
    return await verifyPassword(candidate, credential.passwordHash);
  } catch {
    return false;
  }
}

export const MIN_ADMIN_PASSWORD_LENGTH = 10;

/**
 * Creates or replaces the credential row. Throws on validation failure so the
 * caller can surface the message; the caller is responsible for having
 * already verified the CURRENT password.
 */
export async function setAdminCredential(
  email: string,
  password: string
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured");

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Enter a valid email address");
  }
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`
    );
  }
  if (password.length > 200) {
    throw new Error("Password is too long");
  }

  const passwordHash = await hashPassword(password);
  await db.adminCredential.upsert({
    where: { id: ADMIN_CREDENTIAL_ID },
    create: { id: ADMIN_CREDENTIAL_ID, email: cleanEmail, passwordHash },
    update: { email: cleanEmail, passwordHash },
  });
}
