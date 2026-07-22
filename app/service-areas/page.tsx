import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { serviceAreas } from "@/lib/content/service-areas";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title:
    "Service Areas, Petawawa, Pembroke & the Ottawa Valley",
  description:
    "Prestige View Services covers Petawawa, Pembroke, Deep River, Renfrew, Arnprior, Cobden, Eganville, and Chalk River, lawn care, window cleaning, gutter cleaning, and snow removal year-round.",
  alternates: { canonical: "/service-areas" },
};

export default function ServiceAreasIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PVS Service Areas",
    itemListElement: serviceAreas.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${a.name}, ${a.region}`,
      url: `${siteConfig.url}/service-areas/${a.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Where We Work"
          title="Petawawa, Pembroke & the Ottawa Valley"
          description="PVS is based in Petawawa and routes crews across the Valley year-round. Pick your town below for a localized service overview."
        />
      </section>

      <section className="container-max py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/service-areas/${area.slug}`}
              className="surface-card surface-card-hover p-6 flex flex-col gap-3 group"
            >
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">
                  {area.region}
                </span>
              </div>
              <h2 className="text-xl font-semibold leading-tight">
                {area.name}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {area.intro}
              </p>
              <div className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Local services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
