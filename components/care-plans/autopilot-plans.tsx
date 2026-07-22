import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { PlanCard } from "./plan-card";
import { DiscountBadges } from "./discount-badges";
import {
  getCarePlan,
  getServiceDef,
  formatDollars,
  quoteHref,
  type ServicePlanConfig,
} from "@/lib/content/care-plans";

/**
 * "Put it on autopilot, Care Plans" section, dropped into a service page so
 * visitors see the recurring option tied to the exact service they came for.
 *
 * Server component, reads the placement config and renders the featured plan
 * cards plus the matching à-la-carte one-off "from" price.
 */
export function AutopilotPlans({
  serviceName,
  serviceSlug,
  config,
}: {
  serviceName: string;
  serviceSlug: string;
  config: ServicePlanConfig;
}) {
  const plans = config.planSlugs
    .map((slug) => getCarePlan(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const aLaCarte = config.aLaCarte.map((key) => getServiceDef(key));

  return (
    <section
      id="care-plans"
      className="container-max scroll-mt-24 py-14 sm:py-20"
    >
      <SectionHeading
        eyebrow="Put it on autopilot, Care Plans"
        title={`Never think about ${serviceName.toLowerCase()} again`}
        description="Spread the work across the season on one monthly payment. We schedule it, call you, and show up, you just enjoy the result."
        align="left"
      />

      <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p.slug}
            name={p.name}
            price={formatDollars(p.monthly)}
            period="/mo"
            startsAt
            tagline={p.tagline}
            includes={p.includes}
            bestFor={p.bestFor}
            mostPopular={p.mostPopular}
            ctaHref={quoteHref({ service: serviceSlug, plan: p.slug })}
          />
        ))}
      </div>

      {/* À-la-carte one-off pricing for visitors who just want this once. */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">Just need it once?</span>
          {aLaCarte.map((s) => (
            <span key={s.key} className="text-sm text-muted-foreground">
              {s.label} from{" "}
              <span className="font-semibold text-foreground">
                {formatDollars(s.oneOffFrom)}
              </span>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={quoteHref({ service: serviceSlug })}>
              One-off quote
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/care-plans">
              Compare all plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <DiscountBadges className="mt-6" />
    </section>
  );
}
