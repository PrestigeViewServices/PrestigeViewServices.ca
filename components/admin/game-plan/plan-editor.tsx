"use client";

import { forwardRef, useImperativeHandle, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash2, X } from "lucide-react";
import { savePlan, deletePlan, copyPreviousPlan, type PlanInput } from "@/app/admin/game-plan/actions";

type Vis = "ALL" | "LEADS" | "NONE";
type StopDraft = {
  id?: string; time: string; address: string; service: string; note: string; upsell: string;
  customerName: string; customerPhone: string; phoneVisibility: Vis; status?: string; photos?: number;
};
const VIS_LABEL: Record<Vis, string> = { ALL: "Whole crew", LEADS: "Crew leads +", NONE: "Office only" };
const emptyStop = (): StopDraft => ({ time: "", address: "", service: "", note: "", upsell: "", customerName: "", customerPhone: "", phoneVisibility: "LEADS" });

type Member = { id: string; name: string; rank: string };
export type Shared = { weather?: string; mission?: string; headsUp?: string; startTime?: string };
export type SubmitResult = "saved" | "skipped" | "failed";
export type PlanEditorHandle = { submit: (publish: boolean) => Promise<SubmitResult>; apply: (s: Shared) => void; isDirty: () => boolean };
type Props = {
  crew: { id: string; name: string; truck: string | null; members: Member[] };
  date: string;
  onSaved?: () => void;
  defaults: { gear: string[]; quality: string[]; endOfDay: string[]; mission: string; contact: string; tomorrowDrop: string };
  rules: { label: string; points: number }[];
  plan: {
    id: string; headline: string | null; truck: string | null; trailer: boolean; startTime: string | null;
    weather: string | null; mission: string | null; brief: string | null; headsUp: string | null;
    contact: string | null; tomorrowDrop: string | null; leadId: string | null;
    gear: string[]; endOfDay: string[]; published: boolean; updatedAt: string;
    stops: { id: string; time: string | null; address: string; service: string | null; note: string | null; upsell: string | null; customerName: string | null; customerPhone: string | null; phoneVisibility: Vis; status: string; photoUrls: string[] }[];
  } | null;
};

const input = "h-9 w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white outline-none focus:border-primary";
const label = "flex flex-col gap-1 text-[12px] font-medium text-slate-400";

/**
 * The standard PVS daily game plan. Everything that can be prefilled is:
 * lead, team, truck, gear list, quality standard, end-of-day list, points,
 * contact. You type weather, mission, stops and any heads-up, then post.
 */
export const PlanEditor = forwardRef<PlanEditorHandle, Props>(function PlanEditor({ crew, date, defaults, rules, plan, onSaved }, ref) {
  const router = useRouter();
  const crewId = crew.id;
  const members = crew.members;
  const defaultLead = members.find((m) => m.rank === "CREW_LEAD")?.id ?? members.find((m) => m.rank === "FIELD_SUPERVISOR")?.id ?? "";

  const [headline, setHeadline] = useState(plan?.headline ?? "");
  const [weather, setWeather] = useState(plan?.weather ?? "");
  const [mission, setMission] = useState(plan?.mission ?? (plan ? "" : defaults.mission));
  const [leadId, setLeadId] = useState(plan?.leadId ?? defaultLead);
  const [truck, setTruck] = useState(plan?.truck ?? crew?.truck ?? "");
  const [trailer, setTrailer] = useState(plan?.trailer ?? false);
  const [startTime, setStartTime] = useState(plan?.startTime ?? "7:00 AM");
  const [gear, setGear] = useState<string[]>(plan?.gear.length ? plan.gear : defaults.gear);
  const [headsUp, setHeadsUp] = useState(plan?.headsUp ?? plan?.brief ?? "");
  const [endOfDay, setEndOfDay] = useState<string[]>(plan?.endOfDay.length ? plan.endOfDay : defaults.endOfDay);
  const [contact, setContact] = useState(plan?.contact ?? defaults.contact);
  const [tomorrowDrop, setTomorrowDrop] = useState(plan?.tomorrowDrop ?? defaults.tomorrowDrop);
  const [published, setPublished] = useState(plan?.published ?? true);
  const [stops, setStops] = useState<StopDraft[]>(
    plan?.stops.map((s) => ({ id: s.id, time: s.time ?? "", address: s.address, service: s.service ?? "", note: s.note ?? "", upsell: s.upsell ?? "", customerName: s.customerName ?? "", customerPhone: s.customerPhone ?? "", phoneVisibility: s.phoneVisibility, status: s.status, photos: s.photoUrls.length })) ?? [emptyStop(), emptyStop()]
  );
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(i: number, patch: Partial<StopDraft>) {
    setDirty(true);
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
      ...s.filter((x) => x.address.trim() || x.id),
      ...lines.map((l) => {
        // "7:30 | 123 Main St | mow + trim | gate 4411 | Jane Carter | 613-555-0142 | mention gutters"
        const parts = l.split("|").map((x) => x.trim());
        const hasTime = /^\d{1,2}(:\d{2})?\s*(am|pm)?$/i.test(parts[0] ?? "");
        const [time, address = "", service = "", note = "", customerName = "", customerPhone = "", upsell = ""] = hasTime ? parts : ["", ...parts];
        return { ...emptyStop(), time, address, service, note, customerName, customerPhone, upsell };
      }),
    ]);
    setBulk("");
  }

  const [dirty, setDirty] = useState(false);
  useImperativeHandle(ref, () => ({
    submit,
    isDirty: () => dirty,
    apply: (sh) => {
      if (sh.weather !== undefined) setWeather(sh.weather);
      if (sh.mission !== undefined) setMission(sh.mission);
      if (sh.headsUp !== undefined) setHeadsUp(sh.headsUp);
      if (sh.startTime !== undefined) setStartTime(sh.startTime);
      setDirty(true);
    },
  }));

  function submit(publish: boolean): Promise<SubmitResult> {
    setMsg(null);
    // Nothing to post: no stops, no headline, and no plan already saved.
    // Post all skips these rather than posting an empty day to the crew.
    if (!plan && !stops.some((s) => s.address.trim()) && !headline.trim()) {
      setMsg("Skipped: no stops or headline yet.");
      return Promise.resolve("skipped");
    }
    const input: PlanInput = {
      crewId, date, headline, truck, trailer, startTime, weather, mission, brief: "", headsUp, contact, tomorrowDrop, leadId,
      gear: gear.filter(Boolean), endOfDay: endOfDay.filter(Boolean), published: publish,
      stops: stops.filter((s) => s.address.trim()).map(({ id, time, address, service, note, upsell, customerName, customerPhone, phoneVisibility }) => ({ id, time, address, service, note, upsell, customerName, customerPhone, phoneVisibility })),
    };
    return new Promise<SubmitResult>((resolve) => {
      start(async () => {
        try {
          await savePlan(input);
          setPublished(publish);
          setDirty(false);
          setMsg(publish ? "Posted. Crews see it now." : "Saved as draft (hidden from crews).");
          onSaved?.();
          resolve("saved");
        } catch (e) {
          setMsg(e instanceof Error ? e.message : "Save failed.");
          resolve("failed");
        }
      });
    });
  }

  const doneCount = stops.filter((s) => s.status && s.status !== "PENDING").length;
  const team = members.filter((m) => m.id !== leadId).map((m) => m.name);

  return (
    <div className="flex flex-col gap-4">
        {/* Who / when */}
        <Section title="Today" right={plan ? <span className="text-[12px] text-slate-500"><span className={published ? "text-emerald-300" : "text-amber-300"}>{published ? "Posted" : "Draft"}</span> · {doneCount}/{stops.filter((s) => s.id).length} done</span> : <span className="text-[12px] text-slate-500">Not posted yet</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Weather<input id={`plan-weather-${crewId}`} value={weather} onChange={(e) => { setWeather(e.target.value); setDirty(true); }} placeholder="Sunny, 14°C, wind pm" className={input} /></label>
            <label className={label}>Week headline<input id={`plan-headline-${crewId}`} value={headline} onChange={(e) => { setHeadline(e.target.value); setDirty(true); }} placeholder="Lawns Pembroke" className={input} /></label>
          </div>
          <label className={`${label} mt-3`}>Today&apos;s mission
            <input id={`plan-mission-${crewId}`} value={mission} onChange={(e) => { setMission(e.target.value); setDirty(true); }} placeholder={defaults.mission} className={`${input} h-11 text-[15px] font-semibold`} />
          </label>
        </Section>

        {/* Crew */}
        <Section title="Crew">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
            <label className={label}>Lead
              <select id={`plan-lead-${crewId}`} value={leadId} onChange={(e) => setLeadId(e.target.value)} className={input}>
                <option value="">—</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className={label}>Truck<input id={`plan-truck-${crewId}`} value={truck} onChange={(e) => setTruck(e.target.value)} placeholder="Truck 2" className={input} /></label>
            <label className="flex h-9 items-center gap-2 self-end text-[13px] text-slate-300"><input id={`plan-trailer-${crewId}`} type="checkbox" checked={trailer} onChange={(e) => setTrailer(e.target.checked)} /> Trailer</label>
            <label className={label}>Start<input id={`plan-start-${crewId}`} value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="7:00 AM" className={input} /></label>
          </div>
          <p className="mt-2 text-[12px] text-slate-500">Team: {team.length ? team.join(", ") : "nobody else active on this crew"} <span className="text-slate-600">(edit under Team)</span></p>
        </Section>

        {/* Gear */}
        <Section title="Gear check" subtitle="Crew ticks these before leaving. Prefilled from Team > Daily plan defaults.">
          <ListEditor items={gear} onChange={setGear} placeholder="Add gear item" />
        </Section>

        {/* Route */}
        <Section
          title="Route (in order)"
          right={
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={() => start(async () => { const r = await copyPreviousPlan(crewId, date); setMsg(r.ok ? "Copied last plan as a draft. Edit, then post." : r.error); router.refresh(); })} className="inline-flex h-8 items-center gap-1 rounded-sm border border-white/[0.09] px-2.5 text-xs text-slate-300 hover:bg-white/[0.05]"><Copy className="h-3.5 w-3.5" /> Copy last plan</button>
              <button type="button" onClick={() => setStops((s) => [...s, emptyStop()])} className="inline-flex h-8 items-center gap-1 rounded-sm bg-primary px-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Stop</button>
            </div>
          }
          bodyClass="p-0"
        >
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {stops.map((s, i) => (
              <div key={s.id ?? `new-${i}`} className="grid grid-cols-[28px_1fr_auto] gap-2 p-3">
                <div className={`mt-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${s.status === "DONE" ? "bg-emerald-500 text-white" : s.status === "SKIPPED" ? "bg-amber-500 text-black" : "bg-white/[0.06] text-sky-300"}`}>{s.status === "DONE" ? <Check className="h-3 w-3" /> : i + 1}</div>
                <div className="grid gap-2 sm:grid-cols-[88px_1fr_1.4fr]">
                  <input id={`stop-${crewId}-time-${i}`} value={s.time} onChange={(e) => update(i, { time: e.target.value })} placeholder="7:30" className={input} />
                  <input id={`stop-${crewId}-cname-${i}`} value={s.customerName} onChange={(e) => update(i, { customerName: e.target.value })} placeholder="Customer" className={input} />
                  <input id={`stop-${crewId}-addr-${i}`} value={s.address} onChange={(e) => update(i, { address: e.target.value })} placeholder="Address" className={input} />
                  <input id={`stop-${crewId}-svc-${i}`} value={s.service} onChange={(e) => update(i, { service: e.target.value })} placeholder="Service: what" className={`${input} sm:col-span-3`} />
                  <input id={`stop-${crewId}-note-${i}`} value={s.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Notes: gate code, dog, where to dump, customer home?" className={`${input} sm:col-span-3`} />
                  <input id={`stop-${crewId}-upsell-${i}`} value={s.upsell} onChange={(e) => update(i, { upsell: e.target.value })} placeholder="Upsell: what to mention" className={`${input} sm:col-span-2`} />
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input id={`stop-${crewId}-cphone-${i}`} value={s.customerPhone} onChange={(e) => update(i, { customerPhone: e.target.value })} placeholder="Phone" inputMode="tel" className={input} />
                    <select id={`stop-${crewId}-vis-${i}`} value={s.phoneVisibility} onChange={(e) => update(i, { phoneVisibility: e.target.value as Vis })} title="Who can see the phone number" className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-1 text-[11px] text-slate-300">
                      {(Object.keys(VIS_LABEL) as Vis[]).map((v) => <option key={v} value={v}>{VIS_LABEL[v]}</option>)}
                    </select>
                  </div>
                  {s.photos ? <p className="text-[11px] text-slate-500 sm:col-span-3">{s.photos} photo{s.photos > 1 ? "s" : ""} uploaded</p> : null}
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
            <label className={label}>Paste a list (one stop per line: time | address | service | notes | customer | phone | upsell)
              <textarea id={`plan-bulk-${crewId}`} value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"7:30 | 12 Hilda St | Mow + trim | Dog in yard | Jane Carter | 613-555-0142 | Mention gutters\n9:00 | 48 Festubert Blvd | Gutters"} className="rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 font-mono text-xs text-white" />
            </label>
            <button type="button" onClick={addBulk} disabled={!bulk.trim()} className="mt-2 h-8 rounded-sm border border-white/[0.09] px-3 text-xs text-slate-300 disabled:opacity-40">Add these stops</button>
          </div>
        </Section>

        {/* Quality + points (read only, from defaults) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Section title="Quality standard" subtitle="Shown on every stop. Edit under Team.">
            <ul className="flex flex-col gap-1 text-[13px] text-slate-300">{defaults.quality.map((q) => <li key={q}>☐ {q}</li>)}</ul>
          </Section>
          <Section title="Points on the board" subtitle="Active rules. Edit under Team.">
            <ul className="flex flex-col gap-1 text-[13px]">{rules.map((r) => <li key={r.label} className="flex justify-between gap-2"><span className="text-slate-300">{r.label}</span><span className={`tabular-nums font-semibold ${r.points < 0 ? "text-red-300" : "text-amber-300"}`}>{r.points > 0 ? "+" : ""}{r.points}</span></li>)}</ul>
          </Section>
        </div>

        {/* Heads up */}
        <Section title="Heads up" subtitle="Anything out of the ordinary: new customer, picky client, road closure, equipment issue.">
          <textarea id={`plan-headsup-${crewId}`} value={headsUp} onChange={(e) => setHeadsUp(e.target.value)} rows={3} placeholder="Paquette Rd closed at the bridge, go around by Murphy. Mrs. Lalonde is new, introduce yourself." className="w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 text-sm text-white outline-none focus:border-primary" />
        </Section>

        {/* End of day */}
        <Section title="End of day">
          <ListEditor items={endOfDay} onChange={setEndOfDay} placeholder="Add end-of-day item" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={label}>Tomorrow&apos;s plan drops at<input id={`plan-drop-${crewId}`} value={tomorrowDrop} onChange={(e) => setTomorrowDrop(e.target.value)} placeholder="8 PM" className={input} /></label>
            <label className={label}>Questions<input id={`plan-contact-${crewId}`} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="AG 613-555-0100 / Luke 613-555-0101" className={input} /></label>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={pending} onClick={() => submit(true)} className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {pending ? "Saving..." : `Post ${crew.name}`}
          </button>
          <button type="button" disabled={pending} onClick={() => submit(false)} className="h-10 rounded-sm border border-white/[0.09] px-4 text-sm text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">Save draft</button>
          {plan && (
            <button type="button" disabled={pending} onClick={() => start(async () => { await deletePlan(plan.id); router.refresh(); setStops([emptyStop()]); setMsg("Plan deleted."); onSaved?.(); })} className="ml-auto h-10 rounded-sm border border-red-500/30 px-3 text-sm text-red-300 hover:bg-red-500/10">Delete plan</button>
          )}
          {msg && <span className="basis-full text-[13px] text-slate-300">{msg}</span>}
        </div>
    </div>
  );
});

function Section({ title, subtitle, right, children, bodyClass }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; bodyClass?: string }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0E1322]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
        <div><h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-300">{title}</h2>{subtitle && <p className="text-[11.5px] text-slate-500">{subtitle}</p>}</div>
        {right}
      </div>
      <div className={bodyClass ?? "p-4"}>{children}</div>
    </section>
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-3 pr-1 text-[13px] text-slate-200">
          {it}
          <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-full p-0.5 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...items, draft.trim()]); setDraft(""); } }}
        placeholder={placeholder}
        className="h-8 min-w-[160px] flex-1 rounded-full border border-dashed border-white/15 bg-transparent px-3 text-[13px] text-white outline-none focus:border-primary"
      />
    </div>
  );
}

