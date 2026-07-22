import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, Medal, Snowflake } from "lucide-react";
import { services, getService } from "@/lib/content/services";
import type { DivisionSlug } from "@/lib/content/divisions";
import {
  serviceAreas,
  getServiceArea,
  serviceOfferedInArea,
  isSnowService,
} from "@/lib/content/service-areas";
import { getGalleryForService } from "@/lib/content/work-categories";
import { getLocalCopy } from "@/lib/content/local-copy";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { CtaBand } from "@/components/cta-band";

const CATEGORY_LABEL: Record<DivisionSlug, string> = {
  lawnpros: "Lawn & Landscaping",
  clearview: "Exterior Cleaning",
  snowland: "Snow & Ice",
};
import {
  ServiceAmbience,
  ambienceForService,
} from "@/components/service-ambience";
import { siteConfig } from "@/lib/site";

type Params = { slug: string; area: string };

/**
 * Service+Area combination pages, e.g. /services/window-cleaning/petawawa.
 * Captures "<service> + <city>" search intent directly. Each pre-rendered
 * page gets its own H1, intro, schema, and cross-linking to the parent
 * service and area. Snow-division combos only exist where the area actually
 * has snow coverage (Petawawa active, Pembroke expanding this season).
 */
export function generateStaticParams() {
  const out: Params[] = [];
  for (const s of services) {
    for (const a of serviceAreas) {
      if (!serviceOfferedInArea(s.slug, a)) continue;
      out.push({ slug: s.slug, area: a.slug });
    }
  }
  return out;
}

export async function generateMetadata(
  props: {
    params: Promise<Params>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const service = getService(params.slug);
  const area = getServiceArea(params.area);
  if (!service || !area) return {};
  const local = getLocalCopy(service.slug, area.slug);
  const title = `${service.name} in ${area.name}, ${area.region}`;
  // Unique per-combo description: lead with the page's own local copy when
  // it exists so no two combo pages share a meta description.
  const localHook = local?.intro[0]?.split(". ").slice(0, 1).join(". ");
  const description = localHook
    ? `${localHook}. Free quote within one business day.`.slice(0, 155)
    : `${service.shortDescription} Local ${service.name.toLowerCase()} crew serving ${area.name} and the surrounding Ottawa Valley, free quote within one business day.`;
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

export default async function ServiceAreaCombinationPage(
  props: {
    params: Promise<Params>;
  }
) {
  const params = await props.params;
  const service = getService(params.slug);
  const area = getServiceArea(params.area);
  if (!service || !area) notFound();
  if (!serviceOfferedInArea(service.slug, area)) notFound();

  const snowExpanding = isSnowService(service.slug) && area.snowStatus === "expanding";
  const categoryLabel = CATEGORY_LABEL[service.division];
  const local = getLocalCopy(service.slug, area.slug);
  const isPetawawa = area.slug === "petawawa";
  const gallery = getGalleryForService(service.slug);

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
    ...(local?.faqs && local.faqs.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: local.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
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

  // Same theming as the parent service page, snow / lawn / water / autumn.
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
              {area.name}, {area.region} · {categoryLabel}
            </p>
            <h1 className="heading-section text-balance">
              {service.name} in {area.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {service.shortDescription} {area.name} crews routed weekly, {" "}
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

      {isPetawawa && (
        <section className="container-max pt-10">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/5 p-6">
            <Medal className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden />
            <p className="text-sm sm:text-base leading-relaxed">
              <span className="font-semibold">
                Military &amp; veteran discount in Petawawa.
              </span>{" "}
              PVS is veteran operated. Serving members, veterans, military
              families, and first responders save 10% on{" "}
              {service.name.toLowerCase()}. Not combinable with other offers
              above 10%. Mention your service when you request a quote.
            </p>
          </div>
        </section>
      )}

      {snowExpanding && (
        <section className="container-max pt-10">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6">
            <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
            <p className="text-sm sm:text-base leading-relaxed text-sky-50">
              <span className="font-semibold text-white">
                New this season: {service.name.toLowerCase()} is expanding into{" "}
                {area.name}.
              </span>{" "}
              Our snow routes have been Petawawa-only until now. This winter
              they reach {area.name}, and spots are limited while we build the
              route. Reserve early to lock in your driveway.
            </p>
          </div>
        </section>
      )}

      {local && (
        <section className="container-max pt-10 sm:pt-14">
          <div className="max-w-3xl space-y-5">
            {local.intro.map((p) => (
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
        <section className="container-max pb-14 sm:pb-20 relative">
          <SectionHeading
            eyebrow={`Recent ${area.name} Work`}
            title={`See ${service.name.toLowerCase()} jobs from across the Valley`}
            description={`Real PVS ${service.name.toLowerCase()} work across Petawawa, Pembroke, and surrounding towns.`}
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

      {local?.faqs && local.faqs.length > 0 && (
        <FaqSection
          items={local.faqs}
          eyebrow={`${area.name} FAQs`}
          title={`${service.name} in ${area.name}, Common Questions`}
          description={`What ${area.name} homeowners ask us about ${service.name.toLowerCase()}.`}
        />
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
