import { DISCOUNT_BADGES } from "@/lib/content/care-plans";
import { cn } from "@/lib/utils";

/**
 * Military / First-Responder + Neighbour Deal discount badges.
 * Pure presentational, reused on the Care Plans page and service sections.
 */
export function DiscountBadges({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className
      )}
    >
      {DISCOUNT_BADGES.map((b) => (
        <li
          key={b.id}
          className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
        >
          <span className="text-2xl leading-none" aria-hidden>
            {b.emoji}
          </span>
          <div>
            <p className="text-sm font-semibold">{b.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {b.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
