import { Snowflake, Sprout, Droplet, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { AmbienceParticles } from "@/components/service-ambience-particles";

/**
 * Subtle, full-viewport ambient layer for service pages. Sits behind every
 * page section (z-index: 0) and never blocks pointer events. Renders ~16
 * slowly drifting particles + a soft color tint. Reduced-motion users get a
 * still gradient with no particles.
 *
 * The component is a server component, the animation is pure CSS keyframes
 * declared in app/globals.css. No client JS needed.
 *
 * Particles use a deterministic pseudo-random distribution so SSR + hydrate
 * match without `Math.random()` hydration drift.
 */

type Theme = "snow" | "lawn" | "water" | "autumn";

export type ServiceAmbienceTheme = Theme;

const TINT: Record<Theme, string> = {
  // A very soft, atmospheric radial wash. Sits on top of the existing dark
  // body bg so the modern look is preserved.
  snow:
    "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.10),transparent_60%)]",
  lawn:
    "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(250,204,21,0.08),transparent_55%),radial-gradient(ellipse_90%_70%_at_50%_110%,rgba(34,197,94,0.06),transparent_60%)]",
  water:
    "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.10),transparent_60%)]",
  autumn:
    "bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.10),transparent_60%)]",
};

export function ServiceAmbience({ theme }: { theme: Theme }) {
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-0 pointer-events-none overflow-hidden",
        TINT[theme]
      )}
    >
      {/* Particles mount after the browser goes idle (and never for
          reduced-motion users); the soft tint above renders immediately. */}
      <AmbienceParticles theme={theme} />
    </div>
  );
}

/**
 * Map a service slug to the ambient theme that best fits it.
 * `null` = no ambient (keep the page clean).
 */
export function ambienceForService(slug: string): Theme | null {
  if (
    slug === "snow-removal" ||
    slug === "seasonal-snow-contract" ||
    slug === "walkway-clearing"
  ) {
    return "snow";
  }
  if (
    slug === "lawn-mowing" ||
    slug === "spring-cleanup" ||
    slug === "aeration" ||
    slug === "dethatching" ||
    slug === "overseeding" ||
    slug === "property-maintenance" ||
    slug === "landscaping-services"
  ) {
    return "lawn";
  }
  if (
    slug === "window-cleaning" ||
    slug === "pressure-washing" ||
    slug === "house-washing"
  ) {
    return "water";
  }
  if (
    slug === "gutter-cleaning" ||
    slug === "property-cleanouts" ||
    slug === "junk-removal"
  ) {
    return "autumn";
  }
  return null;
}
