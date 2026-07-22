import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  workCategories,
  getWorkCategory,
} from "@/lib/content/work-categories";
import { getDivision } from "@/lib/content/divisions";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

type Params = { category: string };

export function generateStaticParams() {
  return workCategories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const category = getWorkCategory(params.category);
  if (!category) return {};
  const title = `${category.name}, Recent Work in Petawawa & Pembroke`;
  return {
    title,
    description: `${category.description} Real PVS jobs across Petawawa, Pembroke, and the Ottawa Valley.`,
    alternates: { canonical: `/our-work/${category.slug}` },
    openGraph: {
      title,
      description: category.description,
      url: `${siteConfig.url}/our-work/${category.slug}`,
    },
  };
}

export default function CategoryGalleryPage({
  params,
}: {
  params: Params;
}) {
  const category = getWorkCategory(params.category);
  if (!category) notFound();

  const division = getDivision(category.division);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Our Work",
        item: `${siteConfig.url}/our-work`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${siteConfig.url}/our-work/${category.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-2">
        <Link
          href="/our-work"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Categories
        </Link>
        <div className="mt-6">
          <SectionHeading
            eyebrow={`${division.shortName} · Recent Work`}
            title={category.name}
            description={category.description}
            align="left"
          />
        </div>
      </section>

      <section className="container-max py-12 sm:py-16">
        {category.photos.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <p className="text-base text-muted-foreground">
              Fresh photos coming soon. Want to be next on the list?
            </p>
            <Button asChild className="mt-5">
              <Link href="/quote">Get a Free Quote</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.photos.map((photo) => (
              <figure
                key={photo.src}
                className="group relative overflow-hidden rounded-2xl border border-surface-border bg-surface/60"
              >
                <div className="relative aspect-[3/2]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {photo.caption && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"
                    />
                  )}
                </div>
                {photo.caption && (
                  <figcaption className="absolute bottom-3 left-4 right-4 text-sm font-medium text-white">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      <CtaBand />
    </>
  );
}
