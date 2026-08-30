import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  MapPin,
  Medal,
  MessageSquare,
  Minus,
  Phone,
  Radar,
  Save,
  Snowflake,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { SamImage } from "@/components/sam";
import { EquipmentGrid } from "@/components/winter/equipment-grid";
import { PackageSelector } from "@/components/winter/package-selector";
import { PortalShowcase } from "@/components/winter/portal-showcase";
import { PovSection } from "@/components/winter/pov-section";
import { PromoCountdown } from "@/components/winter/promo-countdown";
import { StormNightLazy } from "@/components/winter/storm-night-lazy";
import { WinterOffersStrip } from "@/components/winter/winter-offers-strip";
import {
  COMPARISON_ROWS,
  DRIVEWAY_TIER_DEFS,
} from "@/lib/content/winter-packages";
import {
  promoEndsLabel,
  promoIsLive,
  promoPercentLabel,
} from "@/lib/content/winter-campaign";
import { getSiteContent } from "@/lib/site-content";
import { siteConfig } from "@/lib/site";

// The promo badge, countdown, and discount ladder are owner-editable at
// /admin/site/content, so this page renders per-request instead of being
// frozen at build time.
export const dynamic = "force-dynamic";

const TEL = siteConfig.phone.replace(/[^0-9+]/g, "");

export const metadata: Metadata = {
  title:
    "Snow Removal Petawawa & Pembroke | Seasonal Snow Passes | Prestige View Services",
  description:
    "Seasonal snow removal passes in Petawawa & Pembroke. Auto-dispatch when it storms, live tracking & photo proof in your customer portal. Bronze to Platinum. Military discount.",
  alternates: { canonical: "/winter-packages" },
  openGraph: {
    title:
      "Seasonal Snow Passes in Petawawa & Pembroke | Prestige View Services",
    description:
      "Storms trigger us automatically, you never make a call. Watch your plow live and get photo proof in your customer portal. Bronze to Platinum passes. Military discount.",
    url: "/winter-packages",
    type: "website",
    images: [
      {
        url: "/images/og-winter-packages.png",
        width: 1200,
        height: 630,
        alt: "Prestige View Services seasonal snow passes, Petawawa and Pembroke",
      },
    ],
  },
};

const HOW_IT_WORKS = [
  {
    icon: Star,
    title: "Pick your package",
    body: "Four seasonal passes, from a single pass after the storm to white-glove Platinum. Choose the one that matches how proactive you want us to be.",
  },
  {
    icon: Save,
    title: "Save it and send it",
    body: "Keep a card of exactly what you picked on your phone, then send your quote request in one tap. Nothing gets lost in translation.",
  },
  {
    icon: Radar,
    title: "We confirm your spot",
    body: "We lock your place on the route and stake your markers before freeze-up. After that, storms trigger us automatically all winter.",
  },
];

const TRUST_STRIP = [
  { icon: Medal, label: "Military and veterans always save 10%" },
  { icon: Radar, label: "Auto-dispatch, no calling needed" },
  { icon: Camera, label: "Live tracking & photo proof in your portal" },
  { icon: Snowflake, label: "Limited spots per route" },
];

/** Placeholder testimonials. Swap the quotes for real customer words. */
const TESTIMONIALS = [
  {
    quote:
      "Placeholder: a sentence or two from a Petawawa customer about being cleared before the morning commute.",
    name: "Customer name",
    town: "Petawawa",
  },
  {
    quote:
      "Placeholder: a sentence about never having to phone in, and the driveway just being done.",
    name: "Customer name",
    town: "Petawawa",
  },
  {
    quote:
      "Placeholder: a sentence about the city ridge being cleared without having to ask.",
    name: "Customer name",
    town: "Pembroke",
  },
];

const ACTION_PHOTOS = [
  {
    src: "/images/gallery/snow-removal/night-snow-plume-tractor.webp",
    alt: "PVS tractor throwing a plume of snow at night",
  },
  {
    src: "/images/gallery/snow-removal/tractors-staged-night-snowfall.webp",
    alt: "PVS tractors staged during an overnight snowfall",
  },
  {
    src: "/images/gallery/snow-removal/tractor-night-street-snowblowing.webp",
    alt: "PVS tractor snowblowing a residential street after dark",
  },
];

const WINTER_FAQS = [
  {
    q: "When does service start?",
    a: "Passes run for the whole winter season. We stake driveway markers before freeze-up, usually through late October and November, and coverage begins with the first snowfall that hits your package's trigger depth. Reserve early: routes are capped and they fill before the first storm.",
  },
  {
    q: "What counts as 3 cm, and who decides?",
    a: "We measure accumulation on your route, not at the airport. When snowfall on the ground crosses 3 cm, dispatch triggers automatically for Bronze, Gold, and Platinum (Silver dispatches at 5 cm). You never phone it in, and you never have to argue about whether it snowed enough.",
  },
  {
    q: "When do you actually come?",
    a: "It depends on the package, and that is the honest difference between the tiers. Gold and Platinum run a night pass while the storm is on and a second pass before the morning commute. Bronze runs one pass per storm event within its 24-hour window. Long-duration storms are worked in waves so nobody is buried until the end.",
  },
  {
    q: "What if it snows overnight?",
    a: "That is the normal case, and it is what the tiers are built around. Gold and Platinum include a night pass and a day pass, so you are cleared both ways: open for the early departure and open again after the storm finishes. Silver and Bronze are cleared within their stated window.",
  },
  {
    q: "How do I know when my driveway has been cleared?",
    a: "Silver, Gold, and Platinum passes include an account in our customer portal, where you can watch the operator on a live map while the storm is on. Gold and Platinum also get a notification the moment each pass is finished, backed by a time-stamped photo saved to their season-long visit history. Check from work, from vacation, or from bed before the morning drive — you never have to wonder.",
  },
  {
    q: "Do I need to be home?",
    a: "No. Once your markers are staked, the operator knows your edges even in a whiteout. Just leave the driveway clear of vehicles where you can, and tell us anything we should know, gate codes, dogs, or a spot you would rather we did not push snow onto.",
  },
  {
    q: "How do seasonal passes get billed?",
    a: "One flat seasonal rate for the whole winter, no per-storm invoices and no surprise bills after a heavy month. We quote your property first, then you choose how to pay it, and on Silver and up your quote, invoice, and payments all live in your customer portal. Nothing is collected when you send a quote request.",
  },
  {
    q: "Can I upgrade mid-season?",
    a: "Yes, as long as the tier you want still has room on your route. We prorate the difference for the rest of the season. Downgrades wait until the following winter so the routing stays stable for everyone else on the run.",
  },
  {
    q: "Do you do walkways and steps?",
    a: "Yes, as a pass pack you add to any driveway package. One pass is one shovelling visit covering your walkway, porch, and back deck. Buy 10, 25, or 50 visits and we draw from the pack all winter. Big storms often use two, and you can top up anytime.",
  },
  {
    q: "What areas exactly do you cover?",
    a: "Snow routes run in Petawawa, our home base and densest coverage, and this season they are expanding into Pembroke for the first time. Pembroke spots are capped while we build the route. We do not offer snow service in other Valley towns yet, though our lawn and exterior services cover them year-round.",
  },
  {
    q: "How much does a seasonal pass cost?",
    a: "Every driveway is different, so we price each pass to your property instead of publishing one-size numbers. Send a quote request and we reply within 24 hours, free and with no obligation. Nothing is collected when you request the quote.",
  },
  {
    q: "Do military members get a discount on snow passes?",
    a: "Yes. Serving members, veterans, military families, and first responders get 10% off, and it applies to every service we offer. Tick the box on the quote form, or just mention your service when you call. If a bigger discount is running, we apply whichever single discount saves you the most; discounts never stack.",
  },
  {
    q: "Do you do commercial lots?",
    a: "Yes. Plow trucks handle commercial parking lots, storefronts, and multi-unit properties in Petawawa and Pembroke, with salting and walkway crews available. Commercial work is quoted on a site visit, so send a quote request and mention the property type.",
  },
];

export default async function WinterPackagesPage() {
  const { winterPromo } = await getSiteContent();
  const promoLive = promoIsLive(winterPromo);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${siteConfig.url}/#business`,
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      telephone: siteConfig.phone,
      email: siteConfig.email,
      slogan: siteConfig.tagline,
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.streetAddress,
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        addressCountry: siteConfig.address.country,
      },
      areaServed: [
        { "@type": "City", name: "Petawawa" },
        { "@type": "City", name: "Pembroke" },
        { "@type": "AdministrativeArea", name: "Ottawa Valley" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteConfig.url}/winter-packages#service`,
      name: "Seasonal Snow Removal Passes",
      description:
        "Flat-rate seasonal snow removal passes for Petawawa and Pembroke driveways. Bronze to Platinum tiers with automatic storm dispatch, plus walkway shovelling pass packs.",
      serviceType: "Snow Removal",
      url: `${siteConfig.url}/winter-packages`,
      provider: { "@id": `${siteConfig.url}/#business` },
      areaServed: [
        { "@type": "City", name: "Petawawa" },
        { "@type": "City", name: "Pembroke" },
        { "@type": "AdministrativeArea", name: "Ottawa Valley" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Seasonal snow passes",
        itemListElement: DRIVEWAY_TIER_DEFS.map((t) => ({
          "@type": "Offer",
          name: `${t.name} seasonal snow pass`,
          description: t.blurb,
          availability: "https://schema.org/InStock",
          priceCurrency: "CAD",
          url: `${siteConfig.url}/winter-packages#packages`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: WINTER_FAQS.map((f) => ({
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
            src="/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#0A1220]/80 via-[#0A1220]/85 to-[#0A1220]"
          />
        </div>

        <div className="container-max py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Petawawa · New: Pembroke
              </p>
              {promoLive && (
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-200">
                  {promoPercentLabel(winterPromo)} off · ends{" "}
                  {promoEndsLabel(winterPromo)}
                  <PromoCountdown
                    endsAt={winterPromo.endsAt}
                    className="border-l border-amber-300/30 pl-2 font-semibold"
                  />
                </p>
              )}
            </div>

            <h1 className="heading-section mt-5 text-balance">
              The storm hits at midnight. You watch it handled from bed.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-sky-50/85 sm:text-lg">
              Seasonal snow contracts from a local Petawawa crew running its
              own tractors and plow trucks. Snowfall crosses 3 cm and we
              dispatch, with live storm updates on your phone until your
              driveway is open.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl">
                <a href="#packages">
                  Get my winter quote
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Button asChild size="xl" variant="outline">
                <a href="#storm-night">See how a storm night works</a>
              </Button>
            </div>
          </div>

          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_STRIP.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium backdrop-blur-sm"
              >
                <t.icon className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Storm Night walkthrough ── */}
      <section id="storm-night" className="container-max scroll-mt-24 py-14">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Storm Night</p>
          <h2 className="heading-section mt-2 text-balance">
            Watch a storm night play out
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            A simulated overnight storm, start to finish: the 3 cm trigger,
            the route being cleared toward your house, and the alerts landing
            on your phone. Flip between the tractor and plow truck, and
            between single-pass and two-pass packages, to see the difference.
          </p>
        </div>
        <div className="mt-8">
          <StormNightLazy
            ctaHref="/winter-packages#packages"
            ctaLabel="Lock in your spot"
            source="storm-night"
          />
        </div>
      </section>

      {/* ── Your POV ── */}
      <PovSection />

      {/* ── How it works ── */}
      <section className="container-max py-14">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">How It Works</p>
          <h2 className="heading-section mt-2 text-balance">
            Three steps, then winter takes care of itself
          </h2>
        </div>
        <ol className="mt-9 grid gap-5 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="surface-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Customer portal showcase ── */}
      <PortalShowcase />

      {/* ── Selector, add-ons, comparison, save card, quote form ── */}
      <PackageSelector comparison={<ComparisonTable />} />

      {/* ── Discounts + urgency ── */}
      <WinterOffersStrip promo={winterPromo} />

      {/* ── Local crew, real equipment ── */}
      <EquipmentGrid />

      {/* ── Commercial + Pembroke plow trucks ── */}
      <CommercialSection />

      {/* ── Trust ── */}
      <section className="container-max py-14">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Why Neighbours Pick Us</p>
          <h2 className="heading-section mt-2 text-balance">
            Locally owned, Petawawa based, fully insured
          </h2>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="surface-card p-6">
              <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t.quote}
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold">
                {t.name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {t.town}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <a
              href={siteConfig.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Star className="h-4 w-4" aria-hidden />
              Read our Google reviews
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Locally owned · Petawawa based · Fully insured
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ACTION_PHOTOS.map((p) => (
            <div
              key={p.src}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-surface-border"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Sam ── */}
      <section className="container-max pb-6">
        <div className="surface-card flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left">
          <SamImage pose="hero" size={124} className="shrink-0" />
          <div>
            <h2 className="text-lg font-bold">
              Sam says: reserve before the routes fill
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Platinum is capped every season so response times hold through a
              storm. Once a route is full, it closes until next winter.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 sm:ml-auto">
            <a href="#packages">
              Choose my package
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </section>

      {/* ── FAQs ── */}
      <FaqSection
        items={WINTER_FAQS}
        eyebrow="Snow Pass FAQs"
        title="Questions homeowners ask before winter"
        description="Straight answers on coverage, triggers, billing, and what happens overnight."
      />

      {/* ── Closing CTA ── */}
      <section className="container-max pb-16">
        <div className="overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-950 p-8 sm:p-11">
          <h2 className="heading-section text-balance text-white">
            Reserve your driveway. Free quote. No payment today.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-100/85">
            {siteConfig.tagline}. Serving {siteConfig.serviceArea}.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#packages">
                Choose my package
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`tel:${TEL}`}>
                <Phone className="h-4 w-4" aria-hidden />
                Call {siteConfig.phoneDisplay}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`sms:${TEL}`}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                Text us
              </a>
            </Button>
          </div>

          <p className="mt-7 text-sm text-sky-100/70">
            Looking for the other seasons?{" "}
            <Link
              href="/services/lawn-mowing"
              className="font-medium text-sky-300 hover:underline"
            >
              Lawn and landscaping
            </Link>{" "}
            ·{" "}
            <Link
              href="/services/window-cleaning"
              className="font-medium text-sky-300 hover:underline"
            >
              Exterior cleaning
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

/**
 * Commercial lots and the Pembroke plow-truck route get their own short
 * pitch: different equipment, different buyer, same lead flow.
 */
function CommercialSection() {
  return (
    <section id="commercial" className="container-max scroll-mt-24 py-6">
      <div className="overflow-hidden rounded-3xl border border-surface-border bg-surface/60">
        <div className="grid items-stretch lg:grid-cols-[1fr_1.2fr]">
          <div className="relative min-h-[220px] lg:min-h-0">
            <Image
              src="/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp"
              alt="PVS plow truck clearing a commercial parking lot at night"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:p-8">
            <p className="eyebrow text-primary">Commercial &amp; Pembroke</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Lots, storefronts, and the new Pembroke truck route
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Plow trucks handle what the tractors do not: commercial parking
              lots, storefront frontage, and the Pembroke residential route we
              are opening this season. Salting, walkway crews, and
              open-by-morning scheduling are all quoted to the property.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                "Seasonal commercial contracts with per-storm records",
                "Pembroke residential spots are capped while the route builds",
                "Salting and shovel crew add-ons for entrances and walks",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    strokeWidth={3}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/request-service?service=snow-removal&src=winter-commercial">
                  Get a commercial quote
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`tel:${TEL}`}>
                  <Phone className="h-4 w-4" aria-hidden />
                  {siteConfig.phoneDisplay}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Tier comparison. On phones the table scrolls sideways inside its own
 * container with the feature column pinned, so the page body itself never
 * scrolls horizontally.
 */
function ComparisonTable() {
  return (
    <section id="compare" className="container-max scroll-mt-24 py-12">
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">Side By Side</p>
        <h2 className="heading-section mt-2 text-balance">
          Compare all four passes
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The difference between tiers is how early we move and how fast you
          are open again.
        </p>
      </div>

      <div className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="sr-only">
            Seasonal snow pass features compared across the Bronze, Silver,
            Gold, and Platinum tiers.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-background p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Feature
              </th>
              {DRIVEWAY_TIER_DEFS.map((t) => (
                <th
                  key={t.slug}
                  scope="col"
                  className="p-3 text-left text-base font-bold"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                    {t.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-surface-border">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background p-3 text-left font-medium text-muted-foreground"
                >
                  {row.label}
                </th>
                {DRIVEWAY_TIER_DEFS.map((t) => (
                  <td key={t.slug} className="p-3 align-top">
                    <CellValue value={row.render(t.compare)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground sm:hidden">
        Swipe the table sideways to see every tier.
      </p>
    </section>
  );
}

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <>
        <Check
          className="h-4 w-4 text-emerald-400"
          strokeWidth={3}
          aria-hidden
        />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="h-4 w-4 text-muted-foreground/50" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span>{value}</span>;
}
