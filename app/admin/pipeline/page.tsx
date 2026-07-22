import { revalidatePath } from "next/cache";
import type { JobStatus, LeadStatus } from "@prisma/client";
import { Truck, Clock, DollarSign } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import {
  PIPELINE_COLUMNS,
  LEAD_STATUS_META,
  JOB_STATUS_META,
  DIVISION_LABEL,
  DIVISION_ACCENT,
  formatCents,
  customerName,
} from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const DISPATCH_ROLES = ["ultimate_admin", "admin", "manager"] as const;
const LEAD_OPTIONS = LEAD_STATUS_META.map((m) => ({ value: m.value, label: m.label }));
const JOB_OPTIONS = JOB_STATUS_META.map((m) => ({ value: m.value, label: m.label }));

export default async function PipelinePage() {
  if (!isClerkConfigured()) return null;
  await requireRole([...DISPATCH_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="The pipeline reads live leads + jobs from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const [leads, jobs] = await Promise.all([
    db.lead.findMany({
      where: { status: { in: ["NEW", "QUOTED"] } },
      orderBy: { createdAt: "desc" },
    }),
    db.job.findMany({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETE", "INVOICED"] } },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      include: {
        property: { include: { customer: true } },
        crew: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const leadsByStatus = (s: LeadStatus) => leads.filter((l) => l.status === s);
  const jobsByStatus = (s: JobStatus) => jobs.filter((j) => j.status === s);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Job Pipeline</h1>
        <p className="mt-1.5 text-muted-foreground">
          Lead → Quoted → Scheduled → In Progress → Complete → Invoiced. Move a
          card with its status menu.
        </p>
      </header>

      <div className="-mx-2 overflow-x-auto pb-4">
        <div className="flex gap-4 px-2 min-w-max">
          {PIPELINE_COLUMNS.map((col) => {
            const isLead = col.source === "lead";
            const count = isLead
              ? leadsByStatus(col.status as LeadStatus).length
              : jobsByStatus(col.status as JobStatus).length;
            return (
              <section key={col.key} className="w-[280px] shrink-0">
                <div className="flex items-center justify-between px-1 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {count}
                  </span>
                </div>

                <div className="space-y-3">
                  {isLead
                    ? leadsByStatus(col.status as LeadStatus).map((l) => (
                        <article key={l.id} className="surface-card p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-tight">{l.name}</p>
                            {l.division && (
                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[l.division]}`}
                              >
                                {DIVISION_LABEL[l.division]}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground truncate">
                            {l.propertyAddress ?? l.email}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {l.estimateCents
                                ? formatCents(l.estimateCents)
                                : l.source.replace("_", " ").toLowerCase()}
                            </span>
                          </div>
                          <div className="mt-3">
                            <StatusSelect
                              rowId={l.id}
                              current={l.status}
                              options={LEAD_OPTIONS}
                              action={updateLeadStatus}
                            />
                          </div>
                        </article>
                      ))
                    : jobsByStatus(col.status as JobStatus).map((j) => (
                        <article key={j.id} className="surface-card p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-tight truncate">
                              {customerName(j.property.customer)}
                            </p>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[j.division]}`}
                            >
                              {DIVISION_LABEL[j.division]}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground truncate">
                            {j.service?.name ?? "Service"} · {j.property.city}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                              <Truck className="h-3 w-3" />
                              {j.crew?.name ?? (
                                <span className="text-amber-300">Unassigned</span>
                              )}
                            </p>
                            {j.scheduledFor && (
                              <p className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {j.scheduledFor.toLocaleString("en-CA", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                            {j.priceCents != null && (
                              <p className="flex items-center gap-1.5">
                                <DollarSign className="h-3 w-3" />
                                {formatCents(j.priceCents)}
                              </p>
                            )}
                          </div>
                          <div className="mt-3">
                            <StatusSelect
                              rowId={j.id}
                              current={j.status}
                              options={JOB_OPTIONS}
                              action={updateJobStatus}
                            />
                          </div>
                        </article>
                      ))}

                  {count === 0 && (
                    <div className="rounded-xl border border-dashed border-surface-border p-4 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function updateLeadStatus(id: string, status: string) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  if (!LEAD_STATUS_META.some((m) => m.value === status)) {
    throw new Error("Invalid lead status");
  }
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  await db.lead.update({ where: { id }, data: { status: status as LeadStatus } });
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
}

async function updateJobStatus(id: string, status: string) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  if (!JOB_STATUS_META.some((m) => m.value === status)) {
    throw new Error("Invalid job status");
  }
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const data: { status: JobStatus; completedAt?: Date } = {
    status: status as JobStatus,
  };
  if (status === "COMPLETE") data.completedAt = new Date();
  await db.job.update({ where: { id }, data });
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
}
