/**
 * Winter package definitions — single source of truth.
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

export const SHOVELING_TIERS = ["NONE", "STANDARD", "PREMIUM"] as const;
export type ShovelingTier = (typeof SHOVELING_TIERS)[number];

export const DRIVEWAY_SIZE_LABELS: Record<DrivewaySize, string> = {
  ONE_CAR: "1-car driveway",
  TWO_CAR: "2-car driveway",
  THREE_PLUS_CAR: "3+ car driveway",
};

export const SHOVELING_LABELS: Record<ShovelingTier, string> = {
  NONE: "No walkway shoveling",
  STANDARD: "Standard shoveling",
  PREMIUM: "Premium shoveling",
};

export type DrivewayTierDef = {
  slug: DrivewayTier;
  name: string;
  blurb: string;
  features: string[];
  excluded: string[];
  /**
   * Seasonal "starts at" pricing per driveway size, in cents.
   * PLACEHOLDER VALUES — update before launch.
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
    blurb: "Top-tier proactive storm management — best for long driveways and busy households.",
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
  blurb: string;
  features: string[];
  excluded: string[];
  /** Add-on seasonal price in cents. PLACEHOLDER. */
  priceCents: number;
};

export const SHOVELING_TIER_DEFS: ShovelingTierDef[] = [
  {
    slug: "STANDARD",
    name: "Standard Shoveling",
    blurb: "One pass after the snowfall ends — front entrance, walkway, steps.",
    features: [
      "1 pass AFTER snowfall ends",
      "Completion within 12 hours",
      "Front entrance",
      "Main walkway",
      "Steps",
      "Routed efficiently",
    ],
    excluded: ["Multiple passes if needed", "Storm management"],
    priceCents: 35000,
  },
  {
    slug: "PREMIUM",
    name: "Premium Shoveling",
    blurb: "Storm-managed walkway clearing with multi-pass coverage.",
    features: [
      "Storm management",
      "Cleared at 3-5 cm discretion",
      "Multiple passes if needed",
      "Max 2 passes within 24 hours",
      "Completion within 8 hours",
      "Front entrance + steps",
      "Main walkway",
      "Routed efficiently",
    ],
    excluded: [],
    priceCents: 55000,
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
