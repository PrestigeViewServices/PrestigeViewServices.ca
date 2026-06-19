import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import { services, getService } from "@/lib/content/services";
import { getDivision } from "@/lib/content/divisions";
import { serviceAreas, getServiceArea } from "@/lib/content/service-areas";
import { getWorkCategory } from "@/lib/content/work-categories";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import {
  ServiceAmbience,
  ambienceForService,
} from "@/components/service-ambience";
import { siteConfig } from "@/lib/site";

type Params = { slug: string; area: string };

/**
 * Service+Area combination pages — e.g. /services/window-cleaning/petawawa.
 * Captures "<service> + <city>" search intent directly. 16 services × 8
 * areas = 128 pre-rendered pages, each with its own H1, intro, schema, and
 * cross-linking to the parent service and area.
 */
export function generateStaticParams() {
  const out: Params[] = [];
  for (const s of services) {
    for (const a of serviceAreas) {
      out.push({ slug: s.slug, area: a.slug });
    }
  }
  return out;
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const service = getService(params.slug);
  const area = getServiceArea(params.area);
  if (!service || !area) return {};
  const title = `${service.name} in ${area.name}, ${area.region} · PVS`;
  const description = `${service.shortDescription} Local ${service.name.toLowerCase()} crew serving ${area.name} and the surrounding Ottawa Valley — free quote within one business day.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/services/${service.slug}/${area.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/services/${service.slug}/${area.slug}`,
    },
  };
}

export default function ServiceAreaCombinationPage({
  params,
}: {
  params: Params;
}) {
  const service = getService(params.slug);
  const area = getServiceArea(params.area);
  if (!service || !area) notFound();

  const division = getDivision(service.division);
  const gallery = getWorkCategory(service.slug);

  // Other top services in this area (cross-sell + internal linking signal).
  const otherServicesInArea = area.topServices
    .filter((s) => s !== service.slug)
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .slice(0, 4);

  // Other areas this service is popular in (so /services/[slug]/[area]
  // pages cross-link laterally to each other).
  const otherAreasForService = serviceAreas
    .filter((a) => a.slug !== area.slug && a.topServices.includes(service.slug))
    .slice(0, 6);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${siteConfig.url}/services/${service.slug}/${area.slug}#service`,
      name: `${service.name} in ${area.name}`,
      description: service.shortDescription,
      serviceType: service.name,
      provider: {
        "@type": "LocalBusiness",
        name: siteConfig.name,
        url: siteConfig.url,
        telephone: siteConfig.phone,
      },
      areaServed: {
        "@type": "City",
        name: area.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: area.name,
          addressRegion: area.region,
          addressCountry: "CA",
        },
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: "CAD",
        url: `${siteConfig.url}/quote?service=${service.slug}&area=${area.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
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
        {
          "@type": "ListItem",
          position: 4,
          name: area.name,
          item: `${siteConfig.url}/services/${service.slug}/${area.slug}`,
        },
      ],
    },
  ];

  const Icon = service.icon;

  // Same theming as the parent service page — snow / lawn / water / autumn.
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
          href={`/services/${service.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All {service.name} info
        </Link>

        <div className="mt-6 flex items-start gap-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="eyebrow text-primary mb-2 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {area.name}, {area.region} · {division.shortName}
            </p>
            <h1 className="heading-section text-balance">
              {service.name} in {area.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {service.shortDescription} {area.name} crews routed weekly —{" "}
              {area.distanceFromHqKm === 0
                ? "we're based right here"
                : `${area.distanceFromHqKm} km from our Petawawa hub`}
              .
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link
                  href={`/quote?service=${service.slug}&area=${area.slug}`}
                >
                  Get a Free {area.name} Quote
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

      <section className="container-max py-14 sm:py-20">
        <SectionHeading
          eyebrow={`What ${area.name} Gets`}
          title={`${service.name} Service Includes`}
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

      {area.neighbourhoods.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow={`${area.name} Neighbourhoods`}
            title={`We Service ${service.name} Across ${area.name}`}
            align="left"
          />
          <ul className="mt-6 flex flex-wrap gap-2">
            {area.neighbourhoods.map((n) => (
              <li
                key={n}
                className="rounded-full border border-surface-border bg-surface/60 px-4 py-2 text-sm"
              >
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gallery && gallery.photos.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <div className="surface-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                See {service.name.toLowerCase()} jobs from across the Valley
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real PVS {service.name.toLowerCase()} work across Petawawa,
                Pembroke, and surrounding towns.
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

      {otherServicesInArea.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow={`Also Popular in ${area.name}`}
            title={`Other Services ${area.name} Books`}
            align="left"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherServicesInArea.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}/${area.slug}`}
                className="surface-card surface-card-hover p-5 flex flex-col gap-3 group"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold leading-tight">
                  {s.name} in {area.name}
                </h3>
                <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {otherAreasForService.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow={`${service.name} Elsewhere in the Valley`}
            title={`${service.name} in Other Ottawa Valley Towns`}
            align="left"
          />
          <ul className="mt-6 flex flex-wrap gap-2">
            {otherAreasForService.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/services/${service.slug}/${a.slug}`}
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

      <CtaBand />
    </>
  );
}
