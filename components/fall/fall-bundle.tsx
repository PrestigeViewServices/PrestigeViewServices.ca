import {
  ArrowDown,
  Leaf,
  Recycle,
  Scissors,
  Sprout,
  Trash2,
  Droplets,
  type LucideIcon,
} from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import { StormNightLazy } from "@/components/winter/storm-night-lazy";
import { BundleIncentiveBand } from "@/components/fall/bundle-incentive";

/**
 * The fall cleanup page's bundle treatment: process visual, the compact
 * Storm Night preview, and a native quote form with the snow bundle toggle
 * pre-selected. The pitch is one step: book the cleanup, lock the winter
 * route spot.
 */

type ProcessStep = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const PROCESS: ProcessStep[] = [
  {
    icon: Leaf,
    title: "Leaf removal",
    body: "Every leaf and branch off the lawn, out of the beds, and away from the foundation.",
  },
  {
    icon: Scissors,
    title: "Final mow",
    body: "The lawn cut down to winter height so it comes out of the snow healthy, not matted.",
  },
  {
    icon: Droplets,
    title: "Gutter add-on",
    body: "Gutters cleared and downspouts flushed while the crew is already on site.",
  },
  {
    icon: Sprout,
    title: "Bed cleanup",
    body: "Perennials cut back and beds tidied so spring starts clean.",
  },
  {
    icon: Trash2,
    title: "Haul away",
    body: "Everything loaded and gone the same day. No curb piles, no burn pile.",
  },
];

export function FallBundle() {
  return (
    <>
      {/* ── Bundle pitch ── */}
      <section className="container-max pt-10">
        <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#1A1408] via-[#12100A] to-[#0C1B2E] p-6 sm:p-9">
          <div className="max-w-3xl">
            <p className="eyebrow text-amber-300">
              <Recycle className="h-3.5 w-3.5" aria-hidden />
              One visit, two seasons
            </p>
            <h2 className="heading-section mt-3 text-balance">
              Book fall cleanup and lock your winter spot in one step
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The same crew that closes out your yard runs the snow routes.
              Tick one box on the quote form below and we price your cleanup
              and your Winter 2026-27 snow contract together, before the
              routes fill.
            </p>
          </div>

          <BundleIncentiveBand />

          {/* ── Process visual ── */}
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
                    <step.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-sky-200">
            <ArrowDown className="h-4 w-4" aria-hidden />
            Then winter starts, and this happens automatically:
          </p>
        </div>
      </section>

      {/* ── Compact Storm Night ── */}
      <section className="container-max pt-6">
        <StormNightLazy
          compact
          ctaHref="#quote-form"
          ctaLabel="Bundle my cleanup + snow"
          source="fall-cleanup-storm-night"
        />
      </section>

      {/* ── Native bundle quote form ── */}
      <section className="container-max pt-10">
        <div className="mx-auto max-w-2xl">
          <LeadForm
            service="fall-cleanup"
            sourcePage="fall-cleanup-page"
            snowBundle
            snowBundleDefault
          />
        </div>
      </section>
    </>
  );
}
