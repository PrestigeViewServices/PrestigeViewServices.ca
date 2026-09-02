/**
 * Winter package definitions, single source of truth.
 *
 * Driveway-tier starting prices were set by the owner (Sept 2026):
 * Bronze $599.99, Silver $749.99, Gold $959.99, Platinum $1,259.99 per season
 * for a single-car driveway. Larger-size prices are scaled estimates —
 * confirm before quoting. ⚠️ Walkway pass-pack prices are still placeholders.
 * Everything (UI, estimator, admin view, reservation form) reads from this
 * file, so updating prices here updates the whole site.
 *
 * The site displays each tier's price as a MONTHLY payment: the single-car
 * seasonal price divided into MONTHLY_INSTALLMENTS equal payments, rounded to
 * a .99 price point (see monthlyCents). Editing a tier's `priceCents` is
 * therefore all it takes to change the advertised monthly number.
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
  "LONG_RURAL",
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
  ONE_CAR: "Single",
  TWO_CAR: "Double",
  THREE_PLUS_CAR: "Triple or larger",
  LONG_RURAL: "Long rural",
};

/** One-line hint shown under each size option in the quote form. */
export const DRIVEWAY_SIZE_HINTS: Record<DrivewaySize, string> = {
  ONE_CAR: "One vehicle wide",
  TWO_CAR: "Two vehicles side by side",
  THREE_PLUS_CAR: "Three or more wide, or a large parking pad",
  LONG_RURAL: "Long lane-way, roughly 100 ft or more",
};

export const SHOVELING_LABELS: Record<ShovelingTier, string> = {
  NONE: "No walkway shovelling",
  PASS_10: "10-pass pack",
  PASS_15: "15-pass pack",
  PASS_25: "25-pass pack",
  PASS_50: "50-pass pack",
};

/**
 * The seven attributes compared side by side in the tier table. Keeping them
 * on the tier def (rather than in the table component) means the cards, the
 * table, and the shareable image card can never drift apart.
 */
export type TierComparison = {
  triggerDepth: string;
  responseTime: string;
  passesPerStorm: string;
  ridgeRemoval: boolean | string;
  liveTracking: boolean;
  /** What this tier's customer-portal experience includes, one short phrase.
   *  `false` = no portal access (Bronze). */
  portal: boolean | string;
  /** "Driveway cleared" alerts with a time-stamped photo in the portal. */
  photoProof: boolean;
  priorityRouting: boolean;
  spotCap: string;
};

export type DrivewayTierDef = {
  slug: DrivewayTier;
  name: string;
  blurb: string;
  /** Bullets shown on the selectable card. Kept short and scannable. */
  features: string[];
  excluded: string[];
  /** Badge printed above the card, e.g. Platinum's capped-spots callout. */
  badge?: string;
  /** Tier accent, used for the card border glow, dot, and the share image. */
  accent: string;
  compare: TierComparison;
  /**
   * Seasonal "starts at" pricing per driveway size, in cents.
   * PLACEHOLDER VALUES, update before launch. The single-car figure is shown
   * publicly as the tier's "Starting at $X.XX/month" price (seasonal total ÷
   * MONTHLY_INSTALLMENTS, see monthlyCents). Larger sizes feed the running
   * estimate on the quote form and the internal estimate captured alongside
   * each reservation.
   */
  priceCents: Record<DrivewaySize, number>;
};

export const DRIVEWAY_TIER_DEFS: DrivewayTierDef[] = [
  {
    slug: "BRONZE",
    name: "Bronze",
    blurb: "Entry-level seasonal plowing for budget-minded homeowners.",
    features: [
      "1 clearing pass after each storm",
      "Driveway markers included",
      "Done within 24 hours",
    ],
    excluded: ["No night pass", "Flexible routing, not priority"],
    accent: "#CD7F32",
    compare: {
      triggerDepth: "After the storm ends",
      responseTime: "Within 24 hours",
      passesPerStorm: "1 pass",
      ridgeRemoval: "Add-on",
      liveTracking: false,
      portal: false,
      photoProof: false,
      priorityRouting: false,
      spotCap: "Open",
    },
    priceCents: {
      ONE_CAR: 59999, // $99.99/month over 6 payments
      TWO_CAR: 73500,
      THREE_PLUS_CAR: 86500,
      LONG_RURAL: 113500,
    },
  },
  {
    slug: "SILVER",
    name: "Silver",
    blurb: "Auto-dispatch and faster turnaround for everyday driveways.",
    features: [
      "Auto-dispatch at 5 cm, no calling needed",
      "Live tracking and storm alerts",
      "Done within 12 hours",
    ],
    excluded: ["No night pass", "City ridge removal is an add-on"],
    accent: "#C0C0C0",
    compare: {
      triggerDepth: "5 cm",
      responseTime: "Within 12 hours",
      passesPerStorm: "1 pass",
      ridgeRemoval: "Add-on",
      liveTracking: true,
      portal: "Billing + live storm map",
      photoProof: false,
      priorityRouting: false,
      spotCap: "Open",
    },
    priceCents: {
      ONE_CAR: 74999, // $124.99/month over 6 payments
      TWO_CAR: 92500,
      THREE_PLUS_CAR: 109500,
      LONG_RURAL: 138500,
    },
  },
  {
    slug: "GOLD",
    name: "Gold",
    blurb: "Two-pass coverage so you are clear morning and evening.",
    features: [
      "Night and day passes, cleared both ways",
      "City plow ridge removal included",
      "Priority routing, done within 10 hours",
      "Portal alerts + photo proof of every visit",
    ],
    excluded: [],
    accent: "#FFD700",
    compare: {
      triggerDepth: "5 cm",
      responseTime: "Within 10 hours",
      passesPerStorm: "2 passes, night and day",
      ridgeRemoval: true,
      liveTracking: true,
      portal: "Alerts, photos & history",
      photoProof: true,
      priorityRouting: true,
      spotCap: "Open",
    },
    priceCents: {
      ONE_CAR: 95999, // $159.99/month over 6 payments
      TWO_CAR: 117500,
      THREE_PLUS_CAR: 138500,
      LONG_RURAL: 176000,
    },
  },
  {
    slug: "PLATINUM",
    name: "Platinum",
    blurb:
      "Proactive storm management for busy households. Capped each season so the service never slips, first come first served.",
    features: [
      "Earliest trigger, we move at 3 cm",
      "Preventative storm management",
      "White-glove service, done within 8 hours",
      "VIP portal: photo proof + priority line",
      "Limited spots so service never slips",
    ],
    excluded: [],
    badge: "Most Popular · Capped Spots",
    accent: "#7DD3FC",
    compare: {
      triggerDepth: "3 cm",
      responseTime: "Within 8 hours",
      passesPerStorm: "2 passes plus preventative",
      ridgeRemoval: true,
      liveTracking: true,
      portal: "VIP: full experience",
      photoProof: true,
      priorityRouting: true,
      spotCap: "Capped per route",
    },
    priceCents: {
      ONE_CAR: 125999, // $209.99/month over 6 payments
      TWO_CAR: 152500,
      THREE_PLUS_CAR: 178500,
      LONG_RURAL: 226000,
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

// =============================================================================
// ADD-ONS
// =============================================================================
// Multi-select extras that ride along with a driveway pass. Walkway shovelling
// is handled separately because it carries a pack size (see SHOVELING_TIERS).

export const ADD_ON_KEYS = ["SALTING", "RIDGE_PRIORITY", "VETERAN"] as const;
export type AddOnKey = (typeof ADD_ON_KEYS)[number];

export type AddOnDef = {
  key: AddOnKey;
  label: string;
  /** Short clarifier shown under the chip label. */
  hint: string;
  /**
   * Tiers where the add-on is redundant because the pass already covers it.
   * The chip stays visible but is marked "already included".
   */
  includedIn?: DrivewayTier[];
};

export const ADD_ON_DEFS: AddOnDef[] = [
  {
    key: "SALTING",
    label: "Salting and de-icing",
    hint: "Driveway, walkway, and steps treated after clearing",
  },
  {
    key: "RIDGE_PRIORITY",
    label: "City-ridge priority",
    hint: "The windrow the city plow leaves across your apron, cleared first",
    includedIn: ["GOLD", "PLATINUM"],
  },
  {
    key: "VETERAN",
    label: "I am military or a veteran",
    hint: "Applies the standing 10% discount to your quote",
  },
];

export function getAddOn(key: AddOnKey): AddOnDef {
  const def = ADD_ON_DEFS.find((a) => a.key === key);
  if (!def) throw new Error(`Unknown add-on: ${key}`);
  return def;
}

/** True when the chosen pass already covers this add-on. */
export function addOnIsIncluded(key: AddOnKey, tier: DrivewayTier): boolean {
  return getAddOn(key).includedIn?.includes(tier) ?? false;
}

// =============================================================================
// CUSTOMER PORTAL (Aurora Suite)
// =============================================================================
// Silver, Gold, and Platinum passes include an account in our customer portal
// (portal.aurorasuite.ca, run by the same dispatch platform that routes the
// tractors). Bronze has no portal access. The full experience is what sells
// Gold and Platinum, so each feature declares which tiers unlock it.
//
// ⚠️ MARKETING CLAIMS. Confirm each line against what the portal actually
// shows customers before launch, then edit here — the showcase section, the
// tier cards, the comparison table, and the FAQ all read from this file.

export type PortalFeature = {
  key: string;
  title: string;
  body: string;
  /** Tiers whose pass includes this portal feature. */
  tiers: DrivewayTier[];
};

export const PORTAL_FEATURES: PortalFeature[] = [
  {
    key: "live-map",
    title: "Live storm map",
    body: "Watch your operator work toward your driveway in real time during a storm. No wondering, no waiting by the window.",
    tiers: ["SILVER", "GOLD", "PLATINUM"],
  },
  {
    key: "cleared-alerts",
    title: "“Driveway cleared” alerts",
    body: "Get told the moment each pass is finished, the overnight one included, so you walk out to a driveway you already know is open.",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    key: "photo-proof",
    title: "Photo proof of every visit",
    body: "Every clearing is logged with a time-stamped photo. Deployed, travelling, or managing a rental? See your driveway from anywhere on earth.",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    key: "visit-history",
    title: "Season-long visit history",
    body: "Every pass on record with its date and time. Handy for insurance, tenants, and settling “did they even come?” for good.",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    key: "one-tap-requests",
    title: "One-tap requests",
    body: "Need an extra pass or a walkway top-up? Send it from your phone in seconds instead of playing phone tag mid-storm.",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    key: "billing",
    title: "Billing in one place",
    body: "Your quote, your seasonal invoice, and your payments, all in your portal. No paper, no surprises after a heavy month.",
    tiers: ["SILVER", "GOLD", "PLATINUM"],
  },
  {
    key: "priority-line",
    title: "Platinum priority line",
    body: "Platinum messages jump the queue and get answered first, with proactive updates before big storms hit.",
    tiers: ["PLATINUM"],
  },
];

/** Chip label for where a portal feature starts, e.g. "Gold & Platinum". */
export function portalTierLabel(f: PortalFeature): string {
  if (f.tiers.length === DRIVEWAY_TIERS.length) return "All passes";
  if (f.tiers.length === 1) return `${getDrivewayTier(f.tiers[0]).name} only`;
  // A run of three or more ending at Platinum reads better as "<tier> & up".
  const first = DRIVEWAY_TIERS.indexOf(f.tiers[0]);
  const isSuffixRun =
    f.tiers.length === DRIVEWAY_TIERS.length - first &&
    f.tiers.every((t, i) => t === DRIVEWAY_TIERS[first + i]);
  if (isSuffixRun && f.tiers.length > 2) {
    return `${getDrivewayTier(f.tiers[0]).name} & up`;
  }
  return f.tiers.map((t) => getDrivewayTier(t).name).join(" & ");
}

// =============================================================================
// MONTHLY PRICING
// =============================================================================
// Seasonal passes are advertised and billed as equal monthly payments across
// the winter (November through April). All public price displays derive from
// the seasonal `priceCents` through these helpers, so the seasonal source of
// truth and the advertised monthly numbers can never drift apart.

/** Number of equal monthly payments a seasonal pass is split into (Nov–Apr). */
export const MONTHLY_INSTALLMENTS = 6;

/**
 * One monthly payment for a seasonal price, in cents, rounded UP to the next
 * dollar then dropped a cent for a clean ".99" price point. Rounding up keeps
 * the advertised monthly total at or slightly above the seasonal price, so
 * "Starting at $X.XX/month" can never undersell the real quote.
 */
export function monthlyCents(seasonCents: number): number {
  return Math.ceil(seasonCents / MONTHLY_INSTALLMENTS / 100) * 100 - 1;
}

/** The tier's advertised monthly price: its single-car seasonal price. */
export function tierMonthlyFromCents(tier: DrivewayTierDef): number {
  return monthlyCents(tier.priceCents.ONE_CAR);
}

// =============================================================================
// COMPARISON TABLE
// =============================================================================
// Row order is the reading order in the table. `render` pulls the value off
// the tier def so the table, the cards, and the price display share one
// source.

export const COMPARISON_ROWS: {
  label: string;
  render: (t: DrivewayTierDef) => boolean | string;
}[] = [
  {
    label: "Monthly price (from)",
    render: (t) => `${formatMonthly(tierMonthlyFromCents(t))}/mo`,
  },
  { label: "Trigger depth", render: (t) => t.compare.triggerDepth },
  { label: "Response time", render: (t) => t.compare.responseTime },
  { label: "Passes per storm", render: (t) => t.compare.passesPerStorm },
  { label: "City ridge removal", render: (t) => t.compare.ridgeRemoval },
  { label: "Live tracking", render: (t) => t.compare.liveTracking },
  { label: "Customer portal", render: (t) => t.compare.portal },
  { label: "Cleared alerts + photo proof", render: (t) => t.compare.photoProof },
  { label: "Priority routing", render: (t) => t.compare.priorityRouting },
  { label: "Spot caps", render: (t) => t.compare.spotCap },
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

const fmtExact = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return fmt.format(cents / 100);
}

/** Monthly prices keep their cents so "$124.99" reads as intended. */
export function formatMonthly(cents: number): string {
  return fmtExact.format(cents / 100);
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

// =============================================================================
// SERVICE TOWNS
// =============================================================================
// Snow routes run in Petawawa (home routes) and Pembroke (expanding this
// season). "Other" is accepted so we capture demand outside the routes, the
// form then asks which town so the lead is still actionable.

export const WINTER_TOWNS = ["PETAWAWA", "PEMBROKE", "OTHER"] as const;
export type WinterTown = (typeof WINTER_TOWNS)[number];

export const WINTER_TOWN_LABELS: Record<WinterTown, string> = {
  PETAWAWA: "Petawawa",
  PEMBROKE: "Pembroke",
  OTHER: "Other Ottawa Valley",
};

// =============================================================================
// SELECTION SUMMARY
// =============================================================================
// One shared shape for "what the customer picked". The sticky bar, the
// shareable image card, the pre-filled SMS, and the owner's email all render
// from these helpers so the wording is identical everywhere.

export type WinterSelection = {
  drivewayTier: DrivewayTier;
  drivewaySize?: DrivewaySize | null;
  shovelingTier: ShovelingTier;
  addOns: AddOnKey[];
};

/** Short add-on wording used in the one-line running summary. */
const SHORT_ADD_ON: Record<AddOnKey, string> = {
  SALTING: "salting",
  RIDGE_PRIORITY: "city-ridge priority",
  VETERAN: "military rate",
};

/**
 * One-line running summary, e.g.
 * "Platinum + 25 walkway visits + salting".
 */
export function selectionSummary(sel: WinterSelection): string {
  const parts: string[] = [getDrivewayTier(sel.drivewayTier).name];
  const shovel = getShovelingTier(sel.shovelingTier);
  if (shovel) parts.push(`${shovel.passes} walkway visits`);
  for (const key of sel.addOns) parts.push(SHORT_ADD_ON[key]);
  return parts.join(" + ");
}

/**
 * Label/value rows for the shareable card, the confirmation screen, and the
 * owner notification. Skips anything the customer did not choose.
 */
export function selectionLines(
  sel: WinterSelection
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Package", value: `${getDrivewayTier(sel.drivewayTier).name} pass` },
  ];
  if (sel.drivewaySize) {
    rows.push({
      label: "Driveway",
      value: DRIVEWAY_SIZE_LABELS[sel.drivewaySize],
    });
  }
  const shovel = getShovelingTier(sel.shovelingTier);
  if (shovel) {
    rows.push({ label: "Walkways", value: `${shovel.passes} shovelling visits` });
  }
  for (const key of sel.addOns) {
    if (key === "VETERAN") continue; // shown as its own line below
    rows.push({ label: "Add-on", value: getAddOn(key).label });
  }
  if (sel.addOns.includes("VETERAN")) {
    rows.push({ label: "Discount", value: "Military and veteran 10%" });
  }
  return rows;
}
