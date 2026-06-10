"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/**
 * Slim scroll progress bar pinned to the top of the viewport. Uses a spring
 * to smooth the scrollYProgress value so the bar feels physical rather than
 * jittery. Honors prefers-reduced-motion by skipping the spring and rendering
 * a static (invisible) bar.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] bg-gradient-to-r from-emerald-400 via-blue-500 to-sky-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] pointer-events-none"
    />
  );
}
