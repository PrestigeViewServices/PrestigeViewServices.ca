import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Inbox,
  Medal,
  Megaphone,
  Snowflake,
  TrendingUp,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  DRIVEWAY_TIER_DEFS,
  getDrivewayTier,
} from "@/lib/content/winter-packages";
import { getSiteContent } from "@/lib/site-content";
import {
  promoEndsLabel,
  promoIsLive,
  promoPercentLabel,
} from "@/lib/content/winter-campaign";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Winter Dashboard — the growth-season scoreboard: reservations by tier,
 * the daily intake curve, conversion rate, discount interest, and which
 * pages are producing the leads.
 */
export default async function WinterDashboardPage() {
  await requireRole(["ultimate_admin", "super_admin", "admin", "manager"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="The winter dashboard reads reservations and leads from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const now = new Date();
  const since14d = new Date(now.getTime() - 14 * DAY_MS);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    { winterPromo },
    byTier,
    byStatus,
    veteranCount,
    saltingCount,
    walkwayCount,
    snowLeads7d,
    daily,
  ] = await Promise.all([
    getSiteContent(db),
    db.winterReservation.groupBy({
      by: ["drivewayTier", "status"],
      _count: { _all: true },
    }),
    db.winterReservation.groupBy({ by: ["status"], _count: { _all: true } }),
    db.winterReservation.count({ where: { veteranDiscount: true } }),
    db.winterReservation.count({ where: { saltingAddOn: true } }),
    db.winterReservation.count({ where: { shovelingTier: { not: "NONE" } } }),
    db.lead.count({
      where: {
        division: "SNOWLAND",
        createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) },
      },
    }),
    db.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS total
      FROM "WinterReservation"
      WHERE "createdAt" >= ${since14d}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  // Top source pages. Wrapped separately: the sourcePage columns arrive with
  // the lead-source-tracking migration, and the dashboard should still
  // render on a database that has not run it yet.
  let topSources: { source: string; total: number }[] = [];
  try {
    const [resSources, leadSources] = await Promise.all([
      db.winterReservation.groupBy({
        by: ["sourcePage"],
        _count: { _all: true },
        where: { sourcePage: { not: null } },
      }),
      db.lead.groupBy({
        by: ["sourcePage"],
        _count: { _all: true },
        where: { sourcePage: { not: null }, division: "SNOWLAND" },
      }),
    ]);
    const merged = new Map<string, number>();
    for (const r of [...resSources, ...leadSources]) {
      const key = r.sourcePage ?? "unknown";
      merged.set(key, (merged.get(key) ?? 0) + r._count._all);
    }
    topSources = Array.from(merged, ([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  } catch {
    topSources = [];
  }

  const statusCount = (v: string) =>
    byStatus.find((b) => b.status === v)?._count._all ?? 0;
  const total = byStatus.reduce((sum, b) => sum + b._count._all, 0);
  const booked = statusCount("CONFIRMED") + statusCount("COMPLETED");
  const decided = booked + statusCount("DECLINED");
  const conversion = decided > 0 ? Math.round((booked / decided) * 100) : null;

  const tierRows = DRIVEWAY_TIER_DEFS.map((t) => {
    const rows = byTier.filter((b) => b.drivewayTier === t.slug);
    const tierTotal = rows.reduce((s, r) => s + r._count._all, 0);
    const tierBooked = rows
      .filter((r) => r.status === "CONFIRMED" || r.status === "COMPLETED")
      .reduce((s, r) => s + r._count._all, 0);
    return { tier: t, total: tierTotal, booked: tierBooked };
  });
  const maxTier = Math.max(1, ...tierRows.map((r) => r.total));

  const chart: { label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * DAY_MS);
    const row = daily.find(
      (r) => new Date(r.day).toDateString() === d.toDateString()
    );
    chart.push({
      label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      total: row ? Number(row.total) : 0,
    });
  }
  const maxDaily = Math.max(1, ...chart.map((c) => c.total));
  const promoLive = promoIsLive(winterPromo);

  const stats = [
    {
      label: "Winter quote requests",
      value: total,
      sub: `${statusCount("NEW")} waiting for a first call`,
      icon: Inbox,
      href: "/admin/winter-reservations",
      accent: "text-cyan-200 bg-cyan-500/15",
    },
    {
      label: "Booked contracts",
      value: booked,
      sub: "confirmed + completed",
      icon: Snowflake,
      href: "/admin/winter-reservations?status=CONFIRMED",
      accent: "text-emerald-300 bg-emerald-500/15",
    },
    {
      label: "Conversion rate",
      value: conversion !== null ? `${conversion}%` : "–",
      sub: "booked of decided requests",
      icon: TrendingUp,
      href: "/admin/winter-reservations",
      accent: "text-sky-300 bg-sky-500/15",
    },
    {
      label: "Snow leads (7 days)",
      value: snowLeads7d,
      sub: "via the general quote form",
      icon: Megaphone,
      href: "/admin/leads",
      accent: "text-violet-300 bg-violet-500/15",
    },
    {
      label: "Veteran discount",
      value: veteranCount,
      sub: "10% requests to honour",
      icon: Medal,
      href: "/admin/winter-reservations",
      accent: "text-amber-200 bg-amber-500/15",
    },
    {
      label: "Add-on interest",
      value: walkwayCount + saltingCount,
      sub: `${walkwayCount} walkway packs · ${saltingCount} salting`,
      icon: BadgePercent,
      href: "/admin/winter-reservations",
      accent: "text-pink-300 bg-pink-500/15",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Winter Dashboard</h1>
        <p className="mt-1.5 text-muted-foreground">
          The 2026-27 growth season at a glance: contracts, intake, and what
          is producing them.
        </p>
      </header>

      {/* ---- Promo status ---- */}
      <div
        className={`rounded-2xl border p-5 ${
          promoLive
            ? "border-amber-400/30 bg-amber-500/5"
            : "border-surface-border bg-surface/50"
        }`}
      >
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <BadgePercent
            className={`h-4 w-4 shrink-0 ${promoLive ? "text-amber-300" : "text-muted-foreground"}`}
            aria-hidden
          />
          {promoLive ? (
            <>
              Public promo is LIVE: {promoPercentLabel(winterPromo)} off, ends{" "}
              {promoEndsLabel(winterPromo)}.
            </>
          ) : winterPromo.enabled ? (
            <>Public promo window has ended (was {promoPercentLabel(winterPromo)}).</>
          ) : (
            <>Public promo is switched off.</>
          )}
          <Link
            href="/admin/site/content#winter-promo"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Edit promo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      </div>

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
                <s.icon className="h-4 w-4" aria-hidden />
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

      {/* ---- Contracts by tier ---- */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Requests by tier</h2>
        <div className="mt-5 space-y-3">
          {tierRows.map(({ tier, total: t, booked: b }) => (
            <div key={tier.slug} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tier.accent }}
                />
                {tier.name}
              </span>
              <div className="h-6 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="flex h-full items-center rounded-full pl-2 text-[10px] font-bold text-blue-950"
                  style={{
                    width: `${Math.max(4, (t / maxTier) * 100)}%`,
                    backgroundColor: tier.accent,
                  }}
                >
                  {t > 0 ? t : ""}
                </div>
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {b} booked
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Requests per day ---- */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Winter requests, last 14 days</h2>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {chart.map((c) => (
            <div
              key={c.label}
              className="group relative flex-1"
              title={`${c.label}: ${c.total} requests`}
            >
              <div
                className="w-full rounded-t-md bg-cyan-400/40 transition-colors group-hover:bg-cyan-400/70"
                style={{
                  height: `${Math.max(4, (c.total / maxDaily) * 100)}%`,
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

      {/* ---- Source pages ---- */}
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Where winter leads come from</h2>
        {topSources.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No source data yet. Every winter CTA tags its page, so this fills
            in as requests arrive (requires the lead-source-tracking
            migration: <code className="rounded bg-surface px-1.5 py-0.5 text-xs">npm run db:deploy</code>).
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {topSources.map((s) => (
              <li key={s.source} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {s.source}
                </span>
                <span className="h-2 rounded-full bg-primary/50" style={{ width: `${Math.max(6, (s.total / topSources[0].total) * 160)}px` }} />
                <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {s.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Package tiers and inclusions are code content in{" "}
        <code className="rounded bg-surface px-1.5 py-0.5">
          lib/content/winter-packages.ts
        </code>
        ; the {getDrivewayTier("BRONZE").priceLabel ?? "Bronze"} anchor and
        placeholder estimates live there too. The public promo, announcement
        bar, and bundle incentive are editable without a deploy under{" "}
        <Link
          href="/admin/site/content#winter-promo"
          className="font-medium text-primary hover:underline"
        >
          Page Content
        </Link>
        .
      </p>
    </div>
  );
}
