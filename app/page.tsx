import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { SeasonBanner } from "@/components/home/season-banner";
import { VeteranCallout } from "@/components/home/veteran-callout";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { ServicesOverview } from "@/components/home/services-overview";
import { FallWinterPromo } from "@/components/home/fall-winter-promo";
import { OffersBand } from "@/components/home/offers-band";
import { TrustStrip } from "@/components/home/trust-strip";
import { FreshFromField } from "@/components/home/fresh-from-field";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { BeforeAfterSection } from "@/components/home/before-after-section";
import { ActionShots } from "@/components/home/action-shots";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { FaqSection } from "@/components/faq-section";
import { AccountSavingsBanner } from "@/components/account-savings-banner";
import { EquipmentByTown } from "@/components/winter/equipment-by-town";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { Reveal } from "@/components/ui/reveal";
import { homeFaqs } from "@/lib/content/faq";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title:
    "Property Care in Petawawa, Pembroke & the Ottawa Valley | Prestige View Services",
  description:
    "Fall cleanups and seasonal snow removal for homes and businesses in Petawawa & Pembroke. Plow trucks in Pembroke, tractors in Petawawa, commercial lots too. Free quote in one business day.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "Get Your Property Winter-Ready | Prestige View Services",
    description:
      "Fall cleanups, gutters & winter snow contracts from one local, veteran-operated crew. Military & veteran discount. Free quotes in one business day.",
    url: "/",
    type: "website",
  },
};

// Owner-edited content (hero, banner, offers, the 5% account push) must
// show up as soon as it's saved — never frozen into a build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getSiteContent();
  return (
    <>
      <SeasonBanner />
      <Hero content={content.hero} />
      <TrustMarquee />
      <Reveal>
        <FallWinterPromo />
      </Reveal>
      <Reveal>
        <EquipmentByTown
          id="snow-equipment"
          eyebrow="Snow removal, town by town"
          title="Pembroke gets plow trucks. Petawawa gets tractors."
          description="Every winter route runs on the machine that suits it best. Here is what clears your driveway or lot this season."
        />
      </Reveal>
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
        <section className="container-max py-4">
          <AccountSavingsBanner />
        </section>
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
        <section className="container-max pb-20">
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-blue-950 via-slate-900 to-amber-950/40 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-amber-300">Last call before the snow</p>
              <h2 className="heading-section mt-3 text-balance text-white">
                Get your fall cleanup and winter plan locked in today
              </h2>
              <p className="mt-4 text-base leading-relaxed text-sky-100/80">
                Routes are capped so response times hold through every storm.
                Once a route is full it closes until next winter. Tell us
                where you are and we will hold your spot while we quote.
              </p>
            </div>
            <AuroraLeadForm id="home-quote" />
          </div>
        </section>
      </Reveal>
    </>
  );
}
