import Link from "next/link";
import {
  Briefcase,
  LifeBuoy,
  ArrowRight,
  Mail,
  Repeat,
  Banknote,
  CalendarCheck,
  AlertTriangle,
  Route as RouteIcon,
  Filter,
  KanbanSquare,
  Users,
} from "lucide-react";
import type { ContractFrequency } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { getRole as getCareerRole } from "@/lib/content/careers";
import { formatCents, formatCentsCompact } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const APPLICATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
] as const;

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  CONTACTED: "bg-yellow-500/15 text-yellow-200 border-yellow-500/25",
  HIRED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
};

/** Normalize a recurring contract's price to a monthly figure (cents). */
function monthlyCents(c: { frequency: ContractFrequency; priceCents: number }) {
  switch (c.frequency) {
    case "WEEKLY":
      return (c.priceCents * 52) / 12;
    case "BIWEEKLY":
      return (c.priceCents * 26) / 12;
    case "MONTHLY":
      return c.priceCents;
    case "SEASONAL":
      return c.priceCents / 6; // ~6-month season
    case "PER_STORM":
      return c.priceCents * 3; // rough: ~3 storms / winter month
  }
}

export default async function AdminOverviewPage() {
  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Set DATABASE_URL to a Postgres instance (Neon or Supabase) and run `npm run db:migrate` to enable the dashboard views. SETUP.md walks through it step by step."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
        docHref="https://neon.tech/docs/get-started-with-neon/connect-neon"
      />
    );
  }

  const db = getDb()!;
  const session = await getSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    activeContracts,
    cashThisMonth,
    arOverdue,
    jobsScheduled,
    jobsCompletedMonth,
    jobsToday,
    activeCrews,
    leadsTotal,
    leadsQuotedPlus,
    leadsWon,
    // existing hiring/support surfaces (kept)
    byStatus,
    userCount,
    openSupport,
    recentApps,
  ] = await Promise.all([
    db.recurringContract.findMany({
      where: { status: "ACTIVE" },
      select: { frequency: true, priceCents: true },
    }),
    db.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { amountCents: true },
    }),
    db.invoice.aggregate({
      where: { status: "OVERDUE" },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    db.job.count({ where: { status: "SCHEDULED" } }),
    db.job.count({
      where: { completedAt: { gte: startOfMonth }, status: { in: ["COMPLETE", "INVOICED"] } },
    }),
    db.job.count({
      where: { scheduledFor: { gte: startOfToday, lt: endOfToday } },
    }),
    db.crew.count({ where: { active: true } }),
    db.lead.count(),
    db.lead.count({ where: { status: { in: ["QUOTED", "WON"] } } }),
    db.lead.count({ where: { status: "WON" } }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.user.count(),
    db.supportRequest.count({ where: { status: "NEW" } }),
    db.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, roleSlug: true, status: true, createdAt: true },
    }),
  ]);

  const mrr = Math.round(activeContracts.reduce((sum, c) => sum + monthlyCents(c), 0));
  const arCount = arOverdue._count._all;
  const density = activeCrews > 0 ? (jobsToday / activeCrews).toFixed(1) : "0";

  const statusCounts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) statusCounts[s.value] = 0;
  for (const row of byStatus) statusCounts[row.status] = row._count._all;
  const openApplications = statusCounts.NEW + statusCounts.CONTACTED;

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow text-primary">Command Center</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-muted-foreground">
          Live operations, welcome back
          {session ? `, ${session.role.replace("_", " ")}` : ""}.
        </p>
      </header>

      {/* Command Center tiles */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <CommandTile
          icon={<Repeat className="h-5 w-5" />}
          label="Monthly recurring revenue"
          value={formatCents(mrr)}
          sub={`${activeContracts.length} active contracts`}
          href="/admin/pipeline"
        />
        <CommandTile
          icon={<Banknote className="h-5 w-5" />}
          label="Cash booked this month"
          value={formatCents(cashThisMonth._sum.amountCents)}
          sub="Paid invoices, month-to-date"
          accent="emerald"
        />
        <CommandTile
          icon={<AlertTriangle className="h-5 w-5" />}
          label="AR outstanding"
          value={formatCents(arOverdue._sum.amountCents)}
          sub={`${arCount} overdue invoice${arCount === 1 ? "" : "s"}`}
          accent={arCount > 0 ? "rose" : undefined}
        />
        <CommandTile
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Jobs scheduled / completed"
          value={`${jobsScheduled} / ${jobsCompletedMonth}`}
          sub="Upcoming vs. completed this month"
          href="/admin/pipeline"
        />
        <CommandTile
          icon={<RouteIcon className="h-5 w-5" />}
          label="Route density (today)"
          value={`${density} jobs/crew`}
          sub={`${jobsToday} jobs · ${activeCrews} crews`}
          href="/admin/dispatch"
        />
        <CommandTile
          icon={<Filter className="h-5 w-5" />}
          label="Conversion funnel"
          value={`${leadsTotal} → ${leadsQuotedPlus} → ${leadsWon}`}
          sub="Leads → quoted → won"
          href="/admin/pipeline"
        />
      </section>

      {/* Quick nav into the boards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <NavCard
          href="/admin/pipeline"
          icon={<KanbanSquare className="h-5 w-5" />}
          title="Job Pipeline"
          body="Move work from lead to invoiced."
        />
        <NavCard
          href="/admin/accounts"
          icon={<Users className="h-5 w-5" />}
          title="Accounts"
          body="LTV, contacts, winter-only upsell."
        />
        <NavCard
          href="/admin/dispatch"
          icon={<RouteIcon className="h-5 w-5" />}
          title="Crew Dispatch"
          body="Assign crews to today's jobs."
        />
      </section>

      {/* Existing hiring + support surfaces (unchanged data) */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Applications by status</h2>
            <Link
              href="/admin/applications"
              className="text-sm font-semibold text-primary hover:text-blue-300 inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {APPLICATION_STATUSES.map((s) => (
              <Link
                key={s.value}
                href={`/admin/applications?status=${s.value}`}
                className={`rounded-xl border p-4 transition-colors hover:bg-white/5 ${STATUS_COLOR[s.value]}`}
              >
                <p className="text-[11px] uppercase tracking-wider opacity-90">
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-bold">{statusCounts[s.value]}</p>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {openApplications} open · {userCount} total users ·{" "}
            {openSupport} new support request{openSupport === 1 ? "" : "s"}
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent applications</h3>
            <Link
              href="/admin/applications"
              className="text-sm font-semibold text-primary hover:text-blue-300 inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="mt-5 divide-y divide-surface-border">
              {recentApps.map((a) => (
                <li key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
                      {getCareerRole(a.roleSlug)?.title ?? a.roleSlug}
                      <Mail className="h-3 w-3 inline opacity-60 ml-1" />
                      <span className="truncate">{a.email}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLOR[a.status]}`}
                  >
                    {APPLICATION_STATUSES.find((s) => s.value === a.status)?.label ??
                      a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function CommandTile({
  icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: "emerald" | "rose";
}) {
  const accentCls =
    accent === "emerald"
      ? "bg-emerald-500/15 text-emerald-300"
      : accent === "rose"
        ? "bg-rose-500/15 text-rose-300"
        : "bg-primary/15 text-primary";
  const inner = (
    <div className="surface-card surface-card-hover p-6 h-full">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${accentCls}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function NavCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="surface-card surface-card-hover p-5 flex items-start gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}
