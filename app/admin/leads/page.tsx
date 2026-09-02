import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Mail, Phone, MapPin, Inbox, BadgePercent, Gift } from "lucide-react";
import type { LeadStatus } from "@prisma/client";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";
import {
  DIVISION_ACCENT,
  DIVISION_LABEL,
  LEAD_STATUS_META,
} from "@/lib/dashboard";
import { getService } from "@/lib/content/services";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { status?: string; q?: string };

/**
 * Quote Requests — every lead the public quote form captures, newest first,
 * with inline status + notes so follow-up happens right here.
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

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [items, totalCount, newCount, week, wonAll, lostAll] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.lead.count(),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { status: "WON" } }),
    db.lead.count({ where: { status: "LOST" } }),
  ]);
  const decided = wonAll + lostAll;
  const winRate = decided > 0 ? Math.round((wonAll / decided) * 100) : null;

  // Two things change the price on a lead, and both are easy to miss in a
  // notes field: the customer has a free account (member discount), or they
  // came in on a referral link (first-service credit). Look both up in bulk
  // and badge them on the card.
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

  const memberEmails = new Set(accountHolders.map((m) => m.email.toLowerCase()));
  const referralByLead = new Map(
    referredLeads.map((r) => [r.leadId, r.friendCreditCents])
  );

  // With no status filter active, the inbox splits into two clearly
  // separate queues: leads nobody has touched yet, then everything already
  // being worked. A status filter collapses it back to a single list.
  const splitView = !where.status;
  const fresh = splitView ? items.filter((l) => l.status === "NEW") : items;
  const worked = splitView ? items.filter((l) => l.status !== "NEW") : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Leads Inbox</h1>
        <p className="mt-1.5 text-muted-foreground">
          {items.length} shown of {totalCount} total · {newCount} waiting for a
          first call · {week} new this week
          {winRate !== null ? ` · ${winRate}% win rate all-time` : ""}
        </p>
      </header>

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

      {items.length === 0 && (
        <div className="surface-card p-10 text-center text-muted-foreground">
          <Inbox className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-3">No quote requests match these filters.</p>
        </div>
      )}

      {splitView && items.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-500/20 px-1.5 text-xs font-bold text-blue-200">
            {fresh.length}
          </span>
          <h2 className="text-lg font-semibold">New leads</h2>
          <span className="text-xs text-muted-foreground">
            nobody has called these yet
          </span>
        </div>
      )}
      {splitView && items.length > 0 && fresh.length === 0 && (
        <div className="surface-card p-6 text-sm text-muted-foreground">
          Inbox zero. Every lead below is already being worked.
        </div>
      )}

      <div className="space-y-4">{fresh.map(renderLead)}</div>

      {splitView && worked.length > 0 && (
        <>
          <div className="mt-10 flex items-center gap-2">
            <span className="grid h-6 min-w-6 place-items-center rounded-full border border-surface-border px-1.5 text-xs font-bold text-muted-foreground">
              {worked.length}
            </span>
            <h2 className="text-lg font-semibold">Being worked</h2>
            <span className="text-xs text-muted-foreground">
              quoted, won, or lost
            </span>
          </div>
          <div className="space-y-4">{worked.map(renderLead)}</div>
        </>
      )}
    </div>
  );

  // Shared card renderer for both queues (hoisted; closes over the member
  // and referral lookups computed above).
  function renderLead(l: (typeof items)[number]) {
          const slugs = Array.isArray(l.serviceSlugs)
            ? (l.serviceSlugs as string[])
            : [];
          const isMember = memberEmails.has(l.email.toLowerCase());
          const referralCredit = referralByLead.get(l.id);
          return (
            <article key={l.id} className="surface-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{l.name}</h3>
                    {l.division && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${DIVISION_ACCENT[l.division]}`}
                      >
                        {DIVISION_LABEL[l.division]}
                      </span>
                    )}
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
                        {formatCents(
                          referralCredit ?? settings.referralFriendCents
                        )}
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
                    <a
                      href={`mailto:${l.email}`}
                      className="hover:underline break-all"
                    >
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
                <Row
                  label="Received"
                  value={l.createdAt.toLocaleString("en-CA")}
                />
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
