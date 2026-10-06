import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn, formatPhone } from "@/lib/utils";

/**
 * Compact quote prompt for the home page. The Aurora form is too tall to
 * sit in the hero or a split section without dwarfing the copy, so this
 * card sends visitors to the full form: /quote by default, or an on-page
 * Aurora section further down.
 */
const POINTS = [
  "Free quote within one business day",
  "Fall cleanups, gutters & seasonal snow",
  "Fully insured, locally owned",
];

export function QuoteCtaCard({
  id,
  title = "Get your free quote",
  subtitle = "Tell us about your property in under a minute.",
  tone = "card",
  href = "/quote",
  className,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  /** "glass" for use over a photo. */
  tone?: "card" | "glass";
  /** Where the main button goes: /quote, or an on-page Aurora form. */
  href?: string;
  className?: string;
}) {
  const glass = tone === "glass";
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 rounded-3xl p-6 sm:p-8",
        glass
          ? "border border-white/15 bg-slate-950/55 text-white shadow-2xl backdrop-blur-md"
          : "surface-card",
        className
      )}
    >
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p
        className={cn(
          "mt-1.5 text-sm",
          glass ? "text-sky-100/80" : "text-muted-foreground"
        )}
      >
        {subtitle}
      </p>
      <ul className="mt-5 space-y-2.5 text-sm">
        {POINTS.map((p) => (
          <li key={p} className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className={glass ? "text-sky-50" : undefined}>{p}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Get my free quote
        <ArrowRight className="h-4 w-4" />
      </Link>
      <a
        href={`tel:${formatPhone(siteConfig.phone)}`}
        className={cn(
          "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition",
          glass
            ? "border-white/25 text-white hover:bg-white/10"
            : "border-surface-border hover:bg-surface"
        )}
      >
        <Phone className="h-4 w-4" />
        Or call {siteConfig.phoneDisplay}
      </a>
    </div>
  );
}
