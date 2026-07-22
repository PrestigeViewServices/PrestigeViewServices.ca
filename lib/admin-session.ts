import { cookies } from "next/headers";

/**
 * Internal admin authentication — no external auth service.
 *
 * One owner password (ADMIN_PASSWORD env var) unlocks the whole dashboard.
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

export function isAdminAuthConfigured(): boolean {
  return Boolean(envTrimmed("ADMIN_PASSWORD"));
}

/**
 * The owner's login email (ADMIN_EMAIL). Login requires it to match when
 * set — it identifies the owner account so future integrations can key off
 * the same address.
 */
export function checkAdminEmail(candidate: string): boolean {
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

/** Checks a submitted password against ADMIN_PASSWORD. */
export async function checkAdminPassword(candidate: string): Promise<boolean> {
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
