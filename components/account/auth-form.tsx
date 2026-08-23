"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgePercent,
  Loader2,
  LogIn,
  Tag,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "sign-in" | "sign-up";

/**
 * Sign in / create account for the Prestige Club portal. Posts to our own
 * auth routes; success sets the member cookie and the refresh re-renders
 * the portal server-side on whatever /account URL the visitor was on.
 */
export type AccountAuthProps = {
  /** e.g. "5%" — omit to hide the sign-up discount copy. */
  discountLabel?: string | null;
};

export function AccountAuth({ discountLabel = null }: AccountAuthProps) {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [showRefField, setShowRefField] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-in");

  // Read ?ref= off the URL after mount rather than with useSearchParams: this
  // form lives in the /account LAYOUT, which never receives searchParams, and
  // useSearchParams would force a Suspense boundary around it for no gain.
  // Someone arriving on a referral link is here to join, not to sign in, so
  // open on the sign-up tab with their friend's code filled in.
  useEffect(() => {
    const code = (new URLSearchParams(window.location.search).get("ref") ?? "")
      .trim()
      .toUpperCase();
    if (!code) return;
    setReferralCode(code);
    setShowRefField(true);
    setMode("sign-up");
  }, []);
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
        : { firstName, lastName, email, phone, password, referralCode, hp };
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
        {discountLabel && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-sm">
            <BadgePercent
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden
            />
            <p className="leading-relaxed">
              <span className="font-semibold">
                Save {discountLabel} on your next service
              </span>{" "}
              <span className="text-muted-foreground">
                just for creating a free account. Takes about thirty seconds.
              </span>
            </p>
          </div>
        )}

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

          {mode === "sign-up" &&
            (showRefField ? (
              <div>
                <Label htmlFor="acct-ref" className="mb-1.5 block text-sm">
                  Referral code
                </Label>
                <Input
                  id="acct-ref"
                  placeholder="JORDAN-4X2K"
                  autoCapitalize="characters"
                  className="font-mono uppercase"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  From a friend who already uses PVS. It credits them once you
                  book your first service.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRefField(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Tag className="h-3.5 w-3.5" />
                I have a referral code
              </button>
            ))}

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
