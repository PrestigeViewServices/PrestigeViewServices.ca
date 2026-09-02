import { cookies } from "next/headers";
import {
  findAdminCredentialByEmail,
  readAdminCredential,
  verifyAdminCredentialPassword,
} from "./admin-credentials";
import { verifyPassword } from "./customer-auth";

/**
 * Internal admin authentication — no external auth service.
 *
 * The owner password lives EITHER in Postgres (AdminCredential, set from
 * /admin/account) or, when that row is absent, in the ADMIN_PASSWORD env
 * var. The DB row wins when present so a password changed in the dashboard
 * is genuinely changed; the env var remains the break-glass for when
 * Postgres is unreachable. See lib/admin-credentials.ts.
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
 * ADMIN_PASSWORD once a database credential is set.
 */
export function isAdminAuthConfigured(): boolean {
  return Boolean(
    envTrimmed("ADMIN_PASSWORD") || envTrimmed("ADMIN_SESSION_SECRET")
  );
}

/**
 * The owner's login email (ADMIN_EMAIL). Login requires it to match when
 * set — it identifies the owner account so future integrations can key off
 * the same address.
 */
export async function checkAdminEmail(candidate: string): Promise<boolean> {
  const { credential } = await readAdminCredential();
  if (credential) {
    return candidate.trim().toLowerCase() === credential.email.toLowerCase();
  }
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

/**
 * Checks a submitted password.
 *
 * A stored AdminCredential is authoritative: once the owner sets a password
 * in the dashboard, ADMIN_PASSWORD stops being accepted, otherwise the old
 * password would live forever. If there is no row — not migrated, empty
 * table, or Postgres down — we fall back to the env var so the owner can
 * always get in.
 */
export async function checkAdminPassword(candidate: string): Promise<boolean> {
  return checkEnvOrOwnerPassword(candidate);
}

/**
 * The full login check: matches the submitted email to ONE dashboard
 * sign-in (owner or an extra account like contact@) and verifies the
 * password against that account's own hash.
 *
 * Env fallback rules are unchanged from the single-account days: while the
 * OWNER has no database row, ADMIN_EMAIL/ADMIN_PASSWORD still work, so a
 * broken database can never lock the owner out. Once the owner row exists,
 * the env password dies for good.
 */
export async function checkAdminLogin(
  email: string,
  password: string
): Promise<boolean> {
  const row = await findAdminCredentialByEmail(email);
  if (row) {
    try {
      return await verifyPassword(password, row.passwordHash);
    } catch {
      return false;
    }
  }

  // No row for this email — the env path is only valid while the owner has
  // no stored credential, and only for the configured ADMIN_EMAIL.
  const { credential } = await readAdminCredential();
  if (credential) return false;
  const [emailOk, passwordOk] = await Promise.all([
    checkAdminEmail(email),
    checkEnvOrOwnerPassword(password),
  ]);
  return emailOk && passwordOk;
}

async function checkEnvOrOwnerPassword(candidate: string): Promise<boolean> {
  const { credential } = await readAdminCredential();
  if (credential) return verifyAdminCredentialPassword(candidate);

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

/**
 * Owner convenience: when the OWNER (email === ADMIN_EMAIL) signs into the
 * customer portal, also grant the admin session so one login opens both
 * /account and /admin. No-ops for everyone else.
 */
export async function maybeGrantOwnerSession(email: string): Promise<boolean> {
  const { credential } = await readAdminCredential();
  const adminEmail = (
    credential?.email ?? process.env.ADMIN_EMAIL ?? ""
  )
    .trim()
    .toLowerCase();
  if (
    !adminEmail ||
    !isAdminAuthConfigured() ||
    email.trim().toLowerCase() !== adminEmail
  ) {
    return false;
  }
  const token = await createAdminToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return true;
}
