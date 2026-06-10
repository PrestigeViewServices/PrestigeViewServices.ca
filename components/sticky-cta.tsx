"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SENTINEL_ID = "sticky-cta-sentinel";

/**
 * Slim persistent CTA that fades in once the user scrolls past the hero.
 * Anchors on a sentinel element with id="sticky-cta-sentinel" placed at the
 * end of the hero. If no sentinel exists on the page (e.g. routes without a
 * hero), the CTA shows immediately.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(SENTINEL_ID);
    if (!sentinel) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setVisible(scrolledPast);
      },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-surface-border bg-background/95 backdrop-blur-md">
        <div className="container-max flex items-center justify-between gap-3 py-3">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">
              Ready for a free quote?
            </p>
            <p className="text-xs text-muted-foreground">
              One business day · No obligation
            </p>
          </div>
          <Link
            href="/quote"
            tabIndex={visible ? 0 : -1}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Get a Free Quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
