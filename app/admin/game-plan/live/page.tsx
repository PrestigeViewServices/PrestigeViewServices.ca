import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { prettyDate, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { AutoRefresh } from "@/components/admin/game-plan/auto-refresh";
import { setStopStatus } from "../actions";

export const dynamic = "force-dynamic";

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

/** Live Board — every crew's progress today, refreshed every 20 s. */
export default async function LivePage(props: { searchParams: Promise<{ date?: string }> }) {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="The live board reads plans from Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const sp = await props.searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : ymd();

  const plans = await db.gamePlan.findMany({
    where: { date, published: true, crew: { active: true } },
    include: {
      crew: { select: { name: true, truck: true } },
      stops: { orderBy: { sortOrder: "asc" }, include: { doneBy: { select: { name: true } } } },
    },
    orderBy: { crew: { name: "asc" } },
  });
  const crewsWithout = await db.crew.findMany({
    where: { active: true, gamePlans: { none: { date, published: true } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const totals = plans.reduce(
    (a, p) => {
      a.stops += p.stops.length;
      a.done += p.stops.filter((s) => s.status === "DONE").length;
      a.skipped += p.stops.filter((s) => s.status === "SKIPPED").length;
      a.photos += p.stops.reduce((n, s) => n + s.photoUrls.length, 0);
      return a;
    },
    { stops: 0, done: 0, skipped: 0, photos: 0 }
  );

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={20} />
      <PageHeader
        title="Live Board"
        description={`${prettyDate(date)} · refreshes every 20 seconds`}
        meta={<Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">{totals.done}/{totals.stops} done</Badge>}
        actions={
          <form className="flex items-center gap-2">
            <input id="live-date" type="date" name="date" defaultValue={date} className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
            <button className="h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300">Go</button>
          </form>
        }
      />
      <GamePlanTabs />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Crews out" value={plans.length} />
        <Stat label="Stops done" value={`${totals.done} / ${totals.stops}`} />
        <Stat label="Skipped" value={totals.skipped} warn={totals.skipped > 0} />
        <Stat label="Photos in" value={totals.photos} />
      </div>

      {plans.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
          Nothing posted for this day. <Link href={`/admin/game-plan?date=${date}`} className="text-sky-300 underline-offset-2 hover:underline">Post a plan</Link>
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {plans.map((p) => {
          const done = p.stops.filter((s) => s.status !== "PENDING").length;
          const pct = p.stops.length ? Math.round((done / p.stops.length) * 100) : 0;
          const current = p.stops.find((s) => s.status === "PENDING");
          return (
            <Panel
              key={p.id}
              title={p.crew.name}
              subtitle={[p.truck || p.crew.truck ? (/^truck/i.test(p.truck || p.crew.truck || "") ? (p.truck || p.crew.truck) : `Truck ${p.truck || p.crew.truck}`) : null, p.startTime ? `start ${p.startTime}` : null].filter(Boolean).join(" · ")}
              action={<span className="text-[12px] tabular-nums text-slate-400">{done}/{p.stops.length} · {pct}%</span>}
              bodyClassName="p-0"
            >
              <div className="h-1.5 bg-white/[0.04]"><div className="h-full bg-gradient-to-r from-sky-400 to-primary" style={{ width: `${pct}%` }} /></div>
              <ul className="divide-y divide-white/[0.05]">
                {p.stops.map((s, i) => (
                  <li key={s.id} className={`flex items-start gap-3 px-4 py-2.5 ${s.id === current?.id ? "bg-primary/[0.07]" : ""}`}>
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.status === "DONE" ? "bg-emerald-500 text-white" : s.status === "SKIPPED" ? "bg-amber-500 text-black" : s.id === current?.id ? "bg-primary text-white" : "bg-white/[0.06] text-slate-400"}`}>
                      {s.status === "DONE" ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-medium ${s.status === "DONE" ? "text-slate-400 line-through" : "text-slate-100"}`}>{s.address}</p>
                      <p className="text-[12px] text-slate-500">
                        {[s.customerName, s.service].filter(Boolean).join(" · ")}
                        {s.doneBy && s.doneAt ? ` · ${s.status === "DONE" ? "done" : "skipped"} by ${s.doneBy.name} ${fmtTime(s.doneAt)}` : ""}
                        {s.crewNote ? ` · "${s.crewNote}"` : ""}
                      </p>
                      {s.photoUrls.length > 0 && (
                        <div className="mt-1.5 flex gap-1.5">
                          {s.photoUrls.slice(0, 5).map((u) => (
                            <a key={u} href={u} target="_blank" rel="noopener">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={u} alt="" className="h-12 w-12 rounded object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <form action={setStopStatus.bind(null, s.id, s.status === "PENDING" ? "DONE" : "PENDING")} className="shrink-0">
                      <button title={s.status === "PENDING" ? "Mark done (no photo)" : "Reopen"} className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white">{s.status === "PENDING" ? "done" : "reopen"}</button>
                    </form>
                  </li>
                ))}
                {p.stops.length === 0 && <li className="px-4 py-4 text-[13px] text-slate-500">No stops on this plan.</li>}
              </ul>
            </Panel>
          );
        })}
      </div>

      {crewsWithout.length > 0 && plans.length > 0 && (
        <p className="flex items-center gap-2 text-[13px] text-slate-500">
          <Clock className="h-3.5 w-3.5" /> No plan today: {crewsWithout.map((c) => c.name).join(", ")}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0E1322] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${warn ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
