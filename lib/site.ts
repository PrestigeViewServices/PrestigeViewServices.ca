export const siteConfig = {
  name: "Prestige View Services",
  shortName: "PVS",
  tagline: "Raising the Standard Across the Valley",
  description:
    "Petawawa, Pembroke & Ottawa Valley's premier year-round property care company — lawn care, window cleaning, and snow removal.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL || "https://prestigeviewservices.ca",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+1-613-334-5858",
  phoneDisplay: "(613) 334-5858",
  email: "contact@prestigeviewservices.ca",
  serviceArea: "Petawawa, Pembroke & the Ottawa Valley",
  hours: "Mon–Sat, 7:00am–7:00pm",
  address: {
    streetAddress: "45 Water Tower Road",
    locality: "Petawawa",
    region: "ON",
    country: "CA",
  },
  social: {
    facebook: "https://facebook.com/prestigeviewservices",
    instagram: "https://instagram.com/prestigeviewservices",
  },
  /**
   * Google Business "leave a review" short link. Single source of truth —
   * edit here and every CTA + QR code regenerates from this value.
   */
  googleReviewUrl: "https://g.page/r/CQB2PdKcBZl-EAE/review",
} as const;

export type SiteConfig = typeof siteConfig;
