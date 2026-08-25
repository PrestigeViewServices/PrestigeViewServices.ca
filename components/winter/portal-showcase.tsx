import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Camera,
  Crown,
  History,
  MapPin,
  Radar,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PORTAL_FEATURES,
  getDrivewayTier,
  portalTierLabel,
  type PortalFeature,
} from "@/lib/content/winter-packages";

/**
 * Marketing showcase for the Aurora customer portal that ships with every
 * seasonal pass. The feature list, wording, and tier gating all come from
 * PORTAL_FEATURES in lib/content/winter-packages.ts — edit claims there.
 *
 * The phone is a hand-built CSS mockup rather than a screenshot so it always
 * matches the site's palette and never leaks a real customer's data.
 */

const GOLD = getDrivewayTier("GOLD").accent;
const PLATINUM = getDrivewayTier("PLATINUM").accent;

/** Icon per feature key, with a safe fallback for future additions. */
const FEATURE_ICONS: Record<string, LucideIcon> = {
  "live-map": Radar,
  "cleared-alerts": BellRing,
  "photo-proof": Camera,
  "visit-history": History,
  "one-tap-requests": Send,
  billing: Receipt,
  "priority-line": Crown,
};

export function PortalShowcase() {
  return (
    <section id="portal" className="scroll-mt-24 py-14">
      <div className="container-max">
        <div className="overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-[#0B1526] via-[#0A1220] to-[#0C1B2E] p-7 sm:p-10 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            {/* ── Copy + feature list ── */}
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                New this season · Customer portal
              </p>

              <h2 className="heading-section mt-5 text-balance">
                Your driveway, live on your phone
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Every seasonal pass now includes a private customer portal,
                powered by the same dispatch system that routes our tractors.{" "}
                <strong className="text-foreground">
                  Gold and Platinum unlock the full experience
                </strong>
                : watch the storm being fought in real time, get told the moment
                you&apos;re clear, and see the photo that proves it — from the
                kitchen, the office, or a beach in February.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {PORTAL_FEATURES.map((f) => (
                  <FeatureItem key={f.key} feature={f} />
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <a href="#packages">
                    Get the full experience with Gold
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
                <Link
                  href="#compare"
                  className="text-sm font-medium text-sky-300 hover:underline"
                >
                  Compare all four passes
                </Link>
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300"
                  aria-hidden
                />
                Included with your pass at no extra cost. We set your portal up
                for you when we confirm your route spot.
              </p>
            </div>

            {/* ── Phone mockup ── */}
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ feature }: { feature: PortalFeature }) {
  const Icon = FEATURE_ICONS[feature.key] ?? Sparkles;
  const platinumOnly = feature.tiers.length === 1;
  const premium = feature.tiers.length <= 2;
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
        style={{
          color: platinumOnly ? PLATINUM : premium ? GOLD : undefined,
          borderColor: platinumOnly
            ? `${PLATINUM}40`
            : premium
              ? `${GOLD}40`
              : "rgba(255,255,255,0.12)",
          backgroundColor: platinumOnly
            ? `${PLATINUM}14`
            : premium
              ? `${GOLD}14`
              : "rgba(255,255,255,0.04)",
        }}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
          {feature.title}
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: platinumOnly ? PLATINUM : premium ? GOLD : undefined,
              borderColor: platinumOnly
                ? `${PLATINUM}40`
                : premium
                  ? `${GOLD}40`
                  : "rgba(255,255,255,0.15)",
            }}
          >
            {portalTierLabel(feature)}
          </span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {feature.body}
        </p>
      </div>
    </li>
  );
}

/**
 * Stylized portal dashboard in a phone frame. Decorative only, so the whole
 * thing is hidden from assistive tech; the real content is the feature list.
 */
function PhoneMockup() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[300px]">
      {/* Glow behind the phone. */}
      <div
        className="absolute inset-6 -z-10 rounded-full opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${PLATINUM}, transparent)`,
        }}
      />

      <div className="overflow-hidden rounded-[2.4rem] border border-white/15 bg-[#070E1A] p-2.5 shadow-2xl">
        <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#0A1220]">
          {/* Status header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-sky-300">
                Customer portal
              </p>
              <p className="text-[11px] font-bold text-white">
                Prestige View Services
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-sky-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-300" />
              </span>
              Storm active
            </span>
          </div>

          <div className="space-y-2.5 p-3">
            {/* Live map card */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
              <div className="relative h-24 bg-[#0D1B2E]">
                <svg
                  viewBox="0 0 260 96"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  {/* street grid */}
                  <g stroke="rgba(148,196,255,0.14)" strokeWidth="1.5">
                    <path d="M0 24 H260" />
                    <path d="M0 58 H260" />
                    <path d="M0 86 H260" />
                    <path d="M46 0 V96" />
                    <path d="M118 0 V96" />
                    <path d="M196 0 V96" />
                  </g>
                  {/* route travelled */}
                  <path
                    d="M8 86 H118 V58 H196"
                    fill="none"
                    stroke={PLATINUM}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="1 7"
                  />
                  {/* remaining route to the house */}
                  <path
                    d="M196 58 V24 H236"
                    fill="none"
                    stroke="rgba(148,196,255,0.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 5"
                  />
                </svg>
                {/* tractor */}
                <span
                  className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: "75%", top: "60%" }}
                >
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: PLATINUM }}
                  />
                  <span
                    className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#0A1220]"
                    style={{ backgroundColor: PLATINUM }}
                  />
                </span>
                {/* home pin */}
                <MapPin
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-full text-amber-300"
                  style={{ left: "91%", top: "28%" }}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10px] font-semibold text-white">
                  Unit 3 · 2 stops away
                </p>
                <p className="text-[9px] text-sky-200/70">Live</p>
              </div>
            </div>

            {/* Cleared alert */}
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3">
              <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white">
                  Driveway cleared · 6:42 AM
                </p>
                <p className="text-[9px] leading-snug text-emerald-100/80">
                  Night pass complete. Photo added to your visit history.
                </p>
              </div>
            </div>

            {/* Photo proof */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div
                className="grid h-11 w-14 shrink-0 place-items-center rounded-lg border"
                style={{
                  borderColor: `${GOLD}35`,
                  background: `linear-gradient(135deg, ${GOLD}22, rgba(255,255,255,0.04))`,
                }}
              >
                <Camera className="h-4 w-4" style={{ color: GOLD }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white">
                  Photo proof saved
                </p>
                <p className="text-[9px] text-muted-foreground">
                  Visit #14 · Tue 6:42 AM · Full season on record
                </p>
              </div>
            </div>

            {/* Billing row */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-sky-300" />
                <p className="text-[10px] font-semibold text-white">
                  Seasonal invoice
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">
                Paid
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
