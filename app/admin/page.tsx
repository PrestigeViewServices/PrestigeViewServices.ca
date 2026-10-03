import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BellOff,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  PieChart,
  Snowflake,
  Tractor,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import type { Division, LeadSource, LeadStatus } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notificationsConfigured } from "@/lib/notify";
import { kindMeta } from "@/lib/admin-notifications";
import { NotConfigured } from "@/components/admin/not-configured";
import { NotifyTestButton } from "@/components/admin/notify-test-button";
import {
  Badge,
  PageHeader,
  Panel,
  adminBtn,
} from "@/components/admin/page-header";
import { getService } from "@/lib/content/services";
import {
  DRIVEWAY_SIZE_LABELS,
  getDrivewayTier,
} from "@/lib/content/winter-packages";
import { DIVISION_LABEL } from "@/lib/dashboard";
import {
  FIRST_CALL_SLA_HOURS,
  MONTHLY_OVERHEAD_CENTS,
  WINTER_TOWN_META,
  type WinterTown,
  formatDollars,
  hoursSince,
  monthlyContractCents,
  pctChange,
  prettySlug,
  timeAgo,
  winterTown,
} from "@/lib/admin-finance";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

const SOURCE_LABEL: Record<LeadSource, string> = {
  PUBLIC_FORM: "Website form",
  PORTAL: "Client portal",
  MANUAL: "Manual entry",
  PHONE: "Phone",
  DOOR_TO_DOOR: "Door to door",
};

const DIVISION_BAR: Record<Division, string> = {
  LAWNPROS: "bg-emerald-400/80",
  CLEARVIEW: "bg-blue-400/80",
  SNOWLAND: "bg-cyan-300/80",
};

/** Service slug the public quote form uses for commercial snow work. */
const COMMERCIAL_SNOW_SLUG = "commercial-snow-removal";

/**
 * Command Center: the owner's executive view.
 *
 *  1. Money: revenue collected this month against the $13,088 break-even
 *     line, open pipeline, lead volume, win rate, receivables, recurring.
 *  2. Shape of the business: 6-month revenue trend, sales funnel, lead mix,
 *     winter route density (Pembroke plow trucks vs Petawawa tractors).
 *  3. Work queues: new leads (first-call SLA) and open requests.
 *  4. Context: traffic and the live activity feed.
 */
export default async function AdminHomePage() {
  await requireRole(["ultimate_admin", "super_admin", "admin", "manager"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="The dashboard reads from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  // ---- Periods ------------------------------------------------------------
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // "Same point last month" so month-to-date deltas compare like with like.
  const prevMonthSamePoint = new Date(
    Math.min(
      prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()),
      monthStart.getTime(),
    ),
  );
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const since14d = new Date(todayStart.getTime() - 13 * DAY_MS);
  const since90d = new Date(now.getTime() - 90 * DAY_MS);
  const since180d = new Date(now.getTime() - 180 * DAY_MS);
  // Winter season runs July 1 → June 30 (reservations open in late summer).
  const seasonStart = new Date(
    now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1,
    6,
    1,
  );
  const seasonLabel = `${seasonStart.getFullYear()}–${String(
    (seasonStart.getFullYear() + 1) % 100,
  ).padStart(2, "0")}`;

  const paidSum = (gte: Date, lt: Date) =>
    db.invoice
      .aggregate({
        where: { status: "PAID", paidAt: { gte, lt } },
        _sum: { amountCents: true },
      })
      .then((r) => r._sum.amountCents ?? 0);

  const [
    revenueMtd,
    revenuePrevMtd,
    revenueLastMonth,
    revenueByMonth,
    pipelineLeads,
    unpricedOpenLeads,
    winterPipeline,
    leadsMtd,
    leadsPrevMtd,
    funnel90,
    funnelPrev90,
    receivables,
    pastDueSent,
    activeContracts,
    divisionMtd,
    sourceMtd,
    seasonReservations,
    commercialSnow,
    newLeadCount,
    freshLeads,
    pendingReservations,
    latestReservations,
    newApplications,
    latestApplications,
    openSupport,
    latestSupport,
    openTickets,
    latestTickets,
    views7d,
    uniques7d,
    daily,
    latestNotifs,
  ] = await Promise.all([
    paidSum(monthStart, nextMonthStart),
    paidSum(prevMonthStart, prevMonthSamePoint),
    paidSum(prevMonthStart, monthStart),
    db.$queryRaw<Array<{ month: Date; cents: bigint | null }>>`
      SELECT date_trunc('month', "paidAt") AS month, SUM("amountCents") AS cents
      FROM "Invoice"
      WHERE "status" = 'PAID' AND "paidAt" >= ${sixMonthsAgo}
      GROUP BY 1
      ORDER BY 1
    `,
    db.lead.aggregate({
      where: { status: { in: ["NEW", "QUOTED"] } },
      _sum: { estimateCents: true },
      _count: { _all: true },
    }),
    db.lead.count({
      where: { status: { in: ["NEW", "QUOTED"] }, estimateCents: null },
    }),
    db.winterReservation.aggregate({
      where: { status: { in: ["NEW", "CONTACTED"] } },
      _sum: { estimateLowCents: true, estimateHighCents: true },
      _count: { _all: true },
    }),
    db.lead.count({ where: { createdAt: { gte: monthStart } } }),
    db.lead.count({
      where: { createdAt: { gte: prevMonthStart, lt: prevMonthSamePoint } },
    }),
    db.lead.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since90d } },
      _count: { _all: true },
    }),
    db.lead.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since180d, lt: since90d } },
      _count: { _all: true },
    }),
    db.invoice.groupBy({
      by: ["status"],
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    db.invoice.count({ where: { status: "SENT", dueDate: { lt: now } } }),
    db.recurringContract.findMany({
      where: { status: "ACTIVE" },
      select: { priceCents: true, frequency: true },
    }),
    db.lead.groupBy({
      by: ["division"],
      where: { createdAt: { gte: monthStart } },
      _count: { _all: true },
    }),
    db.lead.groupBy({
      by: ["source"],
      where: { createdAt: { gte: monthStart } },
      _count: { _all: true },
    }),
    db.winterReservation.findMany({
      where: { createdAt: { gte: seasonStart }, status: { not: "DECLINED" } },
      select: {
        city: true,
        status: true,
        estimateLowCents: true,
        estimateHighCents: true,
      },
    }),
    db.lead.findMany({
      where: {
        createdAt: { gte: seasonStart },
        serviceSlugs: { array_contains: [COMMERCIAL_SNOW_SLUG] },
      },
      select: { status: true, estimateCents: true },
    }),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    db.winterReservation.count({
      where: { status: { in: ["NEW", "CONTACTED"] } },
    }),
    db.winterReservation.findMany({
      where: { status: { in: ["NEW", "CONTACTED"] } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.application.count({ where: { status: "NEW" } }),
    db.application.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, roleSlug: true, createdAt: true },
    }),
    db.supportRequest.count({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
    }),
    db.supportRequest.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, createdAt: true, status: true },
    }),
    db.clubTicket.count({ where: { status: "OPEN" } }),
    db.clubTicket.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, subject: true, createdAt: true },
    }),
    db.pageView.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
    }),
    db.pageView
      .groupBy({
        by: ["visitorId"],
        where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } },
      })
      .then((rows) => rows.length),
    db.$queryRaw<Array<{ day: Date; views: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
      FROM "PageView"
      WHERE "createdAt" >= ${since14d}
      GROUP BY 1
      ORDER BY 1
    `,
    db.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  // ---- Revenue vs break-even ----------------------------------------------
  const overhead = MONTHLY_OVERHEAD_CENTS;
  const breakEvenPct = Math.min(100, (revenueMtd / overhead) * 100);
  const gapToBreakEven = overhead - revenueMtd;
  const revenueDelta = pctChange(revenueMtd, revenuePrevMtd);
  const daysInMonth = Math.round(
    (nextMonthStart.getTime() - monthStart.getTime()) / DAY_MS,
  );
  const daysLeft = Math.max(
    1,
    Math.ceil((nextMonthStart.getTime() - now.getTime()) / DAY_MS),
  );
  const monthElapsedPct = Math.min(
    100,
    ((now.getTime() - monthStart.getTime()) /
      (nextMonthStart.getTime() - monthStart.getTime())) *
      100,
  );
  const neededPerDay = gapToBreakEven > 0 ? gapToBreakEven / daysLeft : 0;
  const monthName = now.toLocaleDateString("en-CA", { month: "long" });

  // Recurring contracts: only fixed cadences normalize to a monthly figure.
  let recurringMonthly = 0;
  let variableContracts = 0;
  let variableContractCents = 0;
  for (const c of activeContracts) {
    const m = monthlyContractCents(c.priceCents, c.frequency);
    if (m === null) {
      variableContracts++;
      variableContractCents += c.priceCents;
    } else recurringMonthly += m;
  }

  // 6-month trend (fill empty months with zero).
  const trend: { label: string; cents: number; current: boolean }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const row = revenueByMonth.find((r) => {
      const m = new Date(r.month);
      return (
        m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth()
      );
    });
    trend.push({
      label: d.toLocaleDateString("en-CA", { month: "short" }),
      cents: row?.cents ? Number(row.cents) : 0,
      current: i === 0,
    });
  }
  const trendMax = Math.max(overhead * 1.15, ...trend.map((t) => t.cents));

  // ---- Pipeline ------------------------------------------------------------
  const leadPipelineCents = pipelineLeads._sum.estimateCents ?? 0;
  const winterMid = Math.round(
    ((winterPipeline._sum.estimateLowCents ?? 0) +
      (winterPipeline._sum.estimateHighCents ?? 0)) /
      2,
  );
  const pipelineCents = leadPipelineCents + winterMid;

  // ---- Funnel / win rate ----------------------------------------------------
  const countOf = (
    rows: { status: LeadStatus; _count: { _all: number } }[],
    s: LeadStatus,
  ) => rows.find((r) => r.status === s)?._count._all ?? 0;
  const f = {
    NEW: countOf(funnel90, "NEW"),
    QUOTED: countOf(funnel90, "QUOTED"),
    WON: countOf(funnel90, "WON"),
    LOST: countOf(funnel90, "LOST"),
  };
  const total90 = f.NEW + f.QUOTED + f.WON + f.LOST;
  // A lead that reached QUOTED, WON or LOST was quoted at some point.
  const reachedQuote = f.QUOTED + f.WON + f.LOST;
  const decided = f.WON + f.LOST;
  const winRate = decided > 0 ? Math.round((f.WON / decided) * 100) : null;
  const prevWon = countOf(funnelPrev90, "WON");
  const prevDecided = prevWon + countOf(funnelPrev90, "LOST");
  const prevWinRate =
    prevDecided > 0 ? Math.round((prevWon / prevDecided) * 100) : null;

  // ---- Receivables ---------------------------------------------------------
  const sentRow = receivables.find((r) => r.status === "SENT");
  const overdueRow = receivables.find((r) => r.status === "OVERDUE");
  const receivableCents =
    (sentRow?._sum.amountCents ?? 0) + (overdueRow?._sum.amountCents ?? 0);
  const receivableCount =
    (sentRow?._count._all ?? 0) + (overdueRow?._count._all ?? 0);
  const overdueCount = (overdueRow?._count._all ?? 0) + pastDueSent;

  // ---- Lead mix -------------------------------------------------------------
  const divisions: Division[] = ["LAWNPROS", "CLEARVIEW", "SNOWLAND"];
  const divisionRows = divisions.map((d) => ({
    key: d,
    label: DIVISION_LABEL[d],
    count: divisionMtd.find((r) => r.division === d)?._count._all ?? 0,
  }));
  const unassignedDivision =
    divisionMtd.find((r) => r.division === null)?._count._all ?? 0;
  const sourceRows = sourceMtd
    .map((r) => ({ label: SOURCE_LABEL[r.source], count: r._count._all }))
    .sort((a, b) => b.count - a.count);
  const mixMax = Math.max(
    1,
    ...divisionRows.map((r) => r.count),
    ...sourceRows.map((r) => r.count),
  );

  // ---- Winter routes --------------------------------------------------------
  const towns: WinterTown[] = ["PEMBROKE", "PETAWAWA", "OTHER"];
  const routes = towns.map((t) => {
    const rows = seasonReservations.filter((r) => winterTown(r.city) === t);
    const pending = rows.filter(
      (r) => r.status === "NEW" || r.status === "CONTACTED",
    ).length;
    const confirmed = rows.filter(
      (r) => r.status === "CONFIRMED" || r.status === "COMPLETED",
    ).length;
    const value = rows.reduce(
      (s, r) => s + Math.round((r.estimateLowCents + r.estimateHighCents) / 2),
      0,
    );
    return { town: t, total: rows.length, pending, confirmed, value };
  });
  const routesTotal = routes.reduce((s, r) => s + r.total, 0);
  const commercialOpen = commercialSnow.filter(
    (l) => l.status === "NEW" || l.status === "QUOTED",
  ).length;
  const commercialWon = commercialSnow.filter((l) => l.status === "WON").length;

  // ---- Traffic ---------------------------------------------------------------
  const chart: { label: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    const row = daily.find(
      (r) => new Date(r.day).toDateString() === d.toDateString(),
    );
    chart.push({
      label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      views: row ? Number(row.views) : 0,
    });
  }
  const maxViews = Math.max(1, ...chart.map((c) => c.views));

  // ---- Open requests (everything that is not a sales lead) -------------------
  const openRequestCount =
    pendingReservations + openSupport + openTickets + newApplications;
  type RequestRow = {
    key: string;
    title: string;
    detail: string;
    href: string;
    createdAt: Date;
    badge: string;
    cls: string;
  };
  const requestRows: RequestRow[] = [
    ...latestReservations.map((r) => ({
      key: `w-${r.id}`,
      title: r.name,
      detail: `${getDrivewayTier(r.drivewayTier).name} · ${DRIVEWAY_SIZE_LABELS[r.drivewaySize]} · ${r.city}`,
      href: "/admin/winter-reservations",
      createdAt: r.createdAt,
      badge: "Winter",
      cls: "border-cyan-500/25 bg-cyan-500/10 text-cyan-200",
    })),
    ...latestSupport.map((s) => ({
      key: `s-${s.id}`,
      title: s.name,
      detail: s.status === "IN_PROGRESS" ? "In progress" : "New ticket",
      href: "/admin/support",
      createdAt: s.createdAt,
      badge: "Support",
      cls: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    })),
    ...latestTickets.map((t) => ({
      key: `t-${t.id}`,
      title: t.subject,
      detail: "Open club request",
      href: "/admin/club/tickets",
      createdAt: t.createdAt,
      badge: "Club",
      cls: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    })),
    ...latestApplications.map((a) => ({
      key: `a-${a.id}`,
      title: a.name,
      detail: `Applied: ${a.roleSlug.replace(/-/g, " ")}`,
      href: "/admin/applications",
      createdAt: a.createdAt,
      badge: "Hiring",
      cls: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const slaBreaches = freshLeads.filter(
    (l) => hoursSince(l.createdAt, now) > FIRST_CALL_SLA_HOURS,
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Command Center"
        description={
          <>
            {now.toLocaleDateString("en-CA", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {monthName} month-to-date, day {now.getDate()} of {daysInMonth}
          </>
        }
        meta={<AlertsChip />}
        actions={
          <>
            <Link href="/admin/pipeline" className={adminBtn.secondary}>
              <Filter className="h-4 w-4" />
              Job pipeline
            </Link>
            <Link href="/admin/marketing" className={adminBtn.secondary}>
              <TrendingUp className="h-4 w-4" />
              Marketing &amp; SEO
            </Link>
          </>
        }
      />

      <NotifyStatusBar />

      {/* ================= Executive KPIs ================= */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Revenue vs break-even */}
        <section className="rounded-xl border border-white/[0.07] bg-[#0E1322] p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Revenue collected · {monthName} to date
              </p>
              <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-white">
                {formatDollars(revenueMtd)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                <Delta value={revenueDelta} />
                <span className="text-slate-500">
                  vs {formatDollars(revenuePrevMtd)} same point last month
                </span>
              </div>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-emerald-500/10 text-emerald-300">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between text-[12px]">
              <span
                className={cn(
                  "font-semibold",
                  gapToBreakEven > 0 ? "text-amber-200" : "text-emerald-300",
                )}
              >
                {gapToBreakEven > 0
                  ? `${formatDollars(gapToBreakEven)} to break-even`
                  : `${formatDollars(-gapToBreakEven)} above break-even`}
              </span>
              <span className="tabular-nums text-slate-500">
                {Math.round((revenueMtd / overhead) * 100)}% of{" "}
                {formatDollars(overhead)}
              </span>
            </div>
            <div
              className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(breakEvenPct)}
              aria-label="Revenue toward monthly break-even"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  gapToBreakEven > 0 ? "bg-amber-400" : "bg-emerald-400",
                )}
                style={{ width: `${Math.max(1.5, breakEvenPct)}%` }}
              />
              {/* Where the month is: on pace if the bar is past this tick. */}
              <span
                className="absolute inset-y-0 w-0.5 bg-white/60"
                style={{ left: `${monthElapsedPct}%` }}
                title={`${Math.round(monthElapsedPct)}% of the month elapsed`}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              White tick = {Math.round(monthElapsedPct)}% of the month gone. Bar
              past the tick means on pace.
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-white/[0.06] rounded-sm border border-white/[0.06] bg-white/[0.015]">
            <MiniStat
              label="Need / day"
              value={
                gapToBreakEven > 0 ? formatDollars(neededPerDay) : "Covered"
              }
              sub={`${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
            />
            <MiniStat
              label="Last month"
              value={formatDollars(revenueLastMonth)}
              sub={
                revenueLastMonth >= overhead
                  ? "Above break-even"
                  : "Below break-even"
              }
            />
            <MiniStat
              label="Recurring"
              value={formatDollars(recurringMonthly)}
              sub={`${Math.round((recurringMonthly / overhead) * 100)}% of overhead`}
            />
          </dl>
          {variableContracts > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Recurring excludes {variableContracts} per-storm / seasonal
              contract{variableContracts === 1 ? "" : "s"} (
              {formatDollars(variableContractCents)} per storm or season), which
              vary with the weather.
            </p>
          )}
        </section>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
          <KpiTile
            href="/admin/pipeline"
            label="Open pipeline value"
            value={formatDollars(pipelineCents)}
            icon={<Filter className="h-4 w-4" />}
            accent="bg-blue-500/10 text-blue-300"
            foot={
              <>
                {pipelineLeads._count._all} open leads ·{" "}
                {winterPipeline._count._all} winter reservations
                {unpricedOpenLeads > 0 && (
                  <span className="text-amber-200/80">
                    {" "}
                    · {unpricedOpenLeads} not yet priced
                  </span>
                )}
              </>
            }
          />
          <KpiTile
            href="/admin/leads"
            label={`New leads · ${monthName}`}
            value={leadsMtd.toLocaleString("en-CA")}
            icon={<Inbox className="h-4 w-4" />}
            accent="bg-sky-500/10 text-sky-300"
            delta={pctChange(leadsMtd, leadsPrevMtd)}
            foot={<>vs {leadsPrevMtd} same point last month</>}
          />
          <KpiTile
            href="/admin/leads?status=WON"
            label="Win rate · last 90 days"
            value={winRate === null ? "—" : `${winRate}%`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="bg-emerald-500/10 text-emerald-300"
            deltaPts={
              winRate !== null && prevWinRate !== null
                ? winRate - prevWinRate
                : null
            }
            foot={
              <>
                {f.WON} won of {decided} decided
                {prevWinRate !== null && <> · prior 90d {prevWinRate}%</>}
              </>
            }
          />
          <KpiTile
            href="/admin/accounts"
            label="Outstanding receivables"
            value={formatDollars(receivableCents)}
            icon={<Clock className="h-4 w-4" />}
            accent={
              overdueCount > 0
                ? "bg-rose-500/10 text-rose-300"
                : "bg-slate-500/10 text-slate-300"
            }
            foot={
              <>
                {receivableCount} unpaid invoice
                {receivableCount === 1 ? "" : "s"}
                {overdueCount > 0 ? (
                  <span className="font-semibold text-rose-300">
                    {" "}
                    · {overdueCount} overdue
                  </span>
                ) : (
                  " · none overdue"
                )}
              </>
            }
          />
        </div>
      </div>

      {/* ================= Trend · funnel · mix ================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Revenue vs break-even"
          icon={<BarChart3 className="h-4 w-4 text-slate-400" />}
          subtitle="Paid invoices by month · dashed line = monthly overhead"
        >
          <div className="relative h-40">
            {/* Break-even reference line */}
            <div
              className="absolute inset-x-0 z-10 border-t border-dashed border-amber-300/70"
              style={{ bottom: `${(overhead / trendMax) * 100}%` }}
            >
              <span className="absolute -top-4 left-0 text-[10px] font-medium text-amber-200/80">
                Break-even{" "}
                {formatDollars(overhead)}
              </span>
            </div>
            <div className="flex h-full items-end gap-2">
              {trend.map((t) => (
                <div
                  key={t.label}
                  className="group relative flex h-full flex-1 items-end"
                  title={`${t.label}: ${formatDollars(t.cents)}${t.current ? " (month to date)" : ""}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-[4px] transition-opacity group-hover:opacity-100",
                      t.cents >= overhead
                        ? "bg-emerald-400/80"
                        : "bg-blue-400/70",
                      t.current && "opacity-70",
                    )}
                    style={{
                      height: `${Math.max(1, (t.cents / trendMax) * 100)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {trend.map((t) => (
              <div
                key={t.label}
                className="flex-1 text-center text-[10.5px] leading-tight text-slate-500"
              >
                <span
                  className={cn(t.current && "font-semibold text-slate-300")}
                >
                  {t.label}
                </span>
                <span className="block tabular-nums text-slate-400">
                  {t.cents > 0 ? `$${Math.round(t.cents / 100000)}k` : "—"}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Sales funnel"
          icon={<Filter className="h-4 w-4 text-slate-400" />}
          subtitle={`Leads created in the last 90 days · ${total90} total`}
          action={
            <Link
              href="/admin/leads"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Inbox
            </Link>
          }
        >
          <div className="space-y-3">
            <FunnelBar
              label="Received"
              count={total90}
              max={total90}
              note="100%"
              cls="bg-blue-400/70"
            />
            <FunnelBar
              label="Quoted"
              count={reachedQuote}
              max={total90}
              note={pctOf(reachedQuote, total90)}
              cls="bg-yellow-300/70"
            />
            <FunnelBar
              label="Won"
              count={f.WON}
              max={total90}
              note={pctOf(f.WON, total90)}
              cls="bg-emerald-400/80"
            />
            <FunnelBar
              label="Lost"
              count={f.LOST}
              max={total90}
              note={pctOf(f.LOST, total90)}
              cls="bg-rose-400/70"
            />
          </div>
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11.5px] text-slate-500">
            {f.NEW} still awaiting a quote · quote-to-win{" "}
            <span className="font-semibold text-slate-300">
              {pctOf(f.WON, reachedQuote)}
            </span>
          </p>
        </Panel>

        <Panel
          title={`Lead mix · ${monthName}`}
          icon={<PieChart className="h-4 w-4 text-slate-400" />}
          subtitle={`${leadsMtd} leads this month by division and source`}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Division
          </p>
          <div className="mt-2 space-y-2">
            {divisionRows.map((r) => (
              <MixBar
                key={r.key}
                label={r.label}
                count={r.count}
                max={mixMax}
                cls={DIVISION_BAR[r.key]}
              />
            ))}
            {unassignedDivision > 0 && (
              <MixBar
                label="Unassigned"
                count={unassignedDivision}
                max={mixMax}
                cls="bg-slate-400/60"
              />
            )}
          </div>
          <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Source
          </p>
          <div className="mt-2 space-y-2">
            {sourceRows.length === 0 && (
              <p className="text-[12px] text-slate-500">
                No leads yet this month.
              </p>
            )}
            {sourceRows.map((r) => (
              <MixBar
                key={r.label}
                label={r.label}
                count={r.count}
                max={mixMax}
                cls="bg-slate-300/50"
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* ================= Winter routes ================= */}
      <Panel
        title={`Winter routes · ${seasonLabel} season`}
        icon={<Snowflake className="h-4 w-4 text-cyan-300" />}
        subtitle="Reservations by town and equipment · value = estimate midpoint · declined excluded"
        action={
          <Link
            href="/admin/winter-reservations"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            Reservations <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
        bodyClassName="p-0"
      >
        <div className="grid divide-y divide-white/[0.06] md:grid-cols-4 md:divide-x md:divide-y-0">
          {routes.map((r) => {
            const meta = WINTER_TOWN_META[r.town];
            const Icon =
              r.town === "PEMBROKE"
                ? Truck
                : r.town === "PETAWAWA"
                  ? Tractor
                  : Snowflake;
            const share = routesTotal
              ? Math.round((r.total / routesTotal) * 100)
              : 0;
            return (
              <div key={r.town} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-slate-100">
                    {meta.label}
                  </p>
                  <Badge cls={meta.cls}>
                    <Icon className="h-3 w-3" />
                    {r.town === "PETAWAWA"
                      ? "Tractors only"
                      : r.town === "PEMBROKE"
                        ? "Plow trucks"
                        : meta.equipment}
                  </Badge>
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                  {r.total}
                  <span className="ml-1.5 text-[12px] font-normal text-slate-500">
                    driveways · {share}% of route
                  </span>
                </p>
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="bg-emerald-400/80"
                    style={{
                      width: `${r.total ? (r.confirmed / r.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-amber-300/70"
                    style={{
                      width: `${r.total ? (r.pending / r.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                  <div>
                    <dt className="text-slate-500">Confirmed</dt>
                    <dd className="font-semibold tabular-nums text-emerald-300">
                      {r.confirmed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pending</dt>
                    <dd className="font-semibold tabular-nums text-amber-200">
                      {r.pending}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Est. value</dt>
                    <dd className="font-semibold tabular-nums text-slate-200">
                      {formatDollars(r.value)}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-slate-100">
                Commercial snow
              </p>
              <Badge cls="border-indigo-400/30 bg-indigo-500/10 text-indigo-200">
                <Building2 className="h-3 w-3" />
                Leads
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
              {commercialSnow.length}
              <span className="ml-1.5 text-[12px] font-normal text-slate-500">
                commercial snow leads
              </span>
            </p>
            <dl className="mt-[22px] grid grid-cols-3 gap-2 text-[11.5px]">
              <div>
                <dt className="text-slate-500">Open</dt>
                <dd className="font-semibold tabular-nums text-amber-200">
                  {commercialOpen}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Won</dt>
                <dd className="font-semibold tabular-nums text-emerald-300">
                  {commercialWon}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Quoted $</dt>
                <dd className="font-semibold tabular-nums text-slate-200">
                  {formatDollars(
                    commercialSnow.reduce(
                      (s, l) => s + (l.estimateCents ?? 0),
                      0,
                    ),
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Panel>

      {/* ================= Work queues ================= */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title={
            <>
              New leads, awaiting first call
              <CountPill n={newLeadCount} cls="bg-blue-500/15 text-blue-200" />
            </>
          }
          icon={<Inbox className="h-4 w-4 text-blue-300" />}
          subtitle={
            slaBreaches > 0 ? (
              <span className="text-rose-300">
                {slaBreaches} past the {FIRST_CALL_SLA_HOURS}h first-call target
                · oldest first
              </span>
            ) : (
              `Oldest first · target: call within ${FIRST_CALL_SLA_HOURS}h`
            )
          }
          action={
            <Link
              href="/admin/leads?status=NEW"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {freshLeads.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-500">
              Inbox zero. New quote requests land here the moment the form is
              submitted.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {freshLeads.map((l) => {
                const slugs = Array.isArray(l.serviceSlugs)
                  ? (l.serviceSlugs as string[])
                  : [];
                const breach =
                  hoursSince(l.createdAt, now) > FIRST_CALL_SLA_HOURS;
                return (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        breach ? "bg-rose-400" : "bg-blue-400",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/leads?q=${encodeURIComponent(l.email || l.name)}`}
                        className="block truncate text-[13px] font-medium text-slate-100 hover:underline"
                      >
                        {l.name}
                      </Link>
                      <p className="truncate text-[11.5px] text-slate-500">
                        {slugs.length > 0
                          ? slugs
                              .map((s) => getService(s)?.name ?? prettySlug(s))
                              .join(", ")
                          : "General inquiry"}
                        {l.division ? ` · ${DIVISION_LABEL[l.division]}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[12px] tabular-nums",
                        breach
                          ? "font-semibold text-rose-300"
                          : "text-slate-400",
                      )}
                      title={l.createdAt.toLocaleString("en-CA")}
                    >
                      {breach && (
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                      )}
                      {timeAgo(l.createdAt, now)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={`tel:${l.phone}`}
                        title={`Call ${l.name}`}
                        className="grid h-7 w-7 place-items-center rounded-sm border border-white/[0.08] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`mailto:${l.email}`}
                        title={`Email ${l.name}`}
                        className="grid h-7 w-7 place-items-center rounded-sm border border-white/[0.08] text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={
            <>
              Open requests
              <CountPill
                n={openRequestCount}
                cls="bg-amber-500/15 text-amber-200"
              />
            </>
          }
          icon={<MessageCircle className="h-4 w-4 text-amber-300" />}
          subtitle="Winter reservations, support, club requests and job applications"
          bodyClassName="p-0"
        >
          {requestRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-500">
              All caught up. Nothing is waiting on a reply.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {requestRows.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <Badge cls={r.cls} className="w-16 justify-center">
                    {r.badge}
                  </Badge>
                  <Link href={r.href} className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-100 hover:underline">
                      {r.title}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-500">
                      {r.detail}
                    </p>
                  </Link>
                  <span
                    className="shrink-0 text-[12px] tabular-nums text-slate-400"
                    title={r.createdAt.toLocaleString("en-CA")}
                  >
                    {timeAgo(r.createdAt, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ================= Context ================= */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-2"
          title="Website traffic · 14 days"
          icon={<BarChart3 className="h-4 w-4 text-slate-400" />}
          subtitle={`${uniques7d} visitors · ${views7d} page views in the last 7 days`}
          action={
            <Link
              href="/admin/traffic"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Full report
            </Link>
          }
        >
          <div className="flex h-20 items-end gap-1">
            {chart.map((c) => (
              <div
                key={c.label}
                className="group relative flex h-full flex-1 items-end"
                title={`${c.label}: ${c.views} views`}
              >
                <div
                  className="w-full rounded-t-[3px] bg-primary/50 transition-colors group-hover:bg-primary"
                  style={{
                    height: `${Math.max(3, (c.views / maxViews) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
            <span>{chart[0]?.label}</span>
            <span>
              Peak{" "}
              {maxViews === 1 && chart.every((c) => c.views === 0)
                ? 0
                : maxViews}
              /day
            </span>
            <span>{chart[chart.length - 1]?.label}</span>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-3"
          title="Latest activity"
          icon={<Bell className="h-4 w-4 text-slate-400" />}
          action={
            <Link
              href="/admin/notifications"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Full feed
            </Link>
          }
          bodyClassName="p-0"
        >
          {latestNotifs.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-slate-500">
              Nothing yet. Every quote request, reservation, sign-up, referral,
              and support ticket lands here the moment it happens.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {latestNotifs.map((n) => {
                const meta = kindMeta(n.kind);
                return (
                  <li key={n.id} className="flex items-center gap-3 px-4 py-2">
                    <Badge
                      cls={meta.cls}
                      className="hidden w-28 justify-center sm:inline-flex"
                    >
                      {meta.label}
                    </Badge>
                    <Link
                      href={n.href ?? meta.href}
                      className="min-w-0 flex-1 truncate text-[13px] text-slate-200 hover:underline"
                    >
                      {n.title}
                    </Link>
                    <span className="shrink-0 text-[12px] tabular-nums text-slate-500">
                      {timeAgo(n.createdAt, now)}
                    </span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        n.readAt ? "bg-transparent" : "bg-primary",
                      )}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function pctOf(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
}

function Delta({
  value,
  suffix = "%",
}: {
  value: number | null;
  suffix?: string;
}) {
  if (value === null)
    return (
      <span className="rounded bg-white/[0.05] px-1.5 py-px text-[11px] font-medium text-slate-400">
        New
      </span>
    );
  const up = value > 0;
  const flat = value === 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-px text-[11px] font-semibold tabular-nums",
        flat
          ? "bg-white/[0.05] text-slate-400"
          : up
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-rose-500/10 text-rose-300",
      )}
    >
      {!flat && <Icon className="h-3 w-3" />}
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function KpiTile({
  href,
  label,
  value,
  icon,
  accent,
  foot,
  delta,
  deltaPts,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  foot: React.ReactNode;
  delta?: number | null;
  deltaPts?: number | null;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-white/[0.07] bg-[#0E1322] p-4 transition-colors hover:border-white/[0.14] hover:bg-[#10162A]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {label}
        </p>
        <span
          className={cn("grid h-7 w-7 place-items-center rounded-sm", accent)}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-white">
          {value}
        </p>
        {delta !== undefined && <Delta value={delta} />}
        {deltaPts !== undefined && deltaPts !== null && (
          <Delta value={deltaPts} suffix=" pts" />
        )}
      </div>
      <p className="mt-auto pt-3 text-[11.5px] text-slate-500">{foot}</p>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="min-w-0 px-2.5 py-2.5 sm:px-3">
      <dt className="truncate text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[15px] font-semibold tabular-nums text-slate-100">
        {value}
      </dd>
      <dd className="truncate text-[10.5px] text-slate-500">{sub}</dd>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  max,
  note,
  cls,
}: {
  label: string;
  count: number;
  max: number;
  note: string;
  cls: string;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_72px] items-center gap-3 text-[12px]">
      <span className="text-slate-400">{label}</span>
      <div className="h-5 overflow-hidden rounded-[3px] bg-white/[0.04]">
        <div
          className={cn("h-full rounded-[3px]", cls)}
          style={{
            width: `${max ? Math.max(count ? 2 : 0, (count / max) * 100) : 0}%`,
          }}
        />
      </div>
      <span className="text-right tabular-nums">
        <span className="font-semibold text-slate-100">{count}</span>
        <span className="ml-1.5 text-slate-500">{note}</span>
      </span>
    </div>
  );
}

function MixBar({
  label,
  count,
  max,
  cls,
}: {
  label: string;
  count: number;
  max: number;
  cls: string;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr_28px] items-center gap-3 text-[12px]">
      <span className="truncate text-slate-400">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={cn("h-full rounded-full", cls)}
          style={{ width: `${(count / max) * 100}%` }}
        />
      </div>
      <span className="text-right font-semibold tabular-nums text-slate-200">
        {count}
      </span>
    </div>
  );
}

function CountPill({ n, cls }: { n: number; cls: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "grid h-[18px] min-w-[18px] place-items-center rounded px-1 text-[10.5px] font-bold tabular-nums",
        cls,
      )}
    >
      {n}
    </span>
  );
}

/** Tiny green "alerts on" chip next to the page title when all is wired. */
function AlertsChip() {
  const { email, sms, usingDefaultSender } = notificationsConfigured();
  if (!(email && sms && !usingDefaultSender)) return null;
  return (
    <Badge cls="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
      <Bell className="h-3 w-3" />
      Alerts on
    </Badge>
  );
}

/**
 * Notification health. Owner alerts (email + SMS) fan out from
 * lib/notify.ts, which self-disables when its provider keys are missing,
 * historically silently. When something is off this renders a slim amber
 * bar; the full fix-it guidance and the test button live in the "Fix"
 * disclosure so it never dominates the dashboard. Fully configured: the
 * green "Alerts on" chip in the header is the only signal.
 */
function NotifyStatusBar() {
  const { email, sms, recipients, usingDefaultSender } =
    notificationsConfigured();

  if (email && sms && !usingDefaultSender) return null;

  return (
    <details className="group rounded-sm border border-amber-500/25 bg-amber-500/[0.06] text-[13px]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-amber-200 [&::-webkit-details-marker]:hidden">
        <BellOff className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          {!email
            ? "Email alerts are off, nothing is being sent"
            : usingDefaultSender
              ? "Email alerts will not reach you yet"
              : "Text alerts are off"}
          <span className="hidden text-amber-200/60 sm:inline">
            {" "}
            · everything is still saved to this dashboard
          </span>
        </span>
        <span className="shrink-0 rounded-sm border border-amber-400/30 px-2 py-0.5 text-[12px] font-semibold text-amber-100 group-open:hidden">
          Fix
        </span>
        <span className="hidden shrink-0 rounded-sm border border-amber-400/30 px-2 py-0.5 text-[12px] font-semibold text-amber-100 group-open:inline">
          Hide
        </span>
      </summary>
      <div className="border-t border-amber-500/20 px-3 pb-3 pt-2">
        <ul className="space-y-1.5 text-amber-100/85">
          {!email && (
            <li>
              <strong>Email:</strong> set <code>RESEND_API_KEY</code> to start
              receiving quote requests, winter reservations, applications,
              support tickets, new members, and giveaway entries at{" "}
              {recipients.join(", ")}. Until then they are saved here only.
            </li>
          )}
          {email && usingDefaultSender && (
            <li>
              <strong>Sender:</strong> <code>LEAD_FROM_EMAIL</code> is not set,
              so mail goes out as <code>onboarding@resend.dev</code>. That is
              Resend&apos;s shared sandbox sender and it only delivers to the
              address that owns the Resend account, so mail to{" "}
              {recipients.join(", ")} is rejected. Verify your own domain in
              Resend, then set <code>LEAD_FROM_EMAIL</code> to something like{" "}
              <code>PVS Website &lt;alerts@prestigeviewservices.ca&gt;</code>.
            </li>
          )}
          {!sms && (
            <li>
              <strong>Text:</strong> set <code>TWILIO_ACCOUNT_SID</code>,{" "}
              <code>TWILIO_AUTH_TOKEN</code>, and{" "}
              <code>TWILIO_FROM_NUMBER</code>, or set{" "}
              <code>OWNER_SMS_GATEWAY</code> to use your carrier&apos;s
              email-to-text address (for 613-762-6009: Telus is{" "}
              <code>6137626009@msg.telus.com</code>, Bell is{" "}
              <code>6137626009@txt.bell.ca</code>, Rogers is{" "}
              <code>6137626009@pcs.rogers.com</code>).
            </li>
          )}
        </ul>
        <p className="mt-2 text-[12px] text-amber-100/60">
          Add these in Vercel under Project Settings, Environment Variables,
          then redeploy. Nothing submitted through the website is ever lost, it
          is always written to the dashboard first.
        </p>
        <NotifyTestButton />
      </div>
    </details>
  );
}
