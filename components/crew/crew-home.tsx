"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
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

type Stop = {
  id: string;
  sortOrder: number;
  address: string;
  service: string | null;
  note: string | null;
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
  startTime: string | null;
  brief: string | null;
  crew: { id: string; name: string; truck: string | null; members: { id: string; name: string }[] };
  stops: Stop[];
};
type Payload = {
  me: { memberId: string; name: string; crew: string; week: number; season: number; rank: number | null; of: number };
  date: string;
  dateLabel: string;
  today: Plan | null;
  tomorrow: Plan | null;
  board: { memberId: string; name: string; crewName: string; week: number; season: number }[];
  recent: { id: string; name: string; points: number; reason: string; note: string | null; date: string }[];
};

const POLL_MS = 20_000;

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

      {/* Today card */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#0E1322] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300">{data.me.crew}</p>
        <h1 className="font-display mt-1 text-[28px] font-bold leading-tight">{data.dateLabel}</h1>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
          <span>Hey <b className="text-white">{data.me.name}</b></span>
          {truck && <span>{/^truck/i.test(truck) ? "" : "Truck "}<b className="text-white">{truck}</b></span>}
          {plan?.startTime && <span>Start <b className="text-white">{plan.startTime}</b></span>}
          {plan && plan.crew.members.length > 1 && (
            <span className="text-slate-400">with {plan.crew.members.filter((m) => m.id !== data.me.memberId).map((m) => m.name).join(", ")}</span>
          )}
        </div>
        {plan?.brief && (
          <p className="mt-4 whitespace-pre-wrap rounded-xl border-l-4 border-primary bg-white/[0.03] px-3 py-2 text-[15px] leading-relaxed">
            {plan.brief}
          </p>
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
          <span className={`block text-[16px] font-semibold leading-snug ${isDone ? "text-slate-300 line-through decoration-emerald-400/60" : "text-white"}`}>{stop.address}</span>
          {stop.service && <span className="block text-[13px] text-slate-400">{stop.service}</span>}
          {stop.note && <span className="mt-1 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-[13px] text-amber-100">{stop.note}</span>}
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
