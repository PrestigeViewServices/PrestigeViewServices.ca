"use client";

import { useEffect, useState } from "react";
import { SNOW_SEASON, snowSeasonLaunchMs } from "@/lib/content/snow-season";
import { cn } from "@/lib/utils";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function partsUntil(target: number, now: number): Parts | null {
  const diff = target - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/**
 * Live countdown to the SnowLand season launch (lib/content/snow-season.ts).
 *
 * This is a real date, not fake urgency: it counts to the day routes start
 * running. After launch it switches to "Season is live".
 *
 * Renders blank tiles on the server and fills in after mount, so the server
 * and client HTML always match (no hydration mismatch from the clock).
 */
export function SeasonCountdown({
  className,
  compact = false,
}: {
  className?: string;
  /** Single-line version for banners and bars. */
  compact?: boolean;
}) {
  const target = snowSeasonLaunchMs();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = now === null ? undefined : partsUntil(target, now);

  if (parts === null) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-1.5 text-sm font-bold text-sky-100",
          className
        )}
      >
        {SNOW_SEASON.name} is live. Routes are running.
      </p>
    );
  }

  if (compact) {
    return (
      <span className={cn("tabular-nums", className)} suppressHydrationWarning>
        {parts
          ? `${parts.days}d ${parts.hours}h ${parts.minutes}m`
          : " "}
      </span>
    );
  }

  const tiles: [string, number | undefined][] = [
    ["Days", parts?.days],
    ["Hours", parts?.hours],
    ["Min", parts?.minutes],
    ["Sec", parts?.seconds],
  ];

  return (
    <div
      className={cn("flex gap-2 sm:gap-3", className)}
      role="timer"
      aria-label={`Countdown to ${SNOW_SEASON.name}, starting ${SNOW_SEASON.launchDisplayLong}`}
    >
      {tiles.map(([label, value]) => (
        <div
          key={label}
          className="min-w-[4rem] rounded-2xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-center backdrop-blur-sm sm:min-w-[4.5rem]"
        >
          <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/80">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
