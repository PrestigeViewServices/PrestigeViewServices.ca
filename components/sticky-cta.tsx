"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Snowflake } from "lucide-react";
import { SNOW_SEASON } from "@/lib/content/snow-season";

const SENTINEL_ID = "sticky-cta-sentinel";

/**
 * Slim persistent CTA that fades in once the user scrolls past the hero.
 * Anchors on a sentinel element with id="sticky-cta-sentinel" placed at the
 * end of the hero. If no sentinel exists on the page (e.g. routes without a
 * hero), the CTA shows immediately.
 *
 * A page that renders its own bottom bar (e.g. the winter package selector)
 * sets `data-page-sticky-bar` on <body>, which hides this one via the
 * `.site-sticky-cta` rule in globals.css. Otherwise the two stack on top of
 * each other at the same z-index.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() ?? "/";
  // The dashboard has no hero sentinel, so this bar showed instantly and
  // sat over the bottom of every admin page on a phone. Staff never need
  // a "get a quote" button.
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
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
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`site-sticky-cta fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-surface-border bg-background/95 backdrop-blur-md">
        <div className="container-max flex items-center justify-between gap-3 py-3">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">
              {SNOW_SEASON.name} starts {SNOW_SEASON.launchDisplay}
            </p>
            <p className="text-xs text-muted-foreground">
              Snow routes are capped · Free quotes in one business day
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link
              href="/winter-packages#packages"
              tabIndex={visible ? 0 : -1}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md bg-gradient-snowland px-4 py-3 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Snowflake className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap sm:hidden">Snow Pass</span>
              <span className="hidden whitespace-nowrap sm:inline">Reserve Snow Pass</span>
            </Link>
            <Link
              href="/quote"
              tabIndex={visible ? 0 : -1}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border border-surface-border bg-surface px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Free Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
