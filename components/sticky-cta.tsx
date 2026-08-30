"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

const SENTINEL_ID = "sticky-cta-sentinel";

/**
 * Slim persistent CTA that fades in once the user scrolls past the hero.
 * Anchors on a sentinel element with id="sticky-cta-sentinel" placed at the
 * end of the hero. If no sentinel exists on the page (e.g. routes without a
 * hero), the CTA shows immediately.
 *
 * On the winter and fall pages the CTA becomes "Get winter quote" and jumps
 * to the on-page lead flow instead of /quote (mobile-first: most winter
 * traffic converts through this bar).
 *
 * A page that renders its own bottom bar (e.g. the winter package selector)
 * sets `data-page-sticky-bar` on <body>, which hides this one via the
 * `.site-sticky-cta` rule in globals.css. Otherwise the two stack on top of
 * each other at the same z-index.
 */

type CtaConfig = {
  label: string;
  href: string;
  title: string;
  sub: string;
};

const DEFAULT_CTA: CtaConfig = {
  label: "Get a Free Quote",
  href: "/quote",
  title: "Ready for a free quote?",
  sub: "One business day · No obligation",
};

function ctaForPath(pathname: string | null): CtaConfig {
  if (!pathname) return DEFAULT_CTA;
  if (pathname.startsWith("/winter-packages")) {
    return {
      label: "Get winter quote",
      href: "#packages",
      title: "Winter 2026-27 routes are filling",
      sub: "Pick a package · Free quote, no payment today",
    };
  }
  if (pathname.startsWith("/services/fall-cleanup")) {
    return {
      label: "Get winter quote",
      href: "#quote-form",
      title: "Fall cleanup + winter, one step",
      sub: "The form pre-selects both",
    };
  }
  return DEFAULT_CTA;
}

export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const cta = ctaForPath(pathname);

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
  }, [pathname]);

  const inner = (
    <>
      {cta.label}
      <ArrowRight className="h-4 w-4" />
    </>
  );
  const linkClass =
    "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white";

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
            <p className="text-sm font-semibold leading-tight">{cta.title}</p>
            <p className="text-xs text-muted-foreground">{cta.sub}</p>
          </div>
          {cta.href.startsWith("#") ? (
            <a href={cta.href} tabIndex={visible ? 0 : -1} className={linkClass}>
              {inner}
            </a>
          ) : (
            <Link
              href={cta.href}
              tabIndex={visible ? 0 : -1}
              className={linkClass}
            >
              {inner}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
