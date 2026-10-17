"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash2 } from "lucide-react";
import { savePlan, deletePlan, copyPreviousPlan, type PlanInput } from "@/app/admin/game-plan/actions";

type StopDraft = { id?: string; address: string; service: string; note: string; status?: string; photos?: number };
type Props = {
  crews: { id: string; name: string; truck: string | null }[];
  crewId: string;
  date: string;
  plan: {
    id: string;
    headline: string | null;
    truck: string | null;
    startTime: string | null;
    brief: string | null;
    published: boolean;
    updatedAt: string;
    stops: { id: string; address: string; service: string | null; note: string | null; status: string; photoUrls: string[] }[];
  } | null;
};

export function PlanEditor({ crews, crewId, date, plan }: Props) {
  const router = useRouter();
  const crew = crews.find((c) => c.id === crewId);
  const [headline, setHeadline] = useState(plan?.headline ?? "");
  const [truck, setTruck] = useState(plan?.truck ?? "");
  const [startTime, setStartTime] = useState(plan?.startTime ?? "");
  const [brief, setBrief] = useState(plan?.brief ?? "");
  const [published, setPublished] = useState(plan?.published ?? true);
  const [stops, setStops] = useState<StopDraft[]>(
    plan?.stops.map((s) => ({ id: s.id, address: s.address, service: s.service ?? "", note: s.note ?? "", status: s.status, photos: s.photoUrls.length })) ?? []
  );
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function go(next: { crewId?: string; date?: string }) {
    const p = new URLSearchParams({ crew: next.crewId ?? crewId, date: next.date ?? date });
    router.push(`/admin/game-plan?${p}`);
  }

  function update(i: number, patch: Partial<StopDraft>) {
    setStops((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function move(i: number, dir: -1 | 1) {
    setStops((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function addBulk() {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setStops((s) => [
      ...s,
      ...lines.map((l) => {
        // "123 Main St | mow + trim | gate code 4411"
        const [address = "", service = "", note = ""] = l.split("|").map((x) => x.trim());
        return { address, service, note };
      }),
    ]);
    setBulk("");
  }

  function submit(publish: boolean) {
    setMsg(null);
    const input: PlanInput = {
      crewId, date, headline, truck, startTime, brief, published: publish,
      stops: stops.filter((s) => s.address.trim()).map(({ id, address, service, note }) => ({ id, address, service, note })),
    };
    start(async () => {
      try {
        await savePlan(input);
        setPublished(publish);
        setMsg(publish ? "Posted. Crews see it now." : "Saved as draft (hidden from crews).");
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  const doneCount = stops.filter((s) => s.status && s.status !== "PENDING").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        {/* Header controls */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-[#0E1322] p-4">
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Crew
            <select id="plan-crew" value={crewId} onChange={(e) => go({ crewId: e.target.value })} className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white">
              {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Date
            <input id="plan-date" type="date" value={date} onChange={(e) => e.target.value && go({ date: e.target.value })} className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
          </label>
          <div className="flex gap-1">
            <button type="button" onClick={() => go({ date: shift(date, -1) })} className="h-9 rounded-md border border-white/10 px-2 text-xs text-slate-300">Prev</button>
            <button type="button" onClick={() => go({ date: shift(date, 1) })} className="h-9 rounded-md border border-white/10 px-2 text-xs text-slate-300">Next</button>
          </div>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Day headline (week view)
            <input id="plan-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Lawns Pembroke" className="h-9 w-40 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Truck
            <input id="plan-truck" value={truck} onChange={(e) => setTruck(e.target.value)} placeholder={crew?.truck ?? "Truck 2"} className="h-9 w-28 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Start
            <input id="plan-start" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="7:00 AM" className="h-9 w-24 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
          </label>
          <div className="ml-auto text-right text-[12px] text-slate-500">
            {plan ? (
              <>
                <span className={published ? "text-emerald-300" : "text-amber-300"}>{published ? "Posted" : "Draft"}</span>
                <span> · {doneCount}/{stops.length} done</span>
              </>
            ) : "Not posted yet"}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Morning brief (2 or 3 lines; shows at the top of the crew's screen)
          <textarea id="plan-brief" value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder="Rain until 10, start with gutters. Mrs. Lalonde at stop 3 has a dog, close the gate behind you." className="rounded-xl border border-white/10 bg-[#0E1322] px-3 py-2 text-sm text-white" />
        </label>

        {/* Stops */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0E1322]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-slate-100">Stops in order</h2>
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={() => start(async () => { const r = await copyPreviousPlan(crewId, date); setMsg(r.ok ? "Copied last plan as a draft. Edit, then post." : r.error); router.refresh(); })} className="inline-flex h-8 items-center gap-1 rounded-sm border border-white/[0.09] px-2.5 text-xs text-slate-300 hover:bg-white/[0.05]"><Copy className="h-3.5 w-3.5" /> Copy last plan</button>
              <button type="button" onClick={() => setStops((s) => [...s, { address: "", service: "", note: "" }])} className="inline-flex h-8 items-center gap-1 rounded-sm bg-primary px-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Stop</button>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {stops.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No stops yet. Add one, paste a list below, or copy the last plan.</p>}
            {stops.map((s, i) => (
              <div key={s.id ?? `new-${i}`} className="grid grid-cols-[28px_1fr_auto] gap-2 p-3">
                <div className={`mt-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${s.status === "DONE" ? "bg-emerald-500 text-white" : s.status === "SKIPPED" ? "bg-amber-500 text-black" : "bg-white/[0.06] text-sky-300"}`}>{s.status === "DONE" ? <Check className="h-3 w-3" /> : i + 1}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input id={`stop-addr-${i}`} value={s.address} onChange={(e) => update(i, { address: e.target.value })} placeholder="Address" className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
                  <input id={`stop-svc-${i}`} value={s.service} onChange={(e) => update(i, { service: e.target.value })} placeholder="Service (mow + trim, gutters, windows...)" className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
                  <input id={`stop-note-${i}`} value={s.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Note for the crew (gate code, dog, customer home)" className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white sm:col-span-2" />
                  {s.photos ? <p className="text-[11px] text-slate-500 sm:col-span-2">{s.photos} photo{s.photos > 1 ? "s" : ""} uploaded</p> : null}
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-white/[0.06]"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-white/[0.06]"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label="Remove" onClick={() => setStops((x) => x.filter((_, j) => j !== i))} className="rounded p-1 text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Paste a list (one stop per line; use | to add service and note)
              <textarea id="plan-bulk" value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"12 Hilda St | mow + trim | dog in yard\n48 Festubert Blvd | gutters"} className="rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 font-mono text-xs text-white" />
            </label>
            <button type="button" onClick={addBulk} disabled={!bulk.trim()} className="mt-2 h-8 rounded-sm border border-white/[0.09] px-3 text-xs text-slate-300 disabled:opacity-40">Add these stops</button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={pending} onClick={() => submit(true)} className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? "Saving..." : "Post to crew"}
          </button>
          <button type="button" disabled={pending} onClick={() => submit(false)} className="h-10 rounded-sm border border-white/[0.09] px-4 text-sm text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Save draft</button>
          {plan && (
            <button type="button" disabled={pending} onClick={() => start(async () => { await deletePlan(plan.id); router.refresh(); setStops([]); setBrief(""); setMsg("Plan deleted."); })} className="ml-auto h-10 rounded-sm border border-red-500/30 px-3 text-sm text-red-300 hover:bg-red-500/10">Delete plan</button>
          )}
          {msg && <span className="basis-full text-[13px] text-slate-300">{msg}</span>}
        </div>
      </div>

      {/* Phone preview */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-[28px] border border-white/10 bg-[#090D18] p-4 shadow-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300">{crew?.name ?? "Crew"}</p>
          <p className="font-display mt-1 text-lg font-bold">{pretty(date)}</p>
          <p className="mt-1 text-[12px] text-slate-400">{[truck || crew?.truck ? (/^truck/i.test(truck || crew?.truck || "") ? (truck || crew?.truck) : `Truck ${truck || crew?.truck}`) : null, startTime ? `Start ${startTime}` : null].filter(Boolean).join(" · ") || "Truck and start time appear here"}</p>
          {brief && <p className="mt-3 whitespace-pre-wrap rounded-lg border-l-4 border-primary bg-white/[0.03] px-2 py-1.5 text-[12px]">{brief}</p>}
          <ol className="mt-3 flex flex-col gap-1.5">
            {stops.filter((s) => s.address).slice(0, 12).map((s, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-[12px]">
                <span className="font-bold text-sky-300">{i + 1}</span>
                <span className="min-w-0"><span className="block truncate font-semibold">{s.address}</span>{s.service && <span className="block truncate text-slate-400">{s.service}</span>}</span>
              </li>
            ))}
            {stops.filter((s) => s.address).length > 12 && <li className="text-center text-[11px] text-slate-500">+{stops.filter((s) => s.address).length - 12} more</li>}
          </ol>
          <p className="mt-3 text-center text-[10px] text-slate-600">What the crew sees</p>
        </div>
      </aside>
    </div>
  );
}

function shift(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function pretty(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}
