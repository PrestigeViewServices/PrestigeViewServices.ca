"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Sparkles, Snowflake, Shovel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DRIVEWAY_TIER_DEFS,
  SHOVELING_TIER_DEFS,
  type DrivewayTier,
  type ShovelingTier,
} from "@/lib/content/winter-packages";

/**
 * Customer-facing benefits → tier eligibility map. The labels are written for
 * end-users (concrete value they care about); the tiers[] array lists which
 * tier slugs include that benefit. Keep in sync with the `features` arrays in
 * lib/content/winter-packages.ts, this file is the marketing-facing mirror.
 */
type DrivewayBenefit = {
  id: string;
  label: string;
  hint?: string;
  tiers: DrivewayTier[];
};

const DRIVEWAY_BENEFITS: DrivewayBenefit[] = [
  {
    id: "auto-dispatch",
    label: "Auto-dispatch, no calling us",
    hint: "We trigger on snowfall, you don't have to text",
    tiers: ["SILVER", "GOLD", "PLATINUM"],
  },
  {
    id: "live-tracking",
    label: "Live tracking + storm alerts",
    hint: "Know when the truck's on the way",
    tiers: ["SILVER", "GOLD", "PLATINUM"],
  },
  {
    id: "two-passes",
    label: "Two passes per storm (day + night)",
    hint: "Cleared for the morning AND the evening",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    id: "city-ridge",
    label: "City plow ridge removal",
    hint: "We clear the windrow the city dumps in your apron",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    id: "priority",
    label: "Priority routing, done before work",
    hint: "Routed first so you can leave on time",
    tiers: ["GOLD", "PLATINUM"],
  },
  {
    id: "earliest-trigger",
    label: "Earliest trigger (3 cm)",
    hint: "We move as soon as 3 cm hits the ground",
    tiers: ["PLATINUM"],
  },
  {
    id: "fast-finish",
    label: "Finished within 8 hours",
    hint: "Hardest service-window guarantee on the tier list",
    tiers: ["PLATINUM"],
  },
  {
    id: "preventative",
    label: "Preventative storm management",
    hint: "We pre-treat and plan ahead of the storm",
    tiers: ["PLATINUM"],
  },
];

type ShovelBenefit = {
  id: string;
  label: string;
  hint?: string;
  tiers: ShovelingTier[];
};

const SHOVEL_BENEFITS: ShovelBenefit[] = [
  {
    id: "walkway-covered",
    label: "Walkway, porch & back deck shoveled",
    tiers: ["PASS_10", "PASS_15", "PASS_25", "PASS_50"],
  },
  {
    id: "two-walkway-passes",
    label: "Two walkway passes per storm",
    hint: "Bigger packs are sized for 2-pass storms",
    tiers: ["PASS_25", "PASS_50"],
  },
  {
    id: "full-season",
    label: "Full-season worry-free coverage",
    hint: "Enough visits to handle a busy Valley winter",
    tiers: ["PASS_50"],
  },
];

const DRIVEWAY_ORDER: DrivewayTier[] = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
];

const SHOVEL_ORDER: ShovelingTier[] = [
  "NONE",
  "PASS_10",
  "PASS_15",
  "PASS_25",
  "PASS_50",
];

/** Cheapest tier that covers EVERY selected benefit. */
function pickDriveway(selected: string[]): DrivewayTier {
  for (const tier of DRIVEWAY_ORDER) {
    const allCovered = selected.every((id) => {
      const b = DRIVEWAY_BENEFITS.find((x) => x.id === id);
      return b ? b.tiers.includes(tier) : true;
    });
    if (allCovered) return tier;
  }
  // Selected benefits include something no tier offers, fall back to top.
  return "PLATINUM";
}

function pickShovel(selected: string[]): ShovelingTier {
  if (selected.length === 0) return "NONE";
  for (const tier of SHOVEL_ORDER) {
    if (tier === "NONE") continue;
    const allCovered = selected.every((id) => {
      const b = SHOVEL_BENEFITS.find((x) => x.id === id);
      return b ? b.tiers.includes(tier) : true;
    });
    if (allCovered) return tier;
  }
  return "PASS_50";
}

const TIER_ACCENT: Record<DrivewayTier, string> = {
  BRONZE:
    "from-amber-700/30 to-amber-900/10 border-amber-500/40 text-amber-200",
  SILVER:
    "from-slate-300/25 to-slate-500/10 border-slate-300/40 text-slate-100",
  GOLD: "from-yellow-400/25 to-yellow-700/10 border-yellow-400/50 text-yellow-200",
  PLATINUM:
    "from-sky-300/25 to-blue-600/10 border-sky-300/50 text-sky-100",
};

export function BenefitMatcher() {
  const [driveSel, setDriveSel] = useState<string[]>([]);
  const [shovelSel, setShovelSel] = useState<string[]>([]);

  const drivewayTier = useMemo(() => pickDriveway(driveSel), [driveSel]);
  const shovelTier = useMemo(() => pickShovel(shovelSel), [shovelSel]);

  const drivewayDef = DRIVEWAY_TIER_DEFS.find((t) => t.slug === drivewayTier)!;
  const shovelDef = SHOVELING_TIER_DEFS.find((t) => t.slug === shovelTier);

  function toggleDrive(id: string) {
    setDriveSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function toggleShovel(id: string) {
    setShovelSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function reserveThis() {
    // Tell the EstimatorForm below to pre-fill these picks, then scroll.
    window.dispatchEvent(
      new CustomEvent("pvs:winter-prefill", {
        detail: {
          drivewayTier,
          shovelingTier: shovelTier,
        },
      })
    );
    const el = document.getElementById("reserve");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const totalSelected = driveSel.length + shovelSel.length;
  const matchedBenefitCount =
    driveSel.filter((id) =>
      DRIVEWAY_BENEFITS.find((b) => b.id === id)?.tiers.includes(drivewayTier)
    ).length +
    shovelSel.filter((id) =>
      SHOVEL_BENEFITS.find((b) => b.id === id)?.tiers.includes(shovelTier)
    ).length;

  return (
    <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-6 sm:p-8 backdrop-blur-sm">
      <header className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow text-primary">Find Your Fit</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            What do you need this winter?
          </h2>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Pick the things that matter, we&apos;ll match the smallest package
            that covers everything you tick. Change your mind anytime.
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <BenefitColumn
          icon={<Snowflake className="h-4 w-4" />}
          title="Driveway plowing"
          benefits={DRIVEWAY_BENEFITS}
          selected={driveSel}
          onToggle={toggleDrive}
        />
        <BenefitColumn
          icon={<Shovel className="h-4 w-4" />}
          title="Walkway shovelling"
          benefits={SHOVEL_BENEFITS}
          selected={shovelSel}
          onToggle={toggleShovel}
        />
      </div>

      <div
        className={cn(
          "mt-8 rounded-2xl border bg-gradient-to-br p-5 sm:p-6",
          TIER_ACCENT[drivewayTier]
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="eyebrow opacity-90">
              {totalSelected === 0 ? "Default fit" : "Your match"}
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {drivewayDef.name}
              {shovelDef && (
                <span className="text-foreground/70"> + {shovelDef.name}</span>
              )}
            </p>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed max-w-xl">
              {drivewayDef.blurb}
              {shovelDef && ` ${shovelDef.blurb}`}
            </p>
            {totalSelected > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Covers {matchedBenefitCount} of {totalSelected} picks
              </p>
            )}
          </div>
          <Button onClick={reserveThis} size="lg" className="shrink-0">
            Get a free quote
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BenefitColumn<
  T extends { id: string; label: string; hint?: string },
>({
  icon,
  title,
  benefits,
  selected,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  benefits: T[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="mt-3 grid gap-2">
        {benefits.map((b) => {
          const on = selected.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onToggle(b.id)}
              aria-pressed={on}
              className={cn(
                "group/pill text-left rounded-2xl border px-4 py-3 transition-colors",
                on
                  ? "border-primary/60 bg-primary/15"
                  : "border-surface-border bg-surface/50 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid h-5 w-5 place-items-center rounded-md border shrink-0 transition-colors",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-surface-border bg-transparent"
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {b.label}
                  </p>
                  {b.hint && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      {b.hint}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
