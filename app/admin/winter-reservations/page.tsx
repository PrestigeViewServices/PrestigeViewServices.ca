import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Mail,
  Medal,
  MessageSquareText,
  Phone,
  Search,
  Shovel,
  Snowflake,
  StickyNote,
  Tractor,
  Truck,
} from "lucide-react";
import type { Prisma, ReservationStatus } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";
import { Badge, PageHeader, td, th } from "@/components/admin/page-header";
import {
  DRIVEWAY_SIZE_LABELS,
  SHOVELING_LABELS,
  formatRange,
  getDrivewayTier,
  getShovelingTier,
} from "@/lib/content/winter-packages";
import {
  WINTER_TOWN_META,
  type WinterTown,
  formatDollars,
  timeAgo,
  winterTown,
} from "@/lib/admin-finance";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RESERVATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "DECLINED", label: "Declined" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const TOWN_FILTERS: { value: string; town: WinterTown }[] = [
  { value: "pembroke", town: "PEMBROKE" },
  { value: "petawawa", town: "PETAWAWA" },
  { value: "other", town: "OTHER" },
];

type SearchParams = { status?: string; q?: string; town?: string };

function EquipmentBadge({ city }: { city: string }) {
  const t = winterTown(city);
  const meta = WINTER_TOWN_META[t];
  const Icon =
    t === "PEMBROKE" ? Truck : t === "PETAWAWA" ? Tractor : Snowflake;
  return (
    <Badge cls={meta.cls}>
      <Icon className="h-3 w-3" />
      {meta.equipment}
    </Badge>
  );
}

export default async function WinterReservationsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
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
  const town = TOWN_FILTERS.find((t) => t.value === searchParams.town);
  const where: Prisma.WinterReservationWhereInput = {};
  if (
    searchParams.status &&
    RESERVATION_STATUSES.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status as ReservationStatus;
  }
  const and: Prisma.WinterReservationWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { streetAddress: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (town) {
    if (town.town === "OTHER") {
      and.push({
        NOT: [
          { city: { contains: "pembroke", mode: "insensitive" } },
          { city: { contains: "petawawa", mode: "insensitive" } },
        ],
      });
    } else {
      and.push({ city: { contains: town.value, mode: "insensitive" } });
    }
  }
  if (and.length) where.AND = and;

  const [items, byStatus, confirmedAgg, veteranCount, allCities] =
    await Promise.all([
      db.winterReservation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      db.winterReservation.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      db.winterReservation.aggregate({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { estimateLowCents: true, estimateHighCents: true },
      }),
      db.winterReservation.count({ where: { veteranDiscount: true } }),
      db.winterReservation.findMany({
        where: { status: { not: "DECLINED" } },
        select: { city: true },
      }),
    ]);

  const statusCount = (v: string) =>
    byStatus.find((b) => b.status === v)?._count.status ?? 0;
  const totalAll = byStatus.reduce((sum, b) => sum + b._count.status, 0);
  const bookedLow = confirmedAgg._sum.estimateLowCents ?? 0;
  const bookedHigh = confirmedAgg._sum.estimateHighCents ?? 0;
  const townCount = (t: WinterTown) =>
    allCities.filter((c) => winterTown(c.city) === t).length;

  const qs = (over: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    const merged = {
      status: searchParams.status,
      q: q || undefined,
      town: town?.value,
      ...over,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return str
      ? `/admin/winter-reservations?${str}`
      : "/admin/winter-reservations";
  };

  const statusOptions = RESERVATION_STATUSES as unknown as {
    value: string;
    label: string;
  }[];
  const now = new Date();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Winter Reservations"
        description={
          <>
            {items.length} shown of {totalAll} total · {statusCount("NEW")}{" "}
            waiting for a first call
          </>
        }
      />

      {/* ---- Season at a glance ---- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          value={statusCount("CONFIRMED")}
          label="Confirmed for this winter"
        />
        <Stat
          value={statusCount("NEW") + statusCount("CONTACTED")}
          label="In the follow-up queue"
        />
        <Stat
          value={
            bookedLow > 0
              ? `${formatDollars(bookedLow)}–${formatDollars(bookedHigh)}`
              : "$0"
          }
          label="Season revenue booked (estimates)"
        />
        <Stat value={veteranCount} label="Military / veteran (10% off)" />
        <div className="col-span-2 rounded-xl border border-white/[0.07] bg-[#0E1322] p-4 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Route split
          </p>
          <div className="mt-2 space-y-1 text-[12.5px]">
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Truck className="h-3.5 w-3.5 text-orange-300" />
                Pembroke (plow)
              </span>
              <span className="font-semibold tabular-nums text-white">
                {townCount("PEMBROKE")}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Tractor className="h-3.5 w-3.5 text-lime-300" />
                Petawawa (tractor)
              </span>
              <span className="font-semibold tabular-nums text-white">
                {townCount("PETAWAWA")}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2 text-slate-500">
              <span>Other areas</span>
              <span className="tabular-nums">{townCount("OTHER")}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#0E1322]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <nav
              className="-mx-1 flex gap-1 overflow-x-auto px-1"
              aria-label="Filter by status"
            >
              <Tab
                href={qs({ status: undefined })}
                active={!where.status}
                count={totalAll}
              >
                All
              </Tab>
              {RESERVATION_STATUSES.map((s) => (
                <Tab
                  key={s.value}
                  href={qs({ status: s.value })}
                  active={searchParams.status === s.value}
                  count={statusCount(s.value)}
                >
                  {s.label}
                </Tab>
              ))}
            </nav>
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <nav
              className="-mx-1 flex gap-1 overflow-x-auto px-1"
              aria-label="Filter by town"
            >
              <Tab href={qs({ town: undefined })} active={!town}>
                All towns
              </Tab>
              {TOWN_FILTERS.map((t) => (
                <Tab
                  key={t.value}
                  href={qs({ town: t.value })}
                  active={town?.value === t.value}
                >
                  {WINTER_TOWN_META[t.town].label}
                </Tab>
              ))}
            </nav>
          </div>
          <form
            action="/admin/winter-reservations"
            method="GET"
            className="relative"
          >
            {searchParams.status && (
              <input type="hidden" name="status" value={searchParams.status} />
            )}
            {town && <input type="hidden" name="town" value={town.value} />}
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search name, address, city…"
              className="h-9 w-full rounded-sm border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25 xl:w-64"
            />
          </form>
        </div>

        {items.length === 0 && (
          <p className="px-4 py-14 text-center text-[13px] text-slate-500">
            No reservations match these filters.
          </p>
        )}

        {items.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden xl:block">
              <table className="w-full border-collapse">
                <thead className="border-b border-white/[0.06] bg-white/[0.015]">
                  <tr>
                    <th className={cn(th, "pl-4")}>Customer</th>
                    <th className={th}>Address</th>
                    <th className={th}>Route</th>
                    <th className={th}>Package</th>
                    <th className={cn(th, "text-right")}>Estimate / season</th>
                    <th className={th}>Received</th>
                    <th className={th}>Status</th>
                    <th className={cn(th, "pr-4 text-right")}>Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {items.map((r) => {
                    const drive = getDrivewayTier(r.drivewayTier);
                    const shovel = getShovelingTier(r.shovelingTier);
                    return (
                      <tr
                        key={r.id}
                        className="transition-colors hover:bg-white/[0.025]"
                      >
                        <td className={cn(td, "pl-4")}>
                          <p className="flex flex-wrap items-center gap-1.5 font-medium text-slate-100">
                            {r.name}
                            {r.veteranDiscount && (
                              <Badge cls="border-sky-400/30 bg-sky-500/10 text-sky-200">
                                <Medal className="h-3 w-3" />
                                Veteran 10%
                              </Badge>
                            )}
                          </p>
                          <a
                            href={`tel:${r.phone}`}
                            className="mt-0.5 flex items-center gap-1.5 text-[12px] tabular-nums text-slate-300 hover:text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3 text-slate-500" />
                            {r.phone}
                          </a>
                          <a
                            href={`mailto:${r.email}`}
                            className="flex max-w-[200px] items-center gap-1.5 truncate text-[12px] text-slate-400 hover:text-primary hover:underline"
                            title={r.email}
                          >
                            <Mail className="h-3 w-3 shrink-0 text-slate-500" />
                            <span className="truncate">{r.email}</span>
                          </a>
                        </td>
                        <td className={cn(td, "max-w-[220px] text-slate-300")}>
                          {r.streetAddress}
                          <span className="block text-[12px] text-slate-500">
                            {r.city}, {r.region}
                            {r.postalCode ? ` ${r.postalCode}` : ""}
                          </span>
                        </td>
                        <td className={td}>
                          <EquipmentBadge city={r.city} />
                        </td>
                        <td className={cn(td, "text-slate-300")}>
                          <span className="inline-flex items-center gap-1">
                            <Snowflake className="h-3 w-3 text-cyan-300" />
                            {drive.name} ·{" "}
                            {DRIVEWAY_SIZE_LABELS[r.drivewaySize]}
                          </span>
                          <span className="block text-[12px] text-slate-500">
                            {shovel ? (
                              <span className="inline-flex items-center gap-1">
                                <Shovel className="h-3 w-3" />
                                {shovel.name}
                              </span>
                            ) : (
                              "No walkway"
                            )}
                            {r.saltingAddOn ? " · Salting" : ""}
                            {r.ridgePriority ? " · Ridge priority" : ""}
                          </span>
                        </td>
                        <td
                          className={cn(
                            td,
                            "whitespace-nowrap text-right font-medium tabular-nums text-slate-100",
                          )}
                        >
                          {formatRange({
                            low: r.estimateLowCents,
                            high: r.estimateHighCents,
                          })}
                        </td>
                        <td
                          className={cn(
                            td,
                            "whitespace-nowrap tabular-nums text-slate-400",
                          )}
                          title={r.createdAt.toLocaleString("en-CA")}
                        >
                          {timeAgo(r.createdAt, now)}
                        </td>
                        <td className={cn(td, "py-2")}>
                          <StatusSelect
                            rowId={r.id}
                            current={r.status}
                            options={statusOptions}
                            action={updateReservationStatus}
                            size="sm"
                          />
                        </td>
                        <td className={cn(td, "py-2 pr-4 text-right")}>
                          <NotesDisclosure r={r} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phones/tablets: compact cards */}
            <ul className="divide-y divide-white/[0.06] xl:hidden">
              {items.map((r) => {
                const drive = getDrivewayTier(r.drivewayTier);
                return (
                  <li key={r.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-slate-100">
                          {r.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                          <span>{timeAgo(r.createdAt, now)}</span>
                          <EquipmentBadge city={r.city} />
                          {r.veteranDiscount && (
                            <Badge cls="border-sky-400/30 bg-sky-500/10 text-sky-200">
                              <Medal className="h-3 w-3" />
                              Veteran
                            </Badge>
                          )}
                        </p>
                      </div>
                      <StatusSelect
                        rowId={r.id}
                        current={r.status}
                        options={statusOptions}
                        action={updateReservationStatus}
                        size="sm"
                      />
                    </div>
                    <p className="text-[12.5px] text-slate-300">
                      {drive.name} · {DRIVEWAY_SIZE_LABELS[r.drivewaySize]} ·{" "}
                      {SHOVELING_LABELS[r.shovelingTier]}
                      <span className="ml-2 font-semibold tabular-nums text-white">
                        {formatRange({
                          low: r.estimateLowCents,
                          high: r.estimateHighCents,
                        })}
                      </span>
                    </p>
                    <p className="text-[12.5px] text-slate-400">
                      {r.streetAddress}, {r.city}, {r.region}
                      {r.postalCode ? ` ${r.postalCode}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${r.phone}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-white/[0.09] px-2.5 text-[12.5px] font-medium text-slate-200"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {r.phone}
                      </a>
                      <a
                        href={`mailto:${r.email}`}
                        className="inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-sm border border-white/[0.09] px-2.5 text-[12.5px] font-medium text-slate-200"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{r.email}</span>
                      </a>
                    </div>
                    <NotesDisclosure r={r} align="left" />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0E1322] p-4">
      <p className="text-[22px] font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-slate-500">{label}</p>
    </div>
  );
}

function Tab({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "bg-white/[0.08] text-white"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "rounded px-1 text-[11px] tabular-nums",
            active
              ? "bg-white/10 text-slate-200"
              : "bg-white/[0.04] text-slate-500",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/** Customer notes + internal notes in a popover so rows stay compact. */
function NotesDisclosure({
  r,
  align = "right",
}: {
  r: { id: string; notes: string | null; customerNotes: string | null };
  align?: "right" | "left";
}) {
  const has = Boolean(r.notes);
  return (
    <details className="group relative">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-medium transition-colors [&::-webkit-details-marker]:hidden",
          has
            ? "border-white/[0.1] text-slate-200 hover:bg-white/[0.05]"
            : "border-transparent text-slate-500 hover:border-white/[0.08] hover:text-slate-300",
        )}
        title={r.notes ?? "Add internal notes"}
      >
        <StickyNote className="h-3.5 w-3.5" />
        {has ? "Notes" : "Add"}
        {r.customerNotes && (
          <MessageSquareText
            className="h-3.5 w-3.5 text-sky-300"
            aria-label="Customer note"
          />
        )}
      </summary>
      <div
        className={cn(
          "z-20 mt-2 w-full space-y-4 rounded-sm border border-white/[0.1] bg-[#121829] p-4 text-left shadow-2xl shadow-black/50 xl:absolute xl:w-[22rem]",
          align === "right" ? "xl:right-0" : "xl:left-0",
        )}
      >
        {r.customerNotes && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
              From the customer
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-200">
              {r.customerNotes}
            </p>
          </div>
        )}
        <NotesEditor
          rowId={r.id}
          initialNotes={r.notes}
          action={updateReservationNotes}
        />
      </div>
    </details>
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
