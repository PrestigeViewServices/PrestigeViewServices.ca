import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Play,
  Plus,
  Truck,
  UserPlus,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
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
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const DISPATCH_ROLES = ["ultimate_admin", "admin", "manager"] as const;

type SearchParams = { date?: string };

function parseDay(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    const parsed = new Date(y, m - 1, d);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Crew Dispatch — the day board.
 *
 * Pick a day, see every job on it by crew, assign the unassigned, and walk
 * jobs through Start → Complete without leaving the page. Jobs that came out
 * of the pipeline without a date sit in "Needs scheduling" until they're
 * given one here. Crews are managed at the bottom.
 */
export default async function DispatchPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...DISPATCH_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Dispatch reads jobs from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const day = parseDay(searchParams.date);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  const prevDay = new Date(day);
  prevDay.setDate(prevDay.getDate() - 1);
  const week = new Date(day);
  week.setDate(week.getDate() + 7);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isToday = day.getTime() === todayStart.getTime();

  const [crews, dayJobs, unscheduled, upcoming] = await Promise.all([
    db.crew.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { members: { select: { id: true, name: true, title: true } } },
    }),
    db.job.findMany({
      where: { scheduledFor: { gte: day, lt: nextDay } },
      orderBy: { scheduledFor: "asc" },
      include: {
        property: { include: { customer: true } },
        service: { select: { name: true } },
      },
    }),
    db.job.findMany({
      where: { scheduledFor: null, status: "SCHEDULED" },
      orderBy: { createdAt: "asc" },
      include: {
        property: { include: { customer: true } },
        service: { select: { name: true } },
      },
      take: 30,
    }),
    db.job.groupBy({
      by: ["scheduledFor"],
      where: { scheduledFor: { gte: nextDay, lt: week }, status: "SCHEDULED" },
      _count: { _all: true },
    }),
  ]);

  const crewOptions = crews.map((c) => ({ id: c.id, name: c.name }));
  const unassigned = dayJobs.filter((j) => !j.crewId);
  const jobsForCrew = (crewId: string) =>
    dayJobs.filter((j) => j.crewId === crewId);
  const upcomingCount = upcoming.reduce((sum, u) => sum + u._count._all, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crew Dispatch</h1>
          <p className="mt-1.5 text-muted-foreground">
            {isToday ? "Today, " : ""}
            {day.toLocaleDateString("en-CA", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            . {dayJobs.length} job{dayJobs.length === 1 ? "" : "s"} ·{" "}
            {unassigned.length} unassigned · {upcomingCount} more in the next 7
            days.
          </p>
        </div>

        {/* ---- Day navigation ---- */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/dispatch?date=${toParam(prevDay)}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-surface-border transition-colors hover:bg-white/5"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {!isToday && (
            <Link
              href="/admin/dispatch"
              className="rounded-full border border-surface-border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            >
              Today
            </Link>
          )}
          <form action={jumpToDate} className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={toParam(day)}
              className="h-9 rounded-full border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm" variant="outline">
              Go
            </Button>
          </form>
          <Link
            href={`/admin/dispatch?date=${toParam(nextDay)}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-surface-border transition-colors hover:bg-white/5"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* ---- Needs scheduling (from the pipeline) ---- */}
      {unscheduled.length > 0 && (
        <section className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-200">
            <CalendarClock className="h-4 w-4" />
            Needs scheduling ({unscheduled.length})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Won in the pipeline, waiting for a date. Pick day + time (and a
            crew if you know it) and they land on the board.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {unscheduled.map((j) => (
              <div key={j.id} className="surface-card p-4">
                <JobLine
                  name={customerName(j.property.customer)}
                  division={j.division}
                  service={j.service?.name}
                  city={j.property.city}
                  scheduledFor={null}
                  status={j.status}
                />
                <form
                  action={scheduleJob}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="id" value={j.id} />
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={toParam(day)}
                    className="h-9 rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
                  />
                  <input
                    type="time"
                    name="time"
                    defaultValue="09:00"
                    className="h-9 rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
                  />
                  <select
                    name="crewId"
                    defaultValue=""
                    className="h-9 rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
                  >
                    <option value="">Crew later</option>
                    {crewOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">
                    Schedule
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Unassigned on this day ---- */}
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

      {/* ---- Per-crew schedules ---- */}
      <section className="grid gap-5 lg:grid-cols-2">
        {crews.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground lg:col-span-2">
            No crews yet. Add your first one below and jobs become
            assignable.
          </div>
        )}
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
                {crew.members.map((m) => m.name).join(", ") || "No members yet"}
              </p>

              <div className="mt-5 space-y-3">
                {jobs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nothing scheduled this day.
                  </p>
                )}
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    className="rounded-xl border border-surface-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
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
                    {(j.status === "SCHEDULED" || j.status === "IN_PROGRESS") && (
                      <form action={advanceJob} className="mt-2.5">
                        <input type="hidden" name="id" value={j.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={j.status === "SCHEDULED" ? "IN_PROGRESS" : "COMPLETE"}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {j.status === "SCHEDULED" ? (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              Start job
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark complete
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ---- Crew management ---- */}
      <section className="surface-card p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Crews &amp; members</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a crew, then add the people on it. Members show on the crew card
          above and in the crew portal.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form
            action={createCrew}
            className="flex flex-wrap items-end gap-2 rounded-xl border border-surface-border p-4"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="new-crew" className="mb-1 block text-xs font-medium">
                New crew name
              </label>
              <input
                id="new-crew"
                name="name"
                required
                maxLength={60}
                placeholder="Crew 2 (Windows)"
                className="h-9 w-full rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
              />
            </div>
            <Button type="submit" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add crew
            </Button>
          </form>

          <form
            action={addCrewMember}
            className="flex flex-wrap items-end gap-2 rounded-xl border border-surface-border p-4"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="member-name" className="mb-1 block text-xs font-medium">
                Add a member
              </label>
              <input
                id="member-name"
                name="name"
                required
                maxLength={60}
                placeholder="Full name"
                className="h-9 w-full rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
              />
            </div>
            <select
              name="crewId"
              required
              className="h-9 rounded-lg border border-surface-border bg-input/80 px-3 text-sm"
            >
              {crewOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </form>
        </div>
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
      </div>
    </div>
  );
}

// --- server actions ----------------------------------------------------------

async function assignJobCrew(jobId: string, crewId: string) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const crew = await db.crew.findUnique({ where: { id: crewId }, select: { id: true } });
  if (!crew) throw new Error("Unknown crew");
  await db.job.update({ where: { id: jobId }, data: { crewId } });
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin");
}

/** Give a pipeline job its date (+ optional crew). */
async function scheduleJob(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "09:00");
  const crewId = String(formData.get("crewId") ?? "");
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (/^\d{2}:\d{2}$/.test(time) ? time : "09:00")
    .split(":")
    .map(Number);
  const when = new Date(y, m - 1, d, hh, mm);
  await db.job
    .update({
      where: { id },
      data: { scheduledFor: when, ...(crewId ? { crewId } : {}) },
    })
    .catch(() => {});
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin/pipeline");
}

/** Start / complete straight from the crew card. */
async function advanceJob(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["IN_PROGRESS", "COMPLETE"].includes(status)) return;
  await db.job
    .update({
      where: { id },
      data: {
        status: status as "IN_PROGRESS" | "COMPLETE",
        ...(status === "COMPLETE" ? { completedAt: new Date() } : {}),
      },
    })
    .catch(() => {});
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin/pipeline");
}

/** The Go button on the date picker. */
async function jumpToDate(formData: FormData) {
  "use server";
  const date = String(formData.get("date") ?? "");
  const { redirect } = await import("next/navigation");
  redirect(
    /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? `/admin/dispatch?date=${date}`
      : "/admin/dispatch"
  );
}

async function createCrew(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await db.crew.create({ data: { name } });
  revalidatePath("/admin/dispatch");
}

async function addCrewMember(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const crewId = String(formData.get("crewId") ?? "");
  if (!name || !crewId) return;
  const crew = await db.crew.findUnique({ where: { id: crewId }, select: { id: true } });
  if (!crew) return;
  await db.crewMember.create({ data: { crewId, name } });
  revalidatePath("/admin/dispatch");
}
