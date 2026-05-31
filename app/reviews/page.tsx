import type { Metadata } from "next";
import { Star } from "lucide-react";
import { reviews, averageRating } from "@/lib/content/reviews";
import { ReviewCard } from "@/components/review-card";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = {
  title: "Reviews — What Petawawa & Pembroke Are Saying",
  description:
    "Real customer reviews from across the Ottawa Valley. See why homeowners trust Prestige View Services for lawn care, window cleaning, and snow removal.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  const avg = averageRating();

  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Customer Stories"
          title="What Neighbours Are Saying"
          description="Honest feedback from real PVS customers across Petawawa, Pembroke, and the Ottawa Valley."
        />

        <div
          className="mt-10 mx-auto flex max-w-md items-center justify-center gap-4 rounded-2xl border border-surface-border bg-surface/60 px-6 py-4"
          aria-label={`Average rating ${avg} out of 5 from ${reviews.length} reviews`}
        >
          <div
            className="flex items-center gap-1"
            aria-hidden
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <div className="text-sm">
            <span className="font-semibold">{avg}</span>
            <span className="text-muted-foreground">
              {" "}
              · {reviews.length}+ verified reviews
            </span>
          </div>
        </div>
      </section>

      <section className="container-max py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
