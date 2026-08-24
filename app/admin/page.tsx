import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BellOff,
  Briefcase,
  Eye,
  Gift,
  Inbox,
  LifeBuoy,
  Snowflake,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notificationsConfigured } from "@/lib/notify";
import { kindMeta } from "@/lib/admin-notifications";
import { NotConfigured } from "@/components/admin/not-configured";
import { NotifyTestButton } from "@/components/admin/notify-test-button";
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
    referralsInFlight,
    referralsReady,
    unreadNotifs,
    latestNotifs,
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
    db.referral.count({ where: { status: { in: ["INVITED", "BOOKED"] } } }),
    db.referral.count({ where: { status: "COMPLETED" } }),
    db.adminNotification.count({ where: { readAt: null } }),
    db.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
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
      label: "Referrals in flight",
      value: referralsInFlight,
      sub: `${referralsReady} ready to award`,
      icon: Gift,
      href: "/admin/club/referrals",
      accent: "text-pink-300 bg-pink-500/15",
    },
    {
      label: "Unread notifications",
      value: unreadNotifs,
      sub: "everything the site captured",
      icon: Bell,
      href: "/admin/notifications",
      accent: "text-rose-300 bg-rose-500/15",
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

      <NotifyStatusBanner />

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

      {/* ---- Latest activity feed ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Latest activity</h2>
          </div>
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Full feed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-surface-border">
          {latestNotifs.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">
              Nothing yet. Every quote request, reservation, sign-up, referral,
              and support ticket will land here the moment it happens.
            </li>
          )}
          {latestNotifs.map((n) => {
            const meta = kindMeta(n.kind);
            return (
              <li key={n.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}
                >
                  {meta.label}
                </span>
                <Link
                  href={n.href ?? meta.href}
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {n.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {n.createdAt.toLocaleString("en-CA", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {!n.readAt && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </li>
            );
          })}
        </ul>
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

/**
 * Notification health. Owner alerts (email + SMS) fan out from
 * lib/notify.ts, which self-disables when its provider keys are missing —
 * historically that failed silently, so every intake alert was dropped with
 * no visible sign. This banner makes the dead channel obvious.
 */
function NotifyStatusBanner() {
  const { email, sms, recipients, usingDefaultSender } =
    notificationsConfigured();

  // Everything wired up: collapse to a quiet confirmation that still lets
  // the owner prove delivery end to end.
  if (email && sms && !usingDefaultSender) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
          Alerts are on for {recipients.join(", ")}
        </p>
        <p className="mt-1 text-xs text-emerald-100/70">
          Quote requests, winter reservations, applications, support tickets,
          new members, and giveaway entries all send to email and text.
        </p>
        <NotifyTestButton />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
        <BellOff className="h-4 w-4 shrink-0" aria-hidden />
        {!email
          ? "Email alerts are off, nothing is being sent"
          : usingDefaultSender
            ? "Email alerts will not reach you yet"
            : "Text alerts are off"}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-amber-100/85">
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
            <strong>Sender:</strong> <code>LEAD_FROM_EMAIL</code> is not set, so
            mail goes out as <code>onboarding@resend.dev</code>. That is
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
            email-to-text address.
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs text-amber-100/60">
        Add these in Vercel under Project Settings, Environment Variables,
        then redeploy. Nothing submitted through the website is ever lost, it
        is always written to the dashboard first.
      </p>
      <NotifyTestButton />
    </div>
  );
}
