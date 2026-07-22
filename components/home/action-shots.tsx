import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";

/**
 * Horizontal scroll-snap gallery of real PVS action shots (crew on roofs,
 * squeegee work, skylight before/afters), leading into a
 * "Get a Free Quote" CTA card as the final slide. Native CSS scroll-snap, no
 * client JS, full-bleed image cards that work as a swipeable strip on mobile
 * and as a horizontal scroll on desktop.
 */
const SHOTS = [
  {
    src: "/images/gallery/window-cleaning/storefront-squeegee-action.jpg",
    alt: "PVS technician squeegeeing a commercial storefront window from inside",
    caption: "Squeegee · storefront",
  },
  {
    src: "/images/gallery/window-cleaning/skylight-debris-before.jpg",
    alt: "Skylight choked with leaves and debris before a PVS cleaning",
    caption: "Skylight · before",
  },
  {
    src: "/images/gallery/window-cleaning/skylight-roof-crew.jpg",
    alt: "PVS technician on the roof above a skylight in mid-clean",
    caption: "Crew on roof",
  },
  {
    src: "/images/gallery/window-cleaning/skylight-clean-after.jpg",
    alt: "Same skylight crystal clear after a PVS window cleaning service",
    caption: "Skylight · after",
  },
  {
    src: "/images/gallery/window-cleaning/modern-dark-frame-01.jpg",
    alt: "Modern dark-framed home windows reflecting sky after PVS cleaning",
    caption: "Modern dark frame",
  },
  {
    src: "/images/gallery/window-cleaning/residential-bay-window.jpg",
    alt: "Brick residential home with large bay window cleaned by PVS",
    caption: "Residential bay window",
  },
];

export function ActionShots() {
  return (
    <section className="py-20 sm:py-24 relative">
      <div className="container-max">
        <SectionHeading
          eyebrow="In the Field"
          title="Action Shots from the Crew"
          description="Real PVS jobs across Petawawa, Pembroke, and the Ottawa Valley. Swipe to see the work, then book your own."
          align="left"
        />
      </div>

      <div
        className="mt-10 flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 pb-4
                   [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {/* Leading spacer so the first card aligns with the container edge */}
        <div className="shrink-0 w-4 sm:w-8" aria-hidden />

        {SHOTS.map((s, i) => (
          <article
            key={s.src}
            className="snap-start shrink-0 w-[78%] sm:w-[52%] lg:w-[36%] aspect-[3/4] relative overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(min-width:1024px) 36vw, (min-width:640px) 52vw, 78vw"
              priority={i === 0}
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
              <p className="text-sm font-semibold text-white">{s.caption}</p>
            </div>
          </article>
        ))}

        {/* Final CTA slide, the scroll lands the visitor on a quote ask. */}
        <article className="snap-start shrink-0 w-[78%] sm:w-[52%] lg:w-[36%] aspect-[3/4] relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent flex flex-col justify-between p-6 sm:p-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Want the same finish on your property?
            </h3>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
              Free, no-obligation quote within one business day. Local crew, fully insured.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/quote">
                  Get a Free Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/our-work/window-cleaning">
                  See the full gallery
                </Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Trailing spacer */}
        <div className="shrink-0 w-4 sm:w-8" aria-hidden />
      </div>
    </section>
  );
}
