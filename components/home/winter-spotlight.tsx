import Link from "next/link";
import { ArrowRight, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromoCountdown } from "@/components/winter/promo-countdown";
import { StormNightLazy } from "@/components/winter/storm-night-lazy";
import {
  promoEndsLabel,
  promoIsLive,
  promoPercentLabel,
  type WinterPromoContent,
} from "@/lib/content/winter-campaign";

/**
 * Homepage winter block: the season's priority sell, high on the page while
 * contracts are open. Carries the compact Storm Night preview so the live
 * experience is visible without leaving the homepage.
 */
export function WinterSpotlight({ promo }: { promo: WinterPromoContent }) {
  const live = promoIsLive(promo);
  return (
    <section className="container-max py-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow text-sky-300">
            <Snowflake className="h-3.5 w-3.5" aria-hidden />
            Winter 2026-27 · Routes are filling
          </p>
          <h2 className="heading-section mt-2 text-balance">
            This winter, watch your driveway get cleared from your phone
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Seasonal snow contracts with a 3 cm dispatch trigger, live storm
            updates, and a local Petawawa crew on its own tractors and plow
            trucks. Here is a storm night, start to finish:
          </p>
        </div>
        {live && (
          <p className="shrink-0 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200">
            {promoPercentLabel(promo)} off until {promoEndsLabel(promo)} ·{" "}
            <PromoCountdown endsAt={promo.endsAt} className="font-semibold" />
          </p>
        )}
      </div>

      <StormNightLazy
        compact
        ctaHref="/winter-packages#packages"
        ctaLabel="Get my winter quote"
        source="home-spotlight"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button asChild size="lg" variant="snowland">
          <Link href="/winter-packages?src=home-spotlight">
            Get my winter quote
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/services/fall-cleanup">
            Bundle it with fall cleanup
          </Link>
        </Button>
      </div>
    </section>
  );
}
