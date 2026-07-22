import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, Medal, Snowflake } from "lucide-react";
import { services, getService } from "@/lib/content/services";
import type { DivisionSlug } from "@/lib/content/divisions";
import { getServiceCopy } from "@/lib/content/service-copy";
import { getOffer } from "@/lib/content/offers";
import { serviceAreas } from "@/lib/content/service-areas";
import { getGalleryForService } from "@/lib/content/work-categories";
import { serviceFaqs } from "@/lib/content/faq";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { CtaBand } from "@/components/cta-band";
import {
  ServiceAmbience,
  ambienceForService,
} from "@/components/service-ambience";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { AutopilotPlans } from "@/components/care-plans/autopilot-plans";
import { servicePlanMap } from "@/lib/content/care-plans";
import { siteConfig } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<Params>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const service = getService(params.slug);
  if (!service) return {};
  const title = `${service.name} in Petawawa, Pembroke & Ottawa Valley`;
  const description = `${service.shortDescription} Trusted by Petawawa & Pembroke homeowners, free quote within one business day.`;
  return {
    title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.name} · ${siteConfig.shortName}`,
      description,
      url: `${siteConfig.url}/services/${service.slug}`,
    },
  };
}

export default async function ServiceDetailPage(
  props: {
    params: Promise<Params>;
  }
) {
  const params = await props.params;
  const service = getService(params.slug);
  if (!service) notFound();

  // Public-facing category label. Internal division names never render.
  const CATEGORY_LABEL: Record<DivisionSlug, string> = {
    lawnpros: "Lawn & Landscaping",
    clearview: "Exterior Cleaning",
    snowland: "Snow & Ice",
  };
  const categoryLabel = CATEGORY_LABEL[service.division];

  const copy = getServiceCopy(service.slug);
  const related = (service.pairsWith ?? [])
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Service areas that prioritize THIS service, surfaces the local pages
  // and gives Google a strong "service in city" cross-link signal.
  const relevantAreas = serviceAreas.filter((a) =>
    a.topServices.includes(service.slug)
  );

  // Photos for the inline strip + "View full gallery" CTA. Resolves the
  // service's own gallery first, then falls back to a related category so
  // every service page has at least one real PVS photo on it.
  const gallery = getGalleryForService(service.slug);

  const faqs = serviceFaqs[service.slug];

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteConfig.url}/services/${service.slug}#service`,
      name: service.name,
      description: service.shortDescription,
      serviceType: service.name,
      provider: {
        "@type": "LocalBusiness",
        name: siteConfig.name,
        url: siteConfig.url,
        telephone: siteConfig.phone,
      },
      areaServed: [
        { "@type": "City", name: "Petawawa" },
        { "@type": "City", name: "Pembroke" },
        { "@type": "AdministrativeArea", name: "Ottawa Valley" },
      ],
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: "CAD",
        url: `${siteConfig.url}/quote?service=${service.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteConfig.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Services",
          item: `${siteConfig.url}/services`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: service.name,
          item: `${siteConfig.url}/services/${service.slug}`,
        },
      ],
    },
  ];

  if (faqs && faqs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  // Snow pages feature the early-bird contract promo while it's active.
  const snowOffer =
    service.division === "snowland" ? getOffer("snow-early") : undefined;
  const showSnowPromo = Boolean(snowOffer?.active);

  const Icon = service.icon;

  // Care Plans placement, only the four exterior-cleaning services map to a
  // config, so LawnPros & SnowLand service pages render unchanged.
  const planConfig = servicePlanMap[service.slug];

  // The draggable before/after hero lives on House Washing only. Swap the real
  // photos by replacing the files at the paths below (same names).
  const showBeforeAfter = service.slug === "house-washing";

  // Window Cleaning gets a short-form video reel showing real crew work. The
  // files live on Cloudinary (uploaded via scripts/upload-video.js) so the
  // repo + Vercel CLI deploy stay small.
  const showVideoReel = service.slug === "window-cleaning";
  const CLEAR_VIEW_VIDEOS = [
    {
      src: "https://res.cloudinary.com/dd0eudc0t/video/upload/q_auto,f_auto/v1781847470/pvs/videos/windows/ijdnxk5airkxznwg2qvq.mp4",
      caption: "Up-close glass detail",
    },
    {
      src: "https://res.cloudinary.com/dd0eudc0t/video/upload/q_auto,f_auto/v1781847687/pvs/videos/windows/iqu8vgtpplo6ydrp0c89.mp4",
      caption: "Storefront pass, start to finish",
    },
  ];

  // Auto-derive an ambient theme from the service slug, snow / lawn / water
  // / autumn. Returns null for "property-touch-ups" so that page stays plain.
  const ambience = ambienceForService(service.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {ambience && <ServiceAmbience theme={ambience} />}

      <section className="container-max pt-14 sm:pt-20 pb-2 relative">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Services
        </Link>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex items-start gap-5">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="eyebrow text-primary mb-2">
                {categoryLabel} · Petawawa & Pembroke
              </p>
              <h1 className="heading-section text-balance">
                {service.name} in the Ottawa Valley
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                {service.shortDescription}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`/quote?service=${service.slug}`}>
                    Get a Free Quote
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:${siteConfig.phone}`}>
                    {siteConfig.phoneDisplay}
                  </a>
                </Button>
              </div>
            </div>
          </div>
          {gallery && gallery.photos[0] && (
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-surface-border lg:block">
              <Image
                src={gallery.photos[0].src}
                alt={gallery.photos[0].alt}
                fill
                priority
                sizes="(min-width:1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {showSnowPromo && snowOffer && (
        <section className="container-max pt-8 pb-2">
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Snowflake className="h-4 w-4" aria-hidden />
              {snowOffer.eyebrow}
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white text-balance">
              {snowOffer.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-sky-100/85 leading-relaxed">
              {snowOffer.body}
            </p>
            <Button asChild size="lg" className="mt-5">
              <Link href={snowOffer.ctaHref}>
                {snowOffer.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {copy && (
        <section className="container-max pt-10 sm:pt-14">
          <div className="max-w-3xl space-y-5">
            {copy.intro.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed"
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      {showBeforeAfter && (
        <section className="container-max pt-6 pb-2">
          <BeforeAfterSlider
            beforeSrc="/images/beforeafter/house-before.jpg"
            afterSrc="/images/beforeafter/house-after.jpg"
            beforeAlt="House siding before soft-washing, algae and grime"
            afterAlt="Same house siding after soft-washing, clean and bright"
            className="max-w-4xl"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Drag the slider, real Petawawa &amp; Pembroke soft-wash results.
          </p>
        </section>
      )}

      <section className="container-max py-14 sm:py-20">
        <SectionHeading
          eyebrow="What's Included"
          title={`What You Get with ${service.name}`}
          align="left"
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {service.features.map((f) => (
            <li
              key={f}
              className="surface-card p-5 flex gap-3 text-sm"
            >
              <Check
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                strokeWidth={3}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {copy && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="Why PVS"
            title={`Why Homeowners Book Our ${service.name}`}
            align="left"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {copy.benefits.map((b) => (
              <div key={b.title} className="surface-card p-6">
                <h3 className="text-base font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {copy && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="How It Works"
            title="From Quote to Done"
            align="left"
          />
          <ol className="mt-8 grid gap-4 lg:grid-cols-2">
            {copy.process.map((step, i) => (
              <li key={step.title} className="surface-card p-6 flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="container-max pb-14 sm:pb-20">
        <div className="flex flex-col gap-4 rounded-2xl border border-sky-400/25 bg-sky-500/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <Medal className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden />
            <p className="text-sm sm:text-base leading-relaxed">
              <span className="font-semibold">Military &amp; veteran discount.</span>{" "}
              Serving members, veterans, and military families save 10% on{" "}
              {service.name.toLowerCase()}. Not combinable with other offers
              above 10%. Just mention your service when you request a quote.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={`/quote?service=${service.slug}`}>Claim it</Link>
          </Button>
        </div>
      </section>

      {showVideoReel && (
        <section className="container-max pb-14 sm:pb-20 relative">
          <SectionHeading
            eyebrow="In Motion"
            title="Watch the Crew at Work"
            description="Short clips from real PVS window cleaning jobs across the Ottawa Valley, tap any clip to unmute."
            align="left"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-3xl">
            {CLEAR_VIEW_VIDEOS.map((v) => (
              <div
                key={v.src}
                className="group/clip relative aspect-[9/16] overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
              >
                <video
                  src={v.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-xs font-medium text-white">
                  {v.caption}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {gallery && gallery.photos.length > 0 && (
        <section className="container-max pb-14 sm:pb-20 relative">
          <SectionHeading
            eyebrow="Recent Work"
            title={`See recent ${service.name.toLowerCase()} jobs`}
            description={`Real PVS work across Petawawa, Pembroke, and the Ottawa Valley.`}
            align="left"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.photos.slice(0, 3).map((p) => (
              <Link
                key={p.src}
                href={`/our-work/${gallery.slug}`}
                className="group/photo relative aspect-[4/3] overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover/photo:scale-105"
                />
                {p.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs font-medium text-white">
                    {p.caption}
                  </div>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href={`/our-work/${gallery.slug}`}>
                View full gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {relevantAreas.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="Where We Serve"
            title={`${service.name} Across the Ottawa Valley`}
            description={`PVS books ${service.name.toLowerCase()} jobs in these Valley towns most often.`}
            align="left"
          />
          <ul className="mt-6 flex flex-wrap gap-2">
            {relevantAreas.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/service-areas/${a.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/60 px-4 py-2 text-sm hover:bg-surface transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {service.name} in {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {serviceFaqs[service.slug] && (
        <FaqSection
          items={serviceFaqs[service.slug]}
          eyebrow={`${service.name} FAQs`}
          title={`${service.name}, Common Questions`}
          description={`What Petawawa & Pembroke homeowners ask about ${service.name.toLowerCase()}.`}
        />
      )}

      {related.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="Pairs Well With"
            title="Bundle & Save"
            description="Services Petawawa and Pembroke customers often book alongside this one."
            align="left"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="surface-card surface-card-hover p-5 flex flex-col gap-3 group"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold leading-tight">
                  {s.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {s.shortDescription}
                </p>
                <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {planConfig && (
        <AutopilotPlans
          serviceName={service.name}
          serviceSlug={service.slug}
          config={planConfig}
        />
      )}

      <CtaBand />
    </>
  );
}
