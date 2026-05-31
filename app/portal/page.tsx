import { currentUser } from "@clerk/nextjs/server";
import { Clock, DollarSign } from "lucide-react";
import { isClerkConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  if (!isClerkConfigured()) return null;
  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Crew member";

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-primary">Employee Portal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {name}.
        </h1>
        <p className="mt-1.5 text-muted-foreground">Role: Employee</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <PortalCard
          icon={<Clock className="h-5 w-5" />}
          title="My Hours"
          body="Time tracking will live here once we wire it up."
          // TODO: integrate dedicated time-tracking tool (Connecteam or
          // QuickBooks Time). Do NOT build payroll math in-house — payroll
          // ownership is a separate problem domain from this portal.
          note="Connecteam / QuickBooks Time integration coming in Phase 2"
        />
        <PortalCard
          icon={<DollarSign className="h-5 w-5" />}
          title="My Commission Jobs"
          body="Commission-tracked jobs and earnings summary will appear here."
          // TODO: pull from the same time-tracking tool above; commission
          // payouts should reconcile against confirmed completed jobs.
          note="Pulled from time-tracking + scheduling — Phase 2"
        />
      </div>

      <div className="surface-card p-6 text-sm text-muted-foreground">
        <p>
          Heads-up: this portal is Phase 1 scaffolding. Schedule, timesheets,
          and pay history live in a dedicated time-tracking app once that's
          chosen and wired up.
        </p>
      </div>
    </div>
  );
}

function PortalCard({
  icon,
  title,
  body,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  note?: string;
}) {
  return (
    <div className="surface-card p-6">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
      {note && (
        <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground/70">
          {note}
        </p>
      )}
    </div>
  );
}
