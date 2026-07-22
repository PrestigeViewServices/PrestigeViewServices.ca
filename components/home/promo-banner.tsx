"use client";

import Link from "next/link";
import { Snowflake, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Above-the-fold early-bird promo band. Sits at the very top of the home
 * page, above the hero. Countdown renders client-side only (after mount)
 * so SSR/hydration always agree; until then the static deadline shows.
 */
const DEADLINE = new Date("2026-08-15T00:00:00-04:00"); // through Aug 14 EDT

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRemaining(target.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

export function PromoBanner() {
  const remaining = useCountdown(DEADLINE);
  if (remaining !== null && remaining <= 0) return null;

  const days = remaining !== null ? Math.floor(remaining / 86_400_000) : null;
  const hours =
    remaining !== null ? Math.floor((remaining % 86_400_000) / 3_600_000) : null;

  return (
    <div className="relative z-20 border-b border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900">
      <div className="container-max flex flex-col items-center justify-center gap-2 py-2.5 text-center sm:flex-row sm:gap-4 sm:text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Snowflake className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
          <span>
            Winter Early Bird: <span className="text-sky-300">15% OFF</span>{" "}
            seasonal snow contracts
          </span>
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-sky-200/90">
          {days !== null && hours !== null ? (
            <>
              Ends in {days}d {hours}h. Deadline: August 14
            </>
          ) : (
            <>Deadline: August 14</>
          )}
        </p>
        <Link
          href="/quote?offer=snow-early&service=seasonal-snow-contract"
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950 transition-colors hover:bg-sky-300"
        >
          Lock In My Spot
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
