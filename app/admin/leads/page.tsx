import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Mail, Phone, MapPin, Inbox } from "lucide-react";
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

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { status?: string };

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

  const where: { status?: LeadStatus } = {};
  if (
    searchParams.status &&
    LEAD_STATUS_META.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status as LeadStatus;
  }

  const items = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>
        <p className="mt-1.5 text-muted-foreground">
          {items.length} result{items.length === 1 ? "" : "s"} · captured from
          the website quote form
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm items-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <FilterPill href="/admin/leads" active={!searchParams.status}>
          All
        </FilterPill>
        {LEAD_STATUS_META.map((s) => (
          <FilterPill
            key={s.value}
            href={`/admin/leads?status=${s.value}`}
            active={searchParams.status === s.value}
          >
            {s.label}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="surface-card p-10 text-center text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-3">No quote requests match these filters.</p>
          </div>
        )}
        {items.map((l) => {
          const slugs = Array.isArray(l.serviceSlugs)
            ? (l.serviceSlugs as string[])
            : [];
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
