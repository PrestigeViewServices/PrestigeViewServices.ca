import Link from "next/link";
import { Snowflake, ArrowRight } from "lucide-react";
import { getSiteContent, splitAccents } from "@/lib/site-content";

/**
 * Seasonal band at the very top of the home page, above the hero.
 *
 * Copy is owner-editable at /admin/site/content (season banner section) with
 * the code default as fallback. Words wrapped in *asterisks* render in the
 * sky accent. The whole band can be switched off from the editor.
 */
export async function SeasonBanner() {
  const { seasonBanner } = await getSiteContent();
  if (!seasonBanner.enabled) return null;

  return (
    <div className="relative z-20 border-b border-sky-400/25 bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950">
      <div className="container-max flex flex-col items-center justify-center gap-2 py-2.5 text-center sm:flex-row sm:gap-4 sm:text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Snowflake className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
          <span>
            {splitAccents(seasonBanner.line1).map((seg, i) =>
              seg.accent ? (
                <span key={i} className="text-sky-300">
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </span>
        </p>
        {seasonBanner.line2 && (
          <p className="text-xs font-medium uppercase tracking-wider text-sky-100/80">
            {seasonBanner.line2}
          </p>
        )}
        <Link
          href={seasonBanner.ctaHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-950 transition-colors hover:bg-sky-300"
        >
          {seasonBanner.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
