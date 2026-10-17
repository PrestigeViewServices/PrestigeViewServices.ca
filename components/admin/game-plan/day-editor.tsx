"use client";

import { createRef, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Send } from "lucide-react";
import { PlanEditor, type PlanEditorHandle } from "./plan-editor";

type EditorProps = React.ComponentProps<typeof PlanEditor>;
type CrewBlock = { crew: EditorProps["crew"]; plan: EditorProps["plan"] };

const input = "h-9 w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white outline-none focus:border-primary";
const label = "flex flex-col gap-1 text-[12px] font-medium text-slate-400";

/**
 * One date, every active crew. Shared fields (weather, mission, heads up,
 * start) type once and push to all crews; each crew's block below holds its
 * own lead, truck, gear, route. "Post all" saves every crew in one click.
 */
export function DayEditor({ date, blocks, defaults, rules }: {
  date: string;
  blocks: CrewBlock[];
  defaults: EditorProps["defaults"];
  rules: EditorProps["rules"];
}) {
  const router = useRouter();
  const refs = useMemo(() => blocks.map(() => createRef<PlanEditorHandle>()), [blocks]);
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(blocks.map((b, i) => [b.crew.id, i === 0 || !!b.plan])));
  const [shared, setShared] = useState({ weather: "", mission: "", headsUp: "", startTime: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function go(d: string) {
    router.push(`/admin/game-plan?date=${d}`);
  }
  function applyAll() {
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(shared)) if (v.trim()) patch[k] = v.trim();
    if (!Object.keys(patch).length) return setMsg("Type something above first.");
    refs.forEach((r) => r.current?.apply(patch));
    setOpen(Object.fromEntries(blocks.map((b) => [b.crew.id, true])));
    setMsg(`Applied to ${blocks.length} crew${blocks.length === 1 ? "" : "s"}. Review below, then Post all.`);
  }
  function postAll(publish: boolean) {
    setMsg(null);
    start(async () => {
      const results = await Promise.all(refs.map((r) => r.current?.submit(publish) ?? Promise.resolve("failed" as const)));
      const saved = results.filter((r) => r === "saved").length;
      const skipped = results.filter((r) => r === "skipped").length;
      const failed = results.filter((r) => r === "failed").length;
      const parts = [
        saved ? (publish ? `Posted ${saved} crew${saved === 1 ? "" : "s"}. Phones update within 20 seconds.` : `Saved ${saved} draft${saved === 1 ? "" : "s"}.`) : null,
        skipped ? `Skipped ${skipped} with no stops yet.` : null,
        failed ? `${failed} failed, see the crew block.` : null,
      ].filter(Boolean);
      setMsg(parts.join(" ") || "Nothing to post yet.");
      router.refresh();
    });
  }
  function jump(id: string) {
    setOpen((o) => ({ ...o, [id]: true }));
    setTimeout(() => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

  return (
    <div className="flex flex-col gap-4">
      {/* Date + crew status strip */}
      <div className="sticky top-14 z-20 -mx-1 rounded-xl border border-white/[0.07] bg-[#0E1322]/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(shift(date, -1))} className="h-9 rounded-md border border-white/10 px-2 text-xs text-slate-300">Prev</button>
            <input id="day-date" type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)} className={`${input} w-40`} />
            <button type="button" onClick={() => go(shift(date, 1))} className="h-9 rounded-md border border-white/10 px-2 text-xs text-slate-300">Next</button>
            {date !== todayStr && <button type="button" onClick={() => go(todayStr)} className="h-9 rounded-md border border-white/10 px-2 text-xs text-slate-300">Today</button>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {blocks.map((b) => (
              <button key={b.crew.id} type="button" onClick={() => jump(b.crew.id)} className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium ${b.plan?.published ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : b.plan ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-white/10 text-slate-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${b.plan?.published ? "bg-emerald-400" : b.plan ? "bg-amber-400" : "bg-slate-600"}`} />
                {b.crew.name}
                {b.plan ? <span className="text-slate-500">{b.plan.stops.length}</span> : null}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" disabled={pending} onClick={() => postAll(false)} className="h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Save all drafts</button>
            <button type="button" disabled={pending} onClick={() => postAll(true)} className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" /> {pending ? "Posting..." : "Post all crews"}
            </button>
          </div>
        </div>
        {msg && <p className="mt-2 text-[12px] text-slate-300">{msg}</p>}
      </div>

      {/* Shared, type once */}
      <section className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-300">Same for every crew</h2>
            <p className="text-[11.5px] text-slate-500">Type once, apply to all. Leave a field blank to keep each crew&apos;s own value.</p>
          </div>
          <button type="button" onClick={applyAll} className="h-9 shrink-0 rounded-sm border border-sky-400/40 bg-sky-400/10 px-3 text-[13px] font-semibold text-sky-100 hover:bg-sky-400/20">Apply to all crews</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <label className={label}>Weather<input id="shared-weather" value={shared.weather} onChange={(e) => setShared({ ...shared, weather: e.target.value })} placeholder="Sunny, 14°C, wind pm" className={input} /></label>
          <label className={label}>Today&apos;s mission<input id="shared-mission" value={shared.mission} onChange={(e) => setShared({ ...shared, mission: e.target.value })} placeholder={defaults.mission} className={input} /></label>
          <label className={label}>Start<input id="shared-start" value={shared.startTime} onChange={(e) => setShared({ ...shared, startTime: e.target.value })} placeholder="7:00 AM" className={input} /></label>
          <label className={`${label} sm:col-span-3`}>Heads up<input id="shared-headsup" value={shared.headsUp} onChange={(e) => setShared({ ...shared, headsUp: e.target.value })} placeholder="Paquette Rd closed at the bridge, go around by Murphy." className={input} /></label>
        </div>
      </section>

      {/* One block per crew */}
      {blocks.map((b, i) => (
        <div key={b.crew.id} ref={(el) => { sectionRefs.current[b.crew.id] = el; }} className="scroll-mt-32 rounded-2xl border border-white/[0.08]">
          <button type="button" onClick={() => setOpen((o) => ({ ...o, [b.crew.id]: !o[b.crew.id] }))} className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${b.plan?.published ? "bg-emerald-400" : b.plan ? "bg-amber-400" : "bg-slate-600"}`} />
              <span className="font-display text-lg font-semibold text-white">{b.crew.name}</span>
              <span className="text-[12px] text-slate-500">
                {b.crew.members.find((m) => m.rank === "CREW_LEAD" || m.rank === "FIELD_SUPERVISOR")?.name ?? b.crew.members[0]?.name ?? "no one assigned"}
                {b.crew.members.length > 1 ? ` +${b.crew.members.length - 1}` : ""}
                {b.crew.truck ? ` · ${b.crew.truck}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-slate-500">
              {b.plan ? <span>{b.plan.published ? "Posted" : "Draft"} · {b.plan.stops.length} stop{b.plan.stops.length === 1 ? "" : "s"}</span> : <span>Not planned</span>}
              <ChevronDown className={`h-4 w-4 transition ${open[b.crew.id] ? "rotate-180" : ""}`} />
            </div>
          </button>
          <div className={open[b.crew.id] ? "border-t border-white/[0.06] p-4" : "hidden"}>
            <PlanEditor ref={refs[i]} crew={b.crew} date={date} defaults={defaults} rules={rules} plan={b.plan} onSaved={() => router.refresh()} />
          </div>
        </div>
      ))}
    </div>
  );
}

function shift(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
