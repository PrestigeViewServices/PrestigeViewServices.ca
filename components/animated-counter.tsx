"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  to: number;
  /** Optional prefix (e.g. "$") */
  prefix?: string;
  /** Optional suffix (e.g. "+", "%", "k") */
  suffix?: string;
  /** Animation duration in seconds. */
  duration?: number;
  /** Format the displayed number; defaults to locale-aware integer. */
  format?: (n: number) => string;
  className?: string;
};

/**
 * Animates a number from 0 → `to` when it scrolls into view (once). Uses
 * Framer Motion's `animate` with a spring easing for a natural ramp.
 */
export function AnimatedCounter({
  to,
  prefix = "",
  suffix = "",
  duration = 1.6,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${prefix}${format(v)}${suffix}`);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion) {
      count.set(to);
      return;
    }
    const controls = animate(count, to, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out expo-ish
    });
    return () => controls.stop();
  }, [inView, to, duration, count, prefersReducedMotion]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
