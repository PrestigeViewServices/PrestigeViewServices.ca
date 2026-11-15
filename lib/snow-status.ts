import type { PrismaClient } from "@prisma/client";
import { getDb } from "./db";

/**
 * Snow event status: where we are in the current storm, set by the owner
 * from /admin/site/snow-status (one tap, built for a phone in the cab).
 *
 * Stored as a single SiteContent row ("snowStatus"). It is OPERATIONAL
 * state, not marketing copy, so it skips the copy fingerprint envelope in
 * lib/site-content.ts.
 *
 * Stale guard: a status nobody touches expires on its own, so the public
 * site never says "crews deployed" two days after the storm ended.
 *  - "complete" drops off after COMPLETE_TTL_HOURS
 *  - any other active phase drops off after ACTIVE_TTL_HOURS without an update
 */

import {
  ACTIVE_TTL_HOURS,
  COMPLETE_TTL_HOURS,
  SNOW_PHASES,
  type SnowPhase,
} from "./snow-status-phases";

export * from "./snow-status-phases";

export type SnowStatus = {
  phase: SnowPhase;
  /** Optional owner note shown publicly, e.g. "Second storm overnight, expect a 2nd visit". */
  note: string;
  updatedAt: string | null;
};

export type PublicSnowStatus = SnowStatus & {
  /** True when the stored phase expired and "none" is being served instead. */
  expired: boolean;
};

const KEY = "snowStatus";
const EMPTY: SnowStatus = { phase: "none", note: "", updatedAt: null };

function sanitize(v: unknown): SnowStatus | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (!SNOW_PHASES.includes(o.phase as SnowPhase)) return null;
  const updatedAt =
    typeof o.updatedAt === "string" && !Number.isNaN(Date.parse(o.updatedAt))
      ? o.updatedAt
      : null;
  return {
    phase: o.phase as SnowPhase,
    note: String(o.note ?? "").slice(0, 200),
    updatedAt,
  };
}

/** Whether a stored status has aged out. */
export function isExpired(s: SnowStatus, now = Date.now()): boolean {
  if (s.phase === "none" || !s.updatedAt) return false;
  const ageH = (now - Date.parse(s.updatedAt)) / 3_600_000;
  const ttl = s.phase === "complete" ? COMPLETE_TTL_HOURS : ACTIVE_TTL_HOURS;
  return ageH > ttl;
}

/** The raw stored status (admin view). Never throws. */
export async function getStoredSnowStatus(
  db: PrismaClient | null = getDb()
): Promise<SnowStatus> {
  if (!db) return EMPTY;
  try {
    const row = await db.siteContent.findUnique({ where: { key: KEY } });
    return sanitize(row?.value) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

/** What the public site should show right now. Never throws. */
export async function getPublicSnowStatus(
  db: PrismaClient | null = getDb()
): Promise<PublicSnowStatus> {
  const s = await getStoredSnowStatus(db);
  if (isExpired(s)) return { ...EMPTY, expired: true };
  return { ...s, expired: false };
}

export async function saveSnowStatus(
  db: PrismaClient,
  phase: SnowPhase,
  note: string
): Promise<void> {
  const value: SnowStatus = {
    phase,
    note: note.trim().slice(0, 200),
    updatedAt: new Date().toISOString(),
  };
  await db.siteContent.upsert({
    where: { key: KEY },
    create: { key: KEY, value: value as object },
    update: { value: value as object },
  });
}
