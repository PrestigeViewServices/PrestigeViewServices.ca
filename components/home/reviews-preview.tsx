import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { ReviewCta } from "@/components/review-cta";
import { GoogleReviewsEmbed } from "@/components/home/google-reviews-embed";
import { siteConfig } from "@/lib/site";

/**
 * Real Google reviews via the Trustindex widget (configured by
 * NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC). No fabricated reviews — when the
 * widget env var is missing, we render an honest empty state with the
 * "Leave us a Google review" CTA.
 *
 * Trustindex / Elfsight / EmbedSocial include the Google attribution
 * inside the widget itself, satisfying Places policy.
 */
export function ReviewsPreview() {
  // Inlined env check instead of importing a helper from the "use client"
  // embed module — exports from a client file become client references and
  // aren't callable from server components.
  const widgetEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC
  );

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Real Google Reviews"
        title="What Neighbours Are Saying"
        description="Verified reviews from real PVS customers across Petawawa, Pembroke, and the Ottawa Valley."
      />

      {widgetEnabled ? (
        <div className="mt-12">
          <GoogleReviewsEmbed />
        </div>
      ) : (
        // No fake reviews — show an honest empty state until the widget
        // env var is configured.
        <div className="mt-12 mx-auto max-w-xl surface-card p-8 sm:p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-yellow-500/15 text-yellow-300">
            <Star className="h-6 w-6 fill-current" />
          </div>
          <h3 className="mt-5 text-xl font-semibold">
            Reviews going live shortly
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We're hooking up our live Google reviews. In the meantime, see
            them — or leave one — directly on Google.
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
            <ReviewCta variant="button" />
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/reviews">
            Read All Reviews
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
