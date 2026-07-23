"use client";

import { useState } from "react";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sets the password on a pre-provisioned account, then enters the portal. */
export function ClaimForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      window.location.assign("/account");
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
      <form onSubmit={onSubmit} className="surface-card space-y-4 p-6 sm:p-8">
        <div>
          <Label className="mb-1.5 block text-sm">Email</Label>
          <Input value={email} disabled className="opacity-60" />
        </div>
        <div>
          <Label htmlFor="claim-password" className="mb-1.5 block text-sm">
            Choose a password<span className="text-primary"> *</span>
          </Label>
          <Input
            id="claim-password"
            type="password"
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            At least 8 characters.
          </p>
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
              Claiming…
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Claim my account
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
