/**
 * Shared, PURE helpers for the internal ops dashboard — formatters, division
 * labels, status metadata, and the pipeline column model.
 *
 * Keep this file dependency-free (only `import type` from @prisma/client, which
 * is erased at build) so it's safe to import from both server and client
 * components. DB-touching logic lives in lib/ops.ts (server-only).
 */
import type {
  Division,
  JobStatus,
  LeadStatus,
  InvoiceStatus,
  ContractStatus,
  ContractFrequency,
} from "@prisma/client";

// ---- Money -----------------------------------------------------------------

/** Format integer CAD cents as currency. Drops the decimals when whole. */
export function formatCents(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact money for dense tiles: $12.5k, $1.2M. */
export function formatCentsCompact(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// ---- Divisions -------------------------------------------------------------

export const DIVISION_LABEL: Record<Division, string> = {
  LAWNPROS: "LawnPros",
  CLEARVIEW: "ClearView",
  SNOWLAND: "SnowLand",
};

export const DIVISION_ACCENT: Record<Division, string> = {
  LAWNPROS: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  CLEARVIEW: "text-sky-300 bg-sky-500/15 border-sky-500/30",
  SNOWLAND: "text-cyan-200 bg-cyan-500/15 border-cyan-500/30",
};

/** SnowLand is the only "winter" division — used for the winter-only flag. */
export const WINTER_DIVISION: Division = "SNOWLAND";

// ---- Status metadata -------------------------------------------------------

type StatusMeta<T extends string> = { value: T; label: string; color: string };

const BLUE = "bg-blue-500/15 text-blue-300 border-blue-500/25";
const YELLOW = "bg-yellow-500/15 text-yellow-200 border-yellow-500/25";
const EMERALD = "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
const ROSE = "bg-rose-500/15 text-rose-300 border-rose-500/25";
const SLATE = "bg-slate-500/15 text-slate-200 border-slate-500/25";
const VIOLET = "bg-violet-500/15 text-violet-300 border-violet-500/25";
const AMBER = "bg-amber-500/15 text-amber-200 border-amber-500/25";

export const LEAD_STATUS_META: StatusMeta<LeadStatus>[] = [
  { value: "NEW", label: "New", color: BLUE },
  { value: "QUOTED", label: "Quoted", color: YELLOW },
  { value: "WON", label: "Won", color: EMERALD },
  { value: "LOST", label: "Lost", color: ROSE },
];

export const JOB_STATUS_META: StatusMeta<JobStatus>[] = [
  { value: "SCHEDULED", label: "Scheduled", color: BLUE },
  { value: "IN_PROGRESS", label: "In Progress", color: VIOLET },
  { value: "COMPLETE", label: "Complete", color: EMERALD },
  { value: "INVOICED", label: "Invoiced", color: SLATE },
  { value: "CANCELED", label: "Canceled", color: ROSE },
];

export const INVOICE_STATUS_META: StatusMeta<InvoiceStatus>[] = [
  { value: "DRAFT", label: "Draft", color: SLATE },
  { value: "SENT", label: "Sent", color: BLUE },
  { value: "PAID", label: "Paid", color: EMERALD },
  { value: "OVERDUE", label: "Overdue", color: ROSE },
];

export const CONTRACT_STATUS_META: StatusMeta<ContractStatus>[] = [
  { value: "ACTIVE", label: "Active", color: EMERALD },
  { value: "PAUSED", label: "Paused", color: AMBER },
  { value: "EXPIRED", label: "Expired", color: SLATE },
  { value: "CANCELED", label: "Canceled", color: ROSE },
];

export const CONTRACT_FREQUENCY_LABEL: Record<ContractFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  PER_STORM: "Per storm",
  SEASONAL: "Seasonal",
};

export function statusColor<T extends string>(
  meta: StatusMeta<T>[],
  value: string
): string {
  return meta.find((m) => m.value === value)?.color ?? SLATE;
}

export function statusLabel<T extends string>(
  meta: StatusMeta<T>[],
  value: string
): string {
  return meta.find((m) => m.value === value)?.label ?? value;
}

// ---- Pipeline model --------------------------------------------------------
// The kanban is a unified board: the first two columns read from the Lead table
// (Lead/Quoted), the rest from the Job table (Scheduled → Invoiced). "Won" leads
// and canceled/lost cards drop off the active board.

export type PipelineSource = "lead" | "job";

export type PipelineColumn = {
  key: string;
  label: string;
  source: PipelineSource;
  /** The Lead or Job status this column collects. */
  status: LeadStatus | JobStatus;
};

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: "LEAD", label: "Lead", source: "lead", status: "NEW" },
  { key: "QUOTED", label: "Quoted", source: "lead", status: "QUOTED" },
  { key: "SCHEDULED", label: "Scheduled", source: "job", status: "SCHEDULED" },
  { key: "IN_PROGRESS", label: "In Progress", source: "job", status: "IN_PROGRESS" },
  { key: "COMPLETE", label: "Complete", source: "job", status: "COMPLETE" },
  { key: "INVOICED", label: "Invoiced", source: "job", status: "INVOICED" },
];

// ---- Misc ------------------------------------------------------------------

export function customerName(c: {
  firstName: string;
  lastName?: string | null;
}): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export function fullAddress(p: {
  streetAddress: string;
  city: string;
  region?: string | null;
  postalCode?: string | null;
}): string {
  return [p.streetAddress, p.city, p.region, p.postalCode]
    .filter(Boolean)
    .join(", ");
}
