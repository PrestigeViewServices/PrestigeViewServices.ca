"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveWeek } from "@/app/admin/game-plan/actions";

type Day = { date: string; headline: string; startTime: string; truck: string; stopCount: number; published: boolean };
type CrewRow = { id: string; name: string; truck: string | null; days: Day[] };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const QUICK = ["Lawns Petawawa", "Lawns Pembroke", "Gutters", "Windows", "House wash", "Fall cleanup", "Snow", "Off", "Rain day"];

/**
 * Crew x day grid for one week. Each cell is the one-line headline the crew
 * sees in their week view, plus optional start time. Detailed stops still
 * get added per day on the Plan tab; a cell with stops shows the count and
 * links there.
 */
export function WeekGrid({ crews, weekStart: ws }: { crews: CrewRow[]; weekStart: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<CrewRow[]>(crews);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [focus, setFocus] = useState<string | null>(null);

  function update(crewId: string, date: string, patch: Partial<Day>) {
    setRows((rs) => rs.map((r) => (r.id !== crewId ? r : { ...r, days: r.days.map((d) => (d.date === date ? { ...d, ...patch } : d)) })));
    setDirty((s) => new Set(s).add(crewId));
  }
  function copyDown(date: string) {
    const first = rows[0]?.days.find((d) => d.date === date);
    if (!first) return;
    rows.slice(1).forEach((r) => update(r.id, date, { headline: first.headline, startTime: first.startTime }));
  }
  function save() {
    setMsg(null);
    start(async () => {
      try {
        for (const r of rows) {
          if (!dirty.has(r.id)) continue;
          await saveWeek({ crewId: r.id, days: r.days.map((d) => ({ date: d.date, headline: d.headline, startTime: d.startTime, truck: d.truck })) });
        }
        setDirty(new Set());
        setMsg("Week posted. Crews see it now.");
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  const dates = rows[0]?.days.map((d) => d.date) ?? [];
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#0E1322]">
        <table className="w-full min-w-[880px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="w-36 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Crew</th>
              {dates.map((d, i) => (
                <th key={d} className={`px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] ${d === todayStr ? "text-sky-300" : "text-slate-500"}`}>
                  {DOW[i]} <span className="font-normal text-slate-500">{Number(d.slice(8, 10))}</span>
                  {rows.length > 1 && <button type="button" onClick={() => copyDown(d)} title="Copy first row down" className="ml-1 text-[10px] normal-case tracking-normal text-slate-600 hover:text-slate-300">copy ↓</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 align-top">
                  <p className="text-[13px] font-semibold text-slate-100">{r.name}</p>
                  {r.truck && <p className="text-[11px] text-slate-500">{r.truck}</p>}
                </td>
                {r.days.map((d) => {
                  const key = `${r.id}:${d.date}`;
                  return (
                    <td key={d.date} className={`px-1.5 py-1.5 align-top ${d.date === todayStr ? "bg-primary/[0.06]" : ""}`}>
                      <input
                        id={`wk-${key}`}
                        value={d.headline}
                        placeholder={d.stopCount ? `${d.stopCount} stops` : "Off / what's the day"}
                        onChange={(e) => update(r.id, d.date, { headline: e.target.value })}
                        onFocus={() => setFocus(key)}
                        onBlur={() => setTimeout(() => setFocus((f) => (f === key ? null : f)), 150)}
                        className={`h-9 w-full rounded-md border bg-[#0A0E18] px-2 text-[13px] text-white outline-none focus:border-primary ${d.headline || d.stopCount ? "border-white/15" : "border-white/[0.06]"}`}
                      />
                      {focus === key && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {QUICK.map((q) => (
                            <button key={q} type="button" onMouseDown={(e) => { e.preventDefault(); update(r.id, d.date, { headline: q }); }} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 hover:border-primary">{q}</button>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          id={`wks-${key}`}
                          value={d.startTime}
                          placeholder="7:00 AM"
                          onChange={(e) => update(r.id, d.date, { startTime: e.target.value })}
                          className="h-7 w-full rounded border border-white/[0.06] bg-transparent px-1.5 text-[11px] text-slate-300 outline-none focus:border-primary"
                        />
                        <Link href={`/admin/game-plan?crew=${r.id}&date=${d.date}`} title="Open day plan" className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${d.stopCount ? "bg-emerald-500/15 text-emerald-200" : "text-slate-500 hover:text-white"}`}>
                          {d.stopCount ? `${d.stopCount} stops` : "+ stops"}
                        </Link>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending || dirty.size === 0} onClick={save} className="inline-flex h-10 items-center rounded-sm bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          {pending ? "Saving..." : "Post week to crews"}
        </button>
        {dirty.size > 0 && !pending && <span className="text-[12px] text-amber-300">Unsaved changes</span>}
        {msg && <span className="text-[13px] text-slate-300">{msg}</span>}
        <span className="ml-auto text-[12px] text-slate-500">One line per day is enough. Add stops on the Plan tab the night before.</span>
      </div>
    </div>
  );
}
