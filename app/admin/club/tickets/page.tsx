import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_STYLE,
  ticketTypeLabel,
} from "@/lib/club-tickets";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { status?: string };

const FILTERS = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export default async function ClubTicketQueuePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const status = FILTERS.includes(searchParams.status as (typeof FILTERS)[number])
    ? (searchParams.status as (typeof FILTERS)[number])
    : undefined;

  const tickets = await db.clubTicket.findMany({
    where: status ? { status } : { status: { not: "RESOLVED" } },
    include: { member: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Club requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Portal tickets from Prestige Club members. Default view hides
          resolved.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterPill href="/admin/club/tickets" active={!status}>
          Needs attention
        </FilterPill>
        {FILTERS.map((s) => (
          <FilterPill
            key={s}
            href={`/admin/club/tickets?status=${s}`}
            active={status === s}
          >
            {TICKET_STATUS_LABEL[s]}
          </FilterPill>
        ))}
      </div>

      <div className="surface-card divide-y divide-surface-border">
        {tickets.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            Queue is clear. Nice.
          </p>
        )}
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/admin/club/tickets/${t.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.subject}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.member.firstName} {t.member.lastName ?? ""} ·{" "}
                {ticketTypeLabel(t.type)} · updated{" "}
                {t.updatedAt.toLocaleString("en-CA")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${TICKET_STATUS_STYLE[t.status]}`}
              >
                {TICKET_STATUS_LABEL[t.status]}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </Link>
        ))}
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
          : "border-surface-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
