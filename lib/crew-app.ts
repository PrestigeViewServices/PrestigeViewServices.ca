import { cookies } from "next/headers";
import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./customer-auth";

/**
 * Crew app (/crew) — shared helpers.
 *
 * Sign-in is a crew PIN (set by the owner under Admin > Game Plan > Team)
 * plus picking your name. No accounts, no emails: a crew member opens the
 * link on their phone, types the 4 to 6 digit PIN once, taps their name and
 * is in for 90 days. The cookie is a signed token carrying crewId and
 * memberId; the signature uses the same secret as the admin session so one
 * env var covers both. Admin never shares this cookie.
 *
 * Dates are YYYY-MM-DD strings in the business timezone (America/Toronto),
 * so "today" on a phone in Petawawa and "today" on a Vercel server in
 * Virginia agree.
 */

export const CREW_COOKIE = "pvs_crew";
const SESSION_MS = 90 * 24 * 60 * 60 * 1000;
export const CREW_SESSION_MAX_AGE_SECONDS = SESSION_MS / 1000;
export const BUSINESS_TZ = "America/Toronto";

function secret(): string {
  const s =
    (process.env.ADMIN_SESSION_SECRET ?? "").trim() ||
    (process.env.ADMIN_PASSWORD ?? "").trim();
  return s ? `${s}.crew` : "";
}

export function isCrewAuthConfigured(): boolean {
  return secret().length > 0;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type CrewSession = { crewId: string; memberId: string; exp: number };

export async function createCrewToken(
  crewId: string,
  memberId: string
): Promise<string> {
  const exp = Date.now() + SESSION_MS;
  const payload = `${crewId}.${memberId}.${exp}`;
  const sig = await hmacHex(secret(), `pvs-crew.${payload}`);
  return `${payload}.${sig}`;
}

export async function verifyCrewToken(
  token: string
): Promise<CrewSession | null> {
  if (!isCrewAuthConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [crewId, memberId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await hmacHex(
    secret(),
    `pvs-crew.${crewId}.${memberId}.${expStr}`
  );
  if (!timingSafeEqual(sig, expected)) return null;
  return { crewId, memberId, exp };
}

/** The signed-in crew member, verified against the database, or null. */
export async function getCrewSession(): Promise<
  | (CrewSession & {
      crewName: string;
      memberName: string;
    })
  | null
> {
  const store = await cookies();
  const token = store.get(CREW_COOKIE)?.value;
  if (!token) return null;
  const s = await verifyCrewToken(token);
  if (!s) return null;
  const db = getDb();
  if (!db) return null;
  const member = await db.crewMember.findFirst({
    where: { id: s.memberId, crewId: s.crewId, active: true },
    include: { crew: { select: { name: true, active: true } } },
  });
  if (!member || !member.crew.active) return null;
  return { ...s, crewName: member.crew.name, memberName: member.name };
}

export async function setCrewCookie(crewId: string, memberId: string) {
  const token = await createCrewToken(crewId, memberId);
  const store = await cookies();
  store.set(CREW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CREW_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearCrewCookie() {
  const store = await cookies();
  store.set(CREW_COOKIE, "", { path: "/", maxAge: 0 });
}

// ---- PINs ------------------------------------------------------------------

export const PIN_RE = /^\d{4,6}$/;

export async function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

/** Finds the first active crew whose PIN matches. PINs should be unique per
 * crew; if two crews share one, the first by name wins, so the Team page
 * warns about duplicates. */
export async function findCrewByPin(pin: string) {
  const db = getDb();
  if (!db || !PIN_RE.test(pin)) return null;
  const crews = await db.crew.findMany({
    where: { active: true, pinHash: { not: null } },
    orderBy: { name: "asc" },
    include: {
      members: {
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });
  for (const c of crews) {
    if (c.pinHash && (await verifyPassword(pin, c.pinHash))) return c;
  }
  return null;
}

// ---- Dates (business timezone) --------------------------------------------

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  hour: "numeric",
  hour12: false,
});

/** YYYY-MM-DD for `d` in the business timezone. */
export function ymd(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD already.
  return ymdFmt.format(d);
}

export function businessHour(d: Date = new Date()): number {
  return Number(hourFmt.format(d).replace(/\D/g, "")) % 24;
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Monday of the week containing dateStr. */
export function weekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7;
  return addDays(dateStr, -dow);
}

export function prettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ---- Settings ----------------------------------------------------------------

export async function getCrewSetting(key: string, fallback: string) {
  const db = getDb();
  if (!db) return fallback;
  const row = await db.crewSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function setCrewSetting(key: string, value: string) {
  const db = getDb();
  if (!db) return;
  await db.crewSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function seasonStart(): Promise<string> {
  const y = ymd().slice(0, 4);
  return getCrewSetting("seasonStart", `${y}-01-01`);
}

// ---- Points ------------------------------------------------------------------

export type Standing = {
  memberId: string;
  name: string;
  crewId: string;
  crewName: string;
  week: number;
  season: number;
};

/** Season + week totals for every active member, best season first. */
export async function standings(): Promise<Standing[]> {
  const db = getDb();
  if (!db) return [];
  const today = ymd();
  const [season, week] = [await seasonStart(), weekStart(today)];
  const [members, entries] = await Promise.all([
    db.crewMember.findMany({
      where: { active: true, crew: { active: true } },
      include: { crew: { select: { name: true } } },
    }),
    db.pointEntry.findMany({
      where: { date: { gte: season < week ? season : week } },
      select: { memberId: true, points: true, date: true },
    }),
  ]);
  const map = new Map<string, Standing>();
  for (const m of members) {
    map.set(m.id, {
      memberId: m.id,
      name: m.name,
      crewId: m.crewId,
      crewName: m.crew.name,
      week: 0,
      season: 0,
    });
  }
  for (const e of entries) {
    const s = map.get(e.memberId);
    if (!s) continue;
    if (e.date >= season) s.season += e.points;
    if (e.date >= week) s.week += e.points;
  }
  return [...map.values()].sort(
    (a, b) => b.season - a.season || b.week - a.week || a.name.localeCompare(b.name)
  );
}

/** Awards an auto rule (by autoKey) if it exists and is active. */
export async function awardAuto(
  autoKey: string,
  memberId: string,
  opts: { stopId?: string; note?: string; date?: string } = {}
) {
  const db = getDb();
  if (!db) return;
  const rule = await db.pointRule.findUnique({ where: { autoKey } });
  if (!rule || !rule.active || rule.points === 0) return;
  await db.pointEntry.create({
    data: {
      memberId,
      points: rule.points,
      reason: rule.label,
      note: opts.note ?? null,
      date: opts.date ?? ymd(),
      ruleId: rule.id,
      stopId: opts.stopId ?? null,
    },
  });
}

// ---- Plan shaping ------------------------------------------------------------

export const planInclude = {
  crew: {
    select: {
      id: true,
      name: true,
      truck: true,
      members: {
        where: { active: true },
        orderBy: { name: "asc" as const },
        select: { id: true, name: true },
      },
    },
  },
  stops: {
    orderBy: { sortOrder: "asc" as const },
    include: { doneBy: { select: { id: true, name: true } } },
  },
} as const;

/** The plan a crew sees: today's, plus tomorrow's after 5pm. */
export async function crewVisiblePlans(crewId: string) {
  const db = getDb();
  if (!db) return { today: null, tomorrow: null, date: ymd() };
  const today = ymd();
  const showTomorrow = businessHour() >= 17;
  const dates = showTomorrow ? [today, addDays(today, 1)] : [today];
  const plans = await db.gamePlan.findMany({
    where: { crewId, date: { in: dates }, published: true },
    include: planInclude,
  });
  return {
    date: today,
    today: plans.find((p) => p.date === today) ?? null,
    tomorrow: showTomorrow
      ? plans.find((p) => p.date === addDays(today, 1)) ?? null
      : null,
  };
}
