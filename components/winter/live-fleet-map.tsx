import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aurora Suite "Fleet View": live GPS positions of our snow equipment,
 * fed by the same dispatch platform that runs routes and the lead form.
 *
 * Notes:
 * - The URL is HMAC-signed by Aurora. Do NOT append or change query params
 *   or the embed will be rejected.
 * - https://aurorasuite.ca is already allowed in the CSP frame-src
 *   (next.config.js), so no header change is needed for this embed.
 * - Aurora's stock snippet hard-codes 1500x800, which overflows phones.
 *   We size it to the container instead and cap the height.
 */
export const FLEET_MAP_SRC =
  "https://aurorasuite.ca/embed/map/114?signature=45fa651b8afa390486aeedbe30e3418a3815de036b48672f972fd0a08c5e01de";

export function LiveFleetMap({
  className,
  tall = false,
}: {
  className?: string;
  /** Full-page placement: taller frame. */
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-sky-400/25 bg-[#0A1220] shadow-2xl shadow-sky-950/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-sky-400/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          Live fleet map
        </span>
        <span className="hidden items-center gap-1.5 text-sky-200/70 sm:inline-flex">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          GPS · Pembroke & Petawawa
        </span>
      </div>
      <iframe
        src={FLEET_MAP_SRC}
        title="Prestige View Services live snow fleet map"
        loading="lazy"
        allowFullScreen
        className={cn(
          "block w-full border-0",
          tall
            ? "h-[70vh] min-h-[460px] max-h-[820px]"
            : "h-[60vh] min-h-[380px] max-h-[600px]"
        )}
      />
    </div>
  );
}

/** Compact section for snow pages that previews the map and links to /live-map. */
export function LiveFleetMapSection({
  id = "live-map",
  className,
}: {
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("container-max scroll-mt-24 py-14", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Track the plows</p>
          <h2 className="heading-section mt-2 text-balance">
            Watch our tractors and trucks live, every snow event
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            No guessing, no calling to ask where the plow is. Every machine on
            the route is GPS-tracked, so you can see where the crew is working
            right now.
          </p>
        </div>
        <Link
          href="/live-map"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:underline"
        >
          Open full-screen map
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <LiveFleetMap className="mt-8" />
    </section>
  );
}
