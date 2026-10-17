import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { seasonStart, weekStart, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge, adminBtn } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { MemberPinForm } from "@/components/admin/game-plan/member-pin-form";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

/** One person: points, stops done with photos, leads flagged, issues raised. */
export default async function MemberPage(props: { params: Promise<{ memberId: string }> }) {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Team data lives in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const { memberId } = await props.params;
  const m = await db.crewMember.findUnique({ where: { id: memberId }, include: { crew: { select: { name: true } } } });
  if (!m) notFound();

  const [season, points, stops, leads, issues] = await Promise.all([
    seasonStart(),
    db.pointEntry.findMany({ where: { memberId }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.gamePlanStop.findMany({ where: { doneById: memberId }, orderBy: { doneAt: "desc" }, take: 60, include: { plan: { select: { date: true } } } }),
    db.fieldLead.findMany({ where: { memberId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.fieldIssue.findMany({ where: { memberId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const ws = weekStart(ymd());
  const total = (from: string) => points.filter((p) => p.date >= from).reduce((n, p) => n + p.points, 0);
  const done = stops.filter((s) => s.status === "DONE");
  const photos = done.reduce((n, s) => n + s.photoUrls.length, 0);
  const last30 = ymd(new Date(Date.now() - 30 * 86400000));
  const stops30 = done.filter((s) => s.plan.date >= last30).length;
  const withPhoto30 = done.filter((s) => s.plan.date >= last30 && s.photoUrls.length > 0).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={m.name}
        description={[m.title, m.crew.name, m.phone].filter(Boolean).join(" · ")}
        meta={<>
          {!m.active && <Badge>inactive</Badge>}
          {m.pinHash ? <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">PIN set</Badge> : <Badge cls="border-amber-500/30 bg-amber-500/10 text-amber-200">no PIN</Badge>}
          {m.lastSeenAt && <Badge>last seen {fmt(m.lastSeenAt)}</Badge>}
        </>}
        actions={<Link href="/admin/game-plan/team" className={adminBtn.secondary}><ChevronLeft className="h-3.5 w-3.5" /> Team</Link>}
      />
      <GamePlanTabs />

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="This week" value={total(ws)} accent />
        <Stat label="Season" value={total(season)} />
        <Stat label="Stops done, 30 days" value={stops30} />
        <Stat label="With photos" value={stops30 ? `${Math.round((withPhoto30 / stops30) * 100)}%` : "–"} warn={stops30 > 0 && withPhoto30 / stops30 < 0.9} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Sign-in" subtitle="Their personal PIN for /crew. Change it if it leaks; remove it to lock them out.">
          <MemberPinForm memberId={m.id} hasPin={!!m.pinHash} />
        </Panel>
        <Panel title="Points ledger" subtitle={`${points.length} entries`} bodyClassName="p-0">
          <ul className="max-h-80 divide-y divide-white/[0.05] overflow-y-auto">
            {points.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                <span className={`w-12 shrink-0 text-right font-semibold tabular-nums ${e.points < 0 ? "text-red-300" : "text-emerald-300"}`}>{e.points > 0 ? "+" : ""}{e.points}</span>
                <span className="min-w-0 flex-1 truncate text-slate-200">{e.reason}{e.note && !e.note.startsWith("lead:") ? <span className="text-slate-500"> · {e.note}</span> : null}</span>
                <span className="shrink-0 text-[12px] text-slate-500">{e.date}</span>
              </li>
            ))}
            {points.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-slate-500">No points yet.</li>}
          </ul>
        </Panel>
      </div>

      <Panel title="Stops completed" subtitle={`${done.length} shown · ${photos} photos`}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stops.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[13px] font-medium text-slate-100">{s.address}</p>
              <p className="text-[12px] text-slate-500">{s.plan.date}{s.service ? ` · ${s.service}` : ""}{s.status === "SKIPPED" ? " · skipped" : ""}{s.doneAt ? ` · ${fmt(s.doneAt)}` : ""}</p>
              {s.crewNote && <p className="mt-1 text-[12px] italic text-slate-400">&ldquo;{s.crewNote}&rdquo;</p>}
              {s.photoUrls.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {s.photoUrls.slice(0, 4).map((u) => (
                    <a key={u} href={u} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.replace("/upload/", "/upload/c_fill,w_200,h_200,q_auto,f_auto/")} alt="" loading="lazy" className="h-14 w-14 rounded object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {stops.length === 0 && <p className="text-[13px] text-slate-500">No stops completed yet.</p>}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Leads flagged" subtitle={`${leads.filter((l) => l.status === "WON").length} won of ${leads.length}`} bodyClassName="p-0">
          <ul className="divide-y divide-white/[0.05]">
            {leads.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate"><span className="text-slate-100">{l.address}</span> <span className="text-slate-500">· {l.service}</span></span>
                <Badge cls={l.status === "WON" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : undefined}>{l.status.toLowerCase()}</Badge>
              </li>
            ))}
            {leads.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-slate-500">No leads flagged yet.</li>}
          </ul>
        </Panel>
        <Panel title="Issues reported" subtitle={`${issues.filter((i) => i.status === "OPEN").length} open`} bodyClassName="p-0">
          <ul className="divide-y divide-white/[0.05]">
            {issues.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-slate-200">{i.note}</span>
                <span className="text-[12px] text-slate-500">{i.kind.toLowerCase()} · {i.status.toLowerCase()}</span>
              </li>
            ))}
            {issues.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-slate-500">None.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0E1322] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${warn ? "text-amber-300" : accent ? "text-amber-200" : "text-white"}`}>{value}</p>
    </div>
  );
}
