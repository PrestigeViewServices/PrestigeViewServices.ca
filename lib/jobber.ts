import type { PrismaClient, PublicCategory } from "@prisma/client";
import { awardServicePoints, recalcTier } from "./loyalty";
import { clubTiers, getClubSettings } from "./club-settings";

/**
 * Jobber GraphQL sync (read-only, Phase 1).
 *
 * Pulls invoices + their jobs/clients and caches them as ServiceRecords
 * mapped to PUBLIC category labels. Points post on PAID invoices only.
 *
 * Auth: Phase 1 uses a long-lived access token (JOBBER_ACCESS_TOKEN) from a
 * Jobber app; the full OAuth2 refresh flow is Phase 3. Without the token the
 * sync is a clean no-op so the portal runs fine on seed/demo data.
 *
 * Matching: Jobber client email → Member email (lowercased). Mismatches are
 * resolved by the admin "link account" tool, which sets
 * CustomerProfile.jobberClientId; linked ids take precedence over email.
 */

const JOBBER_API = "https://api.getjobber.com/api/graphql";
const JOBBER_API_VERSION = "2025-01-20";

export function isJobberConfigured(): boolean {
  return Boolean((process.env.JOBBER_ACCESS_TOKEN ?? "").trim());
}

type JobberInvoiceNode = {
  id: string;
  subject: string | null;
  invoiceStatus: string;
  total: number | null;
  issuedDate: string | null;
  client: {
    id: string;
    emails: { address: string }[];
  } | null;
  jobs: {
    nodes: {
      id: string;
      title: string | null;
      completedAt: string | null;
      property: { address: { street: string | null; city: string | null } } | null;
    }[];
  } | null;
};

async function jobberQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = (process.env.JOBBER_ACCESS_TOKEN ?? "").trim();
  const res = await fetch(JOBBER_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-JOBBER-GRAPHQL-VERSION": JOBBER_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Jobber API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Jobber GraphQL: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("Jobber GraphQL: empty response");
  return json.data;
}

// ---- Category mapping ------------------------------------------------------

/** Built-in fallbacks when no admin mapping matches. Keep these generic —
 * they see internal Jobber names but only ever OUTPUT public categories. */
function fallbackCategory(name: string): PublicCategory {
  const n = name.toLowerCase();
  if (/(snow|plow|shovel|walkway.*clear|salting|winter)/.test(n)) {
    return "SNOW_REMOVAL";
  }
  if (/(lawn|mow|hedge|trim|landscap|spring clean|leaf|aerat|fertiliz)/.test(n)) {
    return "LAWN_CARE";
  }
  return "WINDOW_EXTERIOR";
}

export async function categoryForName(
  db: PrismaClient,
  name: string
): Promise<PublicCategory> {
  const mappings = await db.categoryMapping.findMany();
  const n = name.toLowerCase();
  for (const m of mappings) {
    if (n.includes(m.matchTerm.toLowerCase())) return m.category;
  }
  return fallbackCategory(name);
}

/**
 * Customer-safe title: strips internal division terms that must never
 * render in the portal, then trims leftover separators.
 */
export function scrubTitle(raw: string): string {
  const scrubbed = raw
    .replace(/clear\s*view|lawn\s*pros|snow\s*land/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-–·:]+|[\s\-–·:]+$/g, "")
    .trim();
  return scrubbed || "Service visit";
}

// ---- Sync ------------------------------------------------------------------

export type SyncSummary = {
  ok: boolean;
  reason?: string;
  invoicesSeen: number;
  recordsUpserted: number;
  pointsAwarded: number;
  unmatchedClients: number;
};

/**
 * Pull recent invoices from Jobber, cache as ServiceRecords, award
 * per-visit points on newly paid ones, and refresh tiers.
 */
export async function syncJobber(db: PrismaClient): Promise<SyncSummary> {
  const summary: SyncSummary = {
    ok: false,
    invoicesSeen: 0,
    recordsUpserted: 0,
    pointsAwarded: 0,
    unmatchedClients: 0,
  };
  if (!isJobberConfigured()) {
    summary.reason = "JOBBER_ACCESS_TOKEN not set — sync skipped";
    return summary;
  }

  const data = await jobberQuery<{
    invoices: { nodes: JobberInvoiceNode[] };
  }>(
    `query RecentInvoices($first: Int!) {
      invoices(first: $first, sort: { key: CREATED_AT, direction: DESCENDING }) {
        nodes {
          id
          subject
          invoiceStatus
          total
          issuedDate
          client { id emails { address } }
          jobs {
            nodes {
              id
              title
              completedAt
              property { address { street city } }
            }
          }
        }
      }
    }`,
    { first: 100 }
  );

  const touchedMembers = new Set<string>();
  // Admin-tunable program numbers, loaded once per sync.
  const settings = await getClubSettings(db);
  const tiers = clubTiers(settings);

  for (const inv of data.invoices.nodes) {
    summary.invoicesSeen++;
    const clientId = inv.client?.id ?? null;
    const emails = (inv.client?.emails ?? []).map((e) =>
      e.address.toLowerCase()
    );

    // Linked jobberClientId wins; email match is the fallback.
    let member =
      (clientId &&
        (
          await db.customerProfile.findUnique({
            where: { jobberClientId: clientId },
            select: { memberId: true },
          })
        )?.memberId) ||
      null;
    if (!member && emails.length > 0) {
      const found = await db.member.findFirst({
        where: { email: { in: emails } },
        select: { id: true },
      });
      member = found?.id ?? null;
      // Auto-link on first email match so future renames still resolve.
      if (member && clientId) {
        await db.customerProfile.updateMany({
          where: { memberId: member, jobberClientId: null },
          data: { jobberClientId: clientId },
        });
      }
    }
    if (!member) summary.unmatchedClients++;

    const paid = inv.invoiceStatus === "PAID";
    // Total arrives as a decimal number of dollars; store integer cents.
    const amountCents = Math.round((inv.total ?? 0) * 100);

    const jobs = inv.jobs?.nodes?.length
      ? inv.jobs.nodes
      : [{ id: `inv-${inv.id}`, title: inv.subject, completedAt: inv.issuedDate, property: null }];

    for (const job of jobs) {
      const rawTitle = job.title || inv.subject || "Service visit";
      const category = await categoryForName(db, rawTitle);
      const title = scrubTitle(rawTitle);
      const serviceDate = job.completedAt
        ? new Date(job.completedAt)
        : inv.issuedDate
          ? new Date(inv.issuedDate)
          : new Date();
      const address = job.property?.address
        ? [job.property.address.street, job.property.address.city]
            .filter(Boolean)
            .join(", ")
        : null;

      const record = await db.serviceRecord.upsert({
        where: { jobberJobId: job.id },
        create: {
          jobberJobId: job.id,
          jobberInvoiceId: inv.id,
          memberId: member,
          category,
          title,
          serviceDate,
          address,
          status: job.completedAt ? "COMPLETED" : "SCHEDULED",
          amountCents: Math.round(amountCents / jobs.length),
          paid,
          paidAt: paid ? new Date() : null,
        },
        update: {
          memberId: member ?? undefined,
          status: job.completedAt ? "COMPLETED" : undefined,
          paid,
          paidAt: paid ? new Date() : undefined,
        },
      });
      summary.recordsUpserted++;

      if (
        await awardServicePoints(db, record, {
          pointsPerVisit: settings.pointsPerVisit,
          crossCategoryPoints: settings.pointsCrossCategory,
        })
      ) {
        summary.pointsAwarded++;
      }
      if (member) touchedMembers.add(member);
    }
  }

  for (const memberId of touchedMembers) {
    await recalcTier(db, memberId, tiers);
  }

  summary.ok = true;
  return summary;
}
