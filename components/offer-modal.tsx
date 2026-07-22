"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pvs-offer-modal-dismissed-v1";

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

/**
 * Session-gated promo modal. Shows ONCE per browser session, never re-nags.
 * Reads from /lib/content/offers, flip `showInModal: false` to disable.
 */
export function OfferModal() {
  const offer = modalOffer();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!offer) return;
    // Session storage: cleared when browser tab closes. Perfect "once per session".
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
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
