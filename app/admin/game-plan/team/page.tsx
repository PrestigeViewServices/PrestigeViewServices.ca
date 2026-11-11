import Link from "next/link";
import { KeyRound } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { RANKS, RANK_LABEL, planDefaults, seasonStart, standings } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel, Badge } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { MemberPinForm } from "@/components/admin/game-plan/member-pin-form";
import {
  addMember, createCrew, deleteRule, savePlanDefaults, saveRule, saveSeasonStart, updateCrew, updateMember,
} from "../actions";

export const dynamic = "force-dynamic";

const input = "h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white";
const btn = "h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300 hover:bg-white/[0.05]";
const btnP = "h-9 rounded-sm bg-primary px-3 text-[13px] font-semibold text-white hover:bg-blue-500";

function lastSeen(d: Date | null) {
  if (!d) return "never signed in";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 2) return "online now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 36) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "America/Toronto" });
}

/** Team — every person with their own PIN, crew, status, points and last sign-in. */
export default async function TeamPage() {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Crews live in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const [crews, rules, season, board, defaults] = await Promise.all([
    db.crew.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { members: { orderBy: [{ active: "desc" }, { rank: "asc" }, { name: "asc" }] } } }),
    db.pointRule.findMany({ orderBy: { sortOrder: "asc" } }),
    seasonStart(),
    standings(),
    planDefaults(),
  ]);
  const pts = new Map(board.map((b) => [b.memberId, b]));
  const noPin = crews.flatMap((c) => c.members).filter((m) => m.active && !m.pinHash);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Each person signs in to /crew with their own PIN. Crew Lead and above see customer phone numbers marked leads-only. Tap a name for their profile."
        meta={noPin.length ? <Badge cls="border-amber-500/30 bg-amber-500/10 text-amber-200">{noPin.length} without a PIN</Badge> : <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">everyone has a PIN</Badge>}
      />
      <GamePlanTabs />

      <div className="grid gap-4 xl:grid-cols-2">
        {crews.map((c) => (
          <Panel key={c.id} title={c.name} icon={!c.active ? <Badge>inactive</Badge> : undefined} subtitle={`${c.members.filter((m) => m.active).length} active`}>
            <div className="flex flex-col gap-4">
              <form action={updateCrew} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Crew name<input id={`crew-name-${c.id}`} name="name" defaultValue={c.name} className={`${input} w-40`} /></label>
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Default truck<input id={`crew-truck-${c.id}`} name="truck" defaultValue={c.truck ?? ""} placeholder="Truck 2" className={`${input} w-28`} /></label>
                <label className="flex h-9 items-center gap-2 text-[13px] text-slate-300"><input id={`crew-active-${c.id}`} type="checkbox" name="active" defaultChecked={c.active} /> Active</label>
                <button className={btn}>Save</button>
              </form>

              <ul className="divide-y divide-white/[0.05] rounded-lg border border-white/[0.06]">
                {c.members.map((m) => {
                  const p = pts.get(m.id);
                  return (
                    <li key={m.id} className={`flex flex-col gap-2 p-3 ${m.active ? "" : "opacity-60"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/admin/game-plan/team/${m.id}`} className="text-[14px] font-semibold text-white hover:text-sky-300">
                          {m.name}
                          <span className={`ml-2 rounded px-1.5 py-px text-[11px] font-medium ${m.rank === "FIELD_SUPERVISOR" ? "bg-amber-400/15 text-amber-200" : m.rank === "CREW_LEAD" ? "bg-sky-400/15 text-sky-200" : "bg-white/[0.06] text-slate-300"}`}>{RANK_LABEL[m.rank]}</span>
                          {m.title ? <span className="ml-1.5 text-[12px] font-normal text-slate-500">{m.title}</span> : null}
                        </Link>
                        <div className="flex items-center gap-2 text-[12px] text-slate-400">
                          {m.pinHash ? <Badge cls="border-emerald-500/30 bg-emerald-500/10 text-emerald-200"><KeyRound className="h-3 w-3" /> PIN set</Badge> : <Badge cls="border-amber-500/30 bg-amber-500/10 text-amber-200">no PIN</Badge>}
                          <span>{lastSeen(m.lastSeenAt)}</span>
                          <span className="tabular-nums text-amber-200">{p?.season ?? 0} pts</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={updateMember} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input id={`m-name-${m.id}`} name="name" defaultValue={m.name} className={`${input} w-36`} />
                          <select id={`m-rank-${m.id}`} name="rank" defaultValue={m.rank} className={input}>
                            {RANKS.map((r) => <option key={r} value={r}>{RANK_LABEL[r]}</option>)}
                          </select>
                          <input id={`m-title-${m.id}`} name="title" defaultValue={m.title ?? ""} placeholder="Note (e.g. snow certified)" className={`${input} w-36`} />
                          <input id={`m-phone-${m.id}`} name="phone" defaultValue={m.phone ?? ""} placeholder="Phone" className={`${input} w-32`} />
                          <select id={`m-crew-${m.id}`} name="crewId" defaultValue={m.crewId} className={input}>
                            {crews.filter((x) => x.active || x.id === m.crewId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                          <label className="flex items-center gap-1.5 text-[12px] text-slate-400"><input type="checkbox" name="active" defaultChecked={m.active} /> active</label>
                          <button className={btn}>Save</button>
                        </form>
                        <MemberPinForm memberId={m.id} hasPin={!!m.pinHash} />
                      </div>
                    </li>
                  );
                })}
                {c.members.length === 0 && <li className="p-3 text-[13px] text-slate-500">No one on this crew yet.</li>}
              </ul>

              <form action={addMember} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-white/10 p-3">
                <input type="hidden" name="crewId" value={c.id} />
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Add a person<input id={`add-m-${c.id}`} name="name" placeholder="Name" className={`${input} w-36`} required /></label>
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">Position
                  <select id={`add-r-${c.id}`} name="rank" defaultValue="TECHNICIAN" className={input}>
                    {RANKS.map((r) => <option key={r} value={r}>{RANK_LABEL[r]}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[12px] text-slate-400">PIN<input id={`add-p-${c.id}`} name="pin" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} placeholder="4 to 6 digits" className={`${input} w-28 tracking-[0.2em]`} /></label>
                <button className={btnP}>Add</button>
              </form>
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

      <Panel title="Daily plan defaults" subtitle="What every new game plan starts with. One item per line. You can still edit per day.">
        <form action={savePlanDefaults} className="grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-[12px] text-slate-400">Gear check (before you leave)
            <textarea id="def-gear" name="gear" rows={5} defaultValue={defaults.gear.join("\n")} className="rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 text-sm text-white" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-slate-400">Quality standard (before you leave every stop)
            <textarea id="def-quality" name="quality" rows={5} defaultValue={defaults.quality.join("\n")} className="rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 text-sm text-white" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-slate-400">End of day
            <textarea id="def-eod" name="endOfDay" rows={5} defaultValue={defaults.endOfDay.join("\n")} className="rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 text-sm text-white" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-slate-400">Default mission
            <input id="def-mission" name="mission" defaultValue={defaults.mission} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-slate-400">Questions contact (shown at the bottom of every plan)
            <input id="def-contact" name="contact" defaultValue={defaults.contact} placeholder="AG 613-555-0100 / Luke 613-555-0101" className={input} />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[12px] text-slate-400">Tomorrow&apos;s plan drops at
              <input id="def-drop" name="tomorrowDrop" defaultValue={defaults.tomorrowDrop} placeholder="8 PM" className={input} />
            </label>
            <button className={btnP}>Save defaults</button>
          </div>
        </form>
      </Panel>

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
            Budget check: at $0.25 a point, 10 points per photographed stop is $2.50 a stop. Keep the total under 1 to 2 percent of crew payroll and it pays for itself in fewer callbacks.
          </p>
        </Panel>
      </div>
    </div>
  );
}
