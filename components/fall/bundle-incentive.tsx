"use client";

import { useEffect, useState } from "react";
import { BadgePercent } from "lucide-react";
import type { WinterPromoContent } from "@/lib/content/winter-campaign";

/**
 * The fall + snow bundle incentive line, configured at /admin/site/content
 * (winter promo section). Renders nothing until an incentive is actually
 * configured, so the page never shows an empty promise. Client-fetched so
 * the statically generated service page stays static.
 */
export function BundleIncentiveBand() {
  const [incentive, setIncentive] = useState<string>("");

  useEffect(() => {
    let alive = true;
    fetch("/api/site/winter-promo")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { promo?: WinterPromoContent } | null) => {
        if (alive && data?.promo?.bundleIncentive) {
          setIncentive(data.promo.bundleIncentive);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!incentive) return null;

  return (
    <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
      <BadgePercent className="h-4 w-4 shrink-0" aria-hidden />
      {incentive}
    </p>
  );
}
