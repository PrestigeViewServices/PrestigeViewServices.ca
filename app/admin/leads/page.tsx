import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlarmClock,
  BadgeDollarSign,
  BadgePercent,
  Gift,
  History,
  Inbox,
  Mail,
  MapPin,
  Phone,
  Trophy,
} from "lucide-react";
import type { LeadStatus } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";
import { FollowUpPicker } from "@/components/admin/follow-up-picker";
import {
  DIVISION_ACCENT,
  DIVISION_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_META,
  OPEN_LEAD_STATUSES,
  formatAge,
  formatCents as formatCentsMoney,
  leadTransitionData,
  newLeadUrgency,
  statusColor,
  statusLabel,
} from "@/lib/dashboard";
import { getService } from "@/lib/content/services";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

type SearchParams = { status?: string; q?: string };

/**
 * Leads Inbox — every lead the site captures, organized by what needs doing:
 *
 *  1. Due for follow-up — promises coming due or overdue. Top of the page,
 *     because a promised call that never happens is a lost job.
 *  2. New leads — nobody has touched these. Age badges escalate (green →
 *     amber → red) so same-day-call discipline is visible at a glance.
 *  3. In progress — contacted / quoted, waiting on us or the customer.
 *  4. Previous leads — the won/lost history, compact, out of the way.
 *
 * A status filter collapses the queues into one flat list of full cards.
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

  const now = new Date();
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const searchOr = q
    ? [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q } },
        { propertyAddress: { contains: q, mode: "insensitive" as const } },
      ]
    : undefined;

  const where: { status?: LeadStatus; OR?: object[] } = {};
  if (
    searchParams.status &&
    LEAD_STATUS_META.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status as LeadStatus;
  }
  if (searchOr) where.OR = searchOr;

  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [
    items,
    dueLeads,
    totalCount,
    newCount,
    week,
    dueCount,
    won30,
    lost30,
    wonAll,
    lostAll,
    openQuoteValue,
  ] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    // The follow-up queue ignores the 200-newest window on purpose: an old
    // lead with a due follow-up must never fall off the page.
    db.lead.findMany({
      where: {
        status: { in: OPEN_LEAD_STATUSES },
        followUpAt: { lte: now },
        ...(searchOr ? { OR: searchOr } : {}),
      },
      orderBy: { followUpAt: "asc" },
      take: 50,
    }),
    db.lead.count(),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({
      where: { status: { in: OPEN_LEAD_STATUSES }, followUpAt: { lte: now } },
    }),
    db.lead.count({ where: { status: "WON", closedAt: { gte: monthAgo } } }),
    db.lead.count({ where: { status: "LOST", closedAt: { gte: monthAgo } } }),
    db.lead.count({ where: { status: "WON" } }),
    db.lead.count({ where: { status: "LOST" } }),
    db.lead.aggregate({
      where: { status: { in: ["CONTACTED", "QUOTED"] } },
      _sum: { estimateCents: true },
    }),
  ]);

  const decided30 = won30 + lost30;
  const winRate30 = decided30 > 0 ? Math.round((won30 / decided30) * 100) : null;
  const decidedAll = wonAll + lostAll;
  const winRateAll =
    decidedAll > 0 ? Math.round((wonAll / decidedAll) * 100) : null;
  const pipelineCents = openQuoteValue._sum.estimateCents ?? 0;

  // Two things change the price on a lead, and both are easy to miss in a
  // notes field: the customer has a free account (member discount), or they
  // came in on a referral link (first-service credit). Look both up in bulk
  // and badge them on the card.
  const settings = await getClubSettingsSafe(db);
  const offer = accountOffer(settings);
  const allLeads = [...items, ...dueLeads];
  const emails = Array.from(new Set(allLeads.map((l) => l.email.toLowerCase())));

  const [accountHolders, referredLeads] = await Promise.all([
    offer.enabled && emails.length
      ? db.member.findMany({
          where: { email: { in: emails }, passwordHash: { not: "" } },
          select: { email: true },
        })
      : Promise.resolve([]),
    allLeads.length
      ? db.referral.findMany({
          where: {
            leadId: { in: allLeads.map((l) => l.id) },
            status: { not: "REJECTED" },
          },
          select: { leadId: true, friendCreditCents: true },
        })
      : Promise.resolve([]),
  ]);

  const memberEmails = new Set(accountHolders.map((m) => m.email.toLowerCase()));
  const referralByLead = new Map(
    referredLeads.map((r) => [r.leadId, r.friendCreditCents])
  );

  // With no status filter, split into the four queues. A status filter
  // collapses everything back to a single flat list.
  const splitView = !where.status;
  const dueIds = new Set(dueLeads.map((l) => l.id));
  const fresh = splitView
    ? items.filter((l) => l.status === "NEW" && !dueIds.has(l.id))
    : items;
  const working = splitView
    ? items.filter(
        (l) =>
          (l.status === "CONTACTED" || l.status === "QUOTED") &&
          !dueIds.has(l.id)
      )
    : [];
  const previous = splitView
    ? items.filter((l) => l.status === "WON" || l.status === "LOST")
    : [];

  const kpis = [
    {
      label: "New, waiting on a first call",
      value: newCount,
      sub: `${week} came in this week`,
      icon: Inbox,
      accent: "text-blue-300 bg-blue-500/15",
    },
    {
      label: "Follow-ups due",
      value: dueCount,
      sub: dueCount > 0 ? "promised calls, do these first" : "nothing overdue",
      icon: AlarmClock,
      accent:
        dueCount > 0
          ? "text-rose-300 bg-rose-500/15"
          : "text-emerald-300 bg-emerald-500/15",
    },
    {
      label: "Open quote value",
      value: formatCentsMoney(pipelineCents),
      sub: "contacted + quoted, awaiting a yes",
      icon: BadgeDollarSign,
      accent: "text-yellow-200 bg-yellow-500/15",
    },
    {
      label: "Won, last 30 days",
      value: won30,
      sub:
        winRate30 !== null
          ? `${winRate30}% win rate (30d) · ${winRateAll}% all-time`
          : "no decided leads yet",
      icon: Trophy,
      accent: "text-emerald-300 bg-emerald-500/15",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Leads Inbox</h1>
        <p className="mt-1.5 text-muted-foreground">
          {items.length} shown of {totalCount} total. New → Contacted → Quoted →
          Won or Lost; every status change is timestamped.
        </p>
      </header>

      {/* ---- KPI strip ---- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((s) => (
          <div key={s.label} className="surface-card p-4">
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${s.accent}`}
            >
              <s.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
              {s.value}
            </p>
            <p className="text-sm font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm items-center">
        <form action="/admin/leads" method="GET" className="mr-2">
          {searchParams.status && (
            <input type="hidden" name="status" value={searchParams.status} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone, address…"
            className="h-9 w-64 rounded-full border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <FilterPill
          href={q ? `/admin/leads?q=${encodeURIComponent(q)}` : "/admin/leads"}
          active={!searchParams.status}
        >
          All
        </FilterPill>
        {LEAD_STATUS_META.map((s) => (
          <FilterPill
            key={s.value}
            href={`/admin/leads?status=${s.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={searchParams.status === s.value}
          >
            {s.label}
          </FilterPill>
        ))}
      </div>

      {!splitView && items.length === 0 && (
        <div className="surface-card p-10 text-center text-muted-foreground">
          <Inbox className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-3">No quote requests match these filters.</p>
        </div>
      )}

      {!splitView && <div className="space-y-4">{items.map(renderLead)}</div>}

      {splitView && (
        <>
          {/* ---- 1. Due for follow-up ---- */}
          {dueLeads.length > 0 && (
            <section className="space-y-4">
              <QueueHeading
                count={dueLeads.length}
                badgeCls="bg-rose-500/20 text-rose-300"
                title="Due for follow-up"
                hint="you promised these people a call — do these first"
              />
              {dueLeads.map(renderLead)}
            </section>
          )}

          {/* ---- 2. New leads ---- */}
          <section className="space-y-4">
            <QueueHeading
              count={fresh.length}
              badgeCls="bg-blue-500/20 text-blue-200"
              title="New leads"
              hint="nobody has called these yet — fastest call wins the job"
            />
            {fresh.length === 0 && (
              <div className="surface-card p-6 text-sm text-muted-foreground">
                Inbox zero. New quote requests land here the moment the form is
                submitted.
              </div>
            )}
            {fresh.map(renderLead)}
          </section>

          {/* ---- 3. In progress ---- */}
          {working.length > 0 && (
            <section className="space-y-4">
              <QueueHeading
                count={working.length}
                badgeCls="border border-surface-border text-muted-foreground"
                title="In progress"
                hint="contacted or quoted — set a follow-up so nothing drifts"
              />
              {working.map(renderLead)}
            </section>
          )}

          {/* ---- 4. Previous leads (compact history) ---- */}
          <section className="space-y-3">
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Previous leads</h2>
              <span className="text-xs text-muted-foreground">
                won or lost · {wonAll} won, {lostAll} lost all-time
                {winRateAll !== null ? ` · ${winRateAll}% win rate` : ""}
              </span>
            </div>
            {previous.length === 0 ? (
              <div className="surface-card p-6 text-sm text-muted-foreground">
                No decided leads yet. Wins and losses collect here so the
                active queues stay clean.
              </div>
            ) : (
              <div className="surface-card divide-y divide-surface-border">
                {previous.map((l) => {
                  const slugs = Array.isArray(l.serviceSlugs)
                    ? (l.serviceSlugs as string[])
                    : [];
                  return (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm"
                    >
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor(LEAD_STATUS_META, l.status)}`}
                      >
                        {statusLabel(LEAD_STATUS_META, l.status)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {l.name}
                        <span className="ml-2 font-normal text-xs text-muted-foreground">
                          {slugs.length > 0
                            ? slugs
                                .map((s) => getService(s)?.name ?? s)
                                .join(", ")
                            : "General inquiry"}
                        </span>
                      </span>
                      {l.estimateCents != null && (
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                          {formatCentsMoney(l.estimateCents)}
                        </span>
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(l.closedAt ?? l.updatedAt).toLocaleDateString(
                          "en-CA",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <a
                          href={`tel:${l.phone}`}
                          title={`Call ${l.name}`}
                          className="grid h-7 w-7 place-items-center rounded-full border border-surface-border text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                        <a
                          href={`mailto:${l.email}`}
                          title={`Email ${l.name}`}
                          className="grid h-7 w-7 place-items-center rounded-full border border-surface-border text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Filter by <span className="font-medium">Won</span> or{" "}
              <span className="font-medium">Lost</span> above to see the full
              card for any previous lead — notes, quote, and the option to
              reopen it.
            </p>
          </section>
        </>
      )}
    </div>
  );

  // Shared full-card renderer (hoisted; closes over the member and referral
  // lookups computed above).
  function renderLead(l: (typeof items)[number]) {
    const slugs = Array.isArray(l.serviceSlugs)
      ? (l.serviceSlugs as string[])
      : [];
    const isMember = memberEmails.has(l.email.toLowerCase());
    const referralCredit = referralByLead.get(l.id);
    const urgency = newLeadUrgency(l.createdAt, now);
    const ageCls =
      l.status !== "NEW"
        ? "border-surface-border text-muted-foreground"
        : urgency === "fresh"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : urgency === "aging"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-rose-500/40 bg-rose-500/15 text-rose-300";
    return (
      <article key={l.id} className="surface-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{l.name}</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums ${ageCls}`}
                title={`Received ${l.createdAt.toLocaleString("en-CA")}`}
              >
                {formatAge(l.createdAt, now)}
                {l.status === "NEW" && urgency === "stale" && " — call now"}
              </span>
              {l.division && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${DIVISION_ACCENT[l.division]}`}
                >
                  {DIVISION_LABEL[l.division]}
                </span>
              )}
              <span className="rounded-full border border-surface-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {LEAD_SOURCE_LABEL[l.source]}
              </span>
              {isMember && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <BadgePercent className="h-3 w-3" />
                  Account member, apply {offer.label}
                </span>
              )}
              {referralCredit !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <Gift className="h-3 w-3" />
                  Referred, apply{" "}
                  {formatCents(referralCredit ?? settings.referralFriendCents)}
                </span>
              )}
            </div>
            {slugs.length > 0 && (
              <p className="mt-1 flex flex-wrap gap-1.5">
                {slugs.map((slug) => (
                  <span
                    key={slug}
                    className="rounded-full border border-surface-border bg-surface/60 px-2.5 py-0.5 text-xs"
                  >
                    {getService(slug)?.name ?? slug}
                  </span>
                ))}
              </p>
            )}
          </div>
          <StatusSelect
            rowId={l.id}
            current={l.status}
            options={
              LEAD_STATUS_META as unknown as {
                value: string;
                label: string;
              }[]
            }
            action={updateLeadStatus}
          />
        </div>

        <dl className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
          <Row
            icon={<Mail className="h-4 w-4 text-primary" />}
            value={
              <a href={`mailto:${l.email}`} className="hover:underline break-all">
                {l.email}
              </a>
            }
          />
          <Row
            icon={<Phone className="h-4 w-4 text-primary" />}
            value={
              <a href={`tel:${l.phone}`} className="hover:underline">
                {l.phone}
              </a>
            }
          />
          {l.propertyAddress && (
            <Row
              icon={<MapPin className="h-4 w-4 text-primary" />}
              value={l.propertyAddress}
            />
          )}
          <Row label="Received" value={l.createdAt.toLocaleString("en-CA")} />
          {l.contactedAt && (
            <Row
              label="First contact"
              value={l.contactedAt.toLocaleString("en-CA")}
            />
          )}
          {l.closedAt && (
            <Row
              label={l.status === "WON" ? "Won" : "Closed"}
              value={l.closedAt.toLocaleString("en-CA")}
            />
          )}
          {l.estimateCents != null && (
            <Row
              label="Quoted"
              value={`$${(l.estimateCents / 100).toLocaleString("en-CA")}`}
            />
          )}
        </dl>

        {l.message && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              From the customer
            </p>
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
              {l.message}
            </p>
          </div>
        )}

        {(l.status === "NEW" ||
          l.status === "CONTACTED" ||
          l.status === "QUOTED") && (
          <div className="mt-5">
            <FollowUpPicker
              rowId={l.id}
              current={l.followUpAt ? l.followUpAt.toISOString() : null}
              action={updateLeadFollowUp}
            />
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-surface-border">
          <NotesEditor
            rowId={l.id}
            initialNotes={l.notes}
            action={updateLeadNotes}
          />
        </div>
      </article>
    );
  }
}

function QueueHeading({
  count,
  badgeCls,
  title,
  hint,
}: {
  count: number;
  badgeCls: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${badgeCls}`}
      >
        {count}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-xs text-muted-foreground">{hint}</span>
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
      }`}
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

async function updateLeadStatus(id: string, status: string) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  if (!LEAD_STATUS_META.some((s) => s.value === status)) {
    throw new Error("Invalid status");
  }
  const lead = await db.lead.findUnique({
    where: { id },
    select: { contactedAt: true },
  });
  if (!lead) throw new Error("Lead not found");
  await db.lead.update({
    where: { id },
    data: leadTransitionData(status as LeadStatus, lead),
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
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

async function updateLeadFollowUp(id: string, followUpAt: string | null) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  let when: Date | null = null;
  if (followUpAt) {
    when = new Date(followUpAt);
    if (Number.isNaN(when.getTime())) throw new Error("Invalid date");
  }
  await db.lead.update({
    where: { id },
    data: { followUpAt: when },
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
