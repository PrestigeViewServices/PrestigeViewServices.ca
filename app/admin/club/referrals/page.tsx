import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { ReferralStatus } from "@prisma/client";
import {
  ArrowLeft,
  BadgeDollarSign,
  Check,
  Gift,
  Link2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { getClubSettings } from "@/lib/club-settings";
import { formatCents, formatPoints } from "@/lib/loyalty";
import {
  REFERRAL_STATUS_META,
  awardReferral,
  rejectReferral,
} from "@/lib/referrals";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

const STATUS_FILTERS: { value: ReferralStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INVITED", label: "Invited" },
  { value: "BOOKED", label: "Booked" },
  { value: "COMPLETED", label: "Ready to award" },
  { value: "AWARDED", label: "Awarded" },
  { value: "REJECTED", label: "Not eligible" },
];

type SearchParams = { status?: string; q?: string };

/**
 * Referral command center — the whole program on one page: funnel, money,
 * top referrers, and every referral with its actions. The Approvals page
 * keeps only the ones that need a decision; this is the full picture.
 */
export default async function AdminReferralsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Referrals are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;
  const settings = await getClubSettings(db);

  const statusFilter =
    searchParams.status &&
    STATUS_FILTERS.some((f) => f.value === searchParams.status)
      ? (searchParams.status as ReferralStatus)
      : undefined;
  const q = (searchParams.q ?? "").trim().slice(0, 100);

  const [all, filtered] = await Promise.all([
    db.referral.findMany({
      select: { status: true, rewardPoints: true, friendCreditCents: true, friendCreditUsed: true },
    }),
    db.referral.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(q
          ? {
              OR: [
                { referredEmail: { contains: q, mode: "insensitive" } },
                { referredName: { contains: q, mode: "insensitive" } },
                { referrer: { email: { contains: q, mode: "insensitive" } } },
                { referrer: { firstName: { contains: q, mode: "insensitive" } } },
                { referrer: { lastName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { referrer: { select: { id: true, firstName: true, lastName: true, email: true, referralCode: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  // ---- Funnel + money ------------------------------------------------------
  const count = (s: ReferralStatus) => all.filter((r) => r.status === s).length;
  const active = all.filter((r) => r.status !== "REJECTED");
  const awarded = all.filter((r) => r.status === "AWARDED");
  const pts = (r: { rewardPoints: number | null }) =>
    r.rewardPoints ?? settings.pointsReferral;

  const pointsPaid = awarded.reduce((sum, r) => sum + pts(r), 0);
  const pointsOwed = all
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + pts(r), 0);
  const creditsPromised = active.reduce(
    (sum, r) => sum + (r.friendCreditCents ?? settings.referralFriendCents),
    0
  );
  const creditsUsed = all
    .filter((r) => r.friendCreditUsed)
    .reduce((sum, r) => sum + (r.friendCreditCents ?? settings.referralFriendCents), 0);
  const conversion =
    active.length > 0 ? Math.round((awarded.length / active.length) * 100) : 0;

  // ---- Top referrers -------------------------------------------------------
  const topReferrers = await db.referral.groupBy({
    by: ["referrerId"],
    where: { status: { not: "REJECTED" } },
    _count: { referrerId: true },
    orderBy: { _count: { referrerId: "desc" } },
    take: 5,
  });
  const topMembers = topReferrers.length
    ? await db.member.findMany({
        where: { id: { in: topReferrers.map((t) => t.referrerId) } },
        select: { id: true, firstName: true, lastName: true, referralCode: true },
      })
    : [];
  const awardedByReferrer = await db.referral.groupBy({
    by: ["referrerId"],
    where: { status: "AWARDED" },
    _count: { referrerId: true },
  });

  const qs = (over: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    const status = over.status ?? searchParams.status;
    const query = over.q ?? q;
    if (status && status !== "ALL") p.set("status", status);
    if (query) p.set("q", query);
    const str = p.toString();
    return str ? `?${str}` : "";
  };

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Referrals</h1>
          </div>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            The whole program at a glance. Current deal: friend gets{" "}
            {formatCents(settings.referralFriendCents)} off their first
            service, referrer earns {formatPoints(settings.pointsReferral)} pts
            ({formatCents(settings.pointsReferral * settings.centsPerPoint)})
            once it&apos;s completed and paid.{" "}
            <Link
              href="/admin/club/settings"
              className="font-medium text-primary hover:underline"
            >
              Change the numbers
            </Link>
          </p>
        </div>
      </header>

      {/* ---- Funnel ---- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(
          [
            ["INVITED", "Invited"],
            ["BOOKED", "Booked"],
            ["COMPLETED", "Ready to award"],
            ["AWARDED", "Awarded"],
            ["REJECTED", "Not eligible"],
          ] as [ReferralStatus, string][]
        ).map(([s, label]) => (
          <Link
            key={s}
            href={`/admin/club/referrals${qs({ status: s })}`}
            className={`surface-card surface-card-hover p-4 ${
              statusFilter === s ? "ring-1 ring-primary/50" : ""
            }`}
          >
            <p className="text-2xl font-bold tabular-nums">{count(s)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </section>

      {/* ---- Money ---- */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyTile
          icon={<Trophy className="h-4 w-4" />}
          label="Conversion"
          value={`${conversion}%`}
          sub={`${awarded.length} of ${active.length} referrals paid out`}
        />
        <MoneyTile
          icon={<BadgeDollarSign className="h-4 w-4" />}
          label="Points paid out"
          value={formatPoints(pointsPaid)}
          sub={`${formatCents(pointsPaid * settings.centsPerPoint)} in service credit`}
        />
        <MoneyTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Points owed"
          value={formatPoints(pointsOwed)}
          sub="ready-to-award referrals"
        />
        <MoneyTile
          icon={<Gift className="h-4 w-4" />}
          label="Friend credits"
          value={formatCents(creditsUsed)}
          sub={`applied, of ${formatCents(creditsPromised)} promised`}
        />
      </section>

      {/* ---- Top referrers ---- */}
      {topReferrers.length > 0 && (
        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Top referrers</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {topReferrers.map((t, i) => {
              const m = topMembers.find((x) => x.id === t.referrerId);
              const won =
                awardedByReferrer.find((a) => a.referrerId === t.referrerId)
                  ?._count.referrerId ?? 0;
              return (
                <Link
                  key={t.referrerId}
                  href={`/admin/club/members/${t.referrerId}`}
                  className="rounded-xl border border-surface-border p-3 transition-colors hover:bg-white/5"
                >
                  <p className="text-xs text-muted-foreground">#{i + 1}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">
                    {m ? `${m.firstName} ${m.lastName ?? ""}`.trim() : "Member"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t._count.referrerId} referred · {won} completed
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Filters + search ---- */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/club/referrals${qs({ status: f.value === "ALL" ? "" : f.value })}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              (f.value === "ALL" && !statusFilter) || statusFilter === f.value
                ? "border-primary/40 bg-primary/15 text-foreground"
                : "border-surface-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/club/referrals" method="GET">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="h-9 w-56 rounded-full border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>

      {/* ---- Table ---- */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="surface-card p-10 text-center text-muted-foreground">
            No referrals match. Share the program:{" "}
            <span className="font-mono text-xs">{siteConfig.url}/refer</span>
          </div>
        )}
        {filtered.map((r) => {
          const meta = REFERRAL_STATUS_META[r.status];
          const points = pts(r);
          const credit = r.friendCreditCents ?? settings.referralFriendCents;
          return (
            <article
              key={r.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    {r.referredName ?? r.referredEmail ?? "Unknown friend"}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                  {r.friendCreditUsed && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {formatCents(credit)} credit applied
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.referredEmail}
                  {r.referredPhone ? ` · ${r.referredPhone}` : ""} · referred by{" "}
                  <Link
                    href={`/admin/club/members/${r.referrerId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.referrer.firstName} {r.referrer.lastName ?? ""}
                  </Link>{" "}
                  ({r.referrer.referralCode ?? "no code"}) · via {r.source} ·{" "}
                  {r.createdAt.toLocaleDateString("en-CA")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Deal: friend {formatCents(credit)} off · referrer{" "}
                  {formatPoints(points)} pts
                  {r.leadId && (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href="/admin/leads"
                        className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                      >
                        <Link2 className="h-3 w-3" />
                        lead on file
                      </Link>
                    </>
                  )}
                </p>
                {r.note && <p className="mt-1 text-xs text-amber-200">{r.note}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {(r.status === "INVITED" || r.status === "BOOKED") && (
                  <form action={completeAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="sm" variant="outline">
                      First service done + paid
                    </Button>
                  </form>
                )}
                {r.status === "COMPLETED" && (
                  <form action={awardAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="sm">
                      Award {formatPoints(points)} pts
                    </Button>
                  </form>
                )}
                {!r.friendCreditUsed && r.status !== "REJECTED" && (
                  <form action={markCreditUsed}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      <Check className="h-3.5 w-3.5" />
                      Credit applied
                    </Button>
                  </form>
                )}
                {r.status !== "REJECTED" && r.status !== "AWARDED" && (
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Not eligible
                    </Button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MoneyTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="surface-card p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function completeAction(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  await db.referral
    .updateMany({
      where: { id, status: { in: ["INVITED", "BOOKED"] } },
      data: { status: "COMPLETED", completedAt: new Date() },
    })
    .catch(() => {});
  revalidatePath("/admin/club/referrals");
  revalidatePath("/admin/club/approvals");
}

async function awardAction(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  await awardReferral(db, id);
  revalidatePath("/admin/club/referrals");
  revalidatePath("/admin/club/approvals");
  revalidatePath("/admin/club");
}

async function rejectAction(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  await rejectReferral(db, id, "Marked not eligible by an admin.");
  revalidatePath("/admin/club/referrals");
  revalidatePath("/admin/club/approvals");
}

/** The friend's first-service credit was applied on their invoice. */
async function markCreditUsed(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  await db.referral
    .updateMany({ where: { id }, data: { friendCreditUsed: true } })
    .catch(() => {});
  revalidatePath("/admin/club/referrals");
}
