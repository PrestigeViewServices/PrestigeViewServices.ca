import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import type { Member } from "@prisma/client";
import { getDb } from "./db";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

/**
 * In-house customer (Prestige Club member) authentication — no external
 * auth service. Same philosophy as the admin login: password + signed,
 * expiring cookie, everything in our own code and database.
 *
 * Passwords: scrypt with a per-user random salt, stored as
 * "scrypt$<salt-hex>$<hash-hex>". Sessions: httpOnly cookie holding
 * "<memberId>.<exp>.<hmac>" signed with the session secret.
 */

export const MEMBER_COOKIE = "pvs_member";

/** 60 days — customers shouldn't have to re-log-in every visit. */
const SESSION_MS = 60 * 24 * 60 * 60 * 1000;
export const MEMBER_SESSION_MAX_AGE_SECONDS = SESSION_MS / 1000;

function sessionSecret(): string {
  return (
    (process.env.CUSTOMER_SESSION_SECRET ?? "").trim() ||
    (process.env.ADMIN_SESSION_SECRET ?? "").trim() ||
    (process.env.ADMIN_PASSWORD ?? "").trim()
  );
}

export function isCustomerAuthConfigured(): boolean {
  return Boolean(sessionSecret());
}

// ---- Passwords -------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---- Session tokens --------------------------------------------------------

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createMemberToken(memberId: string): Promise<string> {
  const exp = Date.now() + SESSION_MS;
  const sig = await hmacHex(`pvs-member.${memberId}.${exp}`);
  return `${memberId}.${exp}.${sig}`;
}

/** Returns the memberId when the token is valid, else null. */
export async function verifyMemberToken(
  token: string
): Promise<string | null> {
  if (!isCustomerAuthConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [memberId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!memberId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await hmacHex(`pvs-member.${memberId}.${expStr}`);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? memberId : null;
}

// ---- Server-side session helpers ------------------------------------------

/** memberId from the current request's cookie, or null. */
export async function getMemberId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(MEMBER_COOKIE)?.value;
  if (!token) return null;
  return verifyMemberToken(token);
}

/** Full Member row (with profile) for the signed-in customer, or null. */
export async function getMember(): Promise<
  (Member & { profile: import("@prisma/client").CustomerProfile | null }) | null
> {
  const memberId = await getMemberId();
  if (!memberId) return null;
  const db = getDb();
  if (!db) return null;
  return db.member.findUnique({
    where: { id: memberId },
    include: { profile: true },
  });
}

/** For server actions: throws when not signed in. Returns memberId. */
export async function requireMemberId(): Promise<string> {
  const memberId = await getMemberId();
  if (!memberId) throw new Error("Not signed in");
  return memberId;
}
