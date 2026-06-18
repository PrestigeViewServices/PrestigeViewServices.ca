import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlanCardItem = { icon: LucideIcon; label: string };

export type PlanCardProps = {
  name: string;
  /** Already-formatted price, e.g. "$49" or "$499". */
  price: string;
  /** Period suffix, e.g. "/mo" or "once". Omit for none. */
  period?: string;
  /** Prefix the price with "from". */
  isFrom?: boolean;
  tagline: string;
  includes: PlanCardItem[];
  bestFor: string;
  ctaHref: string;
  ctaLabel?: string;
  mostPopular?: boolean;
  className?: string;
};

/**
 * Presentational plan / package card. No client hooks, so it renders on the
 * server and also slots inside the client-side pricing toggle.
 *
 * Matches the site's surface-card language: rounded-2xl, soft shadow, and the
 * shared `surface-card-hover` lift. The "Most Popular" variant gets an accent
 * ring + glow + badge.
 */
export function PlanCard({
  name,
  price,
  period,
  isFrom,
  tagline,
  includes,
  bestFor,
  ctaHref,
  ctaLabel = "Get a Free Quote",
  mostPopular = false,
  className,
}: PlanCardProps) {
  return (
    <article
      className={cn(
        "surface-card surface-card-hover relative flex flex-col p-6 sm:p-7",
        mostPopular &&
          "border-primary/60 ring-2 ring-primary/50 shadow-glow",
        className
      )}
    >
      {mostPopular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-glow">
          <Star className="h-3 w-3 fill-current" />
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-bold tracking-tight">{name}</h3>
      <p className="mt-1.5 min-h-[2.5rem] text-sm text-muted-foreground leading-relaxed">
        {tagline}
      </p>

      <div className="mt-4 flex items-end gap-1">
        {isFrom && (
          <span className="mb-1 text-sm font-medium text-muted-foreground">
            from
          </span>
        )}
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        {period && (
          <span className="mb-1 text-sm font-medium text-muted-foreground">
            {period}
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-2.5 text-sm">
        {includes.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-3 w-3" />
              </span>
              <span className="text-foreground/90">{item.label}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 flex items-center gap-2 rounded-lg border border-surface-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
        <span>
          <span className="font-semibold text-foreground/80">Best for:</span>{" "}
          {bestFor}
        </span>
      </p>

      <Button asChild className="mt-6 w-full" variant={mostPopular ? "primary" : "outline"}>
        <Link href={ctaHref}>
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}
