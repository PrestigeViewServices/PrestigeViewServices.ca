import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { reviews, averageRating } from "@/lib/content/reviews";
import { ReviewCard } from "@/components/review-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

export function ReviewsPreview() {
  const featured = reviews.slice(0, 4);
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow={`${averageRating()} average · ${reviews.length}+ reviews`}
        title="What Neighbours Are Saying"
        description="Real reviews from Petawawa, Pembroke, and across the Ottawa Valley."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {featured.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
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
