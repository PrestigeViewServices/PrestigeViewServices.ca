"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Snowflake } from "lucide-react";
import type { StormNightProps } from "@/components/winter/storm-night";

const StormNight = lazy(() =>
  import("@/components/winter/storm-night").then((m) => ({
    default: m.StormNight,
  }))
);

/**
 * Defers the Storm Night bundle until the visitor scrolls near it, so the
 * walkthrough costs nothing on first paint (Lighthouse mobile stays lean).
 * The placeholder reserves roughly the component's height to avoid layout
 * shift when it swaps in.
 */
export function StormNightLazy(props: StormNightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          obs.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const placeholder = (
    <div
      className={`grid place-items-center overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-[#0B1526] via-[#0A1220] to-[#0C1B2E] ${
        props.compact ? "min-h-[420px]" : "min-h-[560px]"
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-sky-100/50">
        <Snowflake className="h-6 w-6 animate-pulse text-sky-300" aria-hidden />
        <p className="text-sm">Loading the storm night demo…</p>
      </div>
    </div>
  );

  return (
    <div ref={ref}>
      {near ? (
        <Suspense fallback={placeholder}>
          <StormNight {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
