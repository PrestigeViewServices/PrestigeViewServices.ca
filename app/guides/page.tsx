import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { guides } from "@/lib/content/guides";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tips & Guides for Ottawa Valley Homeowners",
  description:
    "Practical property care guides written for Petawawa, Pembroke, and the Ottawa Valley: lawn care on sandy soil, gutter schedules, winter prep, and more.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Tips & Guides for Ottawa Valley Homeowners",
    description:
      "Practical property care guides for Petawawa, Pembroke, and the Ottawa Valley, written by the local crew that does the work.",
    url: `${siteConfig.url}/guides`,
  },
};

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tips & Guides for Ottawa Valley Homeowners",
    url: `${siteConfig.url}/guides`,
    hasPart: guides.map((g) => ({
      "@type": "Article",
      headline: g.title,
      url: `${siteConfig.url}/guides/${g.slug}`,
      datePublished: g.datePublished,
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
          eyebrow="From the Field"
          title="Tips & Guides for Ottawa Valley Homes"
          description="No recycled internet advice. These guides are written by the crew that mows, washes, clears, and cleans across Petawawa and Pembroke, for the soil, trees, and winters we actually have."
        />
      </section>

      <section className="container-max py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group surface-card overflow-hidden transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={g.hero.src}
                  alt={g.hero.alt}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                    {g.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {g.readMinutes} min read
                  </span>
                </div>
                <h2 className="mt-3 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                  {g.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {g.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read the guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
