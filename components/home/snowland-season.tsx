import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeasonCountdown } from "@/components/winter/season-countdown";
import { SNOW_SEASON } from "@/lib/content/snow-season";
import {
  DRIVEWAY_TIER_DEFS,
  formatMonthly,
  tierMonthlyFromCents,
} from "@/lib/content/winter-packages";

/**
 * The home page's lead section during the snow push: SnowLand Season 2
 * launch countdown, the four passes at their monthly price, and one CTA to
 * the conversion page. Prices come from lib/content/winter-packages.ts so
 * they always match /winter-packages.
 */
export function SnowLandSeason() {
  return (
    <section className="container-max py-14">
      <div className="relative overflow-hidden rounded-3xl border border-sky-400/30">
        <Image
          src="/images/gallery/snow-removal/tractors-staged-night-snowfall.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover opacity-30"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0A1220]/95 via-blue-950/90 to-sky-950/80"
        />

        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
              <Snowflake className="h-3.5 w-3.5" aria-hidden />
              {SNOW_SEASON.name} · Starts {SNOW_SEASON.launchDisplay}
            </p>
            <h2 className="heading-section mt-4 text-balance text-white">
              Never shovel again this winter.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-50/85 sm:text-base">
              Routes start running {SNOW_SEASON.launchDisplayLong} in Petawawa
              and Pembroke. Every pass is capped per route, so once your street
              fills it closes for the season. Reserve now and your driveway is
              staked and on the run before the first storm.
            </p>

            <SeasonCountdown className="mt-6" />

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="snowland">
                <Link href="/winter-packages#packages">
                  Reserve My Snow Pass
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/winter-packages">Compare passes</Link>
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {DRIVEWAY_TIER_DEFS.map((t) => (
              <li key={t.slug}>
                <Link
                  href="/winter-packages#packages"
                  className="group block h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:border-sky-300/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-semibold text-white">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.accent }}
                      />
                      {t.name}
                    </p>
                    {t.badge && (
                      <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200">
                        Capped
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-sky-100/70">Starting at</p>
                  <p className="text-xl font-bold text-white">
                    {formatMonthly(tierMonthlyFromCents(t))}
                    <span className="text-sm font-medium text-sky-100/70">
                      /month
                    </span>
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-sky-50/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
                    {t.features[0]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
