import { Trophy } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { prettyDate, seasonStart, standings, weekStart, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge, th, td } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { AwardForm } from "@/components/admin/game-plan/award-form";
import { deletePointEntry } from "../actions";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Points live in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const [board, rules, ledger, season] = await Promise.all([
    standings(),
    db.pointRule.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.pointEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { member: { select: { name: true, crew: { select: { name: true } } } } },
    }),
    seasonStart(),
  ]);
  const members = board.map((b) => ({ id: b.memberId, name: b.name, crew: b.crewName }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Points"
        description={`Season from ${prettyDate(season)} · week of ${prettyDate(weekStart(ymd()))}`}
        meta={<Badge cls="border-amber-500/30 bg-amber-500/10 text-amber-200"><Trophy className="h-3 w-3" /> {board[0]?.name ?? "no leader yet"}</Badge>}
      />
      <GamePlanTabs />

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="Award or deduct">
          {members.length === 0 ? (
            <p className="text-[13px] text-slate-500">Add employees under Team first.</p>
          ) : (
            <AwardForm members={members} rules={rules.map((r) => ({ id: r.id, label: r.label, points: r.points }))} today={ymd()} />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Standings" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.06]"><th className={th}>#</th><th className={th}>Name</th><th className={th}>Crew</th><th className={`${th} text-right`}>Week</th><th className={`${th} text-right`}>Season</th></tr></thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {board.map((b, i) => (
                    <tr key={b.memberId}>
                      <td className={`${td} font-semibold ${i === 0 ? "text-amber-300" : "text-slate-500"}`}>{i + 1}</td>
                      <td className={`${td} font-medium text-slate-100`}>{b.name}</td>
                      <td className={`${td} text-slate-400`}>{b.crewName}</td>
                      <td className={`${td} text-right tabular-nums text-amber-200`}>{b.week > 0 ? "+" : ""}{b.week}</td>
                      <td className={`${td} text-right font-semibold tabular-nums text-white`}>{b.season}</td>
                    </tr>
                  ))}
                  {board.length === 0 && <tr><td colSpan={5} className={`${td} text-center text-slate-500`}>No active employees.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Ledger" subtitle="Latest 80 entries. Remove a mistake here; auto-awards show the stop address." bodyClassName="p-0">
            <ul className="divide-y divide-white/[0.05]">
              {ledger.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                  <span className={`w-12 shrink-0 text-right font-semibold tabular-nums ${e.points < 0 ? "text-red-300" : "text-emerald-300"}`}>{e.points > 0 ? "+" : ""}{e.points}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-slate-100">{e.member.name}</span>
                    <span className="text-slate-500"> · {e.member.crew.name} · </span>
                    <span className="text-slate-300">{e.reason}</span>
                    {e.note && !e.note.startsWith("lead:") && <span className="text-slate-500"> · {e.note}</span>}
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-slate-500">{e.date}</span>
                  <form action={deletePointEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-[11px] text-slate-500 hover:text-red-300">remove</button>
                  </form>
                </li>
              ))}
              {ledger.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-slate-500">No points yet.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
