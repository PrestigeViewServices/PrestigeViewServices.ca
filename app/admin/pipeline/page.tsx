import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { JobStatus, LeadStatus } from "@prisma/client";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Play,
  Receipt,
  Truck,
  Users,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { StatusSelect } from "@/components/admin/status-select";
import {
  LEAD_STATUS_META,
  JOB_STATUS_META,
  DIVISION_LABEL,
  DIVISION_ACCENT,
  formatCents,
  customerName,
} from "@/lib/dashboard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const DISPATCH_ROLES = ["ultimate_admin", "admin", "manager"] as const;
const LEAD_OPTIONS = LEAD_STATUS_META.map((m) => ({ value: m.value, label: m.label }));
const JOB_OPTIONS = JOB_STATUS_META.map((m) => ({ value: m.value, label: m.label }));

const DAY_MS = 24 * 60 * 60 * 1000;

function ageDays(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

/**
 * Job Pipeline — Lead → Quoted → Scheduled → In Progress → Complete →
 * Invoiced, on one board.
 *
 * Leads convert to real jobs with one click ("Won → create job"): the
 * customer + property records are created from the lead, and the job drops
 * into Scheduled where Dispatch picks it up. Jobs advance with one-click
 * primary actions; the dropdown stays for corrections.
 */
export default async function PipelinePage() {
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

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [leads, jobs, wonThisMonth, lostCount] = await Promise.all([
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
    db.lead.count({ where: { status: "WON", updatedAt: { gte: monthStart } } }),
    db.lead.count({ where: { status: "LOST", updatedAt: { gte: monthStart } } }),
  ]);

  const leadsByStatus = (s: LeadStatus) => leads.filter((l) => l.status === s);
  const jobsByStatus = (s: JobStatus) => jobs.filter((j) => j.status === s);

  const quotedValue = leadsByStatus("QUOTED").reduce(
    (sum, l) => sum + (l.estimateCents ?? 0),
    0
  );
  const bookedValue = jobs
    .filter((j) => j.status === "SCHEDULED" || j.status === "IN_PROGRESS")
    .reduce((sum, j) => sum + (j.priceCents ?? 0), 0);
  const awaitingInvoice = jobsByStatus("COMPLETE").reduce(
    (sum, j) => sum + (j.priceCents ?? 0),
    0
  );

  const columns: {
    key: string;
    label: string;
    hint: string;
    render: () => React.ReactNode;
    count: number;
  }[] = [
    {
      key: "lead-new",
      label: "New leads",
      hint: "Call within one business day",
      count: leadsByStatus("NEW").length,
      render: () => leadsByStatus("NEW").map((l) => <LeadCard key={l.id} lead={l} />),
    },
    {
      key: "lead-quoted",
      label: "Quoted",
      hint: "Waiting on the customer",
      count: leadsByStatus("QUOTED").length,
      render: () =>
        leadsByStatus("QUOTED").map((l) => <LeadCard key={l.id} lead={l} />),
    },
    {
      key: "job-scheduled",
      label: "Scheduled",
      hint: "Booked, assign a crew in Dispatch",
      count: jobsByStatus("SCHEDULED").length,
      render: () =>
        jobsByStatus("SCHEDULED").map((j) => <JobCard key={j.id} job={j} />),
    },
    {
      key: "job-progress",
      label: "In progress",
      hint: "Crew on site",
      count: jobsByStatus("IN_PROGRESS").length,
      render: () =>
        jobsByStatus("IN_PROGRESS").map((j) => <JobCard key={j.id} job={j} />),
    },
    {
      key: "job-complete",
      label: "Complete",
      hint: "Work done, send the invoice",
      count: jobsByStatus("COMPLETE").length,
      render: () =>
        jobsByStatus("COMPLETE").map((j) => <JobCard key={j.id} job={j} />),
    },
    {
      key: "job-invoiced",
      label: "Invoiced",
      hint: "Waiting on payment",
      count: jobsByStatus("INVOICED").length,
      render: () =>
        jobsByStatus("INVOICED").map((j) => <JobCard key={j.id} job={j} />),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Pipeline</h1>
          <p className="mt-1.5 text-muted-foreground">
            Lead to paid, left to right. &ldquo;Won, create job&rdquo; turns a
            lead into a real job that Dispatch can schedule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-surface-border px-3 py-1.5">
            {wonThisMonth} won this month
          </span>
          <span className="rounded-full border border-surface-border px-3 py-1.5">
            {lostCount} lost
          </span>
        </div>
      </header>

      {/* ---- Money across the board ---- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ValueTile
          icon={<BadgeDollarSign className="h-4 w-4" />}
          label="Quoted, awaiting yes"
          value={formatCents(quotedValue)}
          sub={`${leadsByStatus("QUOTED").length} open quotes`}
        />
        <ValueTile
          icon={<CalendarClock className="h-4 w-4" />}
          label="Booked work"
          value={formatCents(bookedValue)}
          sub="scheduled + in progress"
        />
        <ValueTile
          icon={<Receipt className="h-4 w-4" />}
          label="Done, not yet invoiced"
          value={formatCents(awaitingInvoice)}
          sub={`${jobsByStatus("COMPLETE").length} jobs to bill`}
        />
      </div>

      {/* ---- Board ---- */}
      <div className="-mx-2 overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4 px-2">
          {columns.map((col) => (
            <section key={col.key} className="w-[300px] shrink-0">
              <div className="rounded-t-2xl border border-b-0 border-surface-border bg-surface/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    {col.label}
                  </h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {col.count}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {col.hint}
                </p>
              </div>
              <div className="space-y-3 rounded-b-2xl border border-surface-border bg-background/40 p-3">
                {col.render()}
                {col.count === 0 && (
                  <div className="rounded-xl border border-dashed border-surface-border p-5 text-center text-xs text-muted-foreground">
                    Empty
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Looking for a lost lead or an old job? Quote requests keep the full
        history in{" "}
        <Link href="/admin/leads" className="font-medium text-primary hover:underline">
          Quote Requests
        </Link>
        ; crews and schedules live in{" "}
        <Link href="/admin/dispatch" className="font-medium text-primary hover:underline">
          Dispatch
        </Link>
        .
      </p>
    </div>
  );
}

// ---- Cards -----------------------------------------------------------------

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string | null;
  division: keyof typeof DIVISION_LABEL | null;
  status: LeadStatus;
  source: string;
  estimateCents: number | null;
  notes: string | null;
  createdAt: Date;
};

function LeadCard({ lead }: { lead: LeadRow }) {
  const age = ageDays(lead.createdAt);
  const stale = lead.status === "NEW" ? age >= 2 : age >= 10;
  return (
    <article className="surface-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-tight">{lead.name}</p>
        {lead.division && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[lead.division]}`}
          >
            {DIVISION_LABEL[lead.division]}
          </span>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.propertyAddress && <p className="truncate">{lead.propertyAddress}</p>}
        <p className={stale ? "font-semibold text-amber-300" : ""}>
          <Clock className="mr-1 inline h-3 w-3" />
          {age === 0 ? "Today" : `${age} day${age === 1 ? "" : "s"} in stage`}
          {stale && " — follow up"}
        </p>
        {lead.notes && <p className="line-clamp-2">{lead.notes}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        <a
          href={`tel:${lead.phone}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-border text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label={`Call ${lead.name}`}
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-border text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label={`Email ${lead.name}`}
        >
          <Mail className="h-3.5 w-3.5" />
        </a>
        {/* Quote value, editable inline — this is what the money tiles sum. */}
        <form action={setLeadEstimate} className="ml-auto flex items-center gap-1">
          <input type="hidden" name="id" value={lead.id} />
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="number"
            name="estimate"
            min={0}
            step={1}
            defaultValue={lead.estimateCents != null ? lead.estimateCents / 100 : ""}
            placeholder="quote $"
            className="h-7 w-20 rounded-lg border border-surface-border bg-input/80 px-2 text-xs tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="rounded-lg border border-surface-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            Set
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 border-t border-surface-border pt-3">
        <form action={convertLeadToJob} className="flex-1">
          <input type="hidden" name="id" value={lead.id} />
          <Button type="submit" size="sm" className="w-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Won, create job
          </Button>
        </form>
        <StatusSelect
          rowId={lead.id}
          current={lead.status}
          options={LEAD_OPTIONS}
          action={updateLeadStatus}
        />
      </div>
    </article>
  );
}

type JobRow = {
  id: string;
  status: JobStatus;
  division: keyof typeof DIVISION_LABEL;
  scheduledFor: Date | null;
  priceCents: number | null;
  property: {
    city: string;
    streetAddress: string;
    customer: { firstName: string; lastName: string | null };
  };
  crew: { name: string } | null;
  service: { name: string } | null;
};

function JobCard({ job }: { job: JobRow }) {
  const advance =
    job.status === "SCHEDULED"
      ? { to: "IN_PROGRESS", label: "Start", icon: <Play className="h-3.5 w-3.5" /> }
      : job.status === "IN_PROGRESS"
        ? { to: "COMPLETE", label: "Complete", icon: <CheckCircle2 className="h-3.5 w-3.5" /> }
        : job.status === "COMPLETE"
          ? { to: "INVOICED", label: "Invoiced", icon: <Receipt className="h-3.5 w-3.5" /> }
          : null;

  return (
    <article className="surface-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-semibold leading-tight">
          {customerName(job.property.customer)}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[job.division]}`}
        >
          {DIVISION_LABEL[job.division]}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="truncate">
          {job.service?.name ?? "Service"} · {job.property.streetAddress},{" "}
          {job.property.city}
        </p>
        <p className="flex items-center gap-1.5">
          <Truck className="h-3 w-3" />
          {job.crew?.name ?? <span className="text-amber-300">Unassigned</span>}
        </p>
        <p className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {job.scheduledFor ? (
            job.scheduledFor.toLocaleString("en-CA", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          ) : (
            <span className="text-amber-300">Needs a date, set it in Dispatch</span>
          )}
        </p>
        {job.priceCents != null && (
          <p className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            {formatCents(job.priceCents)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-surface-border pt-3">
        {advance && (
          <form action={updateJobStatusForm} className="flex-1">
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="status" value={advance.to} />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              {advance.icon}
              {advance.label}
            </Button>
          </form>
        )}
        <StatusSelect
          rowId={job.id}
          current={job.status}
          options={JOB_OPTIONS}
          action={updateJobStatus}
        />
      </div>
    </article>
  );
}

function ValueTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
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
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin");
}

/** One-click advance buttons post here (same rules as the dropdown). */
async function updateJobStatusForm(formData: FormData) {
  "use server";
  await updateJobStatus(
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? "")
  );
}

/** Inline quote value on a lead card. Entered in dollars, stored in cents. */
async function setLeadEstimate(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  const dollars = Number(formData.get("estimate"));
  if (!id || !Number.isFinite(dollars) || dollars < 0) return;
  await db.lead
    .update({ where: { id }, data: { estimateCents: Math.round(dollars * 100) } })
    .catch(() => {});
  revalidatePath("/admin/pipeline");
}

/**
 * The lead said yes → make it real: find-or-create the Customer by email,
 * create the Property from the lead's address, and open a Job in Scheduled
 * (no date yet — Dispatch owns the calendar). The lead flips to WON and
 * stays linked for the paper trail.
 */
async function convertLeadToJob(formData: FormData) {
  "use server";
  await requireRole([...DISPATCH_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return;

  // A job for this lead already exists — don't double-create on a re-click.
  const existing = await db.job.findFirst({ where: { leadId: lead.id }, select: { id: true } });
  if (existing) {
    await db.lead.update({ where: { id }, data: { status: "WON" } });
    revalidatePath("/admin/pipeline");
    return;
  }

  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || null;

  let customer = await db.customer.findFirst({
    where: { email: { equals: lead.email, mode: "insensitive" } },
  });
  if (!customer) {
    customer = await db.customer.create({
      data: {
        firstName: firstName || lead.name,
        lastName,
        email: lead.email,
        phone: lead.phone,
      },
    });
  }

  // Reuse the customer's property when the lead didn't give an address.
  let property = lead.propertyAddress
    ? await db.property.findFirst({
        where: { customerId: customer.id, streetAddress: lead.propertyAddress },
      })
    : await db.property.findFirst({ where: { customerId: customer.id } });
  if (!property) {
    const rawAddress = lead.propertyAddress ?? "Address on file pending";
    // "123 Maple St, Petawawa" → street + city; bare addresses default local.
    const [street, city] = rawAddress.split(",").map((s) => s.trim());
    property = await db.property.create({
      data: {
        customerId: customer.id,
        streetAddress: street || rawAddress,
        city: city || "Petawawa",
      },
    });
  }

  await db.job.create({
    data: {
      propertyId: property.id,
      division: lead.division ?? "CLEARVIEW",
      leadId: lead.id,
      status: "SCHEDULED",
      priceCents: lead.estimateCents,
    },
  });
  await db.lead.update({
    where: { id },
    data: { status: "WON", customerId: customer.id },
  });

  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dispatch");
  revalidatePath("/admin/accounts");
  revalidatePath("/admin");
}
