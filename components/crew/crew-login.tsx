"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Crew = { id: string; name: string; members: { id: string; name: string }[] };

/**
 * Two taps to get in: crew PIN, then your name. No accounts.
 */
export function CrewLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [crew, setCrew] = useState<Crew | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crew/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setCrew(data.crew);
  }

  async function pickMember(memberId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crew/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin, memberId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return setError(data.error ?? "Something went wrong.");
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-8 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/images/logo.png"
          alt="Prestige View Services"
          width={220}
          height={90}
          priority
          className="h-auto w-[200px]"
        />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Game Plan</h1>
          <p className="mt-1 text-sm text-slate-400">Crew sign-in</p>
        </div>
      </div>

      {!crew ? (
        <form onSubmit={submitPin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Crew PIN
            <input
              id="crew-pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-16 rounded-2xl border border-white/10 bg-white/[0.04] text-center text-3xl font-bold tracking-[0.4em] text-white outline-none focus:border-primary"
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={busy || pin.length < 4}
            className="h-14 rounded-full bg-primary text-base font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Checking..." : "Continue"}
          </button>
          <p className="text-center text-xs text-slate-500">
            Don&apos;t have the PIN? Ask your supervisor.
          </p>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-300">
              {crew.name}
            </p>
            <h2 className="mt-1 text-lg font-semibold">Who are you?</h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {crew.members.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={busy}
                onClick={() => pickMember(m.id)}
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] text-left text-base font-semibold text-white transition hover:border-primary hover:bg-primary/10 disabled:opacity-50 px-5"
              >
                {m.name}
              </button>
            ))}
            {crew.members.length === 0 && (
              <p className="text-center text-sm text-slate-400">
                No one is on this crew yet. The office needs to add names under Team.
              </p>
            )}
          </div>
          {error && <p className="text-center text-sm text-red-300">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setCrew(null);
              setPin("");
            }}
            className="text-sm text-slate-400 underline-offset-4 hover:underline"
          >
            Wrong crew? Go back
          </button>
        </div>
      )}
    </div>
  );
}
