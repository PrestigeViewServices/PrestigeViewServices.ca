import Link from "next/link";
import { Search, Snowflake, MapPin, Mail, Phone, TrendingUp, Users } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  formatCents,
  customerName,
  CONTRACT_FREQUENCY_LABEL,
  DIVISION_LABEL,
} from "@/lib/dashboard";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; view?: string };

export default async function AccountsPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  await requireRole(["ultimate_admin", "admin", "manager"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Accounts are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const q = (searchParams.q ?? "").trim();
  const winterOnly = searchParams.view === "winter";

  const where = {
    ...(winterOnly ? { winterOnly: true } : {}),
    ...(q
      ? {
          customer: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [accounts, totalAccounts, winterCount, ltvAgg] = await Promise.all([
    db.account.findMany({
      where,
      orderBy: { ltvCents: "desc" },
      take: 200,
      include: {
        customer: { include: { properties: { take: 1 } } },
        contracts: {
          where: { status: "ACTIVE" },
          select: { division: true, frequency: true, priceCents: true },
        },
        _count: { select: { jobs: true } },
      },
    }),
    db.account.count(),
    db.account.count({ where: { winterOnly: true } }),
    db.account.aggregate({ _sum: { ltvCents: true } }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="mt-1.5 text-muted-foreground">
          Customer service bundles, lifetime value, and winter-only upsell
          targets.
        </p>
      </header>

      {/* Summary tiles */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Tile
          icon={<Users className="h-5 w-5" />}
          label="Total accounts"
          value={String(totalAccounts)}
        />
        <Tile
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total lifetime value"
          value={formatCents(ltvAgg._sum.ltvCents)}
        />
        <Tile
          icon={<Snowflake className="h-5 w-5" />}
          label="Winter-only (upsell)"
          value={String(winterCount)}
          accent
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full sm:max-w-sm">
          {winterOnly && <input type="hidden" name="view" value="winter" />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-lg border border-surface-border bg-surface/70 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </form>
        <div className="flex gap-2 text-sm">
          <Pill href={q ? `/admin/accounts?q=${encodeURIComponent(q)}` : "/admin/accounts"} active={!winterOnly}>
            All
          </Pill>
          <Pill
            href={`/admin/accounts?view=winter${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={winterOnly}
          >
            <Snowflake className="h-3.5 w-3.5" />
            Winter-only
          </Pill>
        </div>
      </div>

      {winterOnly && (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 text-sm text-cyan-100/90">
          <strong className="font-semibold">Upsell lever:</strong> these
          customers buy snow service but no summer service. Prime targets for a
          LawnPros or ClearView offer before next season.
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {accounts.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">
            No accounts match.
          </div>
        )}
        {accounts.map((a) => {
          const prop = a.customer.properties[0];
          const mrrLine = a.contracts
            .map(
              (c) =>
                `${DIVISION_LABEL[c.division]} · ${CONTRACT_FREQUENCY_LABEL[c.frequency]}`
            )
            .join(", ");
          return (
            <article
              key={a.id}
              className="surface-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold truncate">
                    {customerName(a.customer)}
                  </h3>
                  {a.winterOnly && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                      <Snowflake className="h-3 w-3" />
                      Winter-only
                    </span>
                  )}
                  {!a.active && (
                    <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {a.customer.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {a.customer.email}
                    </span>
                  )}
                  {a.customer.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {a.customer.phone}
                    </span>
                  )}
                  {prop && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {prop.city}
                    </span>
                  )}
                </div>
                {mrrLine && (
                  <p className="mt-2 text-xs text-foreground/70">
                    Active: {mrrLine}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Lifetime value
                  </p>
                  <p className="text-xl font-bold">{formatCents(a.ltvCents)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Jobs
                  </p>
                  <p className="text-xl font-bold">{a._count.jobs}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            accent
              ? "bg-cyan-500/15 text-cyan-200"
              : "bg-primary/15 text-primary"
          }`}
        >
          {icon}
        </span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-surface-border text-muted-foreground hover:border-white/15 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
