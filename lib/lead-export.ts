import type { PrismaClient } from "@prisma/client";
import { toCsv } from "./csv";
import { getService } from "./content/services";

/**
 * Lead backup + export. Everything the website ever captured as a sales
 * lead can leave the database in one click, so the owner is never one
 * hosting change away from losing a season of follow-ups.
 *
 * Two shapes:
 *  - CSV of the Lead table: opens in Excel / Sheets, imports back through
 *    /admin/leads/import (same headers), or into any CRM.
 *  - JSON backup of EVERY intake table: leads, quote requests, winter
 *    reservations, support tickets, applications. Verbatim rows, restorable
 *    with `npm run leads import`.
 */

export const LEAD_CSV_HEADERS = [
  "id",
  "created",
  "name",
  "email",
  "phone",
  "address",
  "services",
  "message",
  "status",
  "source",
  "estimate",
  "notes",
] as const;

type LeadRow = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string | null;
  serviceSlugs: unknown;
  message: string | null;
  status: string;
  source: string;
  estimateCents: number | null;
  notes: string | null;
};

export function leadsToCsv(rows: LeadRow[]): string {
  return toCsv(
    [...LEAD_CSV_HEADERS],
    rows.map((l) => {
      const slugs = Array.isArray(l.serviceSlugs)
        ? (l.serviceSlugs as string[])
        : [];
      return [
        l.id,
        l.createdAt.toISOString(),
        l.name,
        l.email,
        l.phone,
        l.propertyAddress ?? "",
        slugs.map((s) => getService(s)?.name ?? s).join("; "),
        l.message ?? "",
        l.status,
        l.source,
        l.estimateCents !== null ? (l.estimateCents / 100).toFixed(2) : "",
        l.notes ?? "",
      ];
    })
  );
}

export async function fetchAllLeads(db: PrismaClient): Promise<LeadRow[]> {
  return db.lead.findMany({ orderBy: { createdAt: "desc" } });
}

/** Every intake table, verbatim, for a restorable backup. */
export async function intakeBackup(db: PrismaClient) {
  const [leads, quoteRequests, winterReservations, supportRequests, applications] =
    await Promise.all([
      db.lead.findMany({ orderBy: { createdAt: "asc" } }),
      db.quoteRequest.findMany({ orderBy: { createdAt: "asc" } }),
      db.winterReservation.findMany({ orderBy: { createdAt: "asc" } }),
      db.supportRequest.findMany({ orderBy: { createdAt: "asc" } }),
      db.application.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
  return {
    format: "pvs-intake-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      leads: leads.length,
      quoteRequests: quoteRequests.length,
      winterReservations: winterReservations.length,
      supportRequests: supportRequests.length,
      applications: applications.length,
    },
    leads,
    quoteRequests,
    winterReservations,
    supportRequests,
    applications,
  };
}

export type IntakeBackup = Awaited<ReturnType<typeof intakeBackup>>;
