"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo, useSnowStatus } from "./use-site-weather";

const TONES = {
  idle: "",
  amber: "border-amber-400/30 bg-amber-950/90 text-amber-50",
  sky: "border-sky-400/30 bg-sky-950/95 text-sky-50",
  violet: "border-violet-400/30 bg-violet-950/90 text-violet-50",
  emerald: "border-emerald-400/30 bg-emerald-950/90 text-emerald-50",
} as const;

const DOTS = {
  idle: "bg-slate-400",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
} as const;

/**
 * Site-wide storm bar under the header. Renders nothing unless the owner
 * has an active snow event set. Visitors can dismiss it; a new status
 * update brings it back.
 */
export function SnowStatusBar() {
  const status = useSnowStatus();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const stamp = status ? `${status.phase}:${status.updatedAt ?? ""}` : "";
  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem("pvs-snow-bar-dismissed"));
    } catch {
      // storage blocked: just keep showing it
    }
  }, []);

  if (!status || status.phase === "none" || dismissed === stamp) return null;

  const live = status.phase === "deployed" || status.phase === "cleanup";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("relative z-30 border-b", TONES[status.tone])}
    >
      <div className="container-max flex items-center gap-3 py-2 text-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          {live && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                DOTS[status.tone]
              )}
            />
          )}
          <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", DOTS[status.tone])} />
        </span>
        <p className="min-w-0 flex-1">
          <span className="font-semibold">{status.headline}</span>
          <span className="hidden opacity-80 sm:inline"> · {status.detail}</span>
          {status.updatedAt && (
            <span className="ml-1.5 whitespace-nowrap text-xs opacity-60">
              Updated {timeAgo(status.updatedAt)}
            </span>
          )}
        </p>
        <Link
          href="/live-map#snow-status"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide hover:bg-white/20"
        >
          {live ? "Live map" : "Details"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <button
          type="button"
          aria-label="Dismiss storm update"
          className="shrink-0 rounded p-1 opacity-60 hover:opacity-100"
          onClick={() => {
            setDismissed(stamp);
            try {
              sessionStorage.setItem("pvs-snow-bar-dismissed", stamp);
            } catch {
              // ignore
            }
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
