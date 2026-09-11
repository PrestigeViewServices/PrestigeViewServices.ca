"use client";

import { usePathname } from "next/navigation";
import { Leaf, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Site-wide fall & winter ambience: a sparse drift of amber leaves and icy
 * snowflakes behind every public page. Pairs with the seasonal body wash in
 * app/globals.css (amber top-left, frost top-right) to sell the cold-season
 * account — fall cleanups now, snow pass for later — on every visit.
 *
 * Deliberately quieter than <ServiceAmbience /> (fewer, dimmer particles)
 * because it is everywhere. It sits BELOW content (-z-10), so cards and
 * photos read cleanly and the drift only shows in the dark gaps between
 * them. Pointer-events off, reduced-motion users get nothing moving, and
 * the keyframes are the CSS ones in globals.css — no per-frame JS.
 *
 * Skipped where it would fight another layer: the admin dashboard, and the
 * pages that already run their own <ServiceAmbience />.
 */
const SKIP_PREFIXES = ["/admin", "/services/", "/winter-packages"];

// Deterministic spread so SSR + hydrate match. Even indexes are snow, odd
// are leaves, so the two seasons interleave across the viewport.
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  kind: i % 2 === 0 ? ("snow" as const) : ("leaf" as const),
  left: (i * 5.6 + ((i * 19) % 9)) % 100,
  delay: ((i * 0.9) % 10).toFixed(2),
  duration: 14 + (i % 8),
  size: 9 + (i % 5),
  opacity: 0.1 + (i % 3) * 0.04,
  drift: ((i * 17) % 70) - 35,
  rotate: (i * 47) % 360,
}));

export function SeasonAmbience() {
  const pathname = usePathname() ?? "/";
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-reduce:hidden"
    >
      {PARTICLES.map((p, i) => {
        const Icon = p.kind === "snow" ? Snowflake : Leaf;
        return (
          <span
            key={i}
            className={cn(
              "absolute top-0 will-change-transform",
              p.kind === "snow"
                ? "text-sky-200 animate-ambience-fall"
                : "text-amber-400 animate-ambience-fall-tumble"
            )}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity,
              ["--p-drift" as string]: `${p.drift}px`,
              ["--p-rotate" as string]: `${p.rotate}deg`,
            }}
          >
            <Icon size={p.size} strokeWidth={1.5} />
          </span>
        );
      })}
    </div>
  );
}
