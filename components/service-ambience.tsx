import { Snowflake, Sprout, Droplet, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Subtle, full-viewport ambient layer for service pages. Sits behind every
 * page section (z-index: 0) and never blocks pointer events. Renders ~16
 * slowly drifting particles + a soft color tint. Reduced-motion users get a
 * still gradient with no particles.
 *
 * The component is a server component — the animation is pure CSS keyframes
 * declared in app/globals.css. No client JS needed.
 *
 * Particles use a deterministic pseudo-random distribution so SSR + hydrate
 * match without `Math.random()` hydration drift.
 */

type Theme = "snow" | "lawn" | "water" | "autumn";

export type ServiceAmbienceTheme = Theme;

const ICON: Record<Theme, typeof Snowflake> = {
  snow: Snowflake,
  lawn: Sprout,
  water: Droplet,
  autumn: Leaf,
};

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

const PARTICLE_COLOR: Record<Theme, string> = {
  snow: "text-sky-200",
  lawn: "text-emerald-300",
  water: "text-blue-300",
  autumn: "text-amber-300",
};

// Falling vs rising — only lawn rises (like grass clippings drifting up).
const ANIM_CLASS: Record<Theme, string> = {
  snow: "animate-ambience-fall",
  lawn: "animate-ambience-rise",
  water: "animate-ambience-fall-fast",
  autumn: "animate-ambience-fall-tumble",
};

/**
 * 16 particles. Positions, delays, durations, and sizes derived from the
 * index so SSR + hydrate match deterministically. The %-based math gives a
 * "scattered" feel without rng.
 */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: ((i * 6.25) + ((i * 17) % 8)) % 100,            // 0–100% across viewport
  delay: ((i * 0.7) % 8).toFixed(2),                    // 0.00–7.00s stagger
  duration: 9 + (i % 7),                                // 9–15s per traversal
  size: 8 + (i % 5),                                    // 8–12px
  opacity: 0.16 + (i % 4) * 0.05,                       // 0.16–0.31
  drift: ((i * 13) % 60) - 30,                          // ±30px horizontal drift
  rotate: ((i * 41) % 360),                             // 0–360deg final rotation
}));

export function ServiceAmbience({ theme }: { theme: Theme }) {
  const Icon = ICON[theme];
  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-0 pointer-events-none overflow-hidden",
        TINT[theme]
      )}
    >
      {/* Reduced-motion: hide particles entirely; soft tint remains. */}
      <div className="motion-reduce:hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={cn(
              "absolute will-change-transform",
              PARTICLE_COLOR[theme],
              ANIM_CLASS[theme]
            )}
            style={{
              left: `${p.left}%`,
              top: 0,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity,
              // CSS custom props consumed by the keyframes for varied drift + rotation
              ["--p-drift" as string]: `${p.drift}px`,
              ["--p-rotate" as string]: `${p.rotate}deg`,
            }}
          >
            <Icon size={p.size} strokeWidth={1.5} />
          </span>
        ))}
      </div>
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
    slug === "property-maintenance"
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
