/**
 * Client-side conversion events for the ad platforms already wired into the
 * root layout (Meta Pixel + GA4). Both providers self-disable when their env
 * vars are unset, so these helpers no-op quietly when the globals are
 * missing. Never let analytics break a form.
 */

type FbqFn = (...args: unknown[]) => void;
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export type LeadConversion = {
  /** Service slug or package the lead asked about, e.g. "snow-removal". */
  service?: string;
  /** Where the CTA lived, e.g. "winter-packages" or "fall-cleanup". */
  sourcePage?: string;
  /** Winter tier or pack the visitor had selected, if any. */
  packageInterest?: string;
};

/** Fire a lead conversion on Meta Pixel and GA4. Safe to call anywhere. */
export function trackLeadConversion(data: LeadConversion = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", "Lead", {
      content_name: data.service ?? "quote-request",
      content_category: data.sourcePage ?? "site",
    });
  } catch {
    // Pixel blocked or broken — never surface to the visitor.
  }
  try {
    window.gtag?.("event", "generate_lead", {
      service: data.service ?? "quote-request",
      source_page: data.sourcePage ?? "site",
      package_interest: data.packageInterest ?? undefined,
    });
  } catch {
    // Same: analytics must never interfere with the form.
  }
}

/** Lighter-weight event for CTA clicks worth counting (not conversions). */
export function trackCtaClick(name: string, sourcePage?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", "cta_click", {
      cta: name,
      source_page: sourcePage ?? undefined,
    });
  } catch {
    // no-op
  }
}
