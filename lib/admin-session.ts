import { cookies } from "next/headers";
import { findAdminCredentialByEmail } from "./admin-credentials";
import { verifyPassword } from "./customer-auth";

/**
 * Internal admin authentication — no external auth service.
 *
 * There are two ways in, and both are ours:
 *
 *  1. A dashboard sign-in stored in Postgres (AdminCredential). Any number
 *     of these can exist; each has its own email and scrypt password hash,
 *     and they are created/changed from /admin/account or `npm run admin`.
 *
 *  2. The RECOVERY login: ADMIN_EMAIL + ADMIN_PASSWORD from the environment.
 *     This works ALWAYS — even when database rows exist, and even when
 *     Postgres is unreachable. It is the way back in after a forgotten
 *     password or a database outage, which is exactly the failure this
 *     dashboard cannot afford. Rotate ADMIN_PASSWORD in Vercel to revoke it.
 *
 * A signed, expiring token in an httpOnly cookie keeps the session alive;
 * the signature is an HMAC-SHA256 over the expiry timestamp using
 * ADMIN_SESSION_SECRET (falls back to ADMIN_PASSWORD so one env var is
 * enough to get started).
 *
 * Uses Web Crypto only, no Node-specific imports, so the helpers stay
 * portable across runtimes.
 */

export const ADMIN_COOKIE = "pvs_admin";

/** 30 days — long enough that the owner isn't re-typing the password weekly. */
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

/** Env values arrive from dashboards and CLIs that love to append stray
 * newlines — always read them trimmed so auth never fails on whitespace. */
function envTrimmed(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * Whether the admin login is usable at all. Stays synchronous because
 * verifyAdminToken() runs on every admin request and must not hit the DB.
 * ADMIN_SESSION_SECRET counts on its own so the owner can eventually drop
 * ADMIN_PASSWORD once database sign-ins are set.
 */
export function isAdminAuthConfigured(): boolean {
  return Boolean(
    envTrimmed("ADMIN_PASSWORD") || envTrimmed("ADMIN_SESSION_SECRET")
  );
}

/** True when the env recovery login is usable (both halves present). */
export function isRecoveryLoginConfigured(): boolean {
  return Boolean(envTrimmed("ADMIN_PASSWORD"));
}

/**
 * The owner's login email (ADMIN_EMAIL). Used by the RECOVERY path only;
 * database sign-ins carry their own emails.
 */
export async function checkAdminEmail(candidate: string): Promise<boolean> {
  const expected = envTrimmed("ADMIN_EMAIL");
  if (!expected) return true; // email not enforced until configured
  return candidate.trim().toLowerCase() === expected.toLowerCase();
}

function sessionSecret(): string {
  return envTrimmed("ADMIN_SESSION_SECRET") || envTrimmed("ADMIN_PASSWORD");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to avoid leaking prefix matches. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Why a login attempt failed, so the UI can say something useful. */
export type AdminLoginResult =
  | { ok: true; via: "database" | "recovery"; email: string }
  | { ok: false; reason: "bad-credentials" | "not-configured" };

/**
 * The full login check.
 *
 * Order matters, and it is deliberately forgiving:
 *   1. If a stored sign-in owns this email, its own hash decides.
 *   2. Otherwise (or if that password was wrong), the env recovery login
 *      gets a turn: ADMIN_EMAIL + ADMIN_PASSWORD.
 *
 * Step 2 running even when step 1 exists is what makes a lockout
 * impossible: a database row can never shut the owner out of his own site.
 */
export async function checkAdminLogin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  if (!isAdminAuthConfigured()) return { ok: false, reason: "not-configured" };

  const clean = email.trim().toLowerCase();

  const row = await findAdminCredentialByEmail(clean);
  if (row) {
    const ok = await verifyPassword(password, row.passwordHash).catch(
      () => false
    );
    if (ok) return { ok: true, via: "database", email: row.email };
  }

  // Recovery login — always available, database or no database.
  const [emailOk, passwordOk] = await Promise.all([
    checkAdminEmail(clean),
    checkEnvPassword(password),
  ]);
  if (emailOk && passwordOk) {
    return { ok: true, via: "recovery", email: clean };
  }

  return { ok: false, reason: "bad-credentials" };
}

/** Compares against ADMIN_PASSWORD without leaking length via timing. */
async function checkEnvPassword(candidate: string): Promise<boolean> {
  const expected = envTrimmed("ADMIN_PASSWORD");
  if (!expected) return false;
  // Hash both sides first so comparison length never depends on the secret.
  const [a, b] = await Promise.all([
    hmacHex("pvs-pw-check", candidate),
    hmacHex("pvs-pw-check", expected),
  ]);
  return timingSafeEqual(a, b);
}

/** Creates a signed session token valid for SESSION_MS. */
export async function createAdminToken(): Promise<string> {
  const exp = Date.now() + SESSION_MS;
  const sig = await hmacHex(sessionSecret(), `pvs-admin.${exp}`);
  return `${exp}.${sig}`;
}

/** Verifies a token's signature and expiry. */
export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!isAdminAuthConfigured()) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmacHex(sessionSecret(), `pvs-admin.${expStr}`);
  return timingSafeEqual(sig, expected);
}

/** True when the current request carries a valid admin session cookie. */
export async function hasAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_MS / 1000;

/** Writes the admin session cookie. Shared by the login route and the
 * customer-portal convenience grant below. */
export async function setAdminSessionCookie(): Promise<void> {
  const token = await createAdminToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Convenience: when someone who is ALSO a dashboard admin signs into the
 * customer portal, grant the admin session too, so one login opens both
 * /account and /admin. No-ops for everyone else.
 */
export async function maybeGrantOwnerSession(email: string): Promise<boolean> {
  if (!isAdminAuthConfigured()) return false;
  const clean = email.trim().toLowerCase();
  if (!clean) return false;

  const adminEmail = envTrimmed("ADMIN_EMAIL").toLowerCase();
  const isAdmin =
    (adminEmail !== "" && clean === adminEmail) ||
    Boolean(await findAdminCredentialByEmail(clean));
  if (!isAdmin) return false;

  await setAdminSessionCookie();
  return true;
}
