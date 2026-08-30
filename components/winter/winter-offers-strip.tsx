import { BadgePercent, Medal, Snowflake, Users } from "lucide-react";
import {
  DISCOUNT_RULE,
  WINTER_DISCOUNTS,
  promoEndsLabel,
  promoIsLive,
  promoPercentLabel,
  type WinterPromoContent,
} from "@/lib/content/winter-campaign";
import { PromoCountdown } from "@/components/winter/promo-countdown";

/**
 * The discount ladder + urgency strip for the winter page. Every number a
 * customer can save with, stated once, plainly, with the no-stacking rule
 * spelled out. The public promo row and its countdown disappear on their own
 * when the promo is switched off or the end date passes.
 */
export function WinterOffersStrip({ promo }: { promo: WinterPromoContent }) {
  const live = promoIsLive(promo);
  const discounts = WINTER_DISCOUNTS.filter((d) => !d.promoGated || live);

  const ICONS = {
    EARLYBIRD: Users,
    PUBLIC: BadgePercent,
    VETERAN: Medal,
  } as const;

  return (
    <section id="discounts" className="container-max scroll-mt-24 py-6">
      <div className="overflow-hidden rounded-3xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Snowflake className="h-4 w-4 shrink-0" aria-hidden />
              Ways to save this winter
            </p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Three discounts. The best one applies.
            </h2>
          </div>
          {live && (
            <PromoCountdown
              endsAt={promo.endsAt}
              className="inline-flex w-fit shrink-0 items-center rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200"
            />
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {discounts.map((d) => {
            const Icon = ICONS[d.key];
            const isPromo = d.key === "PUBLIC";
            return (
              <div
                key={d.key}
                className={`rounded-2xl border p-4 ${
                  isPromo
                    ? "border-amber-300/40 bg-amber-400/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isPromo ? "text-amber-300" : "text-sky-300"}`}
                    aria-hidden
                  />
                  <span
                    className={`text-2xl font-bold tabular-nums tracking-tight ${
                      isPromo ? "text-amber-200" : "text-white"
                    }`}
                  >
                    {isPromo ? promoPercentLabel(promo) : d.percentLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {d.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-sky-100/70">
                  {isPromo && promoEndsLabel(promo)
                    ? `${d.detail} Ends ${promoEndsLabel(promo)}.`
                    : d.detail}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-medium text-sky-100/70">
          {DISCOUNT_RULE} Routes stay capped either way, so a package can
          close in your area before any deadline does.
        </p>
      </div>
    </section>
  );
}
