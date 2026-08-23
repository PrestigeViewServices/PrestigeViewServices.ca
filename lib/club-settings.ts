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
  | "snowEarlybirdDeadline"
  | "pointsWelcome"
  | "pointsBookingRequest"
  | "pointsSocialShoutout"
  | "pointsProfileComplete"
  | "referralFriendCents"
  | "referralAutoAward"
  | "referralMaxPerYear"
  | "referralWindowDays"
  | "referralRequirePaid"
  | "accountDiscountPercent"
  | "accountDiscountEnabled";

export type SettingDef = {
  key: SettingKey;
  label: string;
  description: string;
  group: "Earning" | "Redemption" | "Tiers" | "Referrals" | "Account Discount";
  /** How the stored integer is displayed/edited. "date" stores YYYYMMDD,
   * "toggle" stores 0/1. */
  unit:
    | "points"
    | "cents-per-point"
    | "dollars"
    | "date"
    | "toggle"
    | "percent"
    | "days"
    | "count";
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
    key: "pointsWelcome",
    label: "Welcome bonus",
    description:
      "One-time, posts automatically when an account is created or claimed.",
    group: "Earning",
    unit: "points",
    defaultValue: 100,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsBookingRequest",
    label: "Booking request bonus",
    description:
      "When a member sends a Book-a-Service request from the portal. At most once per 30 days per member.",
    group: "Earning",
    unit: "points",
    defaultValue: 25,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsSocialShoutout",
    label: "Social media shoutout",
    description:
      "Member posts about PVS and tags us; you verify in Approvals. Repeatable after 90 days.",
    group: "Earning",
    unit: "points",
    defaultValue: 150,
    min: 0,
    max: 10_000,
  },
  {
    key: "pointsProfileComplete",
    label: "Profile completion bonus",
    description:
      "One-time, posts automatically when phone, address, and birthday month are all filled in.",
    group: "Earning",
    unit: "points",
    defaultValue: 50,
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

  // ---- Referrals -----------------------------------------------------------
  {
    key: "pointsReferral",
    label: "What the referrer earns",
    description:
      "Points posted to the referrer once their friend's first service is completed and paid. Shown to customers as its dollar value.",
    group: "Referrals",
    unit: "points",
    defaultValue: POINTS.REFERRAL,
    min: 0,
    max: 10_000,
  },
  {
    key: "referralFriendCents",
    label: "What the friend gets",
    description:
      "Credit off the referred friend's first service. Advertised on the referral link and applied by you at invoicing.",
    group: "Referrals",
    unit: "dollars",
    defaultValue: 2_500,
    min: 0,
    max: 50_000,
  },
  {
    key: "referralRequirePaid",
    label: "Only pay out after the friend pays",
    description:
      "On: the referrer's reward waits until the friend's first service is completed AND the invoice is paid. Leave this on.",
    group: "Referrals",
    unit: "toggle",
    defaultValue: 1,
    min: 0,
    max: 1,
  },
  {
    key: "referralAutoAward",
    label: "Award automatically",
    description:
      "On: the reward posts by itself the moment the friend's first paid service syncs. Off: it waits for you in Approvals.",
    group: "Referrals",
    unit: "toggle",
    defaultValue: 1,
    min: 0,
    max: 1,
  },
  {
    key: "referralMaxPerYear",
    label: "Max rewarded referrals per member per year",
    description:
      "Abuse guard. Referrals past the cap still get tracked, they just wait for your approval. 0 means no cap.",
    group: "Referrals",
    unit: "count",
    defaultValue: 25,
    min: 0,
    max: 1_000,
  },
  {
    key: "referralWindowDays",
    label: "Attribution window",
    description:
      "How long after clicking a referral link the friend can still request service and have it count.",
    group: "Referrals",
    unit: "days",
    defaultValue: 90,
    min: 1,
    max: 730,
  },

  // ---- Account discount ----------------------------------------------------
  {
    key: "accountDiscountEnabled",
    label: "Offer the account discount",
    description:
      "On: the site advertises a percentage off for creating a free account. Turn off to pull the offer everywhere at once.",
    group: "Account Discount",
    unit: "toggle",
    defaultValue: 1,
    min: 0,
    max: 1,
  },
  {
    key: "accountDiscountPercent",
    label: "Account sign-up discount",
    description:
      "Percent off the next service for members with a free account. Applied by you at quoting, flagged on every lead.",
    group: "Account Discount",
    unit: "percent",
    defaultValue: 5,
    min: 0,
    max: 50,
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

// ---- Account discount ------------------------------------------------------

/**
 * The "create a free account and save" offer, resolved from settings. One
 * helper so every banner, form, and email quotes the same number and the
 * whole offer can be pulled site-wide with a single toggle.
 */
export type AccountOffer = {
  enabled: boolean;
  percent: number;
  /** "5%" — for inline copy. */
  label: string;
};

export function accountOffer(settings: ClubSettings): AccountOffer {
  const percent = Math.max(0, Math.min(100, settings.accountDiscountPercent));
  return {
    enabled: settings.accountDiscountEnabled === 1 && percent > 0,
    percent,
    label: `${percent}%`,
  };
}

/**
 * Settings for pages that render before the DB is reachable (or when it
 * isn't configured at all). Code defaults only — never blocks a page.
 */
export function defaultSettings(): ClubSettings {
  return Object.fromEntries(
    SETTING_DEFS.map((d) => [d.key, d.defaultValue])
  ) as ClubSettings;
}

/** getClubSettings that degrades to defaults instead of throwing. */
export async function getClubSettingsSafe(
  db: PrismaClient | null
): Promise<ClubSettings> {
  if (!db) return defaultSettings();
  try {
    return await getClubSettings(db);
  } catch {
    return defaultSettings();
  }
}
