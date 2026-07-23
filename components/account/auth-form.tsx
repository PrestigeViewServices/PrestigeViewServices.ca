"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "sign-in" | "sign-up";

/**
 * Sign in / create account for the Prestige Club portal. Posts to our own
 * auth routes; success sets the member cookie and the refresh re-renders
 * the portal server-side on whatever /account URL the visitor was on.
 */
export function AccountAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [hp, setHp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url =
      mode === "sign-in" ? "/api/account/login" : "/api/account/register";
    const body =
      mode === "sign-in"
        ? { email, password }
        : { firstName, lastName, email, phone, password, hp };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    setError(data?.error ?? "Something went wrong, please try again.");
    setBusy(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="surface-card p-6 sm:p-8">
        {/* Mode toggle */}
        <div
          role="group"
          aria-label="Sign in or create account"
          className="grid grid-cols-2 rounded-full border border-surface-border bg-surface/60 p-1 text-sm font-semibold"
        >
          {(
            [
              ["sign-in", "Sign in"],
              ["sign-up", "Join free"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              aria-pressed={mode === value}
              className={`rounded-full px-4 py-2 transition-colors ${
                mode === value
                  ? "bg-gradient-primary text-white shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Honeypot */}
          <input
            type="text"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
          />

          {mode === "sign-up" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="acct-first" className="mb-1.5 block text-sm">
                  First name<span className="text-primary"> *</span>
                </Label>
                <Input
                  id="acct-first"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="acct-last" className="mb-1.5 block text-sm">
                  Last name
                </Label>
                <Input
                  id="acct-last"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="acct-email" className="mb-1.5 block text-sm">
              Email<span className="text-primary"> *</span>
            </Label>
            <Input
              id="acct-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode === "sign-up" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Use the email we have on file and your service history connects
                automatically.
              </p>
            )}
          </div>

          {mode === "sign-up" && (
            <div>
              <Label htmlFor="acct-phone" className="mb-1.5 block text-sm">
                Phone
              </Label>
              <Input
                id="acct-phone"
                type="tel"
                autoComplete="tel"
                placeholder="(613) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="acct-password" className="mb-1.5 block text-sm">
              Password<span className="text-primary"> *</span>
            </Label>
            <Input
              id="acct-password"
              type="password"
              required
              minLength={mode === "sign-up" ? 8 : undefined}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "sign-up" && (
              <p className="mt-1 text-xs text-muted-foreground">
                At least 8 characters.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                One moment…
              </>
            ) : mode === "sign-in" ? (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create my free account
              </>
            )}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Military, veteran, or first responder? Your 10% discount is waiting,
        set it in your profile after you join.
      </p>
    </div>
  );
}
