import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Mail, Phone } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { getRole as getCareerRole, roles as careerRoles } from "@/lib/content/careers";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import { NotesEditor } from "@/components/admin/notes-editor";

export const dynamic = "force-dynamic";

const APPLICATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

type SearchParams = { status?: string; role?: string };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Layout renders a NotConfigured notice when Clerk is off — bail here so we
  // don't try to read a session that doesn't exist yet.
  if (!isClerkConfigured()) return null;
  await requireRole(["ultimate_admin", "super_admin", "admin"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Applications are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate` to view them. SETUP.md walks through it."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const where: Record<string, string> = {};
  if (
    searchParams.status &&
    APPLICATION_STATUSES.some((s) => s.value === searchParams.status)
  ) {
    where.status = searchParams.status;
  }
  if (searchParams.role) where.roleSlug = searchParams.role;

  const items = await db.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {searchParams.status === "HIRED" ? "New Hires" : "Applications"}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            {items.length} result{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/applications"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              !searchParams.status
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-surface-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All applications
          </Link>
          <Link
            href="/admin/applications?status=HIRED"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              searchParams.status === "HIRED"
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100"
                : "border-surface-border text-muted-foreground hover:text-foreground"
            }`}
          >
            New Hires
          </Link>
        </div>
      </header>

      <Filters
        currentStatus={searchParams.status}
        currentRole={searchParams.role}
      />

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">
            No applications match these filters.
          </div>
        )}
        {items.map((a) => {
          const career = getCareerRole(a.roleSlug);
          return (
            <article key={a.id} className="surface-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Applying for{" "}
                    <span className="text-foreground/90">
                      {career?.title ?? a.roleSlug}
                    </span>{" "}
                    · {a.availability} · {a.yearsExperience}
                  </p>
                </div>
                <StatusSelect
                  rowId={a.id}
                  current={a.status}
                  options={APPLICATION_STATUSES}
                  action={updateApplicationStatus}
                />
              </div>

              <dl className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
                <Row
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  value={
                    <a
                      href={`mailto:${a.email}`}
                      className="hover:underline"
                    >
                      {a.email}
                    </a>
                  }
                />
                <Row
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  value={
                    <a
                      href={`tel:${a.phone}`}
                      className="hover:underline"
                    >
                      {a.phone}
                    </a>
                  }
                />
                <Row
                  label="Valid license"
                  value={a.validLicense.toUpperCase()}
                />
                <Row
                  label="Reliable commute"
                  value={a.reliableCommute.toUpperCase()}
                />
                {a.resumeUrl && (
                  <Row
                    label="Résumé"
                    value={
                      <a
                        href={a.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Open link
                      </a>
                    }
                  />
                )}
                <Row
                  label="Received"
                  value={a.createdAt.toLocaleString("en-CA")}
                />
              </dl>

              {a.whyJoin && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Why PVS
                  </p>
                  <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
                    {a.whyJoin}
                  </p>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-surface-border">
                <NotesEditor
                  rowId={a.id}
                  initialNotes={a.notes}
                  action={updateApplicationNotes}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Filters({
  currentStatus,
  currentRole,
}: {
  currentStatus?: string;
  currentRole?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <FilterGroup label="Status">
        <FilterPill href="/admin/applications" active={!currentStatus}>
          All
        </FilterPill>
        {APPLICATION_STATUSES.map((s) => (
          <FilterPill
            key={s.value}
            href={`/admin/applications?status=${s.value}${currentRole ? `&role=${currentRole}` : ""}`}
            active={currentStatus === s.value}
          >
            {s.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup label="Role">
        <FilterPill
          href={`/admin/applications${currentStatus ? `?status=${currentStatus}` : ""}`}
          active={!currentRole}
        >
          All
        </FilterPill>
        {careerRoles.map((r) => (
          <FilterPill
            key={r.slug}
            href={`/admin/applications?role=${r.slug}${currentStatus ? `&status=${currentStatus}` : ""}`}
            active={currentRole === r.slug}
          >
            {r.title}
          </FilterPill>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
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
        <span className="text-xs uppercase tracking-wider min-w-[7rem]">
          {label}
        </span>
      )}
      <span className="text-foreground/90 break-all">{value}</span>
    </div>
  );
}

// --- server actions --------------------------------------------------------

async function updateApplicationStatus(id: string, status: string) {
  "use server";
  await requireRole(["ultimate_admin", "super_admin", "admin"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  if (!APPLICATION_STATUSES.some((s) => s.value === status)) {
    throw new Error("Invalid status");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.application.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/admin/applications");
}

async function updateApplicationNotes(id: string, notes: string) {
  "use server";
  await requireRole(["ultimate_admin", "super_admin", "admin"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const trimmed = notes.slice(0, 5000);
  await db.application.update({
    where: { id },
    data: { notes: trimmed || null },
  });
  revalidatePath("/admin/applications");
}
