"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CloudSun,
  Phone,
  User,
  Camera,
  Check,
  ChevronDown,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { shrinkImage } from "./photo-utils";

type Check = { label: string; done: boolean; byId?: string | null };
type Stop = {
  id: string;
  sortOrder: number;
  time: string | null;
  upsell: string | null;
  address: string;
  service: string | null;
  note: string | null;
  customerName: string | null;
  customerPhone: string | null;
  status: "PENDING" | "DONE" | "SKIPPED";
  doneAt: string | null;
  doneBy: { id: string; name: string } | null;
  photoUrls: string[];
  crewNote: string | null;
};
type Plan = {
  id: string;
  date: string;
  truck: string | null;
  trailer: boolean;
  startTime: string | null;
  weather: string | null;
  mission: string | null;
  brief: string | null;
  headsUp: string | null;
  contact: string | null;
  tomorrowDrop: string | null;
  lead: { id: string; name: string } | null;
  gear: Check[];
  endOfDay: Check[];
  crew: { id: string; name: string; truck: string | null; members: { id: string; name: string; rank: string }[] };
  stops: Stop[];
};
type WeekDay = { date: string; headline: string | null; truck: string | null; startTime: string | null; stopCount: number; doneCount: number; hasDetail: boolean };
type Payload = {
  me: { memberId: string; name: string; position: string; crew: string; week: number; season: number; rank: number | null; of: number };
  date: string;
  dateLabel: string;
  today: Plan | null;
  tomorrow: Plan | null;
  week: WeekDay[];
  quality: string[];
  contactDefault: string;
  tomorrowDropDefault: string;
  rules: { label: string; points: number }[];
  board: { memberId: string; name: string; crewName: string; week: number; season: number }[];
  recent: { id: string; name: string; points: number; reason: string; note: string | null; date: string }[];
};

const POLL_MS = 20_000;
const RANK_SHORT: Record<string, string> = { FIELD_SUPERVISOR: "Supervisor", CREW_LEAD: "Crew Lead", SENIOR_TECH: "Sr. Tech", TECHNICIAN: "Tech", TRAINEE: "Trainee" };

export function CrewHome() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openStop, setOpenStop] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | { kind: "lead" | "issue"; stop?: Stop }>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((m: string) => {
    setToast(m);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/crew/plan", { cache: "no-store" });
      if (res.status === 401) return router.refresh();
      if (!res.ok) throw new Error();
      setData(await res.json());
      setErr(null);
    } catch {
      setErr("Can't reach the office right now. Showing the last plan.");
    }
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  async function toggleCheck(planId: string, kind: "gear" | "endOfDay", index: number, done: boolean) {
    setData((d) => {
      if (!d?.today || d.today.id !== planId) return d;
      const list = d.today[kind].map((it, i) => (i === index ? { ...it, done } : it));
      return { ...d, today: { ...d.today, [kind]: list } };
    });
    const res = await fetch("/api/crew/checklist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId, kind, index, done }) });
    if (!res.ok) { say("Didn't save. Try again."); load(); }
  }

  async function logout() {
    await fetch("/api/crew/logout", { method: "POST" });
    router.refresh();
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Loading your game plan...
      </div>
    );
  }

  const plan = data.today;
  const stops = plan?.stops ?? [];
  const done = stops.filter((s) => s.status !== "PENDING").length;
  const pct = stops.length ? Math.round((done / stops.length) * 100) : 0;
  const truck = plan?.truck || plan?.crew.truck || null;

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <Image src="/images/logo.png" alt="Prestige View Services" width={120} height={49} className="h-auto w-[110px]" />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button type="button" onClick={load} aria-label="Refresh" className="rounded-full p-2 hover:bg-white/5">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={logout} aria-label="Sign out" className="rounded-full p-2 hover:bg-white/5">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {err && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{err}</p>}

      {/* Header: crew, date, weather */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300">PVS Game Plan · {data.me.crew}</p>
        <h1 className="font-display mt-1 text-[28px] font-bold leading-tight">{data.dateLabel}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
          <span>Hey <b className="text-white">{data.me.name}</b> <span className="text-slate-500">· {RANK_SHORT[data.me.position] ?? data.me.position}</span></span>
          {plan?.weather && <span><CloudSun className="mr-1 inline h-4 w-4 text-amber-300" />{plan.weather}</span>}
          {plan?.startTime && <span>Start <b className="text-white">{plan.startTime}</b></span>}
        </div>
        {plan?.mission && (
          <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.06] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">Today&apos;s mission</p>
            <p className="mt-0.5 text-[16px] font-semibold leading-snug text-white">{plan.mission}</p>
          </div>
        )}
        {stops.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{done} of {stops.length} stops done</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </section>

      {plan && (
        <>
          {/* Crew */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-4">
            <SectionTitle>Crew</SectionTitle>
            <dl className="mt-2 grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-[14px]">
              <dt className="text-slate-500">Lead</dt><dd className="font-semibold text-white">{plan.lead?.name ?? plan.crew.members.find((m) => m.rank === "CREW_LEAD" || m.rank === "FIELD_SUPERVISOR")?.name ?? "—"}</dd>
              <dt className="text-slate-500">Team</dt><dd className="text-slate-200">{plan.crew.members.filter((m) => m.id !== (plan.lead?.id ?? "")).map((m) => m.name).join(", ") || "—"}</dd>
              <dt className="text-slate-500">Truck</dt><dd className="text-slate-200">{truck ? (/^truck/i.test(truck) ? truck : `Truck ${truck}`) : "—"} <span className="text-slate-500">| Trailer: {plan.trailer ? "Y" : "N"}</span></dd>
            </dl>
          </section>

          {/* Gear check */}
          {plan.gear.length > 0 && (
            <Checklist title="Gear check" subtitle="before you leave" items={plan.gear} onToggle={(i, v) => toggleCheck(plan.id, "gear", i, v)} />
          )}
        </>
      )}

      {/* Route */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Route</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSheet({ kind: "lead" })} className="inline-flex h-8 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> Lead
            </button>
            <button type="button" onClick={() => setSheet({ kind: "issue" })} className="inline-flex h-8 items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-3 text-xs font-semibold text-red-200">
              <AlertTriangle className="h-3.5 w-3.5" /> Issue
            </button>
          </div>
        </div>

        {!plan || stops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
            {plan ? "Plan posted, no stops on it yet." : "No plan posted for today yet. Check back, or call the office."}
          </div>
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1322]">
            {stops.map((s, i) => (
              <StopRow
                key={s.id}
                stop={s}
                index={i}
                open={openStop === s.id}
                onToggle={() => setOpenStop(openStop === s.id ? null : s.id)}
                onChanged={(m) => { say(m); load(); }}
                onLead={() => setSheet({ kind: "lead", stop: s })}
                onIssue={() => setSheet({ kind: "issue", stop: s })}
              />
            ))}
          </ol>
        )}
      </section>

      {plan && (
        <>
          {/* Quality standard */}
          {data.quality.length > 0 && (
            <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-4">
              <SectionTitle>Quality standard</SectionTitle>
              <p className="text-[12px] text-slate-500">Before you leave every stop</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-[14px] text-slate-200">
                {data.quality.map((q) => <li key={q} className="flex gap-2"><span className="text-emerald-400">✓</span>{q}</li>)}
              </ul>
            </section>
          )}

          {/* Points on the board */}
          {data.rules.length > 0 && (
            <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-4">
              <SectionTitle>Points on the board today</SectionTitle>
              <ul className="mt-2 flex flex-col gap-1 text-[14px]">
                {data.rules.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-3">
                    <span className="text-slate-200">{r.label}</span>
                    <span className={`shrink-0 font-bold tabular-nums ${r.points < 0 ? "text-red-300" : "text-amber-300"}`}>{r.points > 0 ? "+" : ""}{r.points}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Heads up */}
          {(plan.headsUp || plan.brief) && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
              <SectionTitle>Heads up</SectionTitle>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-amber-50">{plan.headsUp || plan.brief}</p>
            </section>
          )}

          {/* End of day */}
          {(plan.endOfDay.length > 0 || plan.tomorrowDrop || data.tomorrowDropDefault) && (
            <Checklist
              title="End of day"
              items={plan.endOfDay}
              onToggle={(i, v) => toggleCheck(plan.id, "endOfDay", i, v)}
              footer={`Tomorrow's plan drops at ${plan.tomorrowDrop || data.tomorrowDropDefault || "tonight"}`}
            />
          )}

          {(plan.contact || data.contactDefault) && (
            <p className="px-1 text-[13px] text-slate-400">Questions: <span className="text-slate-200">{plan.contact || data.contactDefault}</span></p>
          )}
        </>
      )}

      {/* Tomorrow preview */}
      {data.tomorrow && (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Tomorrow</p>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
            {(data.tomorrow.truck || data.tomorrow.crew.truck) && <span>{/^truck/i.test(data.tomorrow.truck || data.tomorrow.crew.truck || "") ? "" : "Truck "}<b>{data.tomorrow.truck || data.tomorrow.crew.truck}</b></span>}
            {data.tomorrow.startTime && <span>Start <b>{data.tomorrow.startTime}</b></span>}
            <span className="text-slate-400">{data.tomorrow.stops.length} stops</span>
          </div>
          {data.tomorrow.brief && <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{data.tomorrow.brief}</p>}
        </section>
      )}

      {/* Week */}
      <WeekView week={data.week} today={data.date} />

      {/* Points */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Points</h2>
          {data.me.rank && (
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">
              #{data.me.rank} of {data.me.of}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="This week" value={data.me.week} accent />
          <Stat label="Season" value={data.me.season} />
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1322]">
          <div className="grid grid-cols-[32px_1fr_60px_64px] gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span>#</span><span>Name</span><span className="text-right">Week</span><span className="text-right">Season</span>
          </div>
          {data.board.map((b, i) => (
            <div key={b.memberId} className={`grid grid-cols-[32px_1fr_60px_64px] gap-2 border-b border-white/[0.04] px-3 py-2.5 text-sm last:border-0 ${b.memberId === data.me.memberId ? "bg-primary/10" : ""}`}>
              <span className={`font-display font-bold ${i === 0 ? "text-amber-300" : "text-slate-500"}`}>{i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}</span>
              <span className="min-w-0 truncate font-medium">{b.name}<span className="ml-1.5 text-xs text-slate-500">{b.crewName}</span></span>
              <span className="text-right tabular-nums text-amber-200">{b.week > 0 ? "+" : ""}{b.week}</span>
              <span className="text-right font-semibold tabular-nums">{b.season}</span>
            </div>
          ))}
          {data.board.length === 0 && <p className="p-4 text-center text-sm text-slate-400">No one on the board yet.</p>}
        </div>
        {data.recent.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {data.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2 text-[13px]">
                <span className="min-w-0 truncate"><b>{r.name}</b> <span className="text-slate-400">{r.reason}{r.note ? ` · ${r.note}` : ""}</span></span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${r.points < 0 ? "bg-red-400/15 text-red-200" : "bg-amber-400/15 text-amber-200"}`}>{r.points > 0 ? "+" : ""}{r.points}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sheet && (
        <ReportSheet
          kind={sheet.kind}
          stop={sheet.stop}
          stops={stops}
          onClose={() => setSheet(null)}
          onDone={(m) => { setSheet(null); say(m); load(); }}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-300">{children}</h2>;
}

function Checklist({ title, subtitle, items, onToggle, footer }: { title: string; subtitle?: string; items: Check[]; onToggle: (i: number, v: boolean) => void; footer?: string }) {
  const doneCount = items.filter((i) => i.done).length;
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-4">
      <div className="flex items-center justify-between">
        <div><SectionTitle>{title}</SectionTitle>{subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}</div>
        {items.length > 0 && <span className={`text-[12px] tabular-nums ${doneCount === items.length ? "text-emerald-300" : "text-slate-500"}`}>{doneCount}/{items.length}</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 active:bg-white/[0.04]">
              <input type="checkbox" checked={it.done} onChange={(e) => onToggle(i, e.target.checked)} className="h-5 w-5 rounded border-white/20 bg-transparent accent-emerald-500" />
              <span className={`text-[15px] ${it.done ? "text-slate-500 line-through" : "text-slate-100"}`}>{it.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-2 text-[12px] text-slate-500">{footer}</p>}
    </section>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function dayNum(d: string) { return Number(d.slice(8, 10)); }
function monthShort(d: string) { return new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, 1)).toLocaleDateString("en-CA", { month: "short", timeZone: "UTC" }); }

function WeekView({ week, today }: { week: WeekDay[]; today: string }) {
  const [showNext, setShowNext] = useState(false);
  if (!week?.length) return null;
  const thisWeek = week.slice(0, 7);
  const nextWeek = week.slice(7, 14);
  const todayIdx = thisWeek.findIndex((d) => d.date === today);
  // On Sat/Sun, open next week by default: that's what people are asking about.
  const defaultNext = todayIdx >= 5;
  const open = showNext || defaultNext;
  const Row = ({ d, i, dim }: { d: WeekDay; i: number; dim?: boolean }) => {
    const isToday = d.date === today;
    const past = d.date < today;
    const empty = !d.headline && !d.hasDetail;
    return (
      <li className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-2.5 ${isToday ? "bg-primary/10" : ""} ${past || dim ? "opacity-60" : ""}`}>
        <span className="text-center leading-tight">
          <span className={`block text-[10px] font-semibold uppercase tracking-[0.08em] ${isToday ? "text-sky-300" : "text-slate-500"}`}>{DOW[i]}</span>
          <span className={`font-display block text-lg font-bold ${isToday ? "text-white" : "text-slate-300"}`}>{dayNum(d.date)}</span>
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-[15px] ${empty ? "text-slate-500" : "font-semibold text-white"}`}>
            {d.headline || (d.hasDetail ? `${d.stopCount} stops` : "Not planned yet")}
          </span>
          <span className="block text-[12px] text-slate-400">
            {[d.startTime ? `Start ${d.startTime}` : null, d.truck ? (/^truck/i.test(d.truck) ? d.truck : `Truck ${d.truck}`) : null].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="text-right text-[12px] tabular-nums text-slate-400">
          {d.hasDetail ? (past || isToday ? `${d.doneCount}/${d.stopCount}` : `${d.stopCount} stops`) : ""}
        </span>
      </li>
    );
  };
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-4 w-4 text-sky-300" /> This week</h2>
        <span className="text-xs text-slate-500">{monthShort(thisWeek[0].date)} {dayNum(thisWeek[0].date)} to {monthShort(thisWeek[6].date)} {dayNum(thisWeek[6].date)}</span>
      </div>
      <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1322]">
        {thisWeek.map((d, i) => <Row key={d.date} d={d} i={i} />)}
      </ul>
      <button type="button" onClick={() => setShowNext((v) => !v)} className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-sm text-slate-300">
        <span>Next week</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-2 divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1322]">
          {nextWeek.map((d, i) => <Row key={d.date} d={d} i={i} />)}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`font-display mt-1 text-3xl font-bold tabular-nums ${accent ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function mapsHref(addr: string) {
  const q = /petawawa|pembroke|ontario|\bon\b/i.test(addr) ? addr : `${addr}, Petawawa ON`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function StopRow({
  stop, index, open, onToggle, onChanged, onLead, onIssue,
}: {
  stop: Stop; index: number; open: boolean; onToggle: () => void;
  onChanged: (msg: string) => void; onLead: () => void; onIssue: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipMode, setSkipMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isDone = stop.status === "DONE";
  const isSkipped = stop.status === "SKIPPED";

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    const shrunk = await Promise.all(list.map((f) => shrinkImage(f)));
    setFiles((prev) => [...prev, ...shrunk].slice(0, 6));
    e.target.value = "";
  }

  async function submit(action: "done" | "skip" | "reopen") {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("action", action);
    if (note) fd.set("note", note);
    files.forEach((f) => fd.append("photos", f));
    const res = await fetch(`/api/crew/stops/${stop.id}/done`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Didn't go through. Try again.");
    setFiles([]); setNote(""); setSkipMode(false);
    onChanged(action === "done" ? "Stop done. Nice." : action === "skip" ? "Marked skipped." : "Reopened.");
  }

  return (
    <li className={`border-b border-white/[0.06] last:border-0 ${isDone ? "bg-emerald-500/[0.06]" : isSkipped ? "bg-amber-500/[0.05]" : ""}`}>
      <button type="button" onClick={onToggle} className="grid w-full grid-cols-[36px_1fr_auto] items-start gap-3 px-3 py-3.5 text-left">
        <span className={`font-display mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isDone ? "bg-emerald-500 text-white" : isSkipped ? "bg-amber-500 text-black" : "bg-white/[0.06] text-sky-300"}`}>
          {isDone ? <Check className="h-4 w-4" /> : index + 1}
        </span>
        <span className="min-w-0">
          <span className={`block text-[16px] font-semibold leading-snug ${isDone ? "text-slate-300 line-through decoration-emerald-400/60" : "text-white"}`}>{stop.time && <span className="mr-1.5 text-sky-300">{stop.time}</span>}{stop.address}</span>
          {(stop.service || stop.customerName) && <span className="block text-[13px] text-slate-400">{[stop.customerName, stop.service].filter(Boolean).join(" · ")}</span>}
          {stop.note && <span className="mt-1 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-[13px] text-amber-100">{stop.note}</span>}
          {stop.upsell && <span className="mt-1 ml-1 inline-block rounded-md bg-emerald-400/15 px-2 py-0.5 text-[13px] text-emerald-100">Upsell: {stop.upsell}</span>}
          {(isDone || isSkipped) && stop.doneBy && (
            <span className="mt-1 block text-[12px] text-slate-500">
              {isDone ? "Done" : "Skipped"} by {stop.doneBy.name}{stop.doneAt ? ` at ${new Date(stop.doneAt).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" })}` : ""}
            </span>
          )}
        </span>
        <ChevronDown className={`mt-2 h-4 w-4 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 px-3 pb-4 pl-[60px]">
          <div className="flex flex-wrap gap-2">
            <a href={mapsHref(stop.address)} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-semibold text-slate-200">
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
            {stop.customerPhone ? (
              <a href={`tel:${stop.customerPhone.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-xs font-semibold text-sky-100">
                <Phone className="h-3.5 w-3.5" /> {stop.customerName ? `Call ${stop.customerName.split(" ")[0]}` : "Call customer"}
              </a>
            ) : stop.customerName ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-slate-400"><User className="h-3.5 w-3.5" /> {stop.customerName}</span>
            ) : null}
            <button type="button" onClick={onLead} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/30 px-3 text-xs font-semibold text-emerald-200"><Sparkles className="h-3.5 w-3.5" /> Flag lead</button>
            <button type="button" onClick={onIssue} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-400/30 px-3 text-xs font-semibold text-red-200"><AlertTriangle className="h-3.5 w-3.5" /> Issue</button>
          </div>

          {stop.photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {stop.photoUrls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-20 w-20 rounded-lg object-cover" />
                </a>
              ))}
            </div>
          )}

          {!isDone && !isSkipped && (
            <>
              <input ref={fileRef} id={`photos-${stop.id}`} type="file" accept="image/*" capture="environment" multiple hidden onChange={pick} />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold">
                  <Camera className="h-4 w-4" /> {files.length ? `Add another (${files.length})` : "Take after photo"}
                </button>
                {files.map((f, i) => (
                  <span key={i} className="relative h-11 w-11 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  </span>
                ))}
              </div>
              <input
                id={`note-${stop.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={skipMode ? "Why skipped? (required)" : "Note for the office (optional)"}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm outline-none focus:border-primary"
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <div className="flex gap-2">
                {!skipMode ? (
                  <>
                    <button type="button" disabled={busy || files.length === 0} onClick={() => submit("done")} className="h-12 flex-1 rounded-full bg-emerald-500 text-sm font-bold text-white disabled:opacity-40">
                      {busy ? "Uploading..." : "Mark done"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => setSkipMode(true)} className="h-12 rounded-full border border-white/10 px-4 text-sm font-semibold text-slate-300">Skip</button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={busy || note.trim().length < 3} onClick={() => submit("skip")} className="h-12 flex-1 rounded-full bg-amber-500 text-sm font-bold text-black disabled:opacity-40">Confirm skip</button>
                    <button type="button" disabled={busy} onClick={() => setSkipMode(false)} className="h-12 rounded-full border border-white/10 px-4 text-sm font-semibold text-slate-300">Back</button>
                  </>
                )}
              </div>
              {files.length === 0 && !skipMode && <p className="text-xs text-slate-500">An after photo is required to mark a stop done. It earns you points.</p>}
            </>
          )}
          {(isDone || isSkipped) && (
            <button type="button" disabled={busy} onClick={() => submit("reopen")} className="self-start text-xs text-slate-400 underline-offset-4 hover:underline">Reopen this stop</button>
          )}
        </div>
      )}
    </li>
  );
}

const ISSUE_KINDS = [
  ["DAMAGE", "Damage"], ["EQUIPMENT", "Equipment"], ["SAFETY", "Safety"], ["CUSTOMER", "Customer"], ["OTHER", "Other"],
] as const;
const LEAD_SERVICES = ["Gutter cleaning", "Window cleaning", "House wash", "Pressure washing", "Snow removal", "Aeration / overseed", "Fall cleanup", "Interlock", "Other"];

function ReportSheet({ kind, stop, stops, onClose, onDone }: {
  kind: "lead" | "issue"; stop?: Stop; stops: Stop[]; onClose: () => void; onDone: (m: string) => void;
}) {
  const [stopId, setStopId] = useState(stop?.id ?? "");
  const [address, setAddress] = useState(stop?.address ?? "");
  const [service, setService] = useState(LEAD_SERVICES[0]);
  const [issueKind, setIssueKind] = useState<(typeof ISSUE_KINDS)[number][0]>("DAMAGE");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setBusy(true); setError(null);
    let res: Response;
    if (kind === "lead") {
      res = await fetch("/api/crew/leads", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: stopId || undefined, address, service, note }),
      });
    } else {
      const fd = new FormData();
      fd.set("kind", issueKind); fd.set("note", note); if (stopId) fd.set("stopId", stopId);
      files.forEach((f) => fd.append("photos", f));
      res = await fetch("/api/crew/issues", { method: "POST", body: fd });
    }
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Didn't go through.");
    onDone(kind === "lead" ? "Lead sent to the office." : "Issue reported.");
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[560px] rounded-t-3xl border border-white/10 bg-[#0E1322] p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{kind === "lead" ? "Flag an upsell lead" : "Report an issue"}</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">Close</button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {stops.length > 0 && (
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-400">Stop
              <select id="sheet-stop" value={stopId} onChange={(e) => { setStopId(e.target.value); const s = stops.find((x) => x.id === e.target.value); if (s) setAddress(s.address); }} className="h-11 rounded-xl border border-white/10 bg-[#0E1322] px-3 text-sm text-white">
                <option value="">Not on today&apos;s route</option>
                {stops.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.address}</option>)}
              </select>
            </label>
          )}
          {kind === "lead" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-400">Address
                <input id="sheet-address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white" />
              </label>
              <div className="flex flex-col gap-1 text-xs font-semibold text-slate-400">They asked about
                <div className="flex flex-wrap gap-2">
                  {LEAD_SERVICES.map((s) => (
                    <button key={s} type="button" onClick={() => setService(s)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${service === s ? "border-emerald-400 bg-emerald-400/15 text-emerald-100" : "border-white/10 text-slate-300"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1 text-xs font-semibold text-slate-400">What kind
              <div className="flex flex-wrap gap-2">
                {ISSUE_KINDS.map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setIssueKind(k)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${issueKind === k ? "border-red-400 bg-red-400/15 text-red-100" : "border-white/10 text-slate-300"}`}>{label}</button>
                ))}
              </div>
            </div>
          )}
          <textarea id="sheet-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={kind === "lead" ? "Who you talked to, what they said, best time to call" : "What happened, in one or two lines"} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white" />
          {kind === "issue" && (
            <div className="flex items-center gap-2">
              <input ref={fileRef} id="sheet-photos" type="file" accept="image/*" capture="environment" multiple hidden onChange={async (e) => { const l = Array.from(e.target.files ?? []); const shrunk = await Promise.all(l.map((f) => shrinkImage(f))); setFiles((p) => [...p, ...shrunk].slice(0, 4)); e.target.value = ""; }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold"><Camera className="h-4 w-4" /> Photo{files.length ? ` (${files.length})` : ""}</button>
            </div>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="button" disabled={busy || note.trim().length < 3 || (kind === "lead" && address.trim().length < 3)} onClick={submit} className={`h-12 rounded-full text-sm font-bold text-white disabled:opacity-40 ${kind === "lead" ? "bg-emerald-500" : "bg-red-500"}`}>
            {busy ? "Sending..." : kind === "lead" ? "Send lead" : "Send issue"}
          </button>
          <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> Goes straight to the office. {kind === "lead" ? "You get points when it closes." : ""}</p>
        </div>
      </div>
    </div>
  );
}
