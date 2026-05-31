import { revalidatePath } from "next/cache";
import { Mail, Phone, MapPin } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";

export const dynamic = "force-dynamic";

// NOTE: This view may duplicate AuroraSuite's customer-issue tracking.
// Confirm with the team before relying on it as the source of truth.

const SUPPORT_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
];

const SUPPORT_TYPES = [
  { value: "QUOTE", label: "Quote" },
  { value: "ISSUE", label: "Issue" },
  { value: "DISPATCH", label: "Dispatch" },
  { value: "GENERAL", label: "General" },
];

export default async function SupportAdminPage() {
  if (!isClerkConfigured()) return null;
  await requireRole(["ultimate_admin", "admin"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Support requests are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate` to view them. SETUP.md walks through it."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const items = await db.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      assignedTo: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Support requests</h1>
        <p className="mt-1.5 text-muted-foreground">
          {items.length} result{items.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/90">
        Heads-up: this list may overlap with AuroraSuite. Confirm routing with
        the team before treating it as the single source of truth.
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">
            No support requests yet.
          </div>
        )}
        {items.map((r) => {
          const type = SUPPORT_TYPES.find((t) => t.value === r.type);
          return (
            <article key={r.id} className="surface-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{r.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {type?.label ?? r.type} ·{" "}
                    {r.createdAt.toLocaleString("en-CA")}
                  </p>
                </div>
                <StatusSelect
                  rowId={r.id}
                  current={r.status}
                  options={SUPPORT_STATUSES}
                  action={updateSupportStatus}
                />
              </div>

              <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap">
                {r.details}
              </p>

              <dl className="mt-5 grid gap-2 sm:grid-cols-2 text-sm">
                <Row
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  value={
                    <a
                      href={`mailto:${r.email}`}
                      className="hover:underline"
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
                {r.propertyAddress && (
                  <Row
                    icon={<MapPin className="h-4 w-4 text-primary" />}
                    value={r.propertyAddress}
                  />
                )}
                {r.assignedTo && (
                  <Row
                    label="Assigned"
                    value={
                      [r.assignedTo.firstName, r.assignedTo.lastName]
                        .filter(Boolean)
                        .join(" ") || r.assignedTo.email
                    }
                  />
                )}
              </dl>
            </article>
          );
        })}
      </div>
    </div>
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

async function updateSupportStatus(id: string, status: string) {
  "use server";
  await requireRole(["ultimate_admin", "admin"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  if (!SUPPORT_STATUSES.some((s) => s.value === status)) {
    throw new Error("Invalid status");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.supportRequest.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: status as any },
  });
  revalidatePath("/admin/support");
}
