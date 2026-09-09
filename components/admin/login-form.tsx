"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Standalone login for the internal admin dashboard. Posts the email and
 * password to /api/admin/login; a match sets the session cookie and the
 * refresh re-renders the dashboard server-side.
 *
 * Any saved sign-in works here, as does the ADMIN_EMAIL / ADMIN_PASSWORD
 * recovery login — see lib/admin-session.ts.
 */
export function AdminLoginForm({
  diagnostics,
}: {
  diagnostics?: {
    hasPassword: boolean;
    hasEmail: boolean;
    hasSessionSecret: boolean;
    maskedEmail: string | null;
  };
}) {
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
          Staff access only. Sign in with your dashboard email and password.
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
      <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
        <p>Sessions last 30 days on this device.</p>
        <details className="mx-auto max-w-xs text-left">
          <summary className="cursor-pointer text-center hover:text-foreground">
            Can&apos;t get in?
          </summary>
          {diagnostics && (
            <div className="mt-3 rounded-xl border border-surface-border p-3">
              <p className="mb-2 font-medium text-foreground">
                What this deployment has:
              </p>
              <ul className="space-y-1">
                <Check2 ok={diagnostics.hasPassword} label="ADMIN_PASSWORD" />
                <Check2
                  ok={diagnostics.hasEmail}
                  label={
                    diagnostics.maskedEmail
                      ? `ADMIN_EMAIL (${diagnostics.maskedEmail})`
                      : "ADMIN_EMAIL"
                  }
                />
                <Check2
                  ok={diagnostics.hasSessionSecret}
                  label="ADMIN_SESSION_SECRET"
                />
              </ul>
              <p className="mt-2 leading-relaxed">
                {!diagnostics.hasPassword
                  ? "Set ADMIN_PASSWORD in Vercel and redeploy — sign-in cannot work without it."
                  : !diagnostics.hasEmail
                    ? "ADMIN_EMAIL is unset, so the recovery password works with any email address."
                    : "Sign in with the email shown above and the ADMIN_PASSWORD set in Vercel. If that address is wrong, fix ADMIN_EMAIL in Vercel and redeploy."}
              </p>
            </div>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
            <li>
              The recovery email and password from the hosting environment
              always work, even if a saved password was changed.
            </li>
            <li>
              Or reset any password from a terminal with{" "}
              <code>npm run admin reset your@email</code>.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

/** One config row in the "Can't get in?" panel. Booleans only, no values. */
function Check2({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      ) : (
        <X className="h-3.5 w-3.5 shrink-0 text-rose-400" />
      )}
      <code className={ok ? "text-emerald-200" : "text-rose-200"}>{label}</code>
      <span>{ok ? "set" : "MISSING"}</span>
    </li>
  );
}
