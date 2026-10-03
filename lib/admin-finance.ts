/**
 * Owner-facing business constants + pure helpers for the admin dashboard.
 * Dependency-free (type-only Prisma imports) so it is safe on server and
 * client.
 */
import type { ContractFrequency } from "@prisma/client";

/**
 * Monthly operating overhead (break-even line), in CAD cents.
 *
 * $13,088/month is the owner's figure for fixed costs: trucks, tractors,
 * insurance, fuel, payroll base, equipment financing, software, etc.
 * Revenue collected in a month is compared against this on the Command
 * Center. Update it HERE when overhead changes; nothing else hard-codes it.
 */
export const MONTHLY_OVERHEAD_CENTS = 1_308_800;

/** Leads untouched (status NEW) longer than this breach the first-call SLA. */
export const FIRST_CALL_SLA_HOURS = 24;

/**
 * Converts a recurring contract's per-visit/per-period price into a monthly
 * figure. Only cadences with a fixed calendar rhythm are normalized;
 * PER_STORM and SEASONAL depend on weather / season length, so they return
 * null and are reported separately rather than guessed at.
 */
export function monthlyContractCents(
  priceCents: number,
  frequency: ContractFrequency,
): number | null {
  switch (frequency) {
    case "WEEKLY":
      return Math.round((priceCents * 52) / 12);
    case "BIWEEKLY":
      return Math.round((priceCents * 26) / 12);
    case "MONTHLY":
      return priceCents;
    default:
      return null;
  }
}

// ---- Winter routes ---------------------------------------------------------

export type WinterTown = "PEMBROKE" | "PETAWAWA" | "OTHER";

/**
 * Route assignment by town. Pembroke is serviced by PLOW TRUCKS, Petawawa
 * by TRACTORS ONLY. Matching is case-insensitive "contains" so
 * "City of Pembroke" or "petawawa, on" still route correctly.
 */
export function winterTown(city: string | null | undefined): WinterTown {
  const c = (city ?? "").toLowerCase();
  if (c.includes("pembroke")) return "PEMBROKE";
  if (c.includes("petawawa")) return "PETAWAWA";
  return "OTHER";
}

export const WINTER_TOWN_META: Record<
  WinterTown,
  { label: string; equipment: string; cls: string }
> = {
  PEMBROKE: {
    label: "Pembroke",
    equipment: "Plow truck",
    cls: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  PETAWAWA: {
    label: "Petawawa",
    equipment: "Tractor",
    cls: "border-lime-500/30 bg-lime-500/10 text-lime-200",
  },
  OTHER: {
    label: "Other area",
    equipment: "Unassigned",
    cls: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  },
};

// ---- Formatting ------------------------------------------------------------

/** "just now", "12m ago", "5h ago", "3d ago", then a short date. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function hoursSince(date: Date, now: Date = new Date()): number {
  return (now.getTime() - date.getTime()) / 3_600_000;
}

/** Percent change, or null when there is no prior baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Whole-dollar CAD, e.g. $13,088. */
export function formatDollars(cents: number | null | undefined): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

/** "commercial-snow-removal" → "Commercial Snow Removal" (unknown slugs). */
export function prettySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
