import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgePercent,
  DatabaseBackup,
  Download,
  Gift,
  Inbox,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  Search,
  StickyNote,
  Upload,
} from "lucide-react";
import type { LeadStatus, Prisma } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";
import {
  Badge,
  PageHeader,
  adminBtn,
  td,
  th,
} from "@/components/admin/page-header";
import {
  DIVISION_ACCENT,
  DIVISION_LABEL,
  LEAD_STATUS_META,
} from "@/lib/dashboard";
import { getService } from "@/lib/content/services";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";
import {
  FIRST_CALL_SLA_HOURS,
  formatDollars,
  hoursSince,
  prettySlug,
  timeAgo,
} from "@/lib/admin-finance";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = [
  "ultimate_admin",
  "super_admin",
  "admin",
  "manager",
] as const;

const SOURCE_LABEL: Record<string, string> = {
  PUBLIC_FORM: "Website",
  PORTAL: "Portal",
  MANUAL: "Manual",
  PHONE: "Phone",
  DOOR_TO_DOOR: "Door to door",
};

const SORTS = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  estimate: [
    { estimateCents: { sort: "desc", nulls: "last" } },
    { createdAt: "desc" },
  ],
  name: { name: "asc" },
} satisfies Record<
  string,
  Prisma.LeadOrderByWithRelationInput | Prisma.LeadOrderByWithRelationInput[]
>;
type SortKey = keyof typeof SORTS;

type SearchParams = { status?: string; q?: string; sort?: string };

/**
 * Leads Inbox: every lead the public quote form (and manual / imported
 * entry) captures, as a dense data table with inline status + notes so
 * follow-up happens right here. Phones get compact cards instead.
 */
export default async function LeadsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Quote requests are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate` to view them."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const sort: SortKey =
    searchParams.sort && searchParams.sort in SORTS
      ? (searchParams.sort as SortKey)
      : "newest";
  const where: {
    status?: LeadStatus;
    OR?: object[];
  } = {};
  if (
    searchParams.status &&
    LEAD_STATUS_META.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status as LeadStatus;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { propertyAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const slaCutoff = new Date(Date.now() - FIRST_CALL_SLA_HOURS * 3600 * 1000);
  const [items, totalCount, byStatus, week, overdueNew] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: SORTS[sort],
      take: 200,
    }),
    db.lead.count(),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { status: "NEW", createdAt: { lt: slaCutoff } } }),
  ]);
  const statusCount = (s: LeadStatus) =>
    byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const newCount = statusCount("NEW");
  const wonAll = statusCount("WON");
  const lostAll = statusCount("LOST");
  const decided = wonAll + lostAll;
  const winRate = decided > 0 ? Math.round((wonAll / decided) * 100) : null;

  // Two things change the price on a lead, and both are easy to miss in a
  // notes field: the customer has a free account (member discount), or they
  // came in on a referral link (first-service credit). Look both up in bulk
  // and badge them on the row.
  const settings = await getClubSettingsSafe(db);
  const offer = accountOffer(settings);
  const emails = Array.from(new Set(items.map((l) => l.email.toLowerCase())));

  const [accountHolders, referredLeads] = await Promise.all([
    offer.enabled && emails.length
      ? db.member.findMany({
          where: { email: { in: emails }, passwordHash: { not: "" } },
          select: { email: true },
        })
      : Promise.resolve([]),
    items.length
      ? db.referral.findMany({
          where: {
            leadId: { in: items.map((l) => l.id) },
            status: { not: "REJECTED" },
          },
          select: { leadId: true, friendCreditCents: true },
        })
      : Promise.resolve([]),
  ]);

  const memberEmails = new Set(
    accountHolders.map((m) => m.email.toLowerCase()),
  );
  const referralByLead = new Map(
    referredLeads.map((r) => [r.leadId, r.friendCreditCents]),
  );

  // With no status filter active, the inbox splits into two clearly
  // separate queues: leads nobody has touched yet, then everything already
  // being worked. A status filter collapses it back to a single list.
  const splitView = !where.status;
  const fresh = splitView ? items.filter((l) => l.status === "NEW") : items;
  const worked = splitView ? items.filter((l) => l.status !== "NEW") : [];

  type LeadRow = (typeof items)[number];

  const qs = (over: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    const merged = {
      status: searchParams.status,
      q: q || undefined,
      sort: sort === "newest" ? undefined : sort,
      ...over,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return str ? `/admin/leads?${str}` : "/admin/leads";
  };

  const statusOptions = LEAD_STATUS_META as unknown as {
    value: string;
    label: string;
  }[];

  function rowFlags(l: LeadRow) {
    const slugs = Array.isArray(l.serviceSlugs)
      ? (l.serviceSlugs as string[])
      : [];
    const isMember = memberEmails.has(l.email.toLowerCase());
    const referralCredit = referralByLead.get(l.id);
    const breach =
      l.status === "NEW" && hoursSince(l.createdAt, now) > FIRST_CALL_SLA_HOURS;
    return { slugs, isMember, referralCredit, breach };
  }

  function PriceBadges({ l }: { l: LeadRow }) {
    const { isMember, referralCredit } = rowFlags(l);
    return (
      <>
        {isMember && (
          <Badge cls="border-primary/30 bg-primary/10 text-blue-200">
            <BadgePercent className="h-3 w-3" />
            Member, apply {offer.label}
          </Badge>
        )}
        {referralCredit !== undefined && (
          <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <Gift className="h-3 w-3" />
            Referred, apply{" "}
            {formatCents(referralCredit ?? settings.referralFriendCents)}
          </Badge>
        )}
      </>
    );
  }

  function ServiceChips({ slugs }: { slugs: string[] }) {
    if (slugs.length === 0)
      return (
        <span className="text-[11.5px] text-slate-500">General inquiry</span>
      );
    return (
      <span className="flex flex-wrap gap-1">
        {slugs.map((slug) => (
          <span
            key={slug}
            className="whitespace-nowrap rounded border border-white/[0.07] bg-white/[0.03] px-1.5 py-px text-[11px] text-slate-300"
          >
            {getService(slug)?.name ?? prettySlug(slug)}
          </span>
        ))}
      </span>
    );
  }

  /** Notes + customer message, in a disclosure so rows stay one line tall. */
  function NotesCell({
    l,
    align = "right",
  }: {
    l: LeadRow;
    align?: "right" | "left";
  }) {
    const has = Boolean(l.notes);
    return (
      <details className="group relative">
        <summary
          className={cn(
            "inline-flex cursor-pointer list-none items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-medium transition-colors [&::-webkit-details-marker]:hidden",
            has
              ? "border-white/[0.1] text-slate-200 hover:bg-white/[0.05]"
              : "border-transparent text-slate-500 hover:border-white/[0.08] hover:text-slate-300",
          )}
          title={l.notes ?? "Add internal notes"}
        >
          <StickyNote className="h-3.5 w-3.5" />
          <span className={cn(align === "right" && "2xl:inline", align === "right" && "hidden")}>
            {has ? "Notes" : "Add"}
          </span>
          {l.message && (
            <MessageSquareText
              className="h-3.5 w-3.5 text-sky-300"
              aria-label="Customer message"
            />
          )}
        </summary>
        <div
          className={cn(
            "z-20 mt-2 w-full space-y-4 rounded-sm text-left border border-white/[0.1] bg-[#121829] p-4 shadow-2xl shadow-black/50 xl:absolute xl:w-[22rem]",
            align === "right" ? "xl:right-0" : "xl:left-0",
          )}
        >
          {l.message && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                From the customer
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-200">
                {l.message}
              </p>
            </div>
          )}
          <NotesEditor
            rowId={l.id}
            initialNotes={l.notes}
            action={updateLeadNotes}
          />
        </div>
      </details>
    );
  }

  function ReceivedCell({ l }: { l: LeadRow }) {
    const { breach } = rowFlags(l);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap tabular-nums",
          breach ? "font-semibold text-rose-300" : "text-slate-400",
        )}
        title={`${l.createdAt.toLocaleString("en-CA")}${breach ? ` · past the ${FIRST_CALL_SLA_HOURS}h first-call target` : ""}`}
      >
        {breach && <AlertTriangle className="h-3 w-3" />}
        {timeAgo(l.createdAt, now)}
      </span>
    );
  }

  function SortHeader({
    label,
    keyAsc,
    keyDesc,
    className,
  }: {
    label: string;
    keyAsc?: SortKey;
    keyDesc: SortKey;
    className?: string;
  }) {
    const active = sort === keyDesc || sort === keyAsc;
    const next = sort === keyDesc && keyAsc ? keyAsc : keyDesc;
    const Icon = !active
      ? ArrowUpDown
      : sort === keyAsc && keyAsc !== keyDesc
        ? ArrowUp
        : ArrowDown;
    return (
      <th className={cn(th, className)}>
        <Link
          href={qs({ sort: next === "newest" ? undefined : next })}
          className={cn(
            "inline-flex items-center gap-1 hover:text-slate-300",
            active && "text-slate-300",
          )}
        >
          {label}
          <Icon className={cn("h-3 w-3", !active && "opacity-50")} />
        </Link>
      </th>
    );
  }

  type Group = {
    key: string;
    header?: React.ReactNode;
    empty?: React.ReactNode;
    rows: LeadRow[];
  };

  /** One table for every group so the columns line up across groups. */
  function LeadTable({ groups }: { groups: Group[] }) {
    return (
      <>
        {/* Desktop: dense data table */}
        <div className="hidden xl:block">
          <table className="w-full border-collapse">
            <thead className="border-b border-white/[0.06] bg-white/[0.015]">
              <tr>
                <SortHeader label="Lead" keyDesc="name" className="pl-4" />
                <th className={th}>Contact</th>
                <th className={cn(th, "hidden min-[1400px]:table-cell")}>
                  Property
                </th>
                <th className={th}>Division · Source</th>
                <SortHeader label="Received" keyDesc="newest" keyAsc="oldest" />
                <SortHeader
                  label="Estimate"
                  keyDesc="estimate"
                  className="text-right"
                />
                <th className={th}>Status</th>
                <th className={cn(th, "pr-4 text-right")}>Notes</th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody
                key={g.key}
                className="divide-y divide-white/[0.05] border-b border-white/[0.06] last:border-b-0"
              >
                {g.header && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      {g.header}
                    </td>
                  </tr>
                )}
                {g.empty && g.rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      {g.empty}
                    </td>
                  </tr>
                )}
                {g.rows.map((l) => {
                  const { slugs, breach } = rowFlags(l);
                  return (
                    <tr
                      key={l.id}
                      className={cn(
                        "transition-colors hover:bg-white/[0.025]",
                        breach && "bg-rose-500/[0.03]",
                      )}
                    >
                      <td
                        className={cn(td, "min-w-[190px] max-w-[260px] pl-4")}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-slate-100">
                            {l.name}
                          </span>
                          <PriceBadges l={l} />
                        </div>
                        <div className="mt-1">
                          <ServiceChips slugs={slugs} />
                        </div>
                      </td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        <a
                          href={`tel:${l.phone}`}
                          className="inline-flex items-center gap-1.5 tabular-nums text-slate-200 hover:text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3 text-slate-500" />
                          {l.phone}
                        </a>
                        {l.email && (
                          <a
                            href={`mailto:${l.email}`}
                            className="mt-0.5 flex max-w-[170px] items-center gap-1.5 truncate text-[12px] text-slate-400 hover:text-primary hover:underline"
                            title={l.email}
                          >
                            <Mail className="h-3 w-3 shrink-0 text-slate-500" />
                            <span className="truncate">{l.email}</span>
                          </a>
                        )}
                        {l.propertyAddress && (
                          <span
                            className="mt-0.5 block max-w-[190px] truncate text-[12px] text-slate-500 min-[1400px]:hidden"
                            title={l.propertyAddress}
                          >
                            {l.propertyAddress}
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          td,
                          "hidden min-w-[130px] max-w-[200px] text-slate-300 min-[1400px]:table-cell",
                        )}
                      >
                        <span
                          className="line-clamp-2"
                          title={l.propertyAddress ?? undefined}
                        >
                          {l.propertyAddress || (
                            <span className="text-slate-600">—</span>
                          )}
                        </span>
                      </td>
                      <td className={td}>
                        {l.division ? (
                          <Badge cls={DIVISION_ACCENT[l.division]}>
                            {DIVISION_LABEL[l.division]}
                          </Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                        <span className="mt-1 block whitespace-nowrap text-[12px] text-slate-500">
                          {SOURCE_LABEL[l.source] ?? l.source}
                        </span>
                      </td>
                      <td className={td}>
                        <ReceivedCell l={l} />
                      </td>
                      <td
                        className={cn(
                          td,
                          "whitespace-nowrap text-right tabular-nums",
                        )}
                      >
                        {l.estimateCents != null ? (
                          <span className="font-medium text-slate-100">
                            {formatDollars(l.estimateCents)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className={cn(td, "py-2")}>
                        <StatusSelect
                          rowId={l.id}
                          current={l.status}
                          options={statusOptions}
                          action={updateLeadStatus}
                          size="sm"
                        />
                      </td>
                      <td className={cn(td, "py-2 pr-4 text-right")}>
                        <NotesCell l={l} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>

        {/* Phones/tablets: compact cards */}
        {groups.map((g) => (
          <div key={g.key} className="xl:hidden">
            {g.header}
            {g.rows.length === 0 && g.empty}
            <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {g.rows.map((l) => {
                const { slugs, isMember, referralCredit } = rowFlags(l);
                return (
                  <li key={l.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-slate-100">
                          {l.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                          <ReceivedCell l={l} />
                          {l.division && (
                            <Badge cls={DIVISION_ACCENT[l.division]}>
                              {DIVISION_LABEL[l.division]}
                            </Badge>
                          )}
                          <span>{SOURCE_LABEL[l.source] ?? l.source}</span>
                          {l.estimateCents != null && (
                            <span className="font-semibold tabular-nums text-slate-200">
                              {formatDollars(l.estimateCents)}
                            </span>
                          )}
                        </p>
                      </div>
                      <StatusSelect
                        rowId={l.id}
                        current={l.status}
                        options={statusOptions}
                        action={updateLeadStatus}
                        size="sm"
                      />
                    </div>
                    <ServiceChips slugs={slugs} />
                    {(isMember || referralCredit !== undefined) && (
                      <div className="flex flex-wrap gap-1.5">
                        <PriceBadges l={l} />
                      </div>
                    )}
                    {l.propertyAddress && (
                      <p className="text-[12.5px] text-slate-400">
                        {l.propertyAddress}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${l.phone}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-white/[0.09] px-2.5 text-[12.5px] font-medium text-slate-200"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {l.phone}
                      </a>
                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          className="inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-sm border border-white/[0.09] px-2.5 text-[12.5px] font-medium text-slate-200"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{l.email}</span>
                        </a>
                      )}
                    </div>
                    <NotesCell l={l} align="left" />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </>
    );
  }

  const tabs: { label: string; value?: LeadStatus; count: number }[] = [
    { label: "All", count: totalCount },
    ...LEAD_STATUS_META.map((s) => ({
      label: s.label,
      value: s.value,
      count: statusCount(s.value),
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads Inbox"
        description={
          <>
            {items.length} shown of {totalCount} total · {newCount} waiting for
            a first call · {week} new this week
            {winRate !== null ? ` · ${winRate}% win rate all-time` : ""}
          </>
        }
        actions={
          <>
            {/* Save + transfer: every lead can leave (CSV / full JSON backup)
                and come in (Aurora exports, spreadsheets) without a developer. */}
            <a
              href="/api/admin/leads/export?format=csv"
              className={adminBtn.secondary}
              title="Download every lead as a spreadsheet"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <a
              href="/api/admin/leads/export?format=json"
              className={adminBtn.secondary}
              title="Full backup of leads, reservations, support tickets and applications"
            >
              <DatabaseBackup className="h-4 w-4" />
              Backup (JSON)
            </a>
            <Link href="/admin/leads/import" className={adminBtn.secondary}>
              <Upload className="h-4 w-4" />
              Import
            </Link>
            <Link href="/admin/leads/new" className={adminBtn.primary}>
              <Plus className="h-4 w-4" />
              New lead
            </Link>
          </>
        }
      />

      {overdueNew > 0 && (
        <Link
          href={qs({ status: "NEW", sort: "oldest" })}
          className="flex items-center gap-2 rounded-sm border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-[13px] text-rose-200 transition-colors hover:bg-rose-500/10"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            <strong className="font-semibold">{overdueNew}</strong> new lead
            {overdueNew === 1 ? " has" : "s have"} waited more than{" "}
            {FIRST_CALL_SLA_HOURS}h for a first call.
          </span>
          <span className="shrink-0 text-[12px] font-semibold underline-offset-2 hover:underline">
            Show oldest first
          </span>
        </Link>
      )}

      <section className="rounded-xl border border-white/[0.07] bg-[#0E1322]">
        {/* Toolbar: status tabs + search */}
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <nav
            className="-mx-1 flex gap-1 overflow-x-auto px-1"
            aria-label="Filter by status"
          >
            {tabs.map((t) => {
              const active =
                (searchParams.status ?? undefined) === t.value ||
                (!t.value && !where.status);
              return (
                <Link
                  key={t.label}
                  href={qs({ status: t.value })}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded px-1 text-[11px] tabular-nums",
                      active
                        ? "bg-white/10 text-slate-200"
                        : "bg-white/[0.04] text-slate-500",
                    )}
                  >
                    {t.count}
                  </span>
                </Link>
              );
            })}
          </nav>
          <form action="/admin/leads" method="GET" className="relative">
            {searchParams.status && (
              <input type="hidden" name="status" value={searchParams.status} />
            )}
            {sort !== "newest" && (
              <input type="hidden" name="sort" value={sort} />
            )}
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone, address…"
              className="h-9 w-full rounded-sm border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25 md:w-72"
            />
          </form>
        </div>

        {q && (
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2 text-[12.5px] text-slate-400">
            Results for{" "}
            <strong className="text-slate-200">&ldquo;{q}&rdquo;</strong>
            <Link
              href={qs({ q: undefined })}
              className="text-primary hover:underline"
            >
              Clear
            </Link>
          </div>
        )}

        {items.length === 0 && (
          <div className="px-4 py-16 text-center text-slate-500">
            <Inbox className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-3 text-[13px]">
              No quote requests match these filters.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <LeadTable
            groups={
              splitView
                ? [
                    {
                      key: "new",
                      header: (
                        <GroupHeader
                          count={fresh.length}
                          title="New leads"
                          hint="nobody has called these yet"
                          cls="bg-blue-500/15 text-blue-200"
                        />
                      ),
                      empty: (
                        <p className="px-4 py-6 text-[13px] text-slate-500">
                          Inbox zero. Every lead below is already being worked.
                        </p>
                      ),
                      rows: fresh,
                    },
                    ...(worked.length > 0
                      ? [
                          {
                            key: "worked",
                            header: (
                              <GroupHeader
                                count={worked.length}
                                title="Being worked"
                                hint="quoted, won, or lost"
                                cls="bg-white/[0.06] text-slate-300"
                              />
                            ),
                            rows: worked,
                          },
                        ]
                      : []),
                  ]
                : [{ key: "all", rows: fresh }]
            }
          />
        )}
      </section>
    </div>
  );
}

function GroupHeader({
  count,
  title,
  hint,
  cls,
}: {
  count: number;
  title: string;
  hint: string;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/[0.025] px-4 py-2">
      <span
        className={cn(
          "grid h-5 min-w-5 place-items-center rounded px-1 text-[11px] font-bold tabular-nums",
          cls,
        )}
      >
        {count}
      </span>
      <h2 className="text-[13px] font-semibold text-slate-100">{title}</h2>
      <span className="text-[12px] text-slate-500">{hint}</span>
    </div>
  );
}

// --- server actions --------------------------------------------------------

async function updateLeadStatus(id: string, status: string) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  if (!LEAD_STATUS_META.some((s) => s.value === status)) {
    throw new Error("Invalid status");
  }
  await db.lead.update({
    where: { id },
    data: { status: status as LeadStatus },
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

async function updateLeadNotes(id: string, notes: string) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const trimmed = notes.slice(0, 5000);
  await db.lead.update({
    where: { id },
    data: { notes: trimmed || null },
  });
  revalidatePath("/admin/leads");
}
