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
export const PlanEditor = forwardRef<PlanEditorHandle, Props>(function PlanEditor({ crew, date, defaults, plan, onSaved }, ref) {
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

  const leadName = members.find((m) => m.id === leadId)?.name ?? "no lead";
  const crewSummary = [leadName, truck ? (/^truck/i.test(truck) ? truck : `Truck ${truck}`) : null, trailer ? "trailer" : null, startTime || null].filter(Boolean).join(" · ");
  const filled = stops.filter((s) => s.address.trim()).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Status + this crew's own notes (shared values already applied from the Day tab) */}
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
        {plan ? <><span className={published ? "text-emerald-300" : "text-amber-300"}>{published ? "Posted" : "Draft"}</span><span>· {doneCount}/{stops.filter((s) => s.id).length} done</span></> : <span>Not posted yet</span>}
        {dirty && <span className="text-amber-300">· unsaved</span>}
      </div>

      {/* Route: the only thing open by default */}
      <Section
        title={`Route · ${filled} stop${filled === 1 ? "" : "s"}`}
        right={
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => start(async () => { const r = await copyPreviousPlan(crewId, date); setMsg(r.ok ? "Copied last plan as a draft. Edit, then post." : r.error); router.refresh(); })} className="inline-flex h-8 items-center gap-1 rounded-sm border border-white/[0.09] px-2.5 text-xs text-slate-300 hover:bg-white/[0.05]"><Copy className="h-3.5 w-3.5" /> Copy last</button>
            <button type="button" onClick={() => setStops((s) => [...s, emptyStop()])} className="inline-flex h-8 items-center gap-1 rounded-sm bg-primary px-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Stop</button>
          </div>
        }
        bodyClass="p-0"
      >
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {stops.map((s, i) => (
            <StopRow key={s.id ?? `new-${i}`} s={s} i={i} crewId={crewId} update={update} move={move} remove={() => setStops((x) => x.filter((_, j) => j !== i))} />
          ))}
        </div>
        <details className="border-t border-white/[0.06]">
          <summary className="cursor-pointer px-3 py-2 text-[12px] text-slate-400 hover:text-slate-200">Paste a list instead</summary>
          <div className="px-3 pb-3">
            <textarea id={`plan-bulk-${crewId}`} value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"7:30 | 12 Hilda St | Mow + trim | Dog in yard | Jane Carter | 613-555-0142 | Mention gutters\n9:00 | 48 Festubert Blvd | Gutters"} className="w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 font-mono text-xs text-white" />
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={addBulk} disabled={!bulk.trim()} className="h-8 rounded-sm border border-white/[0.09] px-3 text-xs text-slate-300 disabled:opacity-40">Add these stops</button>
              <span className="text-[11px] text-slate-500">time | address | service | notes | customer | phone | upsell</span>
            </div>
          </div>
        </details>
      </Section>

      {/* Everything else: one line each, expand to edit */}
      <Fold title="Crew & truck" summary={crewSummary}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_1fr_1fr]">
          <label className={label}>Lead
            <select id={`plan-lead-${crewId}`} value={leadId} onChange={(e) => { setLeadId(e.target.value); setDirty(true); }} className={input}>
              <option value="">—</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className={label}>Truck<input id={`plan-truck-${crewId}`} value={truck} onChange={(e) => { setTruck(e.target.value); setDirty(true); }} placeholder="Truck 2" className={input} /></label>
          <label className="flex h-9 items-center gap-2 self-end text-[13px] text-slate-300"><input id={`plan-trailer-${crewId}`} type="checkbox" checked={trailer} onChange={(e) => { setTrailer(e.target.checked); setDirty(true); }} /> Trailer</label>
          <label className={label}>Start<input id={`plan-start-${crewId}`} value={startTime} onChange={(e) => { setStartTime(e.target.value); setDirty(true); }} placeholder="7:00 AM" className={input} /></label>
          <label className={label}>Week headline<input id={`plan-headline-${crewId}`} value={headline} onChange={(e) => { setHeadline(e.target.value); setDirty(true); }} placeholder="Lawns Pembroke" className={input} /></label>
        </div>
        <p className="mt-2 text-[12px] text-slate-500">Team: {team.length ? team.join(", ") : "nobody else active on this crew"}</p>
      </Fold>

      <Fold title="This crew only" summary={[weather, mission, headsUp].filter(Boolean).join(" · ") || "Weather, mission and heads-up come from the Day tab. Override here if this crew is different."}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Weather<input id={`plan-weather-${crewId}`} value={weather} onChange={(e) => { setWeather(e.target.value); setDirty(true); }} className={input} /></label>
          <label className={label}>Mission<input id={`plan-mission-${crewId}`} value={mission} onChange={(e) => { setMission(e.target.value); setDirty(true); }} placeholder={defaults.mission} className={input} /></label>
          <label className={`${label} sm:col-span-2`}>Heads up<textarea id={`plan-headsup-${crewId}`} value={headsUp} onChange={(e) => { setHeadsUp(e.target.value); setDirty(true); }} rows={2} className="w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 py-1.5 text-sm text-white outline-none focus:border-primary" /></label>
        </div>
      </Fold>

      <Fold title="Gear check" summary={`${gear.length} item${gear.length === 1 ? "" : "s"}`}>
        <ListEditor items={gear} onChange={(v) => { setGear(v); setDirty(true); }} placeholder="Add gear item" />
      </Fold>

      <Fold title="End of day" summary={`${endOfDay.length} item${endOfDay.length === 1 ? "" : "s"}${tomorrowDrop ? ` · plan drops ${tomorrowDrop}` : ""}${contact ? ` · ${contact}` : ""}`}>
        <ListEditor items={endOfDay} onChange={(v) => { setEndOfDay(v); setDirty(true); }} placeholder="Add end-of-day item" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={label}>Tomorrow&apos;s plan drops at<input id={`plan-drop-${crewId}`} value={tomorrowDrop} onChange={(e) => { setTomorrowDrop(e.target.value); setDirty(true); }} placeholder="8 PM" className={input} /></label>
          <label className={label}>Questions<input id={`plan-contact-${crewId}`} value={contact} onChange={(e) => { setContact(e.target.value); setDirty(true); }} placeholder="AG 613-555-0100 / Luke 613-555-0101" className={input} /></label>
        </div>
      </Fold>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
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

/** One stop: two lines by default; "more" reveals upsell, phone and who sees it. */
function StopRow({ s, i, crewId, update, move, remove }: { s: StopDraft; i: number; crewId: string; update: (i: number, p: Partial<StopDraft>) => void; move: (i: number, d: -1 | 1) => void; remove: () => void }) {
  const [more, setMore] = useState(!!(s.upsell || s.customerPhone));
  return (
    <div className="grid grid-cols-[28px_1fr_auto] gap-2 p-3">
      <div className={`mt-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${s.status === "DONE" ? "bg-emerald-500 text-white" : s.status === "SKIPPED" ? "bg-amber-500 text-black" : "bg-white/[0.06] text-sky-300"}`}>{s.status === "DONE" ? <Check className="h-3 w-3" /> : i + 1}</div>
      <div className="grid gap-2 sm:grid-cols-[80px_1fr_1.5fr]">
        <input id={`stop-${crewId}-time-${i}`} value={s.time} onChange={(e) => update(i, { time: e.target.value })} placeholder="7:30" className={input} />
        <input id={`stop-${crewId}-cname-${i}`} value={s.customerName} onChange={(e) => update(i, { customerName: e.target.value })} placeholder="Customer" className={input} />
        <input id={`stop-${crewId}-addr-${i}`} value={s.address} onChange={(e) => update(i, { address: e.target.value })} placeholder="Address" className={input} />
        <input id={`stop-${crewId}-svc-${i}`} value={s.service} onChange={(e) => update(i, { service: e.target.value })} placeholder="Service" className={`${input} sm:col-span-1`} />
        <input id={`stop-${crewId}-note-${i}`} value={s.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Notes: gate code, dog, customer home?" className={`${input} sm:col-span-2`} />
        {more ? (
          <>
            <input id={`stop-${crewId}-upsell-${i}`} value={s.upsell} onChange={(e) => update(i, { upsell: e.target.value })} placeholder="Upsell: what to mention" className={`${input} sm:col-span-1`} />
            <input id={`stop-${crewId}-cphone-${i}`} value={s.customerPhone} onChange={(e) => update(i, { customerPhone: e.target.value })} placeholder="Customer phone" inputMode="tel" className={input} />
            <select id={`stop-${crewId}-vis-${i}`} value={s.phoneVisibility} onChange={(e) => update(i, { phoneVisibility: e.target.value as Vis })} title="Who can see the phone number" className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-[12px] text-slate-300">
              {(Object.keys(VIS_LABEL) as Vis[]).map((v) => <option key={v} value={v}>Phone: {VIS_LABEL[v]}</option>)}
            </select>
          </>
        ) : (
          <button type="button" onClick={() => setMore(true)} className="justify-self-start text-[11px] text-slate-500 hover:text-slate-200 sm:col-span-3">+ upsell, phone</button>
        )}
        {s.photos ? <p className="text-[11px] text-slate-500 sm:col-span-3">{s.photos} photo{s.photos > 1 ? "s" : ""} uploaded</p> : null}
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-white/[0.06]"><ArrowUp className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-white/[0.06]"><ArrowDown className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label="Remove" onClick={remove} className="rounded p-1 text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

/** Collapsed-by-default section with a one-line summary. */
function Fold({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0E1322]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left">
        <span className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-300">{title}</span>
          {!open && <span className="ml-3 truncate text-[13px] text-slate-400">{summary}</span>}
        </span>
        <span className="shrink-0 text-[12px] text-slate-500">{open ? "done" : "edit"}</span>
      </button>
      {open && <div className="border-t border-white/[0.06] p-4">{children}</div>}
    </section>
  );
}

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

