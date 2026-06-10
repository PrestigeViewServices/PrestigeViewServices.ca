import Link from "next/link";
import { Briefcase, LifeBuoy, Users, ArrowRight, Mail, Snowflake } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { getRole as getCareerRole } from "@/lib/content/careers";

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

  // Open applications by status + totals + recent activity
  const [byStatus, userCount, openSupport, openWinter, recentApps, recentSupport] =
    await Promise.all([
      db.application.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.user.count(),
      db.supportRequest.count({ where: { status: "NEW" } }),
      db.winterReservation.count({ where: { status: "NEW" } }),
      db.application.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          roleSlug: true,
          status: true,
          createdAt: true,
        },
      }),
      db.supportRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const statusCounts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) statusCounts[s.value] = 0;
  for (const row of byStatus) {
    statusCounts[row.status] = row._count._all;
  }
  const openApplications = statusCounts.NEW + statusCounts.CONTACTED;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-muted-foreground">
          Welcome back{session ? `, ${session.role.replace("_", " ")}` : ""}.
        </p>
      </header>

      {/* Top-line counts */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open applications"
          value={openApplications}
          icon={<Briefcase className="h-5 w-5" />}
          href="/admin/applications?status=NEW"
        />
        <StatCard
          label="New winter reservations"
          value={openWinter}
          icon={<Snowflake className="h-5 w-5" />}
          href="/admin/winter-reservations?status=NEW"
        />
        <StatCard
          label="Open support requests"
          value={openSupport}
          icon={<LifeBuoy className="h-5 w-5" />}
          href="/admin/support"
        />
        <StatCard
          label="Total users"
          value={userCount}
          icon={<Users className="h-5 w-5" />}
          href="/admin/users"
        />
      </div>

      {/* Applications by status */}
      <section className="surface-card p-6">
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
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {APPLICATION_STATUSES.map((s) => (
            <Link
              key={s.value}
              href={`/admin/applications?status=${s.value}`}
              className={`rounded-xl border p-4 transition-colors hover:bg-white/5 ${STATUS_COLOR[s.value]}`}
            >
              <p className="text-[11px] uppercase tracking-wider opacity-90">
                {s.label}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {statusCounts[s.value]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid gap-5 lg:grid-cols-2">
        <RecentList
          title="Recent applications"
          href="/admin/applications"
          empty="No applications yet."
          items={recentApps.map((a) => ({
            id: a.id,
            primary: a.name,
            secondary: getCareerRole(a.roleSlug)?.title ?? a.roleSlug,
            meta: a.email,
            badge: APPLICATION_STATUSES.find((s) => s.value === a.status)?.label ?? a.status,
            badgeColor: STATUS_COLOR[a.status],
            createdAt: a.createdAt,
          }))}
        />
        <RecentList
          title="Recent support requests"
          href="/admin/support"
          empty="No support requests yet."
          items={recentSupport.map((r) => ({
            id: r.id,
            primary: r.name,
            secondary: r.type,
            meta: r.status,
            createdAt: r.createdAt,
          }))}
        />
      </section>

      {/* Phase scope reminder */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Phase 1 scope</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside marker:text-primary">
          <li>Applications inbound — done</li>
          <li>Role-gated dashboard + Users management — done</li>
          <li>
            Loyalty / Subscriptions — <em>Phase 2 placeholder (Stripe TBD)</em>
          </li>
          <li>
            Site Modifications — <em>Phase 2 placeholder (headless CMS TBD)</em>
          </li>
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card surface-card-hover p-6 block"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

type RecentItem = {
  id: string;
  primary: string;
  secondary: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  createdAt: Date;
};

function RecentList({
  title,
  href,
  items,
  empty,
}: {
  title: string;
  href: string;
  items: RecentItem[];
  empty: string;
}) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Link
          href={href}
          className="text-sm font-semibold text-primary hover:text-blue-300 inline-flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-5 divide-y divide-surface-border">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.primary}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {it.secondary}
                  {it.meta ? (
                    <span className="inline-flex items-center gap-1 ml-1">
                      <Mail className="h-3 w-3 inline opacity-60" />
                      <span className="truncate">{it.meta}</span>
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="text-right shrink-0">
                {it.badge && (
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${it.badgeColor ?? "border-surface-border text-muted-foreground"}`}
                  >
                    {it.badge}
                  </span>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {it.createdAt.toLocaleDateString("en-CA")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
