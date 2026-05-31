import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import type { Division } from "@/lib/content/divisions";
import { siteConfig } from "@/lib/site";
import { formatPhone, cn } from "@/lib/utils";

const accentText = {
  lawn: "text-emerald-400",
  clearview: "text-blue-400",
  snowland: "text-sky-400",
} as const;

const ctaVariant = {
  lawn: "lawn",
  clearview: "primary",
  snowland: "snowland",
} as const;

const radial = {
  lawn: "bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(34,197,94,0.18),transparent_60%)]",
  clearview:
    "bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(59,130,246,0.18),transparent_60%)]",
  snowland:
    "bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.2),transparent_60%)]",
} as const;

export function DivisionHero({ division }: { division: Division }) {
  return (
    <section className="relative overflow-hidden">
      <div className={cn("pointer-events-none absolute inset-0", radial[division.accent])} />
      <div className="container-max relative pt-14 pb-16 sm:pt-20 sm:pb-20 text-center">
        <div className="flex justify-center mb-6">
          <BrandLockup variant={division.slug} href={`/divisions/${division.slug}`} />
        </div>
        <p className={cn("eyebrow justify-center mb-4", accentText[division.accent])}>
          {division.tagline}
        </p>
        <h1 className="heading-display max-w-3xl mx-auto text-balance">
          {division.name}
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
          {division.longDescription}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="xl" variant={ctaVariant[division.accent]}>
            <Link href="/quote">
              Get Quote
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
    </section>
  );
}
