import { Star, Quote } from "lucide-react";
import type { Review } from "@/lib/content/reviews";
import { cn } from "@/lib/utils";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="surface-card p-6 flex flex-col h-full">
      <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < review.rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      <Quote className="h-6 w-6 text-primary/40 mt-4" />
      <blockquote className="mt-2 text-[15px] leading-relaxed text-foreground/90 flex-1">
        {review.quote}
      </blockquote>
      <footer className="mt-6 pt-4 border-t border-surface-border">
        <p className="text-sm font-semibold">{review.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {review.location} · {review.service}
        </p>
      </footer>
    </article>
  );
}
