import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import type { Service } from "@/lib/content/services";
import { getDivision } from "@/lib/content/divisions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accentText: Record<string, string> = {
  lawn: "text-emerald-400",
  clearview: "text-blue-400",
  snowland: "text-sky-400",
};

const accentBg: Record<string, string> = {
  lawn: "bg-emerald-500/15 text-emerald-400",
  clearview: "bg-blue-500/15 text-blue-400",
  snowland: "bg-sky-500/15 text-sky-400",
};

const quoteVariant: Record<string, "lawn" | "primary" | "snowland"> = {
  lawn: "lawn",
  clearview: "primary",
  snowland: "snowland",
};

export function ServiceCard({
  service,
  /** Where the per-card "Get Quote" button should send the user.
   *  Default = `/quote`. On division pages we pass `#quote-form` so the
   *  button scrolls to the embedded Aurora form on the same page. */
  quoteHref = "/quote",
}: {
  service: Service;
  quoteHref?: string;
}) {
  const division = getDivision(service.division);
  const accent = division.accent;
  const Icon = service.icon;

  return (
    <article className="group relative surface-card surface-card-hover p-6 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl",
            accentBg[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h3 className="mt-5 text-xl font-semibold leading-tight">
        {/* Stretched-link: ::before overlays the whole card so the entire
            article is clickable. The Get Quote button below uses relative+z-10
            to stay interactive on top of the overlay. */}
        <Link
          href={`/services/${service.slug}`}
          className="before:absolute before:inset-0 before:rounded-2xl before:content-[''] hover:text-primary transition-colors"
        >
          {service.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {service.shortDescription}
      </p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {service.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                accentText[accent]
              )}
              strokeWidth={3}
            />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-6 pt-6 border-t border-surface-border flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:translate-x-0.5 transition-transform">
          Learn more
          <ArrowRight className="h-4 w-4" />
        </span>
        <Button
          asChild
          variant={quoteVariant[accent]}
          size="md"
        >
          <Link href={quoteHref}>
            Get Quote
          </Link>
        </Button>
      </div>
    </article>
  );
}
