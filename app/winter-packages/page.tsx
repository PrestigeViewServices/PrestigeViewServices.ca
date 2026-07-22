import type { Metadata } from "next";
import { Check, X, Snowflake, Shovel } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { ServiceAmbience } from "@/components/service-ambience";
import { BenefitMatcher } from "@/components/winter/benefit-matcher";
import { EstimatorForm } from "@/components/winter/estimator-form";
import {
  DRIVEWAY_TIER_DEFS,
  SHOVELING_TIER_DEFS,
  type DrivewayTier,
} from "@/lib/content/winter-packages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Winter Packages, Snow Removal Pricing | Prestige View Services",
  description:
    "Choose a seasonal snow removal package for your Petawawa, Pembroke, or Ottawa Valley driveway. Get an instant estimate and reserve your spot in one form.",
  alternates: { canonical: "/winter-packages" },
};

const TIER_ACCENTS: Record<DrivewayTier, string> = {
  BRONZE: "from-amber-700/30 to-amber-900/10 border-amber-500/30",
  SILVER: "from-slate-300/20 to-slate-500/10 border-slate-300/30",
  GOLD: "from-yellow-400/20 to-yellow-700/10 border-yellow-400/40",
  PLATINUM: "from-sky-300/20 to-blue-600/10 border-sky-300/40",
};

export default function WinterPackagesPage() {
  return (
    <>
      <ServiceAmbience theme="snow" />
      <section className="container-max pt-14 sm:pt-20 pb-4 relative">
        <SectionHeading
          eyebrow="Year-Round Property Care, Modernized"
          title="Winter Packages for Ottawa Valley Driveways"
          description={`Pick a tier that matches how proactive you want us to be, Bronze for budget, Platinum for white-glove storm management. Add walkway shoveling if you need it. Reserve your spot below and we'll send a custom quote for your driveway.`}
        />
      </section>

      <section className="container-max pb-8 relative" id="match">
        <BenefitMatcher />
      </section>

      <section className="container-max py-10 relative" id="compare">
        <div className="flex items-center gap-2 mb-6">
          <Snowflake className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Driveway plowing tiers</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DRIVEWAY_TIER_DEFS.map((t) => (
            <article
              key={t.slug}
              className={`relative rounded-3xl border bg-gradient-to-br p-6 ${TIER_ACCENTS[t.slug]}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">{t.name}</h3>
                <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Seasonal
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t.blurb}
              </p>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Seasonal flat rate
                </p>
                <p className="mt-1 text-2xl font-bold">Custom quote</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Priced to your driveway, free, no obligation
                </p>
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-300" />
                    <span>{f}</span>
                  </li>
                ))}
                {t.excluded.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-400/80" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="container-max py-10">
        <div className="flex items-center gap-2 mb-3">
          <Shovel className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">
            Walkway shovelling pass packs (optional add-on)
          </h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Buy a pack of shovelling visits, each visit covers your walkway, porch
          &amp; back deck. Storms often need two passes, so bigger packs are built
          for 2-passes-per-event coverage all winter. Per-visit pricing is scoped
          to your property, so we&apos;ll send a custom quote.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SHOVELING_TIER_DEFS.map((t) => (
            <article
              key={t.slug}
              className="surface-card p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight">{t.name}</h3>
                <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pass pack
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t.blurb}
              </p>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pack size
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {t.passes}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    visits
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Custom quote, priced per visit by walkway size
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-300" />
                    <span>{f}</span>
                  </li>
                ))}
                {t.excluded.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-400/80" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="container-max py-12" id="reserve">
        <SectionHeading
          eyebrow="Reserve"
          title="Reserve Your Spot"
          description={`Pick your package and reserve your spot in one form. We'll send your custom seasonal quote after a quick property check, usually within one business day. No payment is collected today.`}
        />
        <div className="mt-10 mx-auto max-w-3xl">
          <EstimatorForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Serving {siteConfig.serviceArea}. Your seasonal price depends on
          driveway dimensions, slope, and accessibility, we&apos;ll confirm it
          after a quick property check.
        </p>
      </section>

      <CtaBand
        title="Not Sure Which Tier Fits?"
        description="Call us and we'll walk through your driveway in 5 minutes."
        primaryLabel="Talk to Us"
        primaryHref="/contact"
      />
    </>
  );
}
