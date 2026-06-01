import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { DivisionsOverview } from "@/components/home/divisions-overview";
import { OffersBand } from "@/components/home/offers-band";
import { TrustStrip } from "@/components/home/trust-strip";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { ReviewsPreview } from "@/components/home/reviews-preview";
import { CtaBand } from "@/components/cta-band";

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
      <DivisionsOverview />
      <OffersBand />
      <TrustStrip />
      <GalleryStrip />
      <ReviewsPreview />
      <CtaBand />
    </>
  );
}
