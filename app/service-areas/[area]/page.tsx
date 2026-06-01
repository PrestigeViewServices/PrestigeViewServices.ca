import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Check } from "lucide-react";
import {
  serviceAreas,
  getServiceArea,
} from "@/lib/content/service-areas";
import { services, getService } from "@/lib/content/services";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

type Params = { area: string };

export function generateStaticParams() {
  return serviceAreas.map((a) => ({ area: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const area = getServiceArea(params.area);
  if (!area) return {};
  const title = `${area.name} Property Care · Lawn, Window & Snow Services`;
  const description = `${area.intro} Free quote within one business day.`;
  return {
    title,
    description,
    alternates: { canonical: `/service-areas/${area.slug}` },
    openGraph: {
      title: `${area.name} ${siteConfig.shortName} Property Care`,
      description,
      url: `${siteConfig.url}/service-areas/${area.slug}`,
    },
  };
}

export default function ServiceAreaPage({
  params,
}: {
  params: Params;
}) {
  const area = getServiceArea(params.area);
  if (!area) notFound();

  const topServices = area.topServices
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Per-area LocalBusiness override so each town gets its own structured
  // signal — adds geo, areaServed, and the town-specific URL.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${siteConfig.url}/service-areas/${area.slug}#business`,
      name: `${siteConfig.name} — ${area.name}`,
      description: area.intro,
      url: `${siteConfig.url}/service-areas/${area.slug}`,
      telephone: siteConfig.phone,
      email: siteConfig.email,
      areaServed: { "@type": "City", name: area.name },
      address: {
        "@type": "PostalAddress",
        addressLocality: area.name,
        addressRegion: area.region,
        addressCountry: "CA",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: area.geo.lat,
        longitude: area.geo.lng,
      },
      openingHours: "Mo-Sa 07:00-19:00",
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
          name: "Service Areas",
          item: `${siteConfig.url}/service-areas`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: area.name,
          item: `${siteConfig.url}/service-areas/${area.slug}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-2">
        <Link
          href="/service-areas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Service Areas
        </Link>

        <div className="mt-6">
          <p className="eyebrow text-primary mb-3 inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {area.name}, {area.region} · Ottawa Valley
          </p>
          <h1 className="heading-section text-balance">{area.tagline}</h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {area.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/quote?area=${area.slug}`}>
                Get a Free {area.name} Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${siteConfig.phone}`}>{siteConfig.phoneDisplay}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-max py-14 sm:py-20">
        <SectionHeading
          eyebrow={`Why ${area.name} Picks PVS`}
          title={`Local Property Care in ${area.name}`}
          align="left"
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {area.whyHere.map((reason) => (
            <li
              key={reason}
              className="surface-card p-5 flex gap-3 text-sm"
            >
              <Check
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                strokeWidth={3}
              />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-max pb-14 sm:pb-20">
        <SectionHeading
          eyebrow="Top Services Here"
          title={`Most-Booked Services in ${area.name}`}
          description={`The services ${area.name} homeowners book with PVS most often.`}
          align="left"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topServices.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="surface-card surface-card-hover p-6 flex flex-col gap-3 group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold leading-tight">
                {s.name} in {area.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
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

      {area.neighbourhoods.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="Neighbourhoods We Serve"
            title={`${area.name} Neighbourhoods on Our Routes`}
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

      <CtaBand />
    </>
  );
}
