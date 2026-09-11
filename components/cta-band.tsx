import Link from "next/link";
import { ArrowRight, Leaf, Phone, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

/**
 * Full-width final CTA band reused on most pages.
 */
export function CtaBand({
  eyebrow,
  title = "Get a Quote for Your Property",
  description = "Reliable, insured, and local to the Ottawa Valley. We'll get back to you within one business day.",
  primaryLabel = "Get Quote",
  primaryHref = "/quote",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
}) {
  return (
    <section className="container-max py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface/60 p-8 sm:p-14 text-center">
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" />
        <div className="relative">
          {eyebrow && (
            <p className="eyebrow mb-3 text-amber-300">{eyebrow}</p>
          )}
          <h2 className="heading-section text-balance">{title}</h2>
          <p className="mx-auto mt-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            Fall cleanups
            <span aria-hidden>·</span>
            <Snowflake className="h-3.5 w-3.5 text-sky-300" aria-hidden />
            Winter snow passes
          </p>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground text-balance">
            {description}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="xl">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href={`tel:${formatPhone(siteConfig.phone)}`}>
                <Phone className="h-4 w-4" />
                {siteConfig.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
