import type { PrismaClient } from "@prisma/client";
import { POINTS, CENTS_PER_POINT, TIERS, type TierDef } from "./loyalty";

/**
 * Admin-editable Prestige Club numbers. Every tunable value lives here:
 * key, label, default (from the code constants), and bounds. The owner
 * edits them at /admin/club/settings; award paths and portal displays read
 * the merged settings at request time.
 *
 * IMPORTANT: changes apply to FUTURE awards only. The PointsTransaction
 * ledger is append-only and is never recalculated when a value changes.
 */

export type SettingKey =
  | "pointsPerVisit"
  | "pointsReview"
  | "pointsReferral"
  | "pointsCrossCategory"
  | "pointsSnowEarlybird"
  | "pointsBirthday"
  | "centsPerPoint"
  | "tierInsiderCents"
  | "tierEliteCents"
  | "tierPrestigeCents"
  | "snowEarlybirdDeadline";

export type SettingDef = {
  key: SettingKey;
  label: string;
  description: string;
  group: "Earning" | "Redemption" | "Tiers";
  /** How the stored integer is displayed/edited. "date" stores YYYYMMDD. */
  unit: "points" | "cents-per-point" | "dollars" | "date";
  defaultValue: number;
  min: number;
  max: number;
};

export const SETTING_DEFS: SettingDef[] = [
  {
    key: "pointsPerVisit",
    label: "Points per completed visit",
    description: "Posted automatically when a visit's invoice is paid.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.PER_VISIT,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsReview",
    label: "Google review bonus",
    description: "One-time, after you verify the review in Approvals.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.REVIEW,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsReferral",
    label: "Referral bonus",
    description: "Per referral whose first service is completed and paid.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.REFERRAL,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsCrossCategory",
    label: "Second-category bonus",
    description:
      "One-time, when a member's paid visits span two service categories.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.CROSS_CATEGORY,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsSnowEarlybird",
    label: "Snow early-bird bonus",
    description: "Seasonal snow contract signed before the deadline.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.SNOW_EARLYBIRD,
    min: 0,
    max: 10_000,
  },
  {
    key: "snowEarlybirdDeadline",
    label: "Snow early-bird deadline",
    description:
      "Confirmed snow reservations made on or before this date earn the early-bird bonus automatically.",
    group: "Earning",
    unit: "date",
    defaultValue: 2026_08_14,
    min: 2020_01_01,
    max: 2099_12_31,
  },
  {
    key: "pointsBirthday",
    label: "Birthday bonus",
    description: "Auto-credited once a year in the member's birthday month.",
    group: "Earning",
    unit: "points",
    defaultValue: POINTS.BIRTHDAY,
    min: 0,
    max: 10_000,
  },
  {
    key: "centsPerPoint",
    label: "Credit value per point (cents)",
    description:
      "5 = 100 points per $5. Changing this revalues ALL outstanding points — check the liability number first.",
    group: "Redemption",
    unit: "cents-per-point",
    defaultValue: CENTS_PER_POINT,
    min: 1,
    max: 100,
  },
  {
    key: "tierInsiderCents",
    label: "Insider threshold",
    description: "Rolling 12-month paid spend to reach Insider.",
    group: "Tiers",
    unit: "dollars",
    defaultValue: 75_000,
    min: 0,
    max: 100_000_00,
  },
  {
    key: "tierEliteCents",
    label: "Elite threshold",
    description: "Rolling 12-month paid spend to reach Elite.",
    group: "Tiers",
    unit: "dollars",
    defaultValue: 200_000,
    min: 0,
    max: 100_000_00,
  },
  {
    key: "tierPrestigeCents",
    label: "Prestige threshold",
    description: "Rolling 12-month paid spend to reach Prestige.",
    group: "Tiers",
    unit: "dollars",
    defaultValue: 400_000,
    min: 0,
    max: 100_000_00,
  },
];

export type ClubSettings = Record<SettingKey, number>;

/** Stored overrides merged over code defaults. Single cheap query. */
export async function getClubSettings(
  db: PrismaClient
): Promise<ClubSettings> {
  const rows = await db.clubSetting.findMany();
  const out = Object.fromEntries(
    SETTING_DEFS.map((d) => [d.key, d.defaultValue])
  ) as ClubSettings;
  for (const row of rows) {
    const def = SETTING_DEFS.find((d) => d.key === row.key);
    if (def) {
      out[def.key] = Math.min(def.max, Math.max(def.min, row.value));
    }
  }
  return out;
}

/** YYYYMMDD int → Date (end of that day, local). */
export function dateFromYyyymmdd(value: number): Date {
  const y = Math.floor(value / 10_000);
  const m = Math.floor((value % 10_000) / 100);
  const d = value % 100;
  return new Date(y, m - 1, d, 23, 59, 59);
}

/** YYYYMMDD int → "yyyy-mm-dd" for date inputs. */
export function yyyymmddToInput(value: number): string {
  const s = String(value).padStart(8, "0");
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Tier ladder with thresholds taken from settings. */
export function clubTiers(settings: ClubSettings): TierDef[] {
  const byKey: Record<string, number> = {
    MEMBER: 0,
    INSIDER: settings.tierInsiderCents,
    ELITE: settings.tierEliteCents,
    PRESTIGE: settings.tierPrestigeCents,
  };
  return TIERS.map((t) => ({ ...t, minCents: byKey[t.key] ?? t.minCents }));
}
