import Link from "next/link";
import {
  BarChart3,
  Eye,
  Globe,
  Link2,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type Range = "7" | "30" | "90";
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

/**
 * Website Traffic — first-party analytics read straight from our own
 * PageView table. No external analytics account, no scripts to break.
 */
export default async function TrafficPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const searchParams = await props.searchParams;
  await requireRole(["ultimate_admin", "super_admin", "admin", "manager"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Traffic data is stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const range: Range = RANGES.some((r) => r.value === searchParams.range)
    ? (searchParams.range as Range)
    : "30";
  const days = Number(range);
  const since = new Date(Date.now() - days * DAY_MS);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [views, uniques, daily, topPages, topReferrers, devices, countries] =
    await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: since } } }),
      db.pageView
        .groupBy({ by: ["visitorId"], where: { createdAt: { gte: since } } })
        .then((rows) => rows.length),
      db.$queryRaw<Array<{ day: Date; views: bigint; visitors: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*) AS views,
               COUNT(DISTINCT "visitorId") AS visitors
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      `,
      db.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 12,
      }),
      db.pageView.groupBy({
        by: ["referrer"],
        where: { createdAt: { gte: since }, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: since } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      db.pageView.groupBy({
        by: ["country"],
        where: { createdAt: { gte: since }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 8,
      }),
    ]);

  // Fill every day in the range so the chart has no gaps.
  const chart: { label: string; views: number; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    const row = daily.find(
      (r) => new Date(r.day).toDateString() === d.toDateString()
    );
    chart.push({
      label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      views: row ? Number(row.views) : 0,
      visitors: row ? Number(row.visitors) : 0,
    });
  }
  const maxViews = Math.max(1, ...chart.map((c) => c.views));
  const maxPage = Math.max(1, ...topPages.map((p) => p._count.path));
  const maxRef = Math.max(1, ...topReferrers.map((r) => r._count.referrer));
  const deviceTotal = Math.max(
    1,
    devices.reduce((sum, d) => sum + d._count.device, 0)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Traffic</h1>
          <p className="mt-1.5 text-muted-foreground">
            First-party analytics, stored in your own database. No outside
            services involved.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/traffic?range=${r.value}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-surface-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ---- Totals ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">Unique visitors</span>
          </div>
          <p className="mt-2 text-4xl font-bold tabular-nums">{uniques}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            last {days} days · daily-rotating anonymous IDs
          </p>
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm">Page views</span>
          </div>
          <p className="mt-2 text-4xl font-bold tabular-nums">{views}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            last {days} days · admin pages excluded
          </p>
        </div>
      </div>

      {/* ---- Daily chart ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Views per day</h2>
        </div>
        <div className="mt-5 flex h-40 items-end gap-[3px]">
          {chart.map((c) => (
            <div
              key={c.label}
              className="group relative flex-1"
              title={`${c.label}: ${c.views} views · ${c.visitors} visitors`}
            >
              <div
                className="w-full rounded-t-sm bg-primary/40 transition-colors group-hover:bg-primary/70"
                style={{ height: `${Math.max(3, (c.views / maxViews) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{chart[0]?.label}</span>
          <span>{chart[chart.length - 1]?.label}</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Top pages ---- */}
        <section className="surface-card p-6">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Top pages</h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {topPages.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">
                No traffic recorded yet. Views start counting as soon as
                someone browses the public site.
              </li>
            )}
            {topPages.map((p) => (
              <li key={p.path}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{p.path}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {p._count.path}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary/50"
                    style={{ width: `${(p._count.path / maxPage) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Referrers ---- */}
        <section className="surface-card p-6">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Where visitors come from</h2>
          </div>
          <ul className="mt-4 space-y-2.5">
            {topReferrers.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">
                No external referrers yet, direct visits don&apos;t list a
                source.
              </li>
            )}
            {topReferrers.map((r) => (
              <li key={r.referrer ?? "direct"}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{r.referrer}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {r._count.referrer}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-emerald-400/50"
                    style={{
                      width: `${(r._count.referrer / maxRef) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* ---- Devices ---- */}
          <div className="mt-8 flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Devices</h2>
          </div>
          <div className="mt-3 space-y-2">
            {devices.map((d) => (
              <div key={d.device ?? "unknown"} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="capitalize">{d.device ?? "unknown"}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round((d._count.device / deviceTotal) * 100)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-sky-400/50"
                    style={{
                      width: `${(d._count.device / deviceTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ---- Countries ---- */}
          {countries.length > 0 && (
            <>
              <div className="mt-8 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Countries</h2>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {countries.map((c) => (
                  <li
                    key={c.country ?? "??"}
                    className="rounded-full border border-surface-border bg-surface/60 px-3 py-1"
                  >
                    {c.country}{" "}
                    <span className="tabular-nums text-muted-foreground">
                      {c._count.country}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <p className="text-xs text-muted-foreground">
        Privacy note: no IP addresses or personal identifiers are stored.
        Visitor counts use an anonymous hash that rotates daily.
      </p>
    </div>
  );
}
