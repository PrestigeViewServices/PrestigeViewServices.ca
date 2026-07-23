import type {
  LoyaltyTier,
  PublicCategory,
  PrismaClient,
} from "@prisma/client";

/**
 * THE PRESTIGE CLUB — single source of truth for program rules and copy.
 *
 * Money is integer CAD cents, points are whole integers. Every balance is
 * derived by summing the append-only PointsTransaction ledger — there is no
 * stored balance anywhere.
 *
 * Public category labels ONLY in anything customer-facing. Internal division
 * names must never render in the portal.
 */

export const CLUB_NAME = "The Prestige Club";
export const CLUB_TAGLINE = "Quality you can see. Rewards you can feel.";

// ---- Earning ---------------------------------------------------------------
// Owner decision (2026-07-23): points are earned PER COMPLETED PAID VISIT,
// not per dollar spent. Flat award keeps the program easy to explain and
// rewards frequency. Bonuses below are one-time or event-based.

export const POINTS = {
  /** Every completed, PAID service visit. Posts when the invoice is paid,
   * never on booking. */
  PER_VISIT: 50,
  /** One-time, admin-verified Google review. */
  REVIEW: 250,
  /** Per successful referral (referred customer completes + pays first
   * service). Referred friend gets $25 off their first service. */
  REFERRAL: 500,
  /** First booking in a SECOND service category — the cross-sell engine. */
  CROSS_CATEGORY: 200,
  /** Seasonal snow contract signed before the early-bird deadline. */
  SNOW_EARLYBIRD: 300,
  /** Birthday month bonus (profile must have birthdayMonth set). */
  BIRTHDAY: 100,
} as const;

// ---- Redeeming -------------------------------------------------------------

/** 100 points = $5 CAD → 1 point = 5 cents of service credit. */
export const CENTS_PER_POINT = 5;
/** Redemptions come in $25 steps: 500 / 1000 / 1500 / 2000 points. */
export const REDEEM_STEP_POINTS = 500;
export const REDEEM_OPTIONS = [500, 1000, 1500, 2000] as const;

export function creditCentsForPoints(points: number): number {
  return points * CENTS_PER_POINT;
}

/** Points expire after 24 months with no paid service. */
export const EXPIRY_MONTHS = 24;

// ---- Tiers -----------------------------------------------------------------
// Based on rolling 12-month PAID spend. Recalculated on every paid-invoice
// sync; the rolling window is the only thing that can move a member down.
// Perks are deliberately margin-cheap (priority, price-lock, early access)
// — do not add blanket percentage discounts.

export type TierDef = {
  key: LoyaltyTier;
  name: string;
  /** Rolling 12-month paid spend floor, in cents. */
  minCents: number;
  giveawayEntries: number;
  perks: string[];
  blurb: string;
};

export const TIERS: TierDef[] = [
  {
    key: "MEMBER",
    name: "Member",
    minCents: 0,
    giveawayEntries: 1,
    blurb: "Every PVS customer starts here, earning from visit one.",
    perks: [
      "Earn points on every paid visit",
      "Referral rewards (500 pts per friend)",
      "Quarterly giveaway entry",
      "Birthday bonus (100 pts)",
    ],
  },
  {
    key: "INSIDER",
    name: "Insider",
    minCents: 75_000,
    giveawayEntries: 1,
    blurb: "For regulars, first in line and first to know.",
    perks: [
      "Everything in Member",
      "Priority scheduling window",
      "5% off service add-ons",
      "Early access to seasonal promos",
    ],
  },
  {
    key: "ELITE",
    name: "Elite",
    minCents: 200_000,
    giveawayEntries: 2,
    blurb: "Serious about the property, so are we.",
    perks: [
      "Everything in Insider",
      "12-month price-lock guarantee",
      "One free add-on per year (gutter check, screen cleaning, or walkway salting)",
      "Priority storm response for snow customers",
      "2x giveaway entries",
    ],
  },
  {
    key: "PRESTIGE",
    name: "Prestige",
    minCents: 400_000,
    giveawayEntries: 3,
    blurb: "The top of the club, white-glove treatment all year.",
    perks: [
      "Everything in Elite",
      "One free annual service (exterior window cleaning or house wash refresh, up to $150 value)",
      "First pick on seasonal snow route slots",
      "Direct priority contact line",
      "3x giveaway entries",
    ],
  },
];

export function tierDef(key: LoyaltyTier): TierDef {
  return TIERS.find((t) => t.key === key) ?? TIERS[0];
}

export function tierForSpend(cents: number): TierDef {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (cents >= t.minCents) current = t;
  }
  return current;
}

/** Next tier above the given spend, or null at the top. */
export function nextTierFor(
  cents: number
): { tier: TierDef; remainingCents: number } | null {
  const next = TIERS.find((t) => t.minCents > cents);
  if (!next) return null;
  return { tier: next, remainingCents: next.minCents - cents };
}

// ---- Public categories -----------------------------------------------------

export const CATEGORY_LABELS: Record<PublicCategory, string> = {
  WINDOW_EXTERIOR: "Window & Exterior Cleaning",
  LAWN_CARE: "Lawn Care",
  SNOW_REMOVAL: "Snow Removal",
};

export const CATEGORY_ACCENT: Record<PublicCategory, string> = {
  WINDOW_EXTERIOR: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  LAWN_CARE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  SNOW_REMOVAL: "bg-cyan-500/15 text-cyan-200 border-cyan-500/25",
};

// ---- Ledger helpers (all DB reads derive from the ledger) ------------------

export async function pointsBalance(
  db: PrismaClient,
  memberId: string
): Promise<number> {
  const agg = await db.pointsTransaction.aggregate({
    where: { memberId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/** Rolling 12-month PAID spend in cents, from cached service records. */
export async function rollingSpendCents(
  db: PrismaClient,
  memberId: string
): Promise<number> {
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const agg = await db.serviceRecord.aggregate({
    where: { memberId, paid: true, paidAt: { gte: since } },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

/** Recompute + cache tier and 12-mo spend on the profile. Call after every
 * paid-invoice sync or admin data change. */
export async function recalcTier(
  db: PrismaClient,
  memberId: string
): Promise<void> {
  const spend = await rollingSpendCents(db, memberId);
  const tier = tierForSpend(spend);
  await db.customerProfile.updateMany({
    where: { memberId },
    data: { tier: tier.key, tierSpend12moCents: spend },
  });
}

/**
 * Award the per-visit points for a service record exactly once. Only fires
 * for COMPLETED + PAID records; `pointsAwarded` guards double-posting.
 */
export async function awardServicePoints(
  db: PrismaClient,
  record: {
    id: string;
    memberId: string | null;
    status: string;
    paid: boolean;
    pointsAwarded: boolean;
    title: string;
  }
): Promise<boolean> {
  if (
    !record.memberId ||
    record.pointsAwarded ||
    !record.paid ||
    record.status !== "COMPLETED"
  ) {
    return false;
  }
  await db.$transaction([
    db.pointsTransaction.create({
      data: {
        memberId: record.memberId,
        type: "EARN_SERVICE",
        amount: POINTS.PER_VISIT,
        sourceRef: record.id,
        note: `Completed visit: ${record.title}`,
      },
    }),
    db.serviceRecord.update({
      where: { id: record.id },
      data: { pointsAwarded: true },
    }),
  ]);
  // Cross-sell engine: a paid visit may have just unlocked the one-time
  // second-category bonus.
  await maybeAwardCrossCategory(db, record.memberId);
  return true;
}

/**
 * Points held by not-yet-approved redemption requests. REQUESTED holds the
 * points without a ledger entry; the -points REDEEM entry posts at APPROVAL
 * (declines release the hold automatically).
 */
export async function pendingRedemptionPoints(
  db: PrismaClient,
  memberId: string
): Promise<number> {
  const agg = await db.redemption.aggregate({
    where: { memberId, status: "REQUESTED" },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

/** Balance a member can actually redeem right now. */
export async function availablePoints(
  db: PrismaClient,
  memberId: string
): Promise<number> {
  const [balance, pending] = await Promise.all([
    pointsBalance(db, memberId),
    pendingRedemptionPoints(db, memberId),
  ]);
  return balance - pending;
}

/**
 * Cross-category automation (the cross-sell engine): the first time a
 * member has PAID visits in two different public categories, award the
 * one-time 200-point bonus. Idempotent — a prior EARN_CROSS_CATEGORY
 * entry short-circuits.
 */
export async function maybeAwardCrossCategory(
  db: PrismaClient,
  memberId: string
): Promise<boolean> {
  const already = await db.pointsTransaction.findFirst({
    where: { memberId, type: "EARN_CROSS_CATEGORY" },
    select: { id: true },
  });
  if (already) return false;
  const categories = await db.serviceRecord.groupBy({
    by: ["category"],
    where: { memberId, paid: true },
  });
  if (categories.length < 2) return false;
  await db.pointsTransaction.create({
    data: {
      memberId,
      type: "EARN_CROSS_CATEGORY",
      amount: POINTS.CROSS_CATEGORY,
      note: "First booking in a second category, welcome to the club bonus",
    },
  });
  return true;
}

/** Shareable referral code, e.g. "JORDAN-4X2K". */
export function generateReferralCode(firstName: string): string {
  const base = firstName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8) || "PVS";
  const suffix = Array.from({ length: 4 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(
      Math.floor(Math.random() * 31)
    )
  ).join("");
  return `${base}-${suffix}`;
}

/** Last paid activity + expiry projection for the expiry warning UI. */
export async function expiryInfo(
  db: PrismaClient,
  memberId: string
): Promise<{ lastPaidAt: Date | null; expiresAt: Date | null }> {
  const last = await db.serviceRecord.findFirst({
    where: { memberId, paid: true },
    orderBy: { paidAt: "desc" },
    select: { paidAt: true },
  });
  if (!last?.paidAt) return { lastPaidAt: null, expiresAt: null };
  const expiresAt = new Date(last.paidAt);
  expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);
  return { lastPaidAt: last.paidAt, expiresAt };
}

// ---- Formatting ------------------------------------------------------------

export function formatCents(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("en-CA").format(points);
}
