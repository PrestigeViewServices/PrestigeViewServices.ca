import { Medal, Snowflake } from "lucide-react";

/**
 * Urgency bar for the winter packages page.
 *
 * Scarcity only. The 15% early-bird discount was retired 2026-08-23 at the
 * owner's request, so there is no countdown, no code, and no percentage
 * anywhere on this bar. Route capacity is the honest scarcity lever: each
 * route really is capped, and it closes when it fills.
 */
export function OfferCountdown() {
  return (
    <section className="container-max py-6">
      <div className="overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Snowflake className="h-4 w-4 shrink-0" aria-hidden />
              Routes are filling
            </p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Limited spots per package. Reserve your driveway.
            </h2>
            <p className="mt-1.5 text-sm text-sky-100/80">
              Each route is capped so response times hold through a storm. Once
              a package fills in your area, it closes for the season.
            </p>
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
