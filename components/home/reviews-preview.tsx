import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { reviews, averageRating } from "@/lib/content/reviews";
import { ReviewCard } from "@/components/review-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { GoogleReviewsEmbed } from "@/components/home/google-reviews-embed";

export function ReviewsPreview() {
  // Inlined instead of importing a helper from the "use client" embed module —
  // exports from a "use client" file become client references and aren't
  // callable from server components (breaks the static prerender of /).
  const widgetEnabled = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC
  );
  const featured = reviews.slice(0, 4);

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow={`${averageRating()} average · ${reviews.length}+ reviews`}
        title="What Neighbours Are Saying"
        description="Real reviews from Petawawa, Pembroke, and across the Ottawa Valley."
      />

      {/* When the Google Reviews widget env var is set, it replaces the
          static cards entirely so we don't show two different review lists. */}
      {widgetEnabled ? (
        <div className="mt-12">
          <GoogleReviewsEmbed />
        </div>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
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
