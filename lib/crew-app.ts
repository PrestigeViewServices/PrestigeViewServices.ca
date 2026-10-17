import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
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
      rank: CrewRank;
      lastSeenAt: Date | null;
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
    where: { id: s.memberId, active: true },
    include: { crew: { select: { id: true, name: true, active: true } } },
  });
  if (!member || !member.crew.active) return null;
  // A member moved to another crew keeps their session; the crew comes from
  // the database, not the cookie.
  return { ...s, crewId: member.crew.id, crewName: member.crew.name, memberName: member.name, rank: member.rank as CrewRank, lastSeenAt: member.lastSeenAt };
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

// ---- Ranks -------------------------------------------------------------------

export const RANKS = ["FIELD_SUPERVISOR", "CREW_LEAD", "SENIOR_TECH", "TECHNICIAN", "TRAINEE"] as const;
export type CrewRank = (typeof RANKS)[number];
export const RANK_LABEL: Record<CrewRank, string> = {
  FIELD_SUPERVISOR: "Field Supervisor",
  CREW_LEAD: "Crew Lead",
  SENIOR_TECH: "Senior Technician",
  TECHNICIAN: "Technician",
  TRAINEE: "Trainee",
};
export const RANK_SHORT: Record<CrewRank, string> = {
  FIELD_SUPERVISOR: "Supervisor",
  CREW_LEAD: "Lead",
  SENIOR_TECH: "Sr. Tech",
  TECHNICIAN: "Tech",
  TRAINEE: "Trainee",
};
/** Lower = more senior. */
export function rankOrder(r: CrewRank): number {
  return RANKS.indexOf(r);
}
export function isLeadOrAbove(r: CrewRank): boolean {
  return rankOrder(r) <= rankOrder("CREW_LEAD");
}
export type PhoneVisibility = "ALL" | "LEADS" | "NONE";
export function canSeePhone(vis: PhoneVisibility, rank: CrewRank): boolean {
  if (vis === "ALL") return true;
  if (vis === "LEADS") return isLeadOrAbove(rank);
  return false;
}

// ---- PINs ------------------------------------------------------------------

export const PIN_RE = /^\d{4,6}$/;

export async function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

/**
 * Finds the active crew member whose personal PIN matches. PINs are kept
 * unique across members (enforced when set), so the first match is the one.
 * A dozen scrypt checks per sign-in is fine; sign-in happens once per phone.
 */
export async function findMemberByPin(pin: string) {
  const db = getDb();
  if (!db || !PIN_RE.test(pin)) return null;
  const members = await db.crewMember.findMany({
    where: { active: true, pinHash: { not: null }, crew: { active: true } },
    orderBy: { name: "asc" },
    include: { crew: { select: { id: true, name: true } } },
  });
  for (const m of members) {
    if (m.pinHash && (await verifyPassword(pin, m.pinHash))) return m;
  }
  return null;
}

/** True if another active member already uses this PIN. */
export async function pinInUse(pin: string, exceptMemberId?: string) {
  const m = await findMemberByPin(pin);
  return !!m && m.id !== exceptMemberId;
}

/** Stamps lastSeenAt at most every 10 minutes so polling doesn't hammer writes. */
export async function touchMember(memberId: string, lastSeenAt: Date | null) {
  const db = getDb();
  if (!db) return;
  if (lastSeenAt && Date.now() - lastSeenAt.getTime() < 10 * 60 * 1000) return;
  await db.crewMember.update({ where: { id: memberId }, data: { lastSeenAt: new Date() } }).catch(() => null);
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
  rank: CrewRank;
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
      rank: m.rank as CrewRank,
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
        orderBy: [{ rank: "asc" }, { name: "asc" }],
        select: { id: true, name: true, rank: true },
      },
    },
  },
  stops: {
    orderBy: { sortOrder: "asc" },
    include: { doneBy: { select: { id: true, name: true } } },
  },
} satisfies Prisma.GamePlanInclude;

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

// ---- Week view ---------------------------------------------------------------

export type WeekDay = {
  date: string;
  headline: string | null;
  truck: string | null;
  startTime: string | null;
  stopCount: number;
  doneCount: number;
  hasDetail: boolean;
};

/**
 * 14 days from this week's Monday for one crew: the headline you typed in
 * the Week grid, plus stop counts where a detailed plan exists. Drafts are
 * hidden. Headlines are always visible (that's the point of the week view);
 * the stop list itself still follows the today / tomorrow-after-5pm rule.
 */
export async function crewWeek(crewId: string): Promise<WeekDay[]> {
  const db = getDb();
  const today = ymd();
  const start = weekStart(today);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  if (!db) return dates.map((date) => ({ date, headline: null, truck: null, startTime: null, stopCount: 0, doneCount: 0, hasDetail: false }));
  const plans = await db.gamePlan.findMany({
    where: { crewId, published: true, date: { in: dates } },
    select: {
      date: true, headline: true, truck: true, startTime: true,
      stops: { select: { status: true } },
    },
  });
  const byDate = new Map(plans.map((p) => [p.date, p]));
  return dates.map((date) => {
    const p = byDate.get(date);
    return {
      date,
      headline: p?.headline ?? null,
      truck: p?.truck ?? null,
      startTime: p?.startTime ?? null,
      stopCount: p?.stops.length ?? 0,
      doneCount: p?.stops.filter((s) => s.status !== "PENDING").length ?? 0,
      hasDetail: (p?.stops.length ?? 0) > 0,
    };
  });
}
