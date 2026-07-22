"use client";

import { type ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full loop. Slower = more legible. */
  duration?: number;
  /** Pause on hover (desktop pointer). */
  pauseOnHover?: boolean;
  /** Reverse direction. */
  reverse?: boolean;
  className?: string;
};

/**
 * Edge-faded auto-scrolling marquee. Pure CSS animation on a duplicated track,
 * so no JS frame budget. Respects prefers-reduced-motion via the
 * `motion-reduce:animate-none` Tailwind variant, content stays visible,
 * just frozen.
 */
export function Marquee({
  children,
  duration = 40,
  pauseOnHover = true,
  reverse = false,
  className,
}: MarqueeProps) {
  return (
    <div
      className={`group relative overflow-hidden ${className ?? ""}`}
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div
        className={`flex w-max gap-12 will-change-transform motion-reduce:animate-none ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="flex shrink-0 gap-12">{children}</div>
        <div aria-hidden className="flex shrink-0 gap-12">
          {children}
        </div>
      </div>
    </div>
  );
}
