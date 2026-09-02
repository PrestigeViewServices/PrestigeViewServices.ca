import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Leaf,
  ShieldCheck,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SamTip } from "@/components/sam";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fall Cleanups & Winter Snow Removal in Petawawa & Pembroke",
  description:
    "One local crew for the whole cold season: fall cleanups, gutter cleaning, pre-winter window cleaning, and seasonal snow passes in Petawawa, Pembroke & the Ottawa Valley. Book before the routes fill.",
  alternates: { canonical: "/fall-winter" },
  openGraph: {
    title: "Get Your Property Ready for Fall & Winter | Prestige View Services",
    description:
      "Fall cleanups, gutters, and seasonal snow passes from one veteran-operated Ottawa Valley crew. Free quotes in one business day.",
    url: "/fall-winter",
    type: "website",
  },
};

/**
 * Seasonal hub: the one link that sells the entire cold-season account —
 * fall cleanup + gutters now, a snow pass for the winter. Route density and
 * customer lifetime value in a single page, which is why the header and the
 * campaign copy in /admin/marketing both point here.
 */

const fallServices = [
  {
    slug: "fall-cleanup",
    name: "Fall Cleanup",
    blurb:
      "Leaves mulched or hauled, beds cleared, one final cut. Your lawn goes into winter breathing instead of smothered.",
    img: "/images/gallery/landscaping/trimmed-hedge-cleared-yard-ottawa-valley.webp",
    alt: "Cleared Ottawa Valley yard with trimmed hedges after a PVS fall cleanup",
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    blurb:
      "Packed gutters cause the ice dams that wreck fascia in January. We clear and flush every run before freeze-up.",
    img: "/images/gallery/gutter-cleaning/gutter-clean-after.jpg",
    alt: "Spotless residential gutter and downspout after a PVS gutter cleaning",
  },
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    blurb:
      "Streak-free glass before the storm windows go on. Six months of winter is a long time to stare through summer grime.",
    img: "/images/gallery/window-cleaning/heritage-home-bay-window-clean.webp",
    alt: "Heritage home bay window gleaming after a PVS window cleaning",
  },
  {
    slug: "aeration",
    name: "Aeration & Overseeding",
    blurb:
      "Fall is the best window of the year to aerate and overseed. Thicker turf in spring starts with one visit now.",
    img: "/images/gallery/lawn-mowing/fresh-mow-stripes-front-lawn.webp",
    alt: "Healthy striped front lawn maintained by PVS in the Ottawa Valley",
  },
] as const;

const winterPhotos = [
  {
    src: "/images/gallery/snow-removal/tractor-cleared-driveway-bluebird-day.webp",
    alt: "Perfectly cleared Petawawa driveway on a sunny winter morning after PVS snow removal",
  },
  {
    src: "/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp",
    alt: "PVS tractor snowblowing a residential driveway at night mid-storm",
  },
  {
    src: "/images/gallery/snow-removal/snowy-ranch-home-blue-sky.webp",
    alt: "Snow-covered Ottawa Valley home with a cleared driveway under a blue sky",
  },
] as const;

export default function FallWinterPage() {
  const phoneHref = `tel:${formatPhone(siteConfig.phone)}`;
  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="container-max grid gap-10 pb-14 pt-14 sm:pt-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow text-primary">
              <CalendarCheck className="h-3.5 w-3.5" />
              Booking now for fall &amp; winter
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              One crew gets your property through{" "}
              <span className="text-primary">fall and winter</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Fall cleanup and gutters before freeze-up. A seasonal snow pass
              for everything after. Local, fully insured, veteran operated,
              serving Petawawa, Pembroke, and the Ottawa Valley.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/request-service">
                  Book fall services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/winter-packages">
                  <Snowflake className="h-4 w-4" />
                  Reserve a snow pass
                </Link>
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Fully insured
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Free quotes in one business day
              </li>
              <li className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-primary" />
                Monthly payments on snow passes
              </li>
            </ul>
          </div>
          <div className="lg:col-span-5">
            <SamTip pose="gutter" eyebrow="Sam says">
              Book the fall cleanup and the snow pass together. One visit sets
              up your yard, one contract covers every storm, and you never
              think about it again until spring.
            </SamTip>
          </div>
        </div>
      </section>

      {/* ---- Fall ---- */}
      <section className="container-max py-16">
        <p className="eyebrow text-amber-400">
          <Leaf className="h-3.5 w-3.5" />
          Before the freeze
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          Fall services, done in one visit
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything below can be bundled into a single stop. Bundling saves
          you money and gets your property fully winter-ready in an afternoon.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {fallServices.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="surface-card surface-card-hover group overflow-hidden"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{s.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {s.blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Winter ---- */}
      <section className="border-y border-surface-border bg-surface/40">
        <div className="container-max grid gap-10 py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow text-cyan-300">
              <Snowflake className="h-3.5 w-3.5" />
              After the first storm, it&apos;s too late
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Seasonal snow passes, storm by storm, all winter
            </h2>
            <p className="mt-3 text-muted-foreground">
              Your driveway and walkway cleared every storm, with monthly
              payment options and priority routes for Gold and Platinum
              passes. Petawawa routes fill first; reserving now locks your
              spot before the snow flies.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Driveway, walkway, and step clearing
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                End-of-driveway city ridge on Gold &amp; Platinum
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Track your service in the customer portal
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/winter-packages">
                  See passes &amp; pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href={phoneHref}>Call {siteConfig.phoneDisplay}</a>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:col-span-6 sm:grid-cols-2">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl sm:col-span-2">
              <Image
                src={winterPhotos[0].src}
                alt={winterPhotos[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
              <Image
                src={winterPhotos[1].src}
                alt={winterPhotos[1].alt}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
              <Image
                src={winterPhotos[2].src}
                alt={winterPhotos[2].alt}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Closing CTA ---- */}
      <section className="container-max py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Lock in the whole season in one call
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tell us about your property once. We quote the fall work and the
          winter pass together, and you go into the season covered.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/request-service">
              Get my free quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={phoneHref}>Call {siteConfig.phoneDisplay}</a>
          </Button>
        </div>
      </section>
    </>
  );
}
