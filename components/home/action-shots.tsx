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
    src: "/images/gallery/landscaping/interlock-walkway-laying-pavers.webp",
    alt: "PVS crew member setting interlock pavers by hand with a rubber mallet",
    caption: "Interlock · setting pavers",
    service: "Landscaping",
  },
  {
    src: "/images/gallery/landscaping/interlock-walkway-plate-compactor-base.webp",
    alt: "Crew member running a plate compactor over a walkway base with string lines set",
    caption: "Interlock · base compaction",
    service: "Landscaping",
  },
  {
    src: "/images/gallery/window-cleaning/ladder-upper-window-flower-boxes.webp",
    alt: "PVS technician on a ladder cleaning an upper window above bright flower boxes",
    caption: "Upper storey · by hand",
    service: "Windows",
  },
  {
    src: "/images/gallery/lawn-mowing/stand-on-mower-backyard-stripes.webp",
    alt: "Stand-on mower laying fresh stripes across a backyard lawn",
    caption: "Fresh stripes · weekly cut",
    service: "Lawn care",
  },
  {
    src: "/images/gallery/snow-removal/tractor-snowblowing-sunrise-residential.webp",
    alt: "PVS tractor snow-blowing a residential driveway at sunrise",
    caption: "Storm response · sunrise",
    service: "Snow",
  },
  {
    src: "/images/gallery/window-cleaning/skylight-roof-crew.jpg",
    alt: "PVS technician on the roof above a skylight in mid-clean",
    caption: "Crew on roof",
    service: "Windows",
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
            className="group snap-start shrink-0 w-[78%] sm:w-[52%] lg:w-[36%] aspect-[3/4] relative overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(min-width:1024px) 36vw, (min-width:640px) 52vw, 78vw"
              priority={i === 0}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              {s.service}
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-10">
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
                <Link href="/our-work">
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
