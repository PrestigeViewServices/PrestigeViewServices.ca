"use client";

import { useState } from "react";
import { Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Channel = { sent: boolean; reason?: string };
type Result = {
  ok: boolean;
  email: Channel;
  sms: Channel;
  recipients: string[];
  error?: string;
};

/**
 * "Send test alert" control for the admin Command Center.
 *
 * Shows the provider's own failure text rather than a generic error, because
 * the two ways owner notifications break (missing RESEND_API_KEY, and an
 * unverified sender domain) look identical from the outside and need
 * different fixes.
 */
export function NotifyTestButton() {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function send() {
    setState("sending");
    setResult(null);
    try {
      const res = await fetch("/api/admin/notify-test", { method: "POST" });
      setResult(await res.json());
    } catch (err) {
      setResult({
        ok: false,
        email: { sent: false, reason: String(err) },
        sms: { sent: false, reason: String(err) },
        recipients: [],
      });
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="mt-4 border-t border-amber-500/20 pt-4">
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-400/20 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        {state === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        {state === "sending" ? "Sending…" : "Send test alert"}
      </button>

      {result && (
        <div className="mt-3 space-y-2 text-xs">
          {result.error ? (
            <ChannelLine label="Request" sent={false} reason={result.error} />
          ) : (
            <>
              <ChannelLine
                label="Email"
                sent={result.email?.sent}
                reason={result.email?.reason}
              />
              <ChannelLine
                label="Text"
                sent={result.sms?.sent}
                reason={result.sms?.reason}
              />
            </>
          )}
          {result.email?.sent && result.recipients?.length > 0 && (
            <p className="text-amber-100/60">
              Check {result.recipients.join(", ")}. Look in spam if it is not
              in the inbox.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelLine({
  label,
  sent,
  reason,
}: {
  label: string;
  sent?: boolean;
  reason?: string;
}) {
  return (
    <p className="flex items-start gap-2">
      {sent ? (
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
          aria-hidden
        />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
      )}
      <span>
        <strong className="text-amber-100">{label}:</strong>{" "}
        <span className="text-amber-100/80">
          {sent ? "sent" : (reason ?? "failed")}
        </span>
      </span>
    </p>
  );
}
