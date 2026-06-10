"use client";

import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  /** Initial divider position as a percentage (0-100). Defaults to 50. */
  initialPosition?: number;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

/**
 * Draggable before/after image comparison.
 *
 * - Pointer-based drag (mouse + touch via Pointer Events).
 * - Keyboard accessible: focus the handle and use ←/→ to nudge, Home/End to snap.
 * - Both images are rendered with next/image; the "before" layer is clipped
 *   via clip-path so no extra paint cost from cropping.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  initialPosition = 50,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(initialPosition);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientX]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setFromClientX(e.clientX);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 4));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 4));
    } else if (e.key === "Home") {
      e.preventDefault();
      setPosition(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      className={`relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-surface-border bg-surface/60 select-none touch-pan-y ${
        className ?? ""
      }`}
    >
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover pointer-events-none"
      />

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>

      <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm pointer-events-none">
        {afterLabel}
      </span>

      <div
        aria-hidden
        className="absolute inset-y-0 w-0.5 bg-white pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      />

      <button
        type="button"
        role="slider"
        aria-label="Before and after comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-primary text-white shadow-glow cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-white"
        style={{ left: `${position}%` }}
      >
        <ChevronsLeftRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
