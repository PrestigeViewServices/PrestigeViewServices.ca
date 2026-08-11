import type { Metadata } from "next";
import { homeFaqs, serviceFaqs } from "@/lib/content/faq";
import { getService } from "@/lib/content/services";
import { FaqExplorer, type FaqGroup } from "@/components/faq-explorer";
import { SectionHeading } from "@/components/section-heading";
import { SamTip } from "@/components/sam";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ, Every Question We Get About Property Care",
  description:
    "Every question Ottawa Valley homeowners ask us about lawn care, window cleaning, gutters, pressure washing, and snow removal, answered in one place.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "PVS FAQ, Every Question in One Place",
    description:
      "Lawn, windows, gutters, washing, and snow: every common question, answered by the crew that does the work.",
    url: `${siteConfig.url}/faq`,
  },
};

/** Fallback pretty-name for FAQ groups without a matching service entry. */
function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FaqPage() {
  const groups: FaqGroup[] = [
    { title: "The Basics", items: homeFaqs },
    ...Object.entries(serviceFaqs).map(([slug, items]) => ({
      title: getService(slug)?.name ?? titleFromSlug(slug),
      items,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${siteConfig.url}/faq` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Ask Us Anything"
          title="Every Question, One Page"
          description="Everything Ottawa Valley homeowners ask us, from cut heights to snow triggers, answered the way we'd answer on your doorstep."
        />
      </section>

      <section className="container-max pb-6">
        <div className="mx-auto max-w-3xl">
          <SamTip>
            Can&apos;t find your question below? Don&apos;t suffer in silence,
            call the crew at (613) 334-5858 or use the contact page. Real
            questions from real neighbours are how this page grows.
          </SamTip>
        </div>
      </section>

      <section className="container-max pb-14 sm:pb-20">
        <FaqExplorer groups={groups} />
      </section>

      <CtaBand />
    </>
  );
}
