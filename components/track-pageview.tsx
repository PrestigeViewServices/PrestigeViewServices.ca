"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party page-view beacon. Fires once per client-side navigation to
 * /api/track, which stores the view in our own database (see the PageView
 * model). Admin pages are skipped here AND revalidated server-side.
 */
export function TrackPageview() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Never let analytics interfere with the page.
    }
  }, [pathname]);

  return null;
}
