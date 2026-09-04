"use client";

import { useState, useTransition } from "react";
import { CalendarClock, X } from "lucide-react";

/**
 * Inline "next follow-up" scheduler for a lead card. One-tap presets cover
 * the common promises ("I'll call you tomorrow / next week"); the date input
 * handles everything else. Saves via the passed-in server action, which
 * receives an ISO date string or null (clear).
 */
export function FollowUpPicker({
  rowId,
  current,
  action,
}: {
  rowId: string;
  /** ISO string of the currently scheduled follow-up, if any. */
  current: string | null;
  action: (id: string, followUpAt: string | null) => Promise<void>;
}) {
  const [value, setValue] = useState<string | null>(current);
  const [isPending, startTransition] = useTransition();

  function save(next: Date | null) {
    const prev = value;
    setValue(next ? next.toISOString() : null);
    startTransition(async () => {
      try {
        await action(rowId, next ? next.toISOString() : null);
      } catch {
        setValue(prev);
      }
    });
  }

  function preset(days: number) {
    // 9am local on the target day — a callable hour, not midnight.
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    save(d);
  }

  const scheduled = value ? new Date(value) : null;
  const overdue = scheduled !== null && scheduled.getTime() <= Date.now();

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        Follow up
      </span>
      {scheduled ? (
        <>
          <span
            className={`rounded-full border px-2 py-0.5 font-medium ${
              overdue
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border-surface-border bg-surface/60 text-foreground/90"
            }`}
          >
            {scheduled.toLocaleDateString("en-CA", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {overdue && " · overdue"}
          </span>
          <button
            type="button"
            onClick={() => save(null)}
            disabled={isPending}
            title="Clear follow-up"
            className="grid h-5 w-5 place-items-center rounded-full border border-surface-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <>
          {[
            { label: "Tomorrow", days: 1 },
            { label: "3 days", days: 3 },
            { label: "1 week", days: 7 },
          ].map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => preset(p.days)}
              disabled={isPending}
              className="rounded-full border border-surface-border px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
          <input
            type="date"
            aria-label="Pick a follow-up date"
            min={new Date().toISOString().slice(0, 10)}
            disabled={isPending}
            onChange={(e) => {
              if (!e.target.value) return;
              const [y, m, d] = e.target.value.split("-").map(Number);
              save(new Date(y, m - 1, d, 9, 0, 0, 0));
            }}
            className="h-6 rounded-lg border border-surface-border bg-input/80 px-1.5 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </>
      )}
    </div>
  );
}
