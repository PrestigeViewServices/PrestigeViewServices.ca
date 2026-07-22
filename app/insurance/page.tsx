import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileCheck2, ArrowRight, Umbrella, Car, Scale } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fully Insured Property Care | $2M Liability Coverage",
  description:
    "Prestige View Services carries $2M commercial general liability, errors & omissions, and non-owned auto coverage. Certificate of insurance available on request.",
  alternates: { canonical: "/insurance" },
};

const COVERAGES = [
  {
    icon: ShieldCheck,
    title: "Commercial General Liability: $2,000,000",
    body: "Bodily injury and property damage coverage of two million dollars per occurrence, with a matching general aggregate and products-completed operations limit. If something ever went wrong on your property, this is the coverage that protects you.",
  },
  {
    icon: Umbrella,
    title: "Personal & Advertising Injury: $2,000,000",
    body: "A second two-million-dollar limit covering personal injury liability, part of the same commercial policy.",
  },
  {
    icon: Scale,
    title: "Contractors Errors & Omissions",
    body: "E&O coverage on top of general liability. It covers the quality of the work itself, a layer most small crews in the Valley simply don't carry.",
  },
  {
    icon: Car,
    title: "Non-Owned Automobile: $2,000,000",
    body: "Liability coverage that follows the work even when vehicles we don't own are involved, including hired vehicles.",
  },
];

const faqs = [
  {
    q: "Can I see proof of insurance before you work on my property?",
    a: "Absolutely, and we encourage it. Ask when you book and we'll send a current certificate of insurance issued by our insurer. Commercial property managers can request a certificate naming them as certificate holder.",
  },
  {
    q: "Why does a contractor's insurance matter to me as a homeowner?",
    a: "If an uninsured crew damages your property or someone is hurt on your job, the liability can land on you as the property owner. Hiring an insured company means a two-million-dollar policy stands between you and that risk.",
  },
  {
    q: "Does your insurance cover work at height, like second-storey windows?",
    a: "Yes. Our policy specifically covers window cleaning services on buildings up to three storeys, which covers every residential job we take on.",
  },
  {
    q: "Who is your insurer?",
    a: "Our coverage is written through Security National Insurance Company via TD Insurance, one of Canada's largest insurers. The policy renews annually and a dated certificate is available any time.",
  },
];

export default function InsurancePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Insurance",
          item: `${siteConfig.url}/insurance`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-2">
        <p className="eyebrow text-primary mb-3 inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Fully Insured, For Real
        </p>
        <h1 className="heading-section text-balance max-w-3xl">
          Two Million Dollars of Coverage Stands Behind Every Job
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          &quot;Fully insured&quot; is easy to say and rarely shown. Here is
          ours, plainly: Prestige View Services carries commercial general
          liability, errors &amp; omissions, and non-owned automobile coverage
          through TD Insurance. A current certificate is available to any
          customer who asks.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/quote">
              Get a Free Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={`mailto:${siteConfig.email}?subject=Certificate of Insurance Request`}>
              Request the Certificate
            </a>
          </Button>
        </div>
      </section>

      <section className="container-max py-14 sm:py-20">
        <SectionHeading
          eyebrow="What We Carry"
          title="The Coverage, In Plain Language"
          align="left"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {COVERAGES.map((c) => (
            <div key={c.title} className="surface-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{c.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-max pb-14 sm:pb-20">
        <div className="flex flex-col gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
            <p className="text-sm sm:text-base leading-relaxed">
              <span className="font-semibold">
                Certificate of insurance on request.
              </span>{" "}
              Homeowners, landlords, and property managers can have a dated
              certificate emailed before we ever set foot on the property.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href={`mailto:${siteConfig.email}?subject=Certificate of Insurance Request`}>
              Email us
            </a>
          </Button>
        </div>
      </section>

      <FaqSection
        items={faqs}
        eyebrow="Insurance FAQs"
        title="Questions About Our Coverage"
        description="What Ottawa Valley homeowners ask about hiring an insured crew."
      />

      <CtaBand />
    </>
  );
}
