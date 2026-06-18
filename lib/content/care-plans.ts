/**
 * Care Plans, one-off Packages & à-la-carte pricing — SINGLE SOURCE OF TRUTH.
 *
 * ✏️  TO EDIT PRICES: change the numbers in this file only. Every surface that
 *     shows a plan/package price (the /care-plans page, the per-service
 *     "Care Plans" sections, and the Build-Your-Own calculator) reads from here.
 *
 * 💳  BILLING PLACEHOLDER: nothing here charges a card. Every CTA routes to the
 *     existing lead-capture flow at /quote (see `quoteHref`). When recurring
 *     billing is ready, wire Stripe/Square subscription creation at that CTA —
 *     search this repo for "BILLING PLACEHOLDER" to find the touch points.
 *
 * Prices are stored as whole CAD dollars (these are round marketing numbers,
 * not invoice math, so cents would be noise).
 */

import type { LucideIcon } from "lucide-react";
import { Home, Sparkles, Droplets, Waves } from "lucide-react";

/* ----------------------------------------------------------------------------
 * À-la-carte services — the building blocks shared by plans, packages, and the
 * Build-Your-Own calculator.
 * ------------------------------------------------------------------------- */

export type ServiceKey = "house-wash" | "windows" | "gutters" | "driveway";

export type ServiceDef = {
  key: ServiceKey;
  label: string;
  icon: LucideIcon;
  /** One-time "from" price for a single visit. */
  oneOffFrom: number;
  /**
   * Build-Your-Own monthly building-block price. The cheapest of these is the
   * "from $32/mo" headline on the Build-Your-Own card — keep them in sync.
   */
  monthlyFrom: number;
};

export const SERVICE_DEFS: ServiceDef[] = [
  { key: "house-wash", label: "House Wash", icon: Home, oneOffFrom: 349, monthlyFrom: 39 },
  { key: "windows", label: "Windows", icon: Sparkles, oneOffFrom: 179, monthlyFrom: 32 },
  { key: "gutters", label: "Gutters", icon: Droplets, oneOffFrom: 179, monthlyFrom: 32 },
  { key: "driveway", label: "Driveway", icon: Waves, oneOffFrom: 179, monthlyFrom: 32 },
];

export function getServiceDef(key: ServiceKey): ServiceDef {
  const def = SERVICE_DEFS.find((s) => s.key === key);
  if (!def) throw new Error(`Unknown service key: ${key}`);
  return def;
}

/* ----------------------------------------------------------------------------
 * Build-Your-Own stacking discount.
 *   2 services  → 10% off
 *   3+ services → 15% off
 * ------------------------------------------------------------------------- */

export function stackingDiscount(count: number): number {
  if (count >= 3) return 0.15;
  if (count === 2) return 0.1;
  return 0;
}

/** Live total for the Build-Your-Own calculator. */
export function buildYourOwnTotal(keys: ServiceKey[]): {
  subtotal: number;
  discountRate: number;
  savings: number;
  total: number;
} {
  const subtotal = keys.reduce((sum, k) => sum + getServiceDef(k).monthlyFrom, 0);
  const discountRate = stackingDiscount(keys.length);
  const savings = Math.round(subtotal * discountRate);
  return { subtotal, discountRate, savings, total: subtotal - savings };
}

/* ----------------------------------------------------------------------------
 * Recurring Care Plans (billed monthly, services spread across the year).
 * ------------------------------------------------------------------------- */

export type CarePlanSlug =
  | "house-gutter"
  | "house-view"
  | "total-exterior"
  | "build-your-own";

export type CalendarStop = {
  /** Short month label shown on the timeline, e.g. "May". */
  month: string;
  /** What happens that month. */
  items: string[];
};

export type CarePlan = {
  slug: CarePlanSlug;
  name: string;
  /** Monthly price in dollars. */
  monthly: number;
  /** Render the price as "from $X/mo" (used by Build-Your-Own). */
  isFrom?: boolean;
  tagline: string;
  /** Inclusion lines with an icon each. */
  includes: { icon: LucideIcon; label: string }[];
  bestFor: string;
  mostPopular?: boolean;
  /** Service calendar — how the plan spreads across the season. */
  calendar: CalendarStop[];
};

export const CARE_PLANS: CarePlan[] = [
  {
    slug: "house-gutter",
    name: "House & Gutter Plan",
    monthly: 49,
    tagline: "Keep your siding fresh and your gutters flowing.",
    includes: [
      { icon: Home, label: "House soft-wash (spring)" },
      { icon: Droplets, label: "Gutter clean — spring & fall" },
    ],
    bestFor: "Dirty siding + treed / leafy lots",
    calendar: [
      { month: "May", items: ["House soft-wash", "Spring gutter clean"] },
      { month: "October", items: ["Fall gutter clean"] },
    ],
  },
  {
    slug: "house-view",
    name: "House & View Plan",
    monthly: 49,
    tagline: "Curb appeal up front, a clear view all season.",
    includes: [
      { icon: Home, label: "House soft-wash (spring)" },
      { icon: Sparkles, label: "Exterior windows — spring & fall" },
    ],
    bestFor: "Curb appeal + a clear view",
    calendar: [
      { month: "May", items: ["House soft-wash", "Spring exterior windows"] },
      { month: "September", items: ["Fall exterior windows"] },
    ],
  },
  {
    slug: "total-exterior",
    name: "Total Exterior Plan",
    monthly: 99,
    mostPopular: true,
    tagline: "The whole exterior, handled — nothing left on your list.",
    includes: [
      { icon: Home, label: "House wash" },
      { icon: Sparkles, label: "Exterior windows (2×)" },
      { icon: Droplets, label: "Gutter clean (2×)" },
      { icon: Waves, label: "Driveway wash" },
    ],
    bestFor: "The whole exterior, handled",
    calendar: [
      { month: "May", items: ["House wash", "Spring windows", "Spring gutters"] },
      { month: "July", items: ["Driveway wash"] },
      { month: "October", items: ["Fall windows", "Fall gutters"] },
    ],
  },
  {
    slug: "build-your-own",
    name: "Build-Your-Own",
    monthly: 32,
    isFrom: true,
    tagline:
      "Pick any services — we space them across the season on one monthly payment.",
    includes: [
      { icon: Sparkles, label: "Any mix of services" },
      { icon: Droplets, label: "Add a 2nd service → 10% off" },
      { icon: Waves, label: "Add a 3rd → 15% off" },
    ],
    bestFor: "Homeowners who want exactly what they need",
    calendar: [
      { month: "Spring", items: ["Your first service"] },
      { month: "Summer", items: ["Spread across the season"] },
      { month: "Fall", items: ["Final visit"] },
    ],
  },
];

export function getCarePlan(slug: CarePlanSlug): CarePlan | undefined {
  return CARE_PLANS.find((p) => p.slug === slug);
}

/** Perks every Care Plan includes — shown once, applies to all. */
export const PLAN_PERKS: string[] = [
  "We schedule & call you — you don't lift a finger",
  "Priority booking ahead of one-off jobs",
  "10% off any extra service",
  "Locked-in pricing for your term",
  "12-month term, auto-renews (cancel anytime after)",
];

/* ----------------------------------------------------------------------------
 * One-off Packages (pay once).
 * ------------------------------------------------------------------------- */

export type PackageSlug = "curb-appeal" | "full-shine" | "top-to-bottom";

export type OneOffPackage = {
  slug: PackageSlug;
  name: string;
  price: number;
  tagline: string;
  includes: { icon: LucideIcon; label: string }[];
  bestFor: string;
  mostPopular?: boolean;
};

export const ONE_OFF_PACKAGES: OneOffPackage[] = [
  {
    slug: "curb-appeal",
    name: "Curb Appeal",
    price: 499,
    tagline: "A quick, high-impact refresh for the front of the house.",
    includes: [
      { icon: Home, label: "House wash" },
      { icon: Waves, label: "Driveway / concrete wash" },
    ],
    bestFor: "Listing your home or hosting soon",
  },
  {
    slug: "full-shine",
    name: "Full Shine",
    price: 649,
    mostPopular: true,
    tagline: "The popular all-rounder — house, glass, and gutters in one visit.",
    includes: [
      { icon: Home, label: "House wash" },
      { icon: Sparkles, label: "Exterior windows" },
      { icon: Droplets, label: "Gutter clean" },
    ],
    bestFor: "Most homes, most years",
  },
  {
    slug: "top-to-bottom",
    name: "Top-to-Bottom",
    price: 899,
    tagline: "Everything we do, top to bottom — inside-and-out glass included.",
    includes: [
      { icon: Home, label: "House wash" },
      { icon: Sparkles, label: "Windows — inside & out" },
      { icon: Droplets, label: "Gutter clean" },
      { icon: Waves, label: "Driveway wash" },
    ],
    bestFor: "The full reset, done in one go",
  },
];

export function getPackage(slug: PackageSlug): OneOffPackage | undefined {
  return ONE_OFF_PACKAGES.find((p) => p.slug === slug);
}

/* ----------------------------------------------------------------------------
 * Discount badges.
 * ------------------------------------------------------------------------- */

export type DiscountBadge = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
};

export const DISCOUNT_BADGES: DiscountBadge[] = [
  {
    id: "military",
    emoji: "🎖️",
    title: "Military / Veteran / First Responder",
    detail: "10% off — proud to serve those who serve (Petawawa & CFB).",
  },
  {
    id: "neighbour",
    emoji: "👋",
    title: "Neighbour Deal",
    detail: "15% off when a neighbour books the same week.",
  },
];

/* ----------------------------------------------------------------------------
 * Placement map — which plans / à-la-carte items surface on which service page.
 * The service page reads this; if a slug isn't here, nothing extra renders
 * (so LawnPros & SnowLand pages are untouched).
 * ------------------------------------------------------------------------- */

export type ServicePlanConfig = {
  /** Care plans to feature in the "Put it on autopilot" section. */
  planSlugs: CarePlanSlug[];
  /** À-la-carte service keys to surface as one-off "from" pricing. */
  aLaCarte: ServiceKey[];
};

export const servicePlanMap: Partial<Record<string, ServicePlanConfig>> = {
  "house-washing": {
    planSlugs: ["house-gutter", "house-view", "total-exterior"],
    aLaCarte: ["house-wash"],
  },
  "gutter-cleaning": {
    planSlugs: ["house-gutter", "total-exterior"],
    aLaCarte: ["gutters"],
  },
  "window-cleaning": {
    planSlugs: ["house-view", "total-exterior"],
    aLaCarte: ["windows"],
  },
  "pressure-washing": {
    planSlugs: ["total-exterior"],
    aLaCarte: ["driveway"],
  },
};

/* ----------------------------------------------------------------------------
 * Helpers.
 * ------------------------------------------------------------------------- */

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

/** Format a whole-dollar amount as e.g. "$49". */
export function formatDollars(dollars: number): string {
  return cad.format(dollars);
}

/**
 * Build a lead-capture link for a plan/package CTA.
 *
 * 💳 BILLING PLACEHOLDER — routes to the existing /quote flow only. The `plan`
 * / `package` params are harmless today and let us pre-select the offer when a
 * Stripe/Square subscription checkout is added later.
 */
export function quoteHref(opts: {
  service?: string;
  plan?: CarePlanSlug;
  package?: PackageSlug;
}): string {
  const params = new URLSearchParams();
  if (opts.service) params.set("service", opts.service);
  if (opts.plan) params.set("plan", opts.plan);
  if (opts.package) params.set("package", opts.package);
  const qs = params.toString();
  return qs ? `/quote?${qs}` : "/quote";
}
