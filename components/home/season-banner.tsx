import Link from "next/link";
import { Leaf, ArrowRight } from "lucide-react";

/**
 * Seasonal band at the very top of the home page, above the hero.
 *
 * Replaced the old early-bird promo banner on 2026-08-23 when the 15%
 * discount was retired. This one sells the calendar instead of a discount:
 * fall cleanups and gutter cleaning are what convert in late August, and
 * they are the natural on-ramp to a winter snow contract.
 *
 * Static and server-rendered. No countdown, no dates to go stale.
 */
export function SeasonBanner() {
  return (
    <div className="relative z-20 border-b border-amber-400/25 bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950/70">
      <div className="container-max flex flex-col items-center justify-center gap-2 py-2.5 text-center sm:flex-row sm:gap-4 sm:text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Leaf className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <span>
            Now booking <span className="text-amber-300">fall cleanups</span>{" "}
            &amp; <span className="text-amber-300">gutter cleaning</span>
          </span>
        </p>
        <p className="text-xs font-medium uppercase tracking-wider text-amber-100/80">
          Winter snow routes fill right behind them
        </p>
        <Link
          href="/quote?service=fall-cleanup"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950 transition-colors hover:bg-amber-300"
        >
          Book My Cleanup
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
