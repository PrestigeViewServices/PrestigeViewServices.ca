"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Standalone owner login for the internal admin dashboard. Posts the
 * password to /api/admin/login; a valid password sets the session cookie
 * and the refresh re-renders the dashboard server-side.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.refresh();
      return;
    }
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    setError(body?.error ?? "Something went wrong, try again.");
    setBusy(false);
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="surface-card p-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">
          PVS Admin
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Owner access only. Enter the admin password to open the dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div>
            <Label htmlFor="admin-email" className="mb-1.5 block text-sm">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admin-password" className="mb-1.5 block text-sm">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
                Signing in…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Open dashboard
              </>
            )}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Sessions last 30 days on this device.
      </p>
    </div>
  );
}
