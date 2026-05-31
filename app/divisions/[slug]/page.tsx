import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { divisions, type DivisionSlug } from "@/lib/content/divisions";
import { servicesByDivision } from "@/lib/content/services";
import { offersForDivision } from "@/lib/content/offers";
import { DivisionHero } from "@/components/division-hero";
import { ServiceCard } from "@/components/service-card";
import { OfferCard } from "@/components/offer-card";
import { SectionHeading } from "@/components/section-heading";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";

type Params = { slug: DivisionSlug };

export function generateStaticParams() {
  return divisions.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const division = divisions.find((d) => d.slug === params.slug);
  if (!division) return {};
  return {
    title: `${division.name} — ${division.tagline}`,
    description: division.description,
    alternates: { canonical: `/divisions/${division.slug}` },
  };
}

const sectionTitles: Record<DivisionSlug, string> = {
  lawnpros: "Lawn & Turf Services",
  clearview: "Exterior Services",
  snowland: "Snow & Ice Services",
};

export default function DivisionPage({ params }: { params: Params }) {
  const division = divisions.find((d) => d.slug === params.slug);
  if (!division) notFound();

  const divisionServices = servicesByDivision(division.slug);
  const divisionOffers = offersForDivision(division.slug);

  return (
    <>
      <DivisionHero division={division} />

      <section className="container-max py-16 sm:py-20">
        <SectionHeading
          eyebrow={division.name}
          title={sectionTitles[division.slug]}
          description="Every job, fully insured. Every quote, transparent. Book one service or build a recurring plan."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {divisionServices.map((s) => (
            <ServiceCard key={s.slug} service={s} quoteHref="#quote-form" />
          ))}
        </div>
      </section>

      {divisionOffers.length > 0 && (
        <section className="container-max py-12">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
            {divisionOffers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}

      <section className="container-max py-16 sm:py-20">
        <SectionHeading
          eyebrow="Free · No Obligation"
          title={`Request a ${division.shortName} Quote`}
          description="Tell us about your property and we'll respond within one business day."
        />
        <div className="mt-12">
          <AuroraLeadForm />
        </div>
      </section>
    </>
  );
}
