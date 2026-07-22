/**
 * Server-only field-ops helpers (DB-touching). Used by the seed and by admin
 * server actions. Keep client components importing lib/dashboard.ts instead —
 * this module pulls in the Prisma client.
 */
import type { PrismaClient } from "@prisma/client";
import { WINTER_DIVISION } from "@/lib/dashboard";

type Db = PrismaClient;

/**
 * Recompute an account's derived fields from live data:
 *  - ltvCents   = sum of PAID invoice amounts on the account
 *  - winterOnly = account has SnowLand work but no summer (lawn/exterior) work
 *
 * Call after any change that affects invoices, jobs, or contracts for the
 * account (invoice paid, job created, contract added).
 */
export async function recomputeAccount(
  db: Db,
  accountId: string
): Promise<{ ltvCents: number; winterOnly: boolean }> {
  const [paid, contracts, jobs] = await Promise.all([
    db.invoice.aggregate({
      where: { accountId, status: "PAID" },
      _sum: { amountCents: true },
    }),
    db.recurringContract.findMany({
      where: { accountId },
      select: { division: true },
    }),
    db.job.findMany({
      where: { accountId, status: { not: "CANCELED" } },
      select: { division: true },
    }),
  ]);

  const ltvCents = paid._sum.amountCents ?? 0;

  const divisions = new Set(
    [...contracts, ...jobs].map((x) => x.division)
  );
  const hasWinter = divisions.has(WINTER_DIVISION);
  const hasSummer = [...divisions].some((d) => d !== WINTER_DIVISION);
  // A brand-new account with no work yet isn't "winter-only".
  const winterOnly = hasWinter && !hasSummer;

  await db.account.update({
    where: { id: accountId },
    data: { ltvCents, winterOnly },
  });

  return { ltvCents, winterOnly };
}

/** Append an audit-trail entry. Never throws into the caller's critical path. */
export async function logActivity(
  db: Db,
  entry: {
    actorId?: string | null;
    entityType: string;
    entityId: string;
    action: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        actorId: entry.actorId ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        meta: entry.meta as object | undefined,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ops] activity log failed", err);
  }
}
