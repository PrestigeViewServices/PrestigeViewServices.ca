import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { DivisionsOverview } from "@/components/home/divisions-overview";
import { OffersBand } from "@/components/home/offers-band";
import { TrustStrip } from "@/components/home/trust-strip";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = {
  title: "Lawn Care, Window Cleaning & Snow Removal in Petawawa & Pembroke",
  description:
    "Prestige View Services is the Ottawa Valley's year-round property care company — lawn mowing, window cleaning, gutter cleaning, pressure washing, and snow removal. Get a free quote today.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <DivisionsOverview />
      <OffersBand />
      <TrustStrip />
      <GalleryStrip />
      <ReviewsPreview />
      <CtaBand />
    </>
  );
}
