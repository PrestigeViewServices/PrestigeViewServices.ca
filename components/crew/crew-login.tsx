"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One step to get in: your personal PIN. No accounts, no passwords to
 * remember beyond 4 to 6 digits the office gave you.
 */
export function CrewLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crew/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setPin("");
      return setError(data.error ?? "Something went wrong.");
    }
    setWelcome(`Hey ${data.name}. Loading ${data.crew}...`);
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

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
          Your PIN
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
        {welcome && <p className="text-sm text-emerald-300">{welcome}</p>}
        <button
          type="submit"
          disabled={busy || pin.length < 4}
          className="h-14 rounded-full bg-primary text-base font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Your PIN is personal. Don&apos;t have one? Ask your supervisor.
        </p>
      </form>
    </div>
  );
}
