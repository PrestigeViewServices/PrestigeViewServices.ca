import type { Metadata } from "next";
import { Check, X, CalendarClock, Sparkles, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { PricingToggle } from "@/components/care-plans/pricing-toggle";
import { BuildYourOwn } from "@/components/care-plans/build-your-own";
import { ServiceCalendar } from "@/components/care-plans/service-calendar";
import { DiscountBadges } from "@/components/care-plans/discount-badges";
import {
  PLAN_PERKS,
  getCarePlan,
  type CarePlanSlug,
} from "@/lib/content/care-plans";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Care Plans & Packages, Exterior Cleaning Memberships",
  description:
    "Put your home's exterior on autopilot. Recurring Care Plans spread house washing, windows, gutters & driveway across the year on one monthly payment, or pay once with a one-off package. Custom-quoted free. Petawawa, Pembroke & the Ottawa Valley.",
  alternates: { canonical: "/care-plans" },
};

// Plans shown in the comparison + calendar sections (Build-Your-Own is
// excluded, it has its own calculator).
const COMPARE_SLUGS: CarePlanSlug[] = [
  "house-gutter",
  "house-view",
  "clear-view",
  "crystal-clear",
  "total-exterior",
];

// Comparison matrix. Each row maps a feature to a per-plan value:
//   true → included · false → not included · string → a quantity/note.
// Record requires every CarePlanSlug, so build-your-own is included even though
// it's excluded from COMPARE_SLUGS (it has its own calculator).
type Row = { label: string; values: Record<CarePlanSlug, boolean | string> };
const allTrue = {
  "house-gutter": true,
  "house-view": true,
  "clear-view": true,
  "crystal-clear": true,
  "total-exterior": true,
  "build-your-own": true,
} as const;
const COMPARE_ROWS: Row[] = [
  {
    label: "House soft-wash",
    values: {
      "house-gutter": "1×",
      "house-view": "1×",
      "clear-view": false,
      "crystal-clear": false,
      "total-exterior": "1×",
      "build-your-own": false,
    },
  },
  {
    label: "Exterior windows",
    values: {
      "house-gutter": false,
      "house-view": "2×",
      "clear-view": "2×",
      "crystal-clear": "2×",
      "total-exterior": "2×",
      "build-your-own": false,
    },
  },
  {
    label: "Interior windows",
    values: {
      "house-gutter": false,
      "house-view": false,
      "clear-view": false,
      "crystal-clear": "2×",
      "total-exterior": false,
      "build-your-own": false,
    },
  },
  {
    label: "Screens & tracks",
    values: {
      "house-gutter": false,
      "house-view": false,
      "clear-view": false,
      "crystal-clear": true,
      "total-exterior": false,
      "build-your-own": false,
    },
  },
  {
    label: "Gutter clean",
    values: {
      "house-gutter": "2×",
      "house-view": false,
      "clear-view": false,
      "crystal-clear": false,
      "total-exterior": "2×",
      "build-your-own": false,
    },
  },
  {
    label: "Driveway wash",
    values: {
      "house-gutter": false,
      "house-view": false,
      "clear-view": false,
      "crystal-clear": false,
      "total-exterior": "1×",
      "build-your-own": false,
    },
  },
  { label: "We schedule & call you", values: { ...allTrue } },
  { label: "Priority booking", values: { ...allTrue } },
  { label: "10% off extra services", values: { ...allTrue } },
  { label: "Locked-in pricing", values: { ...allTrue } },
];

export default function CarePlansPage() {
  const calendarPlans = COMPARE_SLUGS.map((s) => getCarePlan(s)!).filter(Boolean);

  return (
    <>
      {/* ── Hero ── */}
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Memberships · Care Plans"
          title="Put your home's exterior on autopilot"
          description={`Bundle house washing, windows, gutters and driveway into one monthly payment, spread across the season so it's always handled. Prefer a one-time refresh? Flip to Pay Once. Serving ${siteConfig.serviceArea}.`}
        />
      </section>

      {/* ── Toggle + plan/package cards (the "Packages & Pricing" section) ── */}
      <section className="container-max py-10" id="pricing">
        <PricingToggle />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No payment is collected online today, every plan starts with a free
          quote. {/* 💳 BILLING PLACEHOLDER: Stripe/Square subscription checkout wires in here. */}
        </p>
      </section>

      {/* ── Every plan includes ── */}
      <section className="container-max py-10">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Every Care Plan includes</h2>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  strokeWidth={3}
                />
                <span className="text-foreground/90">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Build-Your-Own calculator (centerpiece) ── */}
      <section
        className="container-max scroll-mt-24 py-12"
        id="build-your-own"
      >
        <SectionHeading
          eyebrow="Build-Your-Own"
          title="Mix your own plan, exactly what you need"
          description="Pick your services and we'll bundle them into one monthly payment, the more you bundle, the bigger the discount on your quote."
        />
        <div className="mx-auto mt-10 max-w-4xl">
          <BuildYourOwn />
        </div>
      </section>

      {/* ── Service calendar timelines ── */}
      <section className="container-max py-12">
        <SectionHeading
          eyebrow="Your year, planned"
          title="How a plan spreads across the season"
          description="We map every visit to the right month so your home stays sharp spring through fall, without you tracking a thing."
        />
        <div className="mt-10 space-y-10">
          {calendarPlans.map((plan) => (
            <Reveal key={plan.slug}>
              <div className="surface-card p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>
                <ServiceCalendar stops={plan.calendar} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="container-max py-12">
        <SectionHeading
          eyebrow="Side by side"
          title="Compare the plans"
          description="The quick version, what each recurring plan covers."
        />
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background py-4 pr-4 text-left font-semibold">
                  <span className="sr-only">Feature</span>
                </th>
                {COMPARE_SLUGS.map((slug) => {
                  const plan = getCarePlan(slug)!;
                  return (
                    <th
                      key={slug}
                      className={`px-4 py-4 text-center align-bottom ${
                        plan.mostPopular ? "rounded-t-2xl bg-primary/10" : ""
                      }`}
                    >
                      <span className="block text-base font-bold">
                        {plan.name}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Billed monthly
                      </span>
                      <span className="block text-sm font-bold text-primary">
                        Custom quote
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-t border-surface-border">
                  <td className="sticky left-0 bg-background py-3 pr-4 font-medium text-foreground/90">
                    {row.label}
                  </td>
                  {COMPARE_SLUGS.map((slug) => {
                    const v = row.values[slug];
                    const popular = getCarePlan(slug)!.mostPopular;
                    return (
                      <td
                        key={slug}
                        className={`px-4 py-3 text-center ${
                          popular ? "bg-primary/5" : ""
                        }`}
                      >
                        {v === true ? (
                          <Check
                            className="mx-auto h-4 w-4 text-primary"
                            strokeWidth={3}
                            aria-label="Included"
                          />
                        ) : v === false ? (
                          <X
                            className="mx-auto h-4 w-4 text-muted-foreground/40"
                            aria-label="Not included"
                          />
                        ) : (
                          <span className="font-semibold">{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Discount badges ── */}
      <section className="container-max py-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ways to save</h2>
        </div>
        <DiscountBadges className="mt-5" />
      </section>

      <CtaBand
        eyebrow="No pressure, no obligation"
        title="Ready to put it on autopilot?"
        description="Tell us about your home and we'll recommend the right plan, free, within one business day."
        primaryLabel="Get a Free Quote"
        primaryHref="/quote?plan=care-plan"
      />
    </>
  );
}
