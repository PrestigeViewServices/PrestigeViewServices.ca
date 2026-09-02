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

/**
 * Additional dashboard sign-ins beyond the owner row. Each is provisioned
 * lazily (first time its email tries to log in, or the accounts page loads)
 * so no manual migration or seed run is needed on the live database.
 *
 * Only the scrypt HASH lives in the repo, never the plaintext. The password
 * can be changed afterward from /admin/account like any other account.
 */
export const DEFAULT_ADMIN_ACCOUNTS: ReadonlyArray<{
  id: string;
  email: string;
  passwordHash: string;
}> = [
  {
    id: "contact",
    email: "contact@prestigeviewservices.ca",
    passwordHash:
      "scrypt$3b7e32390fe6f257095867bfb06c9796$68279ffb73077f69bcd9a1f0b7d4ef7d4fbd9b8b7b09af445fce5ed57f443305b71e4e681c18569bcf641c85825d8b73dfafa12ec8591bbd749c8d2d73642c8a",
  },
];

export type AdminCredential = {
  email: string;
  passwordHash: string;
  updatedAt: Date;
};

export type AdminCredentialRow = AdminCredential & { id: string };

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

/**
 * Ensures every DEFAULT_ADMIN_ACCOUNTS row exists. Safe to call often —
 * it only writes when a row is missing, and it never throws (an unreachable
 * database simply means the defaults wait for the next call).
 */
export async function ensureDefaultAdminAccounts(): Promise<void> {
  const db = getDb();
  if (!db) return;
  for (const acct of DEFAULT_ADMIN_ACCOUNTS) {
    try {
      const existing = await db.adminCredential.findUnique({
        where: { id: acct.id },
        select: { id: true },
      });
      if (!existing) {
        await db.adminCredential.create({
          data: {
            id: acct.id,
            email: acct.email.toLowerCase(),
            passwordHash: acct.passwordHash,
          },
        });
      }
    } catch {
      // Missing table / connection trouble — env auth still works, and the
      // account will be provisioned on a later attempt.
    }
  }
}

/**
 * Finds the credential row whose email matches, provisioning the default
 * accounts first so contact@ works on its very first login. NEVER throws.
 */
export async function findAdminCredentialByEmail(
  email: string
): Promise<AdminCredentialRow | null> {
  const db = getDb();
  if (!db) return null;
  const clean = email.trim().toLowerCase();
  if (!clean) return null;
  try {
    if (DEFAULT_ADMIN_ACCOUNTS.some((a) => a.email === clean)) {
      await ensureDefaultAdminAccounts();
    }
    const row = await db.adminCredential.findFirst({
      where: { email: { equals: clean, mode: "insensitive" } },
      select: { id: true, email: true, passwordHash: true, updatedAt: true },
    });
    return row ?? null;
  } catch {
    return null;
  }
}

/** Every dashboard sign-in on record, owner first. NEVER throws. */
export async function listAdminCredentials(): Promise<AdminCredentialRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    await ensureDefaultAdminAccounts();
    const rows = await db.adminCredential.findMany({
      select: { id: true, email: true, passwordHash: true, updatedAt: true },
    });
    return rows.sort((a, b) =>
      a.id === ADMIN_CREDENTIAL_ID ? -1 : b.id === ADMIN_CREDENTIAL_ID ? 1 : 0
    );
  } catch {
    return [];
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
  password: string,
  accountId: string = ADMIN_CREDENTIAL_ID
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

  // Two sign-ins sharing one email would make login ambiguous.
  const clash = await db.adminCredential.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      id: { not: accountId },
    },
    select: { id: true },
  });
  if (clash) {
    throw new Error("Another dashboard sign-in already uses that email");
  }

  const passwordHash = await hashPassword(password);
  await db.adminCredential.upsert({
    where: { id: accountId },
    create: { id: accountId, email: cleanEmail, passwordHash },
    update: { email: cleanEmail, passwordHash },
  });
}
