"use client";

import { useEffect, useState } from "react";
import { Snowflake, Sprout, Droplet, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceAmbienceTheme } from "@/components/service-ambience";

/**
 * The drifting-particle half of <ServiceAmbience />, split out so it can
 * wait for the browser to go idle before mounting. Sixteen infinitely
 * animating nodes are pure decoration; keeping them out of the initial
 * render window is worth real mobile LCP on the long landing pages.
 */

const ICON: Record<ServiceAmbienceTheme, typeof Snowflake> = {
  snow: Snowflake,
  lawn: Sprout,
  water: Droplet,
  autumn: Leaf,
};

const PARTICLE_COLOR: Record<ServiceAmbienceTheme, string> = {
  snow: "text-sky-200",
  lawn: "text-emerald-300",
  water: "text-blue-300",
  autumn: "text-amber-300",
};

const ANIM_CLASS: Record<ServiceAmbienceTheme, string> = {
  snow: "animate-ambience-fall",
  lawn: "animate-ambience-rise",
  water: "animate-ambience-fall-fast",
  autumn: "animate-ambience-fall-tumble",
};

/** Deterministic pseudo-random spread, same math as before the split. */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: ((i * 6.25) + ((i * 17) % 8)) % 100,
  delay: ((i * 0.7) % 8).toFixed(2),
  duration: 9 + (i % 7),
  size: 8 + (i % 5),
  opacity: 0.16 + (i % 4) * 0.05,
  drift: ((i * 13) % 60) - 30,
  rotate: ((i * 41) % 360),
}));

export function AmbienceParticles({ theme }: { theme: ServiceAmbienceTheme }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 2500);
    return () => clearTimeout(id);
  }, []);

  if (!ready) return null;

  const Icon = ICON[theme];
  return (
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
            ["--p-drift" as string]: `${p.drift}px`,
            ["--p-rotate" as string]: `${p.rotate}deg`,
          }}
        >
          <Icon size={p.size} strokeWidth={1.5} />
        </span>
      ))}
    </div>
  );
}
