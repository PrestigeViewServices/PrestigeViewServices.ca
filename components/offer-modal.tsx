"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { modalOffer } from "@/lib/content/offers";
import type { OfferContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pvs-offer-modal-dismissed-v1";

/** Pages that already are a quote form; the modal would only get in the way. */
const LEAD_PAGES = [
  "/quote",
  "/request-service",
  "/contact",
  "/winter-packages",
  "/commercial-snow-removal",
  "/refer",
  "/r/",
];

const accentText = {
  lawn: "text-emerald-400",
  clearview: "text-blue-400",
  snowland: "text-sky-400",
} as const;

const ctaVariant = {
  lawn: "lawn",
  clearview: "primary",
  snowland: "snowland",
} as const;

type ModalOffer = Pick<
  OfferContent,
  "headline" | "body" | "ctaLabel" | "ctaHref" | "accent"
> & { eyebrow?: string };

/** Code-offer fallback, matching the API's shape. */
function fallbackOffer(): ModalOffer | null {
  const o = modalOffer();
  if (!o) return null;
  return {
    eyebrow: o.eyebrow,
    headline: o.headline,
    body: o.body,
    ctaLabel: o.ctaLabel,
    ctaHref: o.ctaHref,
    accent: o.accent,
  };
}

/**
 * Session-gated promo modal. Shows ONCE per browser session, never re-nags.
 *
 * The offer comes from /api/site/modal-offer so the owner's edits at
 * /admin/site/content apply everywhere without making static pages dynamic.
 * The code offer from /lib/content/offers is the fallback if that fetch
 * fails, so the modal never breaks with the network.
 */
export function OfferModal() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<ModalOffer | null>(null);
  const [open, setOpen] = useState(false);

  // The promo popup is for visitors. Never interrupt the owner in the
  // dashboard or a member in their portal, and never cover a page whose
  // whole job is already to capture the lead.
  const suppressed =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    LEAD_PAGES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (suppressed) return;
    // Skip the fetch entirely when this session already dismissed the modal.
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Private mode — carry on, worst case the modal shows again.
    }
    let cancelled = false;
    fetch("/api/site/modal-offer")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { offer: ModalOffer | null } | null) => {
        if (cancelled) return;
        if (data && "offer" in data) setOffer(data.offer);
        else setOffer(fallbackOffer());
      })
      .catch(() => {
        if (!cancelled) setOffer(fallbackOffer());
      });
    return () => {
      cancelled = true;
    };
  }, [suppressed]);

  // Wait for real engagement: half the page scrolled, or 25 seconds on it.
  // Popping at 1.2s covered the hero and the quote form on phones, and
  // Google demotes mobile pages that open with an intrusive interstitial.
  useEffect(() => {
    if (!offer) return;
    let fired = false;
    const show = () => {
      if (fired) return;
      fired = true;
      setOpen(true);
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.5) show();
    };
    const timer = window.setTimeout(show, 25000);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [offer]);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sessionStorage may be unavailable (private mode); silently ignore.
    }
  }

  if (!offer) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          {offer.eyebrow && (
            <p className={cn("eyebrow", accentText[offer.accent])}>
              <Zap className="h-3.5 w-3.5" fill="currentColor" />
              {offer.eyebrow}
            </p>
          )}
          <DialogTitle className="text-2xl mt-2 leading-tight text-balance">
            {offer.headline}
          </DialogTitle>
          <DialogDescription className="mt-2 text-base leading-relaxed">
            {offer.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={dismiss} className="sm:flex-1">
            Not now
          </Button>
          <Button
            asChild
            variant={ctaVariant[offer.accent]}
            className="sm:flex-1"
            onClick={dismiss}
          >
            <Link href={offer.ctaHref}>{offer.ctaLabel}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
