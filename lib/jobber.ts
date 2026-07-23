import { randomBytes } from "crypto";
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
const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
export const JOBBER_AUTHORIZE_URL = "https://api.getjobber.com/api/oauth/authorize";
const JOBBER_API_VERSION = "2025-01-20";

/** App credentials from the Jobber Developer Center. */
export function jobberClientCreds(): { id: string; secret: string } | null {
  const id = (process.env.JOBBER_CLIENT_ID ?? "").trim();
  const secret = (process.env.JOBBER_CLIENT_SECRET ?? "").trim();
  return id && secret ? { id, secret } : null;
}

/** Legacy manual token OR app credentials present. */
export function isJobberConfigured(): boolean {
  return Boolean(
    (process.env.JOBBER_ACCESS_TOKEN ?? "").trim() || jobberClientCreds()
  );
}

/** OAuth redirect URI — must match the app config in Jobber exactly. */
export function jobberRedirectUri(): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"
  ).replace(/\/$/, "");
  return `${base}/api/jobber/callback`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

/** Exchange an authorization code (OAuth callback) for tokens and persist. */
export async function exchangeJobberCode(
  db: PrismaClient,
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  const creds = jobberClientCreds();
  if (!creds) return { ok: false, reason: "JOBBER_CLIENT_ID/SECRET not set" };
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: creds.id,
      client_secret: creds.secret,
      code,
      redirect_uri: jobberRedirectUri(),
    }),
  });
  if (!res.ok) {
    return { ok: false, reason: `Token exchange ${res.status}: ${await res.text()}` };
  }
  const json = (await res.json()) as TokenResponse;
  await saveTokens(db, json);
  return { ok: true };
}

async function saveTokens(db: PrismaClient, t: TokenResponse): Promise<void> {
  const expiresAt = t.expires_in
    ? new Date(Date.now() + (t.expires_in - 120) * 1000)
    : null;
  await db.integrationToken.upsert({
    where: { provider: "jobber" },
    create: {
      provider: "jobber",
      accessToken: t.access_token,
      refreshToken: t.refresh_token ?? "",
      expiresAt,
    },
    update: {
      accessToken: t.access_token,
      // Jobber rotates refresh tokens — keep the newest, fall back to old.
      ...(t.refresh_token ? { refreshToken: t.refresh_token } : {}),
      expiresAt,
    },
  });
}

/**
 * Current access token: env override → stored token (auto-refreshed via the
 * rotating refresh token when near expiry). Null = not connected.
 */
export async function getJobberAccessToken(
  db: PrismaClient
): Promise<string | null> {
  const manual = (process.env.JOBBER_ACCESS_TOKEN ?? "").trim();
  if (manual) return manual;

  const stored = await db.integrationToken.findUnique({
    where: { provider: "jobber" },
  });
  if (!stored) return null;

  const fresh =
    stored.expiresAt == null || stored.expiresAt.getTime() > Date.now();
  if (fresh) return stored.accessToken;

  const creds = jobberClientCreds();
  if (!creds || !stored.refreshToken) return null;
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: creds.id,
      client_secret: creds.secret,
      refresh_token: stored.refreshToken,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as TokenResponse;
  await saveTokens(db, json);
  return json.access_token;
}

/** Connection status for the admin card. */
export async function jobberConnectionStatus(db: PrismaClient): Promise<{
  credsPresent: boolean;
  connected: boolean;
  lastTokenUpdate: Date | null;
}> {
  const stored = await db.integrationToken.findUnique({
    where: { provider: "jobber" },
  });
  return {
    credsPresent: Boolean(jobberClientCreds()),
    connected: Boolean(
      stored || (process.env.JOBBER_ACCESS_TOKEN ?? "").trim()
    ),
    lastTokenUpdate: stored?.updatedAt ?? null,
  };
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
  token: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
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

// ---- Bulk client import ----------------------------------------------------

export type ImportSummary = {
  ok: boolean;
  reason?: string;
  clientsSeen: number;
  membersCreated: number;
  alreadyExisted: number;
  noEmail: number;
};

/**
 * Pre-provision a Prestige Club account for every Jobber client.
 *
 * Created accounts are UNCLAIMED (empty password hash — sign-in impossible)
 * with an invite token. A customer claims theirs either through
 * /account/claim/[token] or automatically by signing up with the email on
 * file. Existing members are never touched. Runs are idempotent.
 */
export async function importJobberClients(
  db: PrismaClient
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    ok: false,
    clientsSeen: 0,
    membersCreated: 0,
    alreadyExisted: 0,
    noEmail: 0,
  };
  const token = await getJobberAccessToken(db);
  if (!token) {
    summary.reason = "Jobber not connected";
    return summary;
  }

  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const data: {
      clients: {
        nodes: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          emails: { address: string; primary: boolean }[];
          phones: { number: string; primary: boolean }[];
        }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await jobberQuery(
      token,
      `query ImportClients($first: Int!, $after: String) {
        clients(first: $first, after: $after) {
          nodes {
            id
            firstName
            lastName
            emails { address primary }
            phones { number primary }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first: 100, after: cursor }
    );

    for (const client of data.clients.nodes) {
      summary.clientsSeen++;
      const email = (
        client.emails.find((e) => e.primary)?.address ??
        client.emails[0]?.address ??
        ""
      )
        .trim()
        .toLowerCase();
      if (!email) {
        summary.noEmail++;
        continue;
      }
      const existing = await db.member.findUnique({ where: { email } });
      if (existing) {
        summary.alreadyExisted++;
        // Backfill the Jobber link if this member isn't linked yet.
        await db.customerProfile.updateMany({
          where: { memberId: existing.id, jobberClientId: null },
          data: { jobberClientId: client.id },
        });
        continue;
      }
      const phone =
        client.phones.find((p) => p.primary)?.number ??
        client.phones[0]?.number ??
        null;
      const inviteToken = randomBytes(16).toString("hex");
      try {
        await db.member.create({
          data: {
            email,
            passwordHash: "", // unclaimed — cannot sign in until claimed
            firstName: client.firstName?.trim() || "Neighbour",
            lastName: client.lastName?.trim() || null,
            phone,
            inviteToken,
            profile: { create: { jobberClientId: client.id } },
          },
        });
        summary.membersCreated++;
      } catch {
        summary.alreadyExisted++; // race/duplicate — count as existing
      }
    }

    if (!data.clients.pageInfo.hasNextPage) break;
    cursor = data.clients.pageInfo.endCursor;
  }

  summary.ok = true;
  return summary;
}

// ---- Invoice credit (Phase 3 scaffold) -------------------------------------

/**
 * Apply a redemption credit to a Jobber invoice.
 *
 * SCAFFOLD: Jobber's GraphQL API has no one-shot "apply credit" mutation —
 * the practical route is adding a negative line item or a discount to the
 * invoice, which needs product/service mapping decisions made against a
 * real Jobber account. Until then this is a guarded no-op: it only ever
 * attempts anything when BOTH the access token and JOBBER_ALLOW_WRITES=true
 * are set, so read-only syncing stays strictly read-only.
 */
export async function applyCreditToInvoice(opts: {
  invoiceRef: string;
  creditCents: number;
}): Promise<{ applied: boolean; reason: string }> {
  if (!isJobberConfigured()) {
    return { applied: false, reason: "Jobber not connected" };
  }
  if ((process.env.JOBBER_ALLOW_WRITES ?? "").trim() !== "true") {
    return {
      applied: false,
      reason: "Jobber writes disabled (set JOBBER_ALLOW_WRITES=true to enable)",
    };
  }
  // TODO(Phase 3+): implement the discount/line-item mutation once the
  // Jobber app is provisioned and the credit product is mapped.
  return {
    applied: false,
    reason: `Automation pending — apply ${(opts.creditCents / 100).toFixed(2)} CAD to invoice ${opts.invoiceRef} manually in Jobber`,
  };
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
  const token = await getJobberAccessToken(db);
  if (!token) {
    summary.reason = "Jobber not connected — sync skipped";
    return summary;
  }

  const data = await jobberQuery<{
    invoices: { nodes: JobberInvoiceNode[] };
  }>(
    token,
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
