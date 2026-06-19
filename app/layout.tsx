import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { OfferModal } from "@/components/offer-modal";
import { StickyCta } from "@/components/sticky-cta";
import { ScrollProgress } from "@/components/scroll-progress";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { siteConfig } from "@/lib/site";
import { services } from "@/lib/content/services";
import { reviews, averageRating } from "@/lib/content/reviews";
import { isClerkConfigured } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display/heading face — geometric, premium, modern. Paired with Inter body.
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: [
    "lawn care Petawawa",
    "lawn mowing Pembroke",
    "window cleaning Petawawa",
    "window cleaning Pembroke",
    "gutter cleaning Ottawa Valley",
    "pressure washing Petawawa",
    "snow removal Pembroke",
    "snow removal Ottawa Valley",
    "property maintenance Petawawa",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    // Pasted from Google Search Console → Settings → Ownership → HTML tag.
    // Set GOOGLE_SITE_VERIFICATION in .env.local + Vercel env. When unset,
    // Next.js simply omits the meta tag.
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    // Bing Webmaster Tools verification (Settings → Site Owner Verification
    // → Meta tag). Set BING_SITE_VERIFICATION when ready.
    other: {
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    areaServed: [
      { "@type": "City", name: "Petawawa" },
      { "@type": "City", name: "Pembroke" },
      { "@type": "AdministrativeArea", name: "Ottawa Valley" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      addressCountry: siteConfig.address.country,
    },
    openingHours: "Mo-Sa 07:00-19:00",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Property Care Services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.shortDescription,
        },
      })),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: averageRating(),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.quote,
    })),
    sameAs: [siteConfig.social.facebook, siteConfig.social.instagram],
  };

  const tree = (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <OfferModal />
        <StickyCta />

        {/* Analytics — providers self-disable when their env vars are unset */}
        <VercelAnalytics />
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  );

  // Only wrap in ClerkProvider when env vars are set. Without them,
  // ClerkProvider throws at static-prerender time, which would break Vercel
  // builds for the marketing site. Keyless mode is a `next dev`-only convenience.
  return isClerkConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
