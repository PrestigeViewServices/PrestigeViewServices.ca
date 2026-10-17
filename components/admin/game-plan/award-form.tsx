"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { awardPoints } from "@/app/admin/game-plan/actions";

type Rule = { id: string; label: string; points: number };

/** One-tap reasons from the rule list, or a custom amount. */
export function AwardForm({
  members,
  rules,
  today,
}: {
  members: { id: string; name: string; crew: string }[];
  rules: Rule[];
  today: string;
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [rule, setRule] = useState<Rule | null>(null);
  const [points, setPoints] = useState<string>("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pick(r: Rule) {
    setRule(r);
    setPoints(String(r.points));
    setReason(r.label);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("memberId", memberId);
    fd.set("points", points);
    fd.set("reason", reason);
    fd.set("note", note);
    fd.set("date", date);
    if (rule) fd.set("ruleId", rule.id);
    start(async () => {
      try {
        await awardPoints(fd);
        const who = members.find((m) => m.id === memberId)?.name ?? "";
        setMsg(`${Number(points) > 0 ? "+" : ""}${points} to ${who}`);
        setNote(""); setPoints(""); setReason(""); setRule(null);
        router.refresh();
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Didn't save.");
      }
    });
  }

  const input = "h-9 w-full rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Employee
        <select id="award-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={input}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.crew}</option>)}
        </select>
      </label>
      <div className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Reason
        <div className="flex flex-wrap gap-1.5">
          {rules.map((r) => (
            <button key={r.id} type="button" onClick={() => pick(r)} className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${rule?.id === r.id ? (r.points < 0 ? "border-red-400 bg-red-400/15 text-red-100" : "border-emerald-400 bg-emerald-400/15 text-emerald-100") : "border-white/10 text-slate-300 hover:bg-white/[0.05]"}`}>
              {r.label} <span className="tabular-nums opacity-70">{r.points > 0 ? "+" : ""}{r.points}</span>
            </button>
          ))}
          <button type="button" onClick={() => { setRule(null); setPoints(""); setReason(""); }} className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${!rule && reason !== "" ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/10 text-slate-300"}`}>Custom</button>
        </div>
      </div>
      {!rule && (
        <input id="award-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className={input} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Points
          <input id="award-points" type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="+10 or -10" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-400">Date
          <input id="award-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
      </div>
      <input id="award-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional): 5-star Google review from the Carters" className={input} />
      <button disabled={pending || !memberId || !points || !reason.trim()} className="h-10 rounded-sm bg-primary text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40">
        {pending ? "Saving..." : "Add to ledger"}
      </button>
      {msg && <p className="text-[12px] text-slate-300">{msg}</p>}
    </form>
  );
}
