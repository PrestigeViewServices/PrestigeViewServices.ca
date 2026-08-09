import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Droplets, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Fresh from the Field", editorial photo showcase for the home page.
 *
 * Hard-coded to the latest job until we wire a CMS-driven feature flag. To
 * swap the feature, replace the `feature` object below with new photos +
 * caption. Photos must already be optimized into /public/images/gallery/...
 */

const feature = {
  eyebrow: "Fresh from the Field",
  // Visible date, kept simple, no library. Update when you change the photos.
  dateLabel: "This month · Petawawa",
  title: "Interlock Walkway Rebuild",
  blurb:
    "Out with the heaved slabs, in with a compacted gravel base and brand-new interlock pavers finished with a charcoal border. One crew from tear-out to the final sweep, and a front entrance that looks like a different house.",
  hero: {
    src: "/images/gallery/landscaping/interlock-walkway-after-wide.webp",
    alt: "Finished interlock front walkway and stone steps at a Petawawa bungalow after a PVS rebuild.",
  },
  thumbs: [
    {
      src: "/images/gallery/landscaping/interlock-walkway-before-old-pavers.webp",
      alt: "Aging patio-slab walkway with timber edging before the interlock rebuild.",
      label: "Before",
    },
    {
      src: "/images/gallery/landscaping/interlock-walkway-plate-compactor-base.webp",
      alt: "Crew member compacting the gravel base with string lines set.",
      label: "Base prep",
    },
    {
      src: "/images/gallery/landscaping/interlock-walkway-after-charcoal-border.webp",
      alt: "Completed interlock walkway with charcoal paver border.",
      label: "After ✦",
    },
  ],
  services: [
    { name: "Landscaping Projects", href: "/services/landscaping-services" },
  ],
};

export function FreshFromField() {
  return (
    <section className="container-max py-20 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface/60 p-6 sm:p-10 lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-60"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12 items-center">
          {/* Hero photo */}
          <div className="relative aspect-[4/3] sm:aspect-[5/4] overflow-hidden rounded-2xl border border-surface-border bg-black/30">
            <Image
              src={feature.hero.src}
              alt={feature.hero.alt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              priority={false}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <Droplets className="h-3 w-3" />
              {feature.dateLabel}
            </span>
          </div>

          {/* Copy + thumbs */}
          <div className="space-y-6">
            <div>
              <p className="eyebrow text-primary mb-3">{feature.eyebrow}</p>
              <h2 className="heading-section text-balance">{feature.title}</h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {feature.blurb}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {feature.services.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  {s.name}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {feature.thumbs.map((thumb) => (
                <figure
                  key={thumb.src}
                  className="relative aspect-square overflow-hidden rounded-xl border border-surface-border bg-black/30 group"
                >
                  <Image
                    src={thumb.src}
                    alt={thumb.alt}
                    fill
                    sizes="(min-width: 1024px) 12vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white">
                    {thumb.label}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/quote">
                  Get a free quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/our-work">See more work</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
