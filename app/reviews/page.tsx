import type { Metadata } from "next";
import { Star } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { ReviewCta } from "@/components/review-cta";
import { GoogleReviewsEmbed } from "@/components/home/google-reviews-embed";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reviews — What Petawawa & Pembroke Are Saying",
  description:
    "Real Google reviews from Prestige View Services customers across Petawawa, Pembroke, and the Ottawa Valley.",
  alternates: { canonical: "/reviews" },
};

/**
 * Real Google reviews via Trustindex embed. Configure the widget by setting
 * NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC (and optionally _CONTAINER_CLASS)
 * in env. When the widget URL is missing, the page renders an empty state
 * with the "Leave us a Google review" CTA — we never invent reviews.
 */
export default function ReviewsPage() {
  const widgetEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC
  );

  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Real Google Reviews"
          title="What Neighbours Are Saying"
          description="Every review below is pulled live from our Google Business profile."
        />

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <ReviewCta variant="button" />
          <p className="text-xs text-muted-foreground">
            Opens Google in a new tab. Takes about 30 seconds.
          </p>
        </div>
      </section>

      <section className="container-max py-16">
        {widgetEnabled ? (
          <GoogleReviewsEmbed />
        ) : (
          <div className="mx-auto max-w-xl surface-card p-8 sm:p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yellow-500/15 text-yellow-300">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">
              Live reviews coming online
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our Google reviews feed is being wired up. Until then, you can
              read them all — or leave one — straight on Google.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <a
                  href={siteConfig.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  See all on Google
                </a>
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="container-max pb-16">
        <SectionHeading
          eyebrow="On Instagram"
          title="Latest From the Crew"
          description="Recent jobs, before-and-afters, and behind-the-scenes from our Petawawa & Pembroke crews — straight from our Instagram."
          align="left"
        />
        <div className="mt-10">
          <GoogleReviewsEmbed scriptSrc="https://cdn.trustindex.io/loader-feed.js?1ecf5017441a6415de665eeab98" />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
