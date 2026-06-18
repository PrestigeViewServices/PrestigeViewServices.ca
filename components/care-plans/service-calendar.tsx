"use client";

import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import type { CalendarStop } from "@/lib/content/care-plans";

/**
 * Horizontal, scroll-animated service timeline. Visualizes how a plan's
 * services spread across the year. Items fade/slide in on scroll via
 * framer-motion's `whileInView` (which respects reduced-motion through the
 * site-wide CSS guard + small travel distance).
 *
 * On narrow screens the track scrolls horizontally; on desktop it lays out
 * evenly across the width.
 */
export function ServiceCalendar({
  stops,
  className,
}: {
  stops: CalendarStop[];
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* connecting rail */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-px bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 sm:block"
      />

      <ol className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:gap-5 sm:overflow-visible"
        style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}
      >
        {stops.map((stop, i) => (
          <motion.li
            key={`${stop.month}-${i}`}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{
              duration: 0.4,
              delay: i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative min-w-[220px] shrink-0 sm:min-w-0"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="relative z-10 grid h-[52px] w-[52px] place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-glow">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                {stop.month}
              </span>
            </div>
            <ul className="surface-card space-y-1.5 p-4 text-sm">
              {stop.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
