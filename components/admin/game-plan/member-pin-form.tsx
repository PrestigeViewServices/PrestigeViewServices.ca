"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberPin } from "@/app/admin/game-plan/actions";

/** Set, change or remove one person's PIN, with the duplicate-PIN error shown inline. */
export function MemberPinForm({ memberId, hasPin }: { memberId: string; hasPin: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(clear = false) {
    const fd = new FormData();
    fd.set("id", memberId);
    fd.set("pin", clear ? "" : pin);
    setMsg(null);
    start(async () => {
      try {
        await setMemberPin(fd);
        setMsg(clear ? "PIN removed" : "PIN saved");
        setPin("");
        router.refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Couldn't save PIN");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        id={`pin-${memberId}`}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        placeholder={hasPin ? "New PIN" : "Set PIN"}
        className="h-9 w-24 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm tracking-[0.2em] text-white"
      />
      <button type="button" disabled={pending || pin.length < 4} onClick={() => submit(false)} className="h-9 rounded-sm bg-primary px-3 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-40">
        Save PIN
      </button>
      {hasPin && (
        <button type="button" disabled={pending} onClick={() => submit(true)} className="text-[12px] text-slate-500 hover:text-red-300">
          remove PIN
        </button>
      )}
      {msg && <span className={`text-[12px] ${msg.includes("already") || msg.includes("must") ? "text-red-300" : "text-slate-400"}`}>{msg}</span>}
    </div>
  );
}
