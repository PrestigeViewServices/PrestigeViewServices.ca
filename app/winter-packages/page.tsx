import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardCheck,
  MapPin,
  Radar,
  ShieldCheck,
  Shovel,
  Snowflake,
  Star,
  Timer,
  Tractor,
  X,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { BenefitMatcher } from "@/components/winter/benefit-matcher";
import { EstimatorForm } from "@/components/winter/estimator-form";
import { getOffer } from "@/lib/content/offers";
import {
  DRIVEWAY_TIER_DEFS,
  SHOVELING_TIER_DEFS,
  type DrivewayTier,
} from "@/lib/content/winter-packages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Seasonal Snow Passes · Petawawa Snow Removal | Prestige View Services",
  description:
    "Reserve a seasonal snow pass for your Petawawa driveway, Bronze to Platinum coverage with auto-dispatch, through-storm clearing, and walkway shovelling pass packs. New this season: routes expanding into Pembroke. Free custom quote.",
  alternates: { canonical: "/winter-packages" },
};

const TIER_ACCENTS: Record<DrivewayTier, string> = {
  BRONZE: "from-amber-700/30 to-amber-900/10 border-amber-500/30",
  SILVER: "from-slate-300/20 to-slate-500/10 border-slate-300/30",
  GOLD: "from-yellow-400/20 to-yellow-700/10 border-yellow-400/40",
  PLATINUM: "from-sky-300/20 to-blue-600/10 border-sky-300/40",
};

/** Platinum is the pass most households choose — and it's capped each
 * season to protect response times, which the card calls out. */
const MOST_POPULAR_TIER: DrivewayTier = "PLATINUM";

const HERO_PROOF = [
  { icon: Radar, label: "Auto-dispatch on snowfall", sub: "Triggered at 3–5 cm, you never call" },
  { icon: Timer, label: "Cleared through the storm", sub: "Open for the morning, not after lunch" },
  { icon: Tractor, label: "Tractor-mounted blowers", sub: "Snow thrown clear, not banked in" },
  { icon: ShieldCheck, label: "Fully insured crews", sub: "Photo confirmation after each pass" },
];

const HOW_IT_WORKS = [
  {
    icon: ClipboardCheck,
    title: "Reserve your spot",
    body: "Pick a pass below and send the form, two minutes, no payment today. Early reservations get priority route placement.",
  },
  {
    icon: MapPin,
    title: "We scope your driveway",
    body: "A quick property check sets your final seasonal price, driveway size, slope, and access, and we send your custom quote within one business day.",
  },
  {
    icon: CalendarCheck,
    title: "We stake it in the fall",
    body: "Driveway markers go in before freeze-up so the operator knows your edges in a whiteout, and your spot on the route is locked.",
  },
  {
    icon: Snowflake,
    title: "Storms trigger us, not you",
    body: "When snowfall hits your pass's trigger depth, your route runs automatically, cleared through the storm with alerts along the way.",
  },
];

const WINTER_FAQS = [
  {
    q: "Where is PVS snow removal available this winter?",
    a: "Snow removal runs on our home routes in Petawawa, and this season we're expanding into Pembroke for the first time. Pembroke spots are capped while we build the route, so early reservations get priority. We don't offer snow service in other Valley towns yet, our lawn and exterior services still cover them year-round.",
  },
  {
    q: "What's the difference between the Bronze, Silver, Gold, and Platinum passes?",
    a: "Every pass covers your driveway and apron for the whole season at one flat rate. Moving up the tiers buys responsiveness: Silver adds automatic dispatch and live tracking, Gold adds a second pass per storm (night and day), city plow ridge removal, and priority routing, and Platinum adds the earliest trigger (3 cm), the tightest completion window, and preventative storm management.",
  },
  {
    q: "How do the walkway shovelling pass packs work?",
    a: "Each pass is one shovelling visit covering your walkway, porch, and back deck. You buy a pack of 10, 15, 25, or 50 visits and we draw from it through the winter, big storms often use two passes. Packs never expire mid-season and you can top up anytime.",
  },
  {
    q: "How much does a seasonal pass cost?",
    a: "Every driveway is different, so we price each pass to your property instead of publishing one-size numbers. Reserve below and we'll send your custom seasonal quote free within one business day, and signing before August 14 with code EARLYBIRD15 takes 15% off.",
  },
  {
    q: "Do military members get a discount on snow passes?",
    a: "Yes. Serving members, veterans, military families, and first responders get 10% off. It can't stack with offers above 10%, so during the early-bird window we simply apply EARLYBIRD15 at 15% instead, you always get whichever saves you more.",
  },
];

export default function WinterPackagesPage() {
  const offer = getOffer("snow-early");
  const showOffer = Boolean(offer?.active);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteConfig.url}/winter-packages#service`,
      name: "Seasonal Snow Removal Passes",
      description:
        "Flat-rate seasonal snow removal passes for Petawawa driveways, expanding into Pembroke this season. Bronze to Platinum tiers plus walkway shovelling pass packs.",
      serviceType: "Snow Removal",
      provider: {
        "@type": "LocalBusiness",
        name: siteConfig.name,
        url: siteConfig.url,
        telephone: siteConfig.phone,
      },
      areaServed: [
        { "@type": "City", name: "Petawawa" },
        { "@type": "City", name: "Pembroke" },
      ],
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: "CAD",
        url: `${siteConfig.url}/winter-packages#reserve`,
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
      <section className="container-max pt-14 sm:pt-20 pb-6 relative">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary inline-flex items-center gap-1.5">
            <Snowflake className="h-3.5 w-3.5" />
            Seasonal Snow Passes
          </p>
          <h1 className="heading-section mt-3 text-balance">
            Winter, handled. Your driveway on autopilot.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            One flat seasonal rate, storms trigger us automatically, and your
            driveway is open when you need to leave. Choose the pass that
            matches how proactive you want us to be, from Bronze to
            white-glove Platinum, and add walkway shovelling if you want the
            paths done too.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-200">
              <MapPin className="h-3.5 w-3.5" />
              Petawawa · home routes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-200">
              <Sparkle />
              Pembroke · new this season
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#reserve">
                Reserve my pass
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#compare">Compare the passes</a>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_PROOF.map((p) => (
            <div key={p.label} className="surface-card p-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold leading-tight">
                {p.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {p.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Early-bird promo ── */}
      {showOffer && offer && (
        <section className="container-max pt-4 pb-2 relative">
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Snowflake className="h-4 w-4" aria-hidden />
              {offer.eyebrow}
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white text-balance">
              {offer.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-sky-100/85 leading-relaxed">
              {offer.body}
            </p>
            <Button asChild size="lg" className="mt-5">
              <a href="#reserve">
                {offer.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      )}

      {/* ── Coverage ── */}
      <section className="container-max py-12 relative" id="coverage">
        <SectionHeading
          eyebrow="Where We Plow"
          title="Coverage this winter"
          description="Snow routes are deliberately tight, that's how driveways get opened during the storm instead of after it."
          align="left"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-card relative overflow-hidden p-6 sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              Active · home routes
            </span>
            <h3 className="mt-4 text-xl font-bold">Petawawa</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Our base and our densest routes, most streets in town see a PVS
              machine on every storm. Built around Garrison Petawawa schedules:
              cleared through the storm and re-checked before early departures.
            </p>
            <Link
              href="/services/snow-removal/petawawa"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Snow removal in Petawawa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="surface-card relative overflow-hidden border-sky-400/30 p-6 sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
              <Snowflake className="h-3.5 w-3.5" />
              New this season · limited spots
            </span>
            <h3 className="mt-4 text-xl font-bold">Pembroke</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              For the first time, our snow routes are expanding into Pembroke.
              Spots are capped while we build the route, so early reservations
              get priority placement, and the city plow&apos;s windrow across
              your apron is included in every pass.
            </p>
            <Link
              href="/services/snow-removal/pembroke"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Snow removal in Pembroke
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Outside these two towns, snow service isn&apos;t offered yet, but our{" "}
          <Link href="/service-areas" className="text-primary hover:underline">
            lawn and exterior services
          </Link>{" "}
          cover the wider Valley year-round.
        </p>
      </section>

      {/* ── How it works ── */}
      <section className="container-max pb-12 relative">
        <SectionHeading
          eyebrow="How It Works"
          title="From reservation to first snowfall"
          align="left"
        />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="surface-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Benefit matcher ── */}
      <section className="container-max pb-8 relative" id="match">
        <BenefitMatcher />
      </section>

      {/* ── Driveway pass tiers ── */}
      <section className="container-max py-10 relative" id="compare">
        <SectionHeading
          eyebrow="Seasonal Passes"
          title="Four passes, one open driveway"
          description="Every pass covers your driveway and apron all season at one flat rate. Higher passes buy speed: earlier triggers, more passes per storm, and tighter completion windows."
          align="left"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DRIVEWAY_TIER_DEFS.map((t) => {
            const popular = t.slug === MOST_POPULAR_TIER;
            return (
              <article
                key={t.slug}
                className={`relative flex flex-col rounded-3xl border bg-gradient-to-br p-6 ${TIER_ACCENTS[t.slug]} ${
                  popular ? "ring-2 ring-primary/50 shadow-glow" : ""
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-glow">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">{t.name}</h3>
                  <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Seasonal pass
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t.blurb}
                </p>

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Flat seasonal rate
                  </p>
                  <p className="mt-1 text-2xl font-bold">Custom quote</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Priced to your driveway, free, no obligation
                  </p>
                </div>

                <ul className="mt-5 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-300" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {t.excluded.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-400/80" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <Button
                    asChild
                    className="w-full"
                    variant={popular ? "primary" : "outline"}
                  >
                    <a href="#reserve">
                      Reserve {t.name}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Shovelling pass packs ── */}
      <section className="container-max py-10 relative">
        <div className="flex items-center gap-2 mb-3">
          <Shovel className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">
            Walkway shovelling pass packs
          </h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Add hand-shovelled walkways, porch &amp; back deck to any pass. Buy a
          pack of visits and we draw from it all winter, storms often take two
          passes, so bigger packs are built for full 2-passes-per-storm
          coverage. Top up anytime.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SHOVELING_TIER_DEFS.map((t) => (
            <article key={t.slug} className="surface-card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight">{t.name}</h3>
                <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pass pack
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t.blurb}
              </p>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pack size
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {t.passes}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    visits
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Custom quote, priced per visit by walkway size
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-300" />
                    <span>{f}</span>
                  </li>
                ))}
                {t.excluded.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-400/80" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Reserve ── */}
      <section className="container-max py-12 relative" id="reserve">
        <SectionHeading
          eyebrow="Reserve"
          title="Reserve your spot on the route"
          description="Pick your pass and reserve in one form. We'll send your custom seasonal quote after a quick property check, usually within one business day. No payment is collected today."
        />
        <div className="mt-10 mx-auto max-w-3xl">
          <EstimatorForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Snow routes serve Petawawa, expanding into Pembroke this season. Your
          seasonal price depends on driveway dimensions, slope, and
          accessibility, we&apos;ll confirm it after a quick property check.
        </p>
      </section>

      {/* ── FAQs ── */}
      <FaqSection
        items={WINTER_FAQS}
        eyebrow="Snow Pass FAQs"
        title="Questions homeowners ask before winter"
        description="Straight answers on coverage, tiers, and how the passes work."
      />

      <CtaBand
        title="Not sure which pass fits?"
        description="Call us and we'll walk through your driveway in 5 minutes."
        primaryLabel="Talk to Us"
        primaryHref="/contact"
      />
    </>
  );
}

/** Tiny sparkle dot for the Pembroke chip, matches the lucide sizing. */
function Sparkle() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
    </span>
  );
}
