"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Per-element stagger delay in ms. */
  delay?: number;
  className?: string;
};

/**
 * Scroll-triggered fade + ~16px upward translate. Fires ONCE per element via
 * IntersectionObserver. Honors prefers-reduced-motion by rendering visible
 * immediately. No animation library — just a CSS transition.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: "350ms",
        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
        transitionDelay: visible && delay > 0 ? `${delay}ms` : undefined,
      }}
      className={`motion-reduce:transition-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
