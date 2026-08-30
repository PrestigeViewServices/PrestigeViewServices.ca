"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Snowflake, X } from "lucide-react";
import {
  DEFAULT_WINTER_PROMO,
  promoIsLive,
  promoPercentLabel,
  type WinterPromoContent,
} from "@/lib/content/winter-campaign";
import { PromoCountdown } from "@/components/winter/promo-countdown";

const DISMISS_KEY = "pvs-winter-promo-dismissed";

/**
 * Site-wide winter promo bar, pinned above the header on every public page.
 *
 * Config-driven: renders the code default immediately (so it is part of the
 * static HTML), then fetches /api/site/winter-promo for the owner's override
 * saved at /admin/site/content. Turning the promo off there, or the end date
 * passing, removes the bar everywhere with no deploy.
 *
 * Dismissal is remembered per promo end date, so a future campaign with a
 * new date re-appears for everyone.
 */
export function WinterAnnouncementBar() {
  const pathname = usePathname();
  const [promo, setPromo] = useState<WinterPromoContent>(DEFAULT_WINTER_PROMO);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === promo.endsAt) {
        setDismissed(true);
      }
    } catch {
      // Storage blocked — just show the bar.
    }
  }, [promo.endsAt]);

  useEffect(() => {
    let alive = true;
    fetch("/api/site/winter-promo")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { promo?: WinterPromoContent } | null) => {
        if (alive && data?.promo) setPromo(data.promo);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Internal surfaces run without marketing chrome.
  const internal =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/account") ||
    pathname?.startsWith("/rep");

  if (internal || dismissed || !promoIsLive(promo)) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, promo.endsAt);
    } catch {
      // Session-only dismissal is fine.
    }
  }

  return (
    <div className="relative z-40 border-b border-sky-400/25 bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950">
      <div className="container-max flex items-center justify-between gap-3 py-2">
        <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white sm:text-sm">
          <Snowflake className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
          <span className="truncate">
            <span className="text-sky-300">{promoPercentLabel(promo)}</span>{" "}
            <span className="hidden sm:inline">{promo.bannerLine.replace(/^[\d.]+%\s*/, "")}</span>
            <span className="sm:hidden">off winter contracts</span>
          </span>
          <PromoCountdown
            endsAt={promo.endsAt}
            className="hidden shrink-0 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-200 md:inline"
          />
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={promo.ctaHref}
            className="inline-flex items-center gap-1 rounded-full bg-sky-400 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-950 transition-colors hover:bg-sky-300 sm:text-xs"
          >
            {promo.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss winter promo banner"
            className="grid h-7 w-7 place-items-center rounded-full text-sky-100/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
