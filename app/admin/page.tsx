import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Eye,
  Inbox,
  LifeBuoy,
  Snowflake,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  LEAD_STATUS_META,
  statusColor,
  statusLabel,
} from "@/lib/dashboard";
import {
  DRIVEWAY_SIZE_LABELS,
  getDrivewayTier,
} from "@/lib/content/winter-packages";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Command Center — the master view of everything the website generates:
 * quote requests, winter reservations, applications, support, and site
 * traffic. Every tile links to the page where the work happens.
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

  const now = new Date();
  const since7d = new Date(now.getTime() - 7 * DAY_MS);
  const since14d = new Date(now.getTime() - 14 * DAY_MS);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    newLeads,
    leads7d,
    latestLeads,
    pendingReservations,
    latestReservations,
    newApplications,
    openSupport,
    views7d,
    viewsToday,
    uniques7d,
    daily,
  ] = await Promise.all([
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.count({ where: { createdAt: { gte: since7d } } }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.winterReservation.count({ where: { status: { in: ["NEW", "CONTACTED"] } } }),
    db.winterReservation.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.application.count({ where: { status: "NEW" } }),
    db.supportRequest.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    db.pageView.count({ where: { createdAt: { gte: since7d } } }),
    db.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    db.pageView
      .groupBy({ by: ["visitorId"], where: { createdAt: { gte: since7d } } })
      .then((rows) => rows.length),
    db.$queryRaw<Array<{ day: Date; views: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
      FROM "PageView"
      WHERE "createdAt" >= ${since14d}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  // Fill the last 14 days so quiet days show as zero, not gaps.
  const chart: { label: string; views: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    const row = daily.find(
      (r) => new Date(r.day).toDateString() === d.toDateString()
    );
    chart.push({
      label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      views: row ? Number(row.views) : 0,
    });
  }
  const maxViews = Math.max(1, ...chart.map((c) => c.views));

  const stats = [
    {
      label: "New quote requests",
      value: newLeads,
      sub: `${leads7d} received this week`,
      icon: Inbox,
      href: "/admin/leads",
      accent: "text-blue-300 bg-blue-500/15",
    },
    {
      label: "Winter reservations",
      value: pendingReservations,
      sub: "awaiting follow-up",
      icon: Snowflake,
      href: "/admin/winter-reservations",
      accent: "text-cyan-200 bg-cyan-500/15",
    },
    {
      label: "New applications",
      value: newApplications,
      sub: "to review",
      icon: Briefcase,
      href: "/admin/applications",
      accent: "text-violet-300 bg-violet-500/15",
    },
    {
      label: "Open support",
      value: openSupport,
      sub: "new + in progress",
      icon: LifeBuoy,
      href: "/admin/support",
      accent: "text-amber-200 bg-amber-500/15",
    },
    {
      label: "Visitors (7 days)",
      value: uniques7d,
      sub: `${viewsToday} page views today`,
      icon: Users,
      href: "/admin/traffic",
      accent: "text-emerald-300 bg-emerald-500/15",
    },
    {
      label: "Page views (7 days)",
      value: views7d,
      sub: "across the public site",
      icon: Eye,
      href: "/admin/traffic",
      accent: "text-sky-300 bg-sky-500/15",
    },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="mt-1.5 text-muted-foreground">
          {now.toLocaleDateString("en-CA", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          · everything the website is generating, in one place.
        </p>
      </header>

      {/* ---- Stat tiles ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="surface-card surface-card-hover group p-5"
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl ${s.accent}`}
              >
                <s.icon className="h-4 w-4" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">
              {s.value}
            </p>
            <p className="mt-0.5 text-sm font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* ---- Traffic sparkline ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Traffic, last 14 days</h2>
          </div>
          <Link
            href="/admin/traffic"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Full report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {chart.map((c) => (
            <div
              key={c.label}
              className="group relative flex-1"
              title={`${c.label}: ${c.views} views`}
            >
              <div
                className="w-full rounded-t-md bg-primary/40 transition-colors group-hover:bg-primary/70"
                style={{
                  height: `${Math.max(4, (c.views / maxViews) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{chart[0]?.label}</span>
          <span>{chart[chart.length - 1]?.label}</span>
        </div>
      </section>

      {/* ---- Latest inbound ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Latest quote requests</h2>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              All requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-surface-border">
            {latestLeads.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">
                No quote requests yet, they&apos;ll appear here the moment the
                website form is submitted.
              </li>
            )}
            {latestLeads.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {Array.isArray(l.serviceSlugs)
                      ? (l.serviceSlugs as string[]).join(", ")
                      : "General inquiry"}{" "}
                    · {l.createdAt.toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusColor(LEAD_STATUS_META, l.status)}`}
                >
                  {statusLabel(LEAD_STATUS_META, l.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Latest winter reservations</h2>
            <Link
              href="/admin/winter-reservations"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              All reservations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-surface-border">
            {latestReservations.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">
                No reservations yet, snow pass requests from /winter-packages
                land here.
              </li>
            )}
            {latestReservations.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getDrivewayTier(r.drivewayTier).name} ·{" "}
                    {DRIVEWAY_SIZE_LABELS[r.drivewaySize]} · {r.city}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-surface-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
