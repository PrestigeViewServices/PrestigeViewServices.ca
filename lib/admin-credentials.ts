import { getDb } from "./db";
import { hashPassword } from "./customer-auth";

/**
 * Dashboard sign-ins ("admins"), stored in Postgres so they can be created
 * and changed from /admin/account instead of only through env vars.
 *
 * SAFETY MODEL — read this before changing anything here.
 *
 * `/admin` is the owner's front door on a live site, and deploys do NOT run
 * migrations (package.json `postinstall` is `prisma generate` only). So this
 * module treats "no rows at all" as a completely normal state, not an error,
 * and every read is wrapped so a missing table or an unreachable database
 * degrades to the env-var recovery login instead of a lockout.
 *
 * Precedence, implemented in lib/admin-session.ts:
 *   email matches a row  -> that row's own password hash decides.
 *   no row for that email -> ADMIN_EMAIL + ADMIN_PASSWORD (recovery login).
 *
 * The recovery login ALWAYS works, even once database rows exist. That is
 * deliberate: an owner locked out of his own dashboard costs more than the
 * marginal risk of an env var only he can read. Rotate ADMIN_PASSWORD in
 * Vercel to revoke it.
 *
 * Every account here has the same full dashboard access — there is no admin
 * hierarchy. Anyone you add can add, remove, and re-password anyone else.
 */

/** Fixed id of the original owner row, kept for backwards compatibility. */
export const ADMIN_CREDENTIAL_ID = "owner";

export const MIN_ADMIN_PASSWORD_LENGTH = 10;
const MAX_ADMIN_PASSWORD_LENGTH = 200;

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
  | "no-row" // migrated, but no owner row has been created here
  | "error"; // anything else (connection refused, timeout, ...)

/** Maps a Prisma failure to the status the UI explains to the owner. */
function statusForError(err: unknown): CredentialStatus {
  // P2021 = table does not exist. Expected on any environment where the
  // migration hasn't been applied yet, so it is not worth logging loudly.
  const code = (err as { code?: string })?.code;
  if (code === "P2021") return "no-table";
  // eslint-disable-next-line no-console
  console.error("[PVS admin-credentials] database call failed", err);
  return "error";
}

/** Finds the sign-in whose email matches, case-insensitively. NEVER throws. */
export async function findAdminCredentialByEmail(
  email: string
): Promise<AdminCredentialRow | null> {
  const db = getDb();
  if (!db) return null;
  const clean = normalizeEmail(email);
  if (!clean) return null;
  try {
    const row = await db.adminCredential.findFirst({
      where: { email: { equals: clean, mode: "insensitive" } },
      select: { id: true, email: true, passwordHash: true, updatedAt: true },
    });
    return row ?? null;
  } catch {
    return null;
  }
}

/** Every dashboard sign-in on record, owner first then A-Z. NEVER throws. */
/**
 * Is this email allowed into the dashboard? True for ADMIN_EMAIL (the
 * recovery login) and for any saved sign-in. Used to decide whether a
 * signed-in club member gets the "Admin Dashboard" shortcut and a pre-filled
 * login — it grants nothing by itself, the password still decides. NEVER
 * throws.
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  const recovery = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (recovery && clean === recovery) return true;
  return Boolean(await findAdminCredentialByEmail(clean));
}

export async function listAdminCredentials(): Promise<{
  accounts: AdminCredentialRow[];
  status: CredentialStatus;
}> {
  const db = getDb();
  if (!db) return { accounts: [], status: "no-db" };
  try {
    const rows = await db.adminCredential.findMany({
      select: { id: true, email: true, passwordHash: true, updatedAt: true },
    });
    const accounts = rows.sort((a, b) => {
      if (a.id === ADMIN_CREDENTIAL_ID) return -1;
      if (b.id === ADMIN_CREDENTIAL_ID) return 1;
      return a.email.localeCompare(b.email);
    });
    return { accounts, status: accounts.length ? "ok" : "no-row" };
  } catch (err) {
    return { accounts: [], status: statusForError(err) };
  }
}

// ---- Writes ----------------------------------------------------------------

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Throws a readable message when the email is unusable. */
function assertValidEmail(email: string): string {
  const clean = normalizeEmail(email);
  if (!clean) throw new Error("Enter an email address");
  // Deliberately loose: one @, something either side, no spaces.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error(`"${email.trim()}" is not a valid email address`);
  }
  return clean;
}

/** Throws a readable message when the password is unusable. */
function assertValidPassword(password: string): void {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`
    );
  }
  if (password.length > MAX_ADMIN_PASSWORD_LENGTH) {
    throw new Error("Password is too long");
  }
}

/** Turns a Prisma failure into something the owner can act on. */
function writeError(err: unknown): Error {
  if (err instanceof Error && !(err as { code?: string }).code) return err;
  const code = (err as { code?: string })?.code;
  if (code === "P2021") {
    return new Error(
      "The admin sign-in table does not exist in this database yet. Run `npm run db:deploy`, then try again."
    );
  }
  // eslint-disable-next-line no-console
  console.error("[PVS admin-credentials] write failed", err);
  return new Error(
    "Could not reach the database. Check DATABASE_URL and try again."
  );
}

/** Rejects an email already used by a DIFFERENT sign-in. */
async function assertEmailFree(email: string, exceptId: string | null) {
  const db = getDb();
  if (!db) return;
  const clash = await db.adminCredential.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new Error(`${email} is already a dashboard sign-in`);
  }
}

/**
 * Creates or replaces one sign-in by id. Throws on validation failure so the
 * caller can surface the message. Callers are responsible for authorization.
 */
export async function setAdminCredential(
  email: string,
  password: string,
  accountId: string = ADMIN_CREDENTIAL_ID
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured (DATABASE_URL is unset)");

  const cleanEmail = assertValidEmail(email);
  assertValidPassword(password);

  try {
    await assertEmailFree(cleanEmail, accountId);
    const passwordHash = await hashPassword(password);
    await db.adminCredential.upsert({
      where: { id: accountId },
      create: { id: accountId, email: cleanEmail, passwordHash },
      update: { email: cleanEmail, passwordHash },
    });
  } catch (err) {
    throw writeError(err);
  }
}

/**
 * Adds a NEW dashboard sign-in. The very first account created becomes the
 * owner row so that a fresh database ends up with the canonical `owner` id
 * rather than a random one.
 */
export async function createAdminAccount(
  email: string,
  password: string
): Promise<AdminCredentialRow> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured (DATABASE_URL is unset)");

  const cleanEmail = assertValidEmail(email);
  assertValidPassword(password);

  try {
    await assertEmailFree(cleanEmail, null);
    const ownerExists = await db.adminCredential.findUnique({
      where: { id: ADMIN_CREDENTIAL_ID },
      select: { id: true },
    });
    const id = ownerExists ? `adm_${randomId()}` : ADMIN_CREDENTIAL_ID;
    const passwordHash = await hashPassword(password);
    return await db.adminCredential.create({
      data: { id, email: cleanEmail, passwordHash },
      select: { id: true, email: true, passwordHash: true, updatedAt: true },
    });
  } catch (err) {
    throw writeError(err);
  }
}

/** Sets one account's password without needing the old one. */
export async function setAdminAccountPassword(
  accountId: string,
  password: string
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured (DATABASE_URL is unset)");
  assertValidPassword(password);
  try {
    const passwordHash = await hashPassword(password);
    await db.adminCredential.update({
      where: { id: accountId },
      data: { passwordHash },
    });
  } catch (err) {
    throw writeError(err);
  }
}

/** Changes one account's login email. */
export async function setAdminAccountEmail(
  accountId: string,
  email: string
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured (DATABASE_URL is unset)");
  const cleanEmail = assertValidEmail(email);
  try {
    await assertEmailFree(cleanEmail, accountId);
    await db.adminCredential.update({
      where: { id: accountId },
      data: { email: cleanEmail },
    });
  } catch (err) {
    throw writeError(err);
  }
}

/**
 * Removes a sign-in. Refuses to delete the LAST one — an empty table would
 * leave only the env recovery login, which is a support call waiting to
 * happen.
 */
export async function deleteAdminAccount(accountId: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database is not configured (DATABASE_URL is unset)");
  try {
    const total = await db.adminCredential.count();
    if (total <= 1) {
      throw new Error(
        "This is the last dashboard sign-in. Add another one before removing it."
      );
    }
    await db.adminCredential.delete({ where: { id: accountId } });
  } catch (err) {
    throw writeError(err);
  }
}

/** URL-safe random suffix for generated account ids. */
function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
