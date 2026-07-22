/**
 * Winter package definitions, single source of truth.
 *
 * ⚠️ PRICING IS A PLACEHOLDER. Replace the `priceCents` numbers below with the
 * real "Starts at" amounts from the marketing flyer before launch. Everything
 * else (UI, estimator, admin view, reservation form) reads from this file, so
 * updating prices here updates the whole site.
 *
 * Money is stored as integer cents to keep arithmetic exact.
 */

export const DRIVEWAY_TIERS = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
] as const;

export type DrivewayTier = (typeof DRIVEWAY_TIERS)[number];

export const DRIVEWAY_SIZES = [
  "ONE_CAR",
  "TWO_CAR",
  "THREE_PLUS_CAR",
] as const;

export type DrivewaySize = (typeof DRIVEWAY_SIZES)[number];

// Walkway shovelling is sold as prepaid PASS PACKS. Each "pass" is one
// shovelling visit (walkway + porch + back deck). Storms often need 2 passes
// per event, so larger packs suit full-season / 2-passes-per-event coverage.
// NONE = customer declines shovelling.
export const SHOVELING_TIERS = [
  "NONE",
  "PASS_10",
  "PASS_15",
  "PASS_25",
  "PASS_50",
] as const;
export type ShovelingTier = (typeof SHOVELING_TIERS)[number];

export const DRIVEWAY_SIZE_LABELS: Record<DrivewaySize, string> = {
  ONE_CAR: "1-car driveway",
  TWO_CAR: "2-car driveway",
  THREE_PLUS_CAR: "3+ car driveway",
};

export const SHOVELING_LABELS: Record<ShovelingTier, string> = {
  NONE: "No walkway shovelling",
  PASS_10: "10-pass pack",
  PASS_15: "15-pass pack",
  PASS_25: "25-pass pack",
  PASS_50: "50-pass pack",
};

export type DrivewayTierDef = {
  slug: DrivewayTier;
  name: string;
  blurb: string;
  features: string[];
  excluded: string[];
  /**
   * Seasonal "starts at" pricing per driveway size, in cents.
   * PLACEHOLDER VALUES, update before launch.
   */
  priceCents: Record<DrivewaySize, number>;
};

export const DRIVEWAY_TIER_DEFS: DrivewayTierDef[] = [
  {
    slug: "BRONZE",
    name: "Bronze",
    blurb: "Entry-level seasonal plowing for budget-minded homeowners.",
    features: [
      "1 pass after the event",
      "Basic driveway markers",
      "Completed within 24 hours",
    ],
    excluded: ["No courtesy passes", "Flexible routing", "No night-time pass"],
    priceCents: {
      ONE_CAR: 45000,
      TWO_CAR: 55000,
      THREE_PLUS_CAR: 65000,
    },
  },
  {
    slug: "SILVER",
    name: "Silver",
    blurb: "Auto-dispatch + faster turnaround for everyday driveways.",
    features: [
      "Automatic dispatch at 5cm",
      "1 driveway pass per event",
      "Premium driveway markers",
      "Completed within 12 hours",
      "Live tracking + alerts",
    ],
    excluded: [
      "City plow ridge removal",
      "No night-time pass",
      "No courtesy passes",
    ],
    priceCents: {
      ONE_CAR: 65000,
      TWO_CAR: 80000,
      THREE_PLUS_CAR: 95000,
    },
  },
  {
    slug: "GOLD",
    name: "Gold",
    blurb: "Two-pass coverage so you're clear for the morning and the evening.",
    features: [
      "Automatic dispatch at 5cm",
      "Night & day passes (2 passes)",
      "Premium driveway markers",
      "Completed within 10 hours",
      "Live tracking + alerts",
      "City plow ridge removal",
      "Courtesy passes",
      "Priority routing",
    ],
    excluded: [],
    priceCents: {
      ONE_CAR: 90000,
      TWO_CAR: 110000,
      THREE_PLUS_CAR: 130000,
    },
  },
  {
    slug: "PLATINUM",
    name: "Platinum",
    blurb: "Top-tier proactive storm management, best for long driveways and busy households.",
    features: [
      "Automatic dispatch at 3cm",
      "Night & day passes (2 passes)",
      "Premium driveway markers",
      "Completed within 8 hours",
      "Live tracking + alerts",
      "City plow ridge removal",
      "Preventative snow management",
      "Priority routing",
    ],
    excluded: [],
    priceCents: {
      ONE_CAR: 120000,
      TWO_CAR: 145000,
      THREE_PLUS_CAR: 170000,
    },
  },
];

export type ShovelingTierDef = {
  slug: Exclude<ShovelingTier, "NONE">;
  name: string;
  /** Number of shovelling visits in the pack. */
  passes: number;
  blurb: string;
  features: string[];
  excluded: string[];
  /**
   * Internal pack total in cents (passes × starting per-pass rate). NOT shown
   * to customers, the site shows "Custom quote" because the real per-pass
   * rate (~$10 and easing down with bigger packs) depends on walkway/porch/deck
   * size. Used only for the server-side estimate captured with a lead.
   * PLACEHOLDER VALUES, confirm before launch.
   */
  priceCents: number;
};

export const SHOVELING_TIER_DEFS: ShovelingTierDef[] = [
  {
    slug: "PASS_10",
    name: "10-Pass Pack",
    passes: 10,
    blurb: "A starter pack of 10 shovelling visits, walkway, porch & back deck.",
    features: [
      "10 shovelling visits",
      "Walkway + porch + back deck",
      "Use anytime through the season",
      "Top up whenever you run low",
    ],
    excluded: ["Best for 1 pass per event"],
    priceCents: 10000, // 10 × ~$10 starting (internal, not shown)
  },
  {
    slug: "PASS_15",
    name: "15-Pass Pack",
    passes: 15,
    blurb: "Fifteen visits, a comfortable buffer for an average Valley winter.",
    features: [
      "15 shovelling visits",
      "Walkway + porch + back deck",
      "Better value per visit",
      "Priority over single visits",
    ],
    excluded: [],
    priceCents: 14250, // 15 × ~$9.50 starting (internal, not shown)
  },
  {
    slug: "PASS_25",
    name: "25-Pass Pack",
    passes: 25,
    blurb: "Enough for two passes per event through a busy winter.",
    features: [
      "25 shovelling visits",
      "Great for 2 passes per storm",
      "Walkway + porch + back deck",
      "Priority routing",
    ],
    excluded: [],
    priceCents: 22500, // 25 × ~$9 starting (internal, not shown)
  },
  {
    slug: "PASS_50",
    name: "50-Pass Pack",
    passes: 50,
    blurb: "Full-season storm management, two passes per event all winter.",
    features: [
      "50 shovelling visits",
      "2 passes per event all season",
      "Best value per visit",
      "Priority routing",
    ],
    excluded: [],
    priceCents: 42500, // 50 × ~$8.50 starting (internal, not shown)
  },
];

/** Plus-or-minus margin used when showing a price range to customers. */
export const ESTIMATE_MARGIN = 0.1;

export function getDrivewayTier(slug: DrivewayTier): DrivewayTierDef {
  const def = DRIVEWAY_TIER_DEFS.find((t) => t.slug === slug);
  if (!def) throw new Error(`Unknown driveway tier: ${slug}`);
  return def;
}

export function getShovelingTier(
  slug: ShovelingTier
): ShovelingTierDef | null {
  if (slug === "NONE") return null;
  const def = SHOVELING_TIER_DEFS.find((t) => t.slug === slug);
  if (!def) throw new Error(`Unknown shoveling tier: ${slug}`);
  return def;
}

/**
 * Returns the low/high estimate range in cents for a given selection.
 * Range = base ± ESTIMATE_MARGIN so the customer sees an honest "approx"
 * window, not a sticker price they'll hold us to.
 */
export function estimateCents(
  drivewayTier: DrivewayTier,
  drivewaySize: DrivewaySize,
  shovelingTier: ShovelingTier
): { low: number; high: number } {
  const drive = getDrivewayTier(drivewayTier).priceCents[drivewaySize];
  const shovel = getShovelingTier(shovelingTier)?.priceCents ?? 0;
  const base = drive + shovel;
  return {
    low: Math.round(base * (1 - ESTIMATE_MARGIN)),
    high: Math.round(base * (1 + ESTIMATE_MARGIN)),
  };
}

const fmt = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return fmt.format(cents / 100);
}

export function formatRange({
  low,
  high,
}: {
  low: number;
  high: number;
}): string {
  return `${formatCents(low)} – ${formatCents(high)}`;
}
