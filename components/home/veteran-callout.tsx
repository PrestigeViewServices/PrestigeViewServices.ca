import Link from "next/link";
import { Medal, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Military & veteran discount, a core PVS differentiator in the Garrison
 * Petawawa market, so it gets its own full-width section rather than a
 * footnote. Kept server-rendered and light: one band, one CTA.
 */
export function VeteranCallout() {
  return (
    <section
      aria-labelledby="veteran-heading"
      className="container-max py-14 sm:py-16"
    >
      <div className="relative overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-950 p-8 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl"
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
              <Medal className="h-4 w-4" aria-hidden />
              Military &amp; Veteran Discount
            </p>
            <h2
              id="veteran-heading"
              className="heading-section text-balance text-white"
            >
              You Serve the Country. We&apos;ll Take Care of the Yard.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-sky-100/85">
              Prestige View Services is veteran operated and proud to serve the
              Garrison Petawawa community. Serving members, veterans, and
              military families get 10% off every service: windows, lawns,
              landscaping, and snow. Posted in or heading out on deployment?
              We&apos;ll keep the home front looking sharp while you&apos;re
              away. (Not combinable with other offers above 10%, we always
              apply whichever discount saves you more.)
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sky-100/80">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" aria-hidden />
                Serving members &amp; veterans
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" aria-hidden />
                Military families &amp; first responders
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" aria-hidden />
                Deployment-friendly scheduling
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link
              href="/quote"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-400 px-8 text-sm font-bold text-blue-950 transition-colors hover:bg-sky-300"
            >
              Claim Your Discount
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="text-xs text-sky-200/70">
              Just mention your service when you request a quote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
