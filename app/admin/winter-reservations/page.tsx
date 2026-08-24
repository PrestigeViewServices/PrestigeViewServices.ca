import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Mail, Phone, MapPin, Medal, Snowflake, Shovel } from "lucide-react";
import type { ReservationStatus } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";
import {
  DRIVEWAY_SIZE_LABELS,
  SHOVELING_LABELS,
  formatRange,
  getDrivewayTier,
  getShovelingTier,
} from "@/lib/content/winter-packages";

export const dynamic = "force-dynamic";

const RESERVATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED", label: "Declined" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  CONTACTED: "bg-yellow-500/15 text-yellow-200 border-yellow-500/25",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  DECLINED: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  COMPLETED: "bg-slate-500/15 text-slate-200 border-slate-500/25",
};

type SearchParams = { status?: string; q?: string };

export default async function WinterReservationsPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  await requireRole(["ultimate_admin", "super_admin", "admin"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Winter reservations are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate` to view them."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const where: { status?: ReservationStatus; OR?: object[] } = {};
  if (
    searchParams.status &&
    RESERVATION_STATUSES.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status as ReservationStatus;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { streetAddress: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, byStatus, confirmedAgg, veteranCount] = await Promise.all([
    db.winterReservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.winterReservation.groupBy({ by: ["status"], _count: { status: true } }),
    db.winterReservation.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { estimateLowCents: true, estimateHighCents: true },
    }),
    db.winterReservation.count({ where: { veteranDiscount: true } }),
  ]);

  const statusCount = (v: string) =>
    byStatus.find((b) => b.status === v)?._count.status ?? 0;
  const totalAll = byStatus.reduce((sum, b) => sum + b._count.status, 0);
  const bookedLow = confirmedAgg._sum.estimateLowCents ?? 0;
  const bookedHigh = confirmedAgg._sum.estimateHighCents ?? 0;
  const money = (cents: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Winter Reservations
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            {items.length} shown of {totalAll} total · {statusCount("NEW")}{" "}
            waiting for a first call
          </p>
        </div>
      </header>

      {/* ---- Season at a glance ---- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface-card p-4">
          <p className="text-2xl font-bold tabular-nums">
            {statusCount("CONFIRMED")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Confirmed for this winter
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-2xl font-bold tabular-nums">
            {statusCount("NEW") + statusCount("CONTACTED")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            In the follow-up queue
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-2xl font-bold tabular-nums">
            {bookedLow > 0 ? `${money(bookedLow)}–${money(bookedHigh)}` : "$0"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Season revenue booked (estimates)
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-2xl font-bold tabular-nums">{veteranCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Military / veteran (10% off)
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 text-sm items-center">
        <form action="/admin/winter-reservations" method="GET" className="mr-2">
          {searchParams.status && (
            <input type="hidden" name="status" value={searchParams.status} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, address, city…"
            className="h-9 w-64 rounded-full border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <FilterPill
          href={
            q
              ? `/admin/winter-reservations?q=${encodeURIComponent(q)}`
              : "/admin/winter-reservations"
          }
          active={!searchParams.status}
        >
          All ({totalAll})
        </FilterPill>
        {RESERVATION_STATUSES.map((s) => (
          <FilterPill
            key={s.value}
            href={`/admin/winter-reservations?status=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={searchParams.status === s.value}
          >
            {s.label} ({statusCount(s.value)})
          </FilterPill>
        ))}
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">
            No reservations match these filters.
          </div>
        )}
        {items.map((r) => {
          const drive = getDrivewayTier(r.drivewayTier);
          const shovel = getShovelingTier(r.shovelingTier);
          const estimateLabel = formatRange({
            low: r.estimateLowCents,
            high: r.estimateHighCents,
          });
          return (
            <article key={r.id} className="surface-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{r.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Snowflake className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground/90">
                        {drive.name}
                      </span>{" "}
                      · {DRIVEWAY_SIZE_LABELS[r.drivewaySize]}
                    </span>
                    {shovel && (
                      <span className="inline-flex items-center gap-1 ml-3">
                        <Shovel className="h-3.5 w-3.5 text-primary" />
                        {shovel.name}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">
                      Estimate
                    </span>
                    <span className="font-semibold text-foreground">
                      {estimateLabel}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      / season
                    </span>
                  </p>
                </div>
                <StatusSelect
                  rowId={r.id}
                  current={r.status}
                  options={
                    RESERVATION_STATUSES as unknown as {
                      value: string;
                      label: string;
                    }[]
                  }
                  action={updateReservationStatus}
                />
              </div>

              <dl className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
                <Row
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  value={
                    <a
                      href={`mailto:${r.email}`}
                      className="hover:underline break-all"
                    >
                      {r.email}
                    </a>
                  }
                />
                <Row
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  value={
                    <a href={`tel:${r.phone}`} className="hover:underline">
                      {r.phone}
                    </a>
                  }
                />
                <Row
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  value={
                    <span>
                      {r.streetAddress}, {r.city}, {r.region}
                      {r.postalCode ? ` ${r.postalCode}` : ""}
                    </span>
                  }
                />
                <Row
                  label="Walkway"
                  value={SHOVELING_LABELS[r.shovelingTier]}
                />
                <Row
                  label="Add-ons"
                  value={
                    [
                      r.saltingAddOn ? "Salting and de-icing" : null,
                      r.ridgePriority ? "City-ridge priority" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "None"
                  }
                />
                <Row
                  label="Received"
                  value={r.createdAt.toLocaleString("en-CA")}
                />
                {r.veteranDiscount && (
                  <Row
                    label="Discount"
                    value={
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-200">
                        <Medal className="h-3.5 w-3.5" />
                        Military / veteran 10%
                      </span>
                    }
                  />
                )}
              </dl>

              {r.customerNotes && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    From the customer
                  </p>
                  <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
                    {r.customerNotes}
                  </p>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-surface-border">
                <NotesEditor
                  rowId={r.id}
                  initialNotes={r.notes}
                  action={updateReservationNotes}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({
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
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-surface-border text-muted-foreground hover:border-white/15 hover:text-foreground"
      } ${active && href !== "/admin/winter-reservations" ? STATUS_COLOR[href.split("=")[1]] ?? "" : ""}`}
    >
      {children}
    </Link>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      {icon}
      {label && (
        <span className="text-xs uppercase tracking-wider min-w-[6rem]">
          {label}
        </span>
      )}
      <span className="text-foreground/90 break-words">{value}</span>
    </div>
  );
}

// --- server actions --------------------------------------------------------

async function updateReservationStatus(id: string, status: string) {
  "use server";
  await requireRole(["ultimate_admin", "super_admin", "admin"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  if (!RESERVATION_STATUSES.some((s) => s.value === status)) {
    throw new Error("Invalid status");
  }
  await db.winterReservation.update({
    where: { id },
    data: { status: status as ReservationStatus },
  });
  revalidatePath("/admin/winter-reservations");
  revalidatePath("/admin");
}

async function updateReservationNotes(id: string, notes: string) {
  "use server";
  await requireRole(["ultimate_admin", "super_admin", "admin"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const trimmed = notes.slice(0, 5000);
  await db.winterReservation.update({
    where: { id },
    data: { notes: trimmed || null },
  });
  revalidatePath("/admin/winter-reservations");
}
