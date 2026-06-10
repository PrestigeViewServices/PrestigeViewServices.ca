"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Max tilt in degrees. */
  maxTilt?: number;
  /** Apply a colored glow on hover (CSS gradient via radial). */
  glowColor?: string;
  className?: string;
};

/**
 * 3D tilt card that tracks the pointer position. Disabled on touch devices
 * (via `@media (hover: hover)`) and when prefers-reduced-motion is set —
 * users without precise pointers don't get the effect, no fallback noise.
 *
 * Uses spring-smoothed rotateX/rotateY transforms (GPU only) and a moving
 * radial glow that follows the pointer for depth.
 */
export function TiltCard({
  children,
  maxTilt = 8,
  glowColor = "rgba(59,130,246,0.35)",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 200,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 200,
    damping: 22,
  });

  const glowX = useTransform(x, (v) => `${v * 100}%`);
  const glowY = useTransform(y, (v) => `${v * 100}%`);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };

  const reset = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      className={`relative ${className ?? ""}`}
    >
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
          style={{
            background: `radial-gradient(220px circle at ${glowX.get()} ${glowY.get()}, ${glowColor}, transparent 70%)`,
          }}
        />
      )}
      <div
        className="relative"
        style={{ transform: "translateZ(0)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
