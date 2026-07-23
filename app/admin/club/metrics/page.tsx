import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Crown,
  Gift,
  Repeat,
  TrendingUp,
  Users,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getClubSettings } from "@/lib/club-settings";
import { TIERS, formatCents, formatPoints } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

/**
 * Club metrics. The #1 KPI is cross-category conversion: the % of customers
 * with paid history who buy in MORE than one service category — that's the
 * whole point of the club.
 */
export default async function ClubMetricsPage() {
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const settings = await getClubSettings(db);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    memberCount,
    newMembers30d,
    tierRows,
    ledgerAll,
    earnedAgg,
    redeemedAgg,
    referralsByStatus,
    memberCategoryRows,
    redemptionsByStatus,
    reviewAwarded,
  ] = await Promise.all([
    db.member.count(),
    db.member.count({ where: { createdAt: { gte: since30d } } }),
    db.customerProfile.groupBy({ by: ["tier"], _count: { tier: true } }),
    db.pointsTransaction.aggregate({ _sum: { amount: true } }),
    db.pointsTransaction.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    db.pointsTransaction.aggregate({
      where: { type: "REDEEM" },
      _sum: { amount: true },
    }),
    db.referral.groupBy({ by: ["status"], _count: { status: true } }),
    db.serviceRecord.groupBy({
      by: ["memberId", "category"],
      where: { paid: true, memberId: { not: null } },
    }),
    db.redemption.groupBy({ by: ["status"], _count: { status: true } }),
    db.reviewClaim.count({ where: { status: "AWARDED" } }),
  ]);

  // ---- Cross-category conversion (#1 KPI) ----
  const categoriesPerMember = new Map<string, number>();
  for (const row of memberCategoryRows) {
    if (!row.memberId) continue;
    categoriesPerMember.set(
      row.memberId,
      (categoriesPerMember.get(row.memberId) ?? 0) + 1
    );
  }
  const payingMembers = categoriesPerMember.size;
  const multiCategory = [...categoriesPerMember.values()].filter(
    (n) => n >= 2
  ).length;
  const crossRate = payingMembers > 0 ? multiCategory / payingMembers : 0;

  // ---- Points economics ----
  const outstanding = Math.max(0, ledgerAll._sum.amount ?? 0);
  const earned = earnedAgg._sum.amount ?? 0;
  const redeemed = Math.abs(redeemedAgg._sum.amount ?? 0);
  const redemptionRate = earned > 0 ? redeemed / earned : 0;
  const liabilityCents = outstanding * settings.centsPerPoint;

  // ---- Referrals ----
  const refCount = (s: string) =>
    referralsByStatus.find((r) => r.status === s)?._count.status ?? 0;
  const refTotal = referralsByStatus.reduce((sum, r) => sum + r._count.status, 0);
  const refAwarded = refCount("AWARDED");
  const refConversion = refTotal > 0 ? refAwarded / refTotal : 0;

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  const tierCount = (key: string) =>
    tierRows.find((t) => t.tier === key)?._count.tier ?? 0;
  const maxTier = Math.max(1, ...TIERS.map((t) => tierCount(t.key)));

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Club Metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The numbers that tell you if the club is working.
        </p>
      </header>

      {/* ---- #1 KPI ---- */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
          <TrendingUp className="h-4 w-4" />
          #1 KPI · Cross-category conversion
        </p>
        <p className="mt-3 text-5xl font-bold text-white tabular-nums">
          {pct(crossRate)}
        </p>
        <p className="mt-2 max-w-xl text-sm text-sky-100/85">
          {multiCategory} of {payingMembers} paying member
          {payingMembers === 1 ? "" : "s"} have booked in more than one
          service category. Every point of this number is a customer who went
          from &quot;the lawn guys&quot; to &quot;our property crew.&quot;
        </p>
      </section>

      {/* ---- Core stats ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Active members"
          value={String(memberCount)}
          sub={`+${newMembers30d} in the last 30 days`}
        />
        <Metric
          icon={Banknote}
          label="Points liability"
          value={formatCents(liabilityCents)}
          sub={`${formatPoints(outstanding)} pts outstanding`}
        />
        <Metric
          icon={Repeat}
          label="Redemption rate"
          value={pct(redemptionRate)}
          sub={`${formatPoints(redeemed)} of ${formatPoints(earned)} earned pts redeemed`}
        />
        <Metric
          icon={Gift}
          label="Referral conversion"
          value={pct(refConversion)}
          sub={`${refAwarded} awarded of ${refTotal} referred`}
        />
      </div>

      {/* ---- Tier distribution ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Members by tier</h2>
        </div>
        <div className="mt-4 space-y-3">
          {TIERS.map((t) => {
            const count = tierCount(t.key);
            return (
              <div key={t.key} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{t.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary/50"
                    style={{ width: `${(count / maxTier) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Pipeline detail ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="surface-card p-6 text-sm">
          <h2 className="text-lg font-semibold">Referral pipeline</h2>
          <dl className="mt-3 space-y-1.5">
            {["INVITED", "BOOKED", "COMPLETED", "AWARDED"].map((s) => (
              <div key={s} className="flex justify-between text-muted-foreground">
                <dt className="capitalize">{s.toLowerCase()}</dt>
                <dd className="tabular-nums text-foreground">{refCount(s)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="surface-card p-6 text-sm">
          <h2 className="text-lg font-semibold">Engagement</h2>
          <dl className="mt-3 space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <dt>Redemptions (all time)</dt>
              <dd className="tabular-nums text-foreground">
                {redemptionsByStatus.reduce((s, r) => s + r._count.status, 0)}
              </dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Applied to invoices</dt>
              <dd className="tabular-nums text-foreground">
                {redemptionsByStatus.find((r) => r.status === "APPLIED")
                  ?._count.status ?? 0}
              </dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Verified review bonuses</dt>
              <dd className="tabular-nums text-foreground">{reviewAwarded}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="surface-card p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
