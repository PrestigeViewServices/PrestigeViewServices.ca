"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Invite a friend by email. Sends them the member's link and records the
 * referral at INVITED, so the member can see who they've already reached out
 * to instead of guessing.
 */
export function ReferralInviteForm({ credit }: { credit: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch("/api/account/referral-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        emailed?: boolean;
      } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Couldn't send that invite, please try again.");
        return;
      }
      setSent(
        data.emailed
          ? `Invite sent to ${email}.`
          : `${email} is on your list. Send them your link directly and it'll still count.`
      );
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      setError("Network error, please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="invite-name" className="mb-1.5 block text-sm">
            Their first name
          </Label>
          <Input
            id="invite-name"
            placeholder="Dave"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="invite-email" className="mb-1.5 block text-sm">
            Their email<span className="text-primary"> *</span>
          </Label>
          <Input
            id="invite-email"
            type="email"
            required
            placeholder="dave@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {sent && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{sent}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send invite
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          We&apos;ll email them your link and the {credit} off their first
          service. No spam, one message.
        </p>
      </div>
    </form>
  );
}
