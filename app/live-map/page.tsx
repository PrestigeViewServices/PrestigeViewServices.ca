import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MapPinned,
  Phone,
  Radar,
  ShieldCheck,
  Snowflake,
  Tractor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { LiveFleetMap } from "@/components/winter/live-fleet-map";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Live Snow Plow Map | Track Our Fleet in Pembroke & Petawawa",
  description:
    "See where Prestige View Services snow tractors and plow trucks are right now. Live GPS fleet map for every snow event in Pembroke and Petawawa.",
  alternates: { canonical: "/live-map" },
  openGraph: {
    title: "Live Snow Plow Map | Prestige View Services",
    description:
      "Track our snow tractors and plow trucks live during every storm in Pembroke and Petawawa.",
    url: "/live-map",
    type: "website",
  },
};

const HOW = [
  {
    icon: Radar,
    title: "Storm hits the trigger",
    body: "When snowfall reaches the contract trigger, crews roll out and the fleet lights up on the map.",
  },
  {
    icon: Tractor,
    title: "Every machine is tracked",
    body: "Each tractor and plow truck reports its GPS position, so what you see is where the crew actually is.",
  },
  {
    icon: MapPinned,
    title: "Routes, not randomness",
    body: "Driveways are cleared in route order by town. If the crew is on your street, you are next or close to it.",
  },
  {
    icon: Clock,
    title: "Quiet between storms",
    body: "No snow, no movement. If the map is still, the fleet is parked and ready for the next event.",
  },
];

const FAQS = [
  {
    q: "Why can't I see any plows on the map?",
    a: "Machines only show while they are out working. Between storms, or before snow reaches the trigger depth, the fleet is parked and the map stays quiet.",
  },
  {
    q: "Does the map show when my driveway will be done?",
    a: "It shows where the crew is right now, not an exact time for your address. Driveways are cleared in route order, so if a machine is working in your neighbourhood you are usually close. Seasonal customers can also check visit records in the customer portal.",
  },
  {
    q: "Which towns are on the map?",
    a: "Pembroke and Petawawa, the towns our snow routes run in. Petawawa is cleared with tractors and Pembroke with plow trucks.",
  },
  {
    q: "How do I get on the route?",
    a: "Book a seasonal snow plan. Seasonal customers are on the route every storm automatically, with no calls needed.",
  },
];

export default function LiveMapPage() {
  const tel = `tel:${formatPhone(siteConfig.phone)}`;

  return (
    <>
      <ServiceAmbience theme="snow" />

      {/* ── Hero ── */}
      <section className="container-max pt-14 sm:pt-20">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
            <Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden />
            PVS SnowLand · Live fleet
          </p>
          <h1 className="heading-section mt-5 text-balance sm:text-5xl">
            Where&apos;s the plow? Watch us live.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every snow event, our tractors and plow trucks are GPS-tracked on
            this map. See exactly where the crew is working across Pembroke and
            Petawawa, in real time.
          </p>
        </div>
      </section>

      {/* ── Map ── */}
      <section className="container-max py-10">
        <LiveFleetMap tall />
        <p className="mt-3 text-xs text-muted-foreground">
          Machines appear only while they are out on route. A still map means
          the fleet is parked between storms.
        </p>
      </section>

      {/* ── How it works ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">How the map works</p>
          <h2 className="heading-section mt-2 text-balance">
            Real positions, real routes
          </h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map((h) => (
            <div key={h.title} className="surface-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
                <h.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {h.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container-max py-12">
        <div className="surface-card flex flex-col items-start justify-between gap-6 border-sky-400/25 p-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Seasonal customers are on the route every storm
            </p>
            <h2 className="mt-2 text-2xl font-bold text-balance">
              Not on the map yet? Get your driveway on the route.
            </h2>
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
        <p className="mt-4 text-sm text-muted-foreground">
          Managing a lot or storefront?{" "}
          <Link href="/commercial-snow-removal" className="font-medium text-sky-300 hover:underline">
            Commercial snow removal
          </Link>
          .
        </p>
      </section>

      <FaqSection
        items={FAQS}
        eyebrow="Live map FAQs"
        title="Questions about the fleet map"
        description="What you are seeing and what it means for your driveway."
      />
    </>
  );
}
