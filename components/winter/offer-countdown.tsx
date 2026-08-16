"use client";

import { useEffect, useState } from "react";
import { Medal, Snowflake, Timer } from "lucide-react";
import {
  EARLYBIRD_CODE,
  EARLYBIRD_DEADLINE,
  EARLYBIRD_DEADLINE_LABEL,
} from "@/lib/lead-schema";

/**
 * Early-bird urgency bar with a live countdown.
 *
 * Two states, and it moves between them on its own:
 *  - Before the deadline: the discount plus a ticking d/h/m readout.
 *  - After it: swaps to scarcity messaging. It never renders negative time,
 *    and it never needs a human to remember to take the offer down.
 *
 * The countdown is client-only after mount. Server render and first paint
 * show the deadline date instead of a timer so SSR and hydration always
 * agree, then the timer fills in.
 */

const DEADLINE = new Date(EARLYBIRD_DEADLINE).getTime();

type Remaining = { days: number; hours: number; minutes: number } | null;

function useRemaining(): { value: Remaining; expired: boolean | null } {
  // null = not yet measured on the client, so render the neutral variant.
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(DEADLINE - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (ms === null) return { value: null, expired: null };
  if (ms <= 0) return { value: null, expired: true };

  return {
    value: {
      days: Math.floor(ms / 86_400_000),
      hours: Math.floor((ms % 86_400_000) / 3_600_000),
      minutes: Math.floor((ms % 3_600_000) / 60_000),
    },
    expired: false,
  };
}

export function OfferCountdown() {
  const { value, expired } = useRemaining();

  return (
    <section className="container-max py-6">
      <div className="overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0">
            {expired ? (
              <>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
                  <Snowflake className="h-4 w-4 shrink-0" aria-hidden />
                  Routes are filling
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Limited spots per package. Reserve your driveway.
                </h2>
                <p className="mt-1.5 text-sm text-sky-100/80">
                  Each route is capped so response times hold through a storm.
                  Once a package fills in your area, it closes for the season.
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
                  <Timer className="h-4 w-4 shrink-0" aria-hidden />
                  Early bird
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  15% off with code {EARLYBIRD_CODE}
                </h2>
                <p className="mt-1.5 text-sm text-sky-100/80">
                  {value ? (
                    <>
                      Ends in{" "}
                      <strong className="text-white tabular-nums">
                        {value.days}d {value.hours}h {value.minutes}m
                      </strong>
                      , on {EARLYBIRD_DEADLINE_LABEL}.
                    </>
                  ) : (
                    <>Ends {EARLYBIRD_DEADLINE_LABEL}.</>
                  )}{" "}
                  Mention the code when you request your quote.
                </p>
              </>
            )}
          </div>

          <p className="flex shrink-0 items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200">
            <Medal className="h-4 w-4 shrink-0" aria-hidden />
            Military and veterans always save 10%
          </p>
        </div>
      </div>
    </section>
  );
}
