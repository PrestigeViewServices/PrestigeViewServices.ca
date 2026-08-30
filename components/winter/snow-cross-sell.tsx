import Link from "next/link";
import { ArrowRight, BellRing, Radar, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Add snow removal" cross-sell band, dropped near the CTA on every
 * non-winter service page. `source` tags the click so the lead records
 * which page produced it.
 */
export function SnowCrossSell({ source }: { source: string }) {
  return (
    <section className="container-max pb-14 sm:pb-20">
      <div className="overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Snowflake className="h-4 w-4 shrink-0" aria-hidden />
              Winter 2026-27
            </p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              While we are at your place, lock in your snow spot
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100/80">
              Seasonal snow contracts with a 3 cm dispatch trigger and live
              storm updates on your phone. Routes are capped and close when
              they fill.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-sky-100/70">
              <span className="inline-flex items-center gap-1.5">
                <Radar className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Crews roll at 3 cm, no calls
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Live storm alerts in your Aurora portal
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button asChild size="lg" variant="snowland">
              <Link href={`/winter-packages?src=${encodeURIComponent(source)}`}>
                Get my winter quote
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link
                href={`/winter-packages?src=${encodeURIComponent(source)}#storm-night`}
              >
                See how a storm night works
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
