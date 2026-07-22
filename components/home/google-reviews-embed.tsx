"use client";

import { useEffect, useRef } from "react";

/**
 * Generic Google Reviews embed mount.
 *
 * Works with any of the major vendors (Trustindex, Elfsight, EmbedSocial,
 * Tagembed, etc.). The vendor gives you two things when you set up your
 * widget:
 *   1. A script URL (e.g. https://cdn.trustindex.io/loader.js?<hash>)
 *   2. Optionally, a container <div> they target. Most widgets either
 *      auto-inject UI inline next to their script, or look up a known
 *      class/id.
 *
 * Set these in .env.local:
 *   NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC=<the vendor's script URL>
 *   NEXT_PUBLIC_GOOGLE_REVIEWS_CONTAINER_CLASS=<optional class name, e.g. trustindex-widget>
 *
 * When NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC is missing, the component
 * renders nothing (so the existing static review cards remain the source
 * of truth until you wire it up).
 */
export function GoogleReviewsEmbed({
  scriptSrc: scriptSrcProp,
  containerClass: containerClassProp,
}: {
  /** Override the env-var widget URL, useful when you want to embed multiple
   *  Trustindex widgets (e.g. one badge + one review feed) on the same page. */
  scriptSrc?: string;
  containerClass?: string;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptSrc =
    scriptSrcProp ?? process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC;
  const containerClass =
    containerClassProp ??
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_CONTAINER_CLASS;

  useEffect(() => {
    if (!scriptSrc) return;
    const container = containerRef.current;
    if (!container) return;

    // Vendors that inject inline next to their script use this id pattern.
    // We also set the vendor-specific class so widgets that look up by class
    // (Trustindex, Elfsight) find their target.
    const existing = document.querySelector(
      `script[data-google-reviews-mount="1"][src="${scriptSrc}"]`
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-reviews-mount", "1");
    container.appendChild(script);

    return () => {
      script.remove();
    };
  }, [scriptSrc]);

  if (!scriptSrc) return null;

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-google-reviews-embed
    />
  );
}

/** True when the env var is set, used to hide the static review cards. */
export function isGoogleReviewsEmbedEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_SCRIPT_SRC);
}
