import { revalidatePath } from "next/cache";
import { Truck, Clock, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole, isClerkConfigured } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { CrewAssignSelect } from "@/components/admin/crew-assign-select";
import {
  DIVISION_LABEL,
  DIVISION_ACCENT,
  JOB_STATUS_META,
  statusColor,
  statusLabel,
  customerName,
} from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const DISPATCH_ROLES = ["ultimate_admin", "admin", "manager"] as const;

export default async function DispatchPage() {
  if (!isClerkConfigured()) return null;
  await requireRole([...DISPATCH_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Dispatch reads today's jobs from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [crews, todayJobs] = await Promise.all([
    db.crew.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { members: { select: { id: true, name: true, title: true } } },
    }),
    db.job.findMany({
      where: { scheduledFor: { gte: startOfToday, lt: endOfToday } },
      orderBy: { scheduledFor: "asc" },
      include: {
        property: { include: { customer: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const crewOptions = crews.map((c) => ({ id: c.id, name: c.name }));
  const unassigned = todayJobs.filter((j) => !j.crewId);
  const jobsForCrew = (crewId: string) =>
    todayJobs.filter((j) => j.crewId === crewId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crew Dispatch</h1>
          <p className="mt-1.5 text-muted-foreground">
            Today, {" "}
            {now.toLocaleDateString("en-CA", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            . {todayJobs.length} job{todayJobs.length === 1 ? "" : "s"} ·{" "}
            {unassigned.length} unassigned.
          </p>
        </div>
      </header>

      {/* Unassigned bucket */}
      {unassigned.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Unassigned ({unassigned.length})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((j) => (
              <div key={j.id} className="surface-card p-4">
                <JobLine
                  name={customerName(j.property.customer)}
                  division={j.division}
                  service={j.service?.name}
                  city={j.property.city}
                  scheduledFor={j.scheduledFor}
                  status={j.status}
                />
                <div className="mt-3">
                  <CrewAssignSelect
                    jobId={j.id}
                    current={null}
                    crews={crewOptions}
                    action={assignJobCrew}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Per-crew schedules */}
      <section className="grid gap-5 lg:grid-cols-2">
        {crews.map((crew) => {
          const jobs = jobsForCrew(crew.id);
          return (
            <div key={crew.id} className="surface-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{crew.name}</h3>
                </div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {jobs.length} job{jobs.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {crew.members.map((m) => m.name).join(", ") || "No members"}
              </p>

              <div className="mt-5 space-y-3">
                {jobs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nothing scheduled today.
                  </p>
                )}
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    className="rounded-xl border border-surface-border p-3 flex items-start justify-between gap-3"
                  >
                    <JobLine
                      name={customerName(j.property.customer)}
                      division={j.division}
                      service={j.service?.name}
                      city={j.property.city}
                      scheduledFor={j.scheduledFor}
                      status={j.status}
                    />
                    <CrewAssignSelect
                      jobId={j.id}
                      current={j.crewId}
                      crews={crewOptions}
                      action={assignJobCrew}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function JobLine({
  name,
  division,
  service,
  city,
  scheduledFor,
  status,
}: {
  name: string;
  division: keyof typeof DIVISION_LABEL;
  service?: string | null;
  city: string;
  scheduledFor: Date | null;
  status: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold truncate">{name}</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[division]}`}
        >
          {DIVISION_LABEL[division]}
        </span>
        {status !== "SCHEDULED" && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(JOB_STATUS_META, status)}`}
          >
            {statusLabel(JOB_STATUS_META, status)}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>{service ?? "Service"}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {city}
        </span>
        {scheduledFor && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {scheduledFor.toLocaleTimeString("en-CA", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
        {status === "COMPLETE" && (
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        )}
      </div>
    </div>
  );
}

// --- server action ----------------------------------------------------------

async function assignJobCrew(jobId: string, crewId: string) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const crew = await db.crew.findUnique({ where: { id: crewId }, select: { id: true } });
  if (!crew) throw new Error("Unknown crew");
  await db.job.update({ where: { id: jobId }, data: { crewId } });
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin");
}
