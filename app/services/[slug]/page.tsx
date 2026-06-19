import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import { services, getService } from "@/lib/content/services";
import { getDivision } from "@/lib/content/divisions";
import { serviceAreas } from "@/lib/content/service-areas";
import { getWorkCategory } from "@/lib/content/work-categories";
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

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const service = getService(params.slug);
  if (!service) return {};
  const title = `${service.name} in Petawawa, Pembroke & Ottawa Valley`;
  const description = `${service.shortDescription} Trusted by Petawawa & Pembroke homeowners — free quote within one business day.`;
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

export default function ServiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const service = getService(params.slug);
  if (!service) notFound();

  const division = getDivision(service.division);
  const related = (service.pairsWith ?? [])
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Service areas that prioritize THIS service — surfaces the local pages
  // and gives Google a strong "service in city" cross-link signal.
  const relevantAreas = serviceAreas.filter((a) =>
    a.topServices.includes(service.slug)
  );

  // If we have a matching work-category gallery, deep-link to it.
  const gallery = getWorkCategory(service.slug);

  const jsonLd = [
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

  const Icon = service.icon;

  // Care Plans placement — only the four exterior-cleaning services map to a
  // config, so LawnPros & SnowLand service pages render unchanged.
  const planConfig = servicePlanMap[service.slug];

  // The draggable before/after hero lives on House Washing only. Swap the real
  // photos by replacing the files at the paths below (same names).
  const showBeforeAfter = service.slug === "house-washing";

  // Auto-derive an ambient theme from the service slug — snow / lawn / water
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

        <div className="mt-6 flex items-start gap-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="eyebrow text-primary mb-2">
              {division.name} · Petawawa & Pembroke
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
      </section>

      {showBeforeAfter && (
        <section className="container-max pt-6 pb-2">
          <BeforeAfterSlider
            beforeSrc="/images/beforeafter/house-before.jpg"
            afterSrc="/images/beforeafter/house-after.jpg"
            beforeAlt="House siding before soft-washing — algae and grime"
            afterAlt="Same house siding after soft-washing — clean and bright"
            className="max-w-4xl"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Drag the slider — real Petawawa &amp; Pembroke soft-wash results.
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

      {gallery && gallery.photos.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <div className="surface-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                See recent {service.name.toLowerCase()} work
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real {service.name.toLowerCase()} jobs across Petawawa,
                Pembroke, and the Ottawa Valley.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/our-work/${gallery.slug}`}>
                View gallery
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
          title={`${service.name} — Common Questions`}
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
