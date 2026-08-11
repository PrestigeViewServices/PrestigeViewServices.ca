import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { guides, getGuide, otherGuides } from "@/lib/content/guides";
import { getService } from "@/lib/content/services";
import { FaqSection } from "@/components/faq-section";
import { SamTip } from "@/components/sam";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const guide = getGuide(params.slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${siteConfig.url}/guides/${guide.slug}`,
      images: [{ url: guide.hero.src, alt: guide.hero.alt }],
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
  };
}

export default async function GuidePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const related = guide.relatedServices
    .map((slug) => getService(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const keepReading = otherGuides(guide.slug);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: `${siteConfig.url}${guide.hero.src}`,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/images/logo.png`,
      },
    },
    mainEntityOfPage: `${siteConfig.url}/guides/${guide.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tips & Guides",
        item: `${siteConfig.url}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: `${siteConfig.url}/guides/${guide.slug}`,
      },
    ],
  };

  const formattedDate = new Date(
    `${guide.datePublished}T12:00:00`
  ).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleLd, breadcrumbLd]),
        }}
      />

      <article>
        <section className="container-max pt-14 sm:pt-20 pb-2">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Guides
          </Link>

          <div className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                {guide.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formattedDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {guide.readMinutes} min read
              </span>
            </div>
            <h1 className="heading-section mt-4 text-balance">{guide.title}</h1>
          </div>

          <div className="relative mt-8 aspect-[16/7] overflow-hidden rounded-3xl border border-surface-border">
            <Image
              src={guide.hero.src}
              alt={guide.hero.alt}
              fill
              priority
              sizes="(min-width:1280px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="container-max py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            {guide.intro.map((p, i) => (
              <p
                key={i}
                className="mt-4 first:mt-0 text-base sm:text-lg leading-relaxed text-muted-foreground"
              >
                {p}
              </p>
            ))}

            <SamTip pose={guide.samTip.pose} className="mt-8">
              {guide.samTip.text}
            </SamTip>

            {guide.sections.map((s, i) => (
              <div key={i} className="mt-10">
                {s.heading && (
                  <h2 className="text-xl sm:text-2xl font-semibold text-balance">
                    {s.heading}
                  </h2>
                )}
                {s.paragraphs.map((p, j) => (
                  <p
                    key={j}
                    className="mt-4 text-base leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="container-max pb-6">
            <div className="mx-auto max-w-3xl rounded-3xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">
                Want this handled instead?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                PVS runs these exact services across Petawawa, Pembroke, and
                the Ottawa Valley. Free quotes within one business day.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {related.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-background/60 p-4 transition-colors hover:border-primary/40"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {s.name}
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
              <Button asChild className="mt-5">
                <Link href="/quote">Get a Free Quote</Link>
              </Button>
            </div>
          </section>
        )}

        <FaqSection
          items={guide.faqs}
          eyebrow="Quick Answers"
          title="Related Questions"
        />
      </article>

      {keepReading.length > 0 && (
        <section className="container-max pb-14 sm:pb-20">
          <h2 className="text-lg font-semibold">Keep reading</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {keepReading.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group surface-card p-5 transition-transform hover:-translate-y-1"
              >
                <span className="text-xs font-semibold text-primary">
                  {g.category}
                </span>
                <p className="mt-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                  {g.title}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {g.readMinutes} min read
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
