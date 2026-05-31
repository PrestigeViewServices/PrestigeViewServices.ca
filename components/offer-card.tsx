import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import type { Offer } from "@/lib/content/offers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accentGradients: Record<Offer["accent"], string> = {
  lawn: "from-emerald-500/15 to-emerald-700/5 border-emerald-500/20",
  clearview: "from-blue-500/15 to-blue-700/5 border-blue-500/20",
  snowland: "from-sky-500/15 to-sky-700/5 border-sky-500/20",
};

const accentText: Record<Offer["accent"], string> = {
  lawn: "text-emerald-400",
  clearview: "text-blue-400",
  snowland: "text-sky-400",
};

const ctaVariant: Record<Offer["accent"], "lawn" | "primary" | "snowland"> = {
  lawn: "lawn",
  clearview: "primary",
  snowland: "snowland",
};

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article
      className={cn(
        "group rounded-2xl border bg-gradient-to-br p-6 sm:p-7 flex flex-col h-full backdrop-blur-sm transition-all hover:-translate-y-0.5",
        accentGradients[offer.accent]
      )}
    >
      {offer.eyebrow && (
        <p
          className={cn(
            "eyebrow",
            accentText[offer.accent]
          )}
        >
          <Zap className="h-3.5 w-3.5" fill="currentColor" />
          {offer.eyebrow}
        </p>
      )}
      <h3 className="mt-3 text-2xl sm:text-[26px] font-bold leading-tight text-balance">
        {offer.headline}
      </h3>
      <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed flex-1">
        {offer.body}
      </p>
      <div className="mt-6">
        <Button asChild variant={ctaVariant[offer.accent]} size="lg">
          <Link href={offer.ctaHref}>
            {offer.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
