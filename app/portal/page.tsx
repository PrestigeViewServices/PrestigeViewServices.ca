import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  PlayCircle,
  Truck,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { getSession, requireRole, isClerkConfigured } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { isCloudinaryConfigured, uploadPhotoBuffer } from "@/lib/cloudinary";
import {
  DIVISION_LABEL,
  DIVISION_ACCENT,
  customerName,
  fullAddress,
} from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  if (!isClerkConfigured()) return null;
  const session = await getSession();
  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Crew member";

  if (!isDbReady()) {
    return (
      <div className="space-y-8">
        <Header name={name} />
        <NotConfigured
          service="Database"
          reason="Your job list comes from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
          envVars={["DATABASE_URL"]}
          missing={missingDbEnvVars()}
        />
      </div>
    );
  }
  const db = getDb()!;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  // Which crew(s) is this employee on?
  const memberships = session
    ? await db.crewMember.findMany({
        where: { userId: session.userId },
        select: { crewId: true, crew: { select: { name: true } } },
      })
    : [];
  const crewIds = memberships.map((m) => m.crewId);
  const crewNames = memberships.map((m) => m.crew.name);

  if (crewIds.length === 0) {
    return (
      <div className="space-y-8">
        <Header name={name} />
        <div className="surface-card p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
            <Truck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No crew assigned yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            You're not on a crew roster yet. Ask your manager to add you to a
            crew and today's jobs will show up here.
          </p>
        </div>
      </div>
    );
  }

  const [active, doneToday] = await Promise.all([
    db.job.findMany({
      where: {
        crewId: { in: crewIds },
        scheduledFor: { gte: startOfToday, lt: endOfToday },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      orderBy: { scheduledFor: "asc" },
      include: {
        property: { include: { customer: true } },
        service: { select: { name: true } },
      },
    }),
    db.job.findMany({
      where: {
        crewId: { in: crewIds },
        status: { in: ["COMPLETE", "INVOICED"] },
        completedAt: { gte: startOfToday, lt: endOfToday },
      },
      orderBy: { completedAt: "desc" },
      include: { property: { include: { customer: true } }, service: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Header name={name} crew={crewNames.join(", ")} />

      <section>
        <h2 className="text-lg font-semibold">
          Today's jobs ({active.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Tap a job to add notes + photos and mark it complete.
        </p>

        <div className="mt-5 space-y-4">
          {active.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">
              Nothing left on the schedule today. Nice work. 🎉
            </div>
          )}

          {active.map((j) => (
            <article key={j.id} className="surface-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold truncate">
                      {customerName(j.property.customer)}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIVISION_ACCENT[j.division]}`}
                    >
                      {DIVISION_LABEL[j.division]}
                    </span>
                    {j.status === "IN_PROGRESS" && (
                      <span className="rounded-full border border-violet-500/25 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">
                    {j.service?.name ?? "Service"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {fullAddress(j.property)}
                    </span>
                    {j.scheduledFor && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {j.scheduledFor.toLocaleTimeString("en-CA", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {j.status === "SCHEDULED" && (
                  <form action={startJob}>
                    <input type="hidden" name="jobId" value={j.id} />
                    <Button type="submit" variant="outline" size="sm">
                      <PlayCircle className="h-4 w-4" />
                      Start
                    </Button>
                  </form>
                )}
              </div>

              {/* Complete: notes + photos */}
              <form action={completeJob} className="mt-5 border-t border-surface-border pt-5 space-y-3">
                <input type="hidden" name="jobId" value={j.id} />
                <Textarea
                  name="notes"
                  rows={2}
                  placeholder="Notes for the office (what was done, anything to flag)…"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Camera className="h-4 w-4" />
                    <span>Add photos</span>
                    <input
                      type="file"
                      name="photos"
                      accept="image/*"
                      multiple
                      className="block text-xs file:mr-3 file:rounded-full file:border-0 file:bg-primary/15 file:px-3 file:py-1.5 file:text-primary"
                    />
                  </label>
                  <Button type="submit" size="sm" className="sm:ml-auto">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark complete
                  </Button>
                </div>
                {!isCloudinaryConfigured() && (
                  <p className="text-[11px] text-muted-foreground/70">
                    Photo upload needs Cloudinary configured, notes will still
                    save.
                  </p>
                )}
              </form>
            </article>
          ))}
        </div>
      </section>

      {doneToday.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">
            Completed today ({doneToday.length})
          </h2>
          <ul className="mt-4 divide-y divide-surface-border surface-card px-5">
            {doneToday.map((j) => (
              <li key={j.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {customerName(j.property.customer)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {j.service?.name ?? "Service"} · {j.property.city}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Header({ name, crew }: { name: string; crew?: string }) {
  return (
    <header>
      <p className="eyebrow text-primary">Crew Portal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Hi, {name}.</h1>
      <p className="mt-1.5 text-muted-foreground">
        {crew ? `Crew: ${crew}` : "Your jobs for today"}
      </p>
    </header>
  );
}

// --- server actions ---------------------------------------------------------

/** The user's crew ids, used to authorize job mutations. */
async function userCrewIds(
  db: NonNullable<ReturnType<typeof getDb>>,
  userId: string
): Promise<string[]> {
  const memberships = await db.crewMember.findMany({
    where: { userId },
    select: { crewId: true },
  });
  return memberships.map((m) => m.crewId);
}

async function startJob(formData: FormData) {
  "use server";
  const session = await requireRole(["employee"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) throw new Error("Missing job");

  const crewIds = await userCrewIds(db, session.userId);
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { crewId: true, status: true },
  });
  if (!job || !job.crewId || !crewIds.includes(job.crewId)) {
    throw new Error("Not your job");
  }
  if (job.status === "SCHEDULED") {
    await db.job.update({ where: { id: jobId }, data: { status: "IN_PROGRESS" } });
  }
  revalidatePath("/portal");
}

async function completeJob(formData: FormData) {
  "use server";
  const session = await requireRole(["employee"]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const jobId = String(formData.get("jobId") || "");
  const notes = String(formData.get("notes") || "").slice(0, 4000);
  if (!jobId) throw new Error("Missing job");

  const crewIds = await userCrewIds(db, session.userId);
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { crewId: true, photoUrls: true },
  });
  if (!job || !job.crewId || !crewIds.includes(job.crewId)) {
    throw new Error("Not your job");
  }

  // Upload any attached photos (best-effort; never blocks completion).
  const uploaded: string[] = [];
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 6);
  if (files.length && isCloudinaryConfigured()) {
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const res = await uploadPhotoBuffer(buffer, `jobs/${jobId}`);
        uploaded.push(res.url);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("crew job photo upload failed", err);
      }
    }
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      status: "COMPLETE",
      completedAt: new Date(),
      crewNotes: notes || null,
      photoUrls: [...job.photoUrls, ...uploaded],
    },
  });
  revalidatePath("/portal");
}
