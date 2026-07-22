import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { PromoBanner } from "@/components/home/promo-banner";
import { VeteranCallout } from "@/components/home/veteran-callout";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { ServicesOverview } from "@/components/home/services-overview";
import { OffersBand } from "@/components/home/offers-band";
import { TrustStrip } from "@/components/home/trust-strip";
import { FreshFromField } from "@/components/home/fresh-from-field";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { BeforeAfterSection } from "@/components/home/before-after-section";
import { ActionShots } from "@/components/home/action-shots";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { FaqSection } from "@/components/faq-section";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { homeFaqs } from "@/lib/content/faq";

export const metadata: Metadata = {
  title:
    "Property Care in Petawawa, Pembroke & the Ottawa Valley | Prestige View Services",
  description:
    "Windows, lawns, landscaping & snow, done right by one local, veteran-operated crew. Serving Petawawa, Pembroke, Deep River & the Ottawa Valley. Get a free quote.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "The Ottawa Valley's Property Care Team | Prestige View Services",
    description:
      "Windows, lawns, landscaping & snow, done right by one local, veteran-operated crew. Military & veteran discount. Free quotes in one business day.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <PromoBanner />
      <Hero />
      <TrustMarquee />
      <Reveal>
        <ServicesOverview />
      </Reveal>
      <Reveal delay={60}>
        <VeteranCallout />
      </Reveal>
      <Reveal>
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
        <ActionShots />
      </Reveal>
      <Reveal>
        <ReviewsPreview />
      </Reveal>
      <Reveal>
        <FaqSection
          items={homeFaqs}
          eyebrow="Questions Petawawa & Pembroke Homeowners Ask"
          title="Frequently Asked Questions"
          description="Quick answers about how PVS books, prices, and shows up across the Ottawa Valley."
        />
      </Reveal>
      <Reveal>
        <CtaBand />
      </Reveal>
    </>
  );
}
