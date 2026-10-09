import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Camera,
  Church,
  ClipboardCheck,
  FileCheck2,
  Footprints,
  Home,
  MapPinned,
  Phone,
  Radar,
  ShieldCheck,
  Snowflake,
  SquareParking,
  Store,
  Stethoscope,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { EquipmentByTown } from "@/components/winter/equipment-by-town";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { QuotePhoto } from "@/components/quote-photo";
import { SNOW_EQUIPMENT_SUMMARY } from "@/lib/content/snow-coverage";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Commercial Snow Removal in Pembroke & Petawawa",
  description:
    "Commercial snow plowing, walkway clearing, and salting for lots, storefronts, plazas, and multi-unit properties in Pembroke and Petawawa. Seasonal contracts or per event. $2M liability insured.",
  alternates: { canonical: "/commercial-snow-removal" },
  openGraph: {
    title: "Commercial Snow Removal | Prestige View Services",
    description:
      "Lots plowed, walks cleared, entrances salted. Seasonal or per-event snow contracts for Pembroke and Petawawa businesses.",
    url: "/commercial-snow-removal",
    type: "website",
  },
};

const WHO = [
  { icon: Store, label: "Retail & storefronts" },
  { icon: SquareParking, label: "Plazas & parking lots" },
  { icon: Home, label: "Multi-unit residential" },
  { icon: Stethoscope, label: "Offices & clinics" },
  { icon: Church, label: "Churches & halls" },
  { icon: Warehouse, label: "Industrial & yards" },
];

const INCLUDED = [
  {
    icon: SquareParking,
    title: "Lot & drive-aisle plowing",
    body: "Parking lots, drive aisles, loading areas, and entrances opened up so customers, staff, and deliveries get in.",
  },
  {
    icon: Footprints,
    title: "Walkways & entrances",
    body: "Sidewalks, steps, ramps, and doorways shovelled clean, the areas where slips actually happen.",
  },
  {
    icon: Snowflake,
    title: "Salting & sanding",
    body: "Ice control on walks and high-traffic areas, applied on snow events and freezing-rain days as your contract calls for.",
  },
  {
    icon: MapPinned,
    title: "Site map before winter",
    body: "We walk the site with you in the fall and mark where snow gets piled, fire lanes, curbs, and no-push zones.",
  },
  {
    icon: Camera,
    title: "Visit records",
    body: "Each visit is logged so you have a record of when your property was serviced, useful for your insurer and your tenants.",
  },
  {
    icon: FileCheck2,
    title: "Insurance certificate",
    body: "$2M commercial general liability. We will send a certificate naming you or your property manager on request.",
  },
];

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Send the details",
    body: "Tell us about the site with the form below. It takes two minutes.",
  },
  {
    icon: MapPinned,
    title: "Free site walk",
    body: "We visit, measure, and agree on piling areas, priorities, and timing with you.",
  },
  {
    icon: FileCheck2,
    title: "Written quote",
    body: "A fixed seasonal price split into monthly payments, or clear per-event rates. Your choice.",
  },
  {
    icon: Radar,
    title: "We watch every storm",
    body: "Your site goes on the route. When snow hits your trigger, we show up. No calls needed.",
  },
];

const FAQS = [
  {
    q: "Which towns do you cover for commercial snow removal?",
    a: `Pembroke and Petawawa. ${SNOW_EQUIPMENT_SUMMARY} If your site is just outside those towns, send the request anyway and we will tell you honestly whether we can reach it reliably mid-storm.`,
  },
  {
    q: "Do you offer seasonal contracts or per-event pricing?",
    a: "Both. Most businesses choose a seasonal contract because it locks in one price for the winter, split into equal monthly payments, with no surprise bills after a heavy month. Per-event pricing suits sites that only need occasional clearing.",
  },
  {
    q: "Can you clear before we open?",
    a: "Yes. Opening times go on your site map and your route is planned around them. Tell us your hours in the quote form and we build the timing into the contract.",
  },
  {
    q: "Do you salt walkways and entrances?",
    a: "Yes. Salting and sanding can be included on every visit or added on freezing-rain days. We agree on what gets treated during the site walk.",
  },
  {
    q: "Are you insured for commercial properties?",
    a: "Yes. Prestige View Services carries $2M commercial general liability. Property managers can request a certificate of insurance naming them as certificate holder before the season starts.",
  },
  {
    q: "We manage several properties. Can you handle all of them?",
    a: "Yes, as long as they are in Pembroke or Petawawa. Multi-site accounts get one contact, one invoice, and a site map for each property.",
  },
];

export default function CommercialSnowPage() {
  const tel = `tel:${formatPhone(siteConfig.phone)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteConfig.url}/commercial-snow-removal#service`,
      name: "Commercial Snow Removal",
      serviceType: "Commercial snow plowing and ice control",
      description:
        "Commercial snow plowing, walkway clearing, and salting for businesses and multi-unit properties in Pembroke and Petawawa, Ontario.",
      url: `${siteConfig.url}/commercial-snow-removal`,
      provider: {
        "@type": "LocalBusiness",
        name: siteConfig.name,
        telephone: siteConfig.phone,
        url: siteConfig.url,
      },
      areaServed: [
        { "@type": "City", name: "Pembroke" },
        { "@type": "City", name: "Petawawa" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceAmbience theme="snow" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp"
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
        <div className="container-max py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Commercial · Pembroke & Petawawa
            </p>
            <h1 className="heading-section mt-5 text-balance text-white sm:text-5xl">
              Commercial snow removal that keeps your doors open
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-sky-50/85 sm:text-lg">
              Parking lots plowed, walkways shovelled, entrances salted. We
              keep storefronts, plazas, offices, and multi-unit properties
              safe and open all winter, on a seasonal contract or per event.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl">
                <a href="#commercial-quote">
                  Get a commercial quote
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a href={tel}>
                  <Phone className="h-4 w-4" aria-hidden />
                  {siteConfig.phoneDisplay}
                </a>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sky-100/85">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden />
                $2M liability insured
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-sky-300" aria-hidden />
                Certificate on request
              </li>
              <li className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-sky-300" aria-hidden />
                Storm-triggered dispatch
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Who we serve ── */}
      <section className="container-max py-12">
        <p className="eyebrow text-primary">Who we clear for</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {WHO.map((w) => (
            <li
              key={w.label}
              className="surface-card flex flex-col items-center gap-2 p-4 text-center text-sm font-medium"
            >
              <w.icon className="h-6 w-6 text-sky-300" aria-hidden />
              {w.label}
            </li>
          ))}
        </ul>
      </section>

      {/* ── What's included ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">What&apos;s included</p>
          <h2 className="heading-section mt-2 text-balance">
            Everything your site needs to stay open and safe
          </h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((i) => (
            <div key={i.title} className="surface-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
                <i.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{i.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {i.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Equipment by town ── */}
      <EquipmentByTown
        id="commercial-equipment"
        eyebrow="Equipment by town"
        title="The right machine for every site"
        description="Pembroke commercial lots are cleared with our plow trucks. Petawawa properties are cleared with tractors only, which handle tight lots, storefront aprons, and walk-adjacent areas cleanly."
        showCommercial={false}
      />

      {/* ── Process + form ── */}
      <section className="container-max grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow text-primary">How it works</p>
          <h2 className="heading-section mt-2 text-balance">
            From request to route in four steps
          </h2>
          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for your home driveway instead?{" "}
            <Link href="/winter-packages" className="font-medium text-sky-300 hover:underline">
              See residential snow plans
            </Link>
            .
          </p>
          <QuotePhoto
            src="/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp"
            alt="PVS plow truck clearing a Pembroke commercial lot during an overnight snowfall"
            caption="Lots cleared overnight, before your doors open."
            className="mt-8 hidden lg:block"
          />
        </div>
        <div className="lg:col-span-7">
          <AuroraLeadForm id="commercial-quote" />
        </div>
      </section>

      <FaqSection
        items={FAQS}
        eyebrow="Commercial snow FAQs"
        title="What property managers ask us"
        description="Coverage, contracts, insurance, and timing."
      />
    </>
  );
}
