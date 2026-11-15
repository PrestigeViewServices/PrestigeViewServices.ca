import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CloudSnow, ExternalLink, TriangleAlert } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  ACTIVE_TTL_HOURS,
  COMPLETE_TTL_HOURS,
  PHASE_DEFS,
  SNOW_PHASES,
  getStoredSnowStatus,
  isExpired,
  saveSnowStatus,
  type SnowPhase,
} from "@/lib/snow-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EDIT_ROLES = ["ultimate_admin", "super_admin", "admin"] as const;

const TONE_BTN: Record<string, string> = {
  idle: "border-slate-300 dark:border-slate-700",
  amber: "border-amber-400",
  sky: "border-sky-400",
  violet: "border-violet-400",
  emerald: "border-emerald-500",
};

const TONE_ACTIVE: Record<string, string> = {
  idle: "bg-slate-100 dark:bg-slate-800",
  amber: "bg-amber-100 dark:bg-amber-950",
  sky: "bg-sky-100 dark:bg-sky-950",
  violet: "bg-violet-100 dark:bg-violet-950",
  emerald: "bg-emerald-100 dark:bg-emerald-950",
};

/**
 * Snow event status: one tap to tell every visitor where we are in the
 * storm. Drives the site-wide storm bar and the storm status card on the
 * home page and live map. Built to be used from a phone mid-storm.
 */
export default async function SnowStatusPage() {
  await requireRole([...EDIT_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Snow status is stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const status = await getStoredSnowStatus(getDb()!);
  const expired = isExpired(status);
  const current = expired ? "none" : status.phase;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/site"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Site settings
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <CloudSnow className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Snow Event Status</h1>
        </div>
        <p className="mt-1.5 text-muted-foreground">
          Tap where we are in the storm. It shows on every public page within
          a minute.{" "}
          <a
            href="/live-map#snow-status"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            View on site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      </header>

      {expired && (
        <div className="flex gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <TriangleAlert className="h-4 w-4 shrink-0 translate-y-0.5" />
          <p>
            &ldquo;{PHASE_DEFS[status.phase].label}&rdquo; expired and the site
            is showing &ldquo;No event&rdquo;. Tap a status to update it.
          </p>
        </div>
      )}

      <form action={setStatus} className="surface-card space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="note" className="text-sm font-medium">
            Public note <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            maxLength={200}
            defaultValue={expired ? "" : status.note}
            placeholder="e.g. Petawawa done, Pembroke finishing by 9 AM"
            className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Replaces the standard message for the status you tap. Leave blank
            for the standard message. Clears when you pick a new status
            without a note.
          </p>
        </div>

        {/* First submit button in the form: Enter in the note field keeps
            the current status instead of triggering "No event". */}
        <Button type="submit" name="phase" value={current} variant="outline" className="w-full">
          Update note only (keep &ldquo;{PHASE_DEFS[current as SnowPhase].label}&rdquo;)
        </Button>

        <p className="text-sm font-medium">Or tap the new status:</p>
        <div className="grid gap-3">
          {SNOW_PHASES.map((phase) => {
            const def = PHASE_DEFS[phase];
            const active = current === phase;
            return (
              <button
                key={phase}
                type="submit"
                name="phase"
                value={phase}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors hover:bg-muted",
                  TONE_BTN[def.tone],
                  active && TONE_ACTIVE[def.tone]
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold">{def.label}</span>
                  {active && (
                    <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                      Live now
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {def.detail}
                </span>
              </button>
            );
          })}
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        {status.updatedAt && (
          <>Last updated {new Date(status.updatedAt).toLocaleString("en-CA", { timeZone: "America/Toronto" })}. </>
        )}
        Auto-expiry: &ldquo;Routes complete&rdquo; clears after{" "}
        {COMPLETE_TTL_HOURS} hours; any other status clears after{" "}
        {ACTIVE_TTL_HOURS} hours without an update, so the site never shows a
        stale storm. Re-tap the current status during a long storm to keep it
        live.
      </p>
    </div>
  );
}

async function setStatus(formData: FormData) {
  "use server";
  await requireRole([...EDIT_ROLES]);
  const db = getDb();
  if (!db) return;
  const raw = String(formData.get("phase") ?? "");
  if (!SNOW_PHASES.includes(raw as SnowPhase)) return;
  await saveSnowStatus(db, raw as SnowPhase, String(formData.get("note") ?? ""));
  revalidatePath("/admin/site/snow-status");
}
