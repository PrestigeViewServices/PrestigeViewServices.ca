"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlanCard, type PlanCardProps } from "./plan-card";
import {
  CARE_PLANS,
  ONE_OFF_PACKAGES,
  formatDollars,
  quoteHref,
} from "@/lib/content/care-plans";

type Mode = "plan" | "once";

// Care Plans → card props. The Build-Your-Own card points at the calculator
// section instead of straight to /quote.
const PLAN_CARDS: PlanCardProps[] = CARE_PLANS.map((p) => ({
  name: p.name,
  price: formatDollars(p.monthly),
  period: "/mo",
  isFrom: p.isFrom,
  // Build-Your-Own already reads "from $X"; the rest get a "Starts at" label.
  startsAt: !p.isFrom,
  tagline: p.tagline,
  includes: p.includes,
  bestFor: p.bestFor,
  mostPopular: p.mostPopular,
  ctaHref:
    p.slug === "build-your-own"
      ? "#build-your-own"
      : quoteHref({ plan: p.slug }),
  ctaLabel: p.slug === "build-your-own" ? "Build yours" : "Get a Free Quote",
}));

// One-off Packages → card props.
const PACKAGE_CARDS: PlanCardProps[] = ONE_OFF_PACKAGES.map((p) => ({
  name: p.name,
  price: formatDollars(p.price),
  period: "once",
  startsAt: true,
  tagline: p.tagline,
  includes: p.includes,
  bestFor: p.bestFor,
  mostPopular: p.mostPopular,
  ctaHref: quoteHref({ package: p.slug }),
}));

const OPTIONS: { value: Mode; label: string; sub: string }[] = [
  { value: "plan", label: "Yearly Care Plan", sub: "Billed monthly" },
  { value: "once", label: "Pay Once", sub: "One-off packages" },
];

/**
 * Pay-Once ⇄ Yearly-Care-Plan switch at the top of the pricing section.
 * Defaults to the Care Plan (recurring) view. Flipping crossfades the card
 * grid so prices animate in.
 *
 * The toggle is a real segmented button group (keyboard + aria-pressed); the
 * sliding pill is a `layoutId` flourish that degrades gracefully.
 */
export function PricingToggle() {
  const [mode, setMode] = useState<Mode>("plan");
  const cards = mode === "plan" ? PLAN_CARDS : PACKAGE_CARDS;

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Choose pricing type"
          className="relative inline-flex rounded-full border border-surface-border bg-surface/60 p-1"
        >
          {OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                aria-pressed={active}
                className={`relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pricing-toggle-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-primary shadow-glow"
                  />
                )}
                <span className="block leading-tight">{opt.label}</span>
                <span
                  className={`block text-[10px] font-medium leading-tight ${
                    active ? "text-white/80" : "text-muted-foreground/70"
                  }`}
                >
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`mt-10 grid gap-5 sm:gap-6 ${
            mode === "plan"
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {cards.map((c) => (
            <PlanCard key={c.name} {...c} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
