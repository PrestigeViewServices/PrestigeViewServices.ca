import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MapPinned,
  Phone,
  Radar,
  Radio,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Tractor,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { LiveFleetMap } from "@/components/winter/live-fleet-map";
import { WeatherWidget } from "@/components/weather/weather-widget";
import { PortalStrip } from "@/components/winter/portal-showcase";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Tractor Map | Track Our Snow Fleet in Pembroke & Petawawa",
  description:
    "Watch our 4 John Deere snow tractors clear Pembroke and Petawawa in real time. Live GPS fleet map for every snow event.",
  alternates: { canonical: "/live-map" },
  openGraph: {
    title: "Live Tractor Map | Prestige View Services",
    description:
      "Watch our snow tractors clear Pembroke and Petawawa live, every storm.",
    url: "/live-map",
    type: "website",
    images: ["/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp"],
  },
};

const FLEET = [
  {
    town: "Pembroke",
    model: "5100M",
    class: "Utility tractor",
    body: "The bigger machine for Pembroke routes, built to move through the heavy, wet river snow Pembroke gets without slowing down.",
  },
  {
    town: "Petawawa",
    model: "4066R",
    class: "Compact utility tractor",
    body: "Nimble on Petawawa's narrow and garrison-style driveways, with tight passes that keep lawn edges and mailboxes clean.",
  },
];

const WHY_TRACTORS = [
  {
    icon: Wind,
    title: "Snow thrown clear",
    body: "Tractor-mounted blowers throw snow off the driveway instead of piling banks across your lawn, mailbox, and sightlines.",
  },
  {
    icon: Snowflake,
    title: "Heavy snow, no problem",
    body: "Wet, heavy river snow that stalls a walk-behind blower is routine work for a tractor.",
  },
  {
    icon: ShieldCheck,
    title: "Gentle on your driveway",
    body: "Tight, controlled passes on narrow and garrison-style driveways, with stakes set in the fall so edges stay clean.",
  },
];

const PHOTOS = [
  {
    src: "/images/gallery/snow-removal/tractor-snowblowing-sunrise-residential.webp",
    alt: "PVS tractor snow-blowing a driveway at sunrise",
    caption: "Sunrise, storm done",
  },
  {
    src: "/images/gallery/snow-removal/tractor-night-street-snowblowing.webp",
    alt: "PVS tractor clearing snow along a street at night",
    caption: "Mid-storm, on route",
  },
  {
    src: "/images/gallery/snow-removal/tractor-cleared-driveway-bluebird-day.webp",
    alt: "Driveway cleared edge to edge by a PVS tractor on a bright winter day",
    caption: "Open before you need out",
  },
];

const STEPS = [
  {
    icon: Radar,
    title: "Storm hits the trigger",
    body: "When snowfall reaches the trigger depth, tractors roll out automatically. Nobody has to call.",
  },
  {
    icon: Radio,
    title: "Fleet goes live",
    body: "Every tractor reports its GPS position, so what you see on the map is where the crew actually is.",
  },
  {
    icon: MapPinned,
    title: "Cleared in route order",
    body: "Driveways are done street by street. If a tractor is in your neighbourhood, you are next or close to it.",
  },
  {
    icon: Clock,
    title: "Parked between storms",
    body: "No snow, no movement. A still map means the fleet is fuelled and ready for the next event.",
  },
];

const FAQS = [
  {
    q: "Why can't I see any tractors on the map?",
    a: "Tractors only show while they are out working. Between storms, or before snow reaches the trigger depth, the fleet is parked and the map stays quiet.",
  },
  {
    q: "Does the map show when my driveway will be done?",
    a: "It shows where the tractors are right now, not an exact time for your address. Driveways are cleared in route order, so if a tractor is working in your neighbourhood you are usually close. Seasonal customers can also check visit records in the customer portal.",
  },
  {
    q: "Do you use plow trucks?",
    a: "No. Every route in Pembroke and Petawawa is cleared by tractor. Tractors throw snow clear instead of banking it, and handle tight driveways cleanly.",
  },
  {
    q: "Which tractors are on the map?",
    a: "Our fleet of 4 John Deere tractors. Pembroke routes run the John Deere 5100M and Petawawa routes run the John Deere 4066R.",
  },
  {
    q: "How do I get my driveway on the route?",
    a: "Book a seasonal snow plan. Seasonal customers are on the route every storm automatically, with no calls needed.",
  },
];

export default function LiveMapPage() {
  const tel = `tel:${formatPhone(siteConfig.phone)}`;

  return (
    <>
      <ServiceAmbience theme="snow" />

      {/* ── Hero (compact, so the map is near the top) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-50"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#0A1220] via-[#0A1220]/85 to-[#0A1220]/40"
          />
        </div>
        <div className="container-max flex flex-col gap-5 py-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live · 4 tractors · GPS tracked
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              Where&apos;s the tractor? <span className="text-sky-300">Watch us live.</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-sky-50/80 sm:text-base">
              Every snow event, our tractors clear Pembroke and Petawawa in real
              time, right here on the map.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#map">
                <Radio className="h-4 w-4" aria-hidden />
                Open the map
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/winter-packages">
                Get on the route
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Map ── */}
      <WeatherWidget id="snow-status" showMapLink={false} className="pb-0" />

      <section id="map" className="container-max scroll-mt-24 py-10">
        <LiveFleetMap tall />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-sky-300" aria-hidden />
            Bookmark this page on your phone for the next storm.
          </p>
          <p className="text-xs">
            Tractors show only while they are on route. A still map means the
            fleet is parked between storms.
          </p>
        </div>
      </section>

      {/* ── Portal upsell: the public map shows the fleet, the portal shows YOUR driveway ── */}
      <PortalStrip
        title="Want to see when the tractor reaches your driveway?"
        body="This map shows the whole fleet. Seasonal customers get a private Aurora portal that follows their own route, sends a “cleared” alert, and saves a photo of every visit."
      />

      {/* ── The fleet ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">
            <Tractor className="h-3.5 w-3.5" aria-hidden />
            Meet the fleet
          </p>
          <h2 className="heading-section mt-2 text-balance">
            4 John Deere tractors on the map
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every machine you see moving is one of ours, matched to the town
            it clears.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {FLEET.map((f) => (
            <article
              key={f.town}
              className="surface-card relative overflow-hidden p-6 sm:p-7"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-6 text-[7rem] font-black leading-none text-white/[0.04]"
              >
                {f.model}
              </span>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
                <MapPinned className="h-3.5 w-3.5" aria-hidden />
                {f.town} routes
              </p>
              <h3 className="mt-3 text-2xl font-bold">
                John Deere <span className="text-emerald-300">{f.model}</span>
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {f.class}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Why tractors ── */}
      <section className="container-max py-14">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">
            <Tractor className="h-3.5 w-3.5" aria-hidden />
            Tractors, not plow trucks
          </p>
          <h2 className="heading-section mt-2 text-balance">
            Why every route runs on tractors
          </h2>
          <p className="mt-3 text-muted-foreground">
            Plow trucks push snow into banks. Our tractors throw it clear, so
            your driveway, lawn edges, and mailbox look right all winter.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WHY_TRACTORS.map((w) => (
            <div key={w.title} className="surface-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
                <w.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {w.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PHOTOS.map((p) => (
            <figure
              key={p.src}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <figcaption className="absolute bottom-0 left-0 p-4 text-sm font-semibold text-white">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── How the map works ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">How the map works</p>
          <h2 className="heading-section mt-2 text-balance">
            From first flake to cleared driveway
          </h2>
        </div>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="surface-card relative p-6">
              <span className="absolute right-5 top-5 text-3xl font-black text-white/10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CTA ── */}
      <section className="container-max py-12">
        <div className="relative overflow-hidden rounded-3xl border border-sky-400/25">
          <Image
            src="/images/gallery/snow-removal/tractors-staged-night-snowfall.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0A1220] via-[#0A1220]/90 to-[#0A1220]/50" />
          <div className="relative flex flex-col items-start justify-between gap-6 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Seasonal customers are on the route every storm
              </p>
              <h2 className="mt-2 text-2xl font-bold text-balance text-white sm:text-3xl">
                Watching from your window? Put your driveway on the map.
              </h2>
              <p className="mt-2 text-sky-100/80">
                One seasonal price, no calls, cleared every storm. Routes are
                capped, so spots close as they fill.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/winter-packages">
                  See snow plans
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={tel}>
                  <Phone className="h-4 w-4" aria-hidden />
                  {siteConfig.phoneDisplay}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        items={FAQS}
        eyebrow="Live map FAQs"
        title="Questions about the tractor map"
        description="What you are seeing and what it means for your driveway."
      />
    </>
  );
}
