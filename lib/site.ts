export const siteConfig = {
  name: "Prestige View Services",
  shortName: "PVS",
  tagline: "Raising the Standard Across the Valley",
  description:
    "Petawawa, Pembroke & Ottawa Valley's premier year-round property care company — lawn care, window cleaning, and snow removal.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL || "https://prestigeviewservices.ca",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+1-613-555-0123",
  phoneDisplay: "(613) 555-0123",
  email: "hello@prestigeviewservices.ca",
  supportEmail: "support@prestigeviewservices.ca",
  serviceArea: "Petawawa, Pembroke & the Ottawa Valley",
  hours: "Mon–Sat, 7:00am–7:00pm",
  address: {
    locality: "Petawawa",
    region: "ON",
    country: "CA",
  },
  social: {
    facebook: "https://facebook.com/prestigeviewservices",
    instagram: "https://instagram.com/prestigeviewservices",
  },
} as const;

export type SiteConfig = typeof siteConfig;
