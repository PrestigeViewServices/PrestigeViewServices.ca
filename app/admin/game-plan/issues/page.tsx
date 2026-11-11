import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { setIssueStatus } from "../actions";

export const dynamic = "force-dynamic";

const KIND_CLS: Record<string, string> = {
  DAMAGE: "border-red-500/30 bg-red-500/10 text-red-200",
  EQUIPMENT: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  SAFETY: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  CUSTOMER: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  OTHER: "border-white/10 bg-white/[0.04] text-slate-300",
};

/** Issues — damage, equipment down, safety, customer trouble. From the field, with photos. */
export default async function IssuesPage() {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Issues live in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const issues = await db.fieldIssue.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 150,
    include: { crew: { select: { name: true } }, member: { select: { name: true } }, stop: { select: { address: true } } },
  });
  const open = issues.filter((i) => i.status === "OPEN");
  const closed = issues.filter((i) => i.status === "RESOLVED");

  const Row = ({ i }: { i: (typeof issues)[number] }) => (
    <li className="flex gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge cls={KIND_CLS[i.kind]}>{i.kind.charAt(0) + i.kind.slice(1).toLowerCase()}</Badge>
          <span className="text-[12px] text-slate-500">
            {i.createdAt.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" })} · {i.member?.name ?? "?"} · {i.crew.name}{i.stop ? ` · ${i.stop.address}` : ""}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-slate-200">{i.note}</p>
        {i.photoUrls.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {i.photoUrls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.replace("/upload/", "/upload/c_fill,w_200,h_200,q_auto,f_auto/")} alt="" className="h-16 w-16 rounded object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>
      <form action={setIssueStatus.bind(null, i.id, i.status === "OPEN" ? "RESOLVED" : "OPEN")} className="shrink-0">
        {i.status === "OPEN" ? (
          <button className="rounded-sm border border-emerald-500/30 px-2.5 py-1 text-[12px] font-medium text-emerald-200 hover:bg-emerald-500/10">Resolve</button>
        ) : (
          <button className="rounded-sm border border-white/10 px-2.5 py-1 text-[12px] text-slate-400 hover:text-white">Reopen</button>
        )}
      </form>
    </li>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Issues" description="Damage, equipment, safety and customer problems reported from the truck." meta={<Badge cls={open.length ? KIND_CLS.DAMAGE : KIND_CLS.OTHER}>{open.length} open</Badge>} />
      <GamePlanTabs />
      <Panel title="Open" bodyClassName="p-0">
        <ul className="divide-y divide-white/[0.05]">
          {open.map((i) => <Row key={i.id} i={i} />)}
          {open.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-slate-500">Nothing open. Good day.</li>}
        </ul>
      </Panel>
      {closed.length > 0 && (
        <Panel title="Resolved" bodyClassName="p-0">
          <ul className="divide-y divide-white/[0.05] opacity-70">{closed.map((i) => <Row key={i.id} i={i} />)}</ul>
        </Panel>
      )}
    </div>
  );
}
