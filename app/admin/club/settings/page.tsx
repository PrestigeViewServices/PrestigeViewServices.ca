import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  SETTING_DEFS,
  getClubSettings,
  yyyymmddToInput,
  type SettingKey,
} from "@/lib/club-settings";
import { formatCents, formatPoints } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin"] as const;

/**
 * Program Settings — the owner's control panel for every Prestige Club
 * number: earning values, redemption rate, tier thresholds.
 *
 * Changes apply to FUTURE awards only. The ledger is append-only and is
 * never recalculated; existing balances keep their history.
 */
export default async function ClubSettingsPage() {
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const settings = await getClubSettings(db);
  const outstanding = await db.pointsTransaction.aggregate({
    _sum: { amount: true },
  });
  const outstandingPoints = Math.max(0, outstanding._sum.amount ?? 0);

  const groups = ["Earning", "Redemption", "Tiers"] as const;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Program Settings
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every Prestige Club number is yours to tune. Changes apply to{" "}
          <span className="font-semibold text-foreground">future awards
          only</span>, points already in members&apos; ledgers never change.
          Portal pages and emails pick up new values immediately.
        </p>
      </header>

      <form action={saveSettings} className="space-y-6">
        {groups.map((group) => (
          <section key={group} className="surface-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">{group}</h2>
            {group === "Redemption" && (
              <p className="mt-1 text-xs text-amber-200">
                Careful: {formatPoints(outstandingPoints)} points are
                outstanding. At the current rate that&apos;s{" "}
                {formatCents(outstandingPoints * settings.centsPerPoint)} of
                liability — changing the rate revalues all of it.
              </p>
            )}
            {group === "Tiers" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Rolling 12-month paid spend thresholds, entered in dollars.
                Member is always $0. Keep them in ascending order.
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {SETTING_DEFS.filter((d) => d.group === group).map((d) => {
                const stored = settings[d.key];
                const isDate = d.unit === "date";
                const displayValue = isDate
                  ? yyyymmddToInput(stored)
                  : d.unit === "dollars"
                    ? stored / 100
                    : stored;
                return (
                  <div key={d.key}>
                    <label
                      htmlFor={`set-${d.key}`}
                      className="mb-1 block text-sm font-medium"
                    >
                      {d.label}
                      {stored !== d.defaultValue && (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Customized
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      {d.unit === "dollars" && (
                        <span className="text-sm text-muted-foreground">$</span>
                      )}
                      <input
                        id={`set-${d.key}`}
                        name={d.key}
                        type={isDate ? "date" : "number"}
                        required
                        step={isDate ? undefined : 1}
                        min={
                          isDate
                            ? undefined
                            : d.unit === "dollars"
                              ? d.min / 100
                              : d.min
                        }
                        max={
                          isDate
                            ? undefined
                            : d.unit === "dollars"
                              ? d.max / 100
                              : d.max
                        }
                        defaultValue={displayValue}
                        className="h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {d.unit === "points"
                          ? "pts"
                          : d.unit === "cents-per-point"
                            ? "¢/pt"
                            : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.description}{" "}
                      <span className="opacity-70">
                        Default:{" "}
                        {d.unit === "dollars"
                          ? formatCents(d.defaultValue)
                          : d.unit === "date"
                            ? yyyymmddToInput(d.defaultValue)
                            : d.defaultValue}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg">
            <Save className="h-4 w-4" />
            Save settings
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="outline"
            formAction={resetSettings}
          >
            <RotateCcw className="h-4 w-4" />
            Reset all to defaults
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        Preview at today&apos;s rate: 100 pts ={" "}
        {formatCents(100 * settings.centsPerPoint)} · a completed visit earns{" "}
        {settings.pointsPerVisit} pts ={" "}
        {formatCents(settings.pointsPerVisit * settings.centsPerPoint)} of
        credit value.
      </p>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function saveSettings(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  for (const def of SETTING_DEFS) {
    let stored: number;
    if (def.unit === "date") {
      // "yyyy-mm-dd" → YYYYMMDD int.
      const s = String(formData.get(def.key) ?? "").replace(/-/g, "");
      stored = Number(s);
    } else {
      const raw = Number(formData.get(def.key));
      if (!Number.isFinite(raw)) continue;
      stored = def.unit === "dollars" ? Math.round(raw * 100) : Math.trunc(raw);
    }
    if (!Number.isFinite(stored) || stored <= 0) continue;
    const clamped = Math.min(def.max, Math.max(def.min, stored));
    await db.clubSetting.upsert({
      where: { key: def.key satisfies SettingKey },
      create: { key: def.key, value: clamped },
      update: { value: clamped },
    });
  }
  revalidatePath("/admin/club/settings");
  revalidatePath("/admin/club");
  revalidatePath("/account");
  revalidatePath("/account/rewards");
  revalidatePath("/account/referrals");
}

async function resetSettings() {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  await db.clubSetting.deleteMany({});
  revalidatePath("/admin/club/settings");
  revalidatePath("/admin/club");
  revalidatePath("/account");
  revalidatePath("/account/rewards");
  revalidatePath("/account/referrals");
}
