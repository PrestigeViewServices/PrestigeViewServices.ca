import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Three sizes share one source-of-truth href (siteConfig.googleReviewUrl).
 *
 *   "callout" — the dark gradient card dropped on /quote post-form,
 *               /account, and anywhere we want to nudge a happy customer.
 *   "button"  — a prominent CTA used on the /reviews page hero.
 *   "link"    — a small footer link.
 *
 * Every variant opens Google in a new tab with rel="noopener noreferrer".
 */
type Variant = "callout" | "button" | "link";

export function ReviewCta({
  variant = "callout",
  className,
  label,
  body,
}: {
  variant?: Variant;
  className?: string;
  label?: string;
  body?: string;
}) {
  const href = siteConfig.googleReviewUrl;
  const defaultLabel = "Leave Us a Google Review";

  if (variant === "link") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
      >
        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
        <span>Review us on Google</span>
      </a>
    );
  }

  if (variant === "button") {
    return (
      <Button asChild size="xl" className={className}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Star className="h-4 w-4 fill-white" />
          {label ?? defaultLabel}
          <ExternalLink className="h-4 w-4 opacity-80" />
        </a>
      </Button>
    );
  }

  // callout
  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-6 sm:p-7",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300 shrink-0">
          <Star className="h-6 w-6 fill-yellow-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold leading-tight">
            {label ?? "Loved your service?"}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {body ??
              "A 30-second Google review helps your neighbours find us. Thanks for taking the time."}
          </p>
          <div className="mt-4">
            <Button asChild size="md">
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Star className="h-4 w-4 fill-white" />
                Review us on Google
                <ExternalLink className="h-4 w-4 opacity-80" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
