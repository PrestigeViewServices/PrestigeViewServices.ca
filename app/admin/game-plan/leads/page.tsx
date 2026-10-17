import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge, th, td } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { setLeadStatus } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_CLS: Record<string, string> = {
  NEW: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  QUOTED: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  WON: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  LOST: "border-white/10 bg-white/[0.04] text-slate-400",
};

/** Field Leads — upsells the crews spotted. Quote them fast; the crew is paid when you mark WON. */
export default async function LeadsPage() {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Field leads live in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const leads = await db.fieldLead.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { crew: { select: { name: true } }, member: { select: { name: true } } },
  });
  const open = leads.filter((l) => l.status === "NEW").length;
  const won = leads.filter((l) => l.status === "WON").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Field Leads"
        description="Customers who asked a crew about another service. Call them the same day."
        meta={<><Badge cls={STATUS_CLS.NEW}>{open} new</Badge><Badge cls={STATUS_CLS.WON}>{won} won</Badge></>}
      />
      <GamePlanTabs />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]"><th className={th}>When</th><th className={th}>Address</th><th className={th}>Asked about</th><th className={th}>Note</th><th className={th}>From</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className={`${td} whitespace-nowrap text-slate-400`}>{l.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "America/Toronto" })}</td>
                  <td className={`${td} font-medium text-slate-100`}>{l.address}</td>
                  <td className={`${td} text-slate-200`}>{l.service}</td>
                  <td className={`${td} max-w-[320px] text-slate-400`}>{l.note}</td>
                  <td className={`${td} whitespace-nowrap text-slate-400`}>{l.member?.name ?? "?"} · {l.crew.name}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      {(["NEW", "QUOTED", "WON", "LOST"] as const).map((s) => (
                        <form key={s} action={setLeadStatus.bind(null, l.id, s)}>
                          <button className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${l.status === s ? STATUS_CLS[s] : "border-transparent text-slate-500 hover:text-slate-200"}`}>{s.charAt(0) + s.slice(1).toLowerCase()}</button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>No field leads yet. Crews flag them from a stop on their phone.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
