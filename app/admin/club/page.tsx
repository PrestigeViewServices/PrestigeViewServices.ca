import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  LifeBuoy,
  Link2,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  CENTS_PER_POINT,
  formatCents,
  formatPoints,
  tierDef,
} from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { q?: string };

/**
 * Prestige Club admin home: member roster + the numbers that matter.
 * Points liability is REAL MONEY (outstanding points x $0.05).
 */
export default async function ClubAdminPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="The Prestige Club reads from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const q = (searchParams.q ?? "").trim();

  const [members, memberCount, outstanding, openTickets, unlinkedRecords] =
    await Promise.all([
      db.member.findMany({
        where: q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: { profile: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.member.count(),
      db.pointsTransaction.aggregate({ _sum: { amount: true } }),
      db.clubTicket.count({ where: { status: { not: "RESOLVED" } } }),
      db.serviceRecord.count({ where: { memberId: null } }),
    ]);

  const outstandingPoints = Math.max(0, outstanding._sum.amount ?? 0);
  const liabilityCents = outstandingPoints * CENTS_PER_POINT;

  // Per-member balances for the roster (single grouped query, no N+1).
  const balances = await db.pointsTransaction.groupBy({
    by: ["memberId"],
    _sum: { amount: true },
    where: { memberId: { in: members.map((m) => m.id) } },
  });
  const balanceOf = (id: string) =>
    balances.find((b) => b.memberId === id)?._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            The Prestige Club
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Members</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/club/approvals"
            className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02]"
          >
            Approvals
          </Link>
          <Link
            href="/admin/club/tickets"
            className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
          >
            Ticket queue
          </Link>
          <Link
            href="/admin/club/mapping"
            className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
          >
            Category mapping
          </Link>
        </div>
      </header>

      {/* ---- Stats ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Active members"
          value={String(memberCount)}
        />
        <Stat
          icon={Banknote}
          label="Points liability"
          value={formatCents(liabilityCents)}
          sub={`${formatPoints(outstandingPoints)} pts outstanding`}
        />
        <Stat
          icon={LifeBuoy}
          label="Open requests"
          value={String(openTickets)}
          href="/admin/club/tickets"
        />
        <Stat
          icon={Link2}
          label="Unlinked service records"
          value={String(unlinkedRecords)}
          sub="need email match or manual link"
        />
      </div>

      {/* ---- Search + roster ---- */}
      <form className="flex items-center gap-2" action="/admin/club">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="h-11 w-full rounded-xl border border-surface-border bg-input/80 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium hover:bg-white/5"
        >
          Search
        </button>
      </form>

      <div className="surface-card divide-y divide-surface-border">
        {members.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No members{q ? " match that search" : " yet"}.
          </p>
        )}
        {members.map((m) => {
          const tier = tierDef(m.profile?.tier ?? "MEMBER");
          return (
            <Link
              key={m.id}
              href={`/admin/club/members/${m.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.firstName} {m.lastName ?? ""}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {m.email}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tier.name} · {formatPoints(balanceOf(m.id))} pts ·{" "}
                  {formatCents(m.profile?.tierSpend12moCents ?? 0)} / 12mo
                  {m.profile?.jobberClientId ? " · Jobber linked" : ""}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="surface-card surface-card-hover p-5">
      {inner}
    </Link>
  ) : (
    <div className="surface-card p-5">{inner}</div>
  );
}
