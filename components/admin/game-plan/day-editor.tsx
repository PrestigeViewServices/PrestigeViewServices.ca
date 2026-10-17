"use client";

import { createRef, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { PlanEditor, type PlanEditorHandle } from "./plan-editor";

type EditorProps = React.ComponentProps<typeof PlanEditor>;
type CrewBlock = { crew: EditorProps["crew"]; plan: EditorProps["plan"] };

const input = "h-10 w-full rounded-md border border-white/10 bg-[#0A0E18] px-3 text-sm text-white outline-none focus:border-primary";
const label = "flex flex-col gap-1 text-[12px] font-medium text-slate-400";

/**
 * Tabs: "Day" holds what every crew shares (weather, mission, start,
 * heads-up). One tab per crew holds that crew's route; its other details
 * are folded behind one-line summaries. Post all saves every crew.
 */
export function DayEditor({ date, blocks, defaults, rules }: {
  date: string;
  blocks: CrewBlock[];
  defaults: EditorProps["defaults"];
  rules: EditorProps["rules"];
}) {
  const router = useRouter();
  const refs = useMemo(() => blocks.map(() => createRef<PlanEditorHandle>()), [blocks]);
  const [tab, setTab] = useState<string>("day");
  const [shared, setShared] = useState({ weather: "", mission: "", headsUp: "", startTime: "" });
  const [applied, setApplied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function go(d: string) {
    router.push(`/admin/game-plan?date=${d}`);
  }
  function applyAll(next?: string) {
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(shared)) if (v.trim()) patch[k] = v.trim();
    if (Object.keys(patch).length) refs.forEach((r) => r.current?.apply(patch));
    setApplied(true);
    if (next) setTab(next);
  }
  function postAll(publish: boolean) {
    setMsg(null);
    start(async () => {
      if (!applied) applyAll();
      const results = await Promise.all(refs.map((r) => r.current?.submit(publish) ?? Promise.resolve("failed" as const)));
      const saved = results.filter((r) => r === "saved").length;
      const skipped = results.filter((r) => r === "skipped").length;
      const failed = results.filter((r) => r === "failed").length;
      setMsg([
        saved ? (publish ? `Posted ${saved} crew${saved === 1 ? "" : "s"}.` : `Saved ${saved} draft${saved === 1 ? "" : "s"}.`) : null,
        skipped ? `Skipped ${skipped} with no stops.` : null,
        failed ? `${failed} failed, open that crew's tab.` : null,
      ].filter(Boolean).join(" ") || "Nothing to post yet.");
      router.refresh();
    });
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const first = blocks[0]?.crew.id;

  return (
    <div className="flex flex-col gap-4">
      {/* Date + Post all */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => go(shift(date, -1))} className="h-10 rounded-md border border-white/10 px-3 text-xs text-slate-300">Prev</button>
          <input id="day-date" type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)} className={`${input} w-44`} />
          <button type="button" onClick={() => go(shift(date, 1))} className="h-10 rounded-md border border-white/10 px-3 text-xs text-slate-300">Next</button>
          {date !== todayStr && <button type="button" onClick={() => go(todayStr)} className="h-10 rounded-md border border-white/10 px-3 text-xs text-slate-300">Today</button>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" disabled={pending} onClick={() => postAll(false)} className="h-10 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Save drafts</button>
          <button type="button" disabled={pending} onClick={() => postAll(true)} className="inline-flex h-10 items-center gap-1.5 rounded-sm bg-primary px-4 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {pending ? "Posting..." : "Post all crews"}
          </button>
        </div>
        {msg && <p className="basis-full text-[13px] text-slate-300">{msg}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.08]">
        <TabBtn active={tab === "day"} onClick={() => setTab("day")} dot={applied ? "ok" : "none"}>Day</TabBtn>
        {blocks.map((b) => (
          <TabBtn key={b.crew.id} active={tab === b.crew.id} onClick={() => setTab(b.crew.id)} dot={b.plan?.published ? "ok" : b.plan ? "warn" : "none"}>
            {b.crew.name}{b.plan ? <span className="ml-1.5 text-[11px] text-slate-500">{b.plan.stops.length}</span> : null}
          </TabBtn>
        ))}
      </div>

      {/* Day tab */}
      <div className={tab === "day" ? "" : "hidden"}>
        <section className="rounded-xl border border-white/[0.07] bg-[#0E1322] p-5">
          <p className="text-[13px] text-slate-400">Same for every crew today. Fill these, then go crew by crew and add the stops.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className={label}>Weather<input id="shared-weather" value={shared.weather} onChange={(e) => setShared({ ...shared, weather: e.target.value })} placeholder="Sunny, 14°C, wind pm" className={input} /></label>
            <label className={label}>Start time<input id="shared-start" value={shared.startTime} onChange={(e) => setShared({ ...shared, startTime: e.target.value })} placeholder="7:00 AM" className={input} /></label>
            <label className={`${label} sm:col-span-2`}>Today&apos;s mission<input id="shared-mission" value={shared.mission} onChange={(e) => setShared({ ...shared, mission: e.target.value })} placeholder={defaults.mission} className={`${input} h-11 text-[15px] font-semibold`} /></label>
            <label className={`${label} sm:col-span-2`}>Heads up<textarea id="shared-headsup" value={shared.headsUp} onChange={(e) => setShared({ ...shared, headsUp: e.target.value })} rows={3} placeholder="Anything out of the ordinary: new customer, picky client, road closure, equipment issue." className="w-full rounded-md border border-white/10 bg-[#0A0E18] px-3 py-2 text-sm text-white outline-none focus:border-primary" /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => applyAll(first)} className="h-10 rounded-sm bg-primary px-4 text-[13px] font-semibold text-white hover:bg-blue-500">
              Next: {blocks[0]?.crew.name ?? "crews"} →
            </button>
            <span className="text-[12px] text-slate-500">Applies to every crew. A crew tab can still override.</span>
          </div>
        </section>
        <p className="mt-3 text-[12px] text-slate-500">Gear list, quality standard, points and contact are prefilled from <Link href="/admin/game-plan/team" className="text-sky-300 underline-offset-2 hover:underline">Team</Link>.</p>
      </div>

      {/* Crew tabs: all mounted, one visible */}
      {blocks.map((b, i) => (
        <div key={b.crew.id} className={tab === b.crew.id ? "" : "hidden"}>
          <PlanEditor ref={refs[i]} crew={b.crew} date={date} defaults={defaults} rules={rules} plan={b.plan} onSaved={() => router.refresh()} />
          {i < blocks.length - 1 && (
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setTab(blocks[i + 1].crew.id)} className="h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300 hover:bg-white/[0.05]">Next: {blocks[i + 1].crew.name} →</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TabBtn({ active, onClick, dot, children }: { active: boolean; onClick: () => void; dot: "ok" | "warn" | "none"; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors ${active ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
      <span className={`h-2 w-2 rounded-full ${dot === "ok" ? "bg-emerald-400" : dot === "warn" ? "bg-amber-400" : "bg-slate-600"}`} />
      {children}
    </button>
  );
}

function shift(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
