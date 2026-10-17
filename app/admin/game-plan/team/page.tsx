import { KeyRound } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { seasonStart } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import {
  addMember, createCrew, deleteRule, saveRule, saveSeasonStart, setCrewPin, updateCrew, updateMember,
} from "../actions";

export const dynamic = "force-dynamic";

const input = "h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white";
const btn = "h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300 hover:bg-white/[0.05]";
const btnP = "h-9 rounded-sm bg-primary px-3 text-[13px] font-semibold text-white hover:bg-blue-500";

/** Team & PINs — crews, who's on them, sign-in PINs, point rules, season start. */
export default async function TeamPage() {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Crews live in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const [crews, rules, season] = await Promise.all([
    db.crew.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { members: { orderBy: [{ active: "desc" }, { name: "asc" }] } } }),
    db.pointRule.findMany({ orderBy: { sortOrder: "asc" } }),
    seasonStart(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Team & PINs" description="Crews, names, and the PIN each crew uses to sign in at /crew. Same crews as Dispatch." />
      <GamePlanTabs />

      <div className="grid gap-4 xl:grid-cols-2">
        {crews.map((c) => (
          <Panel
            key={c.id}
            title={c.name}
            icon={!c.active ? <Badge>inactive</Badge> : c.pinHash ? <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-200"><KeyRound className="h-3 w-3" /> PIN set</Badge> : <Badge cls="border-amber-500/30 bg-amber-500/10 text-amber-200">no PIN</Badge>}
          >
            <div className="flex flex-col gap-4">
              <form action={updateCrew} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Name<input id={`crew-name-${c.id}`} name="name" defaultValue={c.name} className={`${input} w-40`} /></label>
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Default truck<input id={`crew-truck-${c.id}`} name="truck" defaultValue={c.truck ?? ""} placeholder="Truck 2" className={`${input} w-28`} /></label>
                <label className="flex h-9 items-center gap-2 text-[13px] text-slate-300"><input id={`crew-active-${c.id}`} type="checkbox" name="active" defaultChecked={c.active} /> Active</label>
                <button className={btn}>Save</button>
              </form>

              <form action={setCrewPin} className="flex flex-wrap items-end gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">{c.pinHash ? "Change PIN" : "Set PIN"} (4 to 6 digits)
                  <input id={`crew-pin-${c.id}`} name="pin" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} placeholder="4411" className={`${input} w-28 tracking-[0.3em]`} />
                </label>
                <button className={btnP}>Save PIN</button>
                <span className="text-[12px] text-slate-500">Leave blank and save to remove the PIN (locks the crew out). Rotate it when someone leaves.</span>
              </form>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Members</p>
                <ul className="flex flex-col gap-1.5">
                  {c.members.map((m) => (
                    <li key={m.id}>
                      <form action={updateMember} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={m.id} />
                        <input id={`m-name-${m.id}`} name="name" defaultValue={m.name} className={`${input} w-40`} />
                        <select id={`m-crew-${m.id}`} name="crewId" defaultValue={m.crewId} className={input}>
                          {crews.filter((x) => x.active || x.id === m.crewId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                        <label className="flex items-center gap-1.5 text-[12px] text-slate-400"><input type="checkbox" name="active" defaultChecked={m.active} /> active</label>
                        <button className={btn}>Save</button>
                      </form>
                    </li>
                  ))}
                  {c.members.length === 0 && <li className="text-[13px] text-slate-500">No one yet.</li>}
                </ul>
                <form action={addMember} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="crewId" value={c.id} />
                  <input id={`add-m-${c.id}`} name="name" placeholder="Add a name" className={`${input} w-40`} required />
                  <input id={`add-t-${c.id}`} name="title" placeholder="Title (optional)" className={`${input} w-36`} />
                  <button className={btn}>Add</button>
                </form>
              </div>
            </div>
          </Panel>
        ))}

        <Panel title="New crew">
          <form action={createCrew} className="flex flex-wrap items-center gap-2">
            <input id="new-crew" name="name" placeholder="Crew name, e.g. Lawn 2" className={`${input} w-56`} required />
            <button className={btnP}>Create crew</button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Point rules" subtitle="One-tap reasons on the Points page. Rules with an auto trigger fire on their own; you can change the amount or turn them off, not delete them.">
          <ul className="flex flex-col gap-1.5">
            {rules.map((r) => (
              <li key={r.id}>
                <form action={saveRule} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input id={`rule-l-${r.id}`} name="label" defaultValue={r.label} className={`${input} w-64`} />
                  <input id={`rule-p-${r.id}`} name="points" type="number" defaultValue={r.points} className={`${input} w-20`} />
                  <label className="flex items-center gap-1.5 text-[12px] text-slate-400"><input type="checkbox" name="active" defaultChecked={r.active} /> on</label>
                  {r.autoKey && <Badge cls="border-sky-500/30 bg-sky-500/10 text-sky-200">auto: {r.autoKey === "stop_photo" ? "stop done with photo" : r.autoKey === "lead_won" ? "field lead marked won" : r.autoKey}</Badge>}
                  <button className={btn}>Save</button>
                  {!r.autoKey && <button formAction={deleteRule} className="text-[12px] text-slate-500 hover:text-red-300">delete</button>}
                </form>
              </li>
            ))}
          </ul>
          <form action={saveRule} className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            <input id="rule-new-l" name="label" placeholder="New rule, e.g. Helped another crew" className={`${input} w-64`} required />
            <input id="rule-new-p" name="points" type="number" placeholder="Pts" className={`${input} w-20`} required />
            <input type="hidden" name="active" value="on" />
            <button className={btn}>Add rule</button>
          </form>
        </Panel>

        <Panel title="Season" subtitle="Season totals count points from this date. Reset it each spring.">
          <form action={saveSeasonStart} className="flex items-center gap-2">
            <input id="season-start" type="date" name="seasonStart" defaultValue={season} className={input} />
            <button className={btn}>Save</button>
          </form>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
            Budget check: with a cash-out rate of, say, $0.25 a point, 10 points per photo'd stop is $2.50 a stop. Keep the total under 1 to 2 percent of crew payroll and it pays for itself in fewer callbacks.
          </p>
        </Panel>
      </div>
    </div>
  );
}
