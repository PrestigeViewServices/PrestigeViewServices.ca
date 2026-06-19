import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { ServicesOverview } from "@/components/home/services-overview";
import { OffersBand } from "@/components/home/offers-band";
import { TrustStrip } from "@/components/home/trust-strip";
import { FreshFromField } from "@/components/home/fresh-from-field";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { BeforeAfterSection } from "@/components/home/before-after-section";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { FaqSection } from "@/components/faq-section";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { homeFaqs } from "@/lib/content/faq";

export const metadata: Metadata = {
  title:
    "Lawn Care, Window Cleaning & Snow Removal in Petawawa, Pembroke & the Ottawa Valley",
  description:
    "Prestige View Services — Petawawa & Pembroke's year-round property care company. Lawn mowing, window cleaning, gutter cleaning, pressure washing, junk removal, and snow removal across the Ottawa Valley. Free quote in one business day.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "Lawn, Window & Snow Care in Petawawa & Pembroke · Prestige View Services",
    description:
      "Year-round property care for Petawawa, Pembroke and the Ottawa Valley — one local crew, recurring schedule, one easy bill.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustMarquee />
      <Reveal>
        <ServicesOverview />
      </Reveal>
      <Reveal delay={60}>
        <OffersBand />
      </Reveal>
      <Reveal>
        <TrustStrip />
      </Reveal>
      <Reveal delay={60}>
        <FreshFromField />
      </Reveal>
      <Reveal>
        <GalleryStrip />
      </Reveal>
      <Reveal delay={60}>
        <BeforeAfterSection />
      </Reveal>
      <Reveal>
        <ReviewsPreview />
      </Reveal>
      <Reveal>
        <FaqSection
          items={homeFaqs}
          eyebrow="Questions Petawawa & Pembroke Homeowners Ask"
          title="Frequently Asked Questions"
          description="Quick answers about how PVS books, prices, and shows up — across the Ottawa Valley."
        />
      </Reveal>
      <Reveal>
        <CtaBand />
      </Reveal>
    </>
  );
}
