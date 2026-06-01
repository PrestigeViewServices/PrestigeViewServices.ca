import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import type { Division, DivisionSlug } from "@/lib/content/divisions";
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

/**
 * Mascot per division. SnowLand has no snow-specific mascot variant yet,
 * so it reuses the default. Add a snow mascot to /public/images/ as
 * `mascot-sam-snow.png` and add the entry here when ready.
 */
const mascotPerDivision: Record<DivisionSlug, { src: string; alt: string }> = {
  lawnpros: {
    src: "/images/mascot-sam-mower.png",
    alt: "Almighty Sam riding a John Deere zero-turn mower for PVS LawnPros",
  },
  clearview: {
    src: "/images/mascot-sam-window.png",
    alt: "Almighty Sam holding a window-cleaning brush pole for PVS ClearView",
  },
  snowland: {
    src: "/images/mascot-sam.png",
    alt: "Almighty Sam — PVS SnowLand mascot",
  },
};

export function DivisionHero({ division }: { division: Division }) {
  const mascot = mascotPerDivision[division.slug];

  return (
    <section className="relative overflow-hidden">
      <div className={cn("pointer-events-none absolute inset-0", radial[division.accent])} />
      <div className="container-max relative pt-12 pb-14 sm:pt-16 sm:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          {/* Copy column */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <BrandLockup variant={division.slug} href={`/divisions/${division.slug}`} />
            </div>
            <p className={cn("eyebrow justify-center lg:justify-start mb-4", accentText[division.accent])}>
              {division.tagline}
            </p>
            <h1 className="heading-display max-w-3xl mx-auto lg:mx-0 text-balance">
              {division.name}
            </h1>
            <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              {division.longDescription}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
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

          {/* Mascot column */}
          <div className="relative mx-auto lg:mx-0 max-w-xs lg:max-w-none">
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 blur-3xl",
                division.accent === "lawn" && "bg-emerald-500/20",
                division.accent === "clearview" && "bg-blue-500/20",
                division.accent === "snowland" && "bg-sky-500/20"
              )}
            />
            <Image
              src={mascot.src}
              alt={mascot.alt}
              width={800}
              height={800}
              priority
              className="w-full h-auto drop-shadow-[0_25px_45px_rgba(0,0,0,0.4)] select-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
